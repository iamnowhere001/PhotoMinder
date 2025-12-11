
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Photo } from '../types';
import { formatBytes, formatDate } from '../utils';
import { analyzeImage } from '../services/geminiService';

interface DetailsPaneProps {
  selectedPhotos: Photo[];
  onUpdatePhoto: (id: string, data: Partial<Photo>) => void;
}

interface ExportSettings {
  format: string;
  quality: number;
}

const DetailsPane: React.FC<DetailsPaneProps> = ({ selectedPhotos, onUpdatePhoto }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Export State
  const [isExportMode, setIsExportMode] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: 'image/jpeg', quality: 0.9 });
  const [previewData, setPreviewData] = useState<{ url: string, size: number, blob: Blob } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  const isMulti = selectedPhotos.length > 1;
  const photo = selectedPhotos[0];

  // Reset export mode when selection changes
  useEffect(() => {
    setIsExportMode(false);
    setPreviewData(null);
    setExportSettings({ format: 'image/jpeg', quality: 0.9 });
  }, [photo?.id]);

  // Clean up preview URL
  useEffect(() => {
      return () => {
          if (previewData?.url) URL.revokeObjectURL(previewData.url);
      };
  }, [previewData]);

  // Debounced Preview Generation
  useEffect(() => {
      if (!isExportMode || !photo) return;

      const generate = async () => {
          setIsGeneratingPreview(true);
          try {
            const img = new Image();
            img.src = photo.url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width; // Use original dimensions
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // Fill white background for JPEGs (handling transparency)
                if (exportSettings.format === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const newUrl = URL.createObjectURL(blob);
                        setPreviewData(prev => {
                            if (prev?.url) URL.revokeObjectURL(prev.url);
                            return { url: newUrl, size: blob.size, blob };
                        });
                    }
                    setIsGeneratingPreview(false);
                }, exportSettings.format, exportSettings.quality);
            }
          } catch (error) {
              console.error("Preview generation failed", error);
              setIsGeneratingPreview(false);
          }
      };

      const timer = setTimeout(generate, 300); // Debounce 300ms
      return () => clearTimeout(timer);
  }, [exportSettings, isExportMode, photo]);

  const handleDownload = () => {
      if (!previewData || !photo) return;
      
      const link = document.createElement('a');
      link.href = previewData.url;
      
      // Determine extension
      let ext = 'jpg';
      if (exportSettings.format === 'image/png') ext = 'png';
      else if (exportSettings.format === 'image/webp') ext = 'webp';
      
      const originalName = photo.name.substring(0, photo.name.lastIndexOf('.')) || photo.name;
      link.download = `${originalName}_edited.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleAnalyze = async () => {
    if (isMulti) return; // Simple version: single file only
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(photo.file);
      if (result) {
        onUpdatePhoto(photo.id, {
          aiDescription: result.description,
          aiTags: result.tags
        });
      }
    } catch (e) {
      alert("Failed to analyze image. Ensure API Key is set.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (selectedPhotos.length === 0) {
    return (
      <div className="w-80 bg-white/80 backdrop-blur-xl border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <p className="text-gray-400 font-medium">Select an item to view details</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white/90 backdrop-blur-xl border-l border-gray-200 h-full overflow-y-auto flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
            {isMulti ? `${selectedPhotos.length} Items Selected` : 'Info'}
        </h2>
      </div>

      {!isMulti && (
        <>
            <div className="p-5 flex flex-col items-center border-b border-gray-100 relative">
                <div className="w-48 h-48 bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-4 border border-gray-200 relative group">
                    {/* Image Preview Area */}
                    {isExportMode && previewData ? (
                        <img src={previewData.url} className="w-full h-full object-contain" alt="Export Preview" />
                    ) : (
                        <img src={photo.url} className="w-full h-full object-contain" alt="Original" />
                    )}
                    
                    {/* Loading Overlay */}
                    {isExportMode && isGeneratingPreview && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-sm">
                            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        </div>
                    )}

                    {isExportMode && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                            PREVIEW
                        </div>
                    )}
                </div>
                
                <h3 className="font-semibold text-gray-800 text-center break-all px-2">{photo.name}</h3>
                
                {/* Size Comparison */}
                <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs ${isExportMode ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                        {formatBytes(photo.size)}
                    </p>
                    {isExportMode && previewData && (
                        <>
                            <span className="text-gray-300">→</span>
                            <p className={`text-xs font-bold ${previewData.size > photo.size ? 'text-red-500' : 'text-green-600'}`}>
                                {formatBytes(previewData.size)}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="p-5 space-y-6">
                
                {/* Export / Save Section */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 transition-all">
                    <div className="flex items-center justify-between mb-3">
                         <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                            Export & Compress
                         </label>
                         <button 
                             onClick={() => setIsExportMode(!isExportMode)}
                             className={`text-xs font-medium px-2 py-1 rounded transition-colors ${isExportMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                         >
                             {isExportMode ? 'Active' : 'Enable'}
                         </button>
                    </div>

                    {isExportMode && (
                        <div className="space-y-4 animate-fadeIn">
                             {/* Format Selection */}
                             <div>
                                 <label className="text-[10px] uppercase text-gray-400 font-semibold mb-1 block">Format</label>
                                 <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                                     {['image/jpeg', 'image/png', 'image/webp'].map(fmt => (
                                         <button
                                             key={fmt}
                                             onClick={() => setExportSettings(s => ({ ...s, format: fmt }))}
                                             className={`flex-1 py-1 text-xs font-medium rounded transition-all ${exportSettings.format === fmt ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                         >
                                             {fmt.split('/')[1].toUpperCase()}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             {/* Quality Slider */}
                             {exportSettings.format !== 'image/png' && (
                                 <div>
                                     <div className="flex justify-between mb-1">
                                         <label className="text-[10px] uppercase text-gray-400 font-semibold">Quality</label>
                                         <span className="text-xs font-medium text-blue-600">{Math.round(exportSettings.quality * 100)}%</span>
                                     </div>
                                     <input 
                                         type="range" 
                                         min="0.1" 
                                         max="1" 
                                         step="0.05"
                                         value={exportSettings.quality}
                                         onChange={(e) => setExportSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                                         className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                     />
                                 </div>
                             )}

                             {/* Action Button */}
                             <button
                                 onClick={handleDownload}
                                 className="w-full py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95 flex items-center justify-center gap-2"
                             >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                 Save Image
                             </button>
                        </div>
                    )}
                </div>

                {/* File Info & EXIF */}
                <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">File Info</label>
                    <div className="mt-2 space-y-2 text-sm">
                        {photo.dimensions && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dimensions</span>
                                <span className="text-gray-800 font-medium">{photo.dimensions.width} x {photo.dimensions.height}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-start">
                            <span className="text-gray-500">Date Taken</span>
                            <span className="text-gray-800 font-medium text-right w-32 truncate">
                                {photo.dateTaken ? formatDate(photo.dateTaken) : '--'}
                            </span>
                        </div>
                        
                        {/* Extended EXIF Data */}
                        {photo.exif && (photo.exif.make || photo.exif.model || photo.exif.fNumber) && (
                            <div className="pt-2 mt-2 border-t border-dashed border-gray-100 space-y-1">
                                {photo.exif.model && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Camera</span>
                                        <span className="text-gray-800 font-medium truncate ml-2" title={photo.exif.model}>{photo.exif.make} {photo.exif.model}</span>
                                    </div>
                                )}
                                {photo.exif.lensModel && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Lens</span>
                                        <span className="text-gray-800 font-medium truncate ml-2" title={photo.exif.lensModel}>{photo.exif.lensModel}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-600 font-mono pt-1">
                                    <span>{photo.exif.focalLength ? `${photo.exif.focalLength}` : ''}</span>
                                    <div className="flex gap-2">
                                        <span>{photo.exif.fNumber ? `${photo.exif.fNumber}` : ''}</span>
                                        <span>{photo.exif.exposureTime ? `${photo.exif.exposureTime}s` : ''}</span>
                                        <span>{photo.exif.iso ? `ISO ${photo.exif.iso}` : ''}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                         <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                            ✨ Gemini AI Analysis
                         </label>
                    </div>
                    
                    {!photo.aiDescription && !photo.aiTags && (
                         <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                         >
                            {isAnalyzing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Image'
                            )}
                         </button>
                    )}

                    {(photo.aiDescription || photo.aiTags) && (
                        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                             {photo.aiDescription && (
                                 <p className="text-sm text-gray-700 italic mb-3 leading-relaxed">"{photo.aiDescription}"</p>
                             )}
                             {photo.aiTags && (
                                 <div className="flex flex-wrap gap-1.5">
                                     {photo.aiTags.map(tag => (
                                         <span key={tag} className="px-2 py-0.5 bg-white text-purple-600 border border-purple-200 rounded-full text-xs font-medium">
                                             #{tag}
                                         </span>
                                     ))}
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </>
      )}

      {isMulti && (
          <div className="p-5">
              <p className="text-sm text-gray-500">Multiple items selected. Batch actions can be performed from the toolbar.</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 text-sm">Total Size</span>
                    <span className="text-gray-800 font-medium text-sm">
                        {formatBytes(selectedPhotos.reduce((acc, p) => acc + p.size, 0))}
                    </span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DetailsPane;
