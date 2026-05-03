import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, clearAllData } from '../api/client';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    stock: 0,
    price: 0,
    category: 'Umum',
  });

  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm({ name: '', sku: '', stock: 0, price: 0, category: 'Umum' });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      price: product.price,
      category: product.category || 'Umum',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, form);
      } else {
        await createProduct(form);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    const ok = confirm(
      'Yakin ingin menghapus SEMUA data?\n\nIni akan menghapus semua produk, semua transaksi, dan riwayat chat.\nTindakan ini tidak bisa dibatalkan.'
    );
    if (!ok) return;
    try {
      await clearAllData();
      loadProducts();
      alert('Semua data berhasil dihapus.');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Produk & Stok</h2>
        <p>Kelola inventori produk Anda</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Package size={18} style={{ color: 'var(--accent-amber)' }} />
          <span className="recent-meta" style={{ fontSize: '0.9rem' }}>
            {products.length} produk
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger" onClick={handleClearAll} type="button">
            <Trash2 size={16} /> Hapus Semua Data
          </button>
          <button className="btn btn-primary" onClick={openAdd} id="btn-add-product">
            <Plus size={16} /> Tambah Produk
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><h3>Memuat...</h3></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package />
            <h3>Belum ada produk</h3>
            <p>Klik "Tambah Produk" untuk memulai</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Harga</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.sku}
                    </td>
                    <td>{p.category}</td>
                    <td>
                      <span className={`badge ${p.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                        {p.stock <= 5 && <AlertTriangle size={12} style={{ marginRight: 4 }} />}
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{formatRupiah(p.price)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => openEdit(p)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => handleDelete(p.id)}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Produk</label>
                <input
                  id="input-product-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Laptop Asus ROG"
                  required
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  id="input-product-sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="LAP-001"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Stok</label>
                  <input
                    id="input-product-stock"
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Harga (Rp)</label>
                  <input
                    id="input-product-price"
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select
                  id="input-product-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Umum">Umum</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Aksesoris">Aksesoris</option>
                  <option value="Audio">Audio</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-product">
                  {editingProduct ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
