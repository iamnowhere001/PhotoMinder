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
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when photo changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [photo.id]);

  // Handle Zoom
  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.max(0.1, Math.min(5, prev + delta));
      // Reset position if zoomed out to 1 or less
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
      e.preventDefault(); // Prevent text selection
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

  // Keyboard navigation is handled by parent (App.tsx) generally, 
  // but we add a local listener for immediate feedback prevention on bubbling if needed
  
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col animate-fadeIn overflow-hidden"
      onClick={onClose} // Clicking background closes
    >
      {/* Header / Top Bar */}
      <div className="flex justify-between items-center p-4 z-20 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-sm font-medium border border-white/10 shadow-lg pointer-events-auto">
          {photo.name}
          <span className="mx-2 opacity-50">|</span>
          <span className="opacity-70">{Math.round(scale * 100)}%</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors pointer-events-auto backdrop-blur-md"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Navigation Arrows */}
        {hasPrev && (
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 z-20 w-12 h-12 bg-black/20 hover:bg-black/50 text-white/70 hover:text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}
        
        {hasNext && (
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 z-20 w-12 h-12 bg-black/20 hover:bg-black/50 text-white/70 hover:text-white rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        )}

        {/* Image */}
        <div 
          className="relative transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent close on image click
          onMouseDown={handleMouseDown}
        >
          <img 
            src={photo.url} 
            alt={photo.name}
            draggable={false}
            className="max-w-[85vw] max-h-[80vh] object-contain select-none shadow-2xl" 
          />
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div 
        className="p-6 flex justify-center z-20 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-4 shadow-2xl pointer-events-auto">
           {/* Zoom Controls */}
           <div className="flex items-center gap-1">
             <button onClick={() => handleZoom(-0.25)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
             </button>
             <button onClick={() => handleZoom(0.25)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
             </button>
           </div>

           <div className="w-px h-6 bg-white/20"></div>

           {/* Rotate Controls */}
           <div className="flex items-center gap-1">
             <button onClick={() => handleRotate(-90)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Rotate Left">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
             </button>
             <button onClick={() => handleRotate(90)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Rotate Right">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
             </button>
           </div>

           <div className="w-px h-6 bg-white/20"></div>
            
           {/* Reset */}
           <button onClick={() => { setScale(1); setRotation(0); setPosition({x:0, y:0}); }} className="px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
             Reset
           </button>
        </div>
      </div>
    </div>
  );
};

export default QuickLook;