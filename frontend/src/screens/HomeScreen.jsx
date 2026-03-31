import { useState, useEffect, useMemo } from "react";

export default function HomeScreen({ user, setUser, onStartChat, onOpenDiscovery }) {
  const [match, setMatch] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [moodInput, setMoodInput] = useState("");
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [stats, setStats] = useState({ session_count: 0, journal_count: 0 });
  const [weeklyScores, setWeeklyScores] = useState([]);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  const isBüyük = user?.role === "büyük";
  
  const chartData = useMemo(() => {
    const data = [0, 0, 0, 0, 0, 0, 0];
    // Backend scores are ordered oldest first. Fill from left to right.
    weeklyScores.forEach((item, index) => {
      if (index < 7) {
        data[index] = item.score;
      }
    });
    return data;
  }, [weeklyScores]);
  
  const speakText = (text) => {
    if (!isBüyük) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.onstart = () => {
       setIsListening(true);
       speakText("Sizi dinliyorum, lütfen bugünkü modunuzu söyleyin.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMoodInput(transcript);
      setIsListening(false);
      speakText("Anladım, kaydetmek için lütfen kaydet butonuna basın.");
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  useEffect(() => {
    if (user?.id) {
      fetchStats();
      fetchActiveMatch();
      fetchWeeklyScores();
      let interval;
      if (isBüyük) {
        fetchPendingRequests();
        interval = setInterval(() => {
          fetchPendingRequests();
          fetchActiveMatch();
          fetchWeeklyScores();
        }, 5000);
      } else {
        interval = setInterval(() => {
          fetchActiveMatch();
          fetchWeeklyScores();
        }, 5000);
      }
      return () => clearInterval(interval);
    }
  }, [user, isBüyük]);

  const fetchWeeklyScores = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/users/${user.id}/weekly-scores`);
      if (resp.ok) {
        const data = await resp.json();
        setWeeklyScores(data);
      }
    } catch (e) {
      console.error("Weekly scores error:", e);
    }
  };

  const handleSaveScore = async () => {
    if (selectedScore === null) return;
    setIsSubmittingScore(true);
    try {
      const resp = await fetch(`http://localhost:8000/api/users/${user.id}/daily-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: selectedScore })
      });
      if (resp.ok) {
        await fetchWeeklyScores();
        setIsScoreModalOpen(false);
        speakText(`Harika! Bugün için ${selectedScore} puan verdiniz. İlerlemeniz grafiğe kaydedildi.`);
      }
    } catch (e) {
      console.error(e);
      alert("Puan kaydedilemedi.");
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/users/${user.id}/stats`);
      const data = await resp.json();
      setStats(data);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/pending/${user.id}`);
      const data = await resp.json();
      setPendingRequests(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchActiveMatch = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/active/${user.id}`);
      const data = await resp.json();
      if (data && data.status) {
        let title = "";
        let desc = "";
        if (data.status === "pending" && !isBüyük) {
           title = "Eşleşme Bekleniyor";
           desc = "Büyük mentörünüzün eşleştirme isteğinizi onaylaması bekleniyor. Lütfen bekleyin.";
        } else if (data.status === "accepted") {
           title = isBüyük ? "Eşleşme Onaylandı" : "Mentör Onayladı";
           desc = isBüyük ? "Eşleşme onaylandı. Dilediğiniz zaman sohbeti başlatabilirsiniz." : `Büyük mentörünüz (${data.other_name}) sizinle görüşmeyi kabul etti!`;
        } else if (data.status === "chat_started") {
           title = "Sohbet Başladı";
           desc = `${data.other_name} sohbeti başlattı. Oda aktif.`;
        }

        setMatch({
          id: data.id,
          session_id: data.session_id,
          status: data.status,
          name: data.other_name,
          title: title,
          description: data.resonance_reason || desc,
          resonance_reason: data.resonance_reason
        });
      } else {
        setMatch(null);
      }
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
      if (resp.ok) {
        alert("Eşleşme isteği başarıyla gönderildi!");
        await fetchActiveMatch();
      } else {
        const errorData = await resp.json().catch(() => ({}));
        const msg = errorData.detail || "Eşleşme sırasında bir hata oluştu.";
        alert(msg);
      }
    } catch (e) {
      console.error(e);
      alert("Bir bağlantı hatası oluştu, lütfen tekrar deneyin.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAccept = async (reqId) => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/accept/${reqId}`, { method: "POST" });
      if (resp.ok) {
        speakText("Harika! Eşleşmeyi kabul ettiniz. Şimdi sohbete başlayabilirsiniz.");
        await fetchPendingRequests();
        await fetchActiveMatch();
      } else {
        const err = await resp.json();
        alert("Eşleşme onaylanırken hata: " + (err.detail || "Bilinmeyen hata"));
      }
    } catch (e) {
      console.error(e);
      alert("Sunucuya bağlanılamadı.");
    }
  };

  const handleStartChat = async (reqId, otherName) => {
    try {
      const resp = await fetch(`http://localhost:8000/api/matches/start-chat/${reqId}`, { method: "POST" });
      if (!resp.ok) {
        const err = await resp.json();
        alert("Sohbet başlatılamadı: " + (err.detail || "Hata"));
        return;
      }
      
      const data = await resp.json();
      if (data.session_id) {
         onStartChat({
           session_id: data.session_id,
           name: otherName
         });
      }
    } catch (e) {
      console.error(e);
      alert("Sohbet başlatılırken bir hata oluştu.");
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

  const getMoodData = (emo = null) => {
    const emotion = emo || user?.primary_emotion || "nötr";
    const map = {
      "kaygı": { emoji: "😟", label: "Kaygılı", color: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
      "hüzün": { emoji: "😔", label: "Hüzünlü", color: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
      "kafa_karışıklığı": { emoji: "🤔", label: "Kafa Karışık", color: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
      "umut": { emoji: "😊", label: "Mutlu", color: "bg-green-50", text: "text-green-700", border: "border-green-200" },
      "yas": { emoji: "🕯️", label: "Yasta", color: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
      "nötr": { emoji: "😌", label: "Huzurlu", color: "bg-mintLight", text: "text-grass", border: "border-mintBorder" }
    };
    return map[emotion] || map["nötr"];
  };

  const MOOD_OPTIONS = [
    { key: "umut", label: "Mutlu", emoji: "😊" },
    { key: "nötr", label: "Huzurlu", emoji: "😌" },
    { key: "hüzün", label: "Üzgün", emoji: "😔" },
    { key: "kaygı", label: "Kaygılı", emoji: "😟" },
    { key: "kafa_karışıklığı", label: "Şaşkın", emoji: "🤔" },
    { key: "yas", label: "Yasta", emoji: "🕯️" }
  ];

  const mood = getMoodData();

    const handleUpdateMood = async (selectedLabel = null) => {
    if (!moodInput.trim() && !selectedLabel) return;
    setIsUpdatingMood(true);
    
    // 15 second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const resp = await fetch(`http://localhost:8000/api/users/${user.id}/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mood_text: moodInput,
          mood_label: selectedLabel
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (resp.ok) {
        const updatedUser = await resp.json();
        setUser(updatedUser);
        setIsMoodModalOpen(false);
        setMoodInput("");
        
        // Use updated user emotion for feedback
        const feedbackMood = getMoodData(updatedUser.primary_emotion);
        speakText(`Harika! Modunuz güncellendi. Şu an kendinizi ${feedbackMood.label} hissediyorsunuz. Güzel bir gün dilerim!`);
      } else {
        const errData = await resp.json().catch(() => ({ detail: "Bilinmeyen sunucu hatası" }));
        alert(`Hata: ${errData.detail || "Mod güncellenemedi"}`);
      }
    } catch (e) {
      console.error(e);
      if (e.name === 'AbortError') {
        alert("İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin veya tekrar deneyin.");
      } else {
        alert("Bir bağlantı hatası oluştu.");
      }
    } finally {
      setIsUpdatingMood(false);
    }
  };

  return (
    <div className="bg-sage min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-borderSoft px-6 py-5 rounded-b-[24px] mb-6 shadow-sm relative overflow-hidden">
        <div className="blob w-32 h-32 -top-10 -right-10 bg-mintLight opacity-60"></div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="font-bold text-textMuted tracking-wide text-sm mb-1 uppercase opacity-80">Hoş Geldin</p>
            <h2 className="text-2xl md:text-3xl font-serif text-textMain tracking-tight leading-tight">{user?.name}</h2>
          </div>
          <div className="w-10 h-10 bg-grass rounded-full flex items-center justify-center font-bold text-white text-lg shadow-sm">
            {user?.name?.[0] || "U"}
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <h3 className="text-xl font-serif text-textMain">Eşleşmeler</h3>
        
        {match && (match.status === "accepted" || match.status === "chat_started" || (!isBüyük && match.status === "pending")) ? (
          <div className="card-soft border-[1.5px] border-mintBorder p-5 animate-[fadeIn_0.5s_ease-out] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-grass"></div>
            <div className="blob w-32 h-32 -top-10 -right-10 bg-mintLight opacity-60"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="pill-badge bg-mintLight text-textMain flex items-center gap-2">
                  {match.status === "chat_started" || match.status === "accepted" ? (
                     <span className="w-2 h-2 rounded-full bg-grass animate-[pulse_1.4s_infinite]"></span>
                  ) : null}
                  {match.title}
                </div>
              </div>
              
              <h4 className="text-xl md:text-2xl font-serif font-black text-textMain mb-3 leading-tight">{match.name || "Eşleşme Bekleniyor"}</h4>
              <p className="font-bold text-textMid text-base mb-6 leading-relaxed bg-warmBg p-4 rounded-2xl border border-borderSoft shadow-inner">
                {match.description}
              </p>
              
              {match.status === "accepted" && (
                <button 
                  onClick={() => handleStartChat(match.id, match.name)}
                  className="btn-primary w-full py-4 uppercase tracking-wider text-base shadow-md hover:-translate-y-1 transition-transform"
                >
                  Sohbete Başla
                </button>
              )}
              {match.status === "chat_started" && match.session_id && (
                <button 
                  onClick={() => onStartChat(match)}
                  className="btn-primary w-full py-4 uppercase tracking-wider text-base shadow-[0_5px_15px_rgba(40,167,69,0.3)] animate-[pulse_2s_infinite]"
                >
                  Sohbete Gir →
                </button>
              )}
              {match.status === "pending" && (
                <button disabled className="bg-mintMid text-grass shrink-0 w-full py-4 rounded-[16px] font-black uppercase tracking-wider border border-mintBorder opacity-80 cursor-wait">
                  Onay Bekleniyor...
                </button>
              )}
            </div>
          </div>
        ) : !isBüyük ? (
          <div className="card-soft border-dashed p-10 text-center animate-[slideUp_0.6s_ease-out]">
            <div className="mx-auto w-20 h-20 bg-mintLight rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-mintBorder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-grass">
                <path d="M17 18a5 5 0 0 0-10 0"></path>
                <circle cx="12" cy="8" r="3"></circle>
                <circle cx="18" cy="6" r="2"></circle>
                <path d="M18 8v4M6 6v4"></path>
              </svg>
            </div>
            <p className="text-lg font-bold text-textMuted mb-8 px-4">Henüz aktif bir eşleşmen yok. Yeni bir arkadaşla tanışmaya ne dersin?</p>
            <button 
              onClick={onOpenDiscovery}
              className="btn-primary w-full py-5 text-lg tracking-widest uppercase"
            >
              KEŞFET & MENTÖR SEÇ ✨
            </button>
          </div>
        ) : null}

        {isBüyük && pendingRequests.length === 0 && (!match || match.status === "pending") && (
          <div className="card-soft p-8 text-center border-dashed mb-6">
            <p className="font-semibold text-textMuted">Şu an bekleyen bir görüşme talebiniz veya aktif eşleşmeniz yok.</p>
          </div>
        )}

        {isBüyük && pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-textMain mb-3">Bekleyen İstekler</h3>
            {pendingRequests.map(req => (
              <div key={req.match_id} className="card-soft border-[1.5px] border-mintBorder p-5 animate-[fadeIn_0.5s_ease-out] mb-4">
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
                  <div className="mt-4 p-4 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black text-gray-400 uppercase mb-1">Yardım İstediği Konu:</p>
                    <p className="text-lg font-black text-textMain leading-tight">"{req.topic}"</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-textMuted uppercase tracking-tighter">Uzmanlık Uyumu</p>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-20 bg-gray-200 rounded-full overflow-hidden border border-black">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${req.resonance_score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-black text-green-600">%{Math.round(req.resonance_score)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req.match_id)} className="btn-primary flex-1 py-4 uppercase text-sm tracking-widest">
                    Kabul Et
                  </button>
                  <button 
                    onClick={() => speakText(`${req.young_name} adlı genç, ${req.topic} konusunda sizden destek bekliyor. Uzmanlık uyumunuz yüzde ${Math.round(req.resonance_score)}.`)}
                    className="bg-yellow-100 text-yellow-700 font-black py-4 px-6 rounded-2xl uppercase text-sm tracking-widest border border-yellow-200 hover:bg-yellow-200 transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Dinle
                  </button>
                </div>
                <button onClick={() => handleReject(req.match_id)} className="w-full mt-3 font-black text-red-500 bg-red-50 py-3 rounded-2xl uppercase text-xs tracking-widest border border-red-100 hover:bg-red-100 transition-all">
                  Reddet
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <h3 className="text-xl font-serif text-textMain mt-8">Günün Özeti</h3>
        
        {/* Weekly Progress Chart */}
        <div className="card-soft p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-textMain uppercase tracking-tighter">Haftalık İlerleme</h3>
              <p className="text-xs font-bold text-textMuted uppercase opacity-70 tracking-widest">Son 7 Günlük Serüvenin</p>
            </div>
            <button 
              onClick={() => {
                setIsScoreModalOpen(true);
                if (isBüyük) speakText("Bugün kendinizi 1 ile 10 arasında nasıl puanlarsınız? Lütfen bir rakam seçin.");
              }}
              className="bg-grass text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:rotate-2 transition-transform shadow-md"
            >
              Bugünü Puanla ✨
            </button>
          </div>

          <div className="h-56 w-full relative flex items-end justify-between gap-1 sm:gap-2 pt-8 pb-2">
            {/* Arka plan referans çizgileri */}
            <div className="absolute inset-0 flex flex-col justify-between pt-10 pb-8 pointer-events-none opacity-20">
              <div className="border-t-2 border-dashed border-grass w-full relative"><span className="absolute -top-4 right-0 text-[10px] font-black text-textMain">10 Puan</span></div>
              <div className="border-t-2 border-dashed border-grass w-full relative"><span className="absolute -top-4 right-0 text-[10px] font-black text-textMain">5 Puan</span></div>
              <div className="border-t-2 border-solid border-grass w-full relative"><span className="absolute -top-4 right-0 text-[10px] font-black text-textMain">0 Puan</span></div>
            </div>

            {chartData.map((score, i) => (
              <div key={i} className="flex flex-col items-center justify-end flex-1 h-full z-10 group relative mt-4">
                {/* Score tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-textMain text-white text-[12px] font-bold py-1 px-3 rounded-lg shadow-xl z-20 pointer-events-none">
                  {score}/10
                </div>
                
                {/* Bar wrapper */}
                <div className="flex-1 w-full max-w-[20px] sm:max-w-[28px] bg-mintLight/40 rounded-t-xl relative overflow-hidden shadow-inner border border-mintBorder/40">
                  {/* Fill relative to score */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-grass transition-all duration-1000 ease-out rounded-t-md group-hover:bg-textMain group-hover:shadow-[0_0_12px_rgba(27,94,59,0.3)]"
                    style={{ height: `${score * 10}%`, minHeight: score > 0 ? '6px' : '0' }}
                  ></div>
                </div>
                
                <span className="text-[9px] sm:text-[11px] font-black text-textMuted mt-3 uppercase whitespace-nowrap">
                  {`${i + 1}. Gün`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Score Modal */}
        {isScoreModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-white border-[4px] border-black rounded-[40px] w-full max-w-sm p-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.3)]">
              <h4 className="text-3xl font-serif font-black text-center mb-8">Bugünün Puanı?</h4>
              
              <div className="grid grid-cols-5 gap-3 mb-10">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => {
                      setSelectedScore(n);
                      if (isBüyük) speakText(`${n} puan seçildi.`);
                    }}
                    className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center font-black text-lg transition-all active:scale-90
                      ${selectedScore === n ? 'bg-grass text-white rotate-6 scale-110' : 'bg-warmBg text-textMain hover:bg-mintLight'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSaveScore}
                  disabled={selectedScore === null || isSubmittingScore}
                  className={`btn-primary w-full py-5 text-xl tracking-widest ${selectedScore === null ? 'opacity-50 grayscale' : ''}`}
                >
                  {isSubmittingScore ? "KAYDEDİLİYOR..." : "PUANI KAYDET ✨"}
                </button>
                <button 
                  onClick={() => setIsScoreModalOpen(false)}
                  className="w-full py-3 font-black text-gray-400 uppercase text-xs tracking-widest hover:text-red-500 transition-colors"
                >
                  VAZGEÇ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mood Card */}
        <div className={`card-soft group ${mood.color} ${mood.border} p-5 border-2 flex items-center justify-between transition-all hover:scale-[1.02] cursor-default mb-4 relative overflow-hidden`}>
          <div className="flex items-center gap-4 relative z-10">
            <div className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-white">
              {mood.emoji}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-textMuted opacity-70">Günün Modu</p>
              <h4 className={`text-xl font-serif font-black ${mood.text}`}>{mood.label}</h4>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsMoodModalOpen(true);
              speakText("Bugün nasıl hissediyorsunuz? Lütfen buraya yazın ve kaydedin.");
            }}
            className="w-12 h-12 bg-white rounded-xl shadow-sm border border-white flex items-center justify-center text-textMuted hover:text-grass transition-colors relative z-10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>

        {/* Mood Update Overlay/Input */}
        {isMoodModalOpen && (
          <div className="card-soft bg-white border-[3px] border-mintBorder p-8 mb-6 animate-[slideDown_0.3s_ease-out] shadow-2xl">
            <h4 className="text-2xl font-serif font-black text-textMain mb-6 text-center">Bugün nasıl hissediyorsun?</h4>
            
            {/* Emoji Grid */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => handleUpdateMood(m.key)}
                  className="flex flex-col items-center justify-center p-6 bg-warmBg border-2 border-borderSoft rounded-[32px] hover:border-grass hover:bg-white transition-all active:scale-95 group shadow-sm hover:shadow-md"
                >
                  <span className="text-4xl mb-2 group-hover:scale-125 transition-transform duration-300">{m.emoji}</span>
                  <span className="font-black text-textMid uppercase tracking-tight text-sm opacity-70 group-hover:opacity-100 group-hover:text-grass">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <p className="text-center font-bold text-textMuted uppercase text-sm tracking-widest opacity-60">— VEYA —</p>
              <div className="flex flex-col gap-5">
                <div className="flex gap-3 relative">
                  <input 
                    type="text" 
                    value={moodInput}
                    onChange={(e) => setMoodInput(e.target.value)}
                    placeholder="Detaylı anlatmak ister misin?..."
                    className="flex-1 bg-warmBg border-2 border-borderSoft rounded-2xl px-5 py-5 font-bold text-textMain outline-none focus:border-grass transition-colors text-xl shadow-inner placeholder:text-textFaint"
                    autoFocus
                  />
                
                {/* Voice Button */}
                <button 
                  onClick={handleStartVoice}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-mintLight text-grass border border-mintBorder hover:bg-mintMid'}`}
                  title="Sesle Söyle"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleUpdateMood}
                  disabled={isUpdatingMood || isListening}
                  className={`btn-primary flex-1 py-4 text-base tracking-widest uppercase shadow-lg active:scale-95 transition-all ${isUpdatingMood ? 'opacity-70' : ''}`}
                >
                  {isUpdatingMood ? "KAYDEDİLİYOR..." : "MODUMU KAYDET 👋"}
                </button>
                <button 
                  onClick={() => setIsMoodModalOpen(false)}
                  className="bg-red-50 text-red-500 px-6 rounded-xl border border-red-100 font-bold active:scale-95 transition-all"
                >
                  İPTAL
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

      </div>
    </div>
  );
}
