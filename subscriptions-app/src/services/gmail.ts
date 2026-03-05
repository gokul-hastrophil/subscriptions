import type { BillingCycle, Category, Subscription } from '../types';
import { generateId } from '../utils';

// ── Sender → service name map ────────────────────────────────────────────────

const SENDER_MAP: Record<string, { name: string; category: Category; color: string }> = {
  // Entertainment – Video Streaming
  'netflix.com':           { name: 'Netflix',              category: 'Entertainment', color: '#E50914' },
  'hulu.com':              { name: 'Hulu',                 category: 'Entertainment', color: '#1CE783' },
  'disneyplus.com':        { name: 'Disney+',              category: 'Entertainment', color: '#0063E5' },
  'disney.com':            { name: 'Disney+',              category: 'Entertainment', color: '#0063E5' },
  'primevideo.com':        { name: 'Prime Video',          category: 'Entertainment', color: '#00A8E1' },
  'amazon.com':            { name: 'Amazon Prime',         category: 'Entertainment', color: '#FF9900' },
  'aws.amazon.com':        { name: 'Amazon AWS',           category: 'Cloud Storage', color: '#FF9900' },
  'youtube.com':           { name: 'YouTube Premium',      category: 'Entertainment', color: '#FF0000' },
  'hbomax.com':            { name: 'Max (HBO)',             category: 'Entertainment', color: '#0B0C10' },
  'max.com':               { name: 'Max',                  category: 'Entertainment', color: '#002BE7' },
  'peacocktv.com':         { name: 'Peacock',              category: 'Entertainment', color: '#000000' },
  'paramountplus.com':     { name: 'Paramount+',           category: 'Entertainment', color: '#0064FF' },
  'paramount.com':         { name: 'Paramount+',           category: 'Entertainment', color: '#0064FF' },
  'crunchyroll.com':       { name: 'Crunchyroll',          category: 'Entertainment', color: '#F47521' },
  'funimation.com':        { name: 'Funimation',           category: 'Entertainment', color: '#410099' },
  'shudder.com':           { name: 'Shudder',              category: 'Entertainment', color: '#0096FF' },
  'starz.com':             { name: 'Starz',                category: 'Entertainment', color: '#000000' },
  'showtime.com':          { name: 'Showtime',             category: 'Entertainment', color: '#FF0000' },
  'acorn.tv':              { name: 'Acorn TV',             category: 'Entertainment', color: '#5A1F82' },
  'britbox.com':           { name: 'BritBox',              category: 'Entertainment', color: '#FE0E01' },
  'mubi.com':              { name: 'MUBI',                 category: 'Entertainment', color: '#000000' },
  'curiositystream.com':   { name: 'CuriosityStream',      category: 'Entertainment', color: '#26AAE2' },
  'plex.tv':               { name: 'Plex',                 category: 'Entertainment', color: '#E5A00D' },
  'dazn.com':              { name: 'DAZN',                 category: 'Entertainment', color: '#F8FF00' },
  'espnplus.com':          { name: 'ESPN+',                category: 'Entertainment', color: '#CC0000' },
  'nba.com':               { name: 'NBA League Pass',      category: 'Entertainment', color: '#1D428A' },
  'mlb.com':               { name: 'MLB.TV',               category: 'Entertainment', color: '#002D72' },
  'twitch.tv':             { name: 'Twitch',               category: 'Entertainment', color: '#9146FF' },
  'patreon.com':           { name: 'Patreon',              category: 'Entertainment', color: '#FF424D' },
  'vrv.co':                { name: 'VRV',                  category: 'Entertainment', color: '#FFD523' },
  // Entertainment – Music
  'spotify.com':           { name: 'Spotify',              category: 'Entertainment', color: '#1DB954' },
  'apple.com':             { name: 'Apple',                category: 'Entertainment', color: '#555555' },
  'tv.apple.com':          { name: 'Apple TV+',            category: 'Entertainment', color: '#000000' },
  'music.apple.com':       { name: 'Apple Music',          category: 'Entertainment', color: '#FC3C44' },
  'email.apple.com':       { name: 'Apple',                category: 'Entertainment', color: '#555555' },
  'tidal.com':             { name: 'Tidal',                category: 'Entertainment', color: '#000000' },
  'deezer.com':            { name: 'Deezer',               category: 'Entertainment', color: '#A238FF' },
  'soundcloud.com':        { name: 'SoundCloud',           category: 'Entertainment', color: '#FF3300' },
  'pandora.com':           { name: 'Pandora',              category: 'Entertainment', color: '#3668FF' },
  'qobuz.com':             { name: 'Qobuz',                category: 'Entertainment', color: '#2B52EC' },
  'audiomack.com':         { name: 'Audiomack',            category: 'Entertainment', color: '#FFA500' },
  // Productivity – Dev & Design
  'github.com':            { name: 'GitHub',               category: 'Productivity',  color: '#24292F' },
  'notion.so':             { name: 'Notion',               category: 'Productivity',  color: '#000000' },
  'makenotion.com':        { name: 'Notion',               category: 'Productivity',  color: '#000000' },
  'adobe.com':             { name: 'Adobe',                category: 'Productivity',  color: '#FF0000' },
  'figma.com':             { name: 'Figma',                category: 'Productivity',  color: '#F24E1E' },
  'slack.com':             { name: 'Slack',                category: 'Productivity',  color: '#4A154B' },
  'zoom.us':               { name: 'Zoom',                 category: 'Productivity',  color: '#2D8CFF' },
  'atlassian.com':         { name: 'Atlassian',            category: 'Productivity',  color: '#0052CC' },
  'jetbrains.com':         { name: 'JetBrains',            category: 'Productivity',  color: '#000000' },
  'loom.com':              { name: 'Loom',                 category: 'Productivity',  color: '#625DF5' },
  'airtable.com':          { name: 'Airtable',             category: 'Productivity',  color: '#FCB400' },
  'miro.com':              { name: 'Miro',                 category: 'Productivity',  color: '#050038' },
  'asana.com':             { name: 'Asana',                category: 'Productivity',  color: '#F06A6A' },
  'monday.com':            { name: 'Monday.com',           category: 'Productivity',  color: '#FF3D57' },
  'trello.com':            { name: 'Trello',               category: 'Productivity',  color: '#0052CC' },
  'todoist.com':           { name: 'Todoist',              category: 'Productivity',  color: '#DB4035' },
  'linear.app':            { name: 'Linear',               category: 'Productivity',  color: '#5E6AD2' },
  'clickup.com':           { name: 'ClickUp',              category: 'Productivity',  color: '#7B68EE' },
  'grammarly.com':         { name: 'Grammarly',            category: 'Productivity',  color: '#15C39A' },
  'canva.com':             { name: 'Canva Pro',            category: 'Productivity',  color: '#00C4CC' },
  'setapp.com':            { name: 'Setapp',               category: 'Productivity',  color: '#5C64F4' },
  'evernote.com':          { name: 'Evernote',             category: 'Productivity',  color: '#00A82D' },
  'typeform.com':          { name: 'Typeform',             category: 'Productivity',  color: '#262627' },
  'zapier.com':            { name: 'Zapier',               category: 'Productivity',  color: '#FF4A00' },
  'make.com':              { name: 'Make',                 category: 'Productivity',  color: '#6D00CC' },
  'buffer.com':            { name: 'Buffer',               category: 'Productivity',  color: '#168EEA' },
  'hootsuite.com':         { name: 'Hootsuite',            category: 'Productivity',  color: '#143059' },
  'semrush.com':           { name: 'SEMrush',              category: 'Productivity',  color: '#FF6900' },
  'ahrefs.com':            { name: 'Ahrefs',               category: 'Productivity',  color: '#FF8C00' },
  'intercom.com':          { name: 'Intercom',             category: 'Productivity',  color: '#1F8DED' },
  'zendesk.com':           { name: 'Zendesk',              category: 'Productivity',  color: '#03363D' },
  'hubspot.com':           { name: 'HubSpot',              category: 'Productivity',  color: '#FF7A59' },
  'mailchimp.com':         { name: 'Mailchimp',            category: 'Productivity',  color: '#FFE01B' },
  'convertkit.com':        { name: 'ConvertKit',           category: 'Productivity',  color: '#FB6970' },
  'squarespace.com':       { name: 'Squarespace',          category: 'Productivity',  color: '#000000' },
  'shopify.com':           { name: 'Shopify',              category: 'Productivity',  color: '#96BF48' },
  'wix.com':               { name: 'Wix',                  category: 'Productivity',  color: '#0C6EFC' },
  'wordpress.com':         { name: 'WordPress.com',        category: 'Productivity',  color: '#21759B' },
  'godaddy.com':           { name: 'GoDaddy',              category: 'Productivity',  color: '#1BDBDB' },
  'namecheap.com':         { name: 'Namecheap',            category: 'Productivity',  color: '#DE3723' },
  'sentry.io':             { name: 'Sentry',               category: 'Productivity',  color: '#362D59' },
  'datadog.com':           { name: 'Datadog',              category: 'Productivity',  color: '#632CA6' },
  'pagerduty.com':         { name: 'PagerDuty',            category: 'Productivity',  color: '#06AC38' },
  'surveymonkey.com':      { name: 'SurveyMonkey',         category: 'Productivity',  color: '#00BF6F' },
  'beehiiv.com':           { name: 'Beehiiv',              category: 'Productivity',  color: '#FF6154' },
  'ghost.org':             { name: 'Ghost',                category: 'Productivity',  color: '#15212A' },
  'openai.com':            { name: 'ChatGPT Plus',         category: 'Productivity',  color: '#10A37F' },
  'anthropic.com':         { name: 'Claude Pro',           category: 'Productivity',  color: '#D4691B' },
  'midjourney.com':        { name: 'Midjourney',           category: 'Productivity',  color: '#000000' },
  // Productivity – Microsoft & Google
  'microsoft.com':         { name: 'Microsoft 365',        category: 'Productivity',  color: '#D83B01' },
  'google.com':            { name: 'Google',               category: 'Productivity',  color: '#4285F4' },
  // Productivity – Security & VPN
  '1password.com':         { name: '1Password',            category: 'Productivity',  color: '#1A8CFF' },
  'lastpass.com':          { name: 'LastPass',             category: 'Productivity',  color: '#D32D27' },
  'dashlane.com':          { name: 'Dashlane',             category: 'Productivity',  color: '#003399' },
  'bitwarden.com':         { name: 'Bitwarden',            category: 'Productivity',  color: '#175DDC' },
  'nordvpn.com':           { name: 'NordVPN',              category: 'Productivity',  color: '#4687FF' },
  'expressvpn.com':        { name: 'ExpressVPN',           category: 'Productivity',  color: '#DA3940' },
  'surfshark.com':         { name: 'Surfshark',            category: 'Productivity',  color: '#1FBAC7' },
  'ipvanish.com':          { name: 'IPVanish',             category: 'Productivity',  color: '#D52B1E' },
  'protonmail.com':        { name: 'Proton Mail',          category: 'Productivity',  color: '#6D4AFF' },
  'proton.me':             { name: 'Proton',               category: 'Productivity',  color: '#6D4AFF' },
  'fastmail.com':          { name: 'Fastmail',             category: 'Productivity',  color: '#0069FF' },
  // Cloud Storage & Hosting
  'icloud.com':            { name: 'iCloud+',              category: 'Cloud Storage', color: '#1C7EEA' },
  'dropbox.com':           { name: 'Dropbox',              category: 'Cloud Storage', color: '#0061FF' },
  'digitalocean.com':      { name: 'DigitalOcean',         category: 'Cloud Storage', color: '#0080FF' },
  'vercel.com':            { name: 'Vercel',               category: 'Cloud Storage', color: '#000000' },
  'heroku.com':            { name: 'Heroku',               category: 'Cloud Storage', color: '#430098' },
  'netlify.com':           { name: 'Netlify',              category: 'Cloud Storage', color: '#00C7B7' },
  'cloudflare.com':        { name: 'Cloudflare',           category: 'Cloud Storage', color: '#F38020' },
  'linode.com':            { name: 'Linode/Akamai',        category: 'Cloud Storage', color: '#00A95C' },
  'vultr.com':             { name: 'Vultr',                category: 'Cloud Storage', color: '#007BFC' },
  'render.com':            { name: 'Render',               category: 'Cloud Storage', color: '#46E3B7' },
  'railway.app':           { name: 'Railway',              category: 'Cloud Storage', color: '#0B0D0E' },
  'supabase.com':          { name: 'Supabase',             category: 'Cloud Storage', color: '#3ECF8E' },
  'mongodb.com':           { name: 'MongoDB Atlas',        category: 'Cloud Storage', color: '#4DB33D' },
  'backblaze.com':         { name: 'Backblaze',            category: 'Cloud Storage', color: '#E00000' },
  // Education
  'duolingo.com':          { name: 'Duolingo',             category: 'Education',     color: '#58CC02' },
  'coursera.org':          { name: 'Coursera',             category: 'Education',     color: '#0056D2' },
  'udemy.com':             { name: 'Udemy',                category: 'Education',     color: '#A435F0' },
  'linkedin.com':          { name: 'LinkedIn Premium',     category: 'Education',     color: '#0A66C2' },
  'skillshare.com':        { name: 'Skillshare',           category: 'Education',     color: '#00FF84' },
  'masterclass.com':       { name: 'MasterClass',          category: 'Education',     color: '#1C1C1C' },
  'pluralsight.com':       { name: 'Pluralsight',          category: 'Education',     color: '#F15B2A' },
  'edx.org':               { name: 'edX',                  category: 'Education',     color: '#02262B' },
  'brilliant.org':         { name: 'Brilliant',            category: 'Education',     color: '#FC6B02' },
  'khanacademy.org':       { name: 'Khan Academy',         category: 'Education',     color: '#14BF96' },
  'udacity.com':           { name: 'Udacity',              category: 'Education',     color: '#02B3E4' },
  'leetcode.com':          { name: 'LeetCode',             category: 'Education',     color: '#FFA116' },
  // Health & Fitness
  'calm.com':              { name: 'Calm',                 category: 'Health & Fitness', color: '#4A90D9' },
  'headspace.com':         { name: 'Headspace',            category: 'Health & Fitness', color: '#F47D31' },
  'strava.com':            { name: 'Strava',               category: 'Health & Fitness', color: '#FC4C02' },
  'fitbit.com':            { name: 'Fitbit Premium',       category: 'Health & Fitness', color: '#00B0B9' },
  'peloton.com':           { name: 'Peloton',              category: 'Health & Fitness', color: '#FF0000' },
  'noom.com':              { name: 'Noom',                 category: 'Health & Fitness', color: '#E35E3D' },
  'myfitnesspal.com':      { name: 'MyFitnessPal',         category: 'Health & Fitness', color: '#0094FF' },
  'whoop.com':             { name: 'WHOOP',                category: 'Health & Fitness', color: '#000000' },
  'eight.sleep':           { name: 'Eight Sleep',          category: 'Health & Fitness', color: '#5E5CE6' },
  // Finance
  'robinhood.com':         { name: 'Robinhood Gold',       category: 'Finance',       color: '#00C805' },
  'coinbase.com':          { name: 'Coinbase',             category: 'Finance',       color: '#0052FF' },
  'ynab.com':              { name: 'YNAB',                 category: 'Finance',       color: '#7AC143' },
  'personalcapital.com':   { name: 'Empower',              category: 'Finance',       color: '#0066CC' },
  // News & Media
  'nytimes.com':           { name: 'New York Times',       category: 'News & Media',  color: '#000000' },
  'wsj.com':               { name: 'Wall Street Journal',  category: 'News & Media',  color: '#004276' },
  'medium.com':            { name: 'Medium',               category: 'News & Media',  color: '#000000' },
  'substack.com':          { name: 'Substack',             category: 'News & Media',  color: '#FF6719' },
  'twitter.com':           { name: 'X Premium',            category: 'News & Media',  color: '#000000' },
  'x.com':                 { name: 'X Premium',            category: 'News & Media',  color: '#000000' },
  'washingtonpost.com':    { name: 'Washington Post',      category: 'News & Media',  color: '#000000' },
  'economist.com':         { name: 'The Economist',        category: 'News & Media',  color: '#E3120B' },
  'ft.com':                { name: 'Financial Times',      category: 'News & Media',  color: '#FFF1E5' },
  'theathletic.com':       { name: 'The Athletic',         category: 'News & Media',  color: '#000000' },
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

/**
 * Look up the SENDER_MAP by trying progressively shorter domain segments.
 * e.g. "billing.aws.amazon.com" tries:
 *   billing.aws.amazon.com → aws.amazon.com → amazon.com
 * This correctly resolves aws.amazon.com before falling back to amazon.com.
 */
function lookupSender(fromHeader: string) {
  const match = fromHeader.match(/@([\w.-]+)/);
  if (!match) return undefined;
  const parts = match[1].toLowerCase().split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (SENDER_MAP[candidate]) return SENDER_MAP[candidate];
  }
  return undefined;
}

