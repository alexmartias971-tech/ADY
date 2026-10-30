// Produits : cartes et lignes de la carte, ajout au panier, fiche produit
import { trouverProduit, libelleOptions, choixParDefaut, enService, plageSale, panier, prixUnitaire, catalogue } from './data.js';
import { illustration } from './illustrations.js';
import { icon, $, $$, euro, esc, toast, reduceMotion } from './utils.js';

/* ═════════════════════════════════════════════════════════════
   Cartes produit et lignes de la carte
   ═════════════════════════════════════════════════════════════ */
// Cartes produit (signatures), lignes de la carte « ardoise » et ajout au panier
const TONS = { cafeinees: 'var(--peach)', matcha: 'var(--sage)', gourmandes: 'var(--sand)', rafraichissements: 'var(--sky)', sale: 'var(--sun)', merch: 'var(--cream-3)' };
export const ton = (p) => TONS[p.cat] || 'var(--sand)';
const flocon = '<svg class="flake" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5"/></g></svg>';

function boutonAjout(p, petit = false) {
  if (p.epuise) return `<span class="soldout">Épuisé</span>`;
  if (!enService(p)) return `<span class="soldout" title="Servi ${plageSale()}">Dès ${plageSale().split(' ')[0]}</span>`;
  return `<button class="add-btn${petit ? ' add-btn--sm' : ''}" type="button" data-add="${p.id}" aria-label="Ajouter ${esc(p.nom)}">${icon('plus')}</button>`;
}

// Grande carte illustrée (signatures, t-shirts)
export function carteProduit(p, { i = 0 } = {}) {
  return `<article class="pcard${p.epuise ? ' is-soon' : ''}" data-cat="${p.cat}" data-id="${p.id}" style="--i:${i};--tone:${ton(p)}" data-tilt>
    ${p.badge ? `<span class="pcard__tag">${esc(p.badge)}</span>` : ''}
    <span class="pcard__qty" data-qty hidden></span>
    <div class="pcard__art" data-open="${p.id}">${illustration(p)}</div>
    <div class="pcard__body">
      <h3 class="pcard__name"><button type="button" data-open="${p.id}">${esc(p.nom)}</button></h3>
      ${p.desc ? `<p class="pcard__desc">${esc(p.desc)}</p>` : ''}
      <div class="pcard__foot"><span class="price">${euro(p.prix)}</span>${boutonAjout(p)}</div>
    </div>
  </article>`;
}

// Ligne de la carte (façon ardoise du shop)
export function ligneProduit(p) {
  return `<li class="mrow${p.epuise ? ' is-soon' : ''}" data-id="${p.id}" style="--tone:${ton(p)}">
    <button class="mrow__art" type="button" data-open="${p.id}" tabindex="-1" aria-hidden="true">${illustration(p)}</button>
    <button class="mrow__main" type="button" data-open="${p.id}">
      <span class="mrow__name">${esc(p.nom)}${p.glace ? flocon : ''}${p.badge ? `<em>${esc(p.badge)}</em>` : ''}</span>
      ${p.desc ? `<span class="mrow__desc">${esc(p.desc)}</span>` : ''}
    </button>
    <span class="mrow__price">${euro(p.prix)}</span>
    <span class="mrow__qty" data-qty hidden></span>
    ${boutonAjout(p, true)}
  </li>`;
}

// « + » = ajout direct (choix par défaut) ou fiche si tailles / options ; clic ailleurs = fiche
export function brancherCartes(root) {
  root.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const open = e.target.closest('[data-open]');
    if (add) {
      const p = trouverProduit(add.dataset.add);
      if (!p) return;
      const source = add.closest('.pcard, .mrow')?.querySelector('.pcard__art, .mrow__art');
      // il faut choisir : chaud ou glacé, ou une taille → fiche ; sinon ajout direct avec les choix par défaut
      if (p.variantes.length || p.groupes.some((g) => g.id === 'temperature')) ouvrirFiche(p);
      else ajouter(p, choixParDefaut(p), null, 1, source);
    } else if (open) {
      const p = trouverProduit(open.dataset.open);
      if (p && !p.epuise) ouvrirFiche(p);
    }
  });
  majBadges(root);
  panier.onChange(() => majBadges(root));
}

export function majBadges(root = document) {
  $$('[data-id]', root).forEach((c) => {
    const b = $('[data-qty]', c);
    if (!b) return;
    const n = panier.qtyProduit(c.dataset.id);
    b.hidden = n === 0;
    b.textContent = n;
    b.setAttribute('aria-label', `${n} dans le panier`);
  });
}

