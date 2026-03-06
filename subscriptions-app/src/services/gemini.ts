import type { BillingCycle, Category, Subscription } from '../types';
import type { EmailForAI, ParsedSubscription } from './gmail';
import { formatCurrency, generateId, toMonthly, toYearly } from '../utils';

const STORAGE_KEY = 'substracks-gemini-key';
// Best reasoning model for financial insights
const MODEL_INSIGHTS = 'gemini-3.1-pro-preview';
// Fast model for structured email extraction
const MODEL_EMAIL = 'gemini-3-flash-preview';

// Env var (set in Vercel) takes priority; localStorage is the manual fallback.
const ENV_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? '';

export function getEffectiveKey(): string {
  return ENV_KEY || localStorage.getItem(STORAGE_KEY) || '';
}

/** True when the key comes from the environment — no manual setup needed. */
export function isEnvKey(): boolean {
  return Boolean(ENV_KEY);
}

export function getStoredGeminiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function saveGeminiKey(key: string) {
  if (key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
  else localStorage.removeItem(STORAGE_KEY);
}

export async function fetchAIInsights(
  apiKey: string,
  subscriptions: Subscription[]
): Promise<string> {
  const active = subscriptions.filter((s) => s.active);
  if (active.length === 0) {
    return 'No active subscriptions to analyze yet. Add some and come back!';
  }

  const monthly = active.reduce((sum, s) => sum + toMonthly(s.amount, s.billingCycle), 0);
  const yearly  = active.reduce((sum, s) => sum + toYearly(s.amount, s.billingCycle), 0);

  const list = active
    .map((s) => `• ${s.name} (${s.category}): ${formatCurrency(toMonthly(s.amount, s.billingCycle))}/mo`)
    .join('\n');

  const prompt =
    `You are a friendly personal finance assistant helping someone manage their subscriptions.\n\n` +
    `Active subscriptions:\n${list}\n\n` +
    `Total: ${formatCurrency(monthly)}/month · ${formatCurrency(yearly)}/year\n\n` +
    `Give a concise, friendly analysis (under 200 words) with three sections:\n` +
    `**Spending Summary** — brief overview of their portfolio\n` +
    `**Savings Opportunities** — 2-3 specific, actionable tips mentioning service names\n` +
    `**Quick Win** — one thing they can do right now to save money\n\n` +
    `Use bullet points. Write in plain text — no markdown # headers.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_INSIGHTS}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = (errBody as { error?: { message?: string } })?.error?.message;
    throw new Error(msg ?? `Gemini API error ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini.');
  return text.trim();
}

// ── AI email scanning ─────────────────────────────────────────────────────────

const VALID_CYCLES = new Set<string>(['monthly', 'yearly', 'weekly']);
const VALID_CATEGORIES = new Set<string>([
  'Entertainment', 'Productivity', 'Health & Fitness', 'Education',
  'Finance', 'News & Media', 'Cloud Storage', 'Other',
]);
const CATEGORY_COLOR: Record<string, string> = {
  'Entertainment':    '#A855F7',
  'Productivity':     '#3B82F6',
  'Health & Fitness': '#10B981',
  'Education':        '#F59E0B',
  'Finance':          '#EF4444',
  'News & Media':     '#6B7280',
  'Cloud Storage':    '#06B6D4',
  'Other':            '#9CA3AF',
};

interface RawAISub {
  name: string;
  amount: number;
  billingCycle: string;
  category: string;
  lastBilledDate: string;
}

async function callGeminiForEmails(
  emails: EmailForAI[],
  apiKey: string,
): Promise<RawAISub[]> {
  const emailList = emails
    .map((e, i) =>
      `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Date: ${e.date}\n   Preview: ${e.snippet}`
    )
    .join('\n\n');

  const prompt =
    `You are analyzing billing and subscription emails to find active subscriptions.\n\n` +
    `From the following emails, identify ONLY active, recurring subscriptions. Skip:\n` +
    `- One-time purchases or order confirmations\n` +
    `- Cancelled, expired, or refunded subscriptions\n` +
    `- Free trials that have ended\n` +
    `- Duplicate entries for the same service\n\n` +
    `For each active subscription found, extract:\n` +
    `- name: Service/company name (e.g. "GitHub", "AWS", "Netflix")\n` +
    `- amount: Numeric price as a number (0 if unknown)\n` +
    `- billingCycle: "monthly", "yearly", or "weekly"\n` +
    `- category: One of exactly: Entertainment, Productivity, Health & Fitness, Education, Finance, News & Media, Cloud Storage, Other\n` +
    `- lastBilledDate: Most recent billing date in YYYY-MM-DD format\n\n` +
    `Return ONLY a valid JSON array with no extra text, no markdown, no explanation:\n` +
    `[{"name":"...","amount":9.99,"billingCycle":"monthly","category":"Entertainment","lastBilledDate":"2024-01-15"}]\n\n` +
    `If no active subscriptions found, return: []\n\n` +
    `EMAILS:\n${emailList}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_EMAIL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = (errBody as { error?: { message?: string } })?.error?.message;
    throw new Error(msg ?? `Gemini API error ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '[]';
  // Strip markdown code fences if the model adds them
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(clean) as RawAISub[];
  } catch {
    return [];
  }
}

/**
 * Analyse a list of billing emails with Gemini AI and return active
 * subscriptions as ParsedSubscription objects ready for the import modal.
 */
export async function analyzeEmailsForSubscriptions(
  emails: EmailForAI[],
  apiKey: string,
): Promise<ParsedSubscription[]> {
  const BATCH = 60;
  const allRaw: RawAISub[] = [];

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    const results = await callGeminiForEmails(batch, apiKey);
    allRaw.push(...results);
  }

  // Deduplicate by service name — keep the entry with the latest billing date
  const map = new Map<string, RawAISub>();
  for (const sub of allRaw) {
    const key = sub.name.toLowerCase().trim();
    const existing = map.get(key);
    if (!existing || (sub.lastBilledDate ?? '') > (existing.lastBilledDate ?? '')) {
      map.set(key, sub);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return Array.from(map.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((sub): ParsedSubscription => {
      const cycle: BillingCycle = VALID_CYCLES.has(sub.billingCycle)
        ? (sub.billingCycle as BillingCycle)
        : 'monthly';
      const category: Category = VALID_CATEGORIES.has(sub.category)
        ? (sub.category as Category)
        : 'Other';
      return {
        id: generateId(),
        name: sub.name,
        amount: Number(sub.amount) || 0,
        billingCycle: cycle,
        category,
        color: CATEGORY_COLOR[category] ?? '#9CA3AF',
        lastEmailDate: sub.lastBilledDate || today,
        emailId: '',
      };
    });
}
