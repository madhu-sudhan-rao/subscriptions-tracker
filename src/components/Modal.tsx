import { type ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: number;
  noPadding?: boolean;
}

export default function Modal({ open, onClose, title, children, maxWidth = 520, noPadding = false }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal-sheet" style={{ maxWidth }}>
        <div className="modal-drag-handle" />
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
        <div className={noPadding ? '' : 'modal-body'}>
          {children}
        </div>
      </div>

      <style>{`
        .modal-close-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-4);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--label-2);
          flex-shrink: 0;
          transition: background var(--t1);
        }
        .modal-close-btn:hover { background: var(--bg-5); }
      `}</style>
    </div>
  );
}
