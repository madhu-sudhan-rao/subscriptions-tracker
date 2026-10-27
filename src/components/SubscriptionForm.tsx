import { useState, useEffect } from 'react';
import type { Subscription, BillingCycle, SubscriptionCategory, PaymentMethod, ReminderTiming, SubscriptionStatus } from '../types';
import {
  computeNextRenewal,
  createDefaultSubscription,
  generateId,
  todayStr,
  CYCLE_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '../utils/calculations';
import Modal from './Modal';

interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (sub: Subscription) => void;
  initial?: Subscription | null;
}

const CURRENCIES   = ['INR','USD','EUR','GBP','JPY','AUD','CAD','SGD','AED','CHF'];
const STATUSES: { id: SubscriptionStatus; label: string }[] = [
  { id: 'active',   label: 'Active' },
  { id: 'trial',    label: 'Trial' },
  { id: 'paused',   label: 'Paused' },
  { id: 'canceled', label: 'Canceled' },
];
const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: 'card', label: 'Card' }, { id: 'upi', label: 'UPI' },
  { id: 'bank', label: 'Bank' }, { id: 'wallet', label: 'Wallet' },
  { id: 'cash', label: 'Cash' }, { id: 'other', label: 'Other' },
];
const REMINDERS: { id: ReminderTiming; label: string }[] = [
  { id: 'none', label: 'None' }, { id: '1day', label: '1 day before' },
  { id: '3days', label: '3 days before' }, { id: '7days', label: '7 days before' },
  { id: 'custom', label: 'Custom' },
];
const QUICK_EMOJIS = ['📺','🎵','🎮','📚','💪','🤖','☁️','📰','⚡','🔧','🎬','🎧','🛡️','🌐','🧠','✍️','💊','🚀','🎯','🏋️'];

