import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Photo, SortConfig, ViewMode, RenameOptions, SortKey } from './types';
import { getImageDimensions, getExifDate } from './utils';
import Sidebar from './components/Sidebar';
import Toolbar from './components/Toolbar';
import ImageGrid from './components/ImageGrid';
import DetailsPane from './components/DetailsPane';
import RenameModal from './components/RenameModal';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [scale, setScale] = useState(1);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [quickLookPhoto, setQuickLookPhoto] = useState<Photo | null>(null);
  
  // New state for UI Feedback & File System
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<any | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
      setNotification({ message, type });
  };

  // Helper: Verify Permission
  const verifyPermission = async (handle: any, readWrite: boolean) => {
    const options = { mode: readWrite ? 'readwrite' : 'read' };
    try {
      // @ts-ignore
      if ((await handle.queryPermission(options)) === 'granted') {
        return true;
      }
      // @ts-ignore
      if ((await handle.requestPermission(options)) === 'granted') {
        return true;
      }
    } catch (e) {
      console.error("Permission check failed", e);
    }
    return false;
  };

  // Delete Logic
  const handleDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    // Check if we are in "Real Disk" mode
    if (directoryHandle) {
        // Since browsers don't support "Move to Recycle Bin", we must warn about Permanent Delete
        const confirmMessage = `⚠️ WARNING: Permanent Delete\n\nAre you sure you want to permanently delete ${selectedIds.size} item(s) from your disk?\n\nWeb apps cannot move files to the system Trash/Recycle Bin. This action cannot be undone.`;
        
        if (!window.confirm(confirmMessage)) return;

        const hasPermission = await verifyPermission(directoryHandle, true);
        if (!hasPermission) {
            showToast("Permission denied. Cannot delete files.", "error");
            return;
        }
    } else {
        // Browser Import Mode (Memory only)
        if (!window.confirm(`Remove ${selectedIds.size} item(s) from the application view?`)) return;
    }

    let deletedCount = 0;
    let errorCount = 0;
    const idsToDelete = Array.from(selectedIds);

    for (const id of idsToDelete) {
        const photo = photos.find(p => p.id === id);
        if (!photo) continue;

        if (directoryHandle && photo.name) {
             try {
                 // Try to remove from actual disk using parent handle
                 // @ts-ignore
                 await directoryHandle.removeEntry(photo.name);
                 deletedCount++;
             } catch (err) {
                 console.error(`Failed to delete file ${photo.name} from disk:`, err);
                 errorCount++;
             }
        } else {
             // Just memory removal
             deletedCount++;
        }
    }

    // Update State
    setPhotos(prev => prev.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    
    if (errorCount > 0) {
        showToast(`Deleted ${deletedCount} items. ${errorCount} failed.`, 'error');
    } else {
        showToast(`Successfully deleted ${deletedCount} items.`, 'success');
    }

  }, [selectedIds, directoryHandle, photos]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if modal is open
      if (isRenameModalOpen) return;

      if (e.code === 'Space') {
        if (quickLookPhoto) {
           e.preventDefault();
           setQuickLookPhoto(null);
        } else if (selectedIds.size > 0) {
           e.preventDefault();
           // Find the first selected photo
           const firstSelectedId = Array.from(selectedIds)[0];
           const photo = photos.find(p => p.id === firstSelectedId);
           if (photo) setQuickLookPhoto(photo);
        }
      } else if (e.key === 'Escape') {
        if (quickLookPhoto) setQuickLookPhoto(null);
        else if (selectedIds.size > 0) setSelectedIds(new Set());
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
          // Check if we are not in an input field
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              if (selectedIds.size > 0 && !quickLookPhoto) {
                  handleDelete();
              }
          }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
          // Prevent default select all text behavior
          e.preventDefault();
          // Select All
          if (photos.length > 0) {
              const allIds = new Set(photos.map(p => p.id));
              if (allIds.size === selectedIds.size) {
                   setSelectedIds(new Set()); // Toggle off if already all selected
              } else {
                   setSelectedIds(allIds);
              }
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickLookPhoto, selectedIds, photos, isRenameModalOpen, handleDelete]);

  // Handle loading photos from the fallback input
  const processFiles = async (fileList: File[]) => {
    // Reset Handle
    setDirectoryHandle(null);
    
    // Extract folder name from webkitRelativePath (standard in folder upload)
    if (fileList.length > 0) {
        // Use type assertion for non-standard property
        const firstFile = fileList[0] as any;
        if (firstFile.webkitRelativePath) {
            const parts = firstFile.webkitRelativePath.split('/');
            if (parts.length > 1) {
                setCurrentFolder(parts[0]);
            } else {
                setCurrentFolder("Imported Files");
            }
        } else {
            setCurrentFolder("Imported Files");
        }
    } else {
        setCurrentFolder("Imported Files");
    }

    const imageFiles = fileList.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast("No image files found in the selected folder.", "error");
        return;
    }

    const newPhotos: Photo[] = await Promise.all(imageFiles.map(async (file, index) => {
      const objectUrl = URL.createObjectURL(file);
      return {
        id: `photo-${Date.now()}-${index}`,
        file: file,
        name: file.name,
        url: objectUrl,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        isFavorite: false
      };
    }));

    setPhotos(newPhotos);
    setSelectedIds(new Set());
    showToast(`Loaded ${newPhotos.length} images (Read-Only Mode)`, 'info');

    // Lazy load dimensions and EXIF
    newPhotos.forEach(p => {
        // Dimensions
        getImageDimensions(p.file).then(dims => {
            setPhotos(prev => prev.map(ph => ph.id === p.id ? { ...ph, dimensions: dims } : ph));
        });
        // EXIF Date
        getExifDate(p.file).then(dateTaken => {
            if (dateTaken) {
                setPhotos(prev => prev.map(ph => ph.id === p.id ? { ...ph, dateTaken } : ph));
            }
        });
    });
  };

  const handleLoadFolderFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  // Handle Folder Upload using File System Access API
  // Returns true if successful, false if fallback is needed
  const handleOpenDirectory = async (): Promise<boolean> => {
    try {
      // Check if API is available
      if (!('showDirectoryPicker' in window)) return false;

      // Request readwrite access upfront for full functionality
      const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'pictures' // Suggest opening pictures folder
      });
      
      setDirectoryHandle(dirHandle); // Store handle for deletion/creation ops
      setCurrentFolder(dirHandle.name);
      
      const newPhotos: Photo[] = [];
      let index = 0;

      // @ts-ignore
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          // Filter by extension manually since we don't have mime type without getting the file
          if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) {
            const file = await entry.getFile();
            const objectUrl = URL.createObjectURL(file);
            
            newPhotos.push({
              id: `photo-${Date.now()}-${index++}`,
              file: file,
              fileHandle: entry, // Store the handle for future operations like renaming
              name: file.name,
              url: objectUrl,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              isFavorite: false
            });
          }
        }
      }

      setPhotos(newPhotos);
      setSelectedIds(new Set());
      showToast(`Folder "${dirHandle.name}" opened with Full Access`, 'success');

      // Lazy dimensions and EXIF
      newPhotos.forEach(p => {
         getImageDimensions(p.file).then(dims => {
             setPhotos(prev => prev.map(ph => ph.id === p.id ? { ...ph, dimensions: dims } : ph));
         });
         getExifDate(p.file).then(dateTaken => {
            if (dateTaken) {
                setPhotos(prev => prev.map(ph => ph.id === p.id ? { ...ph, dateTaken } : ph));
            }
        });
      });

      return true;

    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled the picker, consider this "handled" (don't open fallback)
        return true; 
      }
      console.warn("Direct directory access failed, falling back to input:", err);
      return false;
    }
  };

  // Selection Logic
  const handleToggleSelect = useCallback((id: string, multiSelect: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(multiSelect ? prev : []);
      if (newSet.has(id)) {
        if (multiSelect) newSet.delete(id);
        else newSet.add(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  }, []);

  // Sorting Logic
  const handleSort = (key: SortKey) => {
    setSortConfig(current => {
       if (current.key === key) {
         return { ...current, direction: current.direction === 'asc' ? 'desc' : 'asc' };
       }
       return { key, direction: 'asc' };
    });
  };

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'favorites') {
      return photos.filter(p => p.isFavorite);
    } else if (activeCategory === 'recent') {
      // Example: photos from the last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return photos.filter(p => p.lastModified > thirtyDaysAgo);
    }
    return photos;
  }, [photos, activeCategory]);

  const sortedPhotos = useMemo(() => {
    let sorted = [...filteredPhotos];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.key) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'dateModified':
          comparison = a.lastModified - b.lastModified;
          break;
        case 'dateTaken':
          // Sort by date taken (EXIF), fallback to lastModified if not present
          const timeA = a.dateTaken || a.lastModified;
          const timeB = b.dateTaken || b.lastModified;
          comparison = timeA - timeB;
          break;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredPhotos, sortConfig]);

  const counts = useMemo(() => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return {
          all: photos.length,
          recent: photos.filter(p => p.lastModified > thirtyDaysAgo).length,
          favorites: photos.filter(p => p.isFavorite).length
      };
  }, [photos]);


  // Select All Logic
  const handleSelectAll = useCallback(() => {
    if (sortedPhotos.length === 0) return;
    
    // If all are selected, deselect all. Otherwise, select all.
    const allSelected = sortedPhotos.every(p => selectedIds.has(p.id));
    
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedPhotos.map(p => p.id)));
    }
  }, [sortedPhotos, selectedIds]);


  // Batch Rename Logic
  const handleBatchRename = async (options: RenameOptions) => {
    setIsRenameModalOpen(false);
    
    // Check permissions before batch rename
    if (directoryHandle) {
        const hasPermission = await verifyPermission(directoryHandle, true);
        if (!hasPermission) {
            showToast("Permission denied. Cannot rename files.", "error");
            return;
        }
    }
    
    let currentNumber = options.startNumber || 1;
    const updates: { id: string, newName: string, newFile?: File }[] = [];
    let hasRenameErrors = false;
    let missingHandleCount = 0;

    // Pre-compile Regex if needed
    let regex: RegExp | null = null;
    if (options.mode === 'replace' && options.useRegex && options.findText) {
        try {
            // Global flag for "Replace All" behavior
            regex = new RegExp(options.findText, 'g');
        } catch (e) {
            showToast("Invalid Regular Expression", "error");
            return;
        }
    }

    for (const photo of photos) {
      if (selectedIds.has(photo.id)) {
        let newName = photo.name;

        // Calculate New Name
        if (options.mode === 'sequence') {
            const ext = photo.name.split('.').pop();
            newName = `${options.prefix}${currentNumber.toString().padStart(3, '0')}.${ext}`;
            currentNumber++;
        } else if (options.mode === 'replace' && options.findText) {
            if (options.useRegex && regex) {
                // Regex Replacement
                newName = photo.name.replace(regex, options.replaceText || '');
            } else {
                // Standard Text Replacement
                if (photo.name.includes(options.findText)) {
                    // Use split/join instead of replaceAll for broader compatibility
                    newName = photo.name.split(options.findText).join(options.replaceText || '');
                } else {
                    // If text not found, skip renaming this specific file
                    continue; 
                }
            }
        }

        // If name didn't change (e.g. pattern not found or same name), skip
        if (newName === photo.name) continue;

        // Apply Rename
        if (photo.fileHandle) {
          try {
            // @ts-ignore - move is part of the draft spec
            if (typeof photo.fileHandle.move === 'function') {
                await photo.fileHandle.move(newName);
            } else {
                 // Fallback or skip if not supported
                 console.warn("File System Access API 'move' not supported.");
                 hasRenameErrors = true;
                 continue;
            }
            
            const newFile = await photo.fileHandle.getFile();
            updates.push({ id: photo.id, newName, newFile });
          } catch (error) {
            console.error("Failed to rename file:", photo.name, error);
            hasRenameErrors = true;
          }
        } else {
          // No handle (fallback mode), just update in-memory
          missingHandleCount++;
          updates.push({ id: photo.id, newName });
        }
      }
    }

    if (missingHandleCount > 0) {
      showToast(`Renamed ${missingHandleCount} items (In-Memory Only - Browser Restriction)`, 'info');
    } else if (hasRenameErrors) {
      showToast("Some files could not be renamed (API limit or Permission denied).", "error");
    } else if (updates.length > 0) {
      showToast(`Successfully renamed ${updates.length} items`, "success");
    } else {
      showToast("No changes made", "info");
    }

    if (updates.length > 0) {
      setPhotos(prev => prev.map(p => {
        const update = updates.find(u => u.id === p.id);
        if (update) {
          return { 
            ...p, 
            name: update.newName, 
            file: update.newFile || p.file,
            url: update.newFile ? URL.createObjectURL(update.newFile) : p.url 
          };
        }
        return p;
      }));
    }
  };

  // Update Photo Data (e.g. from AI)
  const handleUpdatePhoto = (id: string, data: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const displayPhotos = sortedPhotos;
  const selectedPhotosList = displayPhotos.filter(p => selectedIds.has(p.id));

  return (
    <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden font-sans">
      <Sidebar 
        counts={counts}
        selectedCount={selectedIds.size} 
        onSelectCategory={setActiveCategory}
        activeCategory={activeCategory}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar 
          onOpenDirectory={handleOpenDirectory}
          onLoadFolderFallback={handleLoadFolderFallback}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          onBatchRename={() => setIsRenameModalOpen(true)}
          onDelete={handleDelete}
          canRename={selectedIds.size > 0}
          canDelete={selectedIds.size > 0}
          scale={scale}
          setScale={setScale}
          currentFolder={currentFolder}
        />
        
        <main className="flex-1 flex overflow-hidden relative">
          <ImageGrid 
            photos={displayPhotos} 
            selectedIds={selectedIds} 
            onToggleSelect={handleToggleSelect} 
            onSelectAll={handleSelectAll}
            viewMode={viewMode}
            scale={scale}
            sortConfig={sortConfig}
            onSort={handleSort}
            onToggleFavorite={handleToggleFavorite}
            onQuickLook={setQuickLookPhoto}
          />
          
          <div className="w-80 border-l border-gray-200 flex-shrink-0 bg-gray-50/50">
             <DetailsPane 
               selectedPhotos={selectedPhotosList} 
               onUpdatePhoto={handleUpdatePhoto}
             />
          </div>
        </main>
      </div>

      <RenameModal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleBatchRename}
        count={selectedIds.size}
      />

      {/* Quick Look Modal */}
      {quickLookPhoto && (
          <div 
             className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-8 animate-fadeIn"
             onClick={() => setQuickLookPhoto(null)}
          >
             <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                 <img 
                    src={quickLookPhoto.url} 
                    alt={quickLookPhoto.name}
                    className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" 
                 />
                 <div className="mt-4 px-6 py-2 bg-black/70 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10 shadow-lg flex items-center gap-4">
                     <span className="truncate max-w-xs">{quickLookPhoto.name}</span>
                     <span className="w-px h-3 bg-white/30"></span>
                     <span className="text-white/70">{quickLookPhoto.dimensions?.width} × {quickLookPhoto.dimensions?.height}</span>
                 </div>
                 
                 <button 
                    onClick={() => setQuickLookPhoto(null)}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors"
                 >
                    ✕
                 </button>
             </div>
          </div>
      )}

      {notification && (
        <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default App;