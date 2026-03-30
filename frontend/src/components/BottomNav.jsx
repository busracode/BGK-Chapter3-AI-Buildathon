export default function BottomNav({ items, active, onChange }) {
  // SVG Icon mappings
  const renderIcon = (id, isActive) => {
    const color = isActive ? 'var(--color-forest)' : 'var(--color-text-faint)';
    if(id === 'home') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    }
    if(id === 'chat') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    }
    if(id === 'journal') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      );
    }
    if(id === 'profile') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-borderSoft flex justify-around items-center z-50 h-[72px] pb-[inherit]">
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex flex-col items-center justify-center p-1 w-[20%] transition-transform active:scale-95"
          >
            <div className={`h-10 px-4 rounded-[12px] flex items-center justify-center transition-colors 
              ${isActive ? 'bg-mintLight' : 'bg-transparent'}`}>
              {renderIcon(item.id, isActive)}
            </div>
            <span className={`text-[11px] font-bold mt-1 ${isActive ? 'text-forest' : 'text-textFaint'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  );
}
