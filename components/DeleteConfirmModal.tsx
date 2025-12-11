import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  count: number;
  isDiskOperation: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  isOpen, 
  count, 
  isDiskOperation, 
  onClose, 
  onConfirm 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-xl shadow-2xl w-[440px] overflow-hidden border border-gray-200 transform transition-all scale-100 p-0"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex gap-4">
          <div className="flex-shrink-0">
             <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
               <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
               </svg>
             </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isDiskOperation ? 'Permanently Delete Files?' : 'Remove from Library?'}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              You are about to delete <strong className="text-gray-900">{count}</strong> {count === 1 ? 'item' : 'items'}.
            </p>
            
            {isDiskOperation ? (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-md p-3">
                   <p className="text-sm text-red-800 font-medium">
                     ⚠️ Warning: Irreversible Action
                   </p>
                   <p className="text-xs text-red-700 mt-1">
                     Web applications cannot move files to the System Trash. These files will be <strong>permanently removed from your disk</strong> immediately.
                   </p>
                </div>
            ) : (
                <p className="text-sm text-gray-500 mt-2">
                    These items will be removed from the view but remain on your computer (Read-Only Mode).
                </p>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {isDiskOperation ? 'Delete Permanently' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;