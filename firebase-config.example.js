export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_FIREBASE_APP_ID",
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
