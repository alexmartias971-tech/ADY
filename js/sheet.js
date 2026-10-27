// Fiche produit : grande illustration (qui passe en glacé si on choisit « Glacé »),
// description, options, taille, quantité
import { prixUnitaire, choixParDefaut, enService, plageSale, catalogue } from './data.js';
import { panier } from './cart.js';
import { illustration } from './illustrations.js';
import { icon } from './icons.js';
import { $, euro, esc } from './utils.js';
import { ajouter, ton } from './produits.js';

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
