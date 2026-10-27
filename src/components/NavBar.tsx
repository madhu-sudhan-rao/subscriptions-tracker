import type { ActiveScreen } from '../types';

interface NavBarProps {
  active: ActiveScreen;
  onChange: (s: ActiveScreen) => void;
  onAdd: () => void;
}

type NavItem = { id: ActiveScreen; label: string; icon: JSX.Element; filledIcon: JSX.Element };

const S = 24;

const ITEMS: NavItem[] = [
  {
    id: 'bubbles',
    label: 'Subs',
    icon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="8" cy="16" r="4"/><circle cx="16" cy="16" r="4"/>
      </svg>
    ),
    filledIcon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="8" cy="16" r="4"/><circle cx="16" cy="16" r="4"/>
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Stats',
    icon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
      </svg>
    ),
    filledIcon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>
        <rect x="7" y="14" width="3" height="3" rx="0.5"/>
      </svg>
    ),
    filledIcon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="3" fillOpacity="0.15"/><path d="M3 10h18v10a3 3 0 01-3 3H6a3 3 0 01-3-3V10z" fill="currentColor" fillOpacity="0.15"/>
        <rect x="3" y="4" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <rect x="7" y="14" width="3" height="3" rx="0.5"/>
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2a10 10 0 1010 10H12V2z"/><path d="M12 2v10l7 7"/>
      </svg>
    ),
    filledIcon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 1010 10H12V2z" fillOpacity="0.8"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
    filledIcon: (
      <svg width={S} height={S} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" fillOpacity="0.7"/>
      </svg>
    ),
  },
];

export default function NavBar({ active, onChange, onAdd }: NavBarProps) {
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <div className="nav-inner">
        {left.map((item) => <NavBtn key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />)}

        {/* Central + button */}
        <button
          id="add-subscription-btn"
          className="nav-fab"
          onClick={onAdd}
          aria-label="Add subscription"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>

        {right.map((item) => <NavBtn key={item.id} item={item} active={active === item.id} onClick={() => onChange(item.id)} />)}
      </div>

      <style>{`
        .nav-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 500;
          padding-bottom: var(--safe-bottom);
        }

        .nav-inner {
          display: flex;
          align-items: center;
          height: var(--nav-h);
          max-width: 540px;
          margin: 0 auto;
          padding: 0 12px;
          background: rgba(10,10,10,0.88);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        [data-theme='light'] .nav-inner {
          background: rgba(242,242,247,0.88);
          border-top: 1px solid rgba(0,0,0,0.08);
        }

        .nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 6px 4px;
          border-radius: 12px;
          color: var(--label-3);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: color var(--t1), transform var(--t1);
          border: none;
          background: none;
          font-family: var(--font);
          min-width: 52px;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-btn:active { transform: scale(0.9); }
        .nav-btn.active { color: var(--apple-blue); }

        .nav-fab {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--apple-blue);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(10,132,255,0.5);
          transition: transform var(--t1), box-shadow var(--t1);
          margin: 0 6px;
          position: relative;
          bottom: 4px;
        }
        .nav-fab:hover  { transform: scale(1.06); box-shadow: 0 6px 28px rgba(10,132,255,0.6); }
        .nav-fab:active { transform: scale(0.93); }
      `}</style>
    </nav>
  );
}

function NavBtn({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      id={`nav-${item.id}`}
      className={`nav-btn${active ? ' active' : ''}`}
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
    >
      {active ? item.filledIcon : item.icon}
      <span>{item.label}</span>
    </button>
  );
}
