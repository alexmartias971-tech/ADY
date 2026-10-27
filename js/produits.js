// Carte produit (accueil + page carte) et ajout au panier
import { trouverProduit, libelleOptions } from './menu.js';
import { illustration } from './illustrations.js';
import { panier } from './cart.js';
import { icon } from './icons.js';
import { $, $$, euro, esc, toast, reduceMotion } from './utils.js';
import { ouvrirFiche } from './sheet.js';

export function carteProduit(p, { i = 0 } = {}) {
  const soon = p.dispo === false;
  const visuel = p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : illustration(p);
  return `<article class="pcard${soon ? ' is-soon' : ''}" data-cat="${p.cat}" data-id="${p.id}" style="--i:${i}">
    ${p.tag ? `<span class="pcard__tag">${esc(p.tag)}</span>` : ''}
    <span class="pcard__qty" data-qty hidden></span>
    <div class="pcard__art" data-open="${p.id}">${visuel}</div>
    <div class="pcard__body">
      <h3 class="pcard__name"><button type="button" data-open="${p.id}">${esc(p.nom)}</button></h3>
      <p class="pcard__desc">${esc(p.desc)}</p>
      <div class="pcard__foot">
        <span class="price">${euro(p.prix)}</span>
        ${soon
    ? '<button class="add-btn" type="button" disabled>Bientôt</button>'
    : `<button class="add-btn" type="button" data-add="${p.id}" aria-label="Ajouter ${esc(p.nom)} au panier">${icon('plus')}</button>`}
      </div>
    </div>
  </article>`;
}

// Clic sur une carte : « + » = ajout rapide (ou choix des options), le reste = fiche produit
export function brancherCartes(root) {
  root.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const open = e.target.closest('[data-open]');
    if (add) {
      const p = trouverProduit(add.dataset.add);
      const art = add.closest('.pcard').querySelector('.pcard__art');
      if (p.options?.length) ouvrirFiche(p);
      else ajouter(p, {}, 1, art);
    } else if (open) {
      ouvrirFiche(trouverProduit(open.dataset.open));
    }
  });
  majBadges(root);
  panier.onChange(() => majBadges(root));
}

export function majBadges(root = document) {
  $$('.pcard', root).forEach((c) => {
    const n = panier.qtyProduit(c.dataset.id);
    const b = $('[data-qty]', c);
    if (!b) return;
    b.hidden = n === 0;
    b.textContent = n;
    b.setAttribute('aria-label', `${n} dans le panier`);
  });
}

export function ajouter(p, choix, qty, sourceEl) {
  panier.ajouter(p.id, choix, qty);
  const opts = libelleOptions(p, choix);
  voler(sourceEl);
  toast(`${qty > 1 ? `${qty} × ` : ''}${p.nom}${opts ? ` (${opts})` : ''} ajouté`);
}

function cible() {
  const bar = $('[data-cartbar]');
  if (bar && !bar.hidden && bar.offsetParent) return bar;
  return $('.site-header .cart-btn');
}

export function bump() {
  $$('.cart-btn, [data-cartbar]').forEach((el) => {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  });
}

function voler(source) {
  const t = cible();
  const visuel = source?.querySelector('svg.ill, img');
  if (!source || !t || !visuel || reduceMotion()) return bump();
  const a = source.getBoundingClientRect();
  const b = t.getBoundingClientRect();
  const w = Math.min(a.width * 0.55, 130);
  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  flyer.innerHTML = visuel.outerHTML;
  Object.assign(flyer.style, { width: `${w}px`, left: `${a.left + a.width / 2 - w / 2}px`, top: `${a.top + a.height / 2 - w * 0.6}px` });
  document.body.appendChild(flyer);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  flyer.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 140}px) scale(.75) rotate(-18deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.18) rotate(16deg)`, opacity: 0.3 },
  ], { duration: 800, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => { flyer.remove(); bump(); };
}
