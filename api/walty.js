// Vercel : /api/walty
// Lit la carte fidélité Walty du shop pour l'onglet « Clients » du back-office.
// Réservé au gérant (vérifié auprès de Supabase) ; la clé Walty reste ici, côté serveur.
// Variables à définir dans Vercel → Settings → Environment Variables :
//   WALTY_API_URL, WALTY_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY
// Réponse attendue de Walty (GET {WALTY_API_URL}/clients) : voir README, « Relier Walty ».
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { WALTY_API_URL, WALTY_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!WALTY_API_URL || !WALTY_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ erreur: 'Walty pas encore relié' });
  }
  const jeton = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!jeton || jeton === 'null' || jeton === 'undefined') return res.status(401).json({ erreur: 'Connexion requise' });

  try {
    // le jeton de connexion doit être celui d'un gérant
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mon_role`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    const role = r.ok ? await r.json() : null;
    if (role !== 'gerant') return res.status(403).json({ erreur: 'Réservé au gérant' });

    const w = await fetch(`${WALTY_API_URL.replace(/\/$/, '')}/clients`, {
      headers: { Authorization: `Bearer ${WALTY_API_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!w.ok) return res.status(502).json({ erreur: 'Walty ne répond pas' });
    const d = await w.json();
    // seulement ce qui sert à l'écran
    const clients = (Array.isArray(d.clients) ? d.clients : []).slice(0, 5000).map((c) => ({
      prenom: String(c.prenom || ''), nom: String(c.nom || ''), telephone: String(c.telephone || ''),
      tampons: Number(c.tampons) || 0, cadeaux: Number(c.cadeaux) || 0, derniere_visite: c.derniere_visite || null,
    }));
    return res.status(200).json({ objectif: Number(d.objectif) || null, stats: d.stats || null, clients });
  } catch (e) {
    return res.status(502).json({ erreur: 'Walty ne répond pas' });
  }
};
