import { useState, useEffect, useRef } from 'react';
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

function formatChartLabel(value, period, withWeekday = false) {
  if (!value) return '-';

  if (period === 'day') {
    return value;
  }

  if (period === 'year') {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  if (period === 'week') {
    return parsedDate.toLocaleDateString('id-ID', {
      weekday: withWeekday ? 'short' : undefined,
      day: '2-digit',
      month: 'short',
    });
  }

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
  });
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

const CustomTooltip = ({ active, payload, label, period }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">
          {formatChartLabel(label, period, true)}
        </p>
        <p className="chart-tooltip-value">
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
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const isFirstSummaryLoad = useRef(true);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const txRes = await getTransactions();
        setRecentTx(txRes.data.slice(-5).reverse());
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    }

    loadTransactions();
  }, []);

  useEffect(() => {
    async function loadSummary() {
      const firstLoad = isFirstSummaryLoad.current;
      if (firstLoad) {
        setLoading(true);
      } else {
        setChartLoading(true);
      }

      try {
        const sumRes = await getDashboardSummary(period);
        setSummary(sumRes.data);
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
        if (firstLoad) {
          setSummary(null);
        }
      } finally {
        if (firstLoad) {
          setLoading(false);
          isFirstSummaryLoad.current = false;
        } else {
          setChartLoading(false);
        }
      }
    }

    loadSummary();
  }, [period]);

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
        <p>Ringkasan bisnis berdasarkan periode terpilih</p>
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
      <div className="dashboard-layout">
        {/* Sales Chart */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Grafik Penjualan</h3>
            <div className="action-row">
              <select
                className="period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="day">Harian</option>
                <option value="week">Mingguan</option>
                <option value="month">Bulanan</option>
                <option value="year">Tahunan</option>
              </select>
              <button className="btn btn-secondary btn-sm" onClick={handleExportTx}>
                <FileSpreadsheet size={14} /> Export Transaksi
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExportProducts}>
                <Download size={14} /> Export Produk
              </button>
            </div>
          </div>
          <div className="chart-container chart-wrap">
            {chartLoading ? (
              <div className="empty-state">
                <p>Memuat grafik...</p>
              </div>
            ) : summary.chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.chart_data}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatChartLabel(value, period)}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip content={<CustomTooltip period={period} />} />
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
          <h3 className="section-title" style={{ marginBottom: 16 }}>Transaksi Terbaru</h3>
          {recentTx.length > 0 ? (
            <div className="recent-list">
              {recentTx.map((tx) => (
                <div key={tx.id} className="recent-item">
                  <div>
                    <div className="recent-name">{tx.product_name}</div>
                    <div className="recent-meta">
                      {tx.quantity}x · {tx.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div className="recent-right">
                    <div className={`recent-total ${tx.type}`}>
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
