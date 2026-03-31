export default function BottomNav({ items, active, onChange }) {
  // SVG Icon mappings
  const renderIcon = (id, isActive) => {
    const color = isActive ? 'var(--color-forest)' : 'var(--color-text-faint)';
    const size = "28";
    if(id === 'home') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    }
    if(id === 'chat') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    }
    if(id === 'journal') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      );
    }
    if(id === 'profile') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:scale-110">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t-2 border-borderSoft grid grid-cols-4 px-2 z-50 h-[80px] pb-[inherit] items-center shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="group flex flex-col items-center justify-center p-2 w-full transition-all duration-300 active:scale-95 hover:-translate-y-1"
          >
            <div className={`h-12 w-16 rounded-[16px] flex items-center justify-center transition-all duration-500 
              ${isActive ? 'bg-mintLight shadow-sm' : 'bg-transparent'}`}>
              {renderIcon(item.id, isActive)}
            </div>
            <span className={`text-[12px] font-black mt-1.5 transition-colors duration-300 ${isActive ? 'text-forest' : 'text-textFaint'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  );
}
