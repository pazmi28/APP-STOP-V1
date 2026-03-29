import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSalas } from "../hooks/useSalas";
import { useAuth } from "../context/AuthContext";
import { getNombreUsuario } from "../utils/salaUtils";
import { useChat } from "../hooks/useChat";
import ChatFlotante from "../components/Chat/ChatFlotante";

const SalaEspera = () => {
  const { salaId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    sala,
    jugadores,
    loading,
    suscribirseASala,
    iniciarPartida,
    salirSala,
  } = useSalas();
  const [saliendo, setSaliendo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const {
    mensajes,
    noLeidos,
    chatAbierto,
    abrirChat,
    cerrarChat,
    enviarMensaje,
  } = useChat(salaId);

  // EFECTO PARA REDIRIGIR AUTOMÁTICAMENTE CUANDO LA SALA CAMBIA DE ESTADO
  useEffect(() => {
    if (sala?.estado === "jugando") {
      navigate(`/juego/${salaId}`);
    }
    // Si la sala ya terminó y alguien llega a la sala de espera, al dashboard
    if (sala?.estado === "terminada") {
      navigate("/dashboard");
    }
  }, [sala?.estado, salaId, navigate]);

  useEffect(() => {
    if (salaId) {
      const unsubscribe = suscribirseASala(salaId);
      return unsubscribe;
    }
  }, [salaId, suscribirseASala]);

  // Verificar si el usuario actual es el creador
  const esCreador = sala?.creadorId === user?.uid;

  const handleIniciarPartida = async () => {
    if (!esCreador) return;

    if (jugadores.length < 2) {
      alert("Se necesitan al menos 2 jugadores para comenzar");
      return;
    }

    const result = await iniciarPartida(salaId);
    if (result.success) {
      navigate(`/juego/${salaId}`);
    }
  };

  const handleSalirSala = async () => {
    if (window.confirm("¿Seguro que quieres salir de la sala?")) {
      setSaliendo(true);
      await salirSala(salaId);
      setSaliendo(false);
      navigate("/dashboard");
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(sala?.codigo || "");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading && !sala) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "var(--spacing-md)",
        }}
      >
        <div style={{ fontSize: "2rem" }}>⏳</div>
        <p>Cargando sala...</p>
      </div>
    );
  }

  if (!sala) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "var(--spacing-lg)",
        }}
      >
        <h2>Sala no encontrada</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard")}
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>🎮 Sala de Espera</h1>

      {/* Código de la sala */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
          padding: "var(--spacing-xl)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--spacing-lg)",
          textAlign: "center",
          color: "white",
        }}
      >
        <p style={{ opacity: 0.9, marginBottom: "var(--spacing-xs)" }}>
          Código de la sala
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-md)",
          }}
        >
          <h2
            style={{
              fontSize: "3rem",
              letterSpacing: "8px",
              fontFamily: "monospace",
              background: "rgba(255,255,255,0.1)",
              padding: "var(--spacing-md) var(--spacing-lg)",
              borderRadius: "var(--radius-md)",
              display: "inline-block",
              margin: 0,
            }}
          >
            {sala.codigo}
          </h2>
          <button
            onClick={copiarCodigo}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            {copiado ? "✅" : "📋"}
          </button>
        </div>
        <p style={{ marginTop: "var(--spacing-md)", opacity: 0.8 }}>
          Comparte este código con tus amigos para que se unan
        </p>
      </div>

      {/* Lista de jugadores */}
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          <h3 style={{ margin: 0 }}>
            Jugadores en la sala ({jugadores.length})
          </h3>
          {esCreador && (
            <span
              style={{
                background: "var(--primary)",
                color: "white",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.8rem",
              }}
            >
              👑 Anfitrión
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
          }}
        >
          {jugadores.map((jugador, index) => (
            <div
              key={jugador.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                padding: "var(--spacing-md)",
                background:
                  jugador.userId === sala.creadorId
                    ? "var(--primary-light)"
                    : "var(--gray-50)",
                borderRadius: "var(--radius-md)",
                border:
                  jugador.userId === user?.uid
                    ? "2px solid var(--primary)"
                    : "1px solid var(--gray-200)",
                animation:
                  index === jugadores.length - 1 ? "fadeIn 0.3s ease" : "none",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>
                {jugador.userId === sala.creadorId ? "👑" : "👤"}
              </span>
              <div style={{ flex: 1 }}>
                <strong>{jugador.nombre}</strong>
                {jugador.userId === user?.uid && " (tú)"}
              </div>
              {jugador.userId === sala.creadorId && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--primary-dark)",
                    background: "white",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  Anfitrión
                </span>
              )}
            </div>
          ))}
        </div>

        {jugadores.length === 1 && (
          <div
            style={{
              textAlign: "center",
              color: "var(--gray-500)",
              marginTop: "var(--spacing-lg)",
              padding: "var(--spacing-lg)",
              background: "var(--gray-100)",
              borderRadius: "var(--radius-md)",
              fontStyle: "italic",
            }}
          >
            ⏳ Esperando a que se unan más jugadores...
          </div>
        )}

        {/* Botones de acción */}
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            marginTop: "var(--spacing-xl)",
            borderTop: "1px solid var(--gray-200)",
            paddingTop: "var(--spacing-lg)",
          }}
        >
          {esCreador ? (
            <button
              className="btn btn-primary"
              onClick={handleIniciarPartida}
              disabled={jugadores.length < 2}
              style={{
                flex: 1,
                opacity: jugadores.length < 2 ? 0.6 : 1,
              }}
            >
              {jugadores.length < 2
                ? "⏳ Esperando jugadores..."
                : "🎮 Iniciar Partida"}
            </button>
          ) : (
            <div style={{ flex: 1, textAlign: "center" }}>
              <p style={{ color: "var(--gray-500)" }}>
                ⏳ Esperando a que el anfitrión inicie la partida...
              </p>
            </div>
          )}

          <button
            className="btn"
            onClick={handleSalirSala}
            disabled={saliendo}
            style={{ minWidth: "120px" }}
          >
            {saliendo ? "Saliendo..." : "🚪 Salir"}
          </button>
        </div>
      </div>

      {/* Información de la sala */}
      <div
        style={{
          marginTop: "var(--spacing-lg)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--spacing-md)",
        }}
      >
        <div className="card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem" }}>⏱️</span>
          <h4 style={{ margin: "var(--spacing-sm) 0" }}>Tiempo por ronda</h4>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "var(--primary)",
            }}
          >
            {sala.tiempoPartida} <span style={{ fontSize: "0.9rem" }}>seg</span>
          </p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem" }}>📊</span>
          <h4 style={{ margin: "var(--spacing-sm) 0" }}>Estado</h4>
          <p
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color:
                sala.estado === "esperando"
                  ? "var(--warning)"
                  : "var(--success)",
              background:
                sala.estado === "esperando"
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(16,185,129,0.1)",
              padding: "var(--spacing-sm)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {sala.estado === "esperando"
              ? "⏳ Esperando jugadores"
              : "🎮 En juego"}
          </p>
        </div>
      </div>

      {/* Chat flotante */}
      <ChatFlotante
        mensajes={mensajes}
        noLeidos={noLeidos}
        chatAbierto={chatAbierto}
        onAbrir={abrirChat}
        onCerrar={cerrarChat}
        onEnviar={enviarMensaje}
      />

      {/* Reglas rápidas */}
      <div
        style={{
          marginTop: "var(--spacing-lg)",
          background: "var(--gray-100)",
          padding: "var(--spacing-lg)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--gray-200)",
        }}
      >
        <h4 style={{ marginBottom: "var(--spacing-sm)" }}>
          📝 Reglas del juego
        </h4>
        <ul
          style={{ marginLeft: "var(--spacing-lg)", color: "var(--gray-700)" }}
        >
          <li>Se elegirá una letra aleatoria al comenzar cada ronda</li>
          <li>Tienes que escribir una palabra para cada categoría</li>
          <li>Cualquier jugador puede pulsar STOP para finalizar la ronda</li>
          <li>
            Puntuación: 1 punto si es única, 0.5 si hay coincidencia, 0 si hay 3
            o más
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SalaEspera;
