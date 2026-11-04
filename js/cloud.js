// Saves the kitchen on claude.ai, so it survives closing the page, cleared
// browser data, and moving between devices. Only available when the page is
// opened on claude.ai; elsewhere the app keeps using this browser's storage alone.
//
// Two documents:
//   data/users/<id>/kitchen   private to each person: their own settings (name,
//                             meal times...) and, when not sharing, their kitchen.
//   households/<code>         a shared kitchen (fridge, plan, shopping, family...)
//                             that everyone who joined with the code reads and
//                             writes. People need edit access to the app to write.

const LOAD_TIMEOUT_MS = 10000;
const SAVE_DELAY_MS = 400;

/** Keep one document in step with the app: load it, watch it, save changes. */
function channel(ref, { getBody, onRemote, onStatus }) {
  let loaded = false;
  let disabled = false;
  let pending = null;
  let writing = false;
  let timer = null;
  let stopped = false;

  onStatus("connecting");
  const loadTimer = setTimeout(() => !loaded && !stopped && onStatus("offline"), LOAD_TIMEOUT_MS);

  const unsubscribe = ref.onSnapshot(
    (snap) => {
      if (stopped) return;
      const remote = snap.exists ? snap.data() : null;
      const local = getBody();
      const first = !loaded;
      if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) onRemote(structuredClone(remote), first);
      if (!snap.metadata.fromCache && !loaded) {
        loaded = true;
        clearTimeout(loadTimer);
        const now = getBody();
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
    if (writing || !pending || disabled || !loaded || stopped) return;
    writing = true;
    const body = pending;
    pending = null;
    onStatus("saving");
    try {
      await ref.set(body);
    } catch (err) {
      if (err?.code === "unavailable") {
        pending ||= body;
        setTimeout(write, 800 + Math.random() * 800);
      } else {
        console.error("Couldn't save kitchen", err);
        if (["invalid_argument", "revoked", "not_granted"].includes(err?.code)) disabled = true;
        onStatus(disabled ? "readonly" : "offline");
      }
    } finally {
      writing = false;
    }
    if (pending) write();
    else if (!disabled) onStatus("saved");
  }

  function queue(body, delay = SAVE_DELAY_MS) {
    if (disabled || stopped) return;
    pending = body;
    clearTimeout(timer);
    if (loaded) onStatus("saving");
    timer = setTimeout(write, delay);
  }

  return {
    save: (body) => queue(body),
    flush() {
      if (!pending) return;
      clearTimeout(timer);
      write();
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(loadTimer);
      unsubscribe?.();
    },
  };
}

/**
 * @param {object} hooks
 *   getPersonal()               body for the private document
 *   onPersonal(remote, first)   a newer private copy arrived
 *   getShared()                 body for the shared kitchen
 *   onShared(remote, first)     a newer shared copy arrived
 *   onStatus(status)            "connecting" | "saved" | "saving" | "offline" | "local" | "readonly"
 *   householdId                 shared kitchen to open straight away, if any
 */
export async function connectCloud({ getPersonal, onPersonal, getShared, onShared, onStatus, householdId }) {
  const claude = globalThis.claude;
  if (!claude?.use) return null;

  const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
  const uid = user ? await user.id().catch(() => null) : null;
  if (!db || !uid) {
    onStatus("local");
    return null;
  }

  const personal = channel(db.doc(`data/users/${uid}/kitchen`), { getBody: getPersonal, onRemote: onPersonal, onStatus });
  let shared = null;
  let sharedId = null;
  const householdRef = (id) => db.doc(`households/${id}`);

  const api = {
    save() {
      personal.save(getPersonal());
      shared?.save(getShared());
    },
    flush() {
      personal.flush();
      shared?.flush();
    },
    /** Start (or switch) syncing a shared kitchen. */
    openHousehold(id) {
      if (sharedId === id) return;
      shared?.stop();
      sharedId = id;
      shared = id ? channel(householdRef(id), { getBody: getShared, onRemote: onShared, onStatus }) : null;
    },
    closeHousehold() {
      api.openHousehold(null);
    },
    /** The shared kitchen with this code, or null if there isn't one (or this person can't see it). */
    async readHousehold(id) {
      const snap = await householdRef(id).get();
      return snap.exists ? snap.data() : null;
    },
    async createHousehold(id, body) {
      await householdRef(id).set(body);
    },
    /** May this person write shared data? true, false, or null (not told). */
    async canWrite() {
      try {
        return user?.can ? await user.can("data.write") : null;
      } catch {
        return null;
      }
    },
  };
  if (householdId) api.openHousehold(householdId);
  return api;
}
