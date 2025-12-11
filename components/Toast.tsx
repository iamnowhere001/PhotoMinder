import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure render before transition
    const enterTimer = setTimeout(() => setIsVisible(true), 10);
    
    const leaveTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for transition
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
    };
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-gray-900 text-white shadow-xl ring-1 ring-white/10',
    info: 'bg-white text-gray-900 shadow-xl ring-1 ring-black/5',
    error: 'bg-red-50 text-red-900 shadow-xl ring-1 ring-red-100'
  };

  return (
    <div 
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-300 ease-out flex justify-center pointer-events-none ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className={`${bgColors[type]} px-4 py-2.5 rounded-full flex items-center gap-3 min-w-[320px] justify-center backdrop-blur-md`}>
        {type === 'success' && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </span>
        )}
        {type === 'info' && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </span>
        )}
        {type === 'error' && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </span>
        )}
        <span className="font-medium text-sm tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default Toast;