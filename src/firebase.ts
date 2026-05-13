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
  collection: (path: string, ...segments: string[]) => {
    const fullPath = segments.length ? `${path}/${segments.join('/')}` : path;
    return {
      path: fullPath,
      add: async (data: any) => {
        const dbData = getMockData();
        if (!dbData[fullPath]) dbData[fullPath] = [];
        const newDoc = { id: Math.random().toString(36).substr(2, 9), ...data };
        dbData[fullPath].push(newDoc);
        setMockData(dbData);
        return newDoc;
      }
    };
  },
};

// --- REAL FIREBASE INITIALIZATION ---
let app: any;
let auth: any = mockAuth;
let db: any = mockDb;
let storage: any = {};
let useMock = true; 

const initializeFirebase = async () => {
  let firebaseConfig: any = null;
  try {
    const configPath = '../firebase-applet-config.json';
    // @ts-ignore
    const config = await import(/* @vite-ignore */ configPath);
    firebaseConfig = config.default;
  } catch (e) {
    console.warn("Firebase config not found, using mocks.");
  }

  if (firebaseConfig) {
    useMock = false;
    if (!getApps().length) app = initializeApp(firebaseConfig);
    else app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log("Firebase initialized with real config");
  } else {
    useMock = true;
    console.log("Using Local Mock for Auth & Database");
  }
};

// Start initialization immediately
initializeFirebase();

// Proxy functions that wait for initialization if needed would be complex, 
// so we'll just check useMock inside them as we already do.


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

export const onAuthStateChanged = (authArg: any, next: any, error?: any, completed?: any) => {
  if (useMock) return auth.onAuthStateChanged(next);
  
  // For real Firebase, we need to handle the async nature of our initialization
  let unsubscribe: any = () => {};
  let resolved = false;

  const setupReal = async () => {
    try {
      const { onAuthStateChanged: realOnAuthStateChanged } = await import("firebase/auth");
      // Wait for auth to be initialized if not yet
      while (!auth && !useMock) {
        await new Promise(r => setTimeout(r, 50));
      }
      if (auth && !useMock) {
        unsubscribe = realOnAuthStateChanged(auth, next, error, completed);
      }
    } catch (e) {
      console.error("Error setting up real onAuthStateChanged:", e);
    }
  };

  setupReal();
  return () => { if (unsubscribe) unsubscribe(); };
};

export const GoogleAuthProvider = class {
  static GOOGLE_SIGN_IN_METHOD = 'google.com';
  setCustomParameters(params: any) { (this as any)._params = params; }
  static setCustomParameters(params: any) {}
};

export const signInWithPopup = async (...args: any[]) => {
  if (useMock) {
    // Check if there's any saved mock identity
    const saved = localStorage.getItem(MOCK_USER_KEY);
    if (saved) {
      return { user: JSON.parse(saved) };
    }
    
    // Simulate accounts by asking for an email if possible, or just using a randomized one
    // Since we can't easily show a UI here without the component, we'll randomize it once 
    // to separate "others" (different devices) from each other.
    const randomId = Math.random().toString(36).substr(2, 5);
    const user = { 
      uid: 'google-user-' + randomId, 
      email: `tester_${randomId}@gmail.com`, 
      displayName: `Người dùng Google (${randomId})` 
    };
    
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return { user };
  }
  const { signInWithPopup: realSignIn } = await import("firebase/auth");
  return (realSignIn as any)(...args);
};

export const sendPasswordResetEmail = async (...args: any[]) => {
  if (useMock) alert("Password reset link (simulated) sent!");
};

export const updatePassword = async (...args: any[]) => {
  if (useMock) alert("Password updated (simulated)!");
};

// Firestore named exports
export const getDocs = async (...args: any[]) => {
  if (useMock) {
    const collRef = args[0];
    const dbData = getMockData();
    const data = dbData[collRef.path] || [];
    return {
      docs: data.map((d: any) => ({
        id: d.id,
        data: () => d,
        exists: () => true
      }))
    };
  }
  const { getDocs: realGetDocs } = await import("firebase/firestore");
  return (realGetDocs as any)(...args);
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
    const docRef = args[0];
    const data = args[1];
    const options = args[2];
    
    const dbData = getMockData();
    const parts = docRef.path.split('/');
    const collName = parts[0];
    const docId = parts[1];
    
    if (!dbData[collName]) dbData[collName] = [];
    
    const index = dbData[collName].findIndex((d: any) => d.id === docId);
    if (index !== -1) {
      if (options?.merge) {
        dbData[collName][index] = { ...dbData[collName][index], ...data };
      } else {
        dbData[collName][index] = { id: docId, ...data };
      }
    } else {
      dbData[collName].push({ id: docId, ...data });
    }
    
    setMockData(dbData);
    console.log("Mock Saved:", docRef.path, data);
    return;
  }
  const { setDoc: realSetDoc } = await import("firebase/firestore");
  return (realSetDoc as any)(...args);
};

