// Commande sur un seul écran, suivi en direct, et visionneuse des photos de points
import { CONFIG } from './reglages.js';
import { catalogue, trouverProduit, trouverPoint, libelleOptions, passerCommande, statutCommande, enService, estDemo, panier } from './data.js';
import { illustration } from './illustrations.js';
import { etatOuverture, icon, $, $$, euro, euroCourt, esc, toast, beanSVG, distanceMetres, reduceMotion } from './utils.js';
import { livreurSeul } from './scene.js';
import { ton } from './produits.js';

/* ═════════════════════════════════════════════════════════════
   Commande et suivi
   ═════════════════════════════════════════════════════════════ */
// ─────────────────────────────────────────────────────────────
//  Commande express, sur un seul écran (pensée pour le téléphone) :
//  le panier, puis 1. le point de livraison sur la plage (ou l'heure
//  de retrait au shop), 2. nom, prénom, téléphone, paiement, et un
//  bouton. Ensuite, le suivi en direct (accessible depuis l'en-tête).
// ─────────────────────────────────────────────────────────────
const CLE_CLIENT = 'ady-client-v1';
const CLE_SUIVI = 'ady-suivi-v1';
const CRENEAUX = ['Dès que possible', 'Dans 15 min', 'Dans 30 min', 'Dans 1 h'];

let panel;
const etat = { vue: 'commande', envoi: false, creneau: CRENEAUX[0], distances: null };
let suivi = lireSuivi();
let minuteurSuivi = null;
let focusAvant = null;

function lireSuivi() {
  try {
    const s = JSON.parse(localStorage.getItem(CLE_SUIVI) || 'null');
    // on oublie une commande de plus de 8 heures
    return s && Date.now() - s.at < 8 * 3600e3 ? s : null;
  } catch { return null; }
}
function ecrireSuivi() {
  try { if (suivi) localStorage.setItem(CLE_SUIVI, JSON.stringify(suivi)); else localStorage.removeItem(CLE_SUIVI); } catch { /* */ }
}

const R = () => catalogue.reglages;
const plageDispo = () => R().beach_open !== false && catalogue.points.length > 0;

