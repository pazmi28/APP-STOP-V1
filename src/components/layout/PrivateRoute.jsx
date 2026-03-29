import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#6B7280",
        }}
      >
        Cargando...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