export function ajouter(p, opts, vid, qty, sourceEl) {
  panier.ajouter(p.id, opts, vid, qty);
  const o = libelleOptions(p.id, opts, vid);
  voler(sourceEl);
  toast(`${qty > 1 ? `${qty} × ` : ''}${p.nom}${o ? ` (${o})` : ''} ajouté`);
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
  const w = Math.min(Math.max(a.width * 0.55, 60), 130);
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

/* ═════════════════════════════════════════════════════════════
   Fiche produit
   ═════════════════════════════════════════════════════════════ */
// Fiche produit : grande illustration (qui passe en glacé si on choisit « Glacé »),
// description, options, taille, quantité
let sheet = null;
let produit = null;
let qty = 1;
let focusAvant = null;

function creer() {
  sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.id = 'fiche-produit';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-labelledby', 'fiche-titre');
  sheet.innerHTML = `<div class="sheet__backdrop" data-close></div>
    <form class="sheet__box" data-form>
      <button class="round-btn sheet__close" type="button" data-close aria-label="Fermer">${icon('close')}</button>
      <div class="sheet__art" data-art></div>
      <div class="sheet__content">
        <h3 id="fiche-titre" data-titre></h3>
        <p data-desc></p>
        <p class="sheet__allergens" data-allergenes></p>
        <p class="price sheet__price" data-prix></p>
        <div data-options></div>
        <p class="form-error" data-alerte hidden></p>
      </div>
      <div class="sheet__foot">
        <div class="stepper" data-stepper>
          <button type="button" data-q="-1" aria-label="Retirer un">${icon('minus')}</button>
          <output data-qte>1</output>
          <button type="button" data-q="1" aria-label="Ajouter un">${icon('plus')}</button>
        </div>
        <button class="btn" type="submit" data-submit>Ajouter</button>
      </div>
    </form>`;
  document.body.appendChild(sheet);
  const form = $('[data-form]', sheet);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'temperature') dessiner();
    maj();
  });
  $('[data-stepper]', sheet).addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    qty = Math.min(20, Math.max(1, qty + Number(b.dataset.q)));
    maj();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { opts, vid } = selection();
    if (produit.variantes.length && !vid) {
      montrer('Choisis ta taille.');
      return;
    }
    ajouter(produit, opts, vid, qty, $('[data-art]', sheet));
    fermerFiche();
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) fermerFiche(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) fermerFiche(); });
}

function montrer(msg) {
  const a = $('[data-alerte]', sheet);
  a.textContent = msg;
  a.hidden = !msg;
}

function selection() {
  const data = new FormData($('[data-form]', sheet));
  const opts = produit.groupes.map((g) => data.get(g.id)).filter(Boolean);
  const vid = data.get('taille') || null;
  return { opts, vid };
}

function estGlaceChoisi() {
  const v = new FormData($('[data-form]', sheet)).get('temperature');
  return v ? /^glac/i.test(catalogue.choix[v]?.label || '') : undefined;
}

function dessiner() {
  const art = $('[data-art]', sheet);
  art.innerHTML = illustration(produit, { glace: estGlaceChoisi() });
}

function maj() {
  const { opts } = selection();
  $('[data-qte]', sheet).textContent = qty;
  $('[data-submit]', sheet).textContent = `Ajouter · ${euro(prixUnitaire(produit.id, opts) * qty)}`;
  montrer('');
}

export function ouvrirFiche(p) {
  if (!sheet) creer();
  if (p.epuise) return;
  produit = p;
  qty = 1;
  focusAvant = document.activeElement;
  $('[data-art]', sheet).style.setProperty('--tone', ton(p));
  $('[data-titre]', sheet).textContent = p.nom;
  $('[data-desc]', sheet).textContent = p.desc;
  $('[data-desc]', sheet).hidden = !p.desc;
  // information allergènes obligatoire avant l'achat (règlement UE 1169/2011, décret 2015-447)
  $('[data-allergenes]', sheet).innerHTML = p.kind === 'merch' ? ''
    : p.allergenes ? `<b>Allergènes&nbsp;:</b> ${esc(p.allergenes)}`
      : '<b>Allergènes&nbsp;:</b> liste en cours de rédaction (site de démonstration). Demande-la avant de commander.';
  $('[data-allergenes]', sheet).hidden = p.kind === 'merch';
  $('[data-prix]', sheet).textContent = euro(p.prix);
  const defauts = choixParDefaut(p);
  const groupes = p.groupes.map((g, gi) => {
    // sur la plage, on propose d'abord la version glacée
    let coche = defauts[gi];
    if (g.id === 'temperature' && panier.mode === 'plage') coche = (g.choix.find((c) => /^glac/i.test(c.label)) || g.choix[0]).id;
    return `<fieldset class="opt-group"><legend>${esc(g.nom)}</legend><div class="choices">${g.choix
      .map((c) => `<label class="choice"><input type="radio" name="${g.id}" value="${c.id}"${c.id === coche ? ' checked' : ''}><span>${esc(c.label)}${c.delta ? ` <small>+${euro(c.delta)}</small>` : ''}</span></label>`)
      .join('')}</div></fieldset>`;
  }).join('');
  const tailles = p.variantes.length ? `<fieldset class="opt-group"><legend>Taille</legend><div class="choices">${p.variantes
    .map((v) => `<label class="choice${v.epuise ? ' is-off' : ''}"><input type="radio" name="taille" value="${v.id}"${v.epuise ? ' disabled' : ''}><span>${esc(v.label)}${v.epuise ? ' <small>épuisé</small>' : ''}</span></label>`)
    .join('')}</div></fieldset>` : '';
  $('[data-options]', sheet).innerHTML = tailles + groupes;
  dessiner();
  const fermeHeure = !enService(p);
  $('[data-submit]', sheet).disabled = fermeHeure;
  sheet.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  maj();
  if (fermeHeure) montrer(`Servi de ${plageSale()} : reviens un peu plus tard !`);
  setTimeout(() => $('[data-submit]', sheet).focus({ preventScroll: true }), 60);
}

export function fermerFiche() {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  if (!document.querySelector('.panel:not([hidden])')) document.documentElement.style.overflow = '';
  focusAvant?.focus?.({ preventScroll: true });
}