/**
 * Extract a human-readable service name from the From header when the sender
 * is not in SENDER_MAP.
 * "Netflix Billing <no-reply@netflix.com>" → "Netflix"
 * "billing@someapp.com" → "Someapp"
 */
function extractServiceName(fromHeader: string): string {
  // Try display name portion before the angle bracket
  const displayMatch = fromHeader.match(/^"?([^"<@\n]+?)"?\s*</);
  if (displayMatch) {
    const raw = displayMatch[1].trim();
    // Strip common noise words to isolate the brand name
    const cleaned = raw
      .replace(/\b(?:no[_-]?reply|noreply|billing|receipts?|notifications?|alerts?|support|info|help|team|do[_-]not[_-]reply|automated|newsletter|updates?|news)\b/gi, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length >= 2) return cleaned;
  }
  // Fall back to the meaningful part of the domain (second-to-last label)
  const domainMatch = fromHeader.match(/@([\w.-]+)/);
  if (domainMatch) {
    const parts = domainMatch[1].split('.');
    const label = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return 'Unknown';
}

function extractAmount(text: string): number | null {
  const patterns = [
    // Symbol before number: $9.99  £9.99  €9.99  ₹999  ¥999
    /[\$£€₹¥]\s*([\d,]+(?:\.\d{1,2})?)/,
    // Rs. or Rs (Indian Rupee alternative notation)
    /\bRs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Compound symbols: S$ A$ C$ HK$ NZ$
    /\b[A-Z]{1,2}\$\s*([\d,]+(?:\.\d{1,2})?)/,
    // Number then currency code (USD, INR, EUR, etc.)
    /([\d,]+(?:\.\d{1,2})?)\s*(?:USD|GBP|EUR|INR|CAD|AUD|SGD|NZD|CHF|SEK|NOK|DKK|MXN|BRL|HKD|JPY|KRW|TWD|ZAR|AED|SAR|QAR|KWD|THB|MYR|IDR|PHP|VND|CZK|PLN|HUF|RON|BGN|HRK|RSD|UAH|ILS|TRY)\b/i,
    // Currency code then number
    /\b(?:USD|GBP|EUR|INR|CAD|AUD|SGD|NZD|CHF|SEK|NOK|DKK|MXN|BRL|HKD|JPY|KRW|TWD|ZAR|AED|SAR|THB|MYR|IDR|PHP|ILS|TRY)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Number immediately followed by /mo /month /yr /year /week
    /([\d,]+(?:\.\d{1,2})?)\s*\/\s*(?:mo(?:nth)?|yr|year|wk|week)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (val > 0 && val < 100_000) return val;
    }
  }
  return null;
}

