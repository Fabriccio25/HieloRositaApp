import React, { useState } from 'react';
import { useCollection, addDocument, updateDocument } from '../hooks/useFirestore';
import { Plus, Edit2, Users, Search, Phone } from 'lucide-react';

const ClientModal = ({ isOpen, onClose, client = null }) => {
    const [formData, setFormData] = useState({
        firstName: client?.firstName || '',
        lastName: client?.lastName || '',
        phone: client?.phone || ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        try {
            if (client) {
                await updateDocument('clients_v2', client.id, {
                    ...formData,
                    name: fullName // Store full name for easy searching/display
                });
            } else {
                await addDocument('clients_v2', {
                    ...formData,
                    name: fullName
                });
            }
            onClose();
        } catch (error) {
            alert("Error saving client");
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay flex-center">
            <div className="glass-card modal-content animate-slide-up">
                <h2>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                <form onSubmit={handleSubmit} className="form-grid">
                    <input
                        placeholder="Nombres"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        required
                    />
                    <input
                        placeholder="Apellidos"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    <input
                        type="tel"
                        placeholder="Número de Celular"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(5px);
          z-index: 1000;
        }
        .modal-content {
          width: 90%;
          max-width: 400px;
        }
        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
      `}</style>
        </div>
    );
};

const Clients = () => {
    const { data: clients, loading } = useCollection('clients_v2');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Clientes</h1>
                    <p className="subtitle">Base de datos de compradores</p>
                </div>
                <button onClick={openNew} className="btn btn-primary">
                    <Plus size={20} /> Nuevo Cliente
                </button>
            </div>

            <div className="search-bar glass-card flex-center" style={{ justifyContent: 'flex-start', padding: '0.5rem 1rem', marginBottom: '2rem' }}>
                <Search size={20} style={{ opacity: 0.5 }} />
                <input
                    placeholder="Buscar por nombre o teléfono..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', padding: '0.5rem' }}
                />
            </div>

            {loading ? <p>Cargando clientes...</p> : (
                <div className="grid-cards">
                    {filteredClients.map(client => (
                        <div key={client.id} className="glass-card animate-slide-up flex-center" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h3>{client.name}</h3>
                                    {client.phone && (
                                        <p style={{ fontSize: '0.9rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Phone size={12} /> {client.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button onClick={() => handleEdit(client)} className="btn-icon btn-secondary">
                                <Edit2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                client={editingClient}
            />
        </div>
    );
};

export default Clients;
