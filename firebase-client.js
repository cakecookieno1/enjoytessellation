const FALLBACK_SDK_VERSION = "10.12.5";
const EMAIL_DOMAIN = "tessellation.local";

let state = {
  available: false,
  auth: null,
  db: null,
  firebase: null,
  reason: "Firebase config is not loaded.",
};

function slug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function base64Url(value) {
  const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) => (
    String.fromCharCode(Number.parseInt(hex, 16))
  ));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, 12);
}

function normalizeClassCode(classCode, fallback = "class-1") {
  return String(classCode || fallback).trim().replace(/\s+/g, "-").toLowerCase().slice(0, 24);
}

function classIdFor(classCode) {
  return `class_${slug(classCode) || "class-1"}`;
}

function emailFor(classCode, name) {
  return `u-${base64Url(`${normalizeClassCode(classCode)}:${normalizeName(name)}`).slice(0, 48)}@${EMAIL_DOMAIN}`;
}

function timestampToIso(value) {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
}

function postFromDoc(snapshot) {
  const data = snapshot.data();
  const design = data.designData || {};
  return {
    id: snapshot.id,
    author: data.ownerName || "friend",
    ownerUid: data.ownerUid || "",
    createdAt: timestampToIso(data.createdAt),
    mode: data.mode || design.mode || "free",
    templateId: data.templateId || design.templateId || "t31212",
    objectId: data.objectId || design.objectId || "clock",
    objectScale: Number(data.objectScale || design.objectScale || 1.15),
    tileCount: Number(data.tileCount || design.tiles?.length || 0),
    tiles: Array.isArray(design.tiles) ? design.tiles : [],
    thumbnailWebp: data.thumbnailWebp || "",
  };
}

async function initFirebase() {
  try {
    const configModule = await import("./cloud-config.js?v=20260620");
    const configured = typeof configModule.isFirebaseConfigured === "function"
      ? configModule.isFirebaseConfigured()
      : Boolean(configModule.firebaseConfig?.apiKey);

    if (!configured) {
      state.reason = "Firebase config values are empty.";
      return state;
    }

    const sdkVersion = configModule.firebaseSdkVersion || FALLBACK_SDK_VERSION;
    const [
      appModule,
      authModule,
      firestoreModule,
    ] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${sdkVersion}/firebase-firestore.js`),
    ]);

    const app = appModule.getApps().length
      ? appModule.getApps()[0]
      : appModule.initializeApp(configModule.firebaseConfig);

    state = {
      available: true,
      auth: authModule.getAuth(app),
      db: firestoreModule.getFirestore(app),
      classCode: normalizeClassCode(configModule.firebaseClassCode),
      firebase: {
        ...authModule,
        ...firestoreModule,
      },
      reason: "",
    };
  } catch (error) {
    state.reason = error?.message || "Firebase init failed.";
    console.warn("Firebase is not active:", state.reason);
  }

  return state;
}

const readyPromise = initFirebase().then((nextState) => {
  window.dispatchEvent(new CustomEvent("tessellation-cloud-ready", {
    detail: { available: nextState.available, reason: nextState.reason },
  }));
  return nextState;
});

async function getReadyState() {
  return readyPromise;
}

async function requireFirebase() {
  const ready = await getReadyState();
  if (!ready.available) throw new Error(ready.reason || "Firebase is not configured.");
  return ready;
}

async function signInWithName({ name, password, classCode }) {
  const ready = await requireFirebase();
  const firebase = ready.firebase;
  const displayName = normalizeName(name);
  const normalizedClassCode = normalizeClassCode(classCode, ready.classCode);
  const email = emailFor(normalizedClassCode, displayName);

  let credential;
  try {
    credential = await firebase.signInWithEmailAndPassword(ready.auth, email, password);
  } catch (error) {
    if (error?.code !== "auth/user-not-found" && error?.code !== "auth/invalid-credential") {
      throw new Error(error?.code === "auth/wrong-password" ? "비밀번호가 맞지 않습니다." : "입장하지 못했습니다.");
    }
    try {
      credential = await firebase.createUserWithEmailAndPassword(ready.auth, email, password);
      await firebase.updateProfile(credential.user, { displayName });
    } catch (createError) {
      throw new Error(createError?.code === "auth/email-already-in-use" ? "비밀번호가 맞지 않습니다." : "계정을 만들지 못했습니다.");
    }
  }

  const user = credential.user;
  const classId = classIdFor(normalizedClassCode);
  const now = firebase.serverTimestamp();

  await Promise.all([
    firebase.setDoc(firebase.doc(ready.db, "users", user.uid), {
      displayName,
      classIds: [classId],
      lastLoginAt: now,
    }, { merge: true }),
    firebase.setDoc(firebase.doc(ready.db, "classes", classId), {
      name: normalizedClassCode,
      joinCode: normalizedClassCode,
      joinCodeLower: normalizedClassCode,
      ownerUid: null,
      createdAt: now,
      archived: false,
    }, { merge: true }),
    firebase.setDoc(firebase.doc(ready.db, "classes", classId, "members", user.uid), {
      displayName,
      role: "student",
      joinedAt: now,
    }, { merge: true }),
  ]);

  return {
    name: displayName,
    classCode: normalizedClassCode,
    classId,
    provider: "firebase",
    uid: user.uid,
  };
}

async function signOutUser() {
  const ready = await getReadyState();
  if (ready.available) await ready.firebase.signOut(ready.auth);
}

async function listPosts(user) {
  const ready = await requireFirebase();
  const classId = user?.classId || classIdFor(user?.classCode || ready.classCode);
  const works = ready.firebase.collection(ready.db, "classes", classId, "works");
  const queryRef = ready.firebase.query(works, ready.firebase.orderBy("createdAt", "desc"), ready.firebase.limit(24));
  const snapshot = await ready.firebase.getDocs(queryRef);
  return snapshot.docs.map(postFromDoc);
}

async function savePost(post, user) {
  const ready = await requireFirebase();
  const classId = user?.classId || classIdFor(user?.classCode || ready.classCode);
  const tiles = Array.isArray(post.tiles) ? post.tiles.slice(0, 500) : [];
  const now = ready.firebase.serverTimestamp();
  const work = {
    classCode: user?.classCode || ready.classCode,
    title: `${user?.name || "friend"} tessellation`,
    ownerUid: user?.uid,
    ownerName: user?.name,
    mode: post.mode || "free",
    templateId: post.templateId || null,
    objectId: post.objectId || null,
    objectScale: Number(post.objectScale || 1.15),
    tileCount: tiles.length,
    designData: {
      version: 1,
      mode: post.mode || "free",
      templateId: post.templateId || null,
      objectId: post.objectId || null,
      objectScale: Number(post.objectScale || 1.15),
      tiles,
    },
    thumbnailWebp: post.thumbnailWebp || "",
    createdAt: now,
    updatedAt: now,
  };
  const ref = await ready.firebase.addDoc(ready.firebase.collection(ready.db, "classes", classId, "works"), work);
  return {
    ...post,
    id: ref.id,
    author: user?.name,
    ownerUid: user?.uid,
  };
}

async function deletePost(postId, user) {
  const ready = await requireFirebase();
  const classId = user?.classId || classIdFor(user?.classCode || ready.classCode);
  await ready.firebase.deleteDoc(ready.firebase.doc(ready.db, "classes", classId, "works", postId));
}

window.tessellationCloud = {
  getReadyState,
  isAvailable: async () => (await getReadyState()).available,
  listPosts,
  savePost,
  signIn: signInWithName,
  signOut: signOutUser,
  deletePost,
};
