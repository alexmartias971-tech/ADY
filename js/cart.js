// Panier (gardé dans le navigateur) + mode de commande (« plage » ou « shop ») + point de livraison choisi
import { trouverProduit, prixUnitaire, catalogue, trouverPoint } from './data.js';

const KEY = 'ady-panier-v3';
const KEY_MODE = 'ady-mode';
const KEY_POINT = 'ady-point';
const abonnes = new Set();

const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* navigation privée */ } };

let lignes = lire(KEY, []);
let mode = lire(KEY_MODE, 'plage') === 'shop' ? 'shop' : 'plage';
let point = lire(KEY_POINT, null);

const cle = (pid, opts, vid) => `${pid}|${[...opts].sort().join(',')}|${vid || ''}`;
const prevenir = () => abonnes.forEach((fn) => fn());
function sauver() { ecrire(KEY, lignes); prevenir(); }

// Une fois la carte chargée : on retire ce qui n'existe plus ou n'est plus en vente
export function nettoyerPanier() {
  const avant = lignes.length;
  lignes = lignes.filter((l) => {
    const p = trouverProduit(l.pid);
    return p && !p.epuise && l.opts.every((id) => catalogue.choix[id]) && (!p.variantes.length || p.variantes.some((v) => v.id === l.vid && !v.epuise));
  });
  // point de livraison retiré ou désactivé entre-temps : on l'oublie
  if (point && !trouverPoint(point)) { point = null; ecrire(KEY_POINT, null); }
  if (lignes.length !== avant) sauver(); else prevenir();
}

export const panier = {
  lignes: () => lignes.filter((l) => trouverProduit(l.pid)),
  get mode() { return mode; },
  setMode(m) {
    mode = m === 'shop' ? 'shop' : 'plage';
    ecrire(KEY_MODE, mode);
    prevenir();
  },
  // point de livraison sur la plage (id), mémorisé pour la prochaine commande
  get point() { return point; },
  setPoint(id) {
    point = id || null;
    ecrire(KEY_POINT, point);
    prevenir();
  },
  ajouter(pid, opts = [], vid = null, qty = 1) {
    const k = cle(pid, opts, vid);
    const l = lignes.find((x) => x.cle === k);
    if (l) l.qty = Math.min(20, l.qty + qty);
    else lignes.push({ cle: k, pid, opts: [...opts], vid, qty: Math.min(20, qty) });
    sauver();
  },
  setQty(k, qty) {
    const l = lignes.find((x) => x.cle === k);
    if (!l) return;
    if (qty <= 0) lignes = lignes.filter((x) => x.cle !== k);
    else l.qty = Math.min(20, qty);
    sauver();
  },
  vider() { lignes = []; sauver(); },
  nb: () => panier.lignes().reduce((s, l) => s + l.qty, 0),
  qtyProduit: (pid) => lignes.filter((l) => l.pid === pid).reduce((s, l) => s + l.qty, 0),
  prixLigne: (l) => prixUnitaire(l.pid, l.opts) * l.qty,
  sousTotal: () => Math.round(panier.lignes().reduce((s, l) => s + prixUnitaire(l.pid, l.opts) * l.qty, 0) * 100) / 100,
  onChange: (fn) => abonnes.add(fn),
};