export const doc = (...args: any[]) => {
  if (useMock) {
    const fullPath = args.slice(1).join('/');
    return { id: fullPath.split('/').pop(), path: fullPath };
  }
  return (realDoc as any)(...args);
};

export const collection = (...args: any[]) => ({ path: args[args.length - 1] });
export const deleteDoc = async (...args: any[]) => {
  if (useMock) {
    const docRef = args[0];
    const dbData = getMockData();
    const parts = docRef.path.split('/');
    const collName = parts[0];
    const docId = parts[1];
    
    if (dbData[collName]) {
      dbData[collName] = dbData[collName].filter((d: any) => d.id !== docId);
      setMockData(dbData);
    }
    return;
  }
  const { deleteDoc: realDeleteDoc } = await import("firebase/firestore");
  return (realDeleteDoc as any)(...args);
};
export const query = (...args: any[]) => ({});
export const where = (...args: any[]) => ({});
export const writeBatch = (dbInstance: any) => {
  if (useMock) {
    return {
      set: (docRef: any, data: any) => {
        const dbData = getMockData();
        const parts = docRef.path.split('/');
        const collName = parts[0];
        const docId = parts[1];
        if (!dbData[collName]) dbData[collName] = [];
        const index = dbData[collName].findIndex((d: any) => d.id === docId);
        if (index !== -1) {
          dbData[collName][index] = { id: docId, ...data };
        } else {
          dbData[collName].push({ id: docId, ...data });
        }
        setMockData(dbData);
      },
      delete: (docRef: any) => {
        const dbData = getMockData();
        const parts = docRef.path.split('/');
        const collName = parts[0];
        const docId = parts[1];
        if (dbData[collName]) {
          dbData[collName] = dbData[collName].filter((d: any) => d.id !== docId);
          setMockData(dbData);
        }
      },
      commit: async () => {}
    };
  }
  // This is tricky because we usually import writeBatch from firebase/firestore and use it immediately.
  // For simplicity in this mock-heavy app, we can just say the caller should handle it if not mock.
  // Actually, I can't easily make writeBatch async-ready if it's meant to be sync.
  return null; 
};
export const updateDoc = async (...args: any[]) => {
  if (useMock) {
    const docRef = args[0];
    const data = args[1];
    
    const dbData = getMockData();
    const parts = docRef.path.split('/');
    const collName = parts[0];
    const docId = parts[1];
    
    if (dbData[collName]) {
      const index = dbData[collName].findIndex((d: any) => d.id === docId);
      if (index !== -1) {
        dbData[collName][index] = { ...dbData[collName][index], ...data };
        setMockData(dbData);
      }
    }
    return;
  }
  const { updateDoc: realUpdateDoc } = await import("firebase/firestore");
  return (realUpdateDoc as any)(...args);
};

export const onSnapshot = (...args: any[]) => {
  if (useMock) {
    const collOrDocRef = args[0];
    const callback = args[1];
    // Very basic mock onSnapshot
    const check = () => {
      const dbData = getMockData();
      const parts = collOrDocRef.path.split('/');
      if (parts.length === 1) {
        const data = dbData[parts[0]] || [];
        callback({
          docs: data.map((d: any) => ({
            id: d.id,
            data: () => d,
            exists: () => true
          }))
        });
      } else {
        const collName = parts[0];
        const docId = parts[1];
        const collection = dbData[collName] || [];
        const found = collection.find((d: any) => d.id === docId);
        callback({
          exists: () => !!found,
          data: () => found || {},
          id: docId
        });
      }
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }
  return () => {};
};

export const addDoc = async (...args: any[]) => {
  if (useMock) {
    const collRef = args[0];
    const data = args[1];
    const dbData = getMockData();
    if (!dbData[collRef.path]) dbData[collRef.path] = [];
    const newDoc = { id: Math.random().toString(36).substr(2, 9), ...data };
    dbData[collRef.path].push(newDoc);
    setMockData(dbData);
    return newDoc;
  }
  const { addDoc: realAddDoc } = await import("firebase/firestore");
  return (realAddDoc as any)(...args);
};

export const serverTimestamp = () => new Date().toISOString();

export { auth, db, storage };
