import { createContext, useState, useEffect, useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/config";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("✅ Sesión iniciada");
      return { success: true };
    } catch (error) {
      toast.error("❌ Error: " + error.message);
      return { success: false, error };
    }
  };

  const signup = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("✅ Cuenta creada correctamente");
      return { success: true };
    } catch (error) {
      toast.error("❌ Error: " + error.message);
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("👋 Sesión cerrada");
      return { success: true };
    } catch (error) {
      toast.error("❌ Error al cerrar sesión");
      return { success: false, error };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
