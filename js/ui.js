// Éléments communs à toutes les pages : en-tête, menu mobile, statut d'ouverture,
// panier, suivi de commande, apparitions au défilement, effet 3D.
import { CONFIG } from './config.js';
import { chargerCatalogue, catalogue, estDemo } from './data.js';
import { illustration, defsGlobales } from './illustrations.js';
import { panier, nettoyerPanier } from './cart.js';
import { etatOuverture, JOURS, heure } from './horaires.js';
import { icon, hydrateIcons } from './icons.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale, toast, pointeurFin, reduceMotion } from './utils.js';
import { initCheckout, ouvrirPanneau } from './checkout.js';

export async function initUI() {
  document.documentElement.classList.remove('no-js');
  document.body.insertAdjacentHTML('afterbegin', defsGlobales());
  // tant que la base n'est pas branchée, on le dit clairement : rien n'est préparé ni livré
  if (estDemo()) document.body.insertAdjacentHTML('afterbegin', '<p class="demo-bar" role="note"><b>Site de démonstration</b> · les commandes ne sont ni préparées ni livrées. <a href="mentions-legales">En savoir plus</a></p>');
  hydrateIcons();
  initEntete();
  initStatut();
  initContact();
  initReveal();
  textes();

  try {
    await chargerCatalogue();
    nettoyerPanier();
  } catch (e) {
    console.error(e);
    toast('La carte n’a pas pu se charger. Réessaie dans un instant.');
  }
  textes();
  $$('[data-ill]').forEach((el) => {
    const p = catalogue.produits.find((x) => x.nom === el.dataset.ill);
    if (p) el.innerHTML = illustration(p, { glace: el.dataset.glace ? el.dataset.glace === '1' : undefined });
  });
  initPanier();
  initCheckout();
  initModes();
  initTilt();
}

// Textes issus de la configuration et des réglages du back-office
function textes() {
  const min = Number(catalogue.reglages.beach_min ?? CONFIG.commandeMinimum);
  $$('[data-min-order]').forEach((el) => (el.textContent = euroCourt(min)));
  $$('[data-delay]').forEach((el) => (el.textContent = CONFIG.delaiLivraison));
  $$('[data-zone-name]').forEach((el) => (el.textContent = minusculeInitiale(CONFIG.zone.nom)));
  $$('[data-address]').forEach((el) => (el.textContent = CONFIG.adresse));
  $$('[data-directions]').forEach((el) => (el.href = CONFIG.lienItineraire));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  $$('[data-insta-link]').forEach((el) => { el.href = CONFIG.instagram; el.hidden = !CONFIG.instagram; });
  $$('[data-insta-pseudo]').forEach((el) => (el.textContent = CONFIG.instagramPseudo || 'Instagram'));
  $$('[data-proof]').forEach((el) => { el.textContent = CONFIG.preuveSociale || ''; el.hidden = !CONFIG.preuveSociale; });
  $$('[data-fees]').forEach((el) => {
    el.textContent = CONFIG.fraisLivraison
      ? `Elle coûte ${euro(CONFIG.fraisLivraison)}, ajoutés au total de ta commande.`
      : 'Non, elle est offerte dès le minimum de commande.';
  });
}

/* ── En-tête & menu mobile ───────────────────────────────── */
function initEntete() {
  const header = $('#site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  // pastille « commande en cours »
  $('.site-header__actions')?.insertAdjacentHTML('afterbegin', '<button class="track-pill" type="button" data-track-pill hidden></button>');

  const burger = $('[data-burger]');
  const menu = $('#mobile-menu');
  if (!burger || !menu) return;
  const basculer = (ouvrir) => {
    burger.setAttribute('aria-expanded', String(ouvrir));
    burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !ouvrir;
    document.documentElement.style.overflow = ouvrir ? 'hidden' : '';
    header.classList.toggle('is-scrolled', ouvrir || window.scrollY > 24);
  };
  burger.addEventListener('click', () => basculer(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) basculer(false); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) basculer(false); });
}

