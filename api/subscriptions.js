const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toDbRow(sub, userEmail) {
  return {
    id: sub.id,
    user_id: userEmail,
    name: sub.name,
    amount: sub.amount,
    billing_cycle: sub.billingCycle,
    next_renewal: sub.nextRenewal,
    category: sub.category,
    color: sub.color,
    logo: sub.logo ?? null,
    active: sub.active,
    notes: sub.notes ?? null,
    source: sub.source ?? 'manual',
    updated_at: new Date().toISOString(),
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userEmail = req.headers['x-user-email'];
  if (!userEmail) return res.status(401).json({ error: 'Missing x-user-email header' });

  // GET — load all subscriptions for user
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const subscriptions = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      billingCycle: row.billing_cycle,
      nextRenewal: row.next_renewal,
      category: row.category,
      color: row.color,
      logo: row.logo ?? undefined,
      active: row.active,
      notes: row.notes ?? undefined,
      source: row.source ?? 'manual',
    }));

    return res.json({ subscriptions });
  }

  // POST — upsert one or many subscriptions
  if (req.method === 'POST') {
    const body = req.body ?? {};
    const items = Array.isArray(body.subscriptions) ? body.subscriptions : body.subscription ? [body.subscription] : null;

    if (!items) return res.status(400).json({ error: 'Body must include "subscriptions" array or "subscription" object' });

    const rows = items.map((s) => toDbRow(s, userEmail));
    const { error } = await supabase.from('subscriptions').upsert(rows, { onConflict: 'id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, synced: rows.length });
  }

  // DELETE — remove a subscription by id
  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing ?id= query param' });

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userEmail); // enforce ownership

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
