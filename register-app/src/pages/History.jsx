import React, { useState } from 'react';
import { useCollection, updateDocument, deleteDocument } from '../hooks/useFirestore';
import { Search, Calendar, FileText, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EditSaleModal = ({ sale, onClose }) => {
    const [formData, setFormData] = useState({
        client: sale.client,
        quantity: sale.quantity,
        price: sale.price
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const newTotal = Number(formData.quantity) * Number(formData.price);
            await updateDocument('sales_v2', sale.id, {
                client: formData.client,
                quantity: Number(formData.quantity),
                price: Number(formData.price),
                total: newTotal
            });
            onClose();
        } catch (error) {
            console.error("Error updating sale:", error);
            alert("Error al actualizar la venta");
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay flex-center">
            <div className="glass-card modal-content animate-slide-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>Editar Venta</h3>
                    <button onClick={onClose} className="btn-icon"><X size={20} /></button>
                </div>

                <div className="form-stack">
                    <label>Cliente</label>
                    <input
                        name="client"
                        value={formData.client}
                        onChange={handleChange}
                        className="shiny-input"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Cantidad</label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className="shiny-input"
                            />
                        </div>
                        <div>
                            <label>Precio Unit.</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="shiny-input"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        Total: ${(Number(formData.quantity) * Number(formData.price)).toFixed(2)}
                    </div>

                    <button onClick={handleSave} disabled={loading} className="btn btn-primary w-full mt-4">
                        {loading ? 'Guardando...' : <><Save size={18} /> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const History = () => {
    const { data: sales, loading } = useCollection('sales_v2', 'date'); // Ordered by date desc
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSale, setEditingSale] = useState(null);
    const [showOnlyDebts, setShowOnlyDebts] = useState(false);

    // Group by Date
    const groupedSales = sales.reduce((groups, sale) => {
        let dateObj = new Date();
        try {
            if (sale.date?.seconds) {
                dateObj = new Date(sale.date.seconds * 1000);
            } else {
                dateObj = new Date(sale.date);
            }
        } catch (e) { }

        const dateKey = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push({
            ...sale,
            time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        });
        return groups;
    }, {});

    const filteredDateKeys = Object.keys(groupedSales).filter(dateKey => {
        return groupedSales[dateKey].some(s =>
            (s.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.product.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!showOnlyDebts || s.paymentStatus === 'debt')
        );
    });

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta venta permanentemente?')) {
            try {
                await deleteDocument('sales_v2', id);
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Error al eliminar");
            }
        }
    };

    const togglePaymentStatus = async (sale) => {
        try {
            // If currently debt, switch to paid. If paid, switch to debt.
            // Default if undefined is 'paid' (so switch to debt?? No, default is usually paid, so maybe it was undefined before)
            // Let's assume undefined = 'paid'.
            const currentStatus = sale.paymentStatus || 'paid';
            const newStatus = currentStatus === 'paid' ? 'debt' : 'paid';
            await updateDocument('sales_v2', sale.id, { paymentStatus: newStatus });
        } catch (error) {
            console.error('Error toggling payment status', error);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Historial de Ventas</h1>
                <p className="subtitle">Registro completo de transacciones</p>
            </div>

            <div className="search-bar glass-card flex-center" style={{ justifyContent: 'space-between', padding: '0.5rem 1rem', marginBottom: '2rem', gap: '1rem' }}>
                <div className="flex-center" style={{ flex: 1, justifyContent: 'flex-start' }}>
                    <Search size={20} style={{ opacity: 0.5 }} />
                    <input
                        placeholder="Buscar por cliente, producto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', padding: '0.5rem', width: '100%', color: 'white' }}
                    />
                </div>

                <button
                    onClick={() => setShowOnlyDebts(!showOnlyDebts)}
                    className={`filter-btn ${showOnlyDebts ? 'active' : ''}`}
                    title="Mostrar solo deudas"
                >
                    {showOnlyDebts ? 'Ver Todo' : 'Solo Deudas'}
                </button>
            </div>

            {loading ? <p>Cargando historial...</p> : (
                <div className="history-list">
                    {filteredDateKeys.length === 0 && <p className="text-center opacity-50">No se encontraron ventas</p>}

                    {filteredDateKeys.map(dateKey => (
                        <div key={dateKey} className="date-group animate-slide-up">
                            <div className="date-header">
                                <Calendar size={16} />
                                <h3>{dateKey}</h3>
                            </div>

                            <div className="sales-grid">
                                {groupedSales[dateKey]
                                    .filter(s =>
                                        (s.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            s.product.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                        (!showOnlyDebts || s.paymentStatus === 'debt')
                                    )
                                    .map(sale => (
                                        <div key={sale.id} className="glass-card sale-row">
                                            <div className="sale-info">
                                                <span className="time">{sale.time}</span>
                                                <div className="details">
                                                    <strong>{sale.client}</strong>
                                                    <span className="product-name">
                                                        {sale.product} x {sale.quantity} {sale.unit ? `(${sale.unit})` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="sale-meta">
                                                <span className="total">${sale.total?.toFixed(2) || 0}</span>

                                                {/* Payment Status Toggle */}
                                                <button
                                                    onClick={() => togglePaymentStatus(sale)}
                                                    className={`status-btn ${sale.paymentStatus === 'debt' ? 'debt' : 'paid'}`}
                                                    title={sale.paymentStatus === 'debt' ? "Marcar como Pagado" : "Marcar como Deuda"}
                                                >
                                                    {sale.paymentStatus === 'debt' ? 'D' : 'P'}
                                                </button>

                                                {/* Edit: Available for KEYBOARD_EVERYONE (or at least mapped to logic) requested: "todos" */}
                                                <button
                                                    className="btn-icon btn-secondary"
                                                    onClick={() => setEditingSale(sale)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                {/* Delete: ONLY ADMIN */}
                                                {userData?.role === 'admin' && (
                                                    <button
                                                        className="btn-icon btn-danger"
                                                        onClick={() => handleDelete(sale.id)}
                                                        title="Eliminar (Solo Admin)"
                                                        style={{ color: '#ff6b6b' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingSale && (
                <EditSaleModal sale={editingSale} onClose={() => setEditingSale(null)} />
            )}

            <style>{`
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .date-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: var(--color-primary);
          opacity: 0.9;
        }
        .date-header h3 {
          font-size: 1.1rem;
          text-transform: capitalize;
        }
        
        .sales-grid {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .sale-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-left: 4px solid var(--color-primary);
          transition: 0.2s;
        }
        .sale-row:hover {
            transform: translateX(5px);
            background: rgba(255,255,255,0.08);
        }
        
        .sale-info {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .time {
          font-family: monospace;
          opacity: 0.6;
          font-size: 0.9rem;
        }
        .details {
          display: flex;
          flex-direction: column;
        }
        .product-name {
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
        
        .sale-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .sale-meta .total {
            font-weight: bold;
            font-size: 1.1rem;
            color: var(--color-text-main);
            margin-right: 1rem;
        }

        /* Mobile Responsive History */
        @media (max-width: 600px) {
            .sale-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.8rem;
            }
            .sale-info {
                width: 100%;
                justify-content: space-between;
            }
            .sale-meta {
                width: 100%;
                justify-content: space-between;
                padding-top: 0.5rem;
                border-top: 1px solid rgba(255,255,255,0.05);
            }
            .sale-meta .total {
                font-size: 1.2rem;
            }
            .filter-btn {
                padding: 6px 12px;
                font-size: 0.8rem;
            }
        }
        .btn-icon {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
            display: flex; align-items: center; justify-content: center;
        }
        .btn-icon:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.1);
        }
        .btn-danger:hover {
            background: rgba(255, 107, 107, 0.2);
            color: #ff6b6b;
        }

        .status-btn {
            width: 30px; height: 30px;
            border-radius: 50%;
            border: none;
            font-weight: bold;
            color: white;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            margin-right: 0.5rem;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: 0.2s;
        }
        .status-btn:hover { transform: scale(1.1); }
        .status-btn.paid { background: #51cf66; }
        .status-btn.debt { background: #ff6b6b; }

        .filter-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid var(--glass-border);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: 0.3s;
            white-space: nowrap;
        }
        .filter-btn:hover { background: rgba(255,255,255,0.2); }
        .filter-btn.active {
            background: #ff6b6b;
            color: white;
            border-color: #ff6b6b;
            box-shadow: 0 0 15px rgba(255, 107, 107, 0.3);
        }

        .shiny-input {
            width: 100%;
            background: rgba(0,0,0,0.2);
            border: 1px solid var(--glass-border);
            padding: 0.8rem;
            border-radius: 8px;
            color: white;
            margin-bottom: 1rem;
        }
        .modal-content {
             width: 90%; max-width: 400px; padding: 2rem;
        }
      `}</style>
        </div>
    );
};

export default History;
