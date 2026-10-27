import type { Subscription } from '../types';
import {
  getRenewalStatus,
  formatCurrency,
  monthlyEquivalent,
  yearlyEquivalent,
  daysUntil,
  CYCLE_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  STATUS_LABELS,
} from '../utils/calculations';
import Modal from './Modal';

interface SubscriptionDetailProps {
  subscription: Subscription | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
}

const SIZE = 100;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function getRingColor(daysLeft: number, inactive: boolean): string {
  if (inactive) return '#636366';
  if (daysLeft < 0)  return '#ff375f';
  if (daysLeft <= 3) return '#ff375f';
  if (daysLeft <= 7) return '#ff9f0a';
  return '#30d158';
}

export default function SubscriptionDetail({
  subscription: sub, open, onClose, onEdit, onDelete, onMarkPaid,
}: SubscriptionDetailProps) {
  if (!sub) return null;

  const isInactive = sub.status === 'paused' || sub.status === 'canceled';
  const days = daysUntil(sub.nextRenewalDate);
  const progress = isInactive ? 0.12 : Math.min(Math.max(days / 30, 0), 1);
  const dashLen = progress * CIRC;
  const color = getRingColor(days, isInactive);
  const monthly = monthlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval);
  const yearly  = yearlyEquivalent(sub.amount, sub.billingCycle, sub.customInterval);
  const isOverdue = !isInactive && days < 0;
  const isCritical = !isInactive && days >= 0 && days <= 3;
  const isActive = sub.status === 'active' || sub.status === 'trial';

  return (
    <Modal open={open} onClose={onClose} noPadding maxWidth={440}>
      {/* Hero section */}
      <div className="sdd-hero">
        {/* Ring */}
        <div className="sdd-ring-wrap" style={{ filter: isInactive ? 'none' : `drop-shadow(0 0 14px ${color}55)` }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={color} strokeWidth={STROKE} strokeOpacity={0.15} />
            <circle
              cx={SIZE/2} cy={SIZE/2} r={R}
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dashLen} ${CIRC - dashLen}`}
              style={{ animation: isOverdue || isCritical ? 'ring-pulse 1.8s ease-in-out infinite' : 'none' }}
            />
          </svg>
          <div className="sdd-ring-face">
            <span style={{ fontSize: 32, lineHeight: 1 }}>
              {sub.logo && sub.logo.length <= 2 ? sub.logo : CATEGORY_ICONS[sub.category]}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--label)', marginBottom: 4 }}>
            {sub.name}
          </h2>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', color, lineHeight: 1, marginBottom: 4 }}>
            {formatCurrency(sub.amount, sub.currency)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--label-3)' }}>
            {CYCLE_LABELS[sub.billingCycle]}
          </div>
        </div>

        {/* Renewal pill */}
        {isActive && (
          <div className="sdd-renewal-pill" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
            <span style={{ color, fontWeight: 700, fontSize: 14 }}>
              {isOverdue
                ? `⚠️ ${Math.abs(days)}d overdue`
                : days === 0 ? '⚡ Renews today'
                : `${days}d until renewal`}
            </span>
            <span style={{ color: 'var(--label-3)', fontSize: 13, marginLeft: 8 }}>
              {new Date(sub.nextRenewalDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Cost grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Monthly', v: formatCurrency(monthly, sub.currency), hi: false },
            { l: 'Yearly',  v: formatCurrency(yearly, sub.currency),  hi: true  },
            { l: 'Daily',   v: formatCurrency(monthly / 30.44, sub.currency), hi: false },
          ].map(({ l, v, hi }) => (
            <div key={l} style={{
              background: hi ? `${color}14` : 'var(--bg-3)',
              border: hi ? `1px solid ${color}30` : 'none',
              borderRadius: 14,
              padding: '12px 10px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: hi ? color : 'var(--label)', letterSpacing: '-0.3px' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Info list */}
        <div className="grouped-list">
          <Row label="Status"   value={STATUS_LABELS[sub.status]} />
          <Row label="Category" value={`${CATEGORY_ICONS[sub.category]} ${CATEGORY_LABELS[sub.category]}`} />
          <Row label="Payment"  value={sub.paymentMethod.toUpperCase()} />
          <Row label="Auto-renew" value={sub.autoRenew ? 'On' : 'Off'} />
          <Row label="Reminder" value={sub.reminderTiming === 'none' ? 'None' : sub.reminderTiming === 'custom' ? `${sub.customReminderDays}d before` : sub.reminderTiming.replace('days','d').replace('day','d') + ' before'} />
          <Row label="First payment" value={new Date(sub.firstPaymentDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
        </div>

        {sub.notes && (
          <div style={{ background: 'var(--bg-3)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notes</div>
            <p style={{ fontSize: 15, color: 'var(--label-2)', lineHeight: 1.5 }}>{sub.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
          {isActive && (
            <button id="mark-paid-btn" className="btn btn-gray" style={{ flex: 1, borderRadius: 14 }} onClick={onMarkPaid}>
              ✓ Mark Paid
            </button>
          )}
          <button id="edit-subscription-btn" className="btn btn-gray" style={{ flex: 1, borderRadius: 14 }} onClick={onEdit}>
            Edit
          </button>
          <button
            id="delete-subscription-btn"
            className="btn btn-danger"
            style={{ width: 48, height: 48, borderRadius: 14, padding: 0, flexShrink: 0 }}
            onClick={onDelete}
            aria-label="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <style>{`
        .sdd-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid var(--sep);
        }
        .sdd-ring-wrap {
          position: relative;
          width: ${SIZE}px;
          height: ${SIZE}px;
          flex-shrink: 0;
        }
        .sdd-ring-wrap svg { position: absolute; inset: 0; }
        .sdd-ring-face {
          position: absolute;
          inset: ${STROKE + 4}px;
          border-radius: 50%;
          background: var(--bg-3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sdd-renewal-pill {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          padding: 8px 14px;
          border-radius: var(--r-full);
        }
      `}</style>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="list-row">
      <span className="list-row-label">{label}</span>
      <span className="list-row-detail" style={{ marginLeft: 'auto', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
