/**
 * Lourde Matha Employment Hub - Firebase Configuration
 * 
 * To connect your Firebase backend:
 * 1. Go to Firebase Console (https://console.firebase.google.com/)
 * 2. Create a project named "Lourde-Matha-Employment-Hub"
 * 3. Add a Web App to get your Firebase configuration keys.
 * 4. Copy the keys into your `.env` file (VITE_FIREBASE_API_KEY, etc.)
 */

// If firebase is installed, these imports will work.
// Run: `npm install firebase` to install the official SDK.

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
  uid: string;
  fullName: string;
  passportNumber: string;
  phone: string;
  category: string;
  cvUrl?: string;
  cvFileName?: string;
  status: "Draft" | "Submitted" | "Shortlisted" | "Approved";
  createdAt: string;
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
