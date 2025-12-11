import React, { useEffect, useRef, useMemo } from 'react';
import { Photo, ViewMode, SortConfig, SortKey } from '../types';
import { formatBytes, formatDate, groupPhotosByDate } from '../utils';

interface ImageGridProps {
  photos: Photo[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, multiSelect: boolean) => void;
  onSelectAll: () => void;
  viewMode: ViewMode;
  scale: number;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  onToggleFavorite: (id: string) => void;
  onQuickLook: (photo: Photo) => void;
  onContextMenu?: (e: React.MouseEvent, photo?: Photo) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ 
  photos, 
  selectedIds, 
  onToggleSelect, 
  onSelectAll, 
  viewMode, 
  scale,
  sortConfig,
  onSort,
  onToggleFavorite,
  onQuickLook,
  onContextMenu
}) => {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = photos.length > 0 && selectedIds.size === photos.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < photos.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Determine if we should group by date
  // macOS groups photos when sorted by date, but usually not when sorted by Name or Size
  const isGroupedView = useMemo(() => {
    return viewMode === 'grid' && (sortConfig.key === 'dateTaken' || sortConfig.key === 'dateModified');
  }, [viewMode, sortConfig]);

  const groupedPhotos = useMemo(() => {
    if (!isGroupedView) return null;
    return groupPhotosByDate(photos);
  }, [photos, isGroupedView]);


  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <span className={`ml-1 inline-flex items-center justify-center w-4 h-4 transition-opacity ${isActive ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-40'}`}>
        {isActive && sortConfig.direction === 'desc' ? '↓' : '↑'}
      </span>
    );
  };

  // Render a single photo card
  const renderPhotoCard = (photo: Photo) => {
    const isSelected = selectedIds.has(photo.id);
    return (
        <div 
          key={photo.id} 
          onClick={(e) => onToggleSelect(photo.id, e.metaKey || e.ctrlKey)}
          onDoubleClick={() => onQuickLook(photo)}
          onContextMenu={(e) => onContextMenu && onContextMenu(e, photo)}
          className={`group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
            isSelected 
              ? 'bg-blue-100 shadow-sm ring-2 ring-blue-500 ring-offset-2' 
              : 'hover:bg-gray-100 hover:scale-[1.02]'
          }`}
        >
          <div 
            className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-200 shadow-sm border border-gray-200/50"
          >
            {/* Grid Checkbox Overlay */}
            <div className={`absolute top-2 left-2 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                <input 
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect(photo.id, true);
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm cursor-pointer accent-blue-600"
                />
            </div>

            {/* Favorite Button Overlay */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                }}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-full backdrop-blur-md transition-all duration-200 ${
                    photo.isFavorite 
                        ? 'bg-white/80 text-red-500 opacity-100' 
                        : 'bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100'
                }`}
            >
                <svg className="w-4 h-4" fill={photo.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </button>

            <img 
              src={photo.url} 
              alt={photo.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {photo.aiTags && (
                <div className="absolute bottom-2 right-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                </div>
            )}
          </div>
          <span className={`text-xs font-medium text-center truncate w-full px-1 rounded ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
            {photo.name}
          </span>
        </div>
    );
  };

  if (photos.length === 0) {
    return (
      <div 
        className="flex-1 flex flex-col items-center justify-center text-gray-400 h-full"
        onContextMenu={(e) => onContextMenu && onContextMenu(e)}
      >
        <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <p className="text-lg font-medium">No Photos Loaded</p>
        <p className="text-sm">Click "Open Folder" to import images.</p>
      </div>
    );
  }

  // List View (Table)
  if (viewMode === 'list') {
    return (
      <div 
        className="flex-1 overflow-y-auto bg-white p-2"
        onContextMenu={(e) => onContextMenu && onContextMenu(e)}
      >
        <table className="w-full text-left text-sm text-gray-600 select-none border-collapse">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-2 w-10 rounded-tl-lg">
                 <input 
                    type="checkbox"
                    ref={selectAllRef}
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-2 w-10"></th>
              <th className="px-4 py-2 w-16">Preview</th>
              
              <th 
                className="px-4 py-2 cursor-pointer group hover:bg-gray-100 transition-colors select-none"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center">
                  Name <SortIndicator columnKey="name" />
                </div>
              </th>

              <th 
                className="px-4 py-2 cursor-pointer group hover:bg-gray-100 transition-colors select-none"
                onClick={() => onSort('dateTaken')}
              >
                <div className="flex items-center">
                  Date Taken <SortIndicator columnKey="dateTaken" />
                </div>
              </th>

              <th 
                className="px-4 py-2 cursor-pointer group hover:bg-gray-100 transition-colors select-none"
                onClick={() => onSort('dateModified')}
              >
                <div className="flex items-center">
                  Date Modified <SortIndicator columnKey="dateModified" />
                </div>
              </th>
              
              <th 
                className="px-4 py-2 cursor-pointer group hover:bg-gray-100 transition-colors select-none rounded-tr-lg"
                onClick={() => onSort('size')}
              >
                <div className="flex items-center">
                  Size <SortIndicator columnKey="size" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {photos.map(photo => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <tr 
                  key={photo.id}
                  onClick={(e) => onToggleSelect(photo.id, e.metaKey || e.ctrlKey)}
                  onDoubleClick={() => onQuickLook(photo)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, photo)}
                  className={`hover:bg-blue-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 text-blue-900' : ''}`}
                >
                  <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                    <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(photo.id, true)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                  </td>
                  <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => onToggleFavorite(photo.id)}
                        className={`hover:scale-110 transition-transform ${photo.isFavorite ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                    >
                         <svg className="w-4 h-4" fill={photo.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <img src={photo.url} alt="" className="w-8 h-8 object-cover rounded shadow-sm" loading="lazy" />
                  </td>
                  <td className="px-4 py-2 font-medium truncate max-w-[200px]">{photo.name}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(photo.dateTaken || 0)}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(photo.lastModified)}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs">{formatBytes(photo.size)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Grid View
  const baseSize = 180;
  const itemSize = baseSize * scale;

  return (
    <div 
      className="flex-1 overflow-y-auto p-6" 
      onContextMenu={(e) => onContextMenu && onContextMenu(e)}
      onClick={(e) => {
        // Optional: Clicking blank space logic
      }}
    >
      <div className="mb-4 flex items-center gap-2 pl-1">
          <input 
            type="checkbox"
            id="selectAllGrid"
            ref={selectAllRef}
            checked={allSelected}
            onChange={onSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="selectAllGrid" className="text-sm text-gray-500 cursor-pointer select-none">Select All ({photos.length} items)</label>
      </div>

      {isGroupedView && groupedPhotos ? (
        // Grouped View (Date Headers)
        <div className="space-y-8 pb-12">
          {Object.entries(groupedPhotos).map(([date, groupPhotos]) => (
            <div key={date}>
              <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm py-2 px-1 mb-2 border-b border-gray-100 flex items-center">
                 <h3 className="text-lg font-bold text-gray-800">{date}</h3>
                 <span className="ml-3 text-xs text-gray-400 font-medium">{groupPhotos.length} photos</span>
              </div>
              <div 
                className="grid gap-6 auto-rows-min grid-cols-[repeat(auto-fill,minmax(var(--item-size),1fr))]"
                style={{ '--item-size': `${itemSize}px` } as React.CSSProperties}
              >
                {groupPhotos.map(photo => renderPhotoCard(photo))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard Flat Grid
        <div 
          className="grid gap-6 auto-rows-min grid-cols-[repeat(auto-fill,minmax(var(--item-size),1fr))]"
          style={{ '--item-size': `${itemSize}px` } as React.CSSProperties}
        >
          {photos.map((photo) => renderPhotoCard(photo))}
        </div>
      )}
    </div>
  );
};

export default ImageGrid;