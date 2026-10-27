import type {
  BillingCycle,
  CustomBillingInterval,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
} from '../types';

// ── Date utilities ────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string as a local date (no timezone shift).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date to YYYY-MM-DD local string.
 */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Today as YYYY-MM-DD.
 */
export function todayStr(): string {
  return toLocalDateString(new Date());
}

/**
 * Days between two date strings (positive = b is in the future).
 */
export function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Days until a future date (negative = overdue).
 */
export function daysUntil(dateStr: string): number {
  return daysBetween(todayStr(), dateStr);
}

/**
 * Add one billing cycle to a date, handling month-end correctly.
 */
export function addOneCycle(
  dateStr: string,
  cycle: BillingCycle,
  custom?: CustomBillingInterval
): string {
  const date = parseLocalDate(dateStr);

  if (cycle === 'custom' && custom) {
    const { value, unit } = custom;
    if (unit === 'days') {
      date.setDate(date.getDate() + value);
    } else if (unit === 'months') {
      date.setMonth(date.getMonth() + value);
    } else {
      date.setFullYear(date.getFullYear() + value);
    }
    return toLocalDateString(date);
  }

  const cycleMap: Record<Exclude<BillingCycle, 'custom'>, () => void> = {
    daily: () => date.setDate(date.getDate() + 1),
    weekly: () => date.setDate(date.getDate() + 7),
    biweekly: () => date.setDate(date.getDate() + 14),
    monthly: () => addMonthsPreservingDay(date, 1),
    bimonthly: () => addMonthsPreservingDay(date, 2),
    quarterly: () => addMonthsPreservingDay(date, 3),
    semiannually: () => addMonthsPreservingDay(date, 6),
    yearly: () => addMonthsPreservingDay(date, 12),
  };

  cycleMap[cycle as Exclude<BillingCycle, 'custom'>]?.();
  return toLocalDateString(date);
}

/**
 * Add months to a date while preserving the original day-of-month.
 * If the target month doesn't have that day, clamp to month-end.
 */
function addMonthsPreservingDay(date: Date, months: number): void {
  const originalDay = date.getDate();
  date.setDate(1); // Move to 1st to avoid over-shooting
  date.setMonth(date.getMonth() + months);
  // Clamp to last day of resulting month
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
}

/**
 * Compute the next renewal date from first payment date and billing cycle.
 * Advances from firstPaymentDate until >= today.
 */
export function computeNextRenewal(
  firstPaymentDate: string,
  cycle: BillingCycle,
  custom?: CustomBillingInterval
): string {
  const today = todayStr();
  let current = firstPaymentDate;

  // If firstPaymentDate is in the future, it IS the next renewal
  if (current >= today) return current;

  // Advance until >= today
  let safety = 0;
  while (current < today && safety < 10000) {
    current = addOneCycle(current, cycle, custom);
    safety++;
  }
  return current;
}

// ── Cost utilities ────────────────────────────────────────────────────────────

const MONTHLY_FACTORS: Record<Exclude<BillingCycle, 'custom'>, number> = {
  daily: 30.44,
  weekly: 4.345,
  biweekly: 2.173,
  monthly: 1,
  bimonthly: 0.5,
  quarterly: 1 / 3,
  semiannually: 1 / 6,
  yearly: 1 / 12,
};

/**
 * Monthly-equivalent cost. For custom intervals converts to a monthly factor.
 */
export function monthlyEquivalent(
  amount: number,
  cycle: BillingCycle,
  custom?: CustomBillingInterval
): number {
  if (cycle === 'custom' && custom) {
    const { value, unit } = custom;
    let daysPerCycle: number;
    if (unit === 'days') daysPerCycle = value;
    else if (unit === 'months') daysPerCycle = value * 30.44;
    else daysPerCycle = value * 365.25;
    return (amount * 30.44) / daysPerCycle;
  }
  return amount * (MONTHLY_FACTORS[cycle as Exclude<BillingCycle, 'custom'>] ?? 1);
}

/**
 * Yearly-equivalent cost.
 */
export function yearlyEquivalent(
  amount: number,
  cycle: BillingCycle,
  custom?: CustomBillingInterval
): number {
  return monthlyEquivalent(amount, cycle, custom) * 12;
}

// ── Currency utilities ────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// ── Renewal status helpers ────────────────────────────────────────────────────

