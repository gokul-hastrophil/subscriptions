import type { Subscription } from '../types';
import { daysUntilRenewal, formatCurrency, formatDate, toMonthly } from '../utils';

interface Props {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function SubscriptionCard({ subscription, onEdit, onDelete, onToggle }: Props) {
  const days = daysUntilRenewal(subscription.nextRenewal);
  const renewalLabel =
    days === 0 ? 'Renews today' : days === 1 ? 'Renews tomorrow' : days < 0 ? 'Overdue' : `In ${days} days`;
  const isUrgent = days <= 3 && days >= 0;
  const isOverdue = days < 0;

  return (
    <div className={`sub-card ${!subscription.active ? 'inactive' : ''}`}>
      <div className="sub-card-accent" style={{ background: subscription.color }} />
      <div className="sub-card-content">
        <div className="sub-card-header">
          <div className="sub-card-logo" style={{ background: subscription.color + '22', color: subscription.color }}>
            {subscription.name.charAt(0).toUpperCase()}
          </div>
          <div className="sub-card-info">
            <h3>{subscription.name}</h3>
            <span className="sub-card-category">{subscription.category}</span>
          </div>
          <div className="sub-card-actions">
            <button className="btn-icon" onClick={() => onEdit(subscription)} title="Edit">✎</button>
            <button className="btn-icon danger" onClick={() => onDelete(subscription.id)} title="Delete">⌫</button>
          </div>
        </div>

        <div className="sub-card-pricing">
          <span className="sub-card-amount">{formatCurrency(subscription.amount)}</span>
          <span className="sub-card-cycle">/ {subscription.billingCycle}</span>
          <span className="sub-card-monthly">
            ({formatCurrency(toMonthly(subscription.amount, subscription.billingCycle))}/mo)
          </span>
        </div>

        <div className="sub-card-footer">
          <span
            className={`renewal-badge ${isUrgent ? 'urgent' : ''} ${isOverdue ? 'overdue' : ''}`}
          >
            📅 {renewalLabel} · {formatDate(subscription.nextRenewal)}
          </span>
          <div
            className={`toggle small ${subscription.active ? 'on' : ''}`}
            onClick={() => onToggle(subscription.id)}
            role="switch"
            aria-checked={subscription.active}
            title={subscription.active ? 'Active' : 'Inactive'}
          >
            <div className="toggle-thumb" />
          </div>
        </div>

        {subscription.notes && <p className="sub-card-notes">{subscription.notes}</p>}
      </div>
    </div>
  );
}
