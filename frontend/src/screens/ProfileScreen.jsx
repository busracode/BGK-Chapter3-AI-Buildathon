export default function ProfileScreen({ user }) {
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
      <div className="bg-white px-6 pt-8 pb-10 rounded-b-[32px] border-b border-borderSoft shadow-sm relative overflow-hidden mb-8">
        <div className="blob w-64 h-64 -top-20 -right-20 bg-mintLight opacity-60"></div>
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-[28px] font-serif font-black text-textMain mb-8 tracking-tight self-start">Profil</h1>
          
          <div className="w-32 h-32 rounded-full bg-grass flex items-center justify-center border-[4px] border-white shadow-sm mb-4">
             <span className="font-serif font-black text-white text-6xl shadow-sm">{user.name?.[0] || "U"}</span>
          </div>
          
          <h2 className="text-[26px] font-serif font-bold text-textMain mb-1">{user.name}</h2>
          <div className="flex items-center gap-2">
            <span className="font-bold text-textMid uppercase tracking-wide text-sm">{user.role}</span>
            <span className="w-1.5 h-1.5 bg-borderSoft rounded-full"></span>
            <span className="font-bold text-textMid uppercase tracking-wide text-sm">{user.age} Yaş</span>
          </div>
          {user.city && (
            <div className="mt-2 text-sm font-semibold text-textMuted flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {user.city}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 space-y-4">
        {/* Duygu Durumu Kartı */}
        <div className="card-soft p-5 border-l-[4px] border-l-purpleIcon text-textMain">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-purpleBg flex items-center justify-center shrink-0">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purpleIcon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">Baskın Duygu Durumu</h3>
                <p className="text-xl font-serif font-bold capitalize">{user.primary_emotion || 'Bilinmiyor'}</p>
              </div>
           </div>
        </div>

        {/* Bilgi Satırları */}
        {user.role === "büyük" && user.hobbies && (
          <div className="card-soft p-5 border-l-[4px] border-l-grass flex items-start gap-4">
             <div className="w-12 h-12 rounded-[12px] bg-mintLight flex items-center justify-center shrink-0">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grass"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
             </div>
             <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-1">Hobiler ve İlgi Alanları</h3>
                <p className="text-sm font-semibold">{user.hobbies}</p>
             </div>
          </div>
        )}

        {/* Gelişmiş Ayarlar Kartı */}
        <div className="card-soft p-6 border-l-[4px] border-l-goldIcon">
          <h3 className="text-[16px] font-bold text-textMain mb-4">Gelişmiş Ayarlar</h3>
          <button className="w-full flex items-center justify-between py-3 font-bold text-textMid active:opacity-60 transition-opacity">
             <span className="flex items-center gap-2">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               Profili Düzenle
             </span>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          
          <div className="h-[1px] w-full bg-borderSoft my-2"></div>
          
          <button className="w-full flex items-center justify-between py-3 font-bold text-red-500 active:opacity-60 transition-opacity">
             <span className="flex items-center gap-2">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
               Hesabı Sil
             </span>
          </button>
        </div>

        {/* Kriz/Güvenlik Kartı */}
        <div className="card-soft mt-10 p-5 bg-goldBg border-[1.5px] border-goldIcon flex flex-col items-center text-center">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-goldText mb-3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
           <h3 className="font-bold text-goldText mb-1">Acil Durum Kişisi</h3>
           <p className="text-sm font-semibold text-goldText opacity-80 mb-4 px-2">Güvende hissetmediğinizde tek tuşla yetkililere ve ayarladığınız kişiye haber verin.</p>
           <button className="bg-white text-goldText border border-goldIcon px-4 py-2 font-bold rounded-[12px] text-sm active:scale-95 transition-transform w-full shadow-sm">
             Kişi Ekle / Ata
           </button>
        </div>
      </div>
    </div>
  );
}
