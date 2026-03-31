import { useState, useEffect } from "react";
import { MessageSquare, Calendar, ChevronRight, Sparkles } from "lucide-react";

export default function ChatListScreen({ user, onSelectChat }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [user.id]);

  const fetchSessions = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/chat/sessions/${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-warmBg pb-32 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="bg-white border-b-4 border-mintBorder p-8 pt-12 shadow-sm rounded-b-[40px]">
        <div className="flex items-center gap-4 mb-2">
          <div className="icon-wrapper w-12 h-12 bg-mintLight shadow-sm">
            <MessageSquare className="text-grass" size={24} strokeWidth={3} />
          </div>
          <h1 className="text-4xl font-serif font-black text-forest">Sohbetlerim</h1>
        </div>
        <p className="text-textMuted font-bold text-sm uppercase tracking-widest ml-16">Tüm Mesajlarınız</p>
      </div>

      <div className="px-6 mt-10 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 pointer-events-none">
            <div className="w-12 h-12 border-4 border-mintBorder border-t-grass rounded-full animate-spin"></div>
            <p className="font-black text-textMuted mt-4 uppercase tracking-widest">Sohbetler Yükleniyor...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card-soft p-12 text-center border-dashed border-4 border-borderSoft bg-white/50">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-warmBg rounded-full flex items-center justify-center text-textFaint">
                <MessageSquare size={40} />
              </div>
            </div>
            <h3 className="text-2xl font-serif font-black text-textMain mb-2">Henüz Sohbet Yok</h3>
            <p className="text-textMuted font-bold leading-relaxed">
              Ana sayfadan yeni eşleşmeler bularak sohbetlere başlayabilirsiniz.
            </p>
          </div>
        ) : (
          sessions.map((sess) => (
            <button
              key={sess.session_id}
              onClick={() => onSelectChat({session_id: sess.session_id, name: sess.other_name})}
              className="card-soft w-full p-6 text-left flex bg-white border-2 border-mintBorder hover:border-grass hover:shadow-xl transition-all group active:scale-95 relative"
            >
              <div className="flex-1 flex gap-5">
                {/* Avatar Placeholder */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-inner border-2 ${sess.is_ai ? 'bg-purpleBg text-purpleIcon border-purpleIcon/20' : 'bg-mintLight text-grass border-mintBorder'}`}>
                  {sess.is_ai ? <Sparkles size={32} /> : sess.other_name[0]}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black text-textMain group-hover:text-grass transition-colors">
                      {sess.is_ai ? "Yapay Zeka Destek" : sess.other_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-textFaint font-bold text-[11px] uppercase tracking-tighter pt-1">
                      <Calendar size={12} strokeWidth={3} />
                      {formatDate(sess.last_message_date)}
                    </div>
                  </div>
                  
                  <p className="text-textMid font-bold text-sm line-clamp-1 leading-relaxed opacity-80 group-hover:opacity-100 italic">
                    "{sess.last_message}"
                  </p>
                </div>

                <div className="flex items-center pl-4 text-textFaint group-hover:text-grass transition-colors">
                  <ChevronRight size={24} strokeWidth={3} />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
