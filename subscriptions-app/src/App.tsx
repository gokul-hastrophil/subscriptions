import { useMemo, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import './App.css';
import SubscriptionCard from './components/SubscriptionCard';
import SubscriptionModal from './components/SubscriptionModal';
import GmailImportModal from './components/GmailImportModal';
import StatCard from './components/StatCard';
import AIInsightsPanel from './components/AIInsightsPanel';
import LoginPage from './components/LoginPage';
import { CATEGORY_COLORS } from './data';
import type { Category, GoogleUser, SortDirection, SortField, Subscription } from './types';
import type { ParsedSubscription } from './services/gmail';
import { fetchBillingEmails, fetchUserProfile, parsedToSubscription, prepareEmailsForAI } from './services/gmail';
import { analyzeEmailsForSubscriptions, getEffectiveKey } from './services/gemini';
import {
  daysUntilRenewal,
  formatCurrency,
  toMonthly,
  toYearly,
  totalMonthlyCost,
  upcomingRenewals,
} from './utils';

const STORAGE_KEY = 'subscriptions-data';

function loadSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSubscriptions(subs: Subscription[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
}

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(loadSubscriptions);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | undefined>();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [sortField, setSortField] = useState<SortField>('nextRenewal');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Auth state
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Scan state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [parsedEmails, setParsedEmails] = useState<ParsedSubscription[] | null>(null);

  function mutate(next: Subscription[]) {
    setSubscriptions(next);
    saveSubscriptions(next);
  }

  function handleSave(sub: Subscription) {
    const exists = subscriptions.find((s) => s.id === sub.id);
    mutate(exists ? subscriptions.map((s) => (s.id === sub.id ? sub : s)) : [...subscriptions, sub]);
    setModalOpen(false);
    setEditTarget(undefined);
  }

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      mutate(subscriptions.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  function handleToggle(id: string) {
    mutate(subscriptions.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  }

  function openAdd() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditTarget(sub);
    setModalOpen(true);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  // ── Google sign-in ─────────────────────────────────────────────────────────

  const signIn = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    onSuccess: async (tokenResponse) => {
      await handleLogin(tokenResponse.access_token);
    },
    onError: () => {
      setIsLoggingIn(false);
      setLoginError('Google sign-in was cancelled or failed.');
    },
  });

  async function handleLogin(accessToken: string) {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const profile = await fetchUserProfile(accessToken);
      setUser(profile);
      setGmailToken(accessToken);
      await scanEmails(accessToken);
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleSignOut() {
    setUser(null);
    setGmailToken(null);
    setParsedEmails(null);
    setSyncError(null);
    setSyncStatus('');
    setLoginError(null);
  }

  // ── Email scanning ─────────────────────────────────────────────────────────

  async function scanEmails(token: string) {
    const apiKey = getEffectiveKey();
    if (!apiKey) {
      setSyncError('AI analysis requires a Gemini API key. Set VITE_GEMINI_API_KEY in your Vercel environment variables.');
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus('Fetching billing emails…');
    try {
      const rawEmails = await fetchBillingEmails(token);
      setSyncStatus(`Analyzing ${rawEmails.length} emails with AI…`);
      const emailData = prepareEmailsForAI(rawEmails);
      const parsed = await analyzeEmailsForSubscriptions(emailData, apiKey);
      setParsedEmails(parsed);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Failed to scan emails.');
    } finally {
      setIsSyncing(false);
      setSyncStatus('');
    }
  }

  function handleImport(selected: ParsedSubscription[]) {
    const existingNames = new Set(subscriptions.map((s) => s.name.toLowerCase()));
    const toAdd = selected
      .filter((p) => !existingNames.has(p.name.toLowerCase()))
      .map(parsedToSubscription);
    mutate([...subscriptions, ...toAdd]);
    setParsedEmails(null);
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const existingNames = useMemo(
    () => new Set(subscriptions.map((s) => s.name.toLowerCase())),
    [subscriptions]
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(subscriptions.map((s) => s.category)))],
    [subscriptions]
  );

  const filtered = useMemo(() => {
    let list = subscriptions.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'All' && s.category !== filterCategory) return false;
      if (filterStatus === 'active' && !s.active) return false;
      if (filterStatus === 'inactive' && s.active) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'amount')
        cmp = toMonthly(a.amount, a.billingCycle) - toMonthly(b.amount, b.billingCycle);
      else if (sortField === 'nextRenewal')
        cmp = daysUntilRenewal(a.nextRenewal) - daysUntilRenewal(b.nextRenewal);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [subscriptions, search, filterCategory, filterStatus, sortField, sortDir]);

  const monthlyCost = totalMonthlyCost(subscriptions);
  const yearlyCost = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + toYearly(s.amount, s.billingCycle), 0);
  const upcoming = upcomingRenewals(subscriptions, 7);
  const activeCount = subscriptions.filter((s) => s.active).length;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions
      .filter((s) => s.active)
      .forEach((s) => {
        const key = s.category;
        map[key] = (map[key] || 0) + toMonthly(s.amount, s.billingCycle);
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subscriptions]);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <LoginPage
        onSignIn={() => { setIsLoggingIn(true); signIn(); }}
        isLoading={isLoggingIn}
        error={loginError}
      />
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="brand-icon">💳</span>
            <h1>SubsTrack</h1>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-gmail-connected"
              onClick={() => gmailToken && scanEmails(gmailToken)}
              disabled={isSyncing || !gmailToken}
              title="Re-scan inbox for subscriptions"
            >
              {isSyncing ? (
                <><span className="spinner" /> <span className="btn-add-label">Scanning…</span></>
              ) : (
                <><span>🔍</span> <span className="btn-add-label">Scan emails</span></>
              )}
            </button>

            <div className="user-info">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="user-name">{user.name}</span>
              <button className="btn-signout" onClick={handleSignOut} title="Sign out">
                Sign out
              </button>
            </div>

            <button className="btn btn-primary header-add-btn" onClick={openAdd}>
              +<span className="btn-add-label"> Add</span>
            </button>
          </div>
        </div>
      </header>

      {syncError && (
        <div className="sync-error-bar">
          ⚠ {syncError}
          <button onClick={() => setSyncError(null)}>✕</button>
        </div>
      )}

      <main className="app-main">
        <section className="stats-grid">
          <StatCard
            title="Monthly Cost"
            value={formatCurrency(monthlyCost)}
            subtitle={`${formatCurrency(yearlyCost)} / year`}
            icon="💸"
            accent="#6366F1"
          />
          <StatCard
            title="Active Subscriptions"
            value={String(activeCount)}
            subtitle={`${subscriptions.length} total`}
            icon="✅"
            accent="#10B981"
          />
          <StatCard
            title="Renewing This Week"
            value={String(upcoming.length)}
            subtitle={upcoming.length > 0 ? `Next: ${upcoming[0].name}` : 'Nothing due soon'}
            icon="📅"
            accent={upcoming.length > 0 ? '#F59E0B' : '#6B7280'}
          />
          <StatCard
            title="Avg Per Subscription"
            value={activeCount > 0 ? formatCurrency(monthlyCost / activeCount) : '$0.00'}
            subtitle="monthly average"
            icon="📊"
            accent="#06B6D4"
          />
        </section>

        <div className="dashboard-body">
          <section className="subscriptions-section">
            <div className="filters-bar">
              <input
                className="search-input"
                type="search"
                placeholder="Search subscriptions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="filter-group">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="sort-bar">
              <span className="sort-label">Sort by:</span>
              {(['name', 'amount', 'nextRenewal', 'category'] as SortField[]).map((f) => (
                <button
                  key={f}
                  className={`sort-btn ${sortField === f ? 'active' : ''}`}
                  onClick={() => handleSort(f)}
                >
                  {f === 'nextRenewal' ? 'Renewal' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {sortArrow(f)}
                </button>
              ))}
              <span className="sub-count">
                {filtered.length} subscription{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                {subscriptions.length === 0 ? (
                  <>
                    <p>No subscriptions yet</p>
                    <p className="empty-hint">
                      Click <strong>Scan emails</strong> to let AI find your active subscriptions,
                      <br />or add them manually.
                    </p>
                    <div className="empty-actions">
                      <button
                        className="btn btn-gmail"
                        onClick={() => gmailToken && scanEmails(gmailToken)}
                        disabled={isSyncing}
                      >
                        🔍 Scan emails
                      </button>
                      <button className="btn btn-ghost" onClick={openAdd}>+ Add manually</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p>No subscriptions match your filters</p>
                    <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilterCategory('All'); setFilterStatus('active'); }}>
                      Clear filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="cards-grid">
                {filtered.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="sidebar">
            {upcoming.length > 0 && (
              <div className="sidebar-card">
                <h3 className="sidebar-title">⚡ Upcoming Renewals</h3>
                <ul className="renewal-list">
                  {upcoming.map((s) => {
                    const d = daysUntilRenewal(s.nextRenewal);
                    return (
                      <li key={s.id} className="renewal-item">
                        <div className="renewal-dot" style={{ background: s.color }} />
                        <div className="renewal-info">
                          <span className="renewal-name">{s.name}</span>
                          <span className="renewal-date">
                            {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`}
                          </span>
                        </div>
                        <span className="renewal-amount">{formatCurrency(s.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <AIInsightsPanel subscriptions={subscriptions} />

            <div className="sidebar-card">
              <h3 className="sidebar-title">📂 By Category</h3>
              {byCategory.length === 0 ? (
                <p className="sidebar-empty">No data yet</p>
              ) : (
                <ul className="category-list">
                  {byCategory.map(([cat, cost]) => {
                    const pct = monthlyCost > 0 ? (cost / monthlyCost) * 100 : 0;
                    return (
                      <li key={cat} className="category-item">
                        <div className="category-item-header">
                          <span className="category-dot" style={{ background: CATEGORY_COLORS[cat] || '#9CA3AF' }} />
                          <span className="category-name">{cat}</span>
                          <span className="category-amount">{formatCurrency(cost)}</span>
                        </div>
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || '#9CA3AF' }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      {modalOpen && (
        <SubscriptionModal
          subscription={editTarget}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined); }}
        />
      )}

      {parsedEmails !== null && (
        <GmailImportModal
          parsed={parsedEmails}
          existing={existingNames}
          onImport={handleImport}
          onClose={() => setParsedEmails(null)}
        />
      )}

      {deleteConfirm && (
        <div className="toast">Click delete again to confirm removal</div>
      )}

      {isSyncing && (
        <div className="toast toast-syncing">
          <span className="spinner" /> {syncStatus || 'Scanning emails…'}
        </div>
      )}

      {/* FAB — visible only on mobile via CSS */}
      <button className="fab" onClick={openAdd} aria-label="Add subscription">
        +
      </button>
    </div>
  );
}
