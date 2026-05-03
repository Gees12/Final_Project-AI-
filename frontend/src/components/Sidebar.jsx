import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  MessageCircle,
  Bot,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Produk & Stok' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { to: '/chat', icon: MessageCircle, label: 'AI WhatsApp' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">U</div>
          <div>
            <h1>UMKasM</h1>
            <span>Simple chat, smart cash</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="agent-status">
          <Bot size={16} />
          <span>AI Assistant</span>
          <div className="status-dot online" title="Online" />
        </div>
      </div>
    </aside>
  );
}
