// Petits utilitaires partagés
import { icon } from './icons.js';

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
export const pointeurFin = () => window.matchMedia('(pointer: fine)').matches;

let toastTimer;
export function toast(msg) {
  let el = $('[data-toast]');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.dataset.toast = '';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.innerHTML = `${icon('check')}<span>${esc(msg)}</span>`;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

// Grain de café (tampons de la carte fidélité, jauge du minimum)
export function beanSVG() {
  return '<svg viewBox="0 0 28 36" aria-hidden="true"><ellipse class="bean__fill" cx="14" cy="18" rx="11" ry="15" fill="currentColor"/><ellipse cx="14" cy="18" rx="11" ry="15" fill="none" stroke="currentColor" stroke-width="2.5"/><path class="bean__line" d="M14 4 C 8 12 20 24 14 32" fill="none" stroke-width="2.5" stroke-linecap="round"/></svg>';
}

// Distance en mètres entre deux points GPS (haversine)
export function distanceMetres(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Observe l'entrée d'un élément dans l'écran une seule fois
export function quandVisible(el, fn, options = { rootMargin: '200px' }) {
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      fn();
    }
  }, options);
  io.observe(el);
}
