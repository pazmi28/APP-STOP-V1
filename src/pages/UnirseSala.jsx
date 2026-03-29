import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalas } from "../hooks/useSalas";
import { validarCodigoSala } from "../utils/salaUtils";

const UnirseSala = () => {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [uniendo, setUniendo] = useState(false);
  const navigate = useNavigate();
  const { unirseSala } = useSalas();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validar formato del código
    const codigoLimpio = codigo.toUpperCase().replace(/\s/g, "");
    if (!validarCodigoSala(codigoLimpio)) {
      setError(
        "El código debe tener 6 caracteres (letras mayúsculas y números)"
      );
      return;
    }

    setUniendo(true);
    const result = await unirseSala(codigoLimpio);
    setUniendo(false);

    if (result.success) {
      navigate(`/sala/${result.salaId}`);
    }
  };

  return (
    <div>
      <h1>🔗 Unirse a una Sala</h1>

      <div className="card">
        <h3>Introduce el código de la sala</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Código de sala</label>
            <input
              type="text"
              className="form-input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ej: AB12CD"
              maxLength={6}
              style={{
                textTransform: "uppercase",
                fontFamily: "monospace",
                fontSize: "1.2rem",
                letterSpacing: "2px",
              }}
              autoComplete="off"
            />
            {error && (
              <p
                style={{
                  color: "var(--danger)",
                  fontSize: "0.8rem",
                  marginTop: "4px",
                }}
              >
                {error}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uniendo || codigo.length !== 6}
            >
              {uniendo ? "Uniéndose..." : "Unirse a Sala"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => navigate("/dashboard")}
            >
              ← Volver
            </button>
          </div>
        </form>
      </div>

      {/* Instrucciones */}
      <div
        style={{
          marginTop: "var(--spacing-lg)",
          background: "var(--gray-100)",
          padding: "var(--spacing-lg)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <h4 style={{ marginBottom: "var(--spacing-sm)" }}>📝 Instrucciones</h4>
        <p style={{ color: "var(--gray-600)" }}>
          El código de sala consta de 6 caracteres entre letras mayúsculas y
          números. Te lo proporcionará la persona que creó la sala.
        </p>
      </div>
    </div>
  );
};

export default UnirseSala;
