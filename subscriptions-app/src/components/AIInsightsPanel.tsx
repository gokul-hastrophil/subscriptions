import { useEffect, useRef, useState } from 'react';
import type { Subscription } from '../types';
import { fetchAIInsights, getEffectiveKey, getStoredGeminiKey, isEnvKey, saveGeminiKey } from '../services/gemini';

interface Props {
  subscriptions: Subscription[];
}

type PanelState = 'setup' | 'idle' | 'loading' | 'done' | 'error';

export default function AIInsightsPanel({ subscriptions }: Props) {
  const [apiKey, setApiKey]       = useState(getEffectiveKey);
  const [keyInput, setKeyInput]   = useState('');
  const [state, setState]         = useState<PanelState>(() => (getEffectiveKey() ? 'idle' : 'setup'));
  const [insights, setInsights]   = useState('');
  const [error, setError]         = useState('');
  const [showKey, setShowKey]     = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const envKeyActive              = isEnvKey();

  // Focus input when panel switches to setup
  useEffect(() => {
    if (state === 'setup') inputRef.current?.focus();
  }, [state]);

  function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    saveGeminiKey(trimmed);
    setApiKey(trimmed);
    setKeyInput('');
    setState('idle');
  }

  function handleRemoveKey() {
    saveGeminiKey('');
    setApiKey('');
    setInsights('');
    setError('');
    setState('setup');
  }

  async function handleAnalyze() {
    setState('loading');
    setError('');
    try {
      const result = await fetchAIInsights(getEffectiveKey(), subscriptions);
      setInsights(result);
      setState('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setState('error');
    }
  }

  // Format the raw text: bold **…** sections, newlines → paragraphs
  function renderInsights(text: string) {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return null;
      // Bold **text** patterns
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <p key={i} className="ai-line">
          {parts}
        </p>
      );
    });
  }

  return (
    <div className="sidebar-card ai-panel">
      <div className="ai-panel-header">
        <span className="ai-panel-icon">✨</span>
        <h3 className="sidebar-title" style={{ margin: 0 }}>AI Insights</h3>
        <span className="ai-powered-badge">Gemini</span>
      </div>

      {/* ── Key setup ── */}
      {state === 'setup' && (
        <div className="ai-setup">
          <p className="ai-setup-hint">
            Enter your Gemini API key to get personalised spending insights.
          </p>
          <div className="ai-key-row">
            <div className="ai-key-input-wrap">
              <input
                ref={inputRef}
                type={showKey ? 'text' : 'password'}
                className="ai-key-input"
                placeholder="AIza…"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
              />
              <button
                className="ai-key-toggle"
                onClick={() => setShowKey((v) => !v)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <button
              className="btn btn-primary ai-save-btn"
              onClick={handleSaveKey}
              disabled={!keyInput.trim()}
            >
              Save
            </button>
          </div>
          <p className="ai-key-note">
            Key is stored only in your browser — never sent anywhere except Google.
          </p>
        </div>
      )}

      {/* ── Idle: ready to analyze ── */}
      {state === 'idle' && (
        <div className="ai-idle">
          <p className="ai-setup-hint">
            Analyze your {subscriptions.filter((s) => s.active).length} active subscriptions
            and get personalized savings tips.
          </p>
          <button className="btn btn-primary ai-analyze-btn" onClick={handleAnalyze}>
            ✨ Analyze my subscriptions
          </button>
          {!envKeyActive && (
            <button className="ai-change-key" onClick={handleRemoveKey}>
              Change API key
            </button>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {state === 'loading' && (
        <div className="ai-loading">
          <span className="spinner" />
          <span>Analyzing your subscriptions…</span>
        </div>
      )}

      {/* ── Done: show insights ── */}
      {state === 'done' && (
        <div className="ai-results">
          <div className="ai-insights-text">{renderInsights(insights)}</div>
          <div className="ai-results-footer">
            <button className="btn btn-ghost ai-refresh-btn" onClick={handleAnalyze}>
              ↻ Refresh
            </button>
            {!envKeyActive && (
              <button className="ai-change-key" onClick={handleRemoveKey}>
                Change key
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {state === 'error' && (
        <div className="ai-error">
          <p className="ai-error-msg">⚠ {error}</p>
          <div className="ai-results-footer">
            <button className="btn btn-ghost ai-refresh-btn" onClick={handleAnalyze}>
              Retry
            </button>
            {!envKeyActive && (
              <button className="ai-change-key" onClick={handleRemoveKey}>
                Change key
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
