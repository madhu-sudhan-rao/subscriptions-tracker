import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveScreen, AppSettings, Subscription } from './types';
import {
  getAllSubscriptions,
  saveSubscription,
  deleteSubscription,
  clearAllSubscriptions,
  getAllSettings,
  setSetting,
} from './utils/db';
import { generateId, computeNextRenewal } from './utils/calculations';
import { validateImportJSON } from './utils/exportImport';

import NavBar from './components/NavBar';
import BubbleView from './components/BubbleView';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import SubscriptionForm from './components/SubscriptionForm';
import SubscriptionDetail from './components/SubscriptionDetail';
import Modal from './components/Modal';
import Toast, { useToast } from './components/Toast';

import './index.css';
import './App.css';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultCurrency: 'INR',
  notificationsEnabled: true,
  sortField: 'nextRenewal',
  sortAscending: true,
  filterStatus: 'all',
  filterCategory: 'all',
};

export default function App() {
  const [screen, setScreen]             = useState<ActiveScreen>('bubbles');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [settings, setSettings]         = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]           = useState(true);

  // Modal states
  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState<Subscription | null>(null);
  const [detailSub, setDetailSub]       = useState<Subscription | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Subscription | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<Subscription[] | null>(null);

  const { toasts, addToast, removeToast } = useToast();
  const importInputRef = useRef<HTMLInputElement>(null);

  // ── Load data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getAllSubscriptions(), getAllSettings()]).then(([subs, savedSettings]) => {
      setSubscriptions(subs);
      setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      const theme = savedSettings.theme ?? DEFAULT_SETTINGS.theme;
      document.documentElement.setAttribute('data-theme', theme);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Settings helpers ──────────────────────────────────────────────────────
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSetting(key, value).catch(() => {});
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value as string);
    }
  }, []);

  // ── Subscription CRUD ─────────────────────────────────────────────────────
  const handleSave = useCallback(async (sub: Subscription) => {
    await saveSubscription(sub);
    setSubscriptions((prev) => {
      const exists = prev.find((s) => s.id === sub.id);
      return exists ? prev.map((s) => (s.id === sub.id ? sub : s)) : [...prev, sub];
    });
    setFormOpen(false);
    setEditTarget(null);
    setDetailOpen(false);
    addToast(editTarget ? `${sub.name} updated` : `${sub.name} added!`, 'success');
  }, [editTarget, addToast]);

  const handleDelete = useCallback(async (sub: Subscription) => {
    await deleteSubscription(sub.id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== sub.id));
    setDeleteConfirm(null);
    setDetailOpen(false);
    setDetailSub(null);
    addToast(`${sub.name} deleted`, 'info');
  }, [addToast]);

  const handleMarkPaid = useCallback(async () => {
    if (!detailSub) return;
    const paymentRecord = {
      id: generateId(),
      paidAt: new Date().toISOString(),
      amount: detailSub.amount,
    };
    const nextRenewal = computeNextRenewal(
      detailSub.nextRenewalDate,
      detailSub.billingCycle,
      detailSub.customInterval
    );
    const updated: Subscription = {
      ...detailSub,
      nextRenewalDate: nextRenewal,
      paymentHistory: [...detailSub.paymentHistory, paymentRecord],
      updatedAt: new Date().toISOString(),
    };
    await saveSubscription(updated);
    setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setDetailSub(updated);
    addToast(`${detailSub.name} marked as paid. Next renewal: ${nextRenewal}`, 'success');
  }, [detailSub, addToast]);

  const handleClearAll = useCallback(async () => {
    await clearAllSubscriptions();
    setSubscriptions([]);
    setClearConfirm(false);
    addToast('All subscriptions cleared', 'info');
  }, [addToast]);

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = validateImportJSON(e.target?.result as string);
      if (!result.valid) {
        addToast(`Import failed: ${result.errors[0]}`, 'error');
        return;
      }
      setImportPreview(result.subscriptions);
    };
    reader.readAsText(file);
  }, [addToast]);

  const confirmImport = useCallback(async () => {
    if (!importPreview) return;
    let saved = 0;
    for (const sub of importPreview) {
      await saveSubscription(sub);
      saved++;
    }
    setSubscriptions((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      importPreview.forEach((s) => map.set(s.id, s));
      return Array.from(map.values());
    });
    setImportPreview(null);
    addToast(`Imported ${saved} subscription${saved !== 1 ? 's' : ''}`, 'success');
  }, [importPreview, addToast]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Loading Bubble Subs…</p>
      </div>
    );
  }

  return (
    <>
      {/* Main content */}
      <main className="app-main">
        {screen === 'bubbles' && (
          <BubbleView
            subscriptions={subscriptions}
            defaultCurrency={settings.defaultCurrency}
            onSelect={(sub) => { setDetailSub(sub); setDetailOpen(true); }}
          />
        )}
        {screen === 'dashboard' && (
          <Dashboard subscriptions={subscriptions} defaultCurrency={settings.defaultCurrency} />
        )}
        {screen === 'calendar' && (
          <CalendarView subscriptions={subscriptions} />
        )}
        {screen === 'insights' && (
          <InsightsView subscriptions={subscriptions} defaultCurrency={settings.defaultCurrency} />
        )}
        {screen === 'settings' && (
          <SettingsView
            settings={settings}
            subscriptions={subscriptions}
            onUpdate={updateSetting}
            onImport={() => importInputRef.current?.click()}
            onClearAll={() => setClearConfirm(true)}
          />
        )}
      </main>

      {/* Bottom nav */}
      <NavBar
        active={screen}
        onChange={setScreen}
        onAdd={() => { setEditTarget(null); setFormOpen(true); }}
      />

      {/* Add / Edit form */}
      <SubscriptionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      {/* Detail view */}
      <SubscriptionDetail
        subscription={detailSub}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailSub(null); }}
        onEdit={() => { setEditTarget(detailSub); setDetailOpen(false); setFormOpen(true); }}
        onDelete={() => { setDeleteConfirm(detailSub); setDetailOpen(false); }}
        onMarkPaid={handleMarkPaid}
      />

      {/* Delete confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Subscription" maxWidth={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-h)' }}>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button
              id="confirm-delete-btn"
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear all confirm */}
      <Modal open={clearConfirm} onClose={() => setClearConfirm(false)} title="Clear All Data" maxWidth={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
            This will permanently delete all <strong style={{ color: 'var(--red)' }}>{subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}</strong>. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setClearConfirm(false)}>Cancel</button>
            <button id="confirm-clear-btn" className="btn btn-danger" style={{ flex: 1 }} onClick={handleClearAll}>Clear All</button>
          </div>
        </div>
      </Modal>

      {/* Import preview */}
      <Modal
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        title={`Import ${importPreview?.length ?? 0} Subscriptions`}
        maxWidth={480}
      >
        {importPreview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              The following subscriptions will be imported. Existing subscriptions with the same ID will be overwritten.
            </p>
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {importPreview.map((sub) => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>{sub.logo} {sub.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{sub.currency} {sub.amount}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setImportPreview(null)}>Cancel</button>
              <button id="confirm-import-btn" className="btn btn-primary" style={{ flex: 2 }} onClick={confirmImport}>
                Import All
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImportFile(file);
          e.target.value = '';
        }}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </>
  );
}
