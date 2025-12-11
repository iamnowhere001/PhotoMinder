import React, { useRef } from 'react';
import { SortConfig, ViewMode } from '../types';

interface ToolbarProps {
  onOpenDirectory: () => Promise<boolean>;
  onLoadFolderFallback: (e: React.ChangeEvent<HTMLInputElement>) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  onBatchRename: () => void;
  onDelete: () => void;
  canRename: boolean;
  canDelete: boolean;
  scale: number;
  setScale: (scale: number) => void;
  currentFolder: string | null;
}

// Icons
const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const RenameIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const SortIcon = () => (
   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
);
const ChevronDown = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const Toolbar: React.FC<ToolbarProps> = ({ 
  onOpenDirectory, 
  onLoadFolderFallback,
  viewMode, 
  setViewMode, 
  sortConfig, 
  setSortConfig,
  onBatchRename,
  onDelete,
  canRename,
  canDelete,
  scale,
  setScale,
  currentFolder
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = async () => {
    const success = await onOpenDirectory();
    if (!success) {
      fileInputRef.current?.click();
    }
  };

  // Helper for button styles
  const buttonBaseClass = "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 select-none";
  const buttonActive = "text-gray-700 hover:bg-black/5 active:bg-black/10 active:scale-[0.98]";
  const buttonDisabled = "text-gray-300 cursor-not-allowed";

  return (
    <div className="h-[52px] bg-white/80 backdrop-blur-xl border-b border-gray-200/80 flex items-center justify-between px-4 z-20 sticky top-0 shadow-sm">
      <div className="flex items-center gap-2">
        {/* Hidden Fallback Input */}
        <input 
          type="file" 
          {...({ webkitdirectory: "", directory: "" } as any)}
          multiple 
          className="hidden" 
          ref={fileInputRef}
          onChange={onLoadFolderFallback} 
        />

        {/* Import Button */}
        <button 
          onClick={handleOpenClick}
          className={`${buttonBaseClass} ${buttonActive}`}
          title="Open a folder"
        >
          <FolderIcon />
          <span>Open</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-300/50 mx-1"></div>

        {/* Action Buttons */}
        <button 
          onClick={onBatchRename}
          disabled={!canRename}
          className={`${buttonBaseClass} ${canRename ? buttonActive : buttonDisabled}`}
          title="Batch Rename Selected"
        >
          <RenameIcon />
          <span className="hidden sm:inline">Rename</span>
        </button>

        <button 
          onClick={onDelete}
          disabled={!canDelete}
          className={`${buttonBaseClass} ${canDelete ? 'text-gray-700 hover:text-red-600 hover:bg-red-50 active:bg-red-100' : buttonDisabled}`}
          title="Delete Selected"
        >
          <TrashIcon />
          <span className="hidden sm:inline">Delete</span>
        </button>
        
        {/* Current Folder Path (Breadcrumb style) */}
        {currentFolder && (
           <div className="ml-2 flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100/50 px-2.5 py-1 rounded-md border border-gray-200/50 animate-fadeIn">
              <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              <span className="font-medium max-w-[150px] truncate">{currentFolder}</span>
           </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        
        {/* Scale Slider (Grid Only) */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-2 w-28 group">
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1"
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500 group-hover:bg-gray-300 transition-colors"
            />
          </div>
        )}

        {/* Divider */}
        <div className="h-5 w-px bg-gray-300/50"></div>

        {/* Custom Styled Sort Dropdown */}
        <div className="relative group">
           {/* Invisible Select overlay */}
           <select 
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             value={`${sortConfig.key}-${sortConfig.direction}`}
             onChange={(e) => {
               const [key, direction] = e.target.value.split('-');
               setSortConfig({ key: key as any, direction: direction as any });
             }}
           >
             <option value="name-asc">Name (A-Z)</option>
             <option value="name-desc">Name (Z-A)</option>
             <option value="dateTaken-desc">Date Taken (Newest)</option>
             <option value="dateTaken-asc">Date Taken (Oldest)</option>
             <option value="dateModified-desc">Date Mod (Newest)</option>
             <option value="dateModified-asc">Date Mod (Oldest)</option>
             <option value="size-desc">Size (Largest)</option>
             <option value="size-asc">Size (Smallest)</option>
           </select>
           
           {/* Visual Button */}
           <div className="flex items-center gap-2 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 transition-colors shadow-sm text-[12px] font-medium text-gray-700 min-w-[110px] justify-between">
              <div className="flex items-center gap-1.5">
                  <SortIcon />
                  <span>
                    {sortConfig.key === 'name' ? 'Name' : 
                     sortConfig.key === 'dateTaken' ? 'Date Taken' :
                     sortConfig.key === 'dateModified' ? 'Date Mod' : 'Size'}
                  </span>
              </div>
              <ChevronDown />
           </div>
        </div>

        {/* Segmented Control View Toggle */}
        <div className="bg-gray-200/60 p-0.5 rounded-lg flex items-center h-7 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]">
          <button 
            onClick={() => setViewMode('grid')}
            className={`h-full px-2 rounded-[5px] flex items-center justify-center transition-all duration-200 ${
                viewMode === 'grid' 
                ? 'bg-white shadow-sm text-gray-800 scale-[1.02]' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
            }`}
            title="Grid View"
          >
            <GridIcon />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`h-full px-2 rounded-[5px] flex items-center justify-center transition-all duration-200 ${
                viewMode === 'list' 
                ? 'bg-white shadow-sm text-gray-800 scale-[1.02]' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
            }`}
            title="List View"
          >
            <ListIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;