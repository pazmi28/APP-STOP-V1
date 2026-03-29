import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileSidebar from "./MobileSidebar";
import { useState } from "react";
import "../../styles/global.css";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app">
      <Navbar toggleSidebar={toggleSidebar} />
      <MobileSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
