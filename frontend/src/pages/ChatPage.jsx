import { MessageCircle, ExternalLink, Bot, Zap, Clock } from 'lucide-react';

export default function ChatPage() {
  const whatsappNumber = '6282199152980';
  const waUrl = `https://wa.me/${whatsappNumber}?text=Halo%20Asisten%20Bisnis`;

  return (
    <div className="fade-in-up chat-page">
      <div className="page-header center-header">
        <h2>AI Agent WhatsApp</h2>
        <p>Asisten bisnis Anda sekarang tersedia langsung di saku Anda, 24/7.</p>
      </div>

      <div>
        <div className="card chat-hero">
          <div className="chat-hero-icon">
            <MessageCircle size={40} />
          </div>

          <h3>Hubungkan ke WhatsApp</h3>
          <p>
            Kami telah memindahkan pengalaman AI Agent langsung ke WhatsApp untuk kemudahan akses dan performa yang lebih cepat. Tidak perlu lagi login ke dashboard untuk mencatat transaksi atau mengecek stok!
          </p>

          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <MessageCircle size={22} />
            Chat dengan AI Sekarang
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="chat-feature-grid">
          <div className="card chat-feature">
            <Bot size={24} className="chat-feature-icon icon-purple" />
            <h4>OpenClaw AI</h4>
            <p>Didukung oleh teknologi AI cerdas untuk bisnis</p>
          </div>
          <div className="card chat-feature">
            <Zap size={24} className="chat-feature-icon icon-amber" />
            <h4>Respon Instan</h4>
            <p>Pencatatan penjualan dan stok dalam hitungan detik</p>
          </div>
          <div className="card chat-feature">
            <Clock size={24} className="chat-feature-icon icon-blue" />
            <h4>Aktif 24/7</h4>
            <p>Asisten Anda tidak pernah tidur, siap kapan saja</p>
          </div>
        </div>
      </div>
    </div>
  );
}
