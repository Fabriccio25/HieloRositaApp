import React, { useState } from 'react';
import { addDocument } from '../hooks/useFirestore';
import { DollarSign, FileText, Calendar, Tag, Check, AlertCircle } from 'lucide-react';

const RegisterExpense = () => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Servicios');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const categories = ['Inventario', 'Servicios', 'Sueldos', 'Mantenimiento', 'Marketing', 'Alquiler', 'Otros'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return alert("Ingrese un monto válido");
        if (!description) return alert("Ingrese una descripción");

        setLoading(true);

        try {
            await addDocument('expenses_v2', {
                amount: Number(amount),
                category,
                description,
                date: new Date(date).toISOString(), // Store as ISO for consistency
                createdAt: new Date()
            });

            alert("Gasto registrado con éxito");
            setAmount('');
            setDescription('');
            setCategory('Servicios');
        } catch (error) {
            console.error(error);
            alert("Error al registrar gasto");
        }
        setLoading(false);
    };

    return (
        <div className="page-container">
            <h1>Registrar Gasto</h1>

            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} className="expense-form">

                    {/* Amount */}
                    <div className="form-group">
                        <label>Monto del Gasto</label>
                        <div className="input-icon-wrapper">
                            <DollarSign size={20} />
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="shiny-input big-input"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="form-group">
                        <label>Categoría</label>
                        <div className="category-grid">
                            {categories.map(cat => (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`category-chip ${category === cat ? 'active' : ''}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Descripción / Detalle</label>
                        <div className="input-icon-wrapper">
                            <FileText size={20} />
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej: Pago de luz, Compra de insumos..."
                                className="shiny-input"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="form-group">
                        <label>Fecha del Gasto</label>
                        <div className="input-icon-wrapper">
                            <Calendar size={20} />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="shiny-input"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn w-full mt-4 action-btn ${loading ? 'loading' : ''}`}
                    >
                        {loading ? 'Guardando...' : (
                            <div className="flex-center" style={{ gap: '0.5rem' }}>
                                <Check size={20} /> Registrar Gasto
                            </div>
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                .expense-form {
                    display: flex; flex-direction: column; gap: 1.5rem;
                }
                .form-group label {
                    display: block; margin-bottom: 0.5rem; 
                    color: var(--color-text-muted); font-size: 0.9rem;
                }
                .big-input {
                    font-size: 1.5rem !important;
                    font-weight: bold;
                    padding: 1rem !important;
                }
                .category-grid {
                    display: flex; flex-wrap: wrap; gap: 0.8rem;
                }
                .category-chip {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--glass-border);
                    color: var(--color-text-muted);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .category-chip:hover {
                    background: rgba(255,255,255,0.1);
                }
                .category-chip.active {
                    background: #ff6b6b; /* Reddish for expenses */
                    color: white;
                    border-color: #ff6b6b;
                    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
                }
                
                .action-btn {
                    background: #ff6b6b; /* Override primary for expense action */
                }
                .action-btn:hover {
                    background: #fa5252;
                    box-shadow: 0 10px 25px -5px rgba(255, 107, 107, 0.5);
                }

                .shiny-input {
                    width: 100%;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--glass-border);
                    padding: 0.8rem;
                    border-radius: 8px;
                    color: white;
                    outline: none;
                    padding-left: 2.5rem; /* Space for icon */
                }
                .input-icon-wrapper { position: relative; }
                .input-icon-wrapper svg {
                    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
                    color: rgba(255,255,255,0.4);
                }
            `}</style>
        </div>
    );
};

export default RegisterExpense;
