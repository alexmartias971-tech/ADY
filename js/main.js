// Point d'entrée commun à toutes les pages
import { initUI } from './ui.js';

// Écran de chargement : il reste au moins un court instant (le temps de voir les grains se remplir),
// puis remonte comme un store pour dévoiler la page.
const debut = performance.now();
const MINI = 900;

function fermerLoader() {
  const el = document.querySelector('[data-loader]');
  try { sessionStorage.setItem('ady-vu', '1'); } catch (e) { /* */ }
  if (!el || document.documentElement.classList.contains('deja-vu')) { el?.remove(); return; }
  const attente = Math.max(0, MINI - (performance.now() - debut));
  setTimeout(() => {
    el.classList.add('is-done');
    const fin = () => el.remove();
    el.addEventListener('transitionend', fin, { once: true });
    setTimeout(fin, 1400);
  }, attente);
}

// Script propre à chaque page (body data-page="…"), tous dans pages.js
const pages = { home: 'initHome', carte: 'initCarte', livraison: 'initLivraison', fidelite: 'initFidelite', 'le-shop': 'initShop' };
const init = pages[document.body.dataset.page];

initUI()
  .then(() => (init ? import('./pages.js') : null))
  .then((m) => m?.[init]())
  .catch((e) => console.error(e))
  .finally(fermerLoader);