export default function SubscriptionForm({ open, onClose, onSave, initial }: SubscriptionFormProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState(createDefaultSubscription());
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const { id: _id, paymentHistory: _ph, createdAt: _ca, updatedAt: _ua, ...rest } = initial;
      setForm(rest as ReturnType<typeof createDefaultSubscription>);
    } else {
      setForm(createDefaultSubscription());
    }
    setEmojiOpen(false);
  }, [open, initial]);

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (['firstPaymentDate','billingCycle','customInterval'].includes(key as string)) {
        next.nextRenewalDate = computeNextRenewal(next.firstPaymentDate, next.billingCycle, next.customInterval);
      }
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    const sub: Subscription = isEdit
      ? { ...initial!, ...form, updatedAt: now }
      : { ...form, id: generateId(), paymentHistory: [], createdAt: now, updatedAt: now };
    onSave(sub);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Subscription' : 'Add Subscription'} maxWidth={540}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Icon + Name */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <div className="field-label" style={{ marginBottom: 7 }}>Icon</div>
              <button
                type="button"
                id="emoji-picker-btn"
                onClick={() => setEmojiOpen((v) => !v)}
                style={{
                  width: 52, height: 46, fontSize: '1.5rem',
                  background: 'var(--bg-3)', border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Pick icon"
              >
                {form.logo || '📦'}
              </button>
              {emojiOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  background: 'var(--bg-2)', borderRadius: 16, padding: 10,
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 4, boxShadow: 'var(--sh-lg)', zIndex: 20,
                  border: '1px solid var(--sep)',
                }} onClick={() => setEmojiOpen(false)}>
                  {QUICK_EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => set('logo', e)}
                      style={{ fontSize: '1.2rem', padding: 7, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 100ms' }}
                      onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--bg-3)')}
                      onMouseLeave={(ev) => (ev.currentTarget.style.background = 'none')}
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="field-group" style={{ flex: 1 }}>
              <label className="field-label" htmlFor="sub-name">Name *</label>
              <input id="sub-name" type="text" className="field-input" placeholder="Netflix, Spotify…"
                value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus={!isEdit} />
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="sub-amount">Amount</label>
              <input id="sub-amount" type="number" className="field-input" placeholder="0" min="0" step="any"
                value={form.amount || ''} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="sub-currency">Currency</label>
              <select id="sub-currency" className="field-select" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Billing cycle */}
          <div className="field-group">
            <label className="field-label" htmlFor="sub-cycle">Billing Cycle</label>
            <select id="sub-cycle" className="field-select" value={form.billingCycle}
              onChange={(e) => set('billingCycle', e.target.value as BillingCycle)}>
              {(Object.entries(CYCLE_LABELS) as [BillingCycle, string][]).map(([id, l]) => (
                <option key={id} value={id}>{l}</option>
              ))}
            </select>
          </div>

          {form.billingCycle === 'custom' && (
            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="sub-cval">Every</label>
                <input id="sub-cval" type="number" className="field-input" min="1"
                  value={form.customInterval?.value ?? 1}
                  onChange={(e) => set('customInterval', { ...form.customInterval!, value: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="sub-cunit">Unit</label>
                <select id="sub-cunit" className="field-select" value={form.customInterval?.unit ?? 'months'}
                  onChange={(e) => set('customInterval', { ...form.customInterval!, unit: e.target.value as 'days'|'months'|'years' })}>
                  <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
                </select>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="sub-first">First Payment</label>
              <input id="sub-first" type="date" className="field-input" value={form.firstPaymentDate}
                max={todayStr()} onChange={(e) => set('firstPaymentDate', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="sub-next">Next Renewal</label>
              <input id="sub-next" type="date" className="field-input" value={form.nextRenewalDate}
                onChange={(e) => set('nextRenewalDate', e.target.value)} />
            </div>
          </div>

          {/* Status + Category */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="sub-status">Status</label>
              <select id="sub-status" className="field-select" value={form.status}
                onChange={(e) => set('status', e.target.value as SubscriptionStatus)}>
                {STATUSES.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="sub-cat">Category</label>
              <select id="sub-cat" className="field-select" value={form.category}
                onChange={(e) => set('category', e.target.value as SubscriptionCategory)}>
                {(Object.entries(CATEGORY_LABELS) as [SubscriptionCategory, string][]).map(([id, l]) => (
                  <option key={id} value={id}>{CATEGORY_ICONS[id]} {l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment + Auto Renew */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="sub-pay">Payment</label>
              <select id="sub-pay" className="field-select" value={form.paymentMethod}
                onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)}>
                {PAYMENTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
            <div className="field-group">
              <div className="field-label" style={{ marginBottom: 7 }}>Auto Renew</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <label className="toggle">
                  <input id="sub-autorenew" type="checkbox" checked={form.autoRenew}
                    onChange={(e) => set('autoRenew', e.target.checked)} />
                  <span className="toggle-track" />
                </label>
                <span style={{ fontSize: 15, color: 'var(--label-3)' }}>{form.autoRenew ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div className={form.reminderTiming === 'custom' ? 'field-row' : 'field-group'}>
            <div className="field-group">
              <label className="field-label" htmlFor="sub-remind">Reminder</label>
              <select id="sub-remind" className="field-select" value={form.reminderTiming}
                onChange={(e) => set('reminderTiming', e.target.value as ReminderTiming)}>
                {REMINDERS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
              </select>
            </div>
            {form.reminderTiming === 'custom' && (
              <div className="field-group">
                <label className="field-label" htmlFor="sub-rdays">Days Before</label>
                <input id="sub-rdays" type="number" className="field-input" min="1"
                  value={form.customReminderDays ?? 5}
                  onChange={(e) => set('customReminderDays', parseInt(e.target.value) || 1)} />
              </div>
            )}
          </div>

          {form.status === 'trial' && (
            <div className="field-group">
              <label className="field-label" htmlFor="sub-trial">Trial End Date</label>
              <input id="sub-trial" type="date" className="field-input" value={form.trialEndDate ?? ''}
                onChange={(e) => set('trialEndDate', e.target.value || undefined)} />
            </div>
          )}

          {/* Notes */}
          <div className="field-group">
            <label className="field-label" htmlFor="sub-notes">Notes</label>
            <textarea id="sub-notes" className="field-textarea" placeholder="Plan name, account info…"
              value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} />
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-gray" style={{ flex: 1, borderRadius: 14 }} onClick={onClose}>Cancel</button>
            <button type="submit" id="save-subscription-btn" className="btn btn-fill" style={{ flex: 2, borderRadius: 14 }}>
              {isEdit ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
