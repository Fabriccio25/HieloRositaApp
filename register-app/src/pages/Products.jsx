import React, { useState } from 'react';
import { useCollection, addDocument, updateDocument, deleteDocument } from '../hooks/useFirestore';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product = null }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        category: product?.category || '',
        description: product?.description || '',
        stock: product?.stock || 0,
        price: product?.price || 0, // Inferred requirement
        type: product?.type || '' // User mentioned "Type" for filtering
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (product) {
                await updateDocument('products_v2', product.id, {
                    ...formData,
                    stock: Number(formData.stock),
                    price: Number(formData.price)
                });
            } else {
                await addDocument('products_v2', {
                    ...formData,
                    stock: Number(formData.stock),
                    price: Number(formData.price)
                });
            }
            onClose();
        } catch (error) {
            alert("Error saving product");
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay flex-center">
            <div className="glass-card modal-content animate-slide-up">
                <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <form onSubmit={handleSubmit} className="form-grid">
                    <input
                        placeholder="Nombre del Producto"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <input
                        placeholder="Categoría / Tipo"
                        value={formData.category} // Using Category as Type based on user description
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Precio"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Stock Inicial (Opcional)"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    />
                    <textarea
                        placeholder="Descripción Breve"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
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
          max-width: 500px;
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

const Products = () => {
    const { data: products, loading } = useCollection('products_v2');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Seguro que deseas eliminar este producto?')) {
            await deleteDocument('products_v2', id);
        }
    };

    const openNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Productos</h1>
                    <p className="subtitle">Gestiona tu inventario y stock</p>
                </div>
                <button onClick={openNew} className="btn btn-primary">
                    <Plus size={20} /> Nuevo Producto
                </button>
            </div>

            <div className="search-bar glass-card flex-center" style={{ justifyContent: 'flex-start', padding: '0.5rem 1rem', marginBottom: '2rem' }}>
                <Search size={20} style={{ opacity: 0.5 }} />
                <input
                    placeholder="Buscar productos por nombre o categoría..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', padding: '0.5rem' }}
                />
            </div>

            {loading ? <p>Cargando inventario...</p> : (
                <div className="grid-cards">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="glass-card product-card animate-slide-up">
                            <div className="card-icon">
                                <Package size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{product.name}</h3>
                                <span className="badge">{product.category}</span>
                                <p className="desc">{product.description}</p>
                                <div className="stats">
                                    <div className="stat-item">
                                        <label>Precio</label>
                                        <span>${product.price}</span>
                                    </div>
                                    <div className={`stat-item ${product.stock < 5 ? 'low-stock' : ''}`}>
                                        <label>Stock</label>
                                        <span>{product.stock}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button onClick={() => handleEdit(product)} className="btn-icon btn-secondary">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="btn-icon btn-secondary" style={{ color: '#ff4444' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
            />

            <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .subtitle {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        .product-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .badge {
          background: rgba(var(--hue-secondary), 50%, 50%, 0.2);
          color: hsl(var(--hue-secondary), 70%, 70%);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          align-self: flex-start;
        }
        .desc {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          flex-grow: 1;
        }
        .stats {
          display: flex;
          justify-content: space-between;
          margin: 1rem 0;
          background: rgba(0,0,0,0.2);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          text-align: center;
        }
        .stat-item label {
          font-size: 0.7rem;
          text-transform: uppercase;
          opacity: 0.7;
        }
        .stat-item span {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .low-stock span {
          color: #ff4444;
        }
        .card-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
      `}</style>
        </div>
    );
};

export default Products;
