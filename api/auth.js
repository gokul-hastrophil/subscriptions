const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, picture } = req.body ?? {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Upsert user record (creates on first login, updates on subsequent logins)
  const { error: userError } = await supabase
    .from('users')
    .upsert(
      { id: email, email, name: name ?? '', picture: picture ?? '', updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (userError) {
    console.error('User upsert error:', userError);
    return res.status(500).json({ error: userError.message });
  }

  // Load their saved subscriptions from DB
  const { data: subs, error: subsError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', email)
    .order('created_at', { ascending: true });

  if (subsError) {
    console.error('Subscriptions load error:', subsError);
    return res.status(500).json({ error: subsError.message });
  }

  // Convert DB rows to frontend format
  const subscriptions = (subs ?? []).map((row) => ({
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

  res.json({ subscriptions, isNewUser: (subs ?? []).length === 0 });
};