/* ── Construction du panneau ──────────────────────────────── */
function construire() {
  panel = document.createElement('div');
  panel.className = 'panel';
  panel.id = 'commande';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'commande-titre');
  panel.innerHTML = `<div class="panel__backdrop" data-close-panel></div>
  <div class="panel__box">
    <header class="panel__head">
      <h2 id="commande-titre">Ma commande</h2>
      <button class="round-btn" type="button" data-close-panel aria-label="Fermer">${icon('close')}</button>
    </header>
    <div class="panel__body" data-body>
      <section class="vue" data-vue="commande">
        <div class="modes" role="radiogroup" aria-label="Comment veux-tu ta commande ?" data-modes>
          <button type="button" role="radio" data-mode="plage">${icon('pin')}<span><b>Livré sur la plage</b><small data-mode-plage-sub>Caravelle · dès 5 €</small></span></button>
          <button type="button" role="radio" data-mode="shop">${icon('bag')}<span><b>Je passe au shop</b><small>Prête à ton arrivée</small></span></button>
        </div>
        <p class="notice" data-ferme hidden></p>
        <div class="cart-empty" data-empty>
          <svg viewBox="0 0 728 584" aria-hidden="true"><use href="assets/brand.svg#st-head"/></svg>
          <p><b>Ton panier est vide.</b><br>Une petite soif&nbsp;?</p>
          <a class="btn btn--sm" href="carte" data-close-panel>Voir la carte</a>
        </div>
        <div data-plein>
          <ul class="cart-lines" data-lines></ul>
          <div class="min-line" data-min hidden><p data-min-text></p><span class="min-line__bar"><span data-min-bar></span></span></div>

          <div class="bloc" data-bloc="plage">
            <h3 class="bloc__titre"><span class="bloc__n">1</span>Où on te livre&nbsp;?</h3>
            <p class="bloc__aide">Choisis le point le plus proche de toi&nbsp;: ta commande t’y attend, on te prévient par message.</p>
            <button class="lien-proche" type="button" data-proche>${icon('locate')} Trouver le point le plus proche</button>
            <div class="points" role="radiogroup" aria-label="Point de livraison" data-points></div>
            <label class="field field--court"><span>Un signe pour te reconnaître&nbsp;? <em>(facultatif)</em></span>
              <input type="text" maxlength="120" placeholder="Ex. chapeau de paille, serviette jaune" data-signe></label>
          </div>

          <div class="bloc" data-bloc="shop" hidden>
            <h3 class="bloc__titre"><span class="bloc__n">1</span>Tu passes quand&nbsp;?</h3>
            <div class="choices choices--big" role="radiogroup" aria-label="Heure de passage" data-creneaux></div>
            <p class="bloc__aide bloc__aide--shop">${icon('pin')}<span>ADY Coffee Shop, <span data-address-pickup></span> · <a data-directions-pickup target="_blank" rel="noopener">Itinéraire</a></span></p>
          </div>

          <form class="bloc" data-form novalidate>
            <h3 class="bloc__titre"><span class="bloc__n">2</span>Tes infos</h3>
            <div class="field-row">
              <label class="field field--court"><span>Prénom</span><input type="text" name="prenom" autocomplete="given-name" maxlength="40" required placeholder="Marie"></label>
              <label class="field field--court"><span>Nom</span><input type="text" name="nom" autocomplete="family-name" maxlength="40" required placeholder="Durand"></label>
            </div>
            <label class="field field--court"><span>Téléphone <em data-tel-hint>(on te prévient quand c’est là)</em></span><input type="tel" name="telephone" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="0690 12 34 56"></label>
            <fieldset class="field field--court"><legend data-pay-legend>Paiement à la livraison</legend><div class="choices" data-payments></div></fieldset>
            <label class="check"><input type="checkbox" name="memo"> Se souvenir de moi sur ce téléphone</label>
            <details class="ajout-note"><summary>Ajouter une note pour nous</summary>
              <label class="field field--court"><span class="sr-only">Note</span><input type="text" name="note" maxlength="200" placeholder="Bien glacé, sans paille…"></label></details>
            <input class="hp" type="text" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
          </form>

          <p class="loyal-note">${icon('card')}<span><b>Carte fidélité&nbsp;?</b> <span data-loyal-note>Montre ton QR code au livreur au moment de payer.</span>${CONFIG.lienCarteFidelite ? ` Pas encore de carte&nbsp;? <a href="${esc(CONFIG.lienCarteFidelite)}" target="_blank" rel="noopener">Crée-la en 10 secondes</a>.` : ''}</span></p>
          <p class="notice notice--demo" data-demo-note hidden>Site de démonstration&nbsp;: cette commande n’est ni préparée ni livrée.</p>
          <p class="legal-note">En validant, tu acceptes nos <a href="cgv" target="_blank" rel="noopener">conditions de vente</a> et tu t’engages à payer ta commande à la remise. Tes coordonnées servent uniquement à préparer et remettre ta commande (<a href="confidentialite" target="_blank" rel="noopener">confidentialité</a>).</p>
        </div>
      </section>

      <section class="vue" data-vue="suivi" hidden><div data-suivi></div></section>
    </div>
    <footer class="panel__foot">
      <div class="totals" data-totals></div>
      <p class="form-error" data-error role="alert" hidden></p>
      <button class="btn btn--block btn--lg" type="button" data-next>Commander</button>
    </footer>
  </div>`;
  document.body.appendChild(panel);
}

const q = (sel) => $(sel, panel);

/* ── Ouverture / fermeture ────────────────────────────────── */
// vue : 'commande' (par défaut) ou 'suivi' (4, pour les anciens appels)
export function ouvrirPanneau(vue = 'commande') {
  if (vue === 4) vue = 'suivi';
  if (vue === 'suivi' && !suivi) vue = 'commande';
  if (vue !== 'suivi') vue = 'commande';
  if (!panel.hidden) return montrerVue(vue);
  focusAvant = document.activeElement;
  $('[data-toast]')?.classList.remove('is-on');
  panel.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  history.pushState({ panneau: true }, '');
  montrerVue(vue);
  setTimeout(() => q('.panel__head [data-close-panel]').focus({ preventScroll: true }), 60);
}

function fermerPanneau(depuisHistorique = false) {
  if (panel.hidden) return;
  panel.hidden = true;
  document.documentElement.style.overflow = '';
  if (!depuisHistorique && history.state?.panneau) history.back();
  focusAvant?.focus?.({ preventScroll: true });
}

function montrerVue(vue) {
  etat.vue = vue;
  cacherErreur();
  $$('[data-vue]', panel).forEach((s) => (s.hidden = s.dataset.vue !== vue));
  q('#commande-titre').textContent = vue === 'suivi' ? 'Ma commande' : 'Commander';
  q('[data-body]').scrollTop = 0;
  if (vue === 'commande') { prerempli(); majCommande(); }
  if (vue === 'suivi') majSuivi();
  majPied();
}

/* ── Règles ───────────────────────────────────────────────── */
const fraisLivraison = () => (panier.mode === 'plage' && panier.nb() ? CONFIG.fraisLivraison : 0);
const total = () => panier.sousTotal() + fraisLivraison();
const minimum = () => (panier.mode === 'plage' ? Number(R().beach_min) || 0 : 0);

