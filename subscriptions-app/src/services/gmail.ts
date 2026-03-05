import type { BillingCycle, Category, Subscription } from '../types';
import { generateId } from '../utils';

// ── Sender → service name map ────────────────────────────────────────────────

const SENDER_MAP: Record<string, { name: string; category: Category; color: string }> = {
  'netflix.com':           { name: 'Netflix',              category: 'Entertainment', color: '#E50914' },
  'spotify.com':           { name: 'Spotify',              category: 'Entertainment', color: '#1DB954' },
  'hulu.com':              { name: 'Hulu',                  category: 'Entertainment', color: '#1CE783' },
  'disneyplus.com':        { name: 'Disney+',               category: 'Entertainment', color: '#0063E5' },
  'primevideo.com':        { name: 'Prime Video',           category: 'Entertainment', color: '#00A8E1' },
  'amazon.com':            { name: 'Amazon Prime',          category: 'Entertainment', color: '#FF9900' },
  'youtube.com':           { name: 'YouTube Premium',       category: 'Entertainment', color: '#FF0000' },
  'apple.com':             { name: 'Apple',                 category: 'Entertainment', color: '#555555' },
  'tv.apple.com':          { name: 'Apple TV+',             category: 'Entertainment', color: '#000000' },
  'music.apple.com':       { name: 'Apple Music',           category: 'Entertainment', color: '#FC3C44' },
  'icloud.com':            { name: 'iCloud+',               category: 'Cloud Storage', color: '#1C7EEA' },
  'email.apple.com':       { name: 'Apple',                 category: 'Entertainment', color: '#555555' },
  'hbomax.com':            { name: 'Max (HBO)',              category: 'Entertainment', color: '#0B0C10' },
  'max.com':               { name: 'Max',                   category: 'Entertainment', color: '#002BE7' },
  'peacocktv.com':         { name: 'Peacock',               category: 'Entertainment', color: '#000000' },
  'paramountplus.com':     { name: 'Paramount+',            category: 'Entertainment', color: '#0064FF' },
  'crunchyroll.com':       { name: 'Crunchyroll',           category: 'Entertainment', color: '#F47521' },
  'github.com':            { name: 'GitHub',                category: 'Productivity',  color: '#24292F' },
  'notion.so':             { name: 'Notion',                category: 'Productivity',  color: '#000000' },
  'makenotion.com':        { name: 'Notion',                category: 'Productivity',  color: '#000000' },
  'adobe.com':             { name: 'Adobe',                 category: 'Productivity',  color: '#FF0000' },
  'figma.com':             { name: 'Figma',                 category: 'Productivity',  color: '#F24E1E' },
  'slack.com':             { name: 'Slack',                 category: 'Productivity',  color: '#4A154B' },
  'zoom.us':               { name: 'Zoom',                  category: 'Productivity',  color: '#2D8CFF' },
  'atlassian.com':         { name: 'Atlassian',             category: 'Productivity',  color: '#0052CC' },
  'dropbox.com':           { name: 'Dropbox',               category: 'Cloud Storage', color: '#0061FF' },
  'google.com':            { name: 'Google',                category: 'Cloud Storage', color: '#4285F4' },
  'microsoft.com':         { name: 'Microsoft 365',         category: 'Productivity',  color: '#D83B01' },
  'grammarly.com':         { name: 'Grammarly',             category: 'Productivity',  color: '#15C39A' },
  '1password.com':         { name: '1Password',             category: 'Productivity',  color: '#1A8CFF' },
  'lastpass.com':          { name: 'LastPass',              category: 'Productivity',  color: '#D32D27' },
  'nordvpn.com':           { name: 'NordVPN',               category: 'Productivity',  color: '#4687FF' },
  'expressvpn.com':        { name: 'ExpressVPN',            category: 'Productivity',  color: '#DA3940' },
  'duolingo.com':          { name: 'Duolingo',              category: 'Education',     color: '#58CC02' },
  'coursera.org':          { name: 'Coursera',              category: 'Education',     color: '#0056D2' },
  'udemy.com':             { name: 'Udemy',                 category: 'Education',     color: '#A435F0' },
  'linkedin.com':          { name: 'LinkedIn Premium',      category: 'Education',     color: '#0A66C2' },
  'nytimes.com':           { name: 'New York Times',        category: 'News & Media',  color: '#000000' },
  'wsj.com':               { name: 'Wall Street Journal',   category: 'News & Media',  color: '#004276' },
  'medium.com':            { name: 'Medium',                category: 'News & Media',  color: '#000000' },
  'substack.com':          { name: 'Substack',              category: 'News & Media',  color: '#FF6719' },
  'twitter.com':           { name: 'X Premium',             category: 'News & Media',  color: '#000000' },
  'x.com':                 { name: 'X Premium',             category: 'News & Media',  color: '#000000' },
  'openai.com':            { name: 'ChatGPT Plus',          category: 'Productivity',  color: '#10A37F' },
  'anthropic.com':         { name: 'Claude Pro',            category: 'Productivity',  color: '#D4691B' },
  'midjourney.com':        { name: 'Midjourney',            category: 'Productivity',  color: '#000000' },
  'canva.com':             { name: 'Canva Pro',             category: 'Productivity',  color: '#00C4CC' },
  'squarespace.com':       { name: 'Squarespace',           category: 'Productivity',  color: '#000000' },
  'shopify.com':           { name: 'Shopify',               category: 'Productivity',  color: '#96BF48' },
  'mailchimp.com':         { name: 'Mailchimp',             category: 'Productivity',  color: '#FFE01B' },
  'hubspot.com':           { name: 'HubSpot',               category: 'Productivity',  color: '#FF7A59' },
  'zendesk.com':           { name: 'Zendesk',               category: 'Productivity',  color: '#03363D' },
  'aws.amazon.com':        { name: 'Amazon AWS',            category: 'Cloud Storage', color: '#FF9900' },
  'digitalocean.com':      { name: 'DigitalOcean',          category: 'Cloud Storage', color: '#0080FF' },
  'vercel.com':            { name: 'Vercel',                category: 'Cloud Storage', color: '#000000' },
  'heroku.com':            { name: 'Heroku',                category: 'Cloud Storage', color: '#430098' },
};

