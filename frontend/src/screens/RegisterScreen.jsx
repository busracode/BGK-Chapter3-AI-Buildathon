import { useState, useRef } from "react";

export default function RegisterScreen({ role, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "",
    current_mood_text: ""
  });
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const isGenc = role === "genç";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor. Lütfen Chrome kullanın.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (e) => {
      let finalTranscript = "";
      for (let i = 0; i < e.results.length; i++) {
         finalTranscript += e.results[i][0].transcript;
      }
      setFormData(prev => ({ ...prev, current_mood_text: finalTranscript }));
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error", e);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGenc && (!formData.name || !formData.age)) {
        return alert("Lütfen isim ve yaş giriniz.");
    }
    if (!isGenc && !formData.current_mood_text) {
        return alert("Lütfen kendinizi sesli tanıtın veya metin girin.");
    }
    
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "",
          age: parseInt(formData.age) || 0,
          city: formData.city || "Bilinmiyor",
          role: role,
          current_mood_text: formData.current_mood_text || "Belirtilmedi."
        })
      });
      const data = await resp.json();
      onSubmit(data);
    } catch (err) {
      console.error(err);
      alert("Sunucuya ulaşılamadı. Lütfen backend'in çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-warmBg p-6 flex flex-col justify-center relative overflow-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="blob w-72 h-72 -top-10 -right-20 bg-mintLight opacity-60 blur-xl"></div>
      <div className="blob w-56 h-56 bottom-0 -left-20 bg-mintBorder opacity-40 blur-lg"></div>

      <button onClick={onBack} className="self-start mb-6 text-textMuted font-bold flex items-center gap-2 z-10 active:opacity-50 transition-opacity">
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5 stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        GERİ
      </button>
      
      <div className="card-soft w-full max-w-md mx-auto p-6 z-10">
        <h2 className="text-[28px] font-black font-serif text-textMain mb-2 leading-tight">Hoş Geldin</h2>
        
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-borderSoft">
          <span className="font-bold text-textMid">Profil:</span>
          <span className="pill-badge bg-mintLight text-grass border border-mintBorder text-xs uppercase tracking-wider">
            {role}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          {isGenc ? (
            <>
              <div>
                <label className="block font-bold text-textMain text-sm mb-1 px-2">İsim</label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-soft w-full p-3 font-semibold text-textMain placeholder-textFaint"
                  placeholder="Adınız"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-textMain text-sm mb-1 px-2">Yaş</label>
                  <input 
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-soft w-full p-3 font-semibold text-textMain placeholder-textFaint"
                    placeholder="Yaşınız"
                  />
                </div>
                <div>
                  <label className="block font-bold text-textMain text-sm mb-1 px-2">Şehir</label>
                  <input 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-soft w-full p-3 font-semibold text-textMain placeholder-textFaint"
                    placeholder="Örn: Ankara"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-textMain text-sm mb-1 border-t border-borderSoft pt-4 mt-2 px-2">
                  Ne tür bir rehberlik istiyorsun?
                </label>
                <textarea 
                  name="current_mood_text"
                  value={formData.current_mood_text}
                  onChange={handleChange}
                  className="input-soft w-full p-3 font-semibold text-textMain placeholder-textFaint min-h-[100px] resize-none"
                  placeholder="Kariyerim hakkında tavsiyeler arıyorum..."
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-2 animate-[fadeIn_0.5s_ease-out]">
               <button 
                  type="button" 
                  onClick={toggleRecording}
                  className={`w-full py-4 text-lg font-bold rounded-2xl flex justify-center items-center gap-2 transition-all border border-mintBorder shadow-sm
                    ${isRecording ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-mintLight text-grass hover:bg-mintBorder/40'}`}
               >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   {isRecording ? (
                     <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"></rect>
                   ) : (
                     <>
                       <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                       <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                       <line x1="12" x2="12" y1="19" y2="22"></line>
                     </>
                   )}
                 </svg>
                 {isRecording ? "Kaydı Bitir" : "Kendini Sesle Tanıt"}
               </button>
               
               <p className="text-sm font-semibold text-textMuted mb-3 mt-3 px-2 text-center leading-relaxed">
                 Mikrofona ismini, yaşını, şehrini, hobilerini ve yaşam tecrübelerini anlat. Yapay zeka profilini senin yerine çıkaracak.
               </p>
               
               <textarea 
                  name="current_mood_text"
                  value={formData.current_mood_text}
                  onChange={handleChange}
                  className="input-soft w-full p-3 font-semibold text-textMain placeholder-textFaint min-h-[140px] resize-none"
                  placeholder="Dikte edilen metin burada görünecek..."
                />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 h-14 text-lg shadow-sm">
            {loading ? (
              <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : "Kaydol ve Başla"}
          </button>
        </form>
      </div>
    </div>
  );
}
