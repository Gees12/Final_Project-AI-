import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  X,
  TrendingDown,
} from 'lucide-react';
import { getExpenses, createExpense, deleteExpense } from '../api/client';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: 0,
    note: '',
  });

  const loadData = async () => {
    try {
      const res = await getExpenses();
      setExpenses(res.data.reverse());
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
    if (!form.name || form.amount <= 0) {
      alert('Nama dan jumlah pengeluaran harus diisi dengan benar');
      return;
    }
    try {
      await createExpense(form);
      setShowModal(false);
      setForm({ name: '', amount: 0, note: '' });
      loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    try {
      await deleteExpense(id);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Pengeluaran</h2>
        <p>Catat pengeluaran operasional bisnis (listrik, gaji, sewa, dll)</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Wallet size={18} style={{ color: 'var(--accent-rose)' }} />
          <span className="recent-meta" style={{ fontSize: '0.9rem' }}>
            {expenses.length} pengeluaran
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="btn-add-expense">
            <Plus size={16} /> Tambah Pengeluaran
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><h3>Memuat...</h3></div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <Wallet />
            <h3>Belum ada pengeluaran</h3>
            <p>Klik "Tambah Pengeluaran" untuk memulai</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Tanggal</th>
                  <th>Nama Pengeluaran</th>
                  <th>Jumlah</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <TrendingDown size={16} style={{ color: 'var(--accent-rose)' }} />
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {e.created_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.name}</td>
                    <td style={{
                      fontWeight: 600,
                      color: 'var(--accent-rose)',
                    }}>
                      -{formatRupiah(e.amount)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.note || '-'}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => handleDelete(e.id)}
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

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Tambah Pengeluaran</h3>
              <button className="btn btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nama Pengeluaran</label>
                <input
                  id="input-ex-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Bayar Listrik, Gaji Karyawan"
                  required
                />
              </div>
              <div className="form-group">
                <label>Jumlah (Rp)</label>
                <input
                  id="input-ex-amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Catatan (opsional)</label>
                <input
                  id="input-ex-note"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Opsional"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" id="btn-submit-expense">
                  Tambah Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
