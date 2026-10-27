import type { AppSettings, Subscription } from '../types';
import { exportToJSON, exportToCSV } from '../utils/exportImport';

interface SettingsViewProps {
  settings: AppSettings;
  subscriptions: Subscription[];
  onUpdate: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void;
  onImport: () => void;
  onClearAll: () => void;
}

const CURRENCIES = ['INR','USD','EUR','GBP','JPY','AUD','CAD','SGD','AED','CHF'];

export default function SettingsView({ settings, subscriptions, onUpdate, onImport, onClearAll }: SettingsViewProps) {
  return (
    <div style={{ animation: 'fadeUp 240ms both' }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: 'var(--label)' }}>Settings</h1>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Appearance */}
        <Section label="APPEARANCE">
          <Row label="Theme">
            <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 10, padding: 3, gap: 2 }}>
              {(['dark','light'] as const).map((t) => (
                <button
                  key={t}
                  id={`theme-${t}-btn`}
                  onClick={() => onUpdate('theme', t)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: settings.theme === t ? 'var(--bg-1)' : 'transparent',
                    color: settings.theme === t ? 'var(--label)' : 'var(--label-3)',
                    transition: 'all 120ms',
                    fontFamily: 'var(--font)',
                    boxShadow: settings.theme === t ? 'var(--sh-sm)' : 'none',
                  }}
                >
                  {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        {/* Preferences */}
        <Section label="PREFERENCES">
          <Row label="Default Currency">
            <select
              id="default-currency-select"
              className="field-select"
              style={{ width: 'auto', minWidth: 72, background: 'var(--bg-3)', border: 'none', borderRadius: 10, padding: '7px 28px 7px 10px', fontSize: 15, color: 'var(--label)' }}
              value={settings.defaultCurrency}
              onChange={(e) => onUpdate('defaultCurrency', e.target.value)}
            >
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Row>
          <Row label="Notifications" sub="Renewal reminders">
            <label className="toggle">
              <input id="notifications-toggle" type="checkbox" checked={settings.notificationsEnabled}
                onChange={(e) => onUpdate('notificationsEnabled', e.target.checked)} />
              <span className="toggle-track" />
            </label>
          </Row>
        </Section>

        {/* Data */}
        <Section label="DATA">
          <Row label="Export JSON" sub={`${subscriptions.length} subscriptions`}>
            <button id="export-json-btn" className="btn btn-gray btn-sm" style={{ borderRadius: 10 }}
              onClick={() => exportToJSON(subscriptions)} disabled={!subscriptions.length}>
              Export
            </button>
          </Row>
          <Row label="Export CSV">
            <button id="export-csv-btn" className="btn btn-gray btn-sm" style={{ borderRadius: 10 }}
              onClick={() => exportToCSV(subscriptions)} disabled={!subscriptions.length}>
              Export
            </button>
          </Row>
          <Row label="Import JSON" sub="Restore from backup">
            <button id="import-btn" className="btn btn-tinted btn-sm" style={{ borderRadius: 10 }} onClick={onImport}>
              Import
            </button>
          </Row>
        </Section>

        {/* Danger */}
        <Section label="DANGER ZONE">
          <Row label="Clear All Data" sub="Permanently deletes everything">
            <button id="clear-all-btn" className="btn btn-danger btn-sm" style={{ borderRadius: 10 }}
              onClick={onClearAll} disabled={!subscriptions.length}>
              Clear All
            </button>
          </Row>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🫧</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--label)', letterSpacing: '-0.2px' }}>Bubble Subs</div>
          <div style={{ fontSize: 13, color: 'var(--label-3)', marginTop: 3 }}>v1.0 · Local-first · No account needed</div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--label-3)', letterSpacing: '0.07em', marginBottom: 8, paddingLeft: 2 }}>
        {label}
      </div>
      <div className="grouped-list">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="list-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="list-row-label">{label}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--label-3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}
