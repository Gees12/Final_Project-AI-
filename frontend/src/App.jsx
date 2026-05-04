import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import TransactionsPage from './pages/TransactionsPage';
import ExpensesPage from './pages/ExpensesPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </Layout>
  );
}
