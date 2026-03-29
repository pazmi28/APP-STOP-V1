import { useEffect, useRef } from "react";

const playBeep = (freq = 440, duration = 0.25) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

const CuentaAtras = ({ cuenta, letra }) => {
  const prevCuentaRef = useRef(null);

  useEffect(() => {
    if (cuenta !== prevCuentaRef.current && cuenta !== null) {
      const freq = cuenta === 1 ? 880 : 440;
      playBeep(freq, 0.2);
      prevCuentaRef.current = cuenta;
    }
  }, [cuenta]);

  const color = cuenta === 1 ? "var(--danger)" : "var(--primary)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "1.5rem",
        animation: "zoomIn 0.3s ease",
      }}
    >
      {letra && (
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--gray-500)",
              fontSize: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            La letra de esta ronda es
          </p>
          <div
            style={{
              fontSize: "5rem",
              fontWeight: "bold",
              color: "var(--primary)",
              lineHeight: 1,
            }}
          >
            {letra}
          </div>
        </div>
      )}

      <p style={{ fontSize: "1.2rem", color: "var(--gray-700)" }}>
        La ronda empieza en...
      </p>

      <div
        key={cuenta}
        style={{
          fontSize: "7rem",
          fontWeight: "bold",
          color,
          fontFamily: "monospace",
          lineHeight: 1,
          animation: "zoomIn 0.25s ease",
          textShadow: cuenta === 1 ? `0 0 30px ${color}` : "none",
        }}
      >
        {cuenta}
      </div>
    </div>
  );
};

export default CuentaAtras;
