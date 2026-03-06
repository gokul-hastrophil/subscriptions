import type { BillingCycle, Category, GoogleUser, Subscription } from '../types';

// ── Gmail API types ───────────────────────────────────────────────────────────

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailMessageDetail {
  id: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
}

// ── Parsed email result ───────────────────────────────────────────────────────

export interface ParsedSubscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  category: Category;
  color: string;
  lastEmailDate: string; // ISO date
  emailId: string;
}

// ── Email data for AI analysis ────────────────────────────────────────────────

export interface EmailForAI {
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function addOneCycle(dateStr: string, cycle: BillingCycle): string {
  const d = new Date(dateStr);
  if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

// ── Main functions ────────────────────────────────────────────────────────────

export async function fetchBillingEmails(accessToken: string): Promise<GmailMessageDetail[]> {
  const query = encodeURIComponent(
    '(receipt OR invoice OR subscription OR renewal OR "payment confirmation" OR ' +
    '"amount debited" OR billing OR charged OR "order confirmation" OR ' +
    '"auto-renewal" OR "auto renewal" OR membership OR "payment received" OR ' +
    '"payment successful" OR "thank you for subscribing" OR "your plan" OR ' +
    '"payment receipt" OR "transaction confirmation") ' +
    '-label:spam -label:promotions'
  );
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=500`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail list failed: ${listRes.status} ${err}`);
  }

  const listData: { messages?: GmailMessage[] } = await listRes.json();
  const messages = listData.messages ?? [];

  const details: GmailMessageDetail[] = [];
  const BATCH = 20;
  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH);
    const fetched = await Promise.all(
      batch.map((m) =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then((r) => r.json() as Promise<GmailMessageDetail>)
      )
    );
    details.push(...fetched);
  }

  return details;
}

/** Flatten GmailMessageDetail[] into simple objects for the AI analyser. */
export function prepareEmailsForAI(emails: GmailMessageDetail[]): EmailForAI[] {
  return emails.map((e) => ({
    from:    getHeader(e.payload.headers, 'From'),
    subject: getHeader(e.payload.headers, 'Subject'),
    date:    getHeader(e.payload.headers, 'Date'),
    snippet: e.snippet ?? '',
  }));
}

export async function fetchUserProfile(accessToken: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch user profile: ${res.status}`);
  return res.json() as Promise<GoogleUser>;
}

export function parsedToSubscription(p: ParsedSubscription): Subscription {
  return {
    id: p.id,
    name: p.name,
    amount: p.amount,
    billingCycle: p.billingCycle,
    nextRenewal: addOneCycle(p.lastEmailDate, p.billingCycle),
    category: p.category,
    color: p.color,
    active: true,
    source: 'gmail',
  };
}
