// Fiche produit : grande illustration, description, options, quantité
import { OPTIONS, prixLigne } from './menu.js';
import { illustration } from './illustrations.js';
import { icon } from './icons.js';
import { $, euro, esc } from './utils.js';
import { ajouter } from './produits.js';

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
        <p class="price sheet__price" data-prix></p>
        <div data-options></div>
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
  form.addEventListener('change', maj);
  $('[data-stepper]', sheet).addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    qty = Math.min(20, Math.max(1, qty + Number(b.dataset.q)));
    maj();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ajouter(produit, choix(), qty, $('[data-art]', sheet));
    fermerFiche();
  });
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) fermerFiche(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) fermerFiche(); });
}

function choix() {
  const data = new FormData($('[data-form]', sheet));
  const c = {};
  for (const g of produit.options || []) c[g] = data.get(g);
  return c;
}

function maj() {
  const unit = prixLigne(produit, choix());
  $('[data-qte]', sheet).textContent = qty;
  $('[data-submit]', sheet).textContent = `Ajouter · ${euro(unit * qty)}`;
}

export function ouvrirFiche(p) {
  if (!sheet) creer();
  if (p.dispo === false) return;
  produit = p;
  qty = 1;
  focusAvant = document.activeElement;
  const tons = { iced: 'var(--sky)', hot: 'var(--peach)', matcha: 'var(--sage)', fresh: 'var(--sun)', food: 'var(--sand)' };
  $('[data-art]', sheet).style.setProperty('--tone', tons[p.cat] || 'var(--sand)');
  $('[data-art]', sheet).innerHTML = p.photo ? `<img src="${esc(p.photo)}" alt="">` : illustration(p);
  $('[data-titre]', sheet).textContent = p.nom;
  $('[data-desc]', sheet).textContent = p.desc;
  $('[data-prix]', sheet).textContent = euro(p.prix);
  $('[data-options]', sheet).innerHTML = (p.options || []).map((g) => {
    const def = OPTIONS[g];
    return `<fieldset class="opt-group"><legend>${esc(def.label)}</legend><div class="choices">${def.choix
      .map((c, i) => `<label class="choice"><input type="radio" name="${g}" value="${c.id}"${i === 0 ? ' checked' : ''}><span>${esc(c.label)}${c.prix ? ` <small>+${euro(c.prix)}</small>` : ''}</span></label>`)
      .join('')}</div></fieldset>`;
  }).join('');
  sheet.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  maj();
  setTimeout(() => $('[data-submit]', sheet).focus({ preventScroll: true }), 60);
}

export function fermerFiche() {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  if (!document.querySelector('.panel:not([hidden])')) document.documentElement.style.overflow = '';
  focusAvant?.focus?.({ preventScroll: true });
}
