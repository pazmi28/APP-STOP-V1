// ResultadosFinales.jsx
// Se muestra cuando el juego termina completamente.
// Recupera respuestas de todas las rondas y calcula la puntuación total.

import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { normalizarPalabra } from "../../utils/letras";

const ResultadosFinales = ({
  todasLasRondas,
  jugadores,
  categorias,
  sala,
  onVolverDashboard,
}) => {
  // historial: { [rondaId]: [respuesta, ...] }
  const [historial, setHistorial] = useState({});
  const [cargando, setCargando] = useState(true);

  // Cargar respuestas de TODAS las rondas desde Firestore
  useEffect(() => {
    const cargarTodo = async () => {
      if (!sala?.id && !todasLasRondas?.length) return;

      const salaId = sala?.id;
      const nuevo = {};

      for (const ronda of todasLasRondas) {
        try {
          const respRef = collection(
            db,
            "salas",
            salaId,
            "rondas",
            ronda.id,
            "respuestas"
          );
          const snap = await getDocs(respRef);
          nuevo[ronda.id] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch (e) {
          nuevo[ronda.id] = [];
        }
      }

      setHistorial(nuevo);
      setCargando(false);
    };

    cargarTodo();
  }, [todasLasRondas, sala?.id]);

  // Calcular puntos de un jugador en una ronda concreta
  const calcularPuntosRonda = (userId, rondaId) => {
    const respuestasRonda = historial[rondaId] || [];
    let puntos = 0;

    categorias.forEach((cat) => {
      const respuesta = respuestasRonda.find(
        (r) => r.userId === userId && r.categoria === cat.id
      );
      if (!respuesta?.palabra) return;
      // Respetar invalidaciones guardadas en Firestore
      if (respuesta.invalida === true) return;

      const otras = respuestasRonda.filter(
        (r) =>
          r.categoria === cat.id &&
          r.userId !== userId &&
          r.invalida !== true &&
          normalizarPalabra(r.palabra) === normalizarPalabra(respuesta.palabra)
      );

      // 0 coincidencias=1pt, 1 coincidencia=0.5pt, 2+ coincidencias=0pt
      if (otras.length === 0) puntos += 1;
      else if (otras.length === 1) puntos += 0.5;
      // else 0
    });

    return puntos;
  };

  // Calcular puntos totales de un jugador
  const calcularPuntosTotal = (userId) => {
    return todasLasRondas.reduce((acc, ronda) => {
      return acc + calcularPuntosRonda(userId, ronda.id);
    }, 0);
  };

  // Ordenar jugadores por puntos totales
  const jugadoresOrdenados = [...jugadores].sort(
    (a, b) => calcularPuntosTotal(b.userId) - calcularPuntosTotal(a.userId)
  );

  const ganador = jugadoresOrdenados[0];

  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ fontSize: "2rem" }}>⏳</p>
        <p>Calculando resultados...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>🏆 Resultados Finales</h1>

      {/* Ganador */}
      {ganador && (
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)",
            color: "white",
            padding: "2rem",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "3rem" }}>🏆</div>
          <h2 style={{ margin: "0.5rem 0", fontSize: "2rem" }}>
            {ganador.nombre}
          </h2>
          <p style={{ opacity: 0.9, fontSize: "1.2rem" }}>
            {calcularPuntosTotal(ganador.userId).toFixed(1)} puntos
          </p>
          <p style={{ opacity: 0.7, marginTop: "0.25rem" }}>
            Sala: {sala?.codigo} · {todasLasRondas.length} ronda
            {todasLasRondas.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Tabla resumen por jugador y ronda */}
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "400px",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Jugador</th>
              {todasLasRondas.map((ronda) => (
                <th
                  key={ronda.id}
                  style={thStyle}
                  title={`Ronda ${ronda.numero}`}
                >
                  R{ronda.numero}
                  <br />
                  <span
                    style={{
                      fontWeight: "normal",
                      fontSize: "0.75rem",
                      opacity: 0.8,
                    }}
                  >
                    {ronda.letra}
                  </span>
                </th>
              ))}
              <th
                style={{
                  ...thStyle,
                  color: "var(--primary)",
                  fontSize: "1rem",
                }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {jugadoresOrdenados.map((jugador, idx) => {
              const total = calcularPuntosTotal(jugador.userId);
              return (
                <tr
                  key={jugador.id}
                  style={{
                    background:
                      idx === 0
                        ? "rgba(139, 92, 246, 0.06)"
                        : idx % 2 === 0
                        ? "white"
                        : "var(--gray-50)",
                  }}
                >
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontWeight: "bold",
                      width: "40px",
                    }}
                  >
                    {idx === 0
                      ? "🥇"
                      : idx === 1
                      ? "🥈"
                      : idx === 2
                      ? "🥉"
                      : idx + 1}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: "bold" }}>
                    {jugador.nombre}
                  </td>
                  {todasLasRondas.map((ronda) => {
                    const pts = calcularPuntosRonda(jugador.userId, ronda.id);
                    return (
                      <td
                        key={ronda.id}
                        style={{ ...tdStyle, textAlign: "center" }}
                      >
                        {pts > 0 ? (
                          <span
                            style={{
                              color: "var(--success)",
                              fontWeight: "bold",
                            }}
                          >
                            {pts.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: "var(--gray-400)" }}>0</span>
                        )}
                      </td>
                    );
                  })}
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                      color: "var(--primary)",
                    }}
                  >
                    {total.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detalle por ronda */}
      <h3 style={{ marginBottom: "1rem" }}>📝 Detalle por ronda</h3>
      {todasLasRondas.map((ronda) => {
        const respuestasRonda = historial[ronda.id] || [];
        return (
          <div
            key={ronda.id}
            style={{
              marginBottom: "1rem",
              border: "1px solid var(--gray-200)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: "var(--primary-light)",
                padding: "0.75rem 1rem",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <strong>Ronda {ronda.numero}</strong>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "var(--primary-dark)",
                }}
              >
                {ronda.letra}
              </span>
              <span style={{ color: "var(--gray-700)", fontSize: "0.85rem" }}>
                {ronda.usuarioStopId
                  ? `🛑 STOP por ${
                      jugadores.find((j) => j.userId === ronda.usuarioStopId)
                        ?.nombre || "jugador"
                    }`
                  : "⏰ Por tiempo"}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "400px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: "left" }}>Jugador</th>
                    {categorias.map((cat) => (
                      <th key={cat.id} style={thStyle} title={cat.nombre}>
                        {cat.icono}
                      </th>
                    ))}
                    <th style={{ ...thStyle, color: "var(--primary)" }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {jugadores.map((jugador) => {
                    const pts = calcularPuntosRonda(jugador.userId, ronda.id);
                    return (
                      <tr key={jugador.id}>
                        <td style={tdStyle}>{jugador.nombre}</td>
                        {categorias.map((cat) => {
                          const resp = respuestasRonda.find(
                            (r) =>
                              r.userId === jugador.userId &&
                              r.categoria === cat.id
                          );
                          const esInvalida = resp?.invalida === true;
                          const numCoincidencias =
                            !resp || esInvalida
                              ? 0
                              : respuestasRonda.filter(
                                  (r) =>
                                    r.categoria === cat.id &&
                                    r.userId !== jugador.userId &&
                                    r.invalida !== true &&
                                    normalizarPalabra(r.palabra) ===
                                      normalizarPalabra(resp.palabra)
                                ).length;
                          const bg = !resp
                            ? "transparent"
                            : esInvalida
                            ? "#fee2e2"
                            : numCoincidencias === 0
                            ? "#d1fae5"
                            : numCoincidencias === 1
                            ? "#fef3c7"
                            : "#fee2e2";
                          return (
                            <td
                              key={cat.id}
                              style={{
                                ...tdStyle,
                                textAlign: "center",
                                background: bg,
                                fontSize: "0.85rem",
                              }}
                            >
                              <span
                                style={{
                                  textDecoration: esInvalida
                                    ? "line-through"
                                    : "none",
                                  color: esInvalida
                                    ? "var(--gray-500)"
                                    : "inherit",
                                }}
                              >
                                {resp?.palabra || (
                                  <span style={{ color: "var(--gray-400)" }}>
                                    -
                                  </span>
                                )}
                              </span>
                            </td>
                          );
                        })}
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: "bold",
                            color: "var(--primary)",
                          }}
                        >
                          {pts.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}
      >
        <button
          className="btn btn-primary"
          onClick={onVolverDashboard}
          style={{ minWidth: "200px" }}
        >
          🏠 Volver al inicio
        </button>
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
  fontSize: "0.85rem",
};

const tdStyle = {
  padding: "0.5rem",
  borderBottom: "1px solid var(--gray-100)",
};

export default ResultadosFinales;
