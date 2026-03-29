import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getNombreUsuario } from "../../utils/salaUtils";

const ChatFlotante = ({
  mensajes,
  noLeidos,
  chatAbierto,
  onAbrir,
  onCerrar,
  onEnviar,
}) => {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatAbierto) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, chatAbierto]);

  // Enfocar input al abrir
  useEffect(() => {
    if (chatAbierto) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatAbierto]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const ok = await onEnviar(texto);
    if (ok) setTexto("");
    setEnviando(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const formatHora = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const esInicioGrupo = (i) => {
    if (i === 0) return true;
    return mensajes[i].userId !== mensajes[i - 1].userId;
  };

  return (
    <>
      {/* Botón flotante */}
      {!chatAbierto && (
        <button
          onClick={onAbrir}
          title="Abrir chat"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--primary)",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
            fontSize: "1.4rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          💬
          {noLeidos > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "var(--danger)",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "0.7rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
              }}
            >
              {noLeidos > 9 ? "9+" : noLeidos}
            </span>
          )}
        </button>
      )}

      {/* Panel de chat */}
      {chatAbierto && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "320px",
            maxWidth: "calc(100vw - 32px)",
            height: "420px",
            maxHeight: "calc(100vh - 100px)",
            background: "white",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
            border: "1px solid var(--gray-200)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--primary)",
              color: "white",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              💬 Chat de sala
            </span>
            <button
              onClick={onCerrar}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {mensajes.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--gray-500)",
                  fontSize: "0.85rem",
                  marginTop: "2rem",
                }}
              >
                <p style={{ fontSize: "1.5rem" }}>👋</p>
                <p>¡Sé el primero en escribir!</p>
              </div>
            )}

            {mensajes.map((msg, i) => {
              const esMio = msg.userId === user?.uid;
              const inicio = esInicioGrupo(i);
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: esMio ? "flex-end" : "flex-start",
                    marginTop: inicio ? "8px" : "2px",
                  }}
                >
                  {inicio && !esMio && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--gray-500)",
                        marginLeft: "4px",
                        marginBottom: "2px",
                        fontWeight: 600,
                      }}
                    >
                      {msg.nombre}
                    </span>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "4px",
                      flexDirection: esMio ? "row-reverse" : "row",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "220px",
                        padding: "7px 11px",
                        borderRadius: esMio
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                        background: esMio
                          ? "var(--primary)"
                          : "var(--gray-100)",
                        color: esMio ? "white" : "var(--gray-900)",
                        fontSize: "0.88rem",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.texto}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        color: "var(--gray-400)",
                        whiteSpace: "nowrap",
                        marginBottom: "2px",
                      }}
                    >
                      {formatHora(msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--gray-200)",
              display: "flex",
              gap: "8px",
              flexShrink: 0,
              background: "white",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              maxLength={200}
              autoComplete="off"
              style={{
                flex: 1,
                border: "1px solid var(--gray-200)",
                borderRadius: "var(--radius-full)",
                padding: "8px 14px",
                fontSize: "0.88rem",
                outline: "none",
                background: "var(--gray-50)",
              }}
            />
            <button
              onClick={handleEnviar}
              disabled={!texto.trim() || enviando}
              style={{
                background: texto.trim() ? "var(--primary)" : "var(--gray-200)",
                color: texto.trim() ? "white" : "var(--gray-500)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                cursor: texto.trim() ? "pointer" : "not-allowed",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s ease",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatFlotante;
