import { useState } from "react";
import SpeechCapture from "../components/SpeechCapture";

export default function ProfileScreen({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    surname: user?.surname || "",
    age: user?.age || "",
    city: user?.city || "",
    interests: user?.interests || "",
    expertise_level: user?.expertise_level || "",
    emergency_contact_name: user?.emergency_contact_name || "",
    emergency_contact_phone: user?.emergency_contact_phone || ""
  });
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const parseList = (data) => {
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed.join(", ");
      return parsed;
    } catch (e) {
      return data;
    }
  };

  const handleUpdate = async () => {
    try {
      // Ensure age is an integer or null, not an empty string
      const payload = {
        ...editData,
        age: editData.age === "" ? null : parseInt(editData.age)
      };

      const resp = await fetch(`http://localhost:8000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (resp.ok) {
        const updated = await resp.json();
        setUser(updated);
        setIsEditing(false);
        setShowEmergencyForm(false);
        speakText("Profiliniz başarıyla güncellendi.");
        alert("Profil güncellendi!");
      } else {
        const errData = await resp.json();
        console.error("Server error:", errData);
        speakText("Güncelleme sırasında bir sorun oluştu.");
        alert(`Hata: ${errData.detail?.[0]?.msg || "Kaydedilemedi"}`);
      }
    } catch (err) {
      console.error(err);
      speakText("Güncelleme sırasında bir hata oluştu.");
      alert("Bağlantı hatası: Sunucuya ulaşılamıyor.");
    }
  };

  const handleFocus = (field) => {
    const prompts = {
      name: "Lütfen isminizi söyleyin.",
      surname: "Lütfen soyisminizi söyleyin.",
      age: "Lütfen yaşınızı belirtin.",
      city: "Yaşadığınız şehri söyleyin.",
      interests: "Tecrübelerinizden veya hobilerinizden bahsedin.",
      emergencyName: "Yakınınızın adını yazın veya söyleyin.",
      emergencyPhone: "Yakınınızın telefon numarasını söyleyin."
    };
    if (prompts[field]) speakText(prompts[field]);
  };

  const startEditing = () => {
    setIsEditing(true);
    speakText("Profilinizi düzenleme modu açıldı. Hangi bilgiyi değiştirmek istiyorsanız üzerine dokunun.");
  };

  const startEmergency = () => {
    setShowEmergencyForm(true);
    speakText("Lütfen bir yakınınızın adını ve telefonunu buraya ekleyin.");
  };

  const handleDelete = async () => {
    if (window.confirm("Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      try {
        const resp = await fetch(`http://localhost:8000/api/users/${user.id}`, {
          method: "DELETE"
        });
        if (resp.ok) {
          alert("Hesabınız silindi.");
          onLogout();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const resp = await fetch(`http://localhost:8000/api/users/reanalyze/${user.id}`, {
        method: "POST"
      });
      if (resp.ok) {
        const updated = await resp.json();
        setUser(updated);
        speakText("Profiliniz yapay zeka tarafından yeniden analiz edildi.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const speakText = (text, force = false) => {
    // Genç kullanıcılar için seslendirmeyi (otomatik olanları) devre dışı bırakıyoruz
    if (user?.role !== "büyük" && !force) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    window.speechSynthesis.speak(utterance);
  };
  if (!user) {
    return (
      <div className="p-6 h-[100dvh] flex flex-col justify-center items-center bg-sage">
        <div className="card-soft w-full text-center p-8">
          <h2 className="text-2xl font-serif font-black text-textMain mb-4">Profil Bulunamadı</h2>
          <p className="text-textMuted font-semibold">Lütfen önce giriş yapın.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sage min-h-screen pb-32 animate-[fadeIn_0.5s_ease-out]">
      {/* Header ve Avatar Alanı */}
      <div className="bg-white px-6 pt-12 pb-14 rounded-b-[48px] border-b-4 border-borderSoft shadow-lg relative overflow-hidden mb-10">
        <div className="blob w-80 h-80 -top-20 -right-20 bg-mintLight opacity-60"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-10">
            <h1 className="text-4xl font-serif font-black text-forest tracking-tight">Profilim</h1>
            <button onClick={onLogout} className="btn-secondary py-3 px-6 text-base">Çıkış</button>
          </div>
          
          <div className="w-40 h-40 rounded-full bg-grass flex items-center justify-center border-[6px] border-white shadow-xl mb-6 relative">
             <span className="font-serif font-black text-white text-7xl">{user.name?.[0] || "U"}</span>
             <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow-lg border-2 border-mintBorder text-grass">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
             </div>
          </div>
          
          {isEditing ? (
            <div className="w-full space-y-6 mb-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="bg-warmBg p-6 rounded-[32px] border-2 border-borderSoft space-y-4">
                <p className="text-sm font-black text-forest uppercase tracking-widest text-center">Profil Bilgilerini Güncelle</p>
                
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <input 
                        className="input-soft flex-1 !py-5" 
                        value={editData.name} 
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        onFocus={() => handleFocus("name")}
                        placeholder="Adınız"
                      />
                      <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, name: val }))} />
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <input 
                        className="input-soft flex-1 !py-5" 
                        value={editData.surname} 
                        onChange={e => setEditData({...editData, surname: e.target.value})}
                        onFocus={() => handleFocus("surname")}
                        placeholder="Soyadınız"
                      />
                      <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, surname: val }))} />
                   </div>

                   <div className="flex items-center gap-3">
                      <input 
                        className="input-soft flex-1 !py-5" 
                        type="number"
                        value={editData.age} 
                        onChange={e => setEditData({...editData, age: e.target.value})}
                        onFocus={() => handleFocus("age")}
                        placeholder="Yaşınız"
                      />
                      <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, age: val }))} />
                   </div>

                   <div className="flex items-center gap-3">
                      <input 
                        className="input-soft flex-1 !py-5" 
                        value={editData.city} 
                        onChange={e => setEditData({...editData, city: e.target.value})}
                        onFocus={() => handleFocus("city")}
                        placeholder="Yaşadığınız Şehir"
                      />
                      <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, city: val }))} />
                   </div>

                   <div className="flex items-center gap-3">
                      <textarea 
                        className="input-soft flex-1 !py-5 min-h-[120px] resize-none" 
                        value={editData.interests} 
                        onChange={e => setEditData({...editData, interests: e.target.value})}
                        onFocus={() => handleFocus("interests")}
                        placeholder="İlgi Alanlarınız ve Uzmanlıklarınız"
                      />
                      <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, interests: val }))} />
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button onClick={handleUpdate} className="btn-primary w-full py-8 text-3xl shadow-2xl border-b-[8px]">KAYDET</button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary w-full py-6 text-2xl">VAZGEÇ</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-serif font-black text-textMain mb-2 text-center">{user.name} {user.surname}</h2>
              <div className="flex flex-wrap justify-center items-center gap-3">
                <span className="pill-badge bg-mintLight text-grass border-2 border-mintBorder uppercase tracking-widest text-base">{user.role}</span>
                <span className="pill-badge bg-purpleBg text-purpleIcon border-2 border-purpleIcon/20 text-base">{user.age} YAŞINDA</span>
                {user.city && (
                  <span className="pill-badge bg-warmBg text-textMid border-2 border-borderSoft text-base flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {user.city}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* AI Analiz Kartları */}
        <div className="space-y-6">
          {/* Özet ve Uzmanlık */}
          <div className="card-soft p-8 border-l-[10px] border-l-grass">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black uppercase text-grass tracking-tighter">AI Profil Özeti</h3>
              <button 
                onClick={() => speakText(user.personality_summary, true)}
                className="btn-action-circle bg-mintLight text-grass border-mintBorder"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
            </div>
            <p className="text-2xl font-serif font-black text-textMain leading-relaxed mb-6 italic">
              "{user.personality_summary || 'Profil henüz analiz edilmedi.'}"
            </p>

            {(!user.personality_summary || user.personality_summary.includes("henüz")) && (
              <button 
                onClick={handleReanalyze} 
                disabled={isReanalyzing}
                className="btn-primary w-full py-3 mb-4 text-sm tracking-widest bg-forest"
              >
                {isReanalyzing ? "ANALİZ EDİLİYOR..." : "PROFİLİ AI İLE ANALİZ ET ✨"}
              </button>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t-2 border-borderSoft">
              <div className="bg-warmBg p-5 rounded-3xl border-2 border-borderSoft">
                <p className="text-sm font-black text-textMuted uppercase mb-2">Uzmanlık Alanı</p>
                <p className="text-xl font-black text-forest">{user.expertise_level || 'Genel'}</p>
              </div>
              <div className="bg-purpleBg p-5 rounded-3xl border-2 border-purpleIcon/10">
                <p className="text-sm font-black text-purpleIcon uppercase mb-2">Konuşma Tarzı</p>
                <p className="text-xl font-black text-purpleText">{user.speaking_style || 'Normal'}</p>
              </div>
            </div>
          </div>

          {/* Hobiler ve İlgi Alanları */}
          <div className="card-soft p-8 border-l-[10px] border-l-purpleIcon bg-white shadow-xl">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[24px] bg-purpleBg flex items-center justify-center shrink-0 border-2 border-purpleIcon/10">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-purpleIcon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase text-purpleText tracking-widest">İlgi Alanları ve Uzmanlıklar</h3>
                   <p className="text-2xl font-black text-purpleText">{parseList(user.interests) || "Genel İlgi Alanları"}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 pt-6 border-t-2 border-borderSoft">
                <div className="w-16 h-16 rounded-[24px] bg-mintLight flex items-center justify-center shrink-0 border-2 border-mintBorder">
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-grass"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                   <h3 className="text-sm font-black uppercase text-grass tracking-widest">Kazanılmış Tecrübeler</h3>
                   <p className="text-2xl font-black text-forest">{parseList(user.life_experiences) || "Hayat Tecrübeleri"}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Gelişmiş Ayarlar Kartı */}
        <div className="card-soft p-6 border-l-[4px] border-l-goldIcon">
          <h3 className="text-[16px] font-bold text-textMain mb-4 uppercase tracking-widest opacity-60">Hesap Yönetimi</h3>
          <button 
            onClick={startEditing}
            className="w-full flex items-center justify-between py-4 font-black text-textMain active:opacity-60 transition-opacity text-xl"
          >
             <span className="flex items-center gap-3">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               Profili Düzenle
             </span>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          
          <div className="h-[1px] w-full bg-borderSoft my-2"></div>
          
          <button 
            onClick={handleDelete}
            className="w-full flex items-center justify-between py-4 font-black text-red-500 active:opacity-60 transition-opacity text-xl"
          >
             <span className="flex items-center gap-3">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
               Hesabı Kalıcı Olarak Sil
             </span>
          </button>
        </div>

        {/* Kriz/Güvenlik Kartı */}
        <div className="card-soft mt-10 p-8 bg-goldBg border-[2px] border-goldIcon flex flex-col items-center text-center">
           <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-goldText mb-4"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
           <h3 className="text-2xl font-black text-goldText mb-2">Acil Durum Kişisi</h3>
           
           {user.emergency_contact_name ? (
             <div className="bg-white/60 p-4 rounded-2xl border border-goldIcon/30 w-full mb-4">
                <p className="font-black text-goldText text-xl">{user.emergency_contact_name}</p>
                <p className="font-bold text-goldText opacity-80">{user.emergency_contact_phone}</p>
             </div>
           ) : (
             <p className="text-lg font-bold text-goldText opacity-80 mb-6 px-4 leading-relaxed">Güvende hissetmediğinizde tek tuşla yetkililere ve ayarladığınız kişiye haber verin.</p>
           )}

           {showEmergencyForm ? (
             <div className="w-full space-y-3 bg-white p-6 rounded-3xl border-2 border-goldIcon shadow-inner animate-[slideDown_0.3s_ease-out]">
                <div className="flex items-center gap-3">
                  <input 
                    className="input-soft flex-1 !py-5"
                    placeholder="Yakınınızın Adı"
                    value={editData.emergency_contact_name}
                    onChange={e => setEditData({...editData, emergency_contact_name: e.target.value})}
                    onFocus={() => handleFocus("emergencyName")}
                  />
                  <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, emergency_contact_name: val }))} />
                </div>
                
                <div className="flex items-center gap-3">
                  <input 
                    className="input-soft flex-1 !py-5"
                    placeholder="Telefon Numarası"
                    value={editData.emergency_contact_phone}
                    onChange={e => setEditData({...editData, emergency_contact_phone: e.target.value})}
                    onFocus={() => handleFocus("emergencyPhone")}
                  />
                  <SpeechCapture onResult={(val) => setEditData(prev => ({ ...prev, emergency_contact_phone: val }))} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleUpdate} className="btn-primary flex-1 py-3 bg-goldText border-goldIcon">Kaydet</button>
                  <button onClick={() => setShowEmergencyForm(false)} className="btn-secondary flex-1">Vazgeç</button>
                </div>
             </div>
           ) : (
             <button 
                onClick={startEmergency}
                className="bg-white text-goldText border-2 border-goldIcon px-8 py-4 font-black rounded-[20px] text-lg active:scale-95 transition-transform w-full shadow-lg hover:shadow-2xl"
             >
               {user.emergency_contact_name ? "Bilgileri Güncelle" : "Hemen Bir Kişi Ekle"}
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
