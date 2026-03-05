import type { BillingCycle, Subscription } from './types';

export function toMonthly(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return amount * 4.33;
    case 'yearly':
      return amount / 12;
    case 'monthly':
    default:
      return amount;
  }
}

export function toYearly(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'yearly':
    default:
      return amount;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntilRenewal(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(isoDate);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function totalMonthlyCost(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);
}

export function upcomingRenewals(subscriptions: Subscription[], days = 7): Subscription[] {
  return subscriptions
    .filter((s) => s.active && daysUntilRenewal(s.nextRenewal) <= days && daysUntilRenewal(s.nextRenewal) >= 0)
    .sort((a, b) => daysUntilRenewal(a.nextRenewal) - daysUntilRenewal(b.nextRenewal));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function nextRenewalDate(cycle: BillingCycle): string {
  const today = new Date();
  switch (cycle) {
    case 'weekly':
      return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'monthly':
      return addMonths(today, 1).toISOString().split('T')[0];
    case 'yearly':
      return addMonths(today, 12).toISOString().split('T')[0];
  }
}
