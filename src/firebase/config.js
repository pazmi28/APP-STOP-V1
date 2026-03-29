import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANTE: Reemplaza con la configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAFcsqIi4QQ_1-1x1HcHAHTvYJWTyFOVps", // <-- PON TUS CREDENCIALES AQUÍ
  authDomain: "app-stop-v1.firebaseapp.com",
  projectId: "app-stop-v1",
  storageBucket: "app-stop-v1.firebasestorage.app",
  messagingSenderId: "728652557655",
  appId: "1:728652557655:web:da6c7e511dc6eb900e6212",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
