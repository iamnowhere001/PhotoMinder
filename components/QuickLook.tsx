import React, { useState, useEffect, useRef } from 'react';
import { Photo } from '../types';

interface QuickLookProps {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const QuickLook: React.FC<QuickLookProps> = ({ 
  photo, 
  onClose, 
  onNext, 
  onPrev, 
  hasNext, 
  hasPrev 
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when photo changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [photo.id]);

  // Auto-hide controls interaction
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
        // Only hide if not zoomed in (user might need tools)
        if (scale === 1) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
      window.addEventListener('mousemove', resetControlsTimeout);
      resetControlsTimeout();
      return () => {
          window.removeEventListener('mousemove', resetControlsTimeout);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
  }, [scale]);

  // Handle Zoom
  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.max(0.1, Math.min(5, prev + delta));
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Handle Rotate
  const handleRotate = (deg: number) => {
    setRotation(prev => prev + deg);
  };

  // Handle Pan (Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault(); 
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-xl flex flex-col animate-fadeIn overflow-hidden select-none"
      onClick={onClose}
    >
      {/* 1. Top Bar: Floating Info Pill */}
      <div 
        className={`absolute top-6 left-0 right-0 flex justify-center z-30 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
         <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full shadow-2xl flex items-center gap-4 text-sm font-medium text-white/90">
             <span className="truncate max-w-[300px]">{photo.name}</span>
             <div className="w-px h-3 bg-white/20"></div>
             <span className="text-white/60 font-mono text-xs">{Math.round(scale * 100)}%</span>
         </div>
      </div>

      {/* 2. Top Right: Close Button */}
      <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={`absolute top-6 right-6 z-30 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 backdrop-blur-md border border-white/5 hover:scale-105 active:scale-95 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* 3. Main Stage */}
      <div 
        className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Navigation Arrows (Large Click Areas) */}
        {hasPrev && (
          <div 
             className="absolute left-0 inset-y-0 w-24 z-20 flex items-center justify-start pl-4 group cursor-pointer hover:bg-gradient-to-r hover:from-black/20 hover:to-transparent transition-all"
             onClick={(e) => { e.stopPropagation(); onPrev(); }}
          >
             <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
             </button>
          </div>
        )}
        
        {hasNext && (
          <div 
             className="absolute right-0 inset-y-0 w-24 z-20 flex items-center justify-end pr-4 group cursor-pointer hover:bg-gradient-to-l hover:from-black/20 hover:to-transparent transition-all"
             onClick={(e) => { e.stopPropagation(); onNext(); }}
          >
             <button className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
             </button>
          </div>
        )}

        {/* The Image */}
        <div 
          className={`relative transition-transform will-change-transform ${isDragging ? 'duration-0 ease-linear' : 'duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]'}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
        >
          <img 
            src={photo.url} 
            alt={photo.name}
            draggable={false}
            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-sm ring-1 ring-white/5" 
          />
        </div>
      </div>

      {/* 4. Bottom Toolbar: Floating Dock */}
      <div 
        className={`absolute bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-none transition-all duration-500 transform ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-2 py-2 flex items-center gap-1 shadow-2xl pointer-events-auto">
           
           {/* Zoom Group */}
           <div className="flex items-center">
             <button onClick={() => handleZoom(-0.25)} className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Zoom Out">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
             </button>
             <button onClick={() => handleZoom(0.25)} className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Zoom In">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
             </button>
           </div>

           <div className="w-px h-5 bg-white/20 mx-1"></div>

           {/* Rotate Group */}
           <div className="flex items-center">
             <button onClick={() => handleRotate(-90)} className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Rotate Left">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
             </button>
             <button onClick={() => handleRotate(90)} className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Rotate Right">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
             </button>
           </div>

           <div className="w-px h-5 bg-white/20 mx-1"></div>
            
           {/* Reset */}
           <button 
             onClick={() => { setScale(1); setRotation(0); setPosition({x:0, y:0}); }} 
             className="px-4 h-10 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
           >
             Reset
           </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLook;