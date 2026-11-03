// Saves the kitchen to the person's own private storage on claude.ai, so it
// survives closing the page, cleared browser data, and moving between devices.
// Only available when the page is opened on claude.ai; elsewhere the app keeps
// using this browser's storage alone.
//
// One document per person at data/users/<id>/kitchen, readable only by them.

const LOAD_TIMEOUT_MS = 10000;
const SAVE_DELAY_MS = 400;

/**
 * @param {object} hooks
 *   getState()            current state
 *   onRemote(remote, first) a newer saved copy arrived (first = initial load)
 *   onStatus(status)      "connecting" | "saved" | "saving" | "offline" | "local"
 * @returns {Promise<{save(state): void, flush(): void} | null>}
 */
export async function connectCloud({ getState, onRemote, onStatus }) {
  const claude = globalThis.claude;
  if (!claude?.use) return null;

  const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
  const uid = user ? await user.id().catch(() => null) : null;
  if (!db || !uid) {
    onStatus("local");
    return null;
  }

  const ref = db.doc(`data/users/${uid}/kitchen`);
  let loaded = false; // the store has answered definitively
  let disabled = false;
  let pending = null; // state waiting to be written
  let writing = false;
  let timer = null;

  onStatus("connecting");
  const loadTimer = setTimeout(() => !loaded && onStatus("offline"), LOAD_TIMEOUT_MS);

  ref.onSnapshot(
    (snap) => {
      const remote = snap.exists ? snap.data() : null;
      const local = getState();
      const first = !loaded;
      if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
        onRemote(structuredClone(remote), first);
      }
      if (!snap.metadata.fromCache && !loaded) {
        loaded = true;
        clearTimeout(loadTimer);
        // Nothing saved yet (or this device has newer changes): save what we have.
        const now = getState();
        if (!remote || (now.updatedAt || 0) > (remote.updatedAt || 0)) queue(now, 0);
        else onStatus("saved");
      }
    },
    (err) => {
      clearTimeout(loadTimer);
      console.error("Saved kitchen unavailable", err);
      disabled = true;
      onStatus("local");
    }
  );

  async function write() {
    if (writing || !pending || disabled || !loaded) return;
    writing = true;
    const body = pending;
    pending = null;
    onStatus("saving");
    try {
      await ref.set(body);
    } catch (err) {
      if (err?.code === "unavailable") {
        pending ||= body; // retry once after a short pause
        setTimeout(write, 800 + Math.random() * 800);
      } else {
        console.error("Couldn't save kitchen", err);
        if (err?.code === "invalid_argument" || err?.code === "revoked" || err?.code === "not_granted") disabled = true;
        onStatus(disabled ? "local" : "offline");
      }
    } finally {
      writing = false;
    }
    if (pending) write();
    else if (!disabled) onStatus("saved");
  }

  function queue(body, delay = SAVE_DELAY_MS) {
    if (disabled) return;
    pending = body;
    clearTimeout(timer);
    if (loaded) onStatus("saving");
    timer = setTimeout(write, delay);
  }

  return {
    save(body) {
      queue(body);
    },
    // Write right away (page is being hidden or closed).
    flush() {
      if (!pending) return;
      clearTimeout(timer);
      write();
    },
  };
}
