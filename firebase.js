import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2282SdfaGHaziFBDCg7gmW7tdF9w-Ohc",
  authDomain: "task-managment-26437.firebaseapp.com",
  projectId: "task-managment-26437",
  storageBucket: "task-managment-26437.firebasestorage.app",
  messagingSenderId: "351257331710",
  appId: "1:351257331710:web:5f94368134bb5ad57b62af",
  measurementId: "G-H59D96MRL7",
};

const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