// ── Gmail API types ──────────────────────────────────────────────────────────

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

// ── Parsed email result ──────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(fromHeader: string): string {
  const match = fromHeader.match(/@([\w.-]+)/);
  if (!match) return '';
  // Strip subdomains like "mail." "em." "email." "no-reply." etc. but keep meaningful ones
  const parts = match[1].split('.');
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return match[1];
}

function extractAmount(text: string): number | null {
  // Match: $9.99  £9.99  €9.99  ₹999  ¥999  9.99 USD  INR 999
  const patterns = [
    /[\$£€₹¥]\s*([\d,]+(?:\.\d{1,2})?)/,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:USD|GBP|EUR|INR|CAD|AUD)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 0 && val < 10000) return val;
    }
  }
  return null;
}

function extractBillingCycle(text: string): BillingCycle {
  if (/annual|yearly|per year|\/year|\/yr/i.test(text)) return 'yearly';
  if (/weekly|per week|\/week|\/wk/i.test(text)) return 'weekly';
  return 'monthly';
}

function addOneCycle(dateStr: string, cycle: BillingCycle): string {
  const d = new Date(dateStr);
  if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

// ── Main functions ───────────────────────────────────────────────────────────

export async function fetchBillingEmails(accessToken: string): Promise<GmailMessageDetail[]> {
  const query = encodeURIComponent(
    'subject:(receipt OR invoice OR subscription OR renewal OR "payment confirmation" OR "amount debited" OR "billing" OR "charged")'
  );
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=100`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail list failed: ${listRes.status} ${err}`);
  }

  const listData: { messages?: GmailMessage[] } = await listRes.json();
  const messages = listData.messages ?? [];

  // Fetch message details in batches of 10 to avoid rate limits
  const details: GmailMessageDetail[] = [];
  const BATCH = 10;
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

export function parseEmailsToSubscriptions(emails: GmailMessageDetail[]): ParsedSubscription[] {
  const map = new Map<string, ParsedSubscription>();

  for (const email of emails) {
    const from    = getHeader(email.payload.headers, 'From');
    const subject = getHeader(email.payload.headers, 'Subject');
    const date    = getHeader(email.payload.headers, 'Date');
    const text    = `${subject} ${email.snippet}`;

    const domain  = extractDomain(from);
    const service = SENDER_MAP[domain];
    if (!service) continue; // skip unknown senders

    const amount = extractAmount(text);
    if (!amount) continue; // skip emails without a detectable amount

    const cycle = extractBillingCycle(text);
    const key   = `${service.name}|${amount}|${cycle}`;

    const emailDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Keep the most recent email per unique (service+amount+cycle)
    const existing = map.get(key);
    if (!existing || emailDate > existing.lastEmailDate) {
      map.set(key, {
        id: generateId(),
        name: service.name,
        amount,
        billingCycle: cycle,
        category: service.category,
        color: service.color,
        lastEmailDate: emailDate,
        emailId: email.id,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
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
