import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSalas } from "../hooks/useSalas";
import toast from "react-hot-toast";

const CrearSala = () => {
  const [tiempo, setTiempo] = useState(60);
  const [creando, setCreando] = useState(false);
  const navigate = useNavigate();
  const { crearSala } = useSalas();

  const handleCrearSala = async () => {
    setCreando(true);
    const result = await crearSala(tiempo);
    setCreando(false);

    if (result.success) {
      navigate(`/sala/${result.salaId}`);
    }
  };

  return (
    <div>
      <h1>🎮 Crear Nueva Sala</h1>

      <div className="card">
        <h3>Configuración de la partida</h3>

        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <p
            style={{
              color: "var(--gray-600)",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            Al crear una sala, generarás un código único que podrás compartir
            con tus amigos. Ellos podrán unirse usando ese código.
          </p>

          <div className="form-group">
            <label className="form-label">Tiempo por partida (segundos)</label>
            <select
              className="form-input"
              value={tiempo}
              onChange={(e) => setTiempo(Number(e.target.value))}
              style={{ maxWidth: "200px" }}
            >
              <option value={30}>30 segundos</option>
              <option value={60}>60 segundos</option>
              <option value={90}>90 segundos</option>
              <option value={120}>120 segundos</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
          <button
            className="btn btn-primary"
            onClick={handleCrearSala}
            disabled={creando}
          >
            {creando ? "Creando sala..." : "Crear Sala →"}
          </button>

          <button className="btn" onClick={() => navigate("/dashboard")}>
            ← Volver
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div
        style={{
          marginTop: "var(--spacing-lg)",
          background: "var(--primary-light)",
          padding: "var(--spacing-lg)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <h4
          style={{
            color: "var(--primary-dark)",
            marginBottom: "var(--spacing-sm)",
          }}
        >
          📌 ¿Cómo funciona?
        </h4>
        <ul
          style={{ marginLeft: "var(--spacing-lg)", color: "var(--gray-700)" }}
        >
          <li>Se generará un código único de 6 caracteres</li>
          <li>Comparte el código con tus amigos</li>
          <li>Todos los jugadores deben unirse antes de comenzar</li>
          <li>El creador de la sala puede iniciar la partida</li>
        </ul>
      </div>
    </div>
  );
};

export default CrearSala;
