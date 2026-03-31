import { useState, useRef, useEffect } from "react";
import SpeechCapture from "../components/SpeechCapture";

export default function RegisterScreen({ role, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    surname: "",
    age: "",
    city: "",
    current_mood_text: "",
    current_mood_label: "nötr",
    password: "",
    picture_password: []
  });

  const MOOD_OPTIONS = [
    { key: "umut", label: "Mutlu", emoji: "😊" },
    { key: "nötr", label: "Huzurlu", emoji: "😌" },
    { key: "hüzün", label: "Üzgün", emoji: "😔" },
    { key: "kaygı", label: "Kaygılı", emoji: "😟" },
    { key: "kafa_karışıklığı", label: "Şaşkın", emoji: "🤔" },
    { key: "yas", label: "Yasta", emoji: "🕯️" }
  ];

  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const speakText = (text) => {
    if (role !== "büyük") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    window.speechSynthesis.speak(utterance);
  };

  const handleFocus = (field) => {
    const prompts = {
      username: "Sistemde kullanmak istediğiniz kullanıcı adını söyleyebilirsiniz. Bu alan zorunludur.",
      name: "Adınız nedir?",
      surname: "Soyadınız nedir?",
      age: "Kaç yaşındasınız?",
      city: "Hangi şehirde yaşıyorsunuz?",
      selfIntro: "Bize kendinizi, hobilerinizi ve tecrübelerinizi anlatın. Sesle kayıt yapabilirsiniz."
    };
    if (prompts[field]) speakText(prompts[field]);
  };

  const isGenc = role === "genç";

  useEffect(() => {
    if (role === "büyük") {
      speakText("Hoş geldiniz. Lütfen bilgilerinizi kutucuklara söyleyin. Yanlardaki mikrofonlara basarak sesle kolayca doldurabilirsiniz.");
    }
  }, [role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateUsername = (name, surname) => {
    const normalize = (text) => {
      return (text || "").toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '');
    };
    const n = normalize(name);
    const s = normalize(surname);
    return s ? `${n}.${s}` : n;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!formData.username || formData.username.trim() === "") {
      const suggested = generateUsername(formData.name, formData.surname);
      if (suggested) {
        setFormData(p => ({...p, username: suggested}));
        return alert(`Kullanıcı adı girmek zorunludur.\nSizin için "${suggested}" kullanıcı adını önerdik.\nLütfen alanı kontrol edip onaylamak için tekrar 'KAYDOL VE BAŞLA' butonuna tıklayın.`);
      } else {
        return alert("Lütfen önce adınızı girin veya bir kullanıcı adı belirleyin.");
      }
    }
    
    if (isGenc && (!formData.name || !formData.age || !formData.password)) {
      return alert("Lütfen isim, yaş ve şifre giriniz.");
    }
    if (!isGenc && (formData.picture_password.length < 3)) {
      return alert("Lütfen en az 3 resim seçin.");
    }

    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username || null,
          name: formData.name || "",
          surname: formData.surname || "",
          age: parseInt(formData.age) || 0,
          city: formData.city || "Bilinmiyor",
          role: role,
          current_mood_text: formData.current_mood_text || "Belirtilmedi.",
          current_mood_label: formData.current_mood_label,
          password: formData.password || null,
          picture_password: formData.picture_password.length > 0 ? formData.picture_password.join(",") : null
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert("Kayıt Başarılı!\nSistem tarafından oluşturulan Kullanıcı Adınız: " + data.username + "\nLütfen sisteme giriş yaparken bu kullanıcı adını kullanın!");
        onSubmit(data);
      } else {
        alert("Kayıt sırasında hata: " + (data.detail || "Bilinmeyen hata"));
      }
    } catch (err) {
      console.error(err);
      alert("Sunucuya ulaşılamadı. Lütfen backend'in çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-warmBg p-6 flex flex-col items-center relative overflow-x-hidden animate-[fadeIn_0.5s_ease-out]">
      <div className="blob w-72 h-72 -top-10 -right-20 bg-mintLight opacity-60 blur-xl"></div>
      <div className="blob w-56 h-56 bottom-0 -left-20 bg-mintBorder opacity-40 blur-lg"></div>

      {/* Header */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-10 z-10">
        <button onClick={onBack} className="btn-secondary py-3 px-6 text-lg flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          GERİ
        </button>
        <div className="flex flex-col items-end">
          <h1 className="text-3xl font-serif font-black text-forest">Kayıt Ol</h1>
          <span className="pill-badge bg-mintLight text-grass border-2 border-grass/20 font-black tracking-widest">{role.toUpperCase()}</span>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-12 z-10 pb-20">
        {isGenc ? (
          /* GENC KAYIT TASARIMI */
          <div className="card-soft p-8 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-black text-textMain opacity-60 uppercase">Kişisel Bilgiler</label>
              <input name="username" value={formData.username} onChange={handleChange} className="input-soft w-full font-bold text-mintDark" placeholder="Kullanıcı Adınız (Zorunlu, Örn: can.yildiz)" />
              <input name="name" value={formData.name} onChange={handleChange} className="input-soft w-full" placeholder="Adınız" />
              <input name="surname" value={formData.surname} onChange={handleChange} className="input-soft w-full" placeholder="Soyadınız" />
              <div className="grid grid-cols-2 gap-4">
                <input name="age" type="number" value={formData.age} onChange={handleChange} className="input-soft w-full" placeholder="Yaşınız" />
                <input name="city" value={formData.city} onChange={handleChange} className="input-soft w-full" placeholder="Şehriniz" />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-black text-textMain opacity-60 uppercase">Şu anki Modunuzu Seçin</label>
              <div className="grid grid-cols-3 gap-3">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, current_mood_label: m.key })}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-4 transition-all active:scale-95
                      ${formData.current_mood_label === m.key 
                        ? 'border-grass bg-mintLight shadow-md scale-105' 
                        : 'border-borderSoft bg-white/50 hover:bg-white'}`}
                  >
                    <span className="text-3xl mb-1">{m.emoji}</span>
                    <span className="text-[10px] font-black uppercase text-textMid">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-black text-textMain opacity-60 uppercase">Bize Biraz Kendinizden Bahsedin</label>
              <textarea 
                name="current_mood_text" 
                value={formData.current_mood_text} 
                onChange={handleChange} 
                className="input-soft w-full min-h-[120px] resize-none" 
                placeholder="Nelerden hoşlanırsınız? Ne tür bir rehberlik arıyorsunuz?" 
              />
            </div>
            <div className="space-y-6 bg-white/50 p-6 rounded-[32px] border-4 border-mintLight/50">
              <label className="block text-sm font-black text-textMain opacity-60 uppercase text-center">Giriş Şifrenizi Oluşturun (6 Haneli PIN)</label>
              
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
          /* BÜYÜK KAYIT TASARIMI (Guided & Huge UI) */
          <div className="space-y-10">
            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[56px] border-4 border-borderSoft shadow-2xl space-y-10 ring-8 ring-white/30">
              <p className="text-2xl font-black text-forest text-center border-b-4 border-mintLight pb-4 border-dashed">Profil Bilgilerinizi Doldurun</p>
              
              <div className="space-y-8">
                {/* Kullanıcı Adı */}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-forest opacity-70 ml-2">Kullanıcı Adınız (Zorunlu)</p>
                  <div className="flex items-center gap-4">
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => handleFocus("username")}
                      placeholder="Kullanıcı Adınızı Belirleyin"
                      className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, username: val}))} isLarge={true} />
                  </div>
                </div>

                {/* İsim */}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-forest opacity-70 ml-2">Adınız</p>
                  <div className="flex items-center gap-4">
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onFocus={() => handleFocus("name")}
                      placeholder="Buraya Söyleyin"
                      className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, name: val}))} isLarge={true} />
                  </div>
                </div>

                {/* Soyisim */}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-forest opacity-70 ml-2">Soyadınız</p>
                  <div className="flex items-center gap-4">
                    <input
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      onFocus={() => handleFocus("surname")}
                      placeholder="Buraya Söyleyin"
                      className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, surname: val}))} isLarge={true} />
                  </div>
                </div>

                {/* Yaş */}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-forest opacity-70 ml-2">Yaşınız</p>
                  <div className="flex items-center gap-4">
                    <input
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      onFocus={() => handleFocus("age")}
                      placeholder="Kaç Yaşındasınız?"
                      className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, age: val}))} isLarge={true} />
                  </div>
                </div>

                {/* Şehir */}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-forest opacity-70 ml-2">Yaşadığınız Şehir</p>
                  <div className="flex items-center gap-4">
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      onFocus={() => handleFocus("city")}
                      placeholder="Şehrinizi Söyleyin"
                      className="input-soft flex-1 !py-8 !text-3xl font-black placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, city: val}))} isLarge={true} />
                  </div>
                </div>

                {/* Mod Seçimi */}
                <div className="space-y-4 bg-mintLight/20 p-8 rounded-[40px] border-4 border-mintLight/40">
                  <p className="text-xl font-black text-forest text-center mb-6 uppercase tracking-widest opacity-70">Şu anki Ruh Halinizi Seçin</p>
                  <div className="grid grid-cols-3 gap-4">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, current_mood_label: m.key });
                          speakText(`${m.label} olarak seçildi.`);
                        }}
                        className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-4 transition-all active:scale-95 shadow-lg
                          ${formData.current_mood_label === m.key 
                            ? 'border-grass bg-white scale-105 ring-4 ring-grass/20' 
                            : 'border-white bg-white/60 hover:bg-white'}`}
                      >
                        <span className="text-5xl mb-2">{m.emoji}</span>
                        <span className="text-xs font-black uppercase text-grass">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kendini Tanıt */}
                <div className="space-y-4">
                  <p className="text-xl font-black text-forest opacity-70 ml-2">Hobileriniz ve Tecrübeleriniz</p>
                  <div className="flex items-center gap-4">
                    <textarea
                      name="current_mood_text"
                      value={formData.current_mood_text}
                      onChange={handleChange}
                      onFocus={() => handleFocus("selfIntro")}
                      placeholder="Bize kendinizi anlatın..."
                      className="input-soft flex-1 !py-8 !text-2xl font-bold min-h-[200px] resize-none leading-relaxed placeholder:opacity-30"
                    />
                    <SpeechCapture onResult={(val) => setFormData(p => ({...p, current_mood_text: val}))} isLarge={true} />
                  </div>
                </div>
              </div>
            </div>

            {/* Picture Password Section */}
            <div className="bg-goldBg/30 p-10 rounded-[56px] border-4 border-goldIcon/40 text-center space-y-10">
              <div className="flex justify-center mb-4">
                <div className="p-5 bg-white rounded-full shadow-xl border-4 border-goldIcon">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
              </div>
              <div>
                <h3 className="text-4xl font-serif font-black text-goldText mb-4 tracking-tight">Kilit Resimlerinizi Seçin</h3>
                <p className="text-2xl font-bold text-goldText opacity-70 max-w-sm mx-auto">Giriş yaparken bu 3 resmi <b>aynı sırayla</b> kullanacaksınız. Sıralama çok önemlidir.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {["🏠", "🌳", "🍎", "🐶", "👵", "👴", "🚗", "🚲", "☕"].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => {
                      const newSelection = [...formData.picture_password];
                      if (newSelection.includes(icon)) {
                        setFormData({ ...formData, picture_password: newSelection.filter(i => i !== icon) });
                      } else if (newSelection.length < 3) {
                        setFormData({ ...formData, picture_password: [...newSelection, icon] });
                        if (newSelection.length === 0) speakText("Birinci resmi seçtiniz. Lütfen iki tane daha seçin. Unutmayın, bu sırayı aklınızda tutmalısınız.");
                        if (newSelection.length === 1) speakText("İkinci resim de tamam. Son bir tane kaldı. Sıralama giriş yaparken çok önemli olacak.");
                        if (newSelection.length === 2) speakText("Harika! Üçüncü resmi de seçtiniz. Artık bu sırayla giriş yapabileceksiniz. Kaydol ve Başla butonuna basabilirsiniz.");
                      }
                    }}
                    className={`w-full py-10 text-7xl rounded-[40px] border-4 transition-all active:scale-90 relative
                      ${formData.picture_password.includes(icon) 
                        ? 'border-goldText bg-white shadow-[0_0_40px_rgba(184,134,11,0.3)] scale-105 z-20' 
                        : 'border-white bg-white/60 hover:bg-white hover:border-goldIcon/50 shadow-lg'}`}
                  >
                    {icon}
                    {formData.picture_password.includes(icon) && (
                      <span className="absolute -top-4 -right-4 w-12 h-12 bg-goldText text-white text-2xl rounded-full flex items-center justify-center font-black shadow-lg ring-4 ring-white">
                        {formData.picture_password.indexOf(icon) + 1}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {formData.picture_password.length > 0 && (
                <div className="flex justify-center gap-6 p-6 bg-white/80 rounded-full border-2 border-goldIcon/20 shadow-inner">
                  {formData.picture_password.map((icon, i) => (
                    <span key={i} className="text-5xl animate-[bounce_0.5s_ease-out]">{icon}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full py-12 text-5xl font-black shadow-[0_20px_50px_rgba(46,125,50,0.4)] border-b-[12px] active:border-b-4 active:translate-y-2 transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-6 justify-center">
              <div className="w-10 h-10 border-[6px] border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-3xl">Kaydediliyor...</span>
            </div>
          ) : "KAYDOL VE BAŞLA"}
        </button>
      </div>
    </div>
  );
}
