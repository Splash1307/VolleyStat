import { useEffect, type ReactNode } from 'react';
import { go } from '../router';

export const Header = ({
  title,
  back,
  right,
}: {
  title: ReactNode;
  back?: string;
  right?: ReactNode;
}) => (
  <header className="topbar">
    {back !== undefined ? (
      <button className="icon-btn" aria-label="Retour" onClick={() => go(back)}>
        ‹
      </button>
    ) : (
      <span className="topbar-logo">🏐</span>
    )}
    <h1>{title}</h1>
    <div className="topbar-right">{right}</div>
  </header>
);

export const Modal = ({
  title,
  onClose,
  children,
  footer,
  top,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** affiché en haut de l'écran (formulaires : reste visible au-dessus du clavier) */
  top?: boolean;
}) => {
  useEffect(() => {
    // bloque le défilement de la page derrière la fenêtre
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className={`modal-backdrop ${top ? 'top' : ''}`} onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Fermer" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) => (
  <div className="segmented" role="tablist">
    {options.map((o) => (
      <button
        key={o.value}
        role="tab"
        aria-selected={value === o.value}
        className={value === o.value ? 'active' : ''}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);