function extractBillingCycle(text: string): BillingCycle {
  if (/\b(?:annual|annually|yearly|per\s+year|\/year|\/yr|1\s*year|12[\s-]month)\b/i.test(text)) return 'yearly';
  if (/\b(?:weekly|per\s+week|\/week|\/wk|every\s+week)\b/i.test(text)) return 'weekly';
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
  // Broad keyword search across the whole email (not just subject) to catch
  // more billing emails. Multiple OR terms maximise recall.
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

  // Fetch message details in batches of 20
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

export function parseEmailsToSubscriptions(emails: GmailMessageDetail[]): ParsedSubscription[] {
  const map = new Map<string, ParsedSubscription>();

  for (const email of emails) {
    const from    = getHeader(email.payload.headers, 'From');
    const subject = getHeader(email.payload.headers, 'Subject');
    const date    = getHeader(email.payload.headers, 'Date');
    const text    = `${subject} ${email.snippet}`;

    // Resolve service from SENDER_MAP (tries full subdomain path first)
    const knownService = lookupSender(from);

    // Always extract a name — fall back to display name / domain for unknowns
    const serviceName     = knownService?.name     ?? extractServiceName(from);
    const serviceCategory = knownService?.category ?? 'Other';
    const serviceColor    = knownService?.color    ?? '#6B7280';

    const amount = extractAmount(text);

    // For unknown senders we still require an amount to avoid false positives.
    // For known senders we can accept a zero/missing amount (plan may be free-tier or amount in body).
    if (!amount && !knownService) continue;

    const cycle = extractBillingCycle(text);
    const key   = `${serviceName}|${amount ?? 0}|${cycle}`;

    const emailDate = date
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Keep the most recent email per unique (service + amount + cycle)
    const existing = map.get(key);
    if (!existing || emailDate > existing.lastEmailDate) {
      map.set(key, {
        id: generateId(),
        name: serviceName,
        amount: amount ?? 0,
        billingCycle: cycle,
        category: serviceCategory,
        color: serviceColor,
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
