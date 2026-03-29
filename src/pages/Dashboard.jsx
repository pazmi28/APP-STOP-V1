import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1>📊 Dashboard</h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "var(--spacing-xl)" }}>
        Bienvenido, <strong>{user?.email}</strong>!
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "var(--spacing-lg)",
          marginTop: "var(--spacing-xl)",
        }}
      >
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h3 style={{ fontSize: "1.5rem" }}>🎮 Crear una sala</h3>
          <p style={{ flex: 1, color: "var(--gray-600)" }}>
            Inicia una nueva partida. Obtendrás un código único para compartir
            con tus amigos y comenzar a jugar.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/crear-sala")}
            style={{ alignSelf: "flex-start" }}
          >
            Crear Sala →
          </button>
        </div>

        <div
          className="card"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <h3 style={{ fontSize: "1.5rem" }}>🔗 Unirse a una sala</h3>
          <p style={{ flex: 1, color: "var(--gray-600)" }}>
            ¿Tienes un código? Únete a una partida existente y demuestra quién
            es el más rápido.
          </p>
          <button
            className="btn"
            onClick={() => navigate("/unirse-sala")}
            style={{ alignSelf: "flex-start" }}
          >
            Unirse a Sala →
          </button>
        </div>
      </div>

      {/* Banner informativo */}
      <div
        style={{
          marginTop: "var(--spacing-xl)",
          background: "var(--gray-100)",
          padding: "var(--spacing-md)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--gray-200)",
        }}
      >
        <p style={{ color: "var(--gray-600)", textAlign: "center" }}>
          🚀 **Sprint 1 completado** • Siguiente: Creación y unión a salas en
          tiempo real
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
