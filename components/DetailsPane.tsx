import React, { useState } from 'react';
import { Photo } from '../types';
import { formatBytes, formatDate } from '../utils';
import { analyzeImage } from '../services/geminiService';

interface DetailsPaneProps {
  selectedPhotos: Photo[];
  onUpdatePhoto: (id: string, data: Partial<Photo>) => void;
}

const DetailsPane: React.FC<DetailsPaneProps> = ({ selectedPhotos, onUpdatePhoto }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  if (selectedPhotos.length === 0) {
    return (
      <div className="w-80 bg-white/80 backdrop-blur-xl border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <p className="text-gray-400 font-medium">Select an item to view details</p>
      </div>
    );
  }

  const isMulti = selectedPhotos.length > 1;
  const photo = selectedPhotos[0];

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

  return (
    <div className="w-80 bg-white/90 backdrop-blur-xl border-l border-gray-200 h-full overflow-y-auto flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-1">
            {isMulti ? `${selectedPhotos.length} Items Selected` : 'Info'}
        </h2>
      </div>

      {!isMulti && (
        <>
            <div className="p-5 flex flex-col items-center border-b border-gray-100">
                <div className="w-48 h-48 bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-4 border border-gray-200">
                    <img src={photo.url} className="w-full h-full object-contain" alt="Preview" />
                </div>
                <h3 className="font-semibold text-gray-800 text-center break-all px-2">{photo.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{photo.type.toUpperCase()}</p>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">File Info</label>
                    <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Size</span>
                            <span className="text-gray-800 font-medium">{formatBytes(photo.size)}</span>
                        </div>
                        {photo.dimensions && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dimensions</span>
                                <span className="text-gray-800 font-medium">{photo.dimensions.width} x {photo.dimensions.height}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase">Dates</label>
                    <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between items-start">
                            <span className="text-gray-500">Date Taken</span>
                            <span className="text-gray-800 font-medium text-right w-32 truncate">
                                {photo.dateTaken ? formatDate(photo.dateTaken) : '--'}
                            </span>
                        </div>
                        <div className="flex justify-between items-start">
                            <span className="text-gray-500">Date Modified</span>
                            <span className="text-gray-800 font-medium text-right w-32 truncate">
                                {formatDate(photo.lastModified)}
                            </span>
                        </div>
                         <div className="flex justify-between items-start">
                            <span className="text-gray-500">Date Created</span>
                            <span className="text-gray-800 font-medium text-right w-32 truncate" title="In web apps, this often reflects Date Taken or Last Modified">
                                {photo.dateTaken ? formatDate(photo.dateTaken) : formatDate(photo.lastModified)}
                            </span>
                        </div>
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