import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc as realDoc, getDocFromServer as realGetDocFromServer } from "firebase/firestore";
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
export const signInWithEmailAndPassword = async (...args: any[]) => {
  if (useMock) return auth.signInWithEmailAndPassword(...args);
  const { signInWithEmailAndPassword: realSignIn } = await import("firebase/auth");
  return (realSignIn as any)(...args);
};

export const createUserWithEmailAndPassword = async (...args: any[]) => {
  if (useMock) return auth.createUserWithEmailAndPassword(...args);
  const { createUserWithEmailAndPassword: realCreate } = await import("firebase/auth");
  return (realCreate as any)(...args);
};

export const signInAnonymously = async (...args: any[]) => {
  if (useMock) return { user: { uid: 'anon-' + Date.now(), isAnonymous: true } };
  const { signInAnonymously: realAnon } = await import("firebase/auth");
  return (realAnon as any)(...args);
};

export const signOut = async (...args: any[]) => {
  if (useMock) return auth.signOut();
  const { signOut: realSignOut } = await import("firebase/auth");
  return (realSignOut as any)(...args);
};

export const onAuthStateChanged = (...args: any[]) => {
  if (useMock) return auth.onAuthStateChanged(args[1]);
  return () => {}; 
};

export const GoogleAuthProvider = class {
  static setCustomParameters(...args: any[]) {}
  setCustomParameters(...args: any[]) {}
};

export const signInWithPopup = async (...args: any[]) => {
  if (useMock) {
    alert("Google Login is simulated in this environment.");
    return { user: { uid: 'google-user', email: 'tranlichsu@gmail.com' } };
  }
};

export const sendPasswordResetEmail = async (...args: any[]) => {
  if (useMock) alert("Password reset link (simulated) sent!");
};

export const updatePassword = async (...args: any[]) => {
  if (useMock) alert("Password updated (simulated)!");
};

// Firestore named exports
export const getDocs = async (...args: any[]) => {
  if (useMock) return { docs: [] };
};

const mockGetDoc = async (...args: any[]) => {
  if (useMock) {
    const docRef = args[0];
    const dbData = getMockData();
    const parts = docRef.path.split('/');
    const collName = parts[0];
    const docId = parts[1];
    
    const collection = dbData[collName] || [];
    const found = collection.find((d: any) => d.id === docId);
    
    return { 
      exists: () => !!found, 
      data: () => found || {} 
    };
  }
  return null; // Should not happen if useMock is false
};

export const getDoc = mockGetDoc;
export const getDocFromServer = async (...args: any[]) => {
  if (useMock) return mockGetDoc(...args);
  const { getDocFromServer: realGetDocFromServer } = await import("firebase/firestore");
  return (realGetDocFromServer as any)(...args);
};

export const setDoc = async (...args: any[]) => {
  if (useMock) {
    console.log("Mock Save:", args[0].path, args[1]);
    return;
  }
};

export const doc = (...args: any[]) => {
  if (useMock) {
    const fullPath = args.slice(1).join('/');
    return { id: fullPath.split('/').pop(), path: fullPath };
  }
  return (realDoc as any)(...args);
};

export const collection = (...args: any[]) => ({ path: args[args.length - 1] });
export const deleteDoc = async (...args: any[]) => {};
export const query = (...args: any[]) => ({});
export const where = (...args: any[]) => ({});
export const updateDoc = async (...args: any[]) => {};

export { auth, db, storage };
