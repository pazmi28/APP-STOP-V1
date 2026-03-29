const BotonStop = ({ onClick, disabled, quienPulso }) => {
  return (
    <div style={{ textAlign: "center", margin: "var(--spacing-xl) 0" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className="btn-stop"
        style={{
          background: disabled ? "var(--gray-500)" : "var(--danger)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transform: disabled ? "none" : undefined,
          animation: disabled ? "none" : "pulse 1.5s infinite",
        }}
      >
        🛑 STOP
      </button>

      {quienPulso && (
        <p
          style={{
            marginTop: "var(--spacing-sm)",
            color: "var(--gray-600)",
            fontSize: "0.9rem",
          }}
        >
          ⏹️ Ronda finalizada por {quienPulso}
        </p>
      )}
    </div>
  );
};

export default BotonStop;
