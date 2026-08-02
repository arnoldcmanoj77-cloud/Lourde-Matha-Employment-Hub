import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

/**
 * Lourde Matha Employment Hub - Firebase Configuration
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lourde-matha-hub.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lourde-matha-hub",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lourde-matha-hub.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

/**
 * Interface for Applicant Profile File saved in Firestore DB
 */
export interface ApplicantFile {
  id?: string;
  fullName: string;
  passportNumber: string;
  phone: string;
  category: string;
  cvUrl?: string;
  cvFileName?: string;
  status: "Draft" | "Submitted" | "Shortlisted" | "Approved";
  createdAt: string;
  updatedAt?: string;
}

/**
 * Helper to check if Firebase credentials are fully configured in environment
 */
export function isFirebaseConfigured(): boolean {
  return (
    !!import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== "YOUR_FIREBASE_API_KEY"
  );
}

// Initialize Firebase App & Firestore singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = "applicants";
const LOCAL_STORAGE_KEY = "lm_applicants_fallback";

// Local storage fallback helper
function getLocalApplicants(): ApplicantFile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalApplicants(applicants: ApplicantFile[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applicants));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

/**
 * Save or update applicant profile in Firestore
 */
export async function saveApplicantProfile(
  data: Omit<ApplicantFile, "createdAt"> & { id?: string }
): Promise<ApplicantFile> {
  const now = new Date().toISOString();
  const fileData: ApplicantFile = {
    ...data,
    status: data.status || "Submitted",
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured() && db) {
    try {
      if (data.id) {
        const docRef = doc(db, COLLECTION_NAME, data.id);
        await setDoc(docRef, fileData, { merge: true });
        return { ...fileData, id: data.id };
      } else {
        const colRef = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(colRef, fileData);
        const saved = { ...fileData, id: docRef.id };
        // also cache locally
        const existing = getLocalApplicants().filter((a) => a.id !== docRef.id);
        saveLocalApplicants([saved, ...existing]);
        return saved;
      }
    } catch (err) {
      console.warn("Firestore save error, using local fallback:", err);
    }
  }

  // Fallback to local storage
  const existing = getLocalApplicants();
  const generatedId = data.id || `LM-${Math.floor(1000 + Math.random() * 9000)}`;
  const saved = { ...fileData, id: generatedId };
  const filtered = existing.filter((a) => a.id !== generatedId && a.passportNumber !== data.passportNumber);
  saveLocalApplicants([saved, ...filtered]);
  return saved;
}

/**
 * Fetch all applicant files for the Admin Control Center
 */
export async function getApplicantFiles(): Promise<ApplicantFile[]> {
  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const files: ApplicantFile[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<ApplicantFile, "id">),
        }));
        saveLocalApplicants(files);
        return files;
      }
    } catch (err) {
      console.warn("Firestore read error, using local fallback:", err);
    }
  }
  return getLocalApplicants();
}

/**
 * Subscribe to real-time updates for applicant files (Admin dashboard)
 */
export async function deleteApplicant(fileId: string): Promise<boolean> {
  if (isFirebaseConfigured() && db && fileId && !fileId.startsWith('LM-')) {
    try {
      const docRef = doc(db, COLLECTION_NAME, fileId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete error:', err);
    }
  }
  // Update local cache
  const local = getLocalApplicants();
  const filtered = local.filter((a) => a.id !== fileId);
  saveLocalApplicants(filtered);
  return true;
}

export function subscribeToApplicantFiles(
  callback: (files: ApplicantFile[]) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const files: ApplicantFile[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<ApplicantFile, "id">),
          }));
          saveLocalApplicants(files);
          callback(files);
        },
        (err) => {
          console.warn("Firestore subscription error:", err);
          callback(getLocalApplicants());
        }
      );
    } catch (err) {
      console.warn("Firestore subscribe exception:", err);
    }
  }

  callback(getLocalApplicants());
  return () => {};
}

/**
 * Search applicant file by passport number
 */
export async function getApplicantByPassport(
  passportNumber: string
): Promise<ApplicantFile | null> {
  const cleanPassport = passportNumber.trim().toUpperCase();
  if (isFirebaseConfigured() && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where("passportNumber", "==", cleanPassport));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return {
          id: docSnap.id,
          ...(docSnap.data() as Omit<ApplicantFile, "id">),
        };
      }
    } catch (err) {
      console.warn("Firestore passport query error:", err);
    }
  }

  // Local storage fallback check
  const local = getLocalApplicants();
  return (
    local.find(
      (a) => a.passportNumber.trim().toUpperCase() === cleanPassport
    ) || null
  );
}

/**
 * Update applicant status in Firestore
 */
export async function updateApplicantStatus(
  fileId: string,
  status: ApplicantFile["status"]
): Promise<boolean> {
  if (isFirebaseConfigured() && db && fileId && !fileId.startsWith("LM-")) {
    try {
      const docRef = doc(db, COLLECTION_NAME, fileId);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn("Firestore status update error:", err);
    }
  }

  // Always update local cache too
  const local = getLocalApplicants();
  const updated = local.map((a) => (a.id === fileId ? { ...a, status } : a));
  saveLocalApplicants(updated);
  return true;
}
