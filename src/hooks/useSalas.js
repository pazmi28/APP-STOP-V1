import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { generarCodigoSala, getNombreUsuario } from "../utils/salaUtils";
import toast from "react-hot-toast";

export const useSalas = () => {
  const [sala, setSala] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Crear una nueva sala
  const crearSala = async (tiempoPartida = 60) => {
    if (!user) {
      toast.error("Debes iniciar sesión");
      return { success: false, error: "No autenticado" };
    }

    setLoading(true);
    setError(null);

    try {
      // Generar código único
      let codigo;
      let existe = true;
      let intentos = 0;

      while (existe && intentos < 10) {
        codigo = generarCodigoSala();
        const q = query(collection(db, "salas"), where("codigo", "==", codigo));
        const snapshot = await getDocs(q);
        existe = !snapshot.empty;
        intentos++;
      }

      if (existe) {
        throw new Error("No se pudo generar un código único");
      }

      // Crear la sala
      const salaRef = await addDoc(collection(db, "salas"), {
        codigo,
        creadorId: user.uid,
        estado: "esperando",
        tiempoPartida,
        createdAt: serverTimestamp(),
        jugadores: 1,
      });

      // Añadir creador como primer jugador
      await addDoc(collection(db, "salas", salaRef.id, "jugadores"), {
        userId: user.uid,
        nombre: getNombreUsuario(user.email),
        puntosTotal: 0,
        unidoEn: serverTimestamp(),
      });

      toast.success(`✅ Sala creada! Código: ${codigo}`);
      return { success: true, salaId: salaRef.id, codigo };
    } catch (err) {
      console.error("Error al crear sala:", err);
      setError(err.message);
      toast.error("❌ Error al crear la sala");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Unirse a una sala por código
  const unirseSala = async (codigo) => {
    if (!user) {
      toast.error("Debes iniciar sesión");
      return { success: false, error: "No autenticado" };
    }

    setLoading(true);
    setError(null);

    try {
      // Buscar sala por código
      const q = query(collection(db, "salas"), where("codigo", "==", codigo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("❌ Sala no encontrada");
        return { success: false, error: "Sala no encontrada" };
      }

      const salaDoc = snapshot.docs[0];
      const salaData = salaDoc.data();

      // Verificar que la sala esté en estado esperando
      if (salaData.estado !== "esperando") {
        toast.error("❌ La partida ya comenzó");
        return { success: false, error: "Partida ya comenzada" };
      }

      // Verificar que el usuario no esté ya en la sala
      const jugadoresRef = collection(db, "salas", salaDoc.id, "jugadores");
      const jugadoresSnap = await getDocs(
        query(jugadoresRef, where("userId", "==", user.uid))
      );

      if (!jugadoresSnap.empty) {
        toast.error("❌ Ya estás en esta sala");
        return { success: false, error: "Usuario ya en sala" };
      }

      // Añadir jugador
      await addDoc(jugadoresRef, {
        userId: user.uid,
        nombre: getNombreUsuario(user.email),
        puntosTotal: 0,
        unidoEn: serverTimestamp(),
      });

      // Actualizar contador de jugadores
      await updateDoc(doc(db, "salas", salaDoc.id), {
        jugadores: (salaData.jugadores || 0) + 1,
      });

      toast.success(`✅ Te has unido a la sala ${codigo}`);
      return { success: true, salaId: salaDoc.id, codigo };
    } catch (err) {
      console.error("Error al unirse a sala:", err);
      setError(err.message);
      toast.error("❌ Error al unirse a la sala");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Suscribirse a los cambios de una sala (tiempo real)
  const suscribirseASala = useCallback((salaId) => {
    if (!salaId) return () => {};

    // Suscripción a la sala
    const unsubscribeSala = onSnapshot(doc(db, "salas", salaId), (doc) => {
      if (doc.exists()) {
        setSala({ id: doc.id, ...doc.data() });
      } else {
        setSala(null);
        toast.error("La sala ya no existe");
      }
    });

    // Suscripción a los jugadores
    const unsubscribeJugadores = onSnapshot(
      collection(db, "salas", salaId, "jugadores"),
      (snapshot) => {
        const jugadoresList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          unidoEn: doc.data().unidoEn?.toDate() || new Date(),
        }));
        setJugadores(jugadoresList);
      }
    );

    return () => {
      unsubscribeSala();
      unsubscribeJugadores();
    };
  }, []);

  // Iniciar partida (solo el creador)
  const iniciarPartida = async (salaId) => {
    if (!salaId || !user) {
      toast.error("No autorizado");
      return { success: false };
    }

    try {
      await updateDoc(doc(db, "salas", salaId), {
        estado: "jugando",
        iniciadaEn: serverTimestamp(),
      });
      toast.success("🎮 Partida iniciada!");
      return { success: true };
    } catch (err) {
      console.error("Error al iniciar partida:", err);
      toast.error("❌ Error al iniciar partida");
      return { success: false };
    }
  };

  // Salir de la sala
  const salirSala = async (salaId) => {
    if (!salaId || !user) return { success: false };

    try {
      // Buscar el documento del jugador
      const jugadoresRef = collection(db, "salas", salaId, "jugadores");
      const q = query(jugadoresRef, where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const jugadorDoc = snapshot.docs[0];

        // Eliminar jugador de la subcolección
        await updateDoc(doc(db, "salas", salaId, "jugadores", jugadorDoc.id), {
          salioEn: serverTimestamp(),
        });

        // Actualizar contador de jugadores
        if (sala) {
          await updateDoc(doc(db, "salas", salaId), {
            jugadores: Math.max(0, (sala.jugadores || 1) - 1),
          });
        }

        toast.success("👋 Has salido de la sala");
      }

      return { success: true };
    } catch (err) {
      console.error("Error al salir de sala:", err);
      toast.error("❌ Error al salir de la sala");
      return { success: false };
    }
  };

  // Obtener sala por ID
  const getSala = async (salaId) => {
    try {
      const docRef = doc(db, "salas", salaId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error("Error al obtener sala:", err);
      return null;
    }
  };

  // NUEVA FUNCIÓN: Obtener jugadores de una sala
  const getJugadores = async (salaId) => {
    try {
      const jugadoresRef = collection(db, "salas", salaId, "jugadores");
      const snapshot = await getDocs(jugadoresRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (err) {
      console.error("Error al obtener jugadores:", err);
      return [];
    }
  };

  return {
    sala,
    jugadores,
    loading,
    error,
    crearSala,
    unirseSala,
    suscribirseASala,
    iniciarPartida,
    salirSala,
    getSala,
    getJugadores, // <-- NUEVA FUNCIÓN EXPORTADA
  };
};
