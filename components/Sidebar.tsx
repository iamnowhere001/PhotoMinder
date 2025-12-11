import React from 'react';

interface SidebarProps {
  counts: {
    all: number;
    favorites: number;
  };
  selectedCount: number;
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

// Icons
const PhotosIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

const FolderPlusIcon = () => (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
);

const Sidebar: React.FC<SidebarProps> = ({ counts, selectedCount, onSelectCategory, activeCategory }) => {
  const menuItems = [
    { id: 'all', label: 'All Photos', icon: <PhotosIcon />, count: counts.all },
    { id: 'favorites', label: 'Favorites', icon: <HeartIcon filled={activeCategory === 'favorites'} />, count: counts.favorites },
  ];

  return (
    <div className="w-[260px] bg-gray-50/95 backdrop-blur-2xl border-r border-gray-200 h-full flex flex-col pt-6 select-none shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <nav className="flex-1 overflow-y-auto px-3 space-y-6">
        
        {/* Library Section */}
        <div>
          <h2 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 transition-colors">Library</h2>
          <ul className="space-y-0.5">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectCategory(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 group ${
                    activeCategory === item.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-black/5 active:bg-black/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`opacity-80 ${activeCategory === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count >= 0 && (
                    <span className={`text-xs ${
                        activeCategory === item.id 
                        ? 'text-white/90' 
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Albums Section */}
        <div>
           <div className="px-3 flex items-center justify-between mb-2 group cursor-pointer">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors">Albums</h2>
              <button className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all p-0.5 rounded hover:bg-black/5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
           </div>
           
           {/* Empty State / Placeholder */}
           <div className="px-3 py-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg mx-1 bg-gray-50/30 hover:bg-gray-50/80 transition-colors group cursor-default">
             <div className="text-gray-300 group-hover:text-gray-400 mb-2 transition-colors">
                <FolderPlusIcon />
             </div>
             <span className="text-xs text-gray-400 font-medium group-hover:text-gray-500">No Albums</span>
           </div>
        </div>
      </nav>
      
      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200/60 bg-gray-50/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-0.5">
             <div className="text-[11px] font-semibold text-gray-500">
                {selectedCount > 0 ? `${selectedCount} Selected` : `${counts.all} Photos`}
             </div>
             {selectedCount === 0 && (
                 <div className="text-[10px] text-gray-400">
                    Updated Just Now
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;