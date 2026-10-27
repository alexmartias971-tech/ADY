// Panier, sauvegardé dans le navigateur (localStorage)
import { OPTIONS, trouverProduit, prixLigne } from './menu.js';

const KEY = 'ady-panier-v1';
const abonnes = new Set();

function normaliserChoix(produit, choix = {}) {
  const out = {};
  for (const g of produit.options || []) {
    const def = OPTIONS[g];
    out[g] = def.choix.some((c) => c.id === choix[g]) ? choix[g] : def.choix[0].id;
  }
  return out;
}

const cle = (id, choix) => `${id}|${Object.keys(choix).sort().map((k) => `${k}=${choix[k]}`).join(',')}`;

function lire() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((l) => {
      const p = trouverProduit(l.id);
      return p && p.dispo !== false && Number.isInteger(l.qty) && l.qty > 0;
    }).map((l) => {
      const p = trouverProduit(l.id);
      const choix = normaliserChoix(p, l.choix);
      return { cle: cle(l.id, choix), id: l.id, choix, qty: Math.min(l.qty, 20) };
    });
  } catch {
    return [];
  }
}

let lignes = lire();

function changer() {
  try { localStorage.setItem(KEY, JSON.stringify(lignes)); } catch { /* navigation privée : tant pis */ }
  abonnes.forEach((fn) => fn());
}

export const panier = {
  lignes: () => lignes,
  ajouter(id, choix = {}, qty = 1) {
    const p = trouverProduit(id);
    if (!p || p.dispo === false) return;
    const c = normaliserChoix(p, choix);
    const k = cle(id, c);
    const ligne = lignes.find((l) => l.cle === k);
    if (ligne) ligne.qty = Math.min(20, ligne.qty + qty);
    else lignes.push({ cle: k, id, choix: c, qty: Math.min(20, qty) });
    changer();
  },
  setQty(k, qty) {
    const ligne = lignes.find((l) => l.cle === k);
    if (!ligne) return;
    if (qty <= 0) lignes = lignes.filter((l) => l.cle !== k);
    else ligne.qty = Math.min(20, qty);
    changer();
  },
  vider() {
    lignes = [];
    changer();
  },
  nb: () => lignes.reduce((s, l) => s + l.qty, 0),
  qtyProduit: (id) => lignes.filter((l) => l.id === id).reduce((s, l) => s + l.qty, 0),
  prixUnitaire: (l) => prixLigne(trouverProduit(l.id), l.choix),
  sousTotal() {
    const t = lignes.reduce((s, l) => s + prixLigne(trouverProduit(l.id), l.choix) * l.qty, 0);
    return Math.round(t * 100) / 100;
  },
  onChange: (fn) => abonnes.add(fn),
};
