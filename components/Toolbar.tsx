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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);
const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
    // Attempt the modern API first
    const success = await onOpenDirectory();
    if (!success) {
      // Fallback to input element
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="h-14 min-h-[3.5rem] bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-4 z-20 sticky top-0">
      <div className="flex items-center gap-4">
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
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md cursor-pointer transition-colors shadow-sm active:scale-95 transform outline-none focus:ring-2 focus:ring-gray-300"
        >
          <FolderIcon />
          <span>Open Folder</span>
        </button>

        {currentFolder && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-md border border-blue-100 select-none animate-fadeIn transition-all">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
            <span className="max-w-[150px] truncate">{currentFolder}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        
        <button 
          onClick={onBatchRename}
          disabled={!canRename}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            canRename 
              ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Batch Rename
        </button>

        <button 
          onClick={onDelete}
          disabled={!canDelete}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            canDelete 
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Delete selected items"
        >
          <TrashIcon />
          <span>Delete</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Sort Dropdown */}
        <div className="relative group">
           <select 
             className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-1.5 pl-3 pr-8 rounded-md outline-none cursor-pointer font-medium transition-colors"
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
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>

        {/* Scale Slider (only for Grid) */}
        {viewMode === 'grid' && (
          <div className="flex items-center gap-2 w-32">
            <span className="text-xs text-gray-400">🔍</span>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1"
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-500"
            />
          </div>
        )}

        {/* View Toggle */}
        <div className="bg-gray-100 p-0.5 rounded-lg flex items-center">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <GridIcon />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ListIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;