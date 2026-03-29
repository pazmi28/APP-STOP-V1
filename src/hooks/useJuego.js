import { useState, useEffect, useRef } from "react";
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { getLetraAleatoria } from "../utils/letras";
import toast from "react-hot-toast";

const DURACION_CUENTA_ATRAS = 3; // segundos

export const useJuego = (salaId, tiempoLimiteSala = 60) => {
  const [rondaActual, setRondaActual] = useState(null);
  const [todasLasRondas, setTodasLasRondas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [misRespuestas, setMisRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [rondaTerminada, setRondaTerminada] = useState(false);
  const [cuentaAtras, setCuentaAtras] = useState(null);
  const { user } = useAuth();

  const timerRef = useRef(null);
  const cuentaAtrasTimersRef = useRef([]); // array de timeouts para limpiar fácil
  const finalizandoRef = useRef(false);
  const ultimaRondaRef = useRef(null);
  const rondaPendienteActivadaRef = useRef(null); // id de la ronda pendiente ya procesada

  // Limpiar todos los timeouts de cuenta atrás
  const limpiarCuentaAtras = () => {
    cuentaAtrasTimersRef.current.forEach(clearTimeout);
    cuentaAtrasTimersRef.current = [];
  };

  // ─── 1. Escuchar todas las rondas desde Firestore ─────────────────────────
  useEffect(() => {
    if (!salaId) return;

    const rondasRef = collection(db, "salas", salaId, "rondas");

    const unsubscribe = onSnapshot(rondasRef, (snapshot) => {
      const todasRondas = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        inicioTimestamp: d.data().inicioTimestamp?.toDate() || null,
      }));

      setTodasLasRondas(todasRondas);

      const rondaActiva = todasRondas.find((r) => r.activa === true);
      const rondaPendiente = todasRondas.find(
        (r) => r.pendiente === true && r.activa === false
      );

      if (rondaActiva) {
        // ── Ronda en juego ──────────────────────────────────────────────────
        limpiarCuentaAtras();

        if (ultimaRondaRef.current?.id !== rondaActiva.id) {
          setRespuestas([]);
          setMisRespuestas({});
        }
        ultimaRondaRef.current = rondaActiva;
        rondaPendienteActivadaRef.current = null;

        setRondaActual(rondaActiva);
        setRondaTerminada(false);
        setCuentaAtras(null);
        finalizandoRef.current = false;

        const inicioTs = rondaActiva.inicioTimestamp;
        const tiempoTranscurrido = inicioTs
          ? Math.floor((new Date() - inicioTs) / 1000)
          : 0;
        const restante = Math.max(
          0,
          (rondaActiva.tiempoLimite || tiempoLimiteSala) - tiempoTranscurrido
        );
        setTiempoRestante(restante);
      } else if (rondaPendiente) {
        // ── Ronda pendiente: arrancar cuenta atrás con setTimeout ───────────
        // Solo procesar una vez por ronda pendiente (evitar re-ejecución en cada snapshot)
        if (rondaPendienteActivadaRef.current === rondaPendiente.id) return;
        rondaPendienteActivadaRef.current = rondaPendiente.id;

        limpiarCuentaAtras();

        // IMPORTANTE: resetear rondaTerminada en TODOS los clientes (no solo el anfitrión)
        // Los no-anfitriones nunca llaman a siguienteRonda(), así que esto es esencial
        setRondaTerminada(false);
        ultimaRondaRef.current = null;
        finalizandoRef.current = false;

        // Mostrar 3 → 2 → 1 con setTimeout simples, sin depender del server timestamp
        setCuentaAtras(DURACION_CUENTA_ATRAS);

        for (let i = 1; i <= DURACION_CUENTA_ATRAS; i++) {
          const t = setTimeout(() => {
            const valor = DURACION_CUENTA_ATRAS - i;
            if (valor > 0) {
              setCuentaAtras(valor);
            } else {
              // Cuenta terminó → limpiar y activar la ronda (solo el creador escribe)
              setCuentaAtras(null);
              if (rondaPendiente.creadaPor === user?.uid) {
                updateDoc(
                  doc(db, "salas", salaId, "rondas", rondaPendiente.id),
                  {
                    activa: true,
                    pendiente: false,
                    inicioTimestamp: serverTimestamp(),
                  }
                ).catch((e) => console.log("Error activando ronda:", e));
              }
            }
          }, i * 1000);

          cuentaAtrasTimersRef.current.push(t);
        }
      } else {
        // ── Sin ronda activa ni pendiente ───────────────────────────────────
        limpiarCuentaAtras();

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTiempoRestante(0);

        if (ultimaRondaRef.current !== null) {
          const ultimaActualizada = todasRondas.find(
            (r) => r.id === ultimaRondaRef.current.id
          );
          if (ultimaActualizada) setRondaActual(ultimaActualizada);
          setRondaTerminada(true);
          setCuentaAtras(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      limpiarCuentaAtras();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, tiempoLimiteSala]);

  // ─── 2. Temporizador local ────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      !rondaActual ||
      !rondaActual.activa ||
      tiempoRestante === null ||
      tiempoRestante <= 0
    )
      return;

    timerRef.current = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (!finalizandoRef.current) {
            finalizandoRef.current = true;
            finalizarRondaPorTiempo(rondaActual.id);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rondaActual?.id]);

  // ─── 3. Escuchar respuestas de la ronda actual ────────────────────────────
  useEffect(() => {
    if (!salaId || !rondaActual?.id) return;

    const respuestasRef = collection(
      db,
      "salas",
      salaId,
      "rondas",
      rondaActual.id,
      "respuestas"
    );
    const unsubscribe = onSnapshot(respuestasRef, (snapshot) => {
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRespuestas(lista);

      if (user) {
        const misResp = {};
        lista.forEach((r) => {
          if (r.userId === user.uid) misResp[r.categoria] = r.palabra;
        });
        setMisRespuestas(misResp);
      }
    });

    return () => unsubscribe();
  }, [salaId, rondaActual?.id, user]);

  // ─── 4. Iniciar ronda (crea doc pendiente en Firestore) ───────────────────
  const iniciarRonda = async () => {
    if (!salaId || !user) return false;

    try {
      const rondasRef = collection(db, "salas", salaId, "rondas");

      const qActiva = query(rondasRef, where("activa", "==", true), limit(1));
      if (!(await getDocs(qActiva)).empty) return false;

      const qPendiente = query(
        rondasRef,
        where("pendiente", "==", true),
        limit(1)
      );
      if (!(await getDocs(qPendiente)).empty) return false;

      const todasSnap = await getDocs(rondasRef);
      const numeroRonda = todasSnap.size + 1;
      const letra = getLetraAleatoria();

      // pendiente: true → todos los clientes detectan este doc y arrancan su cuenta atrás local
      await addDoc(rondasRef, {
        numero: numeroRonda,
        letra,
        activa: false,
        pendiente: true,
        tiempoLimite: tiempoLimiteSala,
        inicioTimestamp: null,
        creadaPor: user.uid,
      });

      return true;
    } catch (err) {
      console.error("❌ Error al iniciar ronda:", err);
      return false;
    }
  };

  // ─── 5. Siguiente ronda ───────────────────────────────────────────────────
  const siguienteRonda = async () => {
    if (!salaId || !user) return false;

    ultimaRondaRef.current = null;
    rondaPendienteActivadaRef.current = null;
    limpiarCuentaAtras();
    setRondaTerminada(false);
    setRespuestas([]);
    setMisRespuestas({});
    finalizandoRef.current = false;

    return await iniciarRonda();
  };

  // ─── 6. Enviar respuesta ───────────────────────────────────────────────────
  const enviarRespuesta = async (categoria, palabra) => {
    if (!salaId || !rondaActual?.id || !rondaActual?.activa || !user)
      return false;
    if (!palabra?.trim()) return false;

    try {
      const respuestasRef = collection(
        db,
        "salas",
        salaId,
        "rondas",
        rondaActual.id,
        "respuestas"
      );
      const q = query(
        respuestasRef,
        where("userId", "==", user.uid),
        where("categoria", "==", categoria)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        await updateDoc(
          doc(
            db,
            "salas",
            salaId,
            "rondas",
            rondaActual.id,
            "respuestas",
            existing.docs[0].id
          ),
          { palabra: palabra.trim(), timestamp: serverTimestamp() }
        );
      } else {
        await addDoc(respuestasRef, {
          userId: user.uid,
          categoria,
          palabra: palabra.trim(),
          timestamp: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      console.error("❌ Error:", err);
      return false;
    }
  };

  // ─── 7. Pulsar STOP ────────────────────────────────────────────────────────
  const pulsarStop = async () => {
    if (!salaId || !rondaActual?.activa || !user) return;
    if (finalizandoRef.current) return;
    finalizandoRef.current = true;

    try {
      await updateDoc(doc(db, "salas", salaId, "rondas", rondaActual.id), {
        activa: false,
        finTimestamp: serverTimestamp(),
        usuarioStopId: user.uid,
      });
      toast.success(`🛑 ${user.email?.split("@")[0]} pulsó STOP!`);
    } catch (err) {
      console.error("❌ Error:", err);
      finalizandoRef.current = false;
    }
  };

  // ─── 8. Finalizar ronda por tiempo ────────────────────────────────────────
  const finalizarRondaPorTiempo = async (rondaId) => {
    if (!salaId || !rondaId) return;
    try {
      await updateDoc(doc(db, "salas", salaId, "rondas", rondaId), {
        activa: false,
        finTimestamp: serverTimestamp(),
        finalizadaPor: "tiempo",
      });
      toast.success("⏰ ¡Tiempo terminado!");
    } catch (err) {
      console.log("ℹ️ Ya finalizada:", err.code);
    }
  };

  // ─── 9. Finalizar juego completo ──────────────────────────────────────────
  const finalizarJuego = async () => {
    if (!salaId) return false;
    try {
      await updateDoc(doc(db, "salas", salaId), {
        estado: "terminada",
        terminadaEn: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.error("❌ Error:", err);
      return false;
    }
  };

  return {
    rondaActual,
    todasLasRondas,
    respuestas,
    misRespuestas,
    loading,
    tiempoRestante,
    rondaTerminada,
    cuentaAtras,
    iniciarRonda,
    siguienteRonda,
    enviarRespuesta,
    pulsarStop,
    finalizarJuego,
  };
};