function blocage() {
  if (!R().orders_open) return 'Les commandes en ligne sont fermées pour le moment. Tu peux toujours passer au shop !';
  if (panier.mode === 'plage' && !plageDispo()) return 'La livraison plage est fermée pour le moment. Tu peux commander à emporter.';
  if (CONFIG.bloquerHorsHoraires && !etatOuverture(CONFIG).livraison) return 'Le shop est fermé pour le moment : reviens pendant les horaires d’ouverture.';
  const horsService = panier.lignes().map((l) => trouverProduit(l.pid)).find((p) => p && !enService(p));
  if (horsService) return `${horsService.nom} n’est servi qu’à l’heure du déjeuner : retire-le pour commander maintenant.`;
  return null;
}

function majPied() {
  const b = q('[data-next]');
  b.classList.remove('btn--legal');
  if (etat.vue === 'suivi') {
    q('[data-totals]').innerHTML = '';
    b.textContent = suivi && !['done', 'cancelled'].includes(suivi.status) ? 'Continuer ma visite' : 'Fermer';
    b.disabled = false;
    return;
  }
  const vide = !panier.nb();
  q('[data-totals]').innerHTML = vide ? '' : `<div class="totals__grand"><span>Total${panier.mode === 'plage' ? ` <small>${fraisLivraison() ? `livraison ${euro(fraisLivraison())}` : 'livraison offerte'}</small>` : ''}</span><span>${euro(total())}</span></div>`;
  if (vide) {
    b.textContent = 'Voir la carte';
    b.disabled = false;
    return;
  }
  // libellé imposé pour une commande en ligne (art. L221-14 du Code de la consommation)
  b.textContent = etat.envoi ? 'Envoi en cours…' : 'Commander avec obligation de paiement';
  b.classList.toggle('btn--legal', !etat.envoi);
  b.disabled = etat.envoi;
}

const montrerErreur = (msg, cible) => {
  const e = q('[data-error]');
  e.textContent = msg;
  e.hidden = false;
  if (cible) {
    cible.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    if (cible.matches('input')) setTimeout(() => cible.focus({ preventScroll: true }), 250);
  }
};
const cacherErreur = () => { q('[data-error]').hidden = true; };

/* ── Écran de commande ────────────────────────────────────── */
function majCommande() {
  if (!panel) return;
  // mode plage / shop
  const plageOff = !plageDispo();
  if (plageOff && panier.mode === 'plage') panier.setMode('shop');
  $$('[data-mode]', panel).forEach((b) => {
    const on = b.dataset.mode === panier.mode;
    b.setAttribute('aria-checked', String(on));
    b.classList.toggle('is-on', on);
    b.disabled = b.dataset.mode === 'plage' && plageOff;
  });
  q('[data-mode-plage-sub]').textContent = plageOff ? 'Fermée pour le moment' : `Caravelle · dès ${euroCourt(Number(R().beach_min))}`;

  const lignes = panier.lignes();
  const plage = panier.mode === 'plage';
  q('[data-empty]').hidden = lignes.length > 0;
  q('[data-plein]').hidden = !lignes.length;
  const bloque = blocage();
  const f = q('[data-ferme]');
  f.hidden = !bloque || !lignes.length;
  f.textContent = bloque || '';

  q('[data-lines]').innerHTML = lignes.map((l) => {
    const p = trouverProduit(l.pid);
    const o = libelleOptions(l.pid, l.opts, l.vid);
    const glace = (l.opts.map((id) => catalogue.choix[id]).find((c) => c?.groupe === 'temperature')?.label || '');
    return `<li class="cart-line${enService(p) ? '' : ' is-off'}">
      <div class="cart-line__art" style="--tone:${ton(p)}">${illustration(p, { glace: glace ? /^glac/i.test(glace) : undefined })}</div>
      <div><div class="cart-line__name">${esc(p.nom)}</div>${o ? `<div class="cart-line__opts">${esc(o)}</div>` : ''}<div class="cart-line__price">${euro(panier.prixLigne(l))}</div></div>
      <div class="stepper stepper--sm" data-line="${esc(l.cle)}">
        <button type="button" data-delta="-1" aria-label="Retirer un ${esc(p.nom)}">${icon(l.qty === 1 ? 'close' : 'minus')}</button>
        <output>${l.qty}</output>
        <button type="button" data-delta="1" aria-label="Ajouter un ${esc(p.nom)}">${icon('plus')}</button>
      </div></li>`;
  }).join('');

  // minimum de commande pour la livraison plage
  const st = panier.sousTotal();
  const min = minimum();
  const m = q('[data-min]');
  m.hidden = !plage || !lignes.length || st >= min;
  if (!m.hidden) {
    q('[data-min-text]').innerHTML = `Encore <b>${euro(min - st)}</b> pour être livré sur la plage (minimum ${euroCourt(min)}).`;
    q('[data-min-bar]').style.width = `${Math.round(Math.min(1, st / min) * 100)}%`;
  }

  q('[data-bloc="plage"]').hidden = !plage;
  q('[data-bloc="shop"]').hidden = plage;
  if (plage) majPoints(); else majCreneaux();
  majContact();
  majPied();
}

