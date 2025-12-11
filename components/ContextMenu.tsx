import React, { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  actions: ContextMenuItem[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, actions }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Close on window resize
    const handleResize = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true); // Capture scroll events

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [onClose]);

  // Adjust position if menu goes offscreen
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };
  
  // Basic boundary check (can be improved)
  if (window.innerWidth - x < 200) {
      style.left = x - 200;
  }
  if (window.innerHeight - y < 300) {
      style.top = y - 300;
  }

  return (
    <div 
      ref={menuRef}
      className="fixed z-[9999] w-56 bg-white/90 backdrop-blur-xl border border-black/5 rounded-lg shadow-xl py-1.5 animate-fadeIn select-none ring-1 ring-black/5"
      style={style}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {actions.map((action, index) => (
        <React.Fragment key={index}>
          {action.separator ? (
            <div className="h-px bg-gray-200 my-1.5 mx-3" />
          ) : (
            <button
              onClick={() => {
                if (!action.disabled && action.onClick) {
                  action.onClick();
                  onClose();
                }
              }}
              disabled={action.disabled}
              className={`w-full text-left px-3 py-1.5 mx-1 max-w-[calc(100%-8px)] rounded-md flex items-center gap-2.5 text-sm transition-colors
                ${action.disabled 
                    ? 'opacity-50 cursor-default' 
                    : action.danger 
                        ? 'text-red-600 hover:bg-red-50 hover:text-red-700' 
                        : 'text-gray-700 hover:bg-blue-500 hover:text-white'
                }
              `}
            >
              {action.icon && <span className={`w-4 h-4 ${!action.disabled && !action.danger ? 'group-hover:text-white' : ''}`}>{action.icon}</span>}
              <span className="flex-1">{action.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ContextMenu;