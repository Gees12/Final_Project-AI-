import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getDashboardSummary,
  getTransactions,
  exportTransactionsExcel,
  exportProductsExcel,
  downloadBlob,
} from '../api/client';

function formatRupiah(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function AnimatedCounter({ value, isCurrency = false }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const end = value;
    const absEnd = Math.abs(end);
    let start = 0;
    if (absEnd === 0) { setDisplay(0); return; }
    const duration = 1000;
    const step = Math.max(1, Math.floor(absEnd / (duration / 16)));
    const sign = end < 0 ? -1 : 1;
    const timer = setInterval(() => {
      start += step;
      if (start >= absEnd) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start * sign);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{isCurrency ? formatRupiah(display) : display}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '0.85rem',
      }}>
        <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#3b82f6', fontWeight: 600 }}>
          {formatRupiah(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, txRes] = await Promise.all([
          getDashboardSummary(),
          getTransactions(),
        ]);
        setSummary(sumRes.data);
        setRecentTx(txRes.data.slice(-5).reverse());
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExportTx = async () => {
    try {
      const res = await exportTransactionsExcel();
      downloadBlob(res.data, 'transaksi.xlsx');
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  const handleExportProducts = async () => {
    try {
      const res = await exportProductsExcel();
      downloadBlob(res.data, 'produk.xlsx');
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <h3>Memuat dashboard...</h3>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="empty-state">
        <AlertTriangle />
        <h3>Gagal memuat data</h3>
        <p>Pastikan backend FastAPI sudah berjalan di port 8000</p>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Ringkasan bisnis Anda hari ini</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Penjualan</span>
            <div className="stat-card-icon"><BarChart3 size={22} /></div>
          </div>
          <div className="stat-card-value">
            <AnimatedCounter value={summary.total_sales} isCurrency />
          </div>
          <div className="stat-card-sub">{summary.total_transactions} transaksi</div>
        </div>

        <div className="card stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-label">Pemasukan Bersih</span>
            <div className="stat-card-icon"><TrendingUp size={22} /></div>
          </div>
          <div className="stat-card-value">
            <AnimatedCounter value={summary.net_income} isCurrency />
          </div>
          <div className="stat-card-sub">Penjualan - Pembelian</div>
        </div>

        <div className="card stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Produk</span>
            <div className="stat-card-icon"><Package size={22} /></div>
          </div>
          <div className="stat-card-value">
            <AnimatedCounter value={summary.total_products} />
          </div>
          <div className="stat-card-sub">produk aktif</div>
        </div>

        <div className="card stat-card rose">
          <div className="stat-card-header">
            <span className="stat-card-label">Stok Rendah</span>
            <div className="stat-card-icon"><AlertTriangle size={22} /></div>
          </div>
          <div className="stat-card-value">
            <AnimatedCounter value={summary.low_stock_count} />
          </div>
          <div className="stat-card-sub">produk perlu restock</div>
        </div>
      </div>

      {/* Chart + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Sales Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grafik Penjualan</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportTx}>
                <FileSpreadsheet size={14} /> Export Transaksi
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportProducts}>
                <Download size={14} /> Export Produk
              </button>
            </div>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            {summary.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chart_data}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>Belum ada data penjualan</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Transaksi Terbaru</h3>
          {recentTx.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {tx.product_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.quantity}x · {tx.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: tx.type === 'sale' ? 'var(--accent-emerald)' : 'var(--accent-blue)',
                    }}>
                      {tx.type === 'sale' ? '+' : '-'}{formatRupiah(tx.total_price)}
                    </div>
                    <span className={`badge ${tx.type}`}>
                      {tx.type === 'sale' ? 'Penjualan' : 'Pembelian'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Belum ada transaksi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
