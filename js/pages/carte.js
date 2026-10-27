// La carte : sections par catégorie, navigation collante qui suit la lecture, panier latéral
import { CONFIG } from '../config.js';
import { PRODUITS, CATEGORIES, trouverProduit, libelleOptions } from '../menu.js';
import { carteProduit, brancherCartes } from '../produits.js';
import { panier } from '../cart.js';
import { ouvrirPanneau } from '../checkout.js';
import { icon } from '../icons.js';
import { pauserHorsEcran } from '../ui.js';
import { $, $$, euro, euroCourt, esc, reduceMotion } from '../utils.js';

export function init() {
  const menu = $('[data-menu]');
  const nav = $('[data-catnav]');
  const cats = CATEGORIES.filter((c) => PRODUITS.some((p) => p.cat === c.id));

  nav.innerHTML = cats.map((c) => `<a href="#cat-${c.id}" data-cat="${c.id}">${esc(c.label)}</a>`).join('');
  menu.innerHTML = cats.map((c) => `<section class="cat-section" id="cat-${c.id}" data-section="${c.id}">
      <div class="cat-section__head"><h2>${esc(c.label)}</h2>${c.accroche ? `<p>${esc(c.accroche)}</p>` : ''}</div>
      <div class="pgrid">${PRODUITS.filter((p) => p.cat === c.id).map((p, i) => carteProduit(p, { i })).join('')}</div>
    </section>`).join('');
  brancherCartes(menu);
  pauserHorsEcran($$('.pcard', menu));

  // navigation par catégorie
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-cat]');
    if (!a) return;
    e.preventDefault();
    $(`#cat-${a.dataset.cat}`).scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#cat-${a.dataset.cat}`);
  });
  const activer = (id) => {
    $$('a', nav).forEach((a) => {
      const on = a.dataset.cat === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      if (on) nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2, behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  };
  // section active = la dernière dont le haut a passé le tiers de l'écran
  const sections = $$('[data-section]', menu);
  let courant = null;
  let raf = null;
  const suivre = () => {
    raf = null;
    const ligne = window.innerHeight * 0.35;
    let actif = sections[0];
    for (const sec of sections) if (sec.getBoundingClientRect().top <= ligne) actif = sec;
    if (actif && actif.dataset.section !== courant) {
      courant = actif.dataset.section;
      activer(courant);
    }
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(suivre); }, { passive: true });
  suivre();

  // panier latéral (ordinateur)
  const aside = $('[data-cart-aside]');
  const majAside = () => {
    const lignes = panier.lignes();
    const st = panier.sousTotal();
    const min = CONFIG.commandeMinimum;
    if (!lignes.length) {
      aside.innerHTML = `<h2>Ton panier</h2><p class="cart-aside__empty">Il est vide pour l’instant. Ajoute une boisson avec le bouton ${icon('plus')}.</p>`;
      return;
    }
    aside.innerHTML = `<h2>Ton panier</h2>
      <ul class="mini-lines">${lignes.map((l) => {
        const p = trouverProduit(l.id);
        const o = libelleOptions(p, l.choix);
        return `<li><span class="qty">${l.qty}×</span><span>${esc(p.nom)}${o ? `<small>${esc(o)}</small>` : ''}</span><span>${euro(panier.prixUnitaire(l) * l.qty)}</span></li>`;
      }).join('')}</ul>
      <div class="totals"><div class="totals__grand"><span>Total</span><span>${euro(st + CONFIG.fraisLivraison)}</span></div></div>
      ${st < min ? `<p class="form-error" style="margin:0 0 12px">Encore ${euro(min - st)} pour le minimum de ${euroCourt(min)}.</p>` : ''}
      <button class="btn btn--block" type="button" data-checkout ${st < min ? 'disabled' : ''}>Valider ma commande ${icon('arrow', 'icon--arrow')}</button>
      <button class="link-arrow" type="button" data-open-cart style="margin-top:14px">Modifier le panier</button>`;
  };
  aside.addEventListener('click', (e) => { if (e.target.closest('[data-checkout]')) ouvrirPanneau(2); });
  panier.onChange(majAside);
  majAside();
}
