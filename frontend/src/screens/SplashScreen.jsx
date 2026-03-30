export default function SplashScreen({ onRoleSelect, onLoginSelect }) {
  return (
    <div className="min-h-[100dvh] relative flex flex-col items-center justify-center p-6 pb-12 overflow-hidden animate-[fadeIn_0.5s_ease-out] bg-warmBg">
      
      {/* Dev Arkaplan Gerçekçi Ağaç Resmi (Silhouette Effect) */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-end justify-center pointer-events-none opacity-[0.25] mix-blend-multiply">
        <img 
           src="/images/tree.png" 
           alt="Majestic Tree" 
           className="w-full h-full object-cover lg:h-[120vh]"
        />
      </div>

      {/* Ön Plan İçerikleri */}
      <div className="relative mb-8 flex flex-col items-center justify-center z-[2] w-full animate-[slideUp_0.6s_ease-out]">
        <div className="w-24 h-24 mb-6 rounded-full border-[2.5px] border-grass bg-[rgba(255,255,255,0.82)] backdrop-blur-[2px] flex items-center justify-center shadow-sm">
           <div className="w-20 h-20 rounded-full bg-mintLight/50 flex items-center justify-center">
             <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-grass">
               <path d="M12 22v-8"></path>
               <path d="M12 14c-1-3-4-4-7-4"></path>
               <path d="M12 14c1-3 4-4 7-4"></path>
               <path d="M12 14V5"></path>
               <path d="M10 10L6 6"></path>
               <path d="M14 10l4-4"></path>
               <path d="M12 22c-2 0-4-1-5-3"></path>
               <path d="M12 22c2 0 4-1 5-3"></path>
               <path d="M5.64 18.36a9 9 0 1 1 12.72 0"></path>
             </svg>
           </div>
        </div>
        
        {/* Cam (Glass) efektli başlık alanı zemin desteği */}
        <div className="bg-[rgba(255,255,255,0.82)] backdrop-blur-[2px] px-8 py-4 rounded-[20px] text-center border border-white/50 shadow-sm">
           <h1 className="text-4xl font-serif font-black text-textMain tracking-tight">Hayat Köprüsü</h1>
           <p className="text-textMid font-sans mt-3 px-2 leading-relaxed font-semibold">
             Hayat boyu edinilen tecrübelerin,<br/>geleceği aydınlattığı yer.
           </p>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4 z-[2] animate-[slideUp_0.8s_ease-out]">
        {/* Genç Kartı */}
        <button 
          className="w-full p-5 bg-gradient-to-r from-[#0F3822]/95 to-grass/80 backdrop-blur-[4px] border border-[#0F3822]/40 rounded-[14px] flex items-center justify-between text-left transition-all active:scale-95 shadow-lg overflow-hidden group ring-1 ring-white/20" 
          onClick={() => onRoleSelect("genç")}
        >
          <div>
            <span className="block text-xl font-bold text-white drop-shadow-md tracking-wide">Hayata Atılan Genç</span>
            <span className="block text-sm font-semibold text-white/95 mt-1 drop-shadow-sm">Rehberlik arıyorum</span>
          </div>
          <div className="icon-wrapper w-16 h-16 bg-white/20 rounded-xl overflow-hidden border border-white/30 shrink-0 backdrop-blur-md">
             <img 
               src="/images/sprout.png" 
               alt="Sprout" 
               className="w-full h-full object-cover mix-blend-multiply opacity-100 group-hover:scale-110 transition-transform duration-500"
             />
          </div>
        </button>

        {/* Büyük Kartı */}
        <button 
          className="w-full p-5 bg-gradient-to-r from-[#4A2E1B]/90 to-[#9E6333]/85 backdrop-blur-[4px] border border-[#4A2E1B]/50 rounded-[14px] flex items-center justify-between text-left transition-all active:scale-95 shadow-lg overflow-hidden group ring-1 ring-white/20" 
          onClick={() => onRoleSelect("büyük")}
        >
          <div>
            <span className="block text-xl font-bold text-white drop-shadow-sm">Tecrübeli Büyük</span>
            <span className="block text-sm font-semibold text-white/95 mt-1 drop-shadow-sm">Tecrübe aktarıyorum</span>
          </div>
          <div className="icon-wrapper w-16 h-16 bg-white/20 rounded-xl overflow-hidden border border-white/30 shrink-0 backdrop-blur-md">
            <img 
               src="/images/roots.png" 
               alt="Roots" 
               className="w-full h-full object-cover mix-blend-multiply opacity-100 group-hover:scale-110 transition-transform duration-500"
             />
          </div>
        </button>

        <div className="pt-4 text-center">
          <p className="text-sm font-bold text-textMuted mb-3">Zaten bir hesabın var mı?</p>
          <div className="flex gap-3">
             <button 
               onClick={() => onLoginSelect("genç")}
               className="flex-1 py-3 px-4 bg-white border border-borderSoft rounded-xl font-bold text-xs text-textMain shadow-sm active:scale-95 transition-transform"
             >
               GENÇ GİRİŞİ
             </button>
             <button 
               onClick={() => onLoginSelect("büyük")}
               className="flex-1 py-3 px-4 bg-white border border-borderSoft rounded-xl font-bold text-xs text-textMain shadow-sm active:scale-95 transition-transform"
             >
               BÜYÜK GİRİŞİ
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
