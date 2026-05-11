import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// --- MOCK IMPLEMENTATION ---
// This enables registration and login even without a valid Firebase project
const MOCK_STORAGE_KEY = 'edupro_mock_db';
const MOCK_USER_KEY = 'edupro_mock_user';

const getMockData = () => JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
const setMockData = (data: any) => localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));

const mockAuth: any = {
  currentUser: JSON.parse(localStorage.getItem(MOCK_USER_KEY) || 'null'),
  onAuthStateChanged: (callback: (user: any) => void) => {
    const check = () => {
      const user = JSON.parse(localStorage.getItem(MOCK_USER_KEY) || 'null');
      callback(user);
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  },
  signOut: async () => {
    localStorage.removeItem(MOCK_USER_KEY);
    window.dispatchEvent(new Event('storage'));
  },
  createUserWithEmailAndPassword: async (auth: any, email: string) => {
    const user = { uid: Math.random().toString(36).substr(2, 9), email };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return { user };
  },
  signInWithEmailAndPassword: async (auth: any, email: string) => {
    // In mock mode, we just accept any valid-looking email/pass
    const user = { uid: 'mock-uid-' + email.split('@')[0], email };
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return { user };
  },
  // Add more mock methods if needed for Login.tsx
};

const mockDb: any = {
  collection: (path: string) => ({
    path,
    add: async (data: any) => {
      const db = getMockData();
      if (!db[path]) db[path] = [];
      const newDoc = { id: Math.random().toString(36).substr(2, 9), ...data };
      db[path].push(newDoc);
      setMockData(db);
      return newDoc;
    }
  }),
  doc: (path: string, ...segments: string[]) => {
    const fullPath = segments.length ? `${path}/${segments.join('/')}` : path;
    return { id: fullPath.split('/').pop(), path: fullPath };
  }
};

// --- REAL FIREBASE INITIALIZATION ---
let app: any;
let auth: any;
let db: any;
let storage: any;

const useMock = true; // Still using mock for stability

if (useMock) {
  auth = mockAuth;
  db = mockDb;
  storage = {};
  console.log("Using Local Mock for Auth & Database (Infrastructure Setup Pending)");
} else {
  // Real implementation (placeholder)
  const placeholderConfig = {
    apiKey: "AIzaSy_MOCK_VAL",
    authDomain: "edupro.firebaseapp.com",
    projectId: "edupro",
    storageBucket: "edupro.appspot.com",
    messagingSenderId: "123",
    appId: "1:123:web:abc"
  };
  if (!getApps().length) app = initializeApp(placeholderConfig);
  else app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Named exports for both real and mock environments
export const signInWithEmailAndPassword = async (a: any, e: string, p: string) => {
  if (useMock) return auth.signInWithEmailAndPassword(a, e, p);
  const { signInWithEmailAndPassword: realSignIn } = await import("firebase/auth");
  return realSignIn(a, e, p);
};

export const createUserWithEmailAndPassword = async (a: any, e: string, p: string) => {
  if (useMock) return auth.createUserWithEmailAndPassword(a, e, p);
  const { createUserWithEmailAndPassword: realCreate } = await import("firebase/auth");
  return realCreate(a, e, p);
};

export const signInAnonymously = async (a: any) => {
  if (useMock) return { user: { uid: 'anon-' + Date.now(), isAnonymous: true } };
  const { signInAnonymously: realAnon } = await import("firebase/auth");
  return realAnon(a);
};

export const signOut = async (a: any) => {
  if (useMock) return auth.signOut();
  const { signOut: realSignOut } = await import("firebase/auth");
  return realSignOut(a);
};

export const onAuthStateChanged = (a: any, callback: any) => {
  if (useMock) return auth.onAuthStateChanged(callback);
  // Note: For real onAuthStateChanged, we'd need to handle imports carefully if we want it lazy
  // For now, let's keep it simple.
  return () => {}; 
};

export const GoogleAuthProvider = class {
  static setCustomParameters() {}
};

export const signInWithPopup = async () => {
  if (useMock) {
    alert("Google Login is simulated in this environment.");
    return { user: { uid: 'google-user', email: 'tranlichsu@gmail.com' } };
  }
};

export const sendPasswordResetEmail = async () => {
  if (useMock) alert("Password reset link (simulated) sent!");
};

export const updatePassword = async () => {
  if (useMock) alert("Password updated (simulated)!");
};

// Firestore named exports
export const getDocs = async (coll: any) => {
  if (useMock) return { docs: [] };
};
export const getDoc = async (d: any) => {
  if (useMock) return { exists: () => false, data: () => ({}) };
};
export const setDoc = async (d: any, data: any) => {
  if (useMock) {
    console.log("Mock Save:", d.path, data);
    return;
  }
};
export const collection = (d: any, path: string) => ({ path });
export const deleteDoc = async () => {};

export { auth, db, storage, getDocFromServer, doc };
