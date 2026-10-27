// Éléments communs à toutes les pages : en-tête, menu mobile, textes pilotés
// par config.js, statut d'ouverture, panier, apparitions au défilement.
import { CONFIG } from './config.js';
import { trouverProduit } from './menu.js';
import { illustration, defsGlobales } from './illustrations.js';
import { panier } from './cart.js';
import { etatOuverture, JOURS, heure } from './horaires.js';
import { icon, hydrateIcons } from './icons.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale } from './utils.js';
import { initCheckout, ouvrirPanneau } from './checkout.js';

export function initUI() {
  document.documentElement.classList.remove('no-js');
  document.body.insertAdjacentHTML('afterbegin', defsGlobales());

  // Textes issus de la configuration
  $$('[data-min-order]').forEach((el) => (el.textContent = euroCourt(CONFIG.commandeMinimum)));
  $$('[data-delay]').forEach((el) => (el.textContent = CONFIG.delaiLivraison));
  $$('[data-zone-name]').forEach((el) => (el.textContent = minusculeInitiale(CONFIG.zone.nom)));
  $$('[data-address]').forEach((el) => (el.textContent = CONFIG.adresse));
  $$('[data-directions]').forEach((el) => (el.href = CONFIG.lienItineraire));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  $$('[data-fees]').forEach((el) => {
    el.textContent = CONFIG.fraisLivraison
      ? `Elle coûte ${euro(CONFIG.fraisLivraison)}, ajoutés au total de ta commande.`
      : 'Non, elle est offerte dès le minimum de commande.';
  });
  $$('[data-ill]').forEach((el) => {
    const p = trouverProduit(el.dataset.ill);
    if (p) el.innerHTML = illustration(p);
  });

  hydrateIcons();
  initEntete();
  initStatut();
  initContact();
  initReveal();
  initPanier();
  initCheckout();
}

/* ── En-tête & menu mobile ───────────────────────────────── */
function initEntete() {
  const header = $('#site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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

/* ── Liens de contact (selon ce qui est renseigné) ─────────── */
function initContact() {
  const liens = [];
  if (CONFIG.telephone) liens.push(`<a class="btn btn--sm" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} ${esc(CONFIG.telephone)}</a>`);
  if (CONFIG.whatsapp) liens.push(`<a class="btn btn--sm btn--dark" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">${icon('chat')} WhatsApp</a>`);
  if (CONFIG.instagram) liens.push(`<a class="btn btn--sm btn--dark" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">${icon('insta')} Instagram</a>`);
  $$('[data-contact]').forEach((el) => {
    el.innerHTML = liens.length ? liens.join('') : '<p class="muted" style="margin:0">Passe directement au shop, ou commande en ligne si tu es sur la plage.</p>';
  });
  $$('[data-insta]').forEach((el) => {
    el.innerHTML = CONFIG.instagram ? `<a href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram</a>` : '';
    if (!CONFIG.instagram) el.remove();
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
    el.style.setProperty('--delay', `${Math.min(freres.indexOf(el), 5) * 0.09}s`);
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

/* ── Panier : compteurs, barre mobile ─────────────────────── */
function initPanier() {
  document.body.insertAdjacentHTML('beforeend', `<button class="cartbar" type="button" data-cartbar data-open-cart hidden>
      <span class="cartbar__count" data-cart-count>0</span>
      <span class="cartbar__label">Mon panier</span>
      <span class="cartbar__total" data-cart-total>0,00 €</span>
    </button>`);
  const maj = () => {
    const n = panier.nb();
    $$('[data-cart-count]').forEach((el) => (el.textContent = n));
    $$('[data-cart-total]').forEach((el) => (el.textContent = euro(panier.sousTotal())));
    $('[data-cartbar]').hidden = n === 0;
  };
  panier.onChange(maj);
  maj();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) ouvrirPanneau(1);
  });
}
