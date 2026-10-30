// Aperçu en direct (back-office → Carte & prix) : le produit tel qu'il apparaît sur le site
// pendant qu'on le modifie. Le back-office envoie le brouillon à chaque frappe (postMessage).
import { chargerCatalogue, catalogue, trouverProduit } from './data.js';
import { ligneProduit, carteProduit, ton } from './produits.js';
import { esc } from './utils.js';

const box = document.querySelector('[data-apercu]');
let dernier = null;

function produit(d) {
  const base = trouverProduit(d.id) || {};
  const cat = catalogue.categories.find((c) => c.id === d.category_id) || {};
  return {
    ...base,
    id: d.id || 'apercu', nom: d.name || 'Sans nom', desc: d.description || '', prix: Number(String(d.price).replace(',', '.')) || 0,
    cat: d.category_id, kind: cat.kind || base.kind || 'drink', glace: !!d.iced, signature: !!d.signature, vedette: !!d.featured,
    badge: d.badge || null, image: d.image ?? base.image ?? null, allergenes: d.allergens || null,
    variantes: base.variantes || [], groupes: base.groupes || [], epuise: !d.available,
  };
}

function afficher(d) {
  dernier = d;
  const p = produit(d);
  const cat = catalogue.categories.find((c) => c.id === d.category_id) || { titre: '' };
  const ligne = `<ul class="mlist">${ligneProduit(p)}</ul>`;
  box.innerHTML = `
    <p class="apercu__titre">Sur la carte</p>
    <section class="cat-section" style="--tone:${ton(p)}">
      <header class="cat-head"><h2>${esc(cat.titre)}</h2></header>
      ${p.signature ? `<div class="sigbox"><h3 class="sigbox__title"><span>${esc(cat.signature || 'Signatures')}</span></h3>${ligne}</div>` : ligne}
    </section>
    <p class="apercu__allergenes"><b>Allergènes&nbsp;:</b> ${p.allergenes ? esc(p.allergenes) : '<span class="apercu__manque">à compléter</span>'}</p>
    ${p.vedette ? `<p class="apercu__titre">Sur l’accueil · Les plus commandées</p><div class="apercu__carte">${carteProduit(p)}</div>`
      : '<p class="apercu__note">Pas sur l’accueil. Active « Sur l’accueil » pour l’y mettre.</p>'}
    ${p.epuise ? '<p class="apercu__note apercu__note--off">Épuisé : les clients le voient mais ne peuvent pas le commander.</p>' : ''}`;
}

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'ady-apercu') return;
  if (catalogue.pret) afficher(e.data.produit); else dernier = e.data.produit;
});
chargerCatalogue().then(() => {
  if (dernier) afficher(dernier);
  else box.innerHTML = '<p class="apercu__note">Touche un produit pour le voir ici.</p>';
  parent.postMessage({ type: 'ady-apercu-pret' }, location.origin);
});
