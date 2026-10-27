import { useMemo } from 'react';
import type { Subscription, SubscriptionCategory } from '../types';
import {
  monthlyEquivalent,
  yearlyEquivalent,
  formatCurrency,
  daysUntil,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
} from '../utils/calculations';

interface DashboardProps {
  subscriptions: Subscription[];
  defaultCurrency: string;
}

export default function Dashboard({ subscriptions, defaultCurrency }: DashboardProps) {
  const active = useMemo(() => subscriptions.filter((s) => s.status === 'active' || s.status === 'trial'), [subscriptions]);

  const monthlySpend = useMemo(() =>
    active.reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billingCycle, s.customInterval), 0),
    [active]
  );
  const yearlySpend = useMemo(() =>
    active.reduce((sum, s) => sum + yearlyEquivalent(s.amount, s.billingCycle, s.customInterval), 0),
    [active]
  );

  const dueSoon = useMemo(() =>
    active.filter((s) => { const d = daysUntil(s.nextRenewalDate); return d >= 0 && d <= 7; }),
    [active]
  );
  const overdue = useMemo(() =>
    active.filter((s) => daysUntil(s.nextRenewalDate) < 0),
    [active]
  );

  const upcoming = useMemo(() =>
    [...active].sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate)).slice(0, 6),
    [active]
  );

  const categoryMap = useMemo(() => {
    const m: Record<string, number> = {};
    active.forEach((s) => {
      m[s.category] = (m[s.category] || 0) + monthlyEquivalent(s.amount, s.billingCycle, s.customInterval);
    });
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [active]);

  if (subscriptions.length === 0) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <div className="empty-icon">📊</div>
        <div className="empty-title">No data yet</div>
        <div className="empty-sub">Add subscriptions to see your spending overview</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeUp 240ms both' }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--label)' }}>Overview</h1>
      </div>

      {/* Hero spend card */}
      <div style={{ padding: '0 20px 16px' }}>
        <div className="db-hero-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Monthly Spend
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-2px', color: '#fff', lineHeight: 1, margin: '4px 0 2px' }}>
            {formatCurrency(monthlySpend, defaultCurrency)}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
            {formatCurrency(yearlySpend, defaultCurrency)} / year · {active.length} active
          </div>

          {/* Mini status row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <MiniStat label="Due Soon" value={dueSoon.length} color="#ff9f0a" />
            <MiniStat label="Overdue"  value={overdue.length}  color="#ff375f" />
            <MiniStat label="Daily"    value={formatCurrency(monthlySpend / 30.44, defaultCurrency)} color="#30d158" />
          </div>
        </div>
      </div>

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <div className="section-hd">
            <span className="section-hd-title">Upcoming</span>
          </div>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="grouped-list">
              {upcoming.map((sub, i) => {
                const days = daysUntil(sub.nextRenewalDate);
                const isOver = days < 0;
                const isSoon = days >= 0 && days <= 3;
                return (
                  <div key={sub.id} className="list-row" style={{ animation: `fadeUp ${100 + i * 40}ms both` }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--bg-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20, flexShrink: 0,
                    }}>
                      {sub.logo || CATEGORY_ICONS[sub.category]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 16, fontWeight: 600, color: 'var(--label)', letterSpacing: '-0.1px' }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--label-3)', marginTop: 1 }}>
                        {new Date(sub.nextRenewalDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.2px' }}>
                        {formatCurrency(sub.amount, sub.currency)}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: isOver ? '#ff375f' : isSoon ? '#ff9f0a' : 'var(--label-3)', marginTop: 1 }}>
                        {isOver ? `${Math.abs(days)}d late` : days === 0 ? 'Today' : `${days}d`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* By category */}
      {categoryMap.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <div className="section-hd">
            <span className="section-hd-title">By Category</span>
          </div>
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryMap.map(([cat, amount]) => {
              const pct = monthlySpend > 0 ? (amount / monthlySpend) * 100 : 0;
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {CATEGORY_ICONS[cat as SubscriptionCategory]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--label)', letterSpacing: '-0.1px' }}>
                        {CATEGORY_LABELS[cat as SubscriptionCategory]}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.1px' }}>
                        {formatCurrency(amount, defaultCurrency)}<span style={{ color: 'var(--label-3)', fontWeight: 400 }}>/mo</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: '#0a84ff',
                        borderRadius: 2,
                        transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)',
                        minWidth: 4,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <style>{`
        .db-hero-card {
          background: linear-gradient(145deg, #1c1c2e, #0d0d1a);
          border-radius: 24px;
          padding: 22px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        [data-theme='light'] .db-hero-card {
          background: linear-gradient(145deg, #1a1a2e, #0f0f23);
        }
      `}</style>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}
