import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAWjTZL2yjusq3VBnYTM7osfPJJUcAe0_g",
  authDomain: "bool-replay.firebaseapp.com",
  projectId: "bool-replay",
  storageBucket: "bool-replay.firebasestorage.app",
  messagingSenderId: "1078685058941",
  appId: "1:1078685058941:web:ced7f46824e9abda77ee14",
  measurementId: "G-M8JWGJNH8K"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// Firestoreを取得
export const db = getFirestore(app);

// Analyticsを初期化（オプション）
export const analytics = getAnalytics(app);
