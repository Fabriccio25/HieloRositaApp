import React, { useState, useEffect } from 'react';
import { useCollection, addDocument, updateDocument } from '../hooks/useFirestore';
import { Search, ShoppingCart, User, Package, ArrowRight, Check } from 'lucide-react';

const RegisterSale = () => {
    const { data: products } = useCollection('products_v2');
    const { data: clients } = useCollection('clients_v2');

    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [clientName, setClientName] = useState('');
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unit, setUnit] = useState('U'); // Unit State: 'U' or 'TN'
    const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid' or 'debt'

    // Filter Categories
    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    // Client Autocomplete
    useEffect(() => {
        if (clientName.length > 1) {
            const matches = clients.filter(c =>
                c.name.toLowerCase().includes(clientName.toLowerCase())
            );
            setClientSuggestions(matches);
        } else {
            setClientSuggestions([]);
        }
    }, [clientName, clients]);

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        // Smart Default: If 'molido' is in name, default to TN, else U
        if (product.name.toLowerCase().includes('molido')) {
            setUnit('TN');
        } else {
            setUnit('U');
        }
    };

    const selectClient = (name) => {
        setClientName(name);
        setClientSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!selectedProduct) return alert("Seleccione un producto");
        if (quantity <= 0) return alert("La cantidad debe ser mayor a 0");
        if (!clientName) return alert("Ingrese el nombre del cliente");
        if (selectedProduct.stock < quantity) {
            return alert(`Solo hay ${selectedProduct.stock} unidades disponibles.`);
        }

        setLoading(true);

        try {
            // 1. Handle Client (Find or Create)
            let clientId = null;
            const existingClient = clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                // Create new client
                const newClient = await addDocument('clients_v2', { name: clientName });
                // We assume success, but creating creates a promise that resolved.
                // In a real app we'd get the ID, but our helper returns { success: true }. 
                // We'll proceed.
            }

            // 2. Register Sale
            const saleData = {
                product: selectedProduct.name,
                productId: selectedProduct.id,
                category: selectedProduct.category,
                quantity: Number(quantity),
                unit: unit,
                paymentStatus: paymentStatus, // Save Payment Status
                price: selectedProduct.price,
                total: selectedProduct.price * quantity,
                client: clientName,
                date: new Date().toISOString() // For sorting/grouping
            };

            await addDocument('sales_v2', saleData);

            // 3. Deduct Stock
            const newStock = selectedProduct.stock - quantity;
            await updateDocument('products_v2', selectedProduct.id, {
                stock: newStock
            });

            alert("Venta registrada con éxito!");

            // Reset
            setSelectedProduct(null);
            setQuantity(1);
            setClientName('');

        } catch (error) {
            console.error(error);
            alert("Error al registrar venta");
        }

        setLoading(false);
    };

    return (
        <div className="page-container">
            <h1>Registrar Venta</h1>

            <div className="layout-grid">
                {/* Left Column: Product Selection */}
                <div className="product-section glass-card">
                    <h3>1. Seleccionar Producto</h3>

                    {/* Category Filter */}
                    <div className="category-scroll">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sliding Products */}
                    <div className="products-grid-view">
                        {filteredProducts.length === 0 ? (
                            <p className="no-products">No hay productos en esta categoría</p>
                        ) : (
                            filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductSelect(product)}
                                    className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                                >
                                    <div className="card-shine"></div>
                                    <Package size={36} className="product-icon" />
                                    <h4 className="product-title">{product.name}</h4>

                                    <div className="product-footer">
                                        <span className={`stock-badge ${product.stock < 10 ? 'low' : 'good'}`}>
                                            Stock: {product.stock}
                                        </span>
                                        <span className="price-badge">${product.price}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quantity Input */}
                    {selectedProduct && (
                        <div className="quantity-area animate-slide-up">
                            <div className="flex-center" style={{ justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                                <label style={{ margin: 0 }}>Cantidad a Vender</label>
                                {/* Unit Toggle */}
                                <div className="unit-toggle">
                                    <button
                                        className={unit === 'U' ? 'active' : ''}
                                        onClick={() => setUnit('U')}
                                    >U</button>
                                    <button
                                        className={unit === 'TN' ? 'active' : ''}
                                        onClick={() => setUnit('TN')}
                                    >TN</button>
                                </div>
                            </div>

                            <div className="quantity-control">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                                <input
                                    type="number"
                                    min="1"
                                    max={selectedProduct.stock}
                                    value={quantity}
                                    onChange={e => setQuantity(Number(e.target.value))}
                                />
                                <button onClick={() => setQuantity(q => q + 1)}>+</button>
                            </div>
                            <div className="total-display">
                                <span>Subtotal:</span>
                                <strong>${(selectedProduct.price * quantity).toFixed(2)}</strong>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Client & Confirm */}
                <div className="client-section">
                    <div className="glass-card mb-4" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--color-primary)', position: 'relative', zIndex: 20 }}>
                        <h3>2. Datos del Cliente</h3>
                        <div className="relative">
                            <div className="input-icon-wrapper">
                                <User size={18} />
                                <input
                                    placeholder="Buscar Cliente..."
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    autoComplete="off"
                                    className="shiny-input"
                                />
                            </div>

                            {/* Suggestions Dropdown */}
                            {clientSuggestions.length > 0 && (
                                <div className="suggestions-dropdown">
                                    {clientSuggestions.map(c => (
                                        <div
                                            key={c.id}
                                            className="suggestion-item"
                                            onClick={() => selectClient(c.name)}
                                        >
                                            <div className="suggestion-icon"><User size={14} /></div>
                                            {c.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card summary-card" style={{ position: 'relative', zIndex: 1 }}>
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Resumen de Venta</h3>
                        <div className="summary-row">
                            <span>Producto</span>
                            <strong className="text-right">{selectedProduct ? selectedProduct.name : '-'}</strong>
                        </div>
                        <div className="summary-row">
                            <span>Cantidad</span>
                            <strong>{quantity} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>{unit}</span></strong>
                        </div>
                        <div className="summary-row total">
                            <span>Total a Pagar</span>
                            <strong className="big-total">${selectedProduct ? (selectedProduct.price * quantity).toFixed(2) : '0.00'}</strong>
                        </div>

                        {/* Payment Status Toggle */}
                        <div className="payment-toggle-container" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="payment-toggle">
                                <button
                                    className={paymentStatus === 'debt' ? 'debt active' : 'debt'}
                                    onClick={() => setPaymentStatus('debt')}
                                >D</button>
                                <button
                                    className={paymentStatus === 'paid' ? 'paid active' : 'paid'}
                                    onClick={() => setPaymentStatus('paid')}
                                >P</button>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedProduct}
                            className={`btn w-full mt-2 action-btn ${loading ? 'loading' : ''}`}
                        >
                            {loading ? 'Procesando...' : (
                                <div className="flex-center" style={{ gap: '0.5rem' }}>
                                    <Check size={20} /> Confirmar Venta
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .layout-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
        }
        @media (max-width: 900px) {
          .layout-grid { grid-template-columns: 1fr; }
        }

        /* Unit Toggle */
        .unit-toggle {
            display: flex;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 2px;
            border: 1px solid var(--glass-border);
        }
        .unit-toggle button {
            background: transparent;
            border: none;
            padding: 4px 12px;
            color: rgba(255,255,255,0.5);
            font-size: 0.85rem;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.2s;
        }
        .unit-toggle button.active {
            background: var(--color-primary);
            color: white;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* Payment Toggle */
        .payment-toggle {
            display: flex;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 2px;
            border: 1px solid var(--glass-border);
        }
        .payment-toggle button {
            background: transparent;
            border: none;
            padding: 6px 14px;
            color: rgba(255,255,255,0.5);
            font-size: 1rem;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.2s;
        }
        .payment-toggle button.debt.active {
            background: #ff6b6b;
            color: white;
            box-shadow: 0 0 10px rgba(255, 107, 107, 0.4);
        }
        .payment-toggle button.paid.active {
            background: #51cf66;
            color: white;
            box-shadow: 0 0 10px rgba(81, 207, 102, 0.4);
        }

        /* CARD GRID */
        .products-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          padding: 1rem 0;
          max-height: 400px;
          overflow-y: auto;
        }

        .product-card {
          position: relative;
          background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid var(--glass-border);
          padding: 1.2rem;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }

        .product-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
        }

        .product-card.selected {
          background: linear-gradient(135deg, rgba(var(--hue-primary), 60%, 50%, 0.2), rgba(0,0,0,0));
          border: 2px solid var(--color-primary);
          box-shadow: 0 10px 30px -10px var(--color-primary-glow);
        }
        
        .product-icon {
            margin-bottom: 0.8rem;
            color: var(--color-text-muted);
            transition: 0.3s;
        }
        .product-card.selected .product-icon {
            color: var(--color-primary);
            filter: drop-shadow(0 0 8px var(--color-primary));
        }

        .product-title {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: auto;
            line-height: 1.2;
        }

        .product-footer {
            margin-top: 1rem;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
        }

        .stock-badge {
            padding: 3px 8px;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
        }
        .stock-badge.low { color: #ff6b6b; background: rgba(255, 107, 107, 0.15); }
        .stock-badge.good { color: #51cf66; background: rgba(81, 207, 102, 0.15); }

        .price-badge {
            font-weight: bold;
            color: white;
        }

        /* CATEGORIES */
        .category-scroll {
          display: flex;
          gap: 0.8rem;
          overflow-x: auto;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .category-pill {
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--glass-border);
          color: var(--color-text-muted);
          padding: 0.6rem 1.2rem;
          border-radius: 25px;
          cursor: pointer;
          white-space: nowrap;
          transition: 0.3s;
          font-size: 0.9rem;
        }
        .category-pill:hover { background: rgba(255,255,255,0.1); }
        .category-pill.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          box-shadow: 0 4px 12px var(--color-primary-glow);
        }

        /* QUANTITY */
        .quantity-area {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .quantity-control {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(0,0,0,0.3); /* Darker background for contrast */
            border-radius: 8px;
            padding: 4px;
            border: 1px solid var(--glass-border);
        }
        .quantity-control button {
            width: 36px; height: 36px;
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
        }
        .quantity-control button:hover {
            background: rgba(255,255,255,0.2);
        }
        .quantity-control input {
            width: 80px;
            text-align: center;
            background: transparent;
            border: none;
            color: white; /* Ensure text is white */
            font-size: 1.3rem; /* Larger font */
            font-weight: bold;
            outline: none;
        }
        .total-display {
            font-size: 1.2rem;
            color: var(--color-primary);
            display: flex; gap: 0.5rem;
        }

        /* SUMMARY RIGHT */
        .summary-card {
            background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%);
        }
        .summary-row {
            display: flex; justify-content: space-between; margin-bottom: 0.8rem;
            font-size: 0.95rem; color: rgba(255,255,255,0.7);
        }
        .summary-row.total {
            margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.2);
            font-size: 1.1rem; color: white;
        }

        @media (max-width: 480px) {
            .product-card { padding: 0.8rem; }
            .quantity-area { flex-direction: column; align-items: stretch; }
            .quantity-control { justify-content: center; }
            
            /* Stack summary buttons if needed, or keep as is */
            .payment-toggle-container { justify-content: center !important; }
            .big-total { font-size: 1.3rem; }
        }
        .big-total {
            font-size: 1.5rem;
            color: var(--color-primary);
            text-shadow: 0 0 20px var(--color-primary-glow);
        }
        
        .action-btn {
            background: var(--color-primary);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 1.5rem;
            transition: 0.3s;
        }
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            filter: grayscale(1);
        }
        .action-btn:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px var(--color-primary-glow);
        }
        
        .shiny-input {
            background: rgba(0,0,0,0.2) !important;
            border: 1px solid var(--glass-border) !important;
            transition: 0.3s;
        }
        .shiny-input:focus {
            background: rgba(0,0,0,0.4) !important;
            border-color: var(--color-primary) !important;
        }
        
        .suggestions-dropdown {
            position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 100;
            background: rgba(30,30,30, 0.95); 
            backdrop-filter: blur(10px);
            border: 1px solid var(--color-primary);
            border-radius: 8px; overflow: hidden; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .suggestion-item { 
            padding: 12px 16px; 
            cursor: pointer; 
            transition: 0.2s; 
            display: flex; align-items: center; gap: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: rgba(var(--hue-primary), 60%, 50%, 0.2); color: white; padding-left: 20px; }
        
        .suggestion-icon {
            opacity: 0.5;
            display: flex; align-items: center; justify-content: center;
        }
        .suggestion-item:hover .suggestion-icon { opacity: 1; color: var(--color-primary); }
      `}</style>
        </div>
    );
};

export default RegisterSale;
