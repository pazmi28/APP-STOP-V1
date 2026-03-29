import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmar = window.confirm("¿Seguro que quieres cerrar sesión?");
    if (confirmar) {
      await logout();
      navigate("/login");
      onClose();
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar-mobile ${isOpen ? "open" : ""}`}>
        <button className="close-sidebar" onClick={onClose}>
          ×
        </button>
        <ul>
          <li className="user-info">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>Jugador</span>
              <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                {user?.email?.split("@")[0] || "Usuario"}
              </span>
            </div>
          </li>
          <li onClick={() => handleNavigation("/dashboard")}>
            <span>📊</span> Dashboard
          </li>
          <li onClick={() => handleNavigation("/crear-sala")}>
            <span>🎮</span> Crear Sala
          </li>
          <li onClick={() => handleNavigation("/unirse-sala")}>
            <span>🔗</span> Unirse a Sala
          </li>
          <li onClick={handleLogout}>
            <span>🚪</span> Cerrar Sesión
          </li>
        </ul>
      </div>
    </>
  );
};

export default MobileSidebar;