export type RenewalStatus = 'overdue' | 'critical' | 'soon' | 'ok' | 'inactive';

export function getRenewalStatus(sub: Subscription): RenewalStatus {
  if (sub.status === 'paused' || sub.status === 'canceled') return 'inactive';
  const days = daysUntil(sub.nextRenewalDate);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'critical';
  if (days <= 7) return 'soon';
  return 'ok';
}

export function getBubbleColor(status: RenewalStatus): string {
  switch (status) {
    case 'overdue': return 'bubble-red';
    case 'critical': return 'bubble-red';
    case 'soon': return 'bubble-amber';
    case 'ok': return 'bubble-green';
    case 'inactive': return 'bubble-gray';
  }
}

// ── ID generator ──────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Label helpers ─────────────────────────────────────────────────────────────

export const CYCLE_LABELS: Record<BillingCycle, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  bimonthly: 'Every 2 Months',
  quarterly: 'Quarterly',
  semiannually: 'Every 6 Months',
  yearly: 'Yearly',
  custom: 'Custom',
};

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: 'Streaming',
  music: 'Music',
  productivity: 'Productivity',
  cloud: 'Cloud Storage',
  gaming: 'Gaming',
  fitness: 'Fitness',
  education: 'Education',
  utilities: 'Utilities',
  news: 'News',
  ai: 'AI Tools',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<SubscriptionCategory, string> = {
  streaming: '🎬',
  music: '🎵',
  productivity: '⚡',
  cloud: '☁️',
  gaming: '🎮',
  fitness: '💪',
  education: '📚',
  utilities: '🔧',
  news: '📰',
  ai: '🤖',
  other: '📦',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  trial: 'Trial',
  paused: 'Paused',
  canceled: 'Canceled',
};

// ── Subscription defaults ─────────────────────────────────────────────────────

export function createDefaultSubscription(): Omit<Subscription, 'id'> {
  const now = new Date().toISOString();
  return {
    name: '',
    logo: '',
    amount: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    firstPaymentDate: todayStr(),
    nextRenewalDate: todayStr(),
    autoRenew: true,
    status: 'active',
    category: 'other',
    paymentMethod: 'card',
    notes: '',
    reminderTiming: '3days',
    paymentHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ── Relative time display ─────────────────────────────────────────────────────

export function renewalLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

// ── Initials from name ────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Sort & filter ─────────────────────────────────────────────────────────────

export function filterSubscriptions(
  subs: Subscription[],
  filterStatus: string,
  filterCategory: string,
  searchQuery: string
): Subscription[] {
  let result = [...subs];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(q));
  }

  if (filterCategory !== 'all') {
    result = result.filter((s) => s.category === filterCategory);
  }

  switch (filterStatus) {
    case 'active':
      result = result.filter((s) => s.status === 'active');
      break;
    case 'trial':
      result = result.filter((s) => s.status === 'trial');
      break;
    case 'paused':
      result = result.filter((s) => s.status === 'paused');
      break;
    case 'canceled':
      result = result.filter((s) => s.status === 'canceled');
      break;
    case 'overdue':
      result = result.filter(
        (s) => s.status !== 'paused' && s.status !== 'canceled' && daysUntil(s.nextRenewalDate) < 0
      );
      break;
    case 'dueSoon':
      result = result.filter((s) => {
        if (s.status === 'paused' || s.status === 'canceled') return false;
        const d = daysUntil(s.nextRenewalDate);
        return d >= 0 && d <= 7;
      });
      break;
    default:
      break;
  }

  return result;
}

export function sortSubscriptions(
  subs: Subscription[],
  field: string,
  ascending: boolean
): Subscription[] {
  const sorted = [...subs].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case 'nextRenewal':
        cmp = a.nextRenewalDate.localeCompare(b.nextRenewalDate);
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'amount':
        cmp = a.amount - b.amount;
        break;
      case 'monthlyEquivalent':
        cmp =
          monthlyEquivalent(a.amount, a.billingCycle, a.customInterval) -
          monthlyEquivalent(b.amount, b.billingCycle, b.customInterval);
        break;
      case 'createdAt':
        cmp = a.createdAt.localeCompare(b.createdAt);
        break;
    }
    return ascending ? cmp : -cmp;
  });
  return sorted;
}
