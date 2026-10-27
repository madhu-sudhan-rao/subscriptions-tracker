import { useMemo, useState } from 'react';
import type { Subscription, FilterStatus } from '../types';
import {
  filterSubscriptions,
  sortSubscriptions,
  monthlyEquivalent,
  formatCurrency,
} from '../utils/calculations';
import BubbleCard from './BubbleCard';

interface BubbleViewProps {
  subscriptions: Subscription[];
  onSelect: (sub: Subscription) => void;
  defaultCurrency: string;
}

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'active',  label: 'Active' },
  { id: 'trial',   label: 'Trial' },
  { id: 'dueSoon', label: 'Due Soon' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paused',  label: 'Paused' },
];

export default function BubbleView({ subscriptions, onSelect, defaultCurrency }: BubbleViewProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [query, setQuery]   = useState('');

  const filtered = useMemo(() => {
    const f = filterSubscriptions(subscriptions, filter, 'all', query);
    return sortSubscriptions(f, 'nextRenewal', true);
  }, [subscriptions, filter, query]);

  const monthly = useMemo(() =>
    subscriptions
      .filter((s) => s.status === 'active' || s.status === 'trial')
      .reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billingCycle, s.customInterval), 0),
    [subscriptions]
  );

  return (
    <div className="bv-root">
      {/* Header */}
      <header className="bv-header">
        <div>
          <h1 className="bv-wordmark">Bubble Subs</h1>
          <p className="bv-tagline">
            {subscriptions.length} subs · <span style={{ color: '#30d158' }}>{formatCurrency(monthly, defaultCurrency)}</span>/mo
          </p>
        </div>
      </header>

      {/* Search bar */}
      <div className="bv-search-row">
        <div className="bv-searchbar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: 'var(--label-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            id="search-subscriptions"
            type="search"
            className="bv-search-input"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button className="bv-search-clear" onClick={() => setQuery('')} aria-label="Clear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" fill="var(--bg-5)"/><path d="M15 9l-6 6M9 9l6 6" stroke="#fff"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="bv-chips" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            id={`filter-${f.id}`}
            role="tab"
            aria-selected={filter === f.id}
            className={`bv-chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🫧</div>
          <div className="empty-title">
            {subscriptions.length === 0 ? 'No subscriptions' : 'No results'}
          </div>
          <div className="empty-sub">
            {subscriptions.length === 0
              ? 'Tap + to add your first subscription'
              : 'Try a different filter or search'}
          </div>
        </div>
      ) : (
        <div className="bv-grid" aria-label="Subscriptions">
          {filtered.map((sub, i) => (
            <div
              key={sub.id}
              style={{ animation: `fadeUp ${200 + i * 30}ms both` }}
            >
              <BubbleCard subscription={sub} onClick={() => onSelect(sub)} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .bv-root {
          display: flex;
          flex-direction: column;
          min-height: calc(100svh - var(--nav-h));
        }

        .bv-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 16px 20px 8px;
          padding-top: calc(16px + var(--safe-top));
        }

        .bv-wordmark {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--label);
          line-height: 1;
        }

        .bv-tagline {
          font-size: 14px;
          color: var(--label-3);
          margin-top: 2px;
          letter-spacing: -0.1px;
        }

        .bv-search-row {
          padding: 8px 20px;
        }

        .bv-searchbar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-3);
          border-radius: var(--r-lg);
          padding: 9px 12px;
        }

        .bv-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: var(--label);
          min-width: 0;
        }
        .bv-search-input::placeholder { color: var(--label-3); }
        .bv-search-input::-webkit-search-cancel-button { display: none; }

        .bv-search-clear {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .bv-chips {
          display: flex;
          gap: 6px;
          padding: 6px 20px 12px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .bv-chips::-webkit-scrollbar { display: none; }

        .bv-chip {
          flex-shrink: 0;
          padding: 5px 14px;
          border-radius: var(--r-full);
          font-size: 14px;
          font-weight: 600;
          color: var(--label-2);
          background: var(--bg-3);
          border: none;
          cursor: pointer;
          transition: all var(--t1);
          letter-spacing: -0.1px;
          font-family: var(--font);
        }
        .bv-chip.active {
          background: var(--label);
          color: var(--bg);
        }

        .bv-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px 4px;
          padding: 4px 12px 24px;
          justify-items: center;
        }

        @media (min-width: 400px) {
          .bv-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 600px) {
          .bv-grid {
            grid-template-columns: repeat(5, 1fr);
            gap: 12px 8px;
            padding: 8px 20px 32px;
          }
        }
      `}</style>
    </div>
  );
}
