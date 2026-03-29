import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJuego } from "../hooks/useJuego";
import { useSalas } from "../hooks/useSalas";
import { useAuth } from "../context/AuthContext";
import Timer from "../components/Juego/Timer";
import CategoriasGrid from "../components/Juego/CategoriasGrid";
import BotonStop from "../components/Juego/BotonStop";
import RevisionRespuestas from "../components/Juego/RevisionRespuestas";
import ResultadosFinales from "../components/Juego/ResultadosFinales";
import CuentaAtras from "../components/Juego/CuentaAtras";
import ChatFlotante from "../components/Chat/ChatFlotante";
import { useChat } from "../hooks/useChat";
import { CATEGORIAS } from "../utils/letras";

const Juego = () => {
  const { salaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sala, jugadores, suscribirseASala } = useSalas();

  const {
    rondaActual,
    todasLasRondas,
    respuestas,
    misRespuestas,
    tiempoRestante,
    rondaTerminada,
    cuentaAtras,
    loading,
    iniciarRonda,
    siguienteRonda,
    enviarRespuesta,
    pulsarStop,
    finalizarJuego,
  } = useJuego(salaId, sala?.tiempoPartida || 60);

  const [respuestasLocales, setRespuestasLocales] = useState({});
  const [historialRespuestas, setHistorialRespuestas] = useState({});
  const [mostrarResultadosFinales, setMostrarResultadosFinales] =
    useState(false);
  const categoriasEnFocoRef = useRef(new Set());
  const iniciandoRondaRef = useRef(false);
  const {
    mensajes,
    noLeidos,
    chatAbierto,
    abrirChat,
    cerrarChat,
    enviarMensaje,
  } = useChat(salaId);

  // Suscribirse a la sala
  useEffect(() => {
    if (salaId) {
      const unsubscribe = suscribirseASala(salaId);
      return unsubscribe;
    }
  }, [salaId, suscribirseASala]);

  // Si la sala pasa a "terminada" → resultados finales en todos los clientes
  useEffect(() => {
    if (sala?.estado === "terminada") {
      setMostrarResultadosFinales(true);
    }
  }, [sala?.estado]);

  // Solo el creador inicia la primera ronda
  useEffect(() => {
    const iniciarSiNecesario = async () => {
      if (
        !loading &&
        !rondaActual &&
        !rondaTerminada &&
        cuentaAtras === null &&
        !mostrarResultadosFinales &&
        sala?.estado === "jugando" &&
        sala?.creadorId === user?.uid &&
        !iniciandoRondaRef.current
      ) {
        iniciandoRondaRef.current = true;
        await iniciarRonda();
      }
    };
    iniciarSiNecesario();
  }, [
    loading,
    rondaActual,
    rondaTerminada,
    cuentaAtras,
    mostrarResultadosFinales,
    sala?.estado,
    sala?.creadorId,
    user?.uid,
    iniciarRonda,
  ]);

  // Limpiar campos locales cuando cambia la ronda (nuevo rondaActual.id)
  useEffect(() => {
    if (rondaActual?.id) {
      setRespuestasLocales({});
      categoriasEnFocoRef.current.clear();
    }
  }, [rondaActual?.id]);

  // Sincronizar desde Firestore → local solo para campos no en foco
  useEffect(() => {
    setRespuestasLocales((prev) => {
      const siguiente = { ...prev };
      Object.entries(misRespuestas).forEach(([cat, valor]) => {
        if (!categoriasEnFocoRef.current.has(cat)) {
          siguiente[cat] = valor;
        }
      });
      return siguiente;
    });
  }, [misRespuestas]);

  // Guardar respuestas de la ronda terminada en el historial
  useEffect(() => {
    if (rondaTerminada && rondaActual?.id && respuestas.length > 0) {
      setHistorialRespuestas((prev) => ({
        ...prev,
        [rondaActual.id]: respuestas,
      }));
    }
  }, [rondaTerminada, rondaActual?.id, respuestas]);

  const handleRespuestaChange = (categoria, valor) => {
    setRespuestasLocales((prev) => ({ ...prev, [categoria]: valor }));
  };

  const handleFocus = (categoria) => {
    categoriasEnFocoRef.current.add(categoria);
  };

  const guardarRespuesta = async (categoria, palabra) => {
    if (!palabra?.trim()) return;
    await enviarRespuesta(categoria, palabra.trim());
  };

  const handleBlur = (categoria, valor) => {
    categoriasEnFocoRef.current.delete(categoria);
    if (valor && valor !== misRespuestas[categoria]) {
      guardarRespuesta(categoria, valor);
    }
  };

  const handleStop = async () => {
    for (const [cat, val] of Object.entries(respuestasLocales)) {
      if (val && val !== misRespuestas[cat]) {
        await guardarRespuesta(cat, val);
      }
    }
    await pulsarStop();
  };

  const handleSiguienteRonda = async () => {
    setRespuestasLocales({});
    categoriasEnFocoRef.current.clear();
    if (sala?.creadorId === user?.uid) {
      // Solo el creador crea la ronda — los demás reaccionan al snapshot de Firestore
      iniciandoRondaRef.current = false;
      await siguienteRonda();
    } else {
      // No-creador: solo limpiar estado local, el hook reaccionará al snapshot pendiente
      await siguienteRonda();
    }
  };

  const handleFinalizarJuego = async () => {
    await finalizarJuego();
  };

  const handleVolverDashboard = () => navigate("/dashboard");

  // ── Pantalla de carga ──────────────────────────────────────────────────────
  if (loading && !rondaActual && cuentaAtras === null) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ fontSize: "2rem" }}>⏳</p>
        <p>Cargando partida...</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>Sala no encontrada</p>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // ── RESULTADOS FINALES ─────────────────────────────────────────────────────
  if (mostrarResultadosFinales) {
    return (
      <ResultadosFinales
        todasLasRondas={todasLasRondas}
        jugadores={jugadores}
        categorias={CATEGORIAS}
        sala={sala}
        onVolverDashboard={handleVolverDashboard}
      />
    );
  }

  // ── REVISIÓN DE RONDA ──────────────────────────────────────────────────────
  if (rondaTerminada && rondaActual) {
    return (
      <div>
        <RevisionRespuestas
          rondaActual={rondaActual}
          respuestas={respuestas}
          jugadores={jugadores}
          categorias={CATEGORIAS}
          esCreador={sala?.creadorId === user?.uid}
          salaId={salaId}
          onSiguienteRonda={handleSiguienteRonda}
          onFinalizarJuego={handleFinalizarJuego}
        />
        <ChatFlotante
          mensajes={mensajes}
          noLeidos={noLeidos}
          chatAbierto={chatAbierto}
          onAbrir={abrirChat}
          onCerrar={cerrarChat}
          onEnviar={enviarMensaje}
        />
      </div>
    );
  }

  // ── CUENTA ATRÁS antes de empezar ─────────────────────────────────────────
  if (cuentaAtras !== null) {
    // Buscar la ronda pendiente para mostrar su letra
    const rondaPendiente = todasLasRondas.find(
      (r) => r.pendiente === true && r.activa === false
    );
    return <CuentaAtras cuenta={cuentaAtras} letra={rondaPendiente?.letra} />;
  }

  // ── ESPERANDO RONDA ────────────────────────────────────────────────────────
  if (!rondaActual) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ fontSize: "2rem" }}>🎲</p>
        <p>Preparando siguiente ronda...</p>
      </div>
    );
  }

  // ── JUEGO ACTIVO ──────────────────────────────────────────────────────────
  return (
    <div>
      <h1>🎮 Partida en curso</h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "1rem",
          background: "var(--gray-50)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div>
          <p>
            Sala: <strong>{sala?.codigo}</strong>
          </p>
          <p>
            Ronda: <strong>{rondaActual?.numero || 1}</strong>
          </p>
        </div>
        <div
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            color: "var(--primary)",
            lineHeight: 1,
          }}
        >
          {rondaActual?.letra}
        </div>
      </div>

      <Timer
        segundos={tiempoRestante}
        isActive={rondaActual?.activa}
        tiempoTotal={sala?.tiempoPartida || 60}
      />

      <CategoriasGrid
        letra={rondaActual?.letra}
        respuestas={respuestasLocales}
        onRespuestaChange={handleRespuestaChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={!rondaActual?.activa}
      />

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <BotonStop onClick={handleStop} disabled={!rondaActual?.activa} />
      </div>

      <ChatFlotante
        mensajes={mensajes}
        noLeidos={noLeidos}
        chatAbierto={chatAbierto}
        onAbrir={abrirChat}
        onCerrar={cerrarChat}
        onEnviar={enviarMensaje}
      />
    </div>
  );
};

export default Juego;
