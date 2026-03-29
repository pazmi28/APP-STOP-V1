import { useState, useEffect, useRef } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { getNombreUsuario } from "../utils/salaUtils";

export const useChat = (salaId) => {
  const [mensajes, setMensajes] = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [chatAbierto, setChatAbierto] = useState(false);
  const { user } = useAuth();

  const ultimoLeidoRef = useRef(0); // timestamp del último mensaje visto

  useEffect(() => {
    if (!salaId) return;

    const chatRef = collection(db, "salas", salaId, "chat");
    const q = query(chatRef, orderBy("timestamp", "asc"), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
      setMensajes(lista);

      // Contar no leídos: mensajes nuevos que llegaron mientras el chat estaba cerrado
      if (!chatAbierto) {
        const nuevos = lista.filter(
          (m) => m.userId !== user?.uid && m.timestamp > ultimoLeidoRef.current
        );
        setNoLeidos(
          (prev) =>
            prev +
            nuevos.filter((m) => !mensajes.find((old) => old.id === m.id))
              .length
        );
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, chatAbierto]);

  const abrirChat = () => {
    setChatAbierto(true);
    setNoLeidos(0);
    ultimoLeidoRef.current = new Date();
  };

  const cerrarChat = () => {
    setChatAbierto(false);
    ultimoLeidoRef.current = new Date();
  };

  const enviarMensaje = async (texto) => {
    if (!texto?.trim() || !salaId || !user) return false;

    try {
      await addDoc(collection(db, "salas", salaId, "chat"), {
        texto: texto.trim(),
        userId: user.uid,
        nombre: getNombreUsuario(user.email),
        timestamp: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      return false;
    }
  };

  return {
    mensajes,
    noLeidos,
    chatAbierto,
    abrirChat,
    cerrarChat,
    enviarMensaje,
  };
};