/* ── Statut ouvert / fermé + horaires ─────────────────────── */
function initStatut() {
  const maj = () => {
    const etat = etatOuverture(CONFIG);
    $$('[data-status]').forEach((el) => {
      el.hidden = false;
      el.textContent = etat.texte;
      el.classList.toggle('is-open', etat.ouvert);
      el.classList.toggle('is-closed', !etat.ouvert);
    });
    const ordre = [1, 2, 3, 4, 5, 6, 0];
    $$('[data-hours]').forEach((ul) => {
      ul.innerHTML = ordre.map((j) => {
        const p = CONFIG.horaires[j];
        return `<li class="${j === etat.jour ? 'is-today' : ''}"><span>${JOURS[j]}</span><span>${p ? `${heure(p[0])} – ${heure(p[1])}` : 'Fermé'}</span></li>`;
      }).join('');
    });
  };
  maj();
  setInterval(maj, 60000);
}

/* ── Liens de contact ─────────────────────────────────────── */
function initContact() {
  const liens = [];
  if (CONFIG.telephone) liens.push(`<a class="btn btn--sm" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} ${esc(CONFIG.telephone)}</a>`);
  if (CONFIG.whatsapp) liens.push(`<a class="btn btn--sm btn--dark" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">${icon('chat')} WhatsApp</a>`);
  if (CONFIG.instagram) liens.push(`<a class="btn btn--sm btn--dark" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">${icon('insta')} ${esc(CONFIG.instagramPseudo || 'Instagram')}</a>`);
  $$('[data-contact]').forEach((el) => {
    el.innerHTML = liens.length ? liens.join('') : '<p class="muted" style="margin:0">Passe directement au shop, ou commande en ligne.</p>';
  });
  $$('[data-insta]').forEach((el) => {
    if (CONFIG.instagram) el.innerHTML = `<a href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram ${esc(CONFIG.instagramPseudo || '')}</a>`;
    else el.remove();
  });
}

/* ── Apparitions au défilement ────────────────────────────── */
let revealObs = null;
export function initReveal(root = document) {
  if (!revealObs) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  $$('.reveal:not(.is-in)', root).forEach((el) => {
    const freres = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--delay', `${Math.min(freres.indexOf(el), 5) * 0.08}s`);
    revealObs.observe(el);
  });
}

// Met en pause les animations des illustrations hors de l'écran
const pauseObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => en.target.classList.toggle('is-paused', !en.isIntersecting));
}, { rootMargin: '120px' });
export function pauserHorsEcran(els) {
  els.forEach((el) => pauseObs.observe(el));
}

/* ── Effet 3D : les cartes s'inclinent sous la souris ─────── */
export function initTilt(root = document) {
  if (!pointeurFin() || reduceMotion()) return;
  $$('[data-tilt]:not([data-tilt-on])', root).forEach((el) => {
    el.dataset.tiltOn = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tx', `${(-y * 10).toFixed(2)}deg`);
      el.style.setProperty('--ty', `${(x * 12).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(0)}%`);
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
      el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(0)}%`);
      el.classList.add('is-tilting');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
      el.style.setProperty('--mx', '0');
      el.style.setProperty('--my', '0');
    });
  });
}

/* ── Liens « livré sur la plage » / « je passe au shop » ──── */
function initModes() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-set-mode]');
    if (a) panier.setMode(a.dataset.setMode);
  });
}

/* ── Panier : compteurs, barre mobile ─────────────────────── */
function initPanier() {
  document.body.insertAdjacentHTML('beforeend', `<button class="cartbar" type="button" data-cartbar data-open-cart hidden>
      <span class="cartbar__count" data-cart-count>0</span>
      <span class="cartbar__label">Mon panier<small data-cartbar-mode></small></span>
      <span class="cartbar__total" data-cart-total>0,00 €</span>
    </button>`);
  const maj = () => {
    const n = panier.nb();
    $$('[data-cart-count]').forEach((el) => (el.textContent = n));
    $$('[data-cart-total]').forEach((el) => (el.textContent = euro(panier.sousTotal())));
    $$('[data-cartbar-mode]').forEach((el) => (el.textContent = panier.mode === 'plage' ? 'Livré sur la plage' : 'Retrait au shop'));
    $('[data-cartbar]').hidden = n === 0;
  };
  panier.onChange(maj);
  maj();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) ouvrirPanneau(1);
  });
}
