import { useMemo, useState } from 'react';
import type { Subscription } from '../types';
import { daysUntil, formatCurrency, CATEGORY_ICONS } from '../utils/calculations';

interface CalendarViewProps {
  subscriptions: Subscription[];
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function CalendarView({ subscriptions }: CalendarViewProps) {
  const today  = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sel, setSel]     = useState<number | null>(null);

  const map = useMemo(() => {
    const m: Record<number, Subscription[]> = {};
    subscriptions
      .filter((s) => s.status === 'active' || s.status === 'trial')
      .forEach((s) => {
        const d = new Date(s.nextRenewalDate + 'T00:00:00');
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!m[day]) m[day] = [];
          m[day].push(s);
        }
      });
    return m;
  }, [subscriptions, year, month]);

  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstDayOfWk  = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDayOfWk).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); setSel(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); setSel(null); };

  const selSubs = sel ? (map[sel] ?? []) : [];

  return (
    <div style={{ animation: 'fadeUp 240ms both' }}>
      <div style={{ padding: '20px 20px 8px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--label)' }}>Calendar</h1>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 16px' }}>
        <button className="btn-icon" onClick={prevMonth} aria-label="Previous month" style={{ background: 'var(--bg-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--label)' }}>
          {MONTHS[month]} {year}
        </span>
        <button className="btn-icon" onClick={nextMonth} aria-label="Next month" style={{ background: 'var(--bg-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Grid */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: 4 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--label-3)', padding: '4px 0', letterSpacing: '0.04em' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const hasSubs = !!map[day];
            const isSel   = sel === day;
            const isPast  = daysUntil(`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`) < 0;

            return (
              <button
                key={day}
                onClick={() => setSel(isSel ? null : day)}
                style={{
                  aspectRatio: '1',
                  border: 'none',
                  borderRadius: 10,
                  cursor: hasSubs ? 'pointer' : 'default',
                  background: isSel ? '#0a84ff' : isToday ? 'var(--bg-4)' : hasSubs ? 'var(--bg-3)' : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  padding: '4px 2px',
                  opacity: isPast && !hasSubs ? 0.3 : 1,
                  transition: 'background 100ms, transform 100ms',
                  fontFamily: 'var(--font)',
                }}
                aria-label={`${MONTHS[month]} ${day}${hasSubs ? `, ${map[day].length} renewal(s)` : ''}`}
              >
                <span style={{
                  fontSize: 14,
                  fontWeight: isToday ? 700 : hasSubs ? 600 : 400,
                  color: isSel ? '#fff' : isToday ? 'var(--apple-blue)' : 'var(--label)',
                  lineHeight: 1,
                }}>
                  {day}
                </span>
                {hasSubs && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {map[day].slice(0,3).map((s) => {
                      const d = daysUntil(s.nextRenewalDate);
                      const c = d < 0 ? '#ff375f' : d <= 3 ? '#ff375f' : d <= 7 ? '#ff9f0a' : '#30d158';
                      return <div key={s.id} style={{ width: 5, height: 5, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : c }} />;
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      {sel && selSubs.length > 0 && (
        <div style={{ margin: '12px 16px 0', animation: 'fadeUp 180ms both' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 2 }}>
            {MONTHS[month]} {sel} — {selSubs.length} renewal{selSubs.length > 1 ? 's' : ''}
          </div>
          <div className="grouped-list">
            {selSubs.map((sub) => (
              <div key={sub.id} className="list-row">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {sub.logo || CATEGORY_ICONS[sub.category]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate list-row-label">{sub.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--label-3)', textTransform: 'capitalize' }}>{sub.billingCycle}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--label)', flexShrink: 0, letterSpacing: '-0.2px' }}>
                  {formatCurrency(sub.amount, sub.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(map).length === 0 && (
        <div className="empty-state" style={{ paddingTop: 40 }}>
          <div className="empty-icon">📅</div>
          <div className="empty-title">No renewals this month</div>
          <div className="empty-sub">Check other months or add subscriptions</div>
        </div>
      )}
    </div>
  );
}
