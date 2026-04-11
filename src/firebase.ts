import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getDocFromServer, doc, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig as localConfig } from "./config";
import appletConfig from "../firebase-applet-config.json";

const firebaseConfig = { ...localConfig, ...appletConfig };

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const auth = getAuth(app);

// Use firestoreDatabaseId if provided in config, otherwise default to (default)
const databaseId = (firebaseConfig as any).firestoreDatabaseId || "(default)";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed: Multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence failed: Browser not supported.");
    }
  });
}

export const storage = getStorage(app);
export const appId = 'edupro-app';
export { getDocFromServer };

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Lỗi: Không thể kết nối tới Firestore (The client is offline).");
      console.warn("Vui lòng kiểm tra:");
      console.warn("1. Bạn đã tạo Database trong Firebase Console chưa?");
      console.warn("2. Project ID '"+db.app.options.projectId+"' có chính xác không?");
      console.warn("3. Bạn đã bật Firestore API trong Google Cloud Console chưa?");
    }
  }
}
testConnection();
