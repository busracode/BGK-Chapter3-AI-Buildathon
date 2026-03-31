import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Search, GraduationCap } from 'lucide-react';

const DiscoveryScreen = ({ user, onBack, onSelectMentor }) => {
  const [elders, setElders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestModal, setRequestModal] = useState({ visible: false, elder: null });
  const [topic, setTopic] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchElders();
  }, []);

  const fetchElders = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/matches/list-elders/${user?.id}`);
      const data = await response.json();
      setElders(data);
    } catch (error) {
      console.error("Elders fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!topic.trim()) return alert("Lütfen yardım almak istediğiniz konuyu belirtin.");
    
    setSending(true);
    try {
      const response = await fetch(`http://localhost:8000/api/matches/send-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          young_id: user.id,
          elder_id: requestModal.elder.id,
          topic: topic
        })
      });

      if (response.ok) {
        alert("İsteğiniz başarıyla gönderildi!");
        setRequestModal({ visible: false, elder: null });
        onBack(); // Go back to home to see status
      } else {
        const err = await response.json();
        alert(err.detail || "İstek gönderilemedi.");
      }
    } catch (error) {
      alert("Sunucuya bağlanılamadı.");
    } finally {
      setSending(false);
    }
  };

  const filteredElders = elders.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.expertise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-warmBg pb-20">
      {/* Header */}
      <div className="p-6 bg-white border-b-4 border-black flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full border-2 border-black">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-black uppercase tracking-tight">Mentor Keşfet</h1>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="İsim veya uzmanlık alanı ara..."
            className="w-full pl-12 pr-4 py-4 bg-white border-4 border-black rounded-xl font-bold focus:outline-none focus:ring-4 focus:ring-accent/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-accent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredElders.map((elder) => (
              <div key={elder.id} className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-blue-100 border-2 border-black rounded-full flex items-center justify-center text-2xl font-black">
                    {elder.name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-black leading-tight">{elder.name}</h2>
                    <p className="text-gray-500 font-bold">{elder.city} • {elder.age} Yaş</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-yellow-200 border-2 border-black px-3 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-1">
                    <GraduationCap size={14} />
                    {elder.expertise}
                  </span>
                </div>

                <p className="text-gray-700 font-medium line-clamp-3 mb-6 text-sm">
                  {elder.summary}
                </p>

                <button 
                  onClick={() => setRequestModal({ visible: true, elder })}
                  className="w-full bg-blue-500 text-white font-black py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
                >
                  YARDIM İSTE
                  <Send size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {requestModal.visible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-black">
          <div className="bg-white border-4 border-black rounded-3xl w-full max-w-lg p-8 animate-in fade-in zoom-in duration-200 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">İstek Gönder: {requestModal.elder?.name}</h2>
            
            <div className="my-6">
              <label className="block text-blue-600 font-black uppercase text-xs mb-2 tracking-widest bg-blue-50 w-fit px-2 py-0.5 border border-blue-200 rounded">KONU BAŞLIĞI / YARDIM TALEBİ</label>
              <textarea 
                className="w-full bg-gray-50 border-4 border-black rounded-xl p-4 font-bold text-lg focus:outline-none min-h-[140px] shadow-inner focus:bg-white transition-colors"
                placeholder="Örn: Kariyer planlama, Ders çalışmaya odaklanmak, Yalnızlık hissi..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <p className="text-[10px] font-bold text-gray-400 mt-2 italic">* Bu başlık mentorunuza sesli ve yazılı olarak iletilecektir.</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setRequestModal({ visible: false, elder: null })}
                className="flex-1 bg-gray-200 font-black py-4 rounded-xl border-4 border-black active:translate-y-1 active:shadow-none"
              >
                İPTAL
              </button>
              <button 
                onClick={handleSendRequest}
                disabled={sending}
                className="flex-1 bg-green-500 text-white font-black py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2"
              >
                {sending ? "GÖNDERİLİYOR..." : "İSTEĞİ GÖNDER"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryScreen;
