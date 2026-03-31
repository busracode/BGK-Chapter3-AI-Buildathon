import { useState, useEffect } from "react";

export default function JournalScreen({ user }) {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("Analiz yapılıyor...");

  useEffect(() => {
    if(user?.id && user.id !== 'demo') {
      fetchEntries();
      fetchAnalysis();
    }
  }, [user]);

  const fetchEntries = () => {
    fetch(`http://localhost:8000/api/journal/${user.id}`)
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(console.error);
  };

  const fetchAnalysis = () => {
    fetch(`http://localhost:8000/api/journal/analysis/${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.analysis) setAiAnalysis(data.analysis);
      })
      .catch(e => {
        console.error(e);
        setAiAnalysis("Henüz yeterli veri yok.");
      });
  };

  const handleSave = async () => {
    if(!newEntry || !user?.id) return;
    try {
      const res = await fetch(`http://localhost:8000/api/journal/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newEntry })
      });
      const data = await res.json();
      setEntries([data, ...entries]);
      setNewEntry("");
      // Refresh analysis after a new entry
      setTimeout(fetchAnalysis, 1000);
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-sage min-h-screen pb-32 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="bg-white border-b border-borderSoft px-6 py-5 shadow-sm sticky top-0 z-10">
        <h2 className="text-[28px] font-serif font-black text-textMain tracking-tight">Dijital Günlük</h2>
      </div>
      
      <div className="p-6">
        {/* Yeni Ders Notu */}
        <div className="card-soft border-[1.5px] border-mintBorder p-5 mb-8">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-grass"></div>
          
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 rounded-[10px] bg-mintLight flex justify-center items-center">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-grass"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
             </div>
             <h3 className="font-bold text-textMain text-lg leading-none">Yeni Hayat Dersi</h3>
          </div>
          
          <textarea 
            className="input-soft w-full p-4 mb-3 font-semibold text-textMain placeholder-textFaint text-base resize-none min-h-[100px]"
            value={newEntry}
            onChange={e => setNewEntry(e.target.value)}
            placeholder="Bugün ne öğrendin?"
          />
          <button onClick={handleSave} className="btn-primary w-full h-12 text-[15px] tracking-wide">KAYDET</button>
        </div>

        {/* AI Özet Kartı (Örnek) */}
        {entries.length > 0 && (
          <div className="card-soft mb-6 p-5 border-[1.5px] border-mintBorder bg-[linear-gradient(135deg,#FFFFFF,#F7FDF9)]">
             <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-[8px] bg-goldBg flex justify-center items-center mt-1 shrink-0">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-goldIcon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
               </div>
              <div>
                  <h4 className="font-sans font-bold text-textMain mb-1">AI Özeti</h4>
                  <p className="text-sm font-semibold text-textMid">Son girişlerinize göre odağınız: "{aiAnalysis}"</p>
               </div>
             </div>
          </div>
        )}

        <div className="space-y-4">
          {entries.length === 0 && (
            <div className="border border-dashed border-mintMid rounded-2xl p-6 text-center text-textMuted font-bold text-sm bg-warmBg">
              Henüz kaydedilmiş bir ders yok.
            </div>
          )}
          {entries.map((entry, idx) => (
            <div key={entry.id || idx} className="card-soft p-5">
              <div className="flex items-center gap-2 mb-3 border-b border-borderSoft pb-3">
                 <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-grass' : 'bg-goldIcon'}`}></span>
                 <span className="text-xs font-bold text-textMuted">
                   {entry.created_at ? new Date(entry.created_at).toLocaleDateString("tr-TR") : "Bugün"}
                 </span>
                 <div className="ml-auto flex gap-1">
                   <span className="pill-badge bg-mintLight text-textMain border border-mintBorder text-[10px] uppercase">GELİŞİM</span>
                 </div>
              </div>
              <p className="font-serif font-bold text-xl text-textMain leading-tight">"{entry.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
