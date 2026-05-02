import { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { getTransactions, createTransaction, deleteTransaction, getProducts } from '../api/client';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    quantity: 1,
    type: 'sale',
    note: '',
  });

  const loadData = async () => {
    try {
      const [txRes, pRes] = await Promise.all([getTransactions(), getProducts()]);
      setTransactions(txRes.data.reverse());
      setProducts(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) {
      alert('Pilih produk terlebih dahulu');
      return;
    }
    try {
      await createTransaction(form);
      setShowModal(false);
      setForm({ product_id: '', quantity: 1, type: 'sale', note: '' });
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await deleteTransaction(id);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Transaksi</h2>
        <p>Catat penjualan dan pembelian stok</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <ArrowLeftRight size={18} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {transactions.length} transaksi
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-transaction">
          <Plus size={16} /> Tambah Transaksi
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><h3>Memuat...</h3></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <ArrowLeftRight />
            <h3>Belum ada transaksi</h3>
            <p>Klik "Tambah Transaksi" untuk memulai</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Tanggal</th>
                  <th>Produk</th>
                  <th>Tipe</th>
                  <th>Jumlah</th>
                  <th>Total</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {tx.type === 'sale' ? (
                        <TrendingUp size={16} style={{ color: 'var(--accent-emerald)' }} />
                      ) : (
                        <TrendingDown size={16} style={{ color: 'var(--accent-blue)' }} />
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {tx.created_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.product_name}</td>
                    <td>
                      <span className={`badge ${tx.type}`}>
                        {tx.type === 'sale' ? 'Penjualan' : 'Pembelian'}
                      </span>
                    </td>
                    <td>{tx.quantity}</td>
                    <td style={{
                      fontWeight: 600,
                      color: tx.type === 'sale' ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                    }}>
                      {tx.type === 'sale' ? '+' : '-'}{formatRupiah(tx.total_price)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.note || '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => handleDelete(tx.id)}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Tambah Transaksi</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Produk</label>
                <select
                  id="input-tx-product"
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Tipe</label>
                  <select
                    id="input-tx-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="sale">Penjualan</option>
                    <option value="purchase">Pembelian (Restock)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jumlah</label>
                  <input
                    id="input-tx-quantity"
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input
                  id="input-tx-note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Contoh: Penjualan ke PT ABC"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-transaction">
                  Tambah Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