/* ── 1. Point de livraison sur la plage ───────────────────── */
function majPoints() {
  const liste = catalogue.points.slice();
  if (etat.distances) liste.sort((a, b) => etat.distances[a.id] - etat.distances[b.id]);
  // un seul point : il est choisi d'office
  if (liste.length === 1 && panier.point !== liste[0].id) panier.setPoint(liste[0].id);
  q('[data-proche]').hidden = liste.length < 2;
  q('[data-points]').innerHTML = liste.map((p) => {
    const d = etat.distances?.[p.id];
    const n = catalogue.points.indexOf(p) + 1;
    return `<label class="pt${panier.point === p.id ? ' is-on' : ''}">
      <input type="radio" name="point" value="${esc(p.id)}"${panier.point === p.id ? ' checked' : ''}>
      ${p.photo ? `<button class="pt__img" type="button" data-zoom="${esc(p.id)}" aria-label="Voir la photo du point ${esc(p.nom)} en grand"><img src="${esc(p.photo)}" alt="" loading="lazy"><span class="pt__n">${n}</span><span class="pt__loupe">${icon('zoom')}</span></button>`
        : `<span class="pt__img">${icon('pin')}<span class="pt__n">${n}</span></span>`}
      <span class="pt__txt"><b>${esc(p.nom)}</b>${p.indication ? `<small>${esc(p.indication)}</small>` : ''}${d != null ? `<em>à ${d < 1000 ? `${Math.round(d / 10) * 10} m` : `${(d / 1000).toFixed(1).replace('.', ',')} km`} de toi</em>` : ''}</span>
      <span class="pt__check" aria-hidden="true">${icon('check')}</span>
    </label>`;
  }).join('');
}

