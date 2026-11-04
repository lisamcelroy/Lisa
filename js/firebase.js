// Accounts and online saving for the hosted site, using Firebase (Google).
// On claude.ai none of this loads: the page uses claude.ai's own storage.
//
// It gives cloud.js the same shape claude.ai's storage has (db.doc(path) with
// get, set and onSnapshot, and a user with an id), so saving and sharing work
// the same way in both places.
import { FIREBASE_CONFIG } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
let sdk = null;
let auth = null;
let firestore = null;

/** Accounts are offered on the hosted site once a Firebase project is set up. */
export const accountsAvailable = () => Boolean(FIREBASE_CONFIG?.apiKey) && !globalThis.claude;

async function load() {
  if (sdk) return sdk;
  const [app, authMod, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const firebaseApp = app.initializeApp(FIREBASE_CONFIG);
  auth = authMod.getAuth(firebaseApp);
  // Kitchen data can hold empty fields; keep the local cache so it opens offline.
  firestore = fs.initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true, localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  sdk = { auth: authMod, fs };
  return sdk;
}

/** Start accounts; `onUser(user | null)` runs now and whenever someone signs in or out. */
export async function startAccounts(onUser) {
  const { auth: A } = await load();
  await A.setPersistence(auth, A.browserLocalPersistence).catch(() => {});
  A.getRedirectResult(auth).catch(() => {});
  A.onAuthStateChanged(auth, (u) => onUser(u ? { uid: u.uid, email: u.email || "", name: u.displayName || "" } : null));
}

const friendly = (err) => {
  const code = String(err?.code || "").replace("auth/", "");
  return {
    "invalid-email": "That email address doesn't look right.",
    "missing-password": "Type a password.",
    "weak-password": "Use a password with at least 6 characters.",
    "email-already-in-use": "There's already an account with that email. Try Sign in.",
    "invalid-credential": "That email and password don't match.",
    "wrong-password": "That email and password don't match.",
    "user-not-found": "No account with that email yet. Try Create account.",
    "too-many-requests": "Too many tries. Wait a minute and try again.",
    "network-request-failed": "No connection. Try again when you're online.",
    "popup-closed-by-user": "",
    "cancelled-popup-request": "",
  }[code] ?? "Couldn't sign in just now. Try again.";
};

async function run(fn) {
  try {
    await fn();
    return "";
  } catch (err) {
    console.error(err);
    return friendly(err);
  }
}

export const signInWithGoogle = () => run(async () => {
  const { auth: A } = await load();
  const provider = new A.GoogleAuthProvider();
  try {
    await A.signInWithPopup(auth, provider);
  } catch (err) {
    // Phones and home-screen apps often block pop-ups: go to Google and come back.
    if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(err?.code)) return A.signInWithRedirect(auth, provider);
    throw err;
  }
});
export const signInWithEmail = (email, password) => run(async () => { const { auth: A } = await load(); await A.signInWithEmailAndPassword(auth, email.trim(), password); });
export const createAccount = (email, password) => run(async () => { const { auth: A } = await load(); await A.createUserWithEmailAndPassword(auth, email.trim(), password); });
export const resetPassword = (email) => run(async () => { const { auth: A } = await load(); await A.sendPasswordResetEmail(auth, email.trim()); });
export const signOut = () => run(async () => { const { auth: A } = await load(); await A.signOut(auth); });

const dbError = (err) => ({
  code: { "permission-denied": "invalid_argument", unauthenticated: "revoked", "not-found": "invalid_argument", unavailable: "unavailable", "resource-exhausted": "resource_exhausted" }[err?.code] || "unavailable",
  message: err?.message || "",
});

/** The storage and user cloud.js expects, for a signed-in person. */
export function backendFor(person) {
  const { fs } = sdk;
  const snap = (s) => ({ exists: s.exists(), data: () => s.data(), metadata: { fromCache: s.metadata.fromCache, hasPendingWrites: s.metadata.hasPendingWrites } });
  const shared = (path) => path.startsWith("households/");
  const db = {
    doc(path) {
      const ref = fs.doc(firestore, path);
      return {
        path,
        get: async () => snap(await fs.getDoc(ref)),
        // Shared kitchens keep their member list, so merge instead of replacing.
        set: (data) => (shared(path) ? fs.setDoc(ref, data, { merge: true }) : fs.setDoc(ref, data)).catch((e) => { throw dbError(e); }),
        onSnapshot: (next, error) => fs.onSnapshot(ref, { includeMetadataChanges: true }, (s) => next(snap(s)), (e) => error?.(dbError(e))),
      };
    },
    /** A new shared kitchen, with its creator as the first member. */
    async createHousehold(id, body, uid) {
      await fs.setDoc(fs.doc(firestore, `households/${id}`), { ...body, members: [uid] }).catch((e) => { throw dbError(e); });
    },
    /** Join with a code: add yourself to the members, then read it. Null if there's no such kitchen. */
    async joinHousehold(id, uid) {
      const ref = fs.doc(firestore, `households/${id}`);
      try {
        await fs.updateDoc(ref, { members: fs.arrayUnion(uid) });
        const s = await fs.getDoc(ref);
        return s.exists() ? s.data() : null;
      } catch (e) {
        console.error(e);
        return null;
      }
    },
  };
  const user = { id: async () => person.uid, can: async () => true };
  return { db, user };
}
