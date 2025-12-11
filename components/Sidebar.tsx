import React from 'react';

interface SidebarProps {
  counts: {
    all: number;
    recent: number;
    favorites: number;
  };
  selectedCount: number;
  onSelectCategory: (category: string) => void;
  activeCategory: string;
}

const Sidebar: React.FC<SidebarProps> = ({ counts, selectedCount, onSelectCategory, activeCategory }) => {
  const menuItems = [
    { id: 'all', label: 'All Photos', icon: '🖼️', count: counts.all },
    { id: 'recent', label: 'Recents', icon: '🕒', count: counts.recent },
    { id: 'favorites', label: 'Favorites', icon: '❤️', count: counts.favorites },
  ];

  return (
    <div className="w-64 bg-gray-50/90 backdrop-blur-xl border-r border-gray-200 h-full flex flex-col pt-10 select-none">
      <div className="px-5 mb-6">
        <h1 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Library</h1>
      </div>
      <nav className="flex-1 overflow-y-auto px-3">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-1">
              <button
                onClick={() => onSelectCategory(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === item.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.count >= 0 && (
                  <span className={`text-xs ${activeCategory === item.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="px-2 mt-8 mb-2">
           <h1 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Albums</h1>
           <div className="px-3 py-2 text-sm text-gray-500 italic">
             No albums created
           </div>
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {selectedCount > 0 ? `${selectedCount} selected` : `${counts.all} items total`}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;