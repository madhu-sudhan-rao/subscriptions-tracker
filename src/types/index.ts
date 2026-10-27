// ── Subscription core types ──────────────────────────────────────────────────

export type BillingCycle =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannually'
  | 'yearly'
  | 'custom';

export type SubscriptionStatus = 'active' | 'trial' | 'paused' | 'canceled';

export type SubscriptionCategory =
  | 'streaming'
  | 'music'
  | 'productivity'
  | 'cloud'
  | 'gaming'
  | 'fitness'
  | 'education'
  | 'utilities'
  | 'news'
  | 'ai'
  | 'other';

export type PaymentMethod = 'card' | 'upi' | 'bank' | 'wallet' | 'cash' | 'other';

export type ReminderTiming = 'none' | '1day' | '3days' | '7days' | 'custom';

export type SortField =
  | 'nextRenewal'
  | 'name'
  | 'amount'
  | 'monthlyEquivalent'
  | 'createdAt';

export type FilterStatus =
  | 'all'
  | 'active'
  | 'trial'
  | 'paused'
  | 'canceled'
  | 'overdue'
  | 'dueSoon';

export interface CustomBillingInterval {
  value: number;
  unit: 'days' | 'months' | 'years';
}

export interface PaymentRecord {
  id: string;
  paidAt: string; // ISO date string
  amount: number;
  note?: string;
}

export interface Subscription {
  id: string;
  name: string;
  logo?: string; // emoji, initials, or data URL
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  customInterval?: CustomBillingInterval;
  firstPaymentDate: string; // ISO date string (YYYY-MM-DD)
  nextRenewalDate: string;  // ISO date string (YYYY-MM-DD)
  autoRenew: boolean;
  status: SubscriptionStatus;
  category: SubscriptionCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  reminderTiming: ReminderTiming;
  customReminderDays?: number;
  trialEndDate?: string; // ISO date string
  paymentHistory: PaymentRecord[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// ── App settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultCurrency: string;
  notificationsEnabled: boolean;
  sortField: SortField;
  sortAscending: boolean;
  filterStatus: FilterStatus;
  filterCategory: SubscriptionCategory | 'all';
}

// ── DB schema ────────────────────────────────────────────────────────────────

export const DB_NAME = 'BubbleSubsDB';
export const DB_VERSION = 1;
export const STORE_SUBSCRIPTIONS = 'subscriptions';
export const STORE_SETTINGS = 'settings';

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  totalActive: number;
  monthlySpend: number;
  yearlySpend: number;
  dueSoon7Days: number;
  amountDue7Days: number;
  highestCost: Subscription | null;
  categoryBreakdown: Record<SubscriptionCategory, number>;
}

// ── UI state ──────────────────────────────────────────────────────────────────

export type ActiveScreen = 'bubbles' | 'dashboard' | 'calendar' | 'insights' | 'settings';

export type ModalType =
  | 'add'
  | 'edit'
  | 'detail'
  | 'delete-confirm'
  | 'clear-confirm'
  | 'import-preview'
  | null;

export interface UndoState {
  subscription: Subscription;
  expiresAt: number;
}

// ── Export/Import ─────────────────────────────────────────────────────────────

export interface ExportData {
  version: number;
  exportedAt: string;
  subscriptions: Subscription[];
  settings?: Partial<AppSettings>;
}
