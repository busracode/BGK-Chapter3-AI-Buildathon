import { useState, useEffect } from "react";

export default function HomeScreen({ user, onStartChat }) {
  const [match, setMatch] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const isBüyük = user?.role === "büyük";

  useEffect(() => {
    if (isBüyük && user?.id) {
      fetchPendingRequests();
      const interval = setInterval(fetchPendingRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/pending/${user.id}`);
      const data = await resp.json();
      setPendingRequests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchMatch = async () => {
    setIsSearching(true);
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/find?user_id=${user.id}`, {
        method: "POST"
      });
      const data = await resp.json();
      setMatch({
        id: data.id,
        session_id: null,
        name: "Eşleşme Bekleniyor",
        age: "",
        description: "Büyük mentörünüzün eşleştirme isteğinizi onaylaması bekleniyor."
      });
    } catch (e) {
      console.error(e);
      alert("Eşleşme sırasında bir hata oluştu.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAccept = async (reqId) => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/accept/${reqId}`, { method: "POST" });
      const data = await resp.json();
      onStartChat({
        id: reqId,
        session_id: data.session_id,
        name: "Genç Arkadaş"
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (reqId) => {
    try {
      await fetch(`http://localhost:8000/api/matches/reject/${reqId}`, { method: "POST" });
      fetchPendingRequests();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-sage min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-borderSoft px-6 py-5 rounded-b-[24px] mb-6 shadow-sm relative overflow-hidden">
        <div className="blob w-32 h-32 -top-10 -right-10 bg-mintLight opacity-60"></div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="font-bold text-textMuted tracking-wide text-xs mb-1">Hoş Geldin</p>
            <h2 className="text-3xl font-serif text-textMain tracking-tight">{user?.name}</h2>
          </div>
          <div className="w-12 h-12 bg-grass rounded-full flex items-center justify-center font-bold text-white text-xl shadow-sm">
            {user?.name?.[0] || "U"}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <h3 className="text-xl font-serif text-textMain">Eşleşmeler</h3>
        
        {!isBüyük ? (
          /* GENÇ AKIŞI */
          !match ? (
            <div className="card-soft border-dashed p-8 text-center animate-[fadeIn_0.5s_ease-out]">
              <div className="mx-auto w-16 h-16 bg-mintLight rounded-2xl flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grass">
                  <path d="M17 18a5 5 0 0 0-10 0"></path>
                  <circle cx="12" cy="8" r="3"></circle>
                  <circle cx="18" cy="6" r="2"></circle>
                  <path d="M18 8v4M6 6v4"></path>
                </svg>
              </div>
              <p className="font-semibold text-textMuted mb-6">Henüz aktif bir eşleşmen yok.</p>
              <button 
                onClick={handleSearchMatch}
                disabled={isSearching}
                className="btn-primary w-full py-4 text-sm tracking-wider"
              >
                {isSearching ? "Eşleşme Aranıyor..." : "YENİ EŞLEŞME BUL ✨"}
              </button>
            </div>
          ) : (
            <div className="card-soft border-[1.5px] border-mintBorder p-5 animate-[fadeIn_0.5s_ease-out]">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-grass"></div>
              <div className="blob w-32 h-32 -top-10 -right-10 bg-mintLight opacity-60"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="pill-badge bg-mintLight text-textMain flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-grass animate-[pulse_1.4s_infinite]"></span>
                    Yapay Zeka Eşleşmesi
                  </div>
                </div>
                
                <h4 className="text-2xl font-serif font-bold text-textMain mb-2">{match.name}</h4>
                <p className="font-semibold text-textMid text-sm mb-5 leading-relaxed bg-warmBg p-3 rounded-xl border border-borderSoft">
                  {match.description}
                </p>
                
                {match.session_id && (
                  <button 
                    onClick={() => onStartChat(match)}
                    className="btn-primary w-full py-3"
                  >
                    Sohbete Başla →
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          /* BÜYÜK AKIŞI */
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="card-soft p-8 text-center border-dashed">
                <p className="font-semibold text-textMuted">Şu an bekleyen bir görüşme talebiniz yok.</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div key={req.match_id} className="card-soft border-[1.5px] border-mintBorder p-5 animate-[fadeIn_0.5s_ease-out]">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-grass"></div>
                  <h4 className="text-lg font-bold text-textMain mb-3 block">Seninle konuşmak isteyen biri var!</h4>
                  <div className="bg-mintLight rounded-xl p-4 mb-5 border border-mintBorder">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shadow-sm">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-grass">
                            <path d="M12 20 L12 10" />
                            <path d="M12 14 Q8 11 6 12" />
                            <path d="M12 12 Q16 9 18 10" />
                         </svg>
                       </div>
                       <div>
                         <p className="font-bold text-textMain leading-tight">{req.young_name}, {req.young_age}</p>
                         <p className="text-xs text-textMid">{req.young_city}</p>
                       </div>
                    </div>
                    <p className="text-sm font-semibold text-textMid mt-3">Duygu: <span className="capitalize">{req.young_emotion}</span></p>
                    <div className="inline-block mt-3 pill-badge bg-white border border-borderSoft text-grass text-xs">
                      %{Math.round(req.resonance_score)} Uyum
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleAccept(req.match_id)} className="btn-primary py-3 uppercase text-xs tracking-wider">
                      kabul Et
                    </button>
                    <button onClick={() => handleReject(req.match_id)} className="font-bold text-red-500 bg-red-50 py-3 rounded-xl uppercase text-xs tracking-wider border border-red-100 hover:bg-red-100 transition-colors">
                      Reddet
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats Grid */}
        <h3 className="text-xl font-serif text-textMain mt-8">İstatistikler</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="card-soft p-5 flex flex-col items-center">
            <div className="icon-wrapper w-10 h-10 bg-mintLight mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grass"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <div className="text-3xl font-serif font-black text-textMain">12</div>
            <div className="font-bold text-sm text-textMuted mt-1">Oturum</div>
          </div>
          <div className="card-soft p-5 flex flex-col items-center">
            <div className="icon-wrapper w-10 h-10 bg-purpleBg mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purpleIcon"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <div className="text-3xl font-serif font-black text-textMain">4</div>
            <div className="font-bold text-sm text-textMuted mt-1">Günlük</div>
          </div>
        </div>
      </div>
    </div>
  );
}
