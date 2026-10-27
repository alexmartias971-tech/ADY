// ─────────────────────────────────────────────────────────────
//  Données du site : carte, réglages, commandes, suivi.
//  • Supabase (back-office /admin) dès que config.js est rempli ;
//  • sinon le mode démo (petite base dans le navigateur, js/demo-db.js).
//  Les prix sont toujours recalculés par la base au moment de la commande.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';

const cfg = () => window.ADY_CONFIG || {};
export const estDemo = () => !(cfg().supabaseUrl && cfg().supabaseAnonKey);

let clientP = null;
export function client() {
  if (!clientP) {
    clientP = (async () => {
      if (!estDemo()) {
        // bibliothèque Supabase hébergée sur le site (vendor/), chargée seulement quand elle sert
        if (!window.supabase) {
          await new Promise((ok, ko) => {
            const sc = document.createElement('script');
            sc.src = 'vendor/supabase/supabase.js';
            sc.onload = ok;
            sc.onerror = () => ko(new Error('La connexion à la carte a échoué. Recharge la page.'));
            document.head.appendChild(sc);
          });
        }
        return window.supabase.createClient(cfg().supabaseUrl, cfg().supabaseAnonKey);
      }
      return window.ADY_DEMO.createClient();
    })();
  }
  return clientP;
}

/* ── Catalogue ────────────────────────────────────────────── */
export const catalogue = {
  pret: false,
  reglages: {
    orders_open: true, beach_open: true, beach_min: 5, food_from: '11:00', food_to: '15:00', stamps_goal: 10,
    beach_lat: CONFIG.zone.centre.lat, beach_lng: CONFIG.zone.centre.lng, beach_radius: CONFIG.zone.rayonMetres, beach_photo_required: true,
  },
  categories: [],
  produits: [],
  choix: {},
};
const parId = new Map();

let chargement = null;
export function chargerCatalogue() {
  if (!chargement) chargement = charger();
  return chargement;
}

async function charger() {
  const sb = await client();
  const q = (t) => sb.from(t).select('*');
  const [c, p, v, g, ch, l, s] = await Promise.all([
    q('categories').order('sort'), q('products').eq('archived', false).order('sort'), q('product_variants').order('sort'),
    q('option_groups').order('sort'), q('option_choices').order('sort'), q('product_option_groups').order('sort'),
    sb.from('settings').select('*').eq('id', 1).single(),
  ]);
  const err = [c, p, v, g, ch, l].find((r) => r.error);
  if (err) throw new Error(err.error.message || 'La carte n’a pas pu se charger.');
  if (s.data) Object.assign(catalogue.reglages, s.data);

  const groupes = Object.fromEntries(g.data.map((x) => [x.id, x]));
  catalogue.choix = Object.fromEntries(ch.data.map((x) => [x.id, { id: x.id, groupe: x.group_id, label: x.label, delta: Number(x.price_delta), defaut: !!x.is_default, dispo: x.available !== false, sort: x.sort }]));
  const cats = Object.fromEntries(c.data.map((x) => [x.id, x]));

  catalogue.categories = c.data.map((x) => ({
    id: x.id, titre: x.title, kind: x.kind, signature: x.signature_label, heures: x.hours, note: x.footnote, sort: x.sort,
  }));
  catalogue.produits = p.data.map((x) => {
    const variantes = v.data.filter((y) => y.product_id === x.id).map((y) => ({ id: y.id, label: y.label, epuise: y.stock === 0 }));
    const groupesP = l.data.filter((y) => y.product_id === x.id && groupes[y.group_id])
      .sort((a, b) => groupes[a.group_id].sort - groupes[b.group_id].sort)
      .map((y) => ({
        id: y.group_id,
        nom: groupes[y.group_id].name,
        choix: Object.values(catalogue.choix).filter((z) => z.groupe === y.group_id && z.dispo).sort((a, b) => a.sort - b.sort),
      }))
      .filter((gr) => gr.choix.length);
    const epuise = !x.available || x.stock === 0 || (variantes.length > 0 && variantes.every((y) => y.epuise));
    return {
      id: x.id, nom: x.name, desc: x.description || '', prix: Number(x.price), cat: x.category_id, kind: cats[x.category_id]?.kind || 'drink',
      glace: !!x.iced, signature: !!x.signature, vedette: !!x.featured, badge: x.badge || null, image: x.image || null, allergenes: x.allergens || null,
      variantes, groupes: groupesP, epuise, sort: x.sort,
    };
  });
  parId.clear();
  catalogue.produits.forEach((pr) => parId.set(pr.id, pr));
  catalogue.pret = true;
  return catalogue;
}

export const trouverProduit = (id) => parId.get(id);
export const zone = () => ({ centre: { lat: catalogue.reglages.beach_lat, lng: catalogue.reglages.beach_lng }, rayonMetres: catalogue.reglages.beach_radius, nom: CONFIG.zone.nom });

// Choix par défaut d'un produit (un par groupe), ex. « Chaud », « Lait de vache »
export function choixParDefaut(p) {
  return p.groupes.map((gr) => (gr.choix.find((c) => c.defaut) || gr.choix[0]).id);
}

export function prixUnitaire(pid, opts = []) {
  const p = parId.get(pid);
  if (!p) return 0;
  return Math.round((p.prix + opts.reduce((s, id) => s + (catalogue.choix[id]?.delta || 0), 0)) * 100) / 100;
}

export function libelleOptions(pid, opts = [], vid = null) {
  const p = parId.get(pid);
  const out = opts.map((id) => catalogue.choix[id]).filter((c) => c && !c.defaut).map((c) => c.label);
  if (vid && p) {
    const v = p.variantes.find((x) => x.id === vid);
    if (v) out.unshift(`Taille ${v.label}`);
  }
  return out.join(', ');
}

// La boisson est-elle servie glacée ? (choix « Glacé » ou recette froide par nature)
export function estGlace(p, opts = []) {
  const temp = opts.map((id) => catalogue.choix[id]).find((c) => c?.groupe === 'temperature');
  if (temp) return /^glac/i.test(temp.label);
  return /^(iced|.*tonic|affogato|citronnade|thé glacé|jus)/i.test(p.nom);
}

/* ── Horaires du salé (heure de Guadeloupe) ───────────────── */
function heureGuadeloupe() {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'America/Guadeloupe', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}
const hm = (t) => String(t || '').slice(0, 5);
export const plageSale = () => `${hm(catalogue.reglages.food_from).replace(':', 'h')} – ${hm(catalogue.reglages.food_to).replace(':', 'h')}`.replace(/h00/g, 'h');
export function enService(p) {
  if (p.kind !== 'food') return true;
  const t = heureGuadeloupe();
  return t >= hm(catalogue.reglages.food_from) && t <= hm(catalogue.reglages.food_to);
}

/* ── Commande & suivi ─────────────────────────────────────── */
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));

export async function envoyerPhoto(blob) {
  const sb = await client();
  const chemin = `${uuid()}.jpg`;
  const r = await sb.storage.from('spots').upload(chemin, blob, { contentType: 'image/jpeg' });
  if (r.error) throw new Error(r.error.message || 'La photo n’a pas pu être envoyée.');
  return chemin;
}

export async function passerCommande(payload) {
  const sb = await client();
  const { data, error } = await sb.rpc('place_order', { p: payload });
  if (error) throw new Error(error.message || 'La commande n’est pas partie.');
  return data; // { number, token, total, discount }
}

export async function statutCommande(token) {
  const sb = await client();
  const { data } = await sb.rpc('order_status', { p_token: token });
  return data; // { number, status, mode, total, created_at }
}
