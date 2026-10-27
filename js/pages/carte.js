// La carte, façon ardoise du shop : une section par catégorie, les signatures encadrées
// comme sur les écrans au-dessus du comptoir, la navigation collante et le panier à droite.
import { CONFIG } from '../config.js';
import { catalogue, trouverProduit, libelleOptions, plageSale, enService } from '../data.js';
import { ligneProduit, carteProduit, brancherCartes, ton } from '../produits.js';
import { panier } from '../cart.js';
import { ouvrirPanneau } from '../checkout.js';
import { illustration } from '../illustrations.js';
import { icon } from '../icons.js';
import { pauserHorsEcran, initTilt, initReveal } from '../ui.js';
import { $, $$, euro, euroCourt, esc, reduceMotion } from '../utils.js';

export function init() {
  const menu = $('[data-menu]');
  const nav = $('[data-catnav]');
  const cats = catalogue.categories.filter((c) => catalogue.produits.some((p) => p.cat === c.id));

  nav.innerHTML = cats.map((c) => `<a href="#cat-${c.id}" data-cat="${c.id}">${esc(c.titre)}</a>`).join('');
  menu.innerHTML = cats.map(section).join('');
  brancherCartes(menu);
  pauserHorsEcran($$('.mrow__art, .pcard', menu));
  initTilt(menu);
  initReveal(menu);
  modes();
  navigation(nav, menu);
  aside();
}

function section(c) {
  const produits = catalogue.produits.filter((p) => p.cat === c.id);
  if (c.kind === 'merch') {
    return `<section class="cat-section cat-section--merch" id="cat-${c.id}" data-section="${c.id}">
      <header class="cat-head"><h2>${esc(c.titre)}</h2><p>Réserve ta taille&nbsp;: récupère-le au comptoir, ou il arrive sur la plage avec ta boisson.</p></header>
      <div class="pgrid pgrid--merch">${produits.map((p, i) => carteProduit(p, { i })).join('')}</div>
    </section>`;
  }
  const normales = produits.filter((p) => !p.signature);
  const signatures = produits.filter((p) => p.signature);
  const horsService = c.kind === 'food' && produits.length && !enService(produits[0]);
  return `<section class="cat-section" id="cat-${c.id}" data-section="${c.id}" style="--tone:${ton({ cat: c.id })}">
    <header class="cat-head">
      <h2>${esc(c.titre)}</h2>
      ${c.kind === 'food' ? `<p class="cat-head__hours${horsService ? ' is-off' : ''}">${icon('clock')} Servi de ${esc(plageSale())}${horsService ? ' · revient demain' : ''}</p>` : ''}
      ${c.note ? `<p>${esc(c.note)}</p>` : ''}
    </header>
    ${normales.length ? `<ul class="mlist">${normales.map(ligneProduit).join('')}</ul>` : ''}
    ${signatures.length ? `<div class="sigbox">
      <h3 class="sigbox__title"><span>${esc(c.signature || 'Signatures')}</span></h3>
      <ul class="mlist">${signatures.map(ligneProduit).join('')}</ul>
    </div>` : ''}
  </section>`;
}

/* ── Livré sur la plage / je passe au shop ────────────────── */
function modes() {
  const box = $('[data-carte-modes]');
  if (!box) return;
  const plageOuverte = catalogue.reglages.beach_open !== false;
  const maj = () => {
    if (!plageOuverte && panier.mode === 'plage') panier.setMode('shop');
    $$('[data-mode]', box).forEach((b) => {
      const on = b.dataset.mode === panier.mode;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('is-on', on);
    });
    box.style.setProperty('--x', panier.mode === 'shop' ? '100%' : '0%');
    $$('[data-mode-info]').forEach((el) => (el.hidden = el.dataset.modeInfo !== panier.mode));
  };
  const plage = $('[data-mode="plage"]', box);
  if (!plageOuverte && plage) {
    plage.disabled = true;
    plage.querySelector('small').textContent = 'Pas de livraison pour le moment';
  }
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b && !b.disabled) panier.setMode(b.dataset.mode);
  });
  panier.onChange(maj);
  maj();
}

/* ── Navigation par catégorie qui suit la lecture ─────────── */
function navigation(nav, menu) {
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
  if (location.hash) setTimeout(() => $(location.hash)?.scrollIntoView({ block: 'start' }), 60);
}

/* ── Panier latéral (ordinateur) ──────────────────────────── */
function aside() {
  const box = $('[data-cart-aside]');
  if (!box) return;
  const maj = () => {
    const lignes = panier.lignes();
    const st = panier.sousTotal();
    const plage = panier.mode === 'plage';
    const min = Number(catalogue.reglages.beach_min ?? CONFIG.commandeMinimum);
    const tete = `<h2>Ton panier</h2><p class="cart-aside__mode">${icon(plage ? 'pin' : 'bag')} ${plage ? 'Livré sur la plage' : 'Retrait au shop'}</p>`;
    if (!lignes.length) {
      box.innerHTML = `${tete}<p class="cart-aside__empty">Il est vide pour l’instant. Touche le ${icon('plus')} d’une boisson pour l’ajouter.</p>`;
      return;
    }
    const manque = plage && st < min;
    box.innerHTML = `${tete}
      <ul class="mini-lines">${lignes.map((l) => {
        const p = trouverProduit(l.pid);
        const o = libelleOptions(l.pid, l.opts, l.vid);
        return `<li style="--tone:${ton(p)}"><span class="mini-lines__art">${illustration(p)}</span><span><b>${l.qty > 1 ? `${l.qty} × ` : ''}${esc(p.nom)}</b>${o ? `<small>${esc(o)}</small>` : ''}</span><span>${euro(panier.prixLigne(l))}</span></li>`;
      }).join('')}</ul>
      <div class="totals"><div class="totals__grand"><span>Total</span><span>${euro(st + (plage ? CONFIG.fraisLivraison : 0))}</span></div></div>
      ${manque ? `<p class="form-error" style="margin:0 0 12px">Encore ${euro(min - st)} pour le minimum de livraison (${euroCourt(min)}).</p>` : ''}
      <button class="btn btn--block" type="button" data-checkout ${manque ? 'disabled' : ''}>${plage ? 'Où es-tu ?' : 'Je passe quand ?'} ${icon('arrow', 'icon--arrow')}</button>
      <button class="link-arrow" type="button" data-open-cart style="margin-top:14px">Modifier le panier</button>`;
  };
  box.addEventListener('click', (e) => { if (e.target.closest('[data-checkout]')) ouvrirPanneau(2); });
  panier.onChange(maj);
  maj();
}
