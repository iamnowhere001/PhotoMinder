import React, { useState, useEffect } from 'react';
import { RenameOptions } from '../types';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: RenameOptions) => void;
  count: number;
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onConfirm, count }) => {
  const [mode, setMode] = useState<'sequence' | 'replace'>('sequence');
  
  // Sequence Mode State
  const [prefix, setPrefix] = useState('Photo_');
  const [startNumber, setStartNumber] = useState(1);
  
  // Replace Mode State
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setMode('sequence');
      setPrefix('Photo_');
      setStartNumber(1);
      setFindText('');
      setReplaceText('');
      setUseRegex(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPreview = () => {
    if (mode === 'sequence') {
      return `${prefix}${startNumber.toString().padStart(3, '0')}.jpg`;
    } else {
      if (!findText) return 'IMG_1234.jpg';
      const example = 'IMG_1234.jpg';
      
      if (useRegex) {
        try {
          // Validate regex
          const regex = new RegExp(findText, 'g');
          return example.replace(regex, replaceText);
        } catch (e) {
          return "Invalid Regular Expression";
        }
      }

      if (example.includes(findText)) {
        return example.split(findText).join(replaceText);
      }
      return `(Depends on filename)`;
    }
  };

  const handleConfirm = () => {
    onConfirm({
      mode,
      prefix,
      startNumber,
      findText,
      replaceText,
      useRegex
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden border border-gray-200 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Batch Rename</h3>
          <p className="text-sm text-gray-500">Renaming {count} items</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMode('sequence')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'sequence' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Format Name
            </button>
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'replace' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Replace Text
            </button>
          </div>

          {mode === 'sequence' ? (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Custom Format</label>
                <input 
                  type="text" 
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Img_"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Number</label>
                <input 
                  type="number" 
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  min="0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
               <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Find</label>
                <input 
                  type="text" 
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder={useRegex ? "Regular Expression..." : "Text to find..."}
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Replace with</label>
                <input 
                  type="text" 
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder={useRegex ? "Replacement (supports $1, $2...)" : "Leave empty to remove"}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="useRegex" 
                    checked={useRegex} 
                    onChange={(e) => setUseRegex(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="useRegex" className="text-sm text-gray-600 select-none cursor-pointer">Use Regular Expression</label>
              </div>
            </div>
          )}

          <div className={`bg-blue-50/50 border p-3 rounded-lg ${getPreview() === 'Invalid Regular Expression' ? 'border-red-200 bg-red-50' : 'border-blue-100'}`}>
             <p className={`text-xs font-medium mb-1 ${getPreview() === 'Invalid Regular Expression' ? 'text-red-600' : 'text-blue-600'}`}>Preview:</p>
             <p className={`text-sm font-mono truncate ${getPreview() === 'Invalid Regular Expression' ? 'text-red-800' : 'text-blue-800'}`}>{getPreview()}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 mt-auto">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;