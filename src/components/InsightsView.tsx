import { useMemo } from 'react';
import type { Subscription, SubscriptionCategory } from '../types';
import { monthlyEquivalent, yearlyEquivalent, formatCurrency, daysUntil, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils/calculations';

interface InsightsViewProps {
  subscriptions: Subscription[];
  defaultCurrency: string;
}

const RING_COLORS = ['#30d158','#0a84ff','#bf5af2','#ff9f0a','#ff375f','#32ade6','#ffd60a','#5e5ce6'];

export default function InsightsView({ subscriptions, defaultCurrency }: InsightsViewProps) {
  const active = useMemo(() => subscriptions.filter((s) => s.status === 'active' || s.status === 'trial'), [subscriptions]);
  const total  = useMemo(() => active.reduce((s, sub) => s + monthlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval), 0), [active]);

  const cats = useMemo(() => {
    const m: Record<string, { amount: number; count: number }> = {};
    active.forEach((s) => {
      const c = s.category;
      const v = monthlyEquivalent(s.amount, s.billingCycle, s.customInterval);
      if (!m[c]) m[c] = { amount: 0, count: 0 };
      m[c].amount += v;
      m[c].count  += 1;
    });
    return Object.entries(m)
      .sort(([,a],[,b]) => b.amount - a.amount)
      .map(([cat, d]) => ({ cat: cat as SubscriptionCategory, ...d, pct: total > 0 ? (d.amount/total)*100 : 0 }));
  }, [active, total]);

  const next30 = useMemo(() =>
    active.filter((s) => { const d = daysUntil(s.nextRenewalDate); return d >= 0 && d <= 30; })
          .reduce((s, sub) => s + sub.amount, 0),
    [active]
  );
  const topSubs = useMemo(() =>
    [...active].sort((a,b) => monthlyEquivalent(b.amount,b.billingCycle,b.customInterval) - monthlyEquivalent(a.amount,a.billingCycle,a.customInterval)).slice(0,5),
    [active]
  );

  if (!active.length) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <div className="empty-icon">💡</div>
        <div className="empty-title">No data yet</div>
        <div className="empty-sub">Add subscriptions to see spending insights</div>
      </div>
    );
  }

  // Donut geometry
  const DSIZE  = 200;
  const DR     = 72;
  const DSTROKE = 20;
  const DCIRC  = 2 * Math.PI * DR;
  let arcOffset = 0;

  return (
    <div style={{ animation: 'fadeUp 240ms both' }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--label)' }}>Insights</h1>
      </div>

      {/* Donut chart */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 20px 20px', position: 'relative' }}>
        <div style={{ position: 'relative', width: DSIZE, height: DSIZE }}>
          <svg width={DSIZE} height={DSIZE} viewBox={`0 0 ${DSIZE} ${DSIZE}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={DSIZE/2} cy={DSIZE/2} r={DR} fill="none" stroke="var(--bg-3)" strokeWidth={DSTROKE} />
            {cats.map(({ pct }, i) => {
              const dashLen = (pct / 100) * DCIRC;
              const arc = { dashLen, offset: arcOffset };
              arcOffset += dashLen + 1.5;
              return (
                <circle
                  key={i}
                  cx={DSIZE/2} cy={DSIZE/2} r={DR}
                  fill="none"
                  stroke={RING_COLORS[i % RING_COLORS.length]}
                  strokeWidth={DSTROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${arc.dashLen} ${DCIRC - arc.dashLen}`}
                  strokeDashoffset={-arc.offset}
                  opacity={0.9}
                />
              );
            })}
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Monthly</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-1px', color: 'var(--label)', lineHeight: 1.05 }}>
              {formatCurrency(total, defaultCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: 'Daily',      value: formatCurrency(total/30.44, defaultCurrency), color: '#30d158' },
          { label: 'Next 30d',   value: formatCurrency(next30, defaultCurrency),      color: '#ff9f0a' },
          { label: 'Per year',   value: formatCurrency(total*12, defaultCurrency),    color: '#0a84ff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-1)', borderRadius: 16, padding: '14px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <section style={{ marginBottom: 20 }}>
        <div className="section-hd"><span className="section-hd-title">By Category</span></div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {cats.map(({ cat, amount, count, pct }, i) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: RING_COLORS[i % RING_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_ICONS[cat]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--label)', letterSpacing: '-0.1px' }}>
                    {CATEGORY_LABELS[cat]} <span style={{ color: 'var(--label-3)', fontWeight: 400 }}>({count})</span>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.2px' }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: RING_COLORS[i % RING_COLORS.length], borderRadius: 2, transition: 'width 600ms cubic-bezier(0.4,0,0.2,1)', minWidth: 4 }} />
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--label-3)', minWidth: 56, textAlign: 'right', flexShrink: 0, letterSpacing: '-0.1px' }}>
                {formatCurrency(amount, defaultCurrency)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Top subs */}
      <section style={{ marginBottom: 32 }}>
        <div className="section-hd"><span className="section-hd-title">Top Subscriptions</span></div>
        <div style={{ padding: '0 20px' }}>
          <div className="grouped-list">
            {topSubs.map((sub, i) => {
              const m = monthlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval);
              const y = yearlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval);
              return (
                <div key={sub.id} className="list-row">
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: RING_COLORS[i % RING_COLORS.length] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: RING_COLORS[i % RING_COLORS.length], flexShrink: 0 }}>
                    {i+1}
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {sub.logo || CATEGORY_ICONS[sub.category]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 15, fontWeight: 600, color: 'var(--label)', letterSpacing: '-0.1px' }}>{sub.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>{formatCurrency(y, sub.currency)}/yr</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.3px' }}>{formatCurrency(m, sub.currency)}</div>
                    <div style={{ fontSize: 11, color: 'var(--label-3)', marginTop: 1 }}>per month</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
