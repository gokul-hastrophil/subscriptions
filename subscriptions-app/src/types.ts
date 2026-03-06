export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export type Category =
  | 'Entertainment'
  | 'Productivity'
  | 'Health & Fitness'
  | 'Education'
  | 'Finance'
  | 'News & Media'
  | 'Cloud Storage'
  | 'Other';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextRenewal: string; // ISO date string
  category: Category;
  color: string;
  logo?: string;
  active: boolean;
  notes?: string;
  source?: 'manual' | 'gmail';
}

export type SortField = 'name' | 'amount' | 'nextRenewal' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}
