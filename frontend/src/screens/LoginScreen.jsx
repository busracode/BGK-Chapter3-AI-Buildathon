import { useState, useEffect } from "react";
import SpeechCapture from "../components/SpeechCapture";

export default function LoginScreen({ role, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    picture_password: []
  });
  const [loading, setLoading] = useState(false);

  const isGenc = role === "genç";

  const speakText = (text) => {
    if (isGenc) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    window.speechSynthesis.speak(utterance);
  };

  const handleFocus = (field) => {
    const prompts = {
      name: "Giriş yapmak için adınızı söyleyin veya kutuya dokunun.",
      picture: "Lütfen kayıt olurken seçtiğiniz 3 resmi sırasıyla tıklayın. Unutmayın, resimlerin seçilme sırası çok önemlidir."
    };
    if (prompts[field]) speakText(prompts[field]);
  };

  useEffect(() => {
    if (!isGenc) {
      speakText("Hoş geldiniz. Giriş yapmak için adınızı söyleyin veya kutuya dokunun.");
    }
  }, [role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Lütfen isminizi girin.");
    if (isGenc && !formData.password) return alert("Lütfen şifrenizi girin.");
    if (!isGenc && formData.picture_password.length < 3) return alert("Lütfen 3 resim seçin.");

    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          password: isGenc ? formData.password : null,
          picture_password: isGenc ? null : formData.picture_password.join(",")
        })
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || "Giriş başarısız.");
      }
      
      const data = await resp.json();
      onSubmit(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
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

      <div className="card-soft w-full max-w-2xl mx-auto p-8 z-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-[34px] font-black font-serif text-textMain mb-2 leading-tight">Tekrar Hoş Geldin</h2>
        <p className="text-xl text-textMuted font-semibold mb-8">Lütfen giriş yapın.</p>

        <form onSubmit={handleSubmit} className="space-y-10 font-sans">
          {isGenc ? (
            <div className="space-y-6">
              <div>
                <label className="block font-black text-textMain text-lg mb-2 px-2 uppercase tracking-wide opacity-80">İsminiz</label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-soft w-full p-4 font-bold text-textMain placeholder-textFaint transition-all focus:shadow-md"
                  placeholder="Adınız ve Soyadınız"
                />
              </div>
              <div>
                <label className="block font-black text-textMain text-lg mb-2 px-2 uppercase tracking-wide opacity-80">Şifreniz</label>
                <input 
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-soft w-full p-4 font-bold text-textMain placeholder-textFaint transition-all focus:shadow-md"
                  placeholder="Şifrenizi girin"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Name Field with Voice for Elders */}
              <div className="space-y-4">
                <label className="block font-black text-forest text-2xl mb-2 px-4 uppercase tracking-widest text-center opacity-70">
                  Adınız ve Soyadınız
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus("name")}
                    className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    placeholder="Buraya Yazın veya Söyleyin"
                  />
                  <SpeechCapture onResult={(val) => setFormData(p => ({...p, name: val}))} isLarge={true} />
                </div>
              </div>

              <div className="w-full animate-[slideUp_0.6s_ease-out] bg-goldBg/30 p-8 rounded-[48px] border-4 border-goldIcon/40">
                <label 
                  className="block font-black text-goldText text-3xl mb-6 px-2 text-center uppercase tracking-tighter"
                  onClick={() => handleFocus("picture")}
                >
                  Resim Parolanız
                </label>
                <div className="grid grid-cols-3 gap-6">
                  {['🏠', '🌳', '🍎', '🐶', '👵', '👴', '🚗', '🚲', '☕'].map((icon, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const newSelection = [...formData.picture_password];
                        if (newSelection.includes(icon)) {
                          setFormData({ ...formData, picture_password: newSelection.filter(i => i !== icon) });
                        } else if (newSelection.length < 3) {
                          setFormData({ ...formData, picture_password: [...newSelection, icon] });
                          if (newSelection.length === 0) speakText("Birinci resim tamam. İki resim daha seçin.");
                          if (newSelection.length === 1) speakText("İkinci resim tamam. Son bir tane kaldı.");
                          if (newSelection.length === 2) speakText("Tamamdır! Giriş yap butonuna basın.");
                        }
                      }}
                      className={`w-full py-10 text-7xl rounded-[32px] border-4 transition-all active:scale-95 shadow-lg relative
                        ${formData.picture_password.includes(icon) 
                          ? 'border-goldText bg-white shadow-[0_0_30px_rgba(184,134,11,0.2)] scale-105' 
                          : 'border-white bg-white/60 hover:bg-white hover:border-goldIcon/50'}`}
                    >
                      {icon}
                      {formData.picture_password.indexOf(icon) !== -1 && (
                        <span className="absolute -top-4 -right-4 w-12 h-12 bg-goldText text-white text-2xl rounded-full flex items-center justify-center font-black shadow-lg ring-4 ring-white">
                          {formData.picture_password.indexOf(icon) + 1}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full shadow-2xl transition-all
              ${isGenc ? 'h-16 text-xl' : 'py-10 text-4xl border-b-[10px] active:border-b-4 active:translate-y-2'}`}
          >
            {loading ? (
               <div className="flex items-center justify-center gap-4">
                 <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span>Giriş Yapılıyor...</span>
               </div>
            ) : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
