import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Default placeholder config
const placeholderConfig = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

let app;
let auth: any;
let db: any;
let storage: any;

// Function to try getting config
const getFirebaseConfig = () => {
  try {
    // In this environment, the tool creates firebase-applet-config.json
    // We try to use it if it exists.
    // Note: Since we can't reliably use top-level await in all envs without config,
    // we use a try-catch for the require/import logic if possible, or just expect it to be there.
    // For now, let's use a hardcoded check or a safer way.
    return null; // The tool is currently failing, so we default to null
  } catch (e) {
    return null;
  }
};

const config = getFirebaseConfig() || placeholderConfig;

if (!getApps().length) {
  app = initializeApp(config);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

if (config.apiKey === "PLACEHOLDER") {
  console.warn("Firebase is using placeholder configuration. Please set up Firebase in the AI Studio settings.");
}

export { auth, db, storage, getDocFromServer, doc };
