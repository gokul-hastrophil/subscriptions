import { useState } from 'react';
import type { BillingCycle, Category } from '../types';
import type { ParsedSubscription } from '../services/gmail';
import { formatCurrency } from '../utils';

const CATEGORIES: Category[] = [
  'Entertainment', 'Productivity', 'Health & Fitness', 'Education',
  'Finance', 'News & Media', 'Cloud Storage', 'Other',
];

interface Props {
  parsed: ParsedSubscription[];
  existing: Set<string>; // names already in the dashboard
  onImport: (selected: ParsedSubscription[]) => void;
  onClose: () => void;
}

export default function GmailImportModal({ parsed, existing, onImport, onClose }: Props) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(parsed.filter((p) => !existing.has(p.name.toLowerCase())).map((p) => p.id))
  );
  const [edits, setEdits] = useState<Record<string, Partial<ParsedSubscription>>>({});

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function edit(id: string, field: keyof ParsedSubscription, value: string | number) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function getItem(p: ParsedSubscription): ParsedSubscription {
    return { ...p, ...edits[p.id] };
  }

  function handleImport() {
    const selected = parsed.filter((p) => checked.has(p.id)).map(getItem);
    onImport(selected);
  }

  const selectedCount = checked.size;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal gmail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>🤖 AI-Detected Subscriptions</h2>
            <p className="gmail-modal-subtitle">
              Found {parsed.length} active subscription{parsed.length !== 1 ? 's' : ''} in your emails
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {parsed.length === 0 ? (
          <div className="gmail-empty">
            <span>📭</span>
            <p>No active subscriptions detected.</p>
            <p className="gmail-empty-hint">
              AI didn't find any recurring billing emails. Try adding subscriptions manually,
              or check that billing emails aren't in spam/archived folders.
            </p>
          </div>
        ) : (
          <>
            <div className="gmail-list">
              {parsed.map((p) => {
                const item = getItem(p);
                const isExisting = existing.has(p.name.toLowerCase());
                return (
                  <div
                    key={p.id}
                    className={`gmail-row ${!checked.has(p.id) ? 'unchecked' : ''} ${isExisting ? 'already-added' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="gmail-checkbox"
                    />
                    <div
                      className="gmail-row-dot"
                      style={{ background: item.color }}
                    />
                    <div className="gmail-row-body">
                      <div className="gmail-row-top">
                        <input
                          className="gmail-name-input"
                          value={item.name}
                          onChange={(e) => edit(p.id, 'name', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {isExisting && (
                          <span className="already-badge">Already added</span>
                        )}
                      </div>
                      <div className="gmail-row-meta">
                        <div className="gmail-field">
                          <span className="gmail-field-prefix">$</span>
                          <input
                            type="number"
                            className="gmail-amount-input"
                            value={item.amount}
                            min="0"
                            step="0.01"
                            onChange={(e) => edit(p.id, 'amount', parseFloat(e.target.value) || 0)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <select
                          className="gmail-select"
                          value={item.billingCycle}
                          onChange={(e) => edit(p.id, 'billingCycle', e.target.value as BillingCycle)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <select
                          className="gmail-select"
                          value={item.category}
                          onChange={(e) => edit(p.id, 'category', e.target.value as Category)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <span className="gmail-row-amount">
                      {formatCurrency(item.amount)}/{item.billingCycle.slice(0, 2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="gmail-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={selectedCount === 0}
              >
                Import {selectedCount > 0 ? `${selectedCount} ` : ''}subscription{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
