import { useEffect, useState, useRef } from "react";

// Genera un pitido via Web Audio API (sin ficheros externos)
const playBeep = (frequency = 880, duration = 0.15, volume = 0.4) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.type = "square";
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // sin audio si el navegador lo bloquea
  }
};

const Timer = ({ segundos, isActive, tiempoTotal = 60 }) => {
  const [porcentaje, setPorcentaje] = useState(100);
  const prevSegundosRef = useRef(null);

  useEffect(() => {
    if (segundos !== null && segundos !== undefined) {
      const nuevoPorcentaje = (segundos / tiempoTotal) * 100;
      setPorcentaje(Math.max(0, Math.min(100, nuevoPorcentaje)));

      // Pitidos de urgencia: últimos 10 segundos, cada segundo
      if (
        isActive &&
        segundos <= 10 &&
        segundos > 0 &&
        prevSegundosRef.current !== segundos
      ) {
        // Últimos 5 segundos: doble pitido más agudo
        if (segundos <= 5) {
          playBeep(1200, 0.1, 0.5);
          setTimeout(() => playBeep(1000, 0.1, 0.4), 150);
        } else {
          playBeep(880, 0.12, 0.35);
        }
      }
      prevSegundosRef.current = segundos;
    }
  }, [segundos, isActive, tiempoTotal]);

  const formatTime = (t) => {
    if (t === null || t === undefined) return "00:00";
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getColor = () => {
    if (!segundos) return "var(--gray-500)";
    if (segundos > tiempoTotal * 0.5) return "var(--success)";
    if (segundos > tiempoTotal * 0.2) return "var(--warning)";
    return "var(--danger)";
  };

  const urgent = isActive && segundos !== null && segundos <= 5 && segundos > 0;

  if (segundos === null || segundos === undefined) {
    return (
      <div style={{ textAlign: "center", marginBottom: "var(--spacing-lg)" }}>
        <p style={{ color: "var(--gray-500)" }}>Preparando ronda...</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginBottom: "var(--spacing-lg)" }}>
      <div
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          fontFamily: "monospace",
          color: getColor(),
          transition: "color 0.3s ease",
          animation: urgent ? "pulseTimer 0.5s infinite" : "none",
        }}
      >
        {formatTime(segundos)}
      </div>

      <div
        style={{
          width: "100%",
          height: urgent ? "12px" : "8px",
          background: "var(--gray-200)",
          borderRadius: "var(--radius-full)",
          marginTop: "var(--spacing-xs)",
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: "100%",
            background: getColor(),
            transition: "width 1s linear, background 0.3s ease",
            borderRadius: "var(--radius-full)",
          }}
        />
      </div>
    </div>
  );
};

export default Timer;
