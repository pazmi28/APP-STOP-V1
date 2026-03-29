import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/layout/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CrearSala from "./pages/CrearSala"; // <-- NUEVA IMPORTACIÓN
import UnirseSala from "./pages/UnirseSala"; // <-- NUEVA IMPORTACIÓN
import SalaEspera from "./pages/SalaEspera"; // <-- NUEVA IMPORTACIÓN
import Juego from "./pages/Juego"; // <-- NUEVA IMPORTACIÓN

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#333",
              color: "#fff",
            },
          }}
        />
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Privadas con Layout */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="crear-sala" element={<CrearSala />} />{" "}
            {/* <-- NUEVA RUTA */}
            <Route path="unirse-sala" element={<UnirseSala />} />{" "}
            {/* <-- NUEVA RUTA */}
            <Route path="sala/:salaId" element={<SalaEspera />} />{" "}
            {/* <-- NUEVA RUTA */}
            <Route path="juego/:salaId" element={<Juego />} />
            {/* Aquí añadiremos más rutas en sprints posteriores */}
          </Route>

          {/* Catch-all: Redirige a login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
