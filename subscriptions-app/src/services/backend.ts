import type { GoogleUser, Subscription } from '../types';

// All API calls go to Vercel serverless functions in /api/
const API = '/api';

/** Called on every login. Upserts the user in DB and returns their saved subscriptions.
 *  Returns { subscriptions, isNewUser } — isNewUser=true means first-ever login (no DB data). */
export async function loginToBackend(
  user: GoogleUser
): Promise<{ subscriptions: Subscription[]; isNewUser: boolean }> {
  const res = await fetch(`${API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, name: user.name, picture: user.picture }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Backend auth failed (${res.status})`);
  }
  return res.json() as Promise<{ subscriptions: Subscription[]; isNewUser: boolean }>;
}

/** Upsert one or more subscriptions to the backend DB. Fire-and-forget safe. */
export async function syncSubscriptions(userEmail: string, subs: Subscription[]): Promise<void> {
  if (!subs.length) return;
  await fetch(`${API}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
    body: JSON.stringify({ subscriptions: subs }),
  });
}

/** Delete a single subscription from the backend DB. Fire-and-forget safe. */
export async function deleteFromBackend(userEmail: string, id: string): Promise<void> {
  await fetch(`${API}/subscriptions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-user-email': userEmail },
  });
}
