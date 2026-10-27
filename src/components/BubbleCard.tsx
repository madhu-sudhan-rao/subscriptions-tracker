import type { Subscription } from '../types';
import {
  getRenewalStatus,
  daysUntil,
  getInitials,
  formatCurrency,
  monthlyEquivalent,
  CATEGORY_ICONS,
} from '../utils/calculations';

interface BubbleCardProps {
  subscription: Subscription;
  onClick: () => void;
}

// Apple Watch ring: 30 days = full ring, 0 = empty, overdue = full red
function getRingProgress(sub: Subscription): number {
  if (sub.status === 'paused' || sub.status === 'canceled') return 0.15;
  const days = daysUntil(sub.nextRenewalDate);
  if (days < 0) return 1; // overdue = full (alarming)
  return Math.min(days / 30, 1); // 30 days = 100%
}

function getRingColor(sub: Subscription): string {
  if (sub.status === 'paused' || sub.status === 'canceled') return '#636366';
  const days = daysUntil(sub.nextRenewalDate);
  if (days < 0)  return '#ff375f'; // overdue → Apple red
  if (days <= 3) return '#ff375f'; // critical → red
  if (days <= 7) return '#ff9f0a'; // soon     → orange
  return '#30d158';                // ok       → Apple green
}

function getRingGlow(sub: Subscription): string {
  if (sub.status === 'paused' || sub.status === 'canceled') return 'none';
  const days = daysUntil(sub.nextRenewalDate);
  if (days < 0 || days <= 3) return '0 0 16px rgba(255,55,95,0.5)';
  if (days <= 7) return '0 0 16px rgba(255,159,10,0.45)';
  return '0 0 16px rgba(48,209,88,0.4)';
}

function getDaysLabel(sub: Subscription): string {
  if (sub.status === 'paused') return 'Paused';
  if (sub.status === 'canceled') return 'Canceled';
  const days = daysUntil(sub.nextRenewalDate);
  if (days < 0)  return `${Math.abs(days)}d late`;
  if (days === 0) return 'Today';
  if (days === 1) return '1d left';
  if (days < 30) return `${days}d left`;
  return `${Math.round(days / 30)}mo`;
}

export default function BubbleCard({ subscription: sub, onClick }: BubbleCardProps) {
  // Ring geometry
  const SIZE = 88;             // outer diameter
  const STROKE = 7;            // ring stroke width
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const progress = getRingProgress(sub);
  const dashLen = progress * CIRC;
  const color = getRingColor(sub);
  const glow = getRingGlow(sub);
  const daysLabel = getDaysLabel(sub);
  const isOverdue = sub.status !== 'paused' && sub.status !== 'canceled' && daysUntil(sub.nextRenewalDate) < 0;
  const isCritical = sub.status !== 'paused' && sub.status !== 'canceled' && daysUntil(sub.nextRenewalDate) <= 3 && daysUntil(sub.nextRenewalDate) >= 0;
  const isInactive = sub.status === 'paused' || sub.status === 'canceled';

  const monthly = monthlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval);
  const display = sub.logo && sub.logo.length <= 2 ? sub.logo : CATEGORY_ICONS[sub.category];

  return (
    <button
      className="bubble-wrap"
      onClick={onClick}
      aria-label={`${sub.name} — ${daysLabel}`}
      style={{ opacity: isInactive ? 0.45 : 1 }}
    >
      {/* Watch ring SVG */}
      <div className="ring-container" style={{ filter: glow === 'none' ? 'none' : 'drop-shadow(' + glow + ')' }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeOpacity={0.15}
          />
          {/* Progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
            strokeDashoffset={0}
            style={{
              animation: isOverdue || isCritical ? 'ring-pulse 1.8s ease-in-out infinite' : 'none',
              transition: 'stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </svg>

        {/* Inner face */}
        <div className="ring-face">
          <span className="ring-logo">{display}</span>
        </div>
      </div>

      {/* Labels below ring */}
      <div className="bubble-name truncate">{sub.name}</div>
      <div className="bubble-meta" style={{ color }}>
        {daysLabel}
      </div>
      <div className="bubble-cost">{formatCurrency(monthly, sub.currency)}<span style={{ opacity: 0.5 }}>/mo</span></div>

      <style>{`
        .bubble-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 20px;
          transition: transform 120ms, opacity 120ms;
          max-width: 96px;
          -webkit-tap-highlight-color: transparent;
        }
        .bubble-wrap:active { transform: scale(0.93); opacity: 0.85; }
        .bubble-wrap:hover  { transform: scale(1.04); }

        .ring-container {
          position: relative;
          width: ${SIZE}px;
          height: ${SIZE}px;
          flex-shrink: 0;
        }

        .ring-container svg {
          position: absolute;
          inset: 0;
        }

        .ring-face {
          position: absolute;
          inset: ${STROKE + 3}px;
          border-radius: 50%;
          background: var(--bg-3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ring-logo {
          font-size: 22px;
          line-height: 1;
          user-select: none;
        }

        .bubble-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--label);
          letter-spacing: -0.1px;
          max-width: 90px;
          text-align: center;
          line-height: 1.2;
        }

        .bubble-meta {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-align: center;
          line-height: 1;
        }

        .bubble-cost {
          font-size: 10px;
          color: var(--label-3);
          text-align: center;
          letter-spacing: -0.05px;
          line-height: 1;
        }
      `}</style>
    </button>
  );
}
