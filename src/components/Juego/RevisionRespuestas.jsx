import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase/config";
import {
  doc,
  updateDoc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { normalizarPalabra } from "../../utils/letras";
import { useAuth } from "../../context/AuthContext";

// ── IA desactivada temporalmente ──────────────────────────────────────────────
// Cambiar a true cuando se retome la integración con Gemini
const IA_HABILITADA = false;

const RevisionRespuestas = ({
  rondaActual,
  respuestas,
  jugadores,
  categorias,
  esCreador,
  salaId,
  onSiguienteRonda,
  onFinalizarJuego,
}) => {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState({});
  const [cargando, setCargando] = useState(false);
  // votos: { [respuestaId]: { [userId]: "valida" | "invalida" } }
  const [votos, setVotos] = useState({});
  const unsuscribirVotosRef = useRef([]);

  // ── Sincronizar invalidaciones desde Firestore ────────────────────────────
  useEffect(() => {
    const fromFirestore = {};
    respuestas.forEach((r) => {
      if (r.invalida === true) fromFirestore[r.id] = true;
    });
    setValidaciones(fromFirestore);
  }, [respuestas]);

  // ── Suscribirse a votos de cada respuesta en tiempo real ──────────────────
  useEffect(() => {
    if (!salaId || !rondaActual?.id || !respuestas.length) return;

    // Limpiar suscripciones anteriores
    unsuscribirVotosRef.current.forEach((u) => u());
    unsuscribirVotosRef.current = [];

    respuestas.forEach((resp) => {
      if (!resp.palabra) return;

      const votosRef = collection(
        db,
        "salas",
        salaId,
        "rondas",
        rondaActual.id,
        "respuestas",
        resp.id,
        "votos"
      );

      const unsub = onSnapshot(votosRef, (snap) => {
        const votosRespuesta = {};
        snap.docs.forEach((d) => {
          votosRespuesta[d.id] = d.data().voto; // d.id = userId
        });

        setVotos((prev) => ({ ...prev, [resp.id]: votosRespuesta }));

        // Calcular mayoría y actualizar invalida en Firestore si cambia
        const total = jugadores.length;
        const numInvalida = Object.values(votosRespuesta).filter(
          (v) => v === "invalida"
        ).length;
        const numValida = Object.values(votosRespuesta).filter(
          (v) => v === "valida"
        ).length;

        if (total > 0 && Object.keys(votosRespuesta).length === total) {
          // Todos votaron → aplicar resultado
          const debeSerInvalida = numInvalida > numValida;
          updateDoc(
            doc(
              db,
              "salas",
              salaId,
              "rondas",
              rondaActual.id,
              "respuestas",
              resp.id
            ),
            {
              invalida: debeSerInvalida,
              motivoVotos: `${numInvalida}❌ vs ${numValida}✅`,
            }
          ).catch(() => {});
        } else if (Object.keys(votosRespuesta).length > 0) {
          // No todos votaron aún → aplicar mayoría parcial si es clara
          const mayoria = Math.floor(total / 2) + 1;
          if (numInvalida >= mayoria) {
            updateDoc(
              doc(
                db,
                "salas",
                salaId,
                "rondas",
                rondaActual.id,
                "respuestas",
                resp.id
              ),
              { invalida: true, motivoVotos: `Mayoría: ${numInvalida}❌` }
            ).catch(() => {});
          } else if (numValida >= mayoria) {
            updateDoc(
              doc(
                db,
                "salas",
                salaId,
                "rondas",
                rondaActual.id,
                "respuestas",
                resp.id
              ),
              { invalida: false, motivoVotos: `Mayoría: ${numValida}✅` }
            ).catch(() => {});
          }
        }
      });

      unsuscribirVotosRef.current.push(unsub);
    });

    return () => {
      unsuscribirVotosRef.current.forEach((u) => u());
      unsuscribirVotosRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaId, rondaActual?.id, respuestas.length, jugadores.length]);

  // ── Emitir voto ───────────────────────────────────────────────────────────
  const emitirVoto = async (respuestaId, voto) => {
    if (!user || !salaId || !rondaActual?.id) return;

    const votoRef = doc(
      db,
      "salas",
      salaId,
      "rondas",
      rondaActual.id,
      "respuestas",
      respuestaId,
      "votos",
      user.uid
    );

    const votoActual = votos[respuestaId]?.[user.uid];

    if (votoActual === voto) {
      // Si pulsa el mismo voto → retirar voto
      await deleteDoc(votoRef).catch(() => {});
    } else {
      await setDoc(votoRef, { voto, userId: user.uid }).catch(() => {});
    }
  };

  // ── Toggle manual del anfitrión ───────────────────────────────────────────
  const toggleValidacion = async (respuestaId) => {
    if (!esCreador) {
      toast.error("Solo el anfitrión puede cambiar esto directamente");
      return;
    }
    const nuevaEsInvalida = !validaciones[respuestaId];
    setValidaciones((prev) => ({ ...prev, [respuestaId]: nuevaEsInvalida }));
    try {
      await updateDoc(
        doc(
          db,
          "salas",
          salaId,
          "rondas",
          rondaActual.id,
          "respuestas",
          respuestaId
        ),
        { invalida: nuevaEsInvalida, motivoIA: null }
      );
    } catch (err) {
      setValidaciones((prev) => ({ ...prev, [respuestaId]: !nuevaEsInvalida }));
      toast.error("Error al guardar");
    }
  };

  // ── Calcular puntos ────────────────────────────────────────────────────────
  const calcularPuntos = (userId) => {
    let puntos = 0;
    const respuestasUser = respuestas.filter((r) => r.userId === userId);
    categorias.forEach((cat) => {
      const respuesta = respuestasUser.find((r) => r.categoria === cat.id);
      if (!respuesta?.palabra) return;
      if (validaciones[respuesta.id]) return;
      const otras = respuestas.filter(
        (r) =>
          r.categoria === cat.id &&
          r.userId !== userId &&
          !validaciones[r.id] &&
          normalizarPalabra(r.palabra) === normalizarPalabra(respuesta.palabra)
      );
      if (otras.length === 0) puntos += 1;
      else if (otras.length === 1) puntos += 0.5;
    });
    return puntos;
  };

  const handleSiguienteRonda = async () => {
    setCargando(true);
    await onSiguienteRonda();
    setCargando(false);
  };

  const handleFinalizar = async () => {
    setCargando(true);
    await onFinalizarJuego();
    setCargando(false);
  };

  const jugadoresOrdenados = [...jugadores].sort(
    (a, b) => calcularPuntos(b.userId) - calcularPuntos(a.userId)
  );

  // Helper: resumen de votos de una respuesta
  const getResumenVotos = (respuestaId) => {
    const v = votos[respuestaId] || {};
    const validos = Object.values(v).filter((x) => x === "valida").length;
    const invalidos = Object.values(v).filter((x) => x === "invalida").length;
    return {
      validos,
      invalidos,
      total: validos + invalidos,
      miVoto: v[user?.uid],
    };
  };

  return (
    <div>
      <h1>📋 Revisión de Respuestas</h1>

      {/* Cabecera */}
      <div
        style={{
          background: "var(--primary-light)",
          padding: "1.5rem",
          borderRadius: "var(--radius-lg)",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.2rem" }}>
          Ronda <strong>{rondaActual?.numero}</strong> — Letra:{" "}
          <strong style={{ fontSize: "1.8rem", color: "var(--primary-dark)" }}>
            {rondaActual?.letra}
          </strong>
        </p>
        <p style={{ color: "var(--gray-700)", marginTop: "0.4rem" }}>
          {rondaActual?.usuarioStopId
            ? `🛑 Finalizada por: ${
                jugadores.find((j) => j.userId === rondaActual.usuarioStopId)
                  ?.nombre || "un jugador"
              }`
            : "⏰ Finalizada por tiempo"}
        </p>
      </div>

      {/* Info votación */}
      <div
        style={{
          padding: "0.6rem 1rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1rem",
          background: "rgba(139,92,246,0.06)",
          border: "1px solid var(--primary-light)",
          fontSize: "0.85rem",
          color: "var(--gray-700)",
        }}
      >
        🗳️ Vota sobre cada palabra pulsando <strong>👍</strong> o{" "}
        <strong>👎</strong>. Si hay mayoría de votos en contra, la palabra queda
        invalidada.
        {esCreador && (
          <span style={{ marginLeft: "8px" }}>
            Como anfitrión también puedes usar ❌/✅ para decidir directamente.
          </span>
        )}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "500px",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Jugador</th>
              {categorias.map((cat) => (
                <th key={cat.id} style={thStyle} title={cat.nombre}>
                  {cat.icono}
                </th>
              ))}
              <th style={{ ...thStyle, color: "var(--primary)" }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {jugadoresOrdenados.map((jugador, idx) => {
              const puntos = calcularPuntos(jugador.userId);
              return (
                <tr
                  key={jugador.id}
                  style={{
                    background: idx % 2 === 0 ? "white" : "var(--gray-50)",
                  }}
                >
                  <td style={tdStyle}>
                    <strong>{jugador.nombre}</strong>
                    {idx === 0 && <span style={{ marginLeft: "6px" }}>🏆</span>}
                  </td>
                  {categorias.map((cat) => {
                    const respuesta = respuestas.find(
                      (r) =>
                        r.userId === jugador.userId && r.categoria === cat.id
                    );
                    const esInvalida = respuesta
                      ? !!validaciones[respuesta.id]
                      : false;
                    const numCoincidencias =
                      !respuesta || esInvalida
                        ? 0
                        : respuestas.filter(
                            (r) =>
                              r.categoria === cat.id &&
                              r.userId !== jugador.userId &&
                              !validaciones[r.id] &&
                              normalizarPalabra(r.palabra) ===
                                normalizarPalabra(respuesta.palabra)
                          ).length;

                    const bgColor = !respuesta
                      ? "transparent"
                      : esInvalida
                      ? "#fee2e2"
                      : numCoincidencias === 0
                      ? "#d1fae5"
                      : numCoincidencias === 1
                      ? "#fef3c7"
                      : "#fee2e2";

                    const {
                      validos,
                      invalidos,
                      total: totalVotos,
                      miVoto,
                    } = respuesta
                      ? getResumenVotos(respuesta.id)
                      : {
                          validos: 0,
                          invalidos: 0,
                          totalVotos: 0,
                          miVoto: null,
                        };

                    return (
                      <td
                        key={cat.id}
                        style={{
                          ...tdStyle,
                          background: bgColor,
                          textAlign: "center",
                          verticalAlign: "top",
                          paddingTop: "8px",
                        }}
                      >
                        {respuesta ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {/* Palabra */}
                            <span
                              style={{
                                textDecoration: esInvalida
                                  ? "line-through"
                                  : "none",
                                color: esInvalida
                                  ? "var(--gray-500)"
                                  : "inherit",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                              }}
                            >
                              {respuesta.palabra}
                            </span>

                            {/* Botones de voto */}
                            <div
                              style={{
                                display: "flex",
                                gap: "3px",
                                alignItems: "center",
                              }}
                            >
                              <button
                                onClick={() =>
                                  emitirVoto(respuesta.id, "valida")
                                }
                                title="Votar válida"
                                style={{
                                  background:
                                    miVoto === "valida"
                                      ? "#16a34a"
                                      : "rgba(0,0,0,0.06)",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  padding: "2px 5px",
                                  fontSize: "0.75rem",
                                  color:
                                    miVoto === "valida" ? "white" : "inherit",
                                  fontWeight:
                                    miVoto === "valida" ? "bold" : "normal",
                                }}
                              >
                                👍{validos > 0 ? ` ${validos}` : ""}
                              </button>
                              <button
                                onClick={() =>
                                  emitirVoto(respuesta.id, "invalida")
                                }
                                title="Votar inválida"
                                style={{
                                  background:
                                    miVoto === "invalida"
                                      ? "#dc2626"
                                      : "rgba(0,0,0,0.06)",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  padding: "2px 5px",
                                  fontSize: "0.75rem",
                                  color:
                                    miVoto === "invalida" ? "white" : "inherit",
                                  fontWeight:
                                    miVoto === "invalida" ? "bold" : "normal",
                                }}
                              >
                                👎{invalidos > 0 ? ` ${invalidos}` : ""}
                              </button>
                              {/* Override anfitrión */}
                              {esCreador && (
                                <button
                                  onClick={() => toggleValidacion(respuesta.id)}
                                  title={
                                    esInvalida
                                      ? "Marcar válida"
                                      : "Marcar inválida"
                                  }
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "0.75rem",
                                    padding: "2px 3px",
                                  }}
                                >
                                  {esInvalida ? "✅" : "❌"}
                                </button>
                              )}
                            </div>

                            {/* Motivo votos si hay */}
                            {respuesta.motivoVotos && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  color: "var(--gray-500)",
                                }}
                              >
                                {respuesta.motivoVotos}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--gray-400)" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "bold",
                      color: "var(--primary)",
                      textAlign: "center",
                      fontSize: "1.1rem",
                    }}
                  >
                    {puntos.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          fontSize: "0.78rem",
          color: "var(--gray-600)",
        }}
      >
        <span>
          <span
            style={{
              background: "#d1fae5",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Verde
          </span>{" "}
          = única (1 pto)
        </span>
        <span>
          <span
            style={{
              background: "#fef3c7",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Amarillo
          </span>{" "}
          = coincide (0.5 pts)
        </span>
        <span>
          <span
            style={{
              background: "#fee2e2",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            Rojo
          </span>{" "}
          = inválida (0 pts)
        </span>
      </div>

      {/* Botones */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {esCreador ? (
          <>
            <button
              className="btn btn-primary"
              onClick={handleSiguienteRonda}
              disabled={cargando}
              style={{ minWidth: "160px" }}
            >
              {cargando ? "..." : "▶️ Siguiente Ronda"}
            </button>
            <button
              className="btn"
              onClick={handleFinalizar}
              disabled={cargando}
              style={{
                minWidth: "160px",
                background: "var(--success)",
                color: "white",
                border: "none",
              }}
            >
              {cargando ? "..." : "🏆 Finalizar Juego"}
            </button>
          </>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "1rem",
              background: "var(--gray-100)",
              borderRadius: "var(--radius-lg)",
              color: "var(--gray-700)",
            }}
          >
            ⏳ Esperando al anfitrión para continuar...
          </div>
        )}
      </div>
    </div>
  );
};

const thStyle = {
  padding: "0.6rem 0.5rem",
  background: "var(--gray-100)",
  borderBottom: "2px solid var(--gray-200)",
  textAlign: "center",
  fontWeight: 600,
};

const tdStyle = {
  padding: "0.5rem",
  borderBottom: "1px solid var(--gray-100)",
};

export default RevisionRespuestas;
