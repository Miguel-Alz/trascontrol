import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-slate-900 border border-slate-700/50 rounded-xl
          shadow-2xl animate-slideIn max-h-[90vh] overflow-hidden flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Subcomponentes para el modal
Modal.Body = function ModalBody({ children, className = '' }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3 ${className}`}>
      {children}
    </div>
  );
};
