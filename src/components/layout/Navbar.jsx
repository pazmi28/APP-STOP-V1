import Sidebar from "./Sidebar";

const Navbar = ({ toggleSidebar }) => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="logo">
          <span>🛑</span> Stop Online
        </div>
        {/* En desktop, el sidebar se renderiza aquí */}
        <div className="desktop-sidebar-container">
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
      </div>
      <button className="hamburger-btn" onClick={toggleSidebar}>
        ☰
      </button>
    </nav>
  );
};

export default Navbar;
