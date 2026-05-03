import { MessageCircle, ExternalLink, Bot, Zap, Clock } from 'lucide-react';

export default function ChatPage() {
  const whatsappNumber = '6282199152980';
  const waUrl = `https://wa.me/${whatsappNumber}?text=Halo%20Asisten%20Bisnis`;

  return (
    <div className="fade-in-up">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2>AI Agent WhatsApp</h2>
        <p>Asisten bisnis Anda sekarang tersedia langsung di saku Anda, 24/7.</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '40px 30px', textAlign: 'center', background: 'linear-gradient(to bottom, #ffffff, #fafafa)' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(37, 211, 102, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#25D366'
          }}>
            <MessageCircle size={40} />
          </div>

          <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Hubungkan ke WhatsApp
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>
            Kami telah memindahkan pengalaman AI Agent langsung ke WhatsApp untuk kemudahan akses dan performa yang lebih cepat. Tidak perlu lagi login ke dashboard untuk mencatat transaksi atau mengecek stok!
          </p>

          <a 
            href={waUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: '#25D366',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '1.1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.3)';
            }}
          >
            <MessageCircle size={22} />
            Chat dengan AI Sekarang
            <ExternalLink size={18} style={{ opacity: 0.8 }} />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginTop: '30px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'white' }}>
            <Bot size={24} style={{ color: 'var(--accent-purple)', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>OpenClaw AI</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Didukung oleh teknologi AI cerdas untuk bisnis</p>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'white' }}>
            <Zap size={24} style={{ color: '#F59E0B', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Respon Instan</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pencatatan penjualan dan stok dalam hitungan detik</p>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'white' }}>
            <Clock size={24} style={{ color: '#3B82F6', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Aktif 24/7</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Asisten Anda tidak pernah tidur, siap kapan saja</p>
          </div>
        </div>
      </div>
    </div>
  );
}
