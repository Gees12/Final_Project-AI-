import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Dashboard ────────────────────────────────────────────
export const getDashboardSummary = (period = 'week') =>
  api.get('/api/dashboard/summary', { params: { period } });

// ── Products ─────────────────────────────────────────────
export const getProducts = () => api.get('/api/products');
export const createProduct = (data) => api.post('/api/products', data);
export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// ── Transactions ─────────────────────────────────────────
export const getTransactions = () => api.get('/api/transactions');
export const createTransaction = (data) => api.post('/api/transactions', data);
export const deleteTransaction = (id) => api.delete(`/api/transactions/${id}`);

// ── Expenses ─────────────────────────────────────────────
export const getExpenses = () => api.get('/api/expenses');
export const createExpense = (data) => api.post('/api/expenses', data);
export const updateExpense = (id, data) => api.put(`/api/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/api/expenses/${id}`);

// ── Admin (Danger Zone) ────────────────────────────────────
export const clearAllData = () => api.delete('/api/admin/clear-all');


// ── Export ────────────────────────────────────────────────
export const exportTransactionsExcel = () =>
  api.get('/api/export/transactions', { responseType: 'blob' });
export const exportProductsExcel = () =>
  api.get('/api/export/products', { responseType: 'blob' });

export const syncGoogleSheets = () => api.post('/api/sync-google-sheets');

// Helper to trigger download
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
