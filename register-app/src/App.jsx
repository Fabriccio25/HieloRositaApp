import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Products from './pages/Products';
import Clients from './pages/Clients';
import RegisterSale from './pages/RegisterSale';
import RegisterExpense from './pages/RegisterExpense';
import History from './pages/History';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';

// Dashboard Placeholder (Can be simple)
const Dashboard = () => (
  <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>
    <div className="animate-slide-up" style={{ maxWidth: '800px', width: '100%' }}>

      {/* Top Header: Brand Logos Side by Side */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3rem',
        marginBottom: '4rem',
        opacity: 0.9
      }}>
        {/* Hielos Rosita */}
        <div className="flex-center" style={{ gap: '1rem' }}>
          <img src="/img/logo-hr-final.png" alt="Hielos Rosita" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.2)' }}></div>

        {/* Coralix Studio */}
        <div className="flex-center" style={{ gap: '1rem' }}>
          <img src="/img/logo-coralix-final.png" alt="Coralix Studio" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Main Title Area */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '0.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
          Hielos Rosita
        </h1>
        <p style={{ fontSize: '1.5rem', color: 'var(--color-primary)', opacity: 0.9 }}>
          En colaboración con <strong style={{ color: '#fff' }}>Coralix Studio</strong>
        </p>
      </div>

      {/* Quote Card */}
      <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '1.1rem' }}>
          "Innovando para el crecimiento de tu negocio."
        </p>
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', color: 'white' }}>
      <div className="glass-card p-8">
        <h2>Cargando...</h2>
        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Verificando acceso...</p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="sales/new" element={<RegisterSale />} />
            <Route path="expenses/new" element={<RegisterExpense />} />
            <Route path="products" element={<Products />} />
            <Route path="clients" element={<Clients />} />
            <Route path="history" element={<History />} />
            <Route path="admin" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
