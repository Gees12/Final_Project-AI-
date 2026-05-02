import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  User,
  Trash2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { sendChatMessage, getChatHistory, clearChatHistory } from '../api/client';

const SUGGESTIONS = [
  'Tampilkan ringkasan penjualan hari ini',
  'Tambahkan produk baru: Tablet Samsung, stok 20, harga 5 juta',
  'Catat penjualan 3 unit Mouse Logitech MX',
  'Produk mana yang stoknya rendah?',
  'Buatkan laporan Excel transaksi',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await getChatHistory();
      setMessages(res.data);
    } catch (err) {
      // No history yet, that's fine
    }
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    // Optimistic update — add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: msg,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(msg);
      // Add agent reply
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '❌ Gagal menghubungi agent. Pastikan backend dan SSH tunnel aktif.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Hapus semua riwayat chat?')) return;
    try {
      await clearChatHistory();
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>AI Chat Agent</h2>
          <p>Kelola bisnis Anda lewat percakapan dengan OpenClaw Agent</p>
        </div>
        {messages.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={handleClear}>
            <Trash2 size={14} /> Hapus Riwayat
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Sparkles size={48} style={{ color: 'var(--accent-purple)', opacity: 0.5, marginBottom: 16 }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  Halo! Saya AI Agent Anda 👋
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                  Saya bisa membantu mengelola produk, mencatat transaksi, mengecek stok, dan membuat laporan. Coba salah satu contoh di bawah!
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSend(s)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      <MessageCircle size={12} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.role}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: '0.75rem', fontWeight: 600, opacity: 0.7 }}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  {msg.role === 'user' ? 'Anda' : 'AI Agent'}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div className="chat-bubble-time">
                  {msg.timestamp?.slice(11, 16)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (contoh: Tambahkan produk baru)"
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              id="btn-send-chat"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
