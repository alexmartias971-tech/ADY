// Point d'entrée commun à toutes les pages
import { initUI } from './ui.js';

const pages = {
  home: () => import('./pages/home.js'),
  carte: () => import('./pages/carte.js'),
  livraison: () => import('./pages/livraison.js'),
  fidelite: () => import('./pages/fidelite.js'),
  'le-shop': () => import('./pages/shop.js'),
};

initUI().then(() => pages[document.body.dataset.page]?.()).then((m) => m?.init());
