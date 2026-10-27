import type { ExportData, Subscription } from '../types';
import { generateId, todayStr } from './calculations';

// ── Export ────────────────────────────────────────────────────────────────────

export function exportToJSON(subscriptions: Subscription[]): void {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    subscriptions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `bubble-subs-${todayStr()}.json`);
}

export function exportToCSV(subscriptions: Subscription[]): void {
  const headers = [
    'Name',
    'Amount',
    'Currency',
    'Billing Cycle',
    'Next Renewal',
    'Status',
    'Category',
    'Payment Method',
    'Auto Renew',
    'Notes',
    'Created At',
  ];

  const rows = subscriptions.map((s) => [
    csvEscape(s.name),
    s.amount,
    s.currency,
    s.billingCycle,
    s.nextRenewalDate,
    s.status,
    s.category,
    s.paymentMethod,
    s.autoRenew,
    csvEscape(s.notes ?? ''),
    s.createdAt,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `bubble-subs-${todayStr()}.csv`);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Import ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  valid: boolean;
  subscriptions: Subscription[];
  errors: string[];
}

export function validateImportJSON(raw: string): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, subscriptions: [], errors: ['Invalid JSON file.'] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, subscriptions: [], errors: ['JSON must be an object.'] };
  }

  const data = parsed as Record<string, unknown>;

  if (!Array.isArray(data.subscriptions)) {
    return { valid: false, subscriptions: [], errors: ['Missing subscriptions array.'] };
  }

  const subscriptions: Subscription[] = [];
  (data.subscriptions as unknown[]).forEach((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item ${idx}: not an object.`);
      return;
    }
    const s = item as Record<string, unknown>;
    if (!s.name || typeof s.name !== 'string') {
      errors.push(`Item ${idx}: missing or invalid name.`);
      return;
    }
    if (typeof s.amount !== 'number') {
      errors.push(`Item ${idx}: missing or invalid amount.`);
      return;
    }
    // Assign safe defaults for optional fields
    const sub: Subscription = {
      id: typeof s.id === 'string' ? s.id : generateId(),
      name: s.name,
      logo: typeof s.logo === 'string' ? s.logo : '',
      amount: s.amount,
      currency: typeof s.currency === 'string' ? s.currency : 'INR',
      billingCycle: (typeof s.billingCycle === 'string' ? s.billingCycle : 'monthly') as Subscription['billingCycle'],
      customInterval: s.customInterval as Subscription['customInterval'],
      firstPaymentDate: typeof s.firstPaymentDate === 'string' ? s.firstPaymentDate : todayStr(),
      nextRenewalDate: typeof s.nextRenewalDate === 'string' ? s.nextRenewalDate : todayStr(),
      autoRenew: typeof s.autoRenew === 'boolean' ? s.autoRenew : true,
      status: (typeof s.status === 'string' ? s.status : 'active') as Subscription['status'],
      category: (typeof s.category === 'string' ? s.category : 'other') as Subscription['category'],
      paymentMethod: (typeof s.paymentMethod === 'string' ? s.paymentMethod : 'card') as Subscription['paymentMethod'],
      notes: typeof s.notes === 'string' ? s.notes : '',
      reminderTiming: (typeof s.reminderTiming === 'string' ? s.reminderTiming : '3days') as Subscription['reminderTiming'],
      customReminderDays: typeof s.customReminderDays === 'number' ? s.customReminderDays : undefined,
      trialEndDate: typeof s.trialEndDate === 'string' ? s.trialEndDate : undefined,
      paymentHistory: Array.isArray(s.paymentHistory) ? (s.paymentHistory as Subscription['paymentHistory']) : [],
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
      updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
    };
    subscriptions.push(sub);
  });

  return {
    valid: errors.length === 0,
    subscriptions,
    errors,
  };
}
