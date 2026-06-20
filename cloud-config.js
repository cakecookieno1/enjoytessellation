export const firebaseConfig = {
  apiKey: "AIzaSyAEy2WfY7y5GRcs74RKffWfNt50QwotRdI",
  authDomain: "enjoytessellation.firebaseapp.com",
  projectId: "enjoytessellation",
  storageBucket: "enjoytessellation.firebasestorage.app",
  messagingSenderId: "209276410673",
  appId: "1:209276410673:web:b967b55326573fcdd4ae10",
  measurementId: "G-V37J3YPVXM",
};

export const firebaseClassCode = "class-1";
export const firebaseSdkVersion = "10.12.5";

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey
      && firebaseConfig.authDomain
      && firebaseConfig.projectId
      && firebaseConfig.appId,
  );
}

export default {
  firebaseClassCode,
  firebaseConfig,
  firebaseSdkVersion,
  isFirebaseConfigured,
};
