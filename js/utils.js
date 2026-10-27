// Petits utilitaires partagés par le site

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const euro = (n) => fmt.format(n);
// « 5 € » plutôt que « 5,00 € » quand le montant est rond
export const euroCourt = (n) => (Number.isInteger(n) ? `${n} €` : euro(n));

// « Plage de la Caravelle » → « plage de la Caravelle »
export const minusculeInitiale = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function esc(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let toastTimer;
export function toast(msg) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

// Grain de café (tampon de la carte fidélité / jauge du minimum)
export function beanSVG() {
  return `<svg viewBox="0 0 28 36" aria-hidden="true"><g class="bean__fill"><ellipse cx="14" cy="18" rx="11" ry="15" fill="currentColor"/></g><ellipse cx="14" cy="18" rx="11" ry="15" fill="none" stroke="currentColor" stroke-width="2.5"/><path class="bean__line" d="M14 4 C 8 12 20 24 14 32" fill="none" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}
export const giftSVG = () =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

// Distance en mètres entre deux points GPS (formule de haversine)
export function distanceMetres(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
