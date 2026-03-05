import React, { useEffect, useState } from 'react';
import type { BillingCycle, Category, Subscription } from '../types';
import { generateId, nextRenewalDate } from '../utils';

const CATEGORIES: Category[] = [
  'Entertainment',
  'Productivity',
  'Health & Fitness',
  'Education',
  'Finance',
  'News & Media',
  'Cloud Storage',
  'Other',
];

const COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#14B8A6', '#84CC16',
  '#E50914', '#1DB954', '#24292F', '#FF6900', '#000000',
];

interface Props {
  subscription?: Subscription;
  onSave: (sub: Subscription) => void;
  onClose: () => void;
}

export default function SubscriptionModal({ subscription, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [nextRenewal, setNextRenewal] = useState('');
  const [category, setCategory] = useState<Category>('Entertainment');
  const [color, setColor] = useState(COLORS[0]);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(String(subscription.amount));
      setBillingCycle(subscription.billingCycle);
      setNextRenewal(subscription.nextRenewal);
      setCategory(subscription.category);
      setColor(subscription.color);
      setActive(subscription.active);
      setNotes(subscription.notes || '');
    } else {
      setNextRenewal(nextRenewalDate('monthly'));
    }
  }, [subscription]);

  useEffect(() => {
    if (!subscription) {
      setNextRenewal(nextRenewalDate(billingCycle));
    }
  }, [billingCycle, subscription]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount || !nextRenewal) return;
    onSave({
      id: subscription?.id ?? generateId(),
      name: name.trim(),
      amount: parseFloat(amount),
      billingCycle,
      nextRenewal,
      category,
      color,
      active,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{subscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <label>
              Name *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Netflix"
                required
                autoFocus
              />
            </label>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Amount *
              <div className="input-prefix">
                <span>$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </label>
            <label>
              Billing Cycle
              <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Next Renewal *
              <input
                type="date"
                value={nextRenewal}
                onChange={(e) => setNextRenewal(e.target.value)}
                required
              />
            </label>
            <label className="label-switch">
              <span>Active</span>
              <div
                className={`toggle ${active ? 'on' : ''}`}
                onClick={() => setActive(!active)}
                role="switch"
                aria-checked={active}
              >
                <div className="toggle-thumb" />
              </div>
            </label>
          </div>

          <label>
            Color
            <div className="color-grid">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </label>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {subscription ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
