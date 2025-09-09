import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCVrjMTdFML8V24eHbtlihdo6pkX976ULo",
  authDomain: "book-replay-bd599.firebaseapp.com",
  projectId: "book-replay-bd599",
  storageBucket: "book-replay-bd599.firebasestorage.app",
  messagingSenderId: "237024618181",
  appId: "1:237024618181:web:44f41a5744f23c717772ac",
  measurementId: "G-1R2GHW7TZY",
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreを取得
export const db = getFirestore(app);

// Authenticationを取得
export const auth = getAuth(app);

// Analyticsを初期化（オプション）
export const analytics = getAnalytics(app);
