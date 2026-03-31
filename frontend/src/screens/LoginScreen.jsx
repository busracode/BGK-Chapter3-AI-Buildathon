import { useState, useEffect } from "react";
import SpeechCapture from "../components/SpeechCapture";

export default function LoginScreen({ role, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    username: "",
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
      username: "Giriş yapmak için kullanıcı adınızı söyleyin veya kutuya dokunun.",
      picture: "Lütfen kayıt olurken seçtiğiniz 3 resmi sırasıyla tıklayın. Unutmayın, resimlerin seçilme sırası çok önemli."
    };
    if (prompts[field]) speakText(prompts[field]);
  };

  useEffect(() => {
    if (!isGenc) {
      speakText("Hoş geldiniz. Giriş yapmak için kullanıcı adınızı söyleyin veya kutuya dokunun.");
    }
  }, [role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) return alert("Lütfen kullanıcı adınızı girin.");
    if (isGenc && !formData.password) return alert("Lütfen şifrenizi girin.");
    if (!isGenc && formData.picture_password.length < 3) return alert("Lütfen 3 resim seçin.");

    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
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
                <label className="block font-black text-textMain text-lg mb-2 px-2 uppercase tracking-wide opacity-80">Kullanıcı Adınız</label>
                <input 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-soft w-full p-4 font-bold text-textMain placeholder-textFaint transition-all focus:shadow-md"
                  placeholder="Kullanıcı Adınız"
                />
              </div>
              <div className="space-y-6 bg-white/50 p-6 rounded-[32px] border-4 border-mintLight/50">
                <label className="block text-sm font-black text-textMain opacity-60 uppercase text-center">Giriş Şifreniz (6 Haneli PIN)</label>
                
                <div className="flex justify-center gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-12 h-14 rounded-2xl flex items-center justify-center text-4xl border-4 transition-all duration-300 ${formData.password.length > i ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(46,125,50,0.4)] scale-110' : 'border-borderSoft bg-white/80'}`}>
                      {formData.password.length > i ? '•' : ''}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mt-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button 
                      type="button" 
                      key={num} 
                      onClick={() => { if(formData.password.length < 6) handleChange({target: {name: 'password', value: formData.password + num}})}} 
                      className="w-full h-16 text-3xl font-black rounded-3xl bg-white border-4 border-borderSoft border-b-[8px] active:border-b-4 active:translate-y-1 transition-all hover:bg-mintLight/20 text-textMain"
                    >
                      {num}
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => handleChange({target: {name: 'password', value: formData.password.slice(0, -1)}})} 
                    className="w-full h-16 text-3xl font-black rounded-3xl bg-red-100/80 text-red-600 border-4 border-red-200 border-b-[8px] border-b-red-300 active:border-b-4 active:translate-y-1 transition-all flex items-center justify-center"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { if(formData.password.length < 6) handleChange({target: {name: 'password', value: formData.password + '0'}})}} 
                    className="w-full h-16 text-3xl font-black rounded-3xl bg-white border-4 border-borderSoft border-b-[8px] active:border-b-4 active:translate-y-1 transition-all hover:bg-mintLight/20 text-textMain"
                  >
                    0
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleChange({target: {name: 'password', value: ''}})} 
                    className="w-full h-16 text-xl font-black rounded-3xl bg-gray-200/80 text-gray-700 border-4 border-gray-300 border-b-[8px] border-b-gray-400 active:border-b-4 active:translate-y-1 transition-all"
                  >
                    SİL
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Name Field with Voice for Elders */}
              <div className="space-y-4">
                <label className="block font-black text-forest text-2xl mb-2 px-4 uppercase tracking-widest text-center opacity-70">
                  Kullanıcı Adınız
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => handleFocus("username")}
                    className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    placeholder="Bırakılan Kullanıcı Adını Yazın"
                  />
                  <SpeechCapture onResult={(val) => setFormData(p => ({...p, username: val}))} isLarge={true} />
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
