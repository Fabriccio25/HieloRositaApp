import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Users, Package, History as HistoryIcon, LogOut, Shield, Menu, X, TrendingDown } from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, active, onClick }) => (
  <Link to={to} className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
    <Icon size={20} />
    <span>{label}</span>
  </Link>
);

const Layout = () => {
  const { logout, userData } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button onClick={toggleSidebar} className="menu-btn">
          <Menu size={24} />
        </button>
        <h3>Registro<span style={{ color: 'var(--color-primary)' }}>App</span></h3>
        <div style={{ width: 24 }}></div> {/* Spacer for balance */}
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar - Conditional Class for Mobile */}
      <aside className={`sidebar glass-card ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <span>Menú</span>
          <button onClick={closeSidebar} className="close-btn"><X size={24} /></button>
        </div>

        <div className="logo-area">
          <h2>Registro<span style={{ color: 'var(--color-primary)' }}>App</span></h2>
          <p className="role-badge">{userData?.role || 'User'}</p>
        </div>

        <nav className="nav-menu">
          <SidebarItem to="/" icon={LayoutDashboard} label="Inicio" active={location.pathname === '/'} onClick={closeSidebar} />
          <SidebarItem to="/sales/new" icon={ShoppingCart} label="Registrar Venta" active={location.pathname === '/sales/new'} onClick={closeSidebar} />
          <SidebarItem to="/expenses/new" icon={TrendingDown} label="Registrar Gasto" active={location.pathname === '/expenses/new'} onClick={closeSidebar} />
          <SidebarItem to="/products" icon={Package} label="Productos" active={location.pathname === '/products'} onClick={closeSidebar} />
          <SidebarItem to="/clients" icon={Users} label="Clientes" active={location.pathname === '/clients'} onClick={closeSidebar} />
          <SidebarItem to="/history" icon={HistoryIcon} label="Historial" active={location.pathname === '/history'} onClick={closeSidebar} />

          <SidebarItem to="/admin" icon={Shield} label="ADMINISTRADOR" active={location.pathname === '/admin'} onClick={closeSidebar} />
        </nav>

        <div className="user-area">
          <button onClick={logout} className="btn btn-secondary w-full">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="container content-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        .app-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        .mobile-header {
           display: none; /* Hidden on Desktop */
           position: sticky; top: 0; z-index: 50;
           background: rgba(30, 30, 30, 0.95);
           backdrop-filter: blur(10px);
           padding: 1rem;
           border-bottom: 1px solid rgba(255,255,255,0.1);
           align-items: center;
           justify-content: space-between;
        }

        .sidebar {
          margin: 1rem;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 2rem);
          position: sticky;
          top: 1rem;
          transition: transform 0.3s ease;
          z-index: 100;
        }

        .sidebar-header-mobile { display: none; }
        .sidebar-overlay { display: none; }

        .logo-area {
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--glass-border);
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .role-badge {
          font-size: 0.8rem;
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 10px;
          display: inline-block;
          margin-top: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          color: var(--color-text-muted);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-item.active {
          background: var(--color-primary);
          color: white;
          box-shadow: 0 4px 15px var(--color-primary-glow);
        }

        .content-wrapper {
          padding-top: 2rem;
        }

        /* MOBILE STYLES */
        @media (max-width: 768px) {
          .app-layout {
            display: block; /* Remove grid */
          }
          
          .mobile-header {
            display: flex;
          }

          .sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            margin: 0;
            width: 80%;
            max-width: 300px;
            height: 100vh;
            background: #1e1e1e; /* Solid background for mobile menu */
            border-right: 1px solid rgba(255,255,255,0.1);
            transform: translateX(-100%); /* Hide by default */
            padding: 1.5rem;
            box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          }

          .sidebar.open {
            transform: translateX(0); /* Slide in */
          }

          .logo-area { display: none; } /* Use mobile header instead */
          
          .sidebar-header-mobile { 
             display: flex; justify-content: space-between; align-items: center;
             margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);
             font-size: 1.2rem; font-weight: bold;
          }

          .sidebar-overlay {
            display: block;
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(3px);
            z-index: 90;
            animation: fadeIn 0.3s;
          }

          .main-content {
             padding: 1rem;
          }
          
          .content-wrapper {
             padding-top: 0.5rem;
          }
          
          .menu-btn, .close-btn {
             background: none; border: none; color: white; cursor: pointer; padding: 0.5rem;
          }
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Layout;
