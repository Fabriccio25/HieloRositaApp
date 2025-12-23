import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection, updateDocument } from '../hooks/useFirestore';
import { UserPlus, Shield, User, Edit2, Search, Lock } from 'lucide-react';

const UserModal = ({ isOpen, onClose, user = null, onCreate }) => {
    const [username, setUsername] = useState(user?.username || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(user?.role || 'registrar');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg({ type: '', text: '' });

        try {
            if (user) {
                // EDIT MODE (Only Role)
                await updateDocument('users', user.id, { role });
                onClose();
            } else {
                // CREATE MODE
                if (password.length < 6) {
                    setMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
                    setLoading(false);
                    return;
                }
                await onCreate(username, password, role);
                onClose();
            }
        } catch (error) {
            console.error(error);
            let errorText = 'Error al procesar.';
            if (error.code === 'auth/email-already-in-use') errorText = 'El usuario ya existe.';
            setMsg({ type: 'error', text: errorText });
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay flex-center">
            <div className="glass-card modal-content animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                </div>

                {msg.text && (
                    <div className={`alert ${msg.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-stack">
                    <div className="input-group">
                        <label>Nombre de Usuario</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Ej: vendedor1"
                                required
                                disabled={!!user} // Cant edit username once created
                                style={user ? { opacity: 0.5 } : {}}
                            />
                        </div>
                    </div>

                    {!user && (
                        <div className="input-group">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <Shield size={18} />
                                <input
                                    type="text"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Contraseña segura"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Rol / Cargo</label>
                        <select value={role} onChange={e => setRole(e.target.value)} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.8rem', borderRadius: 'var(--radius-sm)', width: '100%' }}>
                            <option value="registrar">Registrador (Ventas, Historial)</option>
                            <option value="admin">Administrador (Total)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-full mt-4">
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </form>
            </div>
            <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 1000; }
        .modal-content { width: 90%; max-width: 400px; padding: 2rem; }
        .form-stack { display: flex; flex-direction: column; gap: 1.2rem; }
        .input-group label { display: block; font-size: 0.9rem; margin-bottom: 0.5rem; opacity: 0.8; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper svg { position: absolute; left: 10px; opacity: 0.5; }
        .input-wrapper input { padding-left: 35px; width: 100%; box-sizing: border-box; }
        .alert-error { background: rgba(255, 68, 68, 0.2); color: #ff4444; padding: 0.8rem; border-radius: var(--radius-sm); margin-bottom: 1rem; text-align: center; }
      `}</style>
        </div>
    );
};

const AdminUsers = () => {
    const { createUser } = useAuth();
    const { data: users, loading } = useCollection('users');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const handleCreate = async (username, password, role) => {
        await createUser(username, password, role); // From AuthContext
    };

    const openNew = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Administración</h1>
                    <p className="subtitle">Gestión de usuarios y permisos</p>
                </div>
                <button onClick={openNew} className="btn btn-primary">
                    <UserPlus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className="table-container glass-card">
                {loading ? (
                    <div className="p-8 text-center">Cargando usuarios...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Cargo</th>
                                <th>Fecha Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.8rem' }}>
                                            <div className="avatar-placeholder">{user.username?.charAt(0).toUpperCase()}</div>
                                            <span>{user.username}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-registrar'}`}>
                                            {user.role === 'admin' ? 'Administrador' : 'Registrador'}
                                        </span>
                                    </td>
                                    <td style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                    </td>
                                    <td>
                                        <button onClick={() => openEdit(user)} className="btn-icon btn-secondary">
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && users.length === 0 && (
                    <div className="empty-state">No hay usuarios registrados.</div>
                )}
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={editingUser}
                onCreate={handleCreate}
            />

            <style>{`
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .data-table th, .data-table td { padding: 1.2rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .data-table th { font-weight: 500; opacity: 0.7; font-size: 0.9rem; letter-spacing: 0.5px; }
        
        .avatar-placeholder {
            width: 32px; height: 32px;
            background: linear-gradient(135deg, var(--color-primary), #a855f7);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.8rem;
        }

        .badge { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .badge-admin { background: rgba(255, 215, 0, 0.15); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.3); }
        .badge-registrar { background: rgba(64, 224, 208, 0.15); color: #40e0d0; border: 1px solid rgba(64, 224, 208, 0.3); }

        .btn-icon { padding: 0.5rem; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-secondary { background: rgba(255,255,255,0.05); color: white; }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        
        .empty-state { padding: 3rem; text-align: center; opacity: 0.6; }
      `}</style>
        </div>
    );
};

export default AdminUsers;
