import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to fake email for username login
  const getEmail = (user) => `${user.toLowerCase().replace(/\s+/g, '')}@sales.app`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = getEmail(username);

    try {
      if (isRegistering) {
        await signup(email, password, username);
        // Signup automatically logs in
        navigate('/');
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      if (isRegistering) {
        if (err.code === 'auth/email-already-in-use') setError('Este usuario ya existe.');
        else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
        else if (err.code === 'auth/operation-not-allowed') setError('Error: Debe habilitar "Correo/Contraseña" en Firebase Console -> Authentication.');
        else setError(`Error: ${err.code || err.message}`);
      } else {
        if (err.code === 'auth/invalid-credential') setError('Usuario o contraseña incorrectos.');
        else setError(`Error al iniciar sesión: ${err.code}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container flex-center">
      <div className="glass-card login-card animate-slide-up">
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 className="logo-text" style={{ margin: 0 }}>Registros<span style={{ color: 'var(--color-primary)' }}>HR</span></h1>
            <img src="/logo-hr.png" alt="HR" style={{ width: '60px' }} />
          </div>
          <p style={{ opacity: 0.7 }}>
            {isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="Ej: juanperez"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Procesando...' : (
              isRegistering ? (
                <><UserPlus size={18} /> Registrarme</>
              ) : (
                <><LogIn size={18} /> Entrar</>
              )
            )}
          </button>
        </form>


      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, rgba(100, 50, 255, 0.15) 0%, transparent 60%);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
        }
        .logo-text {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .alert-error {
          background: rgba(255, 68, 68, 0.2);
          color: #ff4444;
          padding: 0.8rem;
          border-radius: var(--radius-sm);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          text-align: center;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        @media (max-width: 480px) {
            .login-card { padding: 1.5rem; }
            .logo-text { font-size: 2rem; }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.9rem;
          margin-left: 0.2rem;
          opacity: 0.8;
        }
        .link-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: bold;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