// Position lue sur le téléphone, uniquement pour trier les points : elle n'est jamais envoyée
function plusProche() {
  const b = q('[data-proche]');
  if (!('geolocation' in navigator) || !window.isSecureContext) return toast('La localisation n’est pas disponible ici : choisis ton point dans la liste.');
  b.disabled = true;
  b.lastChild.textContent = ' Recherche…';
  navigator.geolocation.getCurrentPosition((pos) => {
    const moi = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    etat.distances = Object.fromEntries(catalogue.points.map((p) => [p.id, distanceMetres(moi, p)]));
    const proche = catalogue.points.reduce((a, p) => (etat.distances[p.id] < etat.distances[a.id] ? p : a));
    b.disabled = false;
    b.lastChild.textContent = ' Trouver le point le plus proche';
    cacherErreur();
    panier.setPoint(proche.id);
    toast(`Le plus proche : ${proche.nom}`);
  }, () => {
    b.disabled = false;
    b.lastChild.textContent = ' Trouver le point le plus proche';
    toast('Position indisponible : choisis ton point dans la liste.');
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

/* ── 1 bis. Heure de retrait au shop ──────────────────────── */
function majCreneaux() {
  q('[data-creneaux]').innerHTML = CRENEAUX.map((c) => `<label class="choice"><input type="radio" name="creneau" value="${c}"${c === etat.creneau ? ' checked' : ''}><span>${c}</span></label>`).join('');
  q('[data-address-pickup]').textContent = CONFIG.adresse.split(',')[0];
  q('[data-directions-pickup]').href = CONFIG.lienItineraire;
}

/* ── 2. Infos du client ───────────────────────────────────── */
function majContact() {
  const plage = panier.mode === 'plage';
  q('[data-tel-hint]').textContent = plage ? '(on te prévient quand c’est là)' : '(facultatif, pour te prévenir)';
  q('[data-pay-legend]').textContent = plage ? 'Paiement à la livraison' : 'Paiement au comptoir';
  q('[data-loyal-note]').textContent = plage ? 'Montre ton QR code au livreur au moment de payer.' : 'Montre ton QR code au comptoir au moment de payer.';
  q('[data-demo-note]').hidden = !estDemo();
  const actuel = q('[data-form]').querySelector('input[name="paiement"]:checked')?.value;
  q('[data-payments]').innerHTML = CONFIG.paiements
    .map((p, i) => `<label class="choice"><input type="radio" name="paiement" value="${p.id}"${(actuel ? actuel === p.id : i === 0) ? ' checked' : ''}><span>${esc(p.label)}</span></label>`).join('');
}

// Client déjà venu : ses infos sont déjà remplies (s'il l'a demandé)
function prerempli() {
  const f = q('[data-form]');
  if (f.elements.prenom.value) return;
  try {
    const c = JSON.parse(localStorage.getItem(CLE_CLIENT) || 'null');
    if (!c) return;
    f.elements.prenom.value = c.prenom || '';
    f.elements.nom.value = c.nom || '';
    f.elements.telephone.value = c.telephone || '';
    f.elements.memo.checked = true;
    setTimeout(() => {
      const pay = f.querySelector(`input[name="paiement"][value="${c.paiement}"]`);
      if (pay) pay.checked = true;
    });
  } catch { /* stockage indisponible */ }
}

function lireContact() {
  const d = new FormData(q('[data-form]'));
  return {
    prenom: String(d.get('prenom') || '').trim(),
    nom: String(d.get('nom') || '').trim(),
    telephone: String(d.get('telephone') || '').trim(),
    paiement: String(d.get('paiement') || ''),
    note: String(d.get('note') || '').trim(),
    memo: d.get('memo') === 'on',
    site: String(d.get('site') || ''),
  };
}

// Première chose qui manque, avec l'endroit où l'indiquer
function verifier() {
  const b = blocage();
  if (b) return [b, q('[data-ferme]')];
  if (panier.sousTotal() < minimum()) return [`Le minimum pour la livraison plage est de ${euroCourt(minimum())}.`, q('[data-min]')];
  if (panier.mode === 'plage' && !trouverPoint(panier.point)) return ['Choisis ton point de livraison sur la plage.', q('[data-bloc="plage"]')];
  const c = lireContact();
  const f = q('[data-form]');
  const telOk = c.telephone.replace(/\D/g, '').length >= 8;
  const telRequis = panier.mode === 'plage';
  f.elements.prenom.setAttribute('aria-invalid', String(!c.prenom));
  f.elements.nom.setAttribute('aria-invalid', String(!c.nom));
  f.elements.telephone.setAttribute('aria-invalid', String(telRequis && !telOk));
  if (!c.prenom) return ['Indique ton prénom.', f.elements.prenom];
  if (!c.nom) return ['Indique ton nom.', f.elements.nom];
  if (telRequis && !telOk) return ['Ajoute ton numéro : on te prévient quand ta commande est au point.', f.elements.telephone];
  return null;
}

/* ── Envoi ────────────────────────────────────────────────── */
async function envoyer() {
  const manque = verifier();
  if (manque) return montrerErreur(...manque);
  const c = lireContact();
  if (c.site) return; // robot
  cacherErreur();
  etat.envoi = true;
  majPied();
  const plage = panier.mode === 'plage';
  const pt = plage ? trouverPoint(panier.point) : null;
  try {
    const paiement = CONFIG.paiements.find((p) => p.id === c.paiement)?.label || '';
    const data = await passerCommande({
      mode: panier.mode,
      name: `${c.prenom} ${c.nom}`,
      phone: c.telephone,
      when: plage ? null : etat.creneau,
      note: [c.note, paiement && `Paiement : ${paiement}`].filter(Boolean).join(' · '),
      point_id: pt?.id || null,
      spot: plage ? q('[data-signe]').value.trim() : null,
      items: panier.lignes().map((l) => ({ product_id: l.pid, variant_id: l.vid, qty: l.qty, options: l.opts })),
    });
    try {
      if (c.memo) localStorage.setItem(CLE_CLIENT, JSON.stringify({ prenom: c.prenom, nom: c.nom, telephone: c.telephone, paiement: c.paiement }));
      else localStorage.removeItem(CLE_CLIENT);
    } catch { /* */ }
    suivi = {
      token: data.token, number: data.number, mode: panier.mode, total: data.total, discount: data.discount, status: 'new', at: Date.now(),
      quand: plage ? null : etat.creneau, point: pt ? { nom: pt.nom, photo: pt.photo, indication: pt.indication } : null,
    };
    ecrireSuivi();
    panier.vider();
    q('[data-signe]').value = '';
    q('[data-form]').elements.note.value = '';
    etat.envoi = false;
    montrerVue('suivi');
    confettis();
    lancerSuivi();
  } catch (e) {
    etat.envoi = false;
    majPied();
    montrerErreur(e.message || 'Oups, la commande n’est pas partie. Vérifie ta connexion et réessaie.');
  }
}

/* ── Suivi en direct ──────────────────────────────────────── */
const ETAPES = {
  shop: [['new', 'Reçue', 'Le shop a bien ta commande.'], ['preparing', 'En préparation', 'Ça glace, ça mousse.'], ['ready', 'Prête au comptoir', 'Passe la récupérer !'], ['done', 'Récupérée', 'Bonne dégustation.']],
  plage: [['new', 'Reçue', 'Le shop a bien ta commande.'], ['preparing', 'En préparation', 'Ça glace, ça mousse.'], ['delivering', 'En route', 'Le livreur file vers ton point.'], ['arrived', 'Ton livreur est là', 'Rejoins ton point : on t’attend avec ta commande.'], ['done', 'Livrée', 'Bonne plage !']],
};

function majSuivi() {
  const el = q('[data-suivi]');
  if (!suivi) { el.innerHTML = ''; return; }
  if (suivi.status === 'cancelled') {
    el.innerHTML = `<div class="done done--refus"><span class="order-num">n° ${esc(suivi.number)}</span><h3>Commande refusée</h3>
      ${suivi.reason ? `<p class="done__motif">${esc(suivi.reason)}</p>` : '<p>Le shop n’a pas pu prendre cette commande.</p>'}
      <p><b>Rien à payer.</b> Toutes nos excuses.</p>
      <a class="btn btn--sm" href="carte" data-close-panel>Recommander</a>
      ${CONFIG.telephone ? `<a class="btn btn--sm btn--dark" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} Appeler le shop</a>` : ''}</div>`;
    majPied();
    return;
  }
  const etapes = ETAPES[suivi.mode] || ETAPES.shop;
  let idx = etapes.findIndex(([k]) => k === suivi.status);
  if (suivi.status === 'ready' && suivi.mode === 'plage') idx = 2;
  if (idx < 0) idx = 0;
  const arrive = suivi.status === 'arrived';
  const titre = suivi.status === 'done' ? (suivi.mode === 'plage' ? 'Livrée, bonne plage&nbsp;!' : 'Bonne dégustation&nbsp;!') : idx === 0 ? 'C’est parti&nbsp;!' : arrive ? 'Ton livreur est là&nbsp;!' : etapes[idx][1];
  const enRoute = suivi.mode === 'plage' && (idx === 2 || arrive);
  const pt = suivi.point;
  el.innerHTML = `<div class="done">
    ${arrive ? '' : `<div class="done__art${enRoute ? ' is-route' : ''}">${enRoute ? livreurSeul() : '<svg viewBox="0 0 728 584" aria-hidden="true" style="--st-bg:var(--cream-2);--st-ink:var(--terra)"><use href="assets/brand.svg#st-head"/></svg>'}</div>`}
    <span class="order-num">n° ${esc(suivi.number)}</span>
    <h3>${titre}</h3>
    <p>${arrive ? `Rejoins le point <b>${esc(pt?.nom || 'de livraison')}</b>&nbsp;: on t’attend avec ta commande.` : suivi.mode === 'plage' ? `Livraison dans <b>${esc(CONFIG.delaiLivraison)}</b> environ.` : `Retrait au shop · <b>${esc(suivi.quand || 'dès que possible')}</b>.`}</p>
    ${pt ? `<div class="suivi-point${arrive ? ' is-arrive' : ''}">${pt.photo ? `<img src="${esc(pt.photo)}" alt="">` : ''}<span><small>Ton point de livraison</small><b>${esc(pt.nom)}</b>${pt.indication ? `<em>${esc(pt.indication)}</em>` : ''}</span></div>` : ''}
    <ol class="timeline">${etapes.map(([, l, d], i) => `<li class="${i < idx ? 'is-done' : i === idx ? (suivi.status === 'done' ? 'is-done' : 'is-now') : ''}"><span><b>${l}</b>${d}</span></li>`).join('')}</ol>
    ${CONFIG.lienCarteFidelite && suivi.status !== 'done' ? `<a class="loyal-done" href="${esc(CONFIG.lienCarteFidelite)}" target="_blank" rel="noopener">${icon('card')}<span><b>Un tampon sur cette commande&nbsp;?</b>Crée ta carte fidélité en 10 secondes, on la scanne ${suivi.mode === 'plage' ? 'à la livraison' : 'au comptoir'}.</span>${icon('arrow', 'icon--arrow')}</a>` : ''}
    <p class="done__pay">${suivi.mode === 'plage' ? 'À payer à la livraison' : 'À payer au comptoir'}&nbsp;: <b>${euro(suivi.total)}</b>${Number(suivi.discount) > 0 ? ` <small>(dont ${euro(suivi.discount)} offerts grâce à ta carte)</small>` : ''}</p>
    ${estDemo() ? '<p class="muted" style="font-size:13px">Mode démo : le statut change quand on fait avancer la commande dans le back-office (/admin).</p>' : ''}
    ${CONFIG.telephone ? `<a class="btn btn--sm btn--dark" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} Appeler le shop</a>` : ''}
  </div>`;
  majPied();
}

async function interroger() {
  if (!suivi) return;
  try {
    const d = await statutCommande(suivi.token);
    if (d && d.status !== suivi.status) {
      suivi = { ...suivi, status: d.status, total: d.total, reason: d.reason || null };
      ecrireSuivi();
      if (d.status === 'ready' && suivi.mode === 'shop') toast(`Commande n° ${suivi.number} prête au comptoir !`);
      if (d.status === 'delivering') toast(suivi.point ? `En route : rejoins le point « ${suivi.point.nom} »` : 'Ta commande est en route vers la plage');
      if (d.status === 'done') toast(suivi.mode === 'plage' ? 'Livrée, bonne plage !' : 'Merci et à très vite !');
      if (d.status === 'cancelled') toast(`Commande refusée${d.reason ? ` : ${d.reason}` : ''}`);
      if (d.status === 'arrived') {
        // le moment à ne pas rater : on ouvre le suivi avec la photo du point
        try { navigator.vibrate?.([200, 100, 200]); } catch { /* */ }
        if (panel.hidden) ouvrirPanneau('suivi'); else montrerVue('suivi');
        toast(suivi.point ? `Ton livreur est au point « ${suivi.point.nom} » !` : 'Ton livreur est là !');
      }
      if (!panel.hidden && etat.vue === 'suivi') majSuivi();
      majPastille();
    }
  } catch { /* réseau : on réessaie au prochain tour */ }
  if (['done', 'cancelled'].includes(suivi.status)) arreterSuivi();
}

function lancerSuivi() {
  majPastille();
  if (!suivi || ['done', 'cancelled'].includes(suivi.status) || minuteurSuivi) return;
  minuteurSuivi = setInterval(() => { if (!document.hidden) interroger(); }, 6000);
  interroger();
}
function arreterSuivi() { clearInterval(minuteurSuivi); minuteurSuivi = null; }

// Pastille « commande en cours » dans l'en-tête : on peut fermer la page et revenir
function majPastille() {
  const p = $('[data-track-pill]');
  if (!p) return;
  const actif = suivi && !['done', 'cancelled'].includes(suivi.status);
  p.hidden = !actif;
  if (!actif) return;
  const libelle = suivi.status === 'arrived' ? 'Livreur au point' : (ETAPES[suivi.mode] || ETAPES.shop).find(([k]) => k === suivi.status)?.[1] || (suivi.status === 'ready' ? 'En route' : 'Reçue');
  p.innerHTML = `<span class="track-pill__dot"></span><span>n° ${esc(suivi.number)} · ${esc(libelle)}</span>`;
}

function confettis() {
  if (reduceMotion()) return;
  const couleurs = ['#bf472c', '#f4c33f', '#2a1810', '#8db255', '#4aa3c9'];
  const box = q('.panel__box').getBoundingClientRect();
  for (let i = 0; i < 34; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.innerHTML = beanSVG();
    el.style.color = couleurs[i % couleurs.length];
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top + 170}px`;
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const d = 120 + Math.random() * 200;
    el.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 260}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 1400 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
  }
}

/* ── Branchements ─────────────────────────────────────────── */
export function initCheckout() {
  construire();

  q('[data-modes]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.disabled) return;
    panier.setMode(b.dataset.mode);
  });
  q('[data-lines]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-delta]');
    if (!b) return;
    const cle = b.closest('[data-line]').dataset.line;
    const l = panier.lignes().find((x) => x.cle === cle);
    if (l) panier.setQty(cle, l.qty + Number(b.dataset.delta));
  });
  q('[data-points]').addEventListener('change', (e) => {
    if (e.target.name !== 'point') return;
    cacherErreur();
    const id = e.target.value;
    panier.setPoint(id);
    q(`[data-points] input[value="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
  });
  q('[data-proche]').addEventListener('click', plusProche);
  // la photo d'un point s'ouvre en grand ; on peut le choisir depuis la visionneuse
  q('[data-points]').addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (!z) return;
    e.preventDefault();
    const ordre = [...q('[data-points]').querySelectorAll('input[name="point"]')].map((i) => trouverPoint(i.value)).filter((p) => p && p.photo);
    ouvrirVisionneuse(ordre.map((p) => ({ ...p, n: catalogue.points.indexOf(p) + 1 })), ordre.findIndex((p) => p.id === z.dataset.zoom), {
      choisir: (p) => { cacherErreur(); panier.setPoint(p.id); },
      estChoisi: (p) => panier.point === p.id,
    });
  });
  q('[data-creneaux]').addEventListener('change', (e) => { etat.creneau = e.target.value; });
  const form = q('[data-form]');
  form.addEventListener('input', (e) => {
    e.target.removeAttribute('aria-invalid');
    cacherErreur();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); envoyer(); });

  q('[data-next]').addEventListener('click', () => {
    if (etat.vue === 'suivi') return fermerPanneau();
    if (!panier.nb()) {
      if (document.body.dataset.page === 'carte') return fermerPanneau();
      if (history.state?.panneau) window.addEventListener('popstate', () => { window.location.href = 'carte'; }, { once: true });
      fermerPanneau();
      return;
    }
    envoyer();
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-close-panel]');
    if (!b) return;
    const cible = b.getAttribute('href');
    if (cible && !cible.startsWith('#') && cible !== document.body.dataset.page) {
      e.preventDefault();
      if (history.state?.panneau) window.addEventListener('popstate', () => { window.location.href = cible; }, { once: true });
      else window.location.href = cible;
    }
    fermerPanneau();
  });

  panier.onChange(() => { if (etat.vue === 'commande') majCommande(); });
  majCommande();
  window.addEventListener('popstate', () => fermerPanneau(true));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-track-pill]')) ouvrirPanneau('suivi'); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && minuteurSuivi) interroger(); });
  document.addEventListener('keydown', (e) => {
    const fiche = document.querySelector('#fiche-produit:not([hidden])');
    if (e.key === 'Escape' && !panel.hidden && !fiche) fermerPanneau();
    if (e.key === 'Tab' && !panel.hidden && !fiche) {
      const f = $$('a[href], button:not([disabled]), input:not(.hp), textarea, summary, [tabindex]:not([tabindex="-1"])', panel).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  lancerSuivi();
}

/* ═════════════════════════════════════════════════════════════
   Visionneuse : la photo d’un point en grand
   ═════════════════════════════════════════════════════════════ */
// Visionneuse : la photo d'un point de livraison en grand, avec son nom et son indication.
// On passe d'un point à l'autre (flèches, glisser du doigt) et on peut le choisir directement.
export const ouvrirVisionneuse = (() => {
  let el = null;
  let liste = [];
  let index = 0;
  let options = {};
  let retour = null;

  function construire() {
    el = document.createElement('div');
    el.className = 'vision';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'vision-titre');
    el.innerHTML = `<div class="vision__fond" data-v-fermer></div>
      <figure class="vision__box">
        <div class="vision__img"><img alt="">
          <button class="vision__nav vision__nav--prev" type="button" data-v-pas="-1" aria-label="Point précédent">${icon('back')}</button>
          <button class="vision__nav vision__nav--next" type="button" data-v-pas="1" aria-label="Point suivant">${icon('arrow')}</button>
          <span class="vision__n" aria-hidden="true"></span>
        </div>
        <figcaption><b id="vision-titre"></b><small></small></figcaption>
        <div class="vision__actions"></div>
        <button class="round-btn vision__x" type="button" data-v-fermer aria-label="Fermer">${icon('close')}</button>
      </figure>`;
    document.body.appendChild(el);

    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-v-fermer]')) return fermer();
      const pas = e.target.closest('[data-v-pas]');
      if (pas) return montrer(index + Number(pas.dataset.vPas));
      if (e.target.closest('[data-v-choisir]')) {
        options.choisir?.(liste[index]);
        fermer();
      }
    });
    // au clavier : Échap ferme, flèches pour passer d'un point à l'autre, Tab reste dans la visionneuse
    document.addEventListener('keydown', (e) => {
      if (el.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); fermer(); }
      else if (e.key === 'ArrowRight') montrer(index + 1);
      else if (e.key === 'ArrowLeft') montrer(index - 1);
      else if (e.key === 'Tab') {
        const f = [...el.querySelectorAll('button')].filter((b) => b.offsetParent !== null);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        e.stopPropagation();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
      }
    }, true);
    // au doigt : glisser à gauche ou à droite
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) montrer(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    window.addEventListener('popstate', () => { if (!el.hidden) fermer(); });
  }

  function montrer(i) {
    index = (i + liste.length) % liste.length;
    const p = liste[index];
    const img = el.querySelector('img');
    img.src = p.photo || '';
    img.alt = `Photo du point de livraison ${p.nom}`;
    el.querySelector('.vision__n').textContent = p.n ?? '';
    el.querySelector('figcaption b').textContent = p.nom;
    el.querySelector('figcaption small').textContent = p.indication || '';
    el.querySelectorAll('.vision__nav').forEach((b) => (b.hidden = liste.length < 2));
    const choisi = options.estChoisi?.(p);
    el.querySelector('.vision__actions').innerHTML = options.choisir
      ? `<button class="btn btn--block btn--lg" type="button" data-v-choisir>${choisi ? `${icon('check')} Point choisi` : `Choisir « ${esc(p.nom)} »`}</button>`
      : '';
  }

  // points : [{ nom, indication, photo, n }], i : celui à montrer d'abord
  function ouvrir(points, i = 0, opts = {}) {
    if (!points.length) return;
    if (!el) construire();
    liste = points;
    options = opts;
    retour = document.activeElement;
    el.hidden = false;
    montrer(i);
    el.querySelector('.vision__x').focus({ preventScroll: true });
  }

  function fermer() {
    el.hidden = true;
    retour?.focus?.({ preventScroll: true });
  }
  return ouvrir;
})();
