import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAj9l_KjnAlTIkSmv5p_zoYO9dqz0pMIHQ",
  authDomain: "lightningbathware.firebaseapp.com",
  projectId: "lightningbathware",
  storageBucket: "lightningbathware.firebasestorage.app",
  messagingSenderId: "267352723728",
  appId: "1:267352723728:web:69f322d8128dd9b04cd595"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { app };
