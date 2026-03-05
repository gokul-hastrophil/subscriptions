import type { Subscription } from '../types';
import { formatCurrency, toMonthly, toYearly } from '../utils';

const STORAGE_KEY = 'substracks-gemini-key';
const MODEL = 'gemini-3.1-flash-lite';

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
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
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
