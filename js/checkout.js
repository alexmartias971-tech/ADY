// ─────────────────────────────────────────────────────────────
//  Tunnel de commande — pensé pour quelqu'un sur sa serviette :
//  1. Panier (et « livré sur la plage » ou « je passe au shop »)
//  2. Ton spot (GPS lancé tout seul + photo)  ·  ou  ·  heure de passage
//  3. Prénom, téléphone (mémorisés), paiement, carte fidélité
//  4. Suivi en direct (reste accessible depuis l'en-tête)
// ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';
import { catalogue, trouverProduit, libelleOptions, choixParDefaut, zone, envoyerPhoto, passerCommande, statutCommande, enService, estDemo } from './data.js';
import { illustration } from './illustrations.js';
import { panier } from './cart.js';
import { etatOuverture } from './horaires.js';
import { icon } from './icons.js';
import { polaroid, livreurSeul } from './scene.js';
import { chargerLeaflet, iconePin, iconeShop } from './map.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale, toast, beanSVG, distanceMetres, reduceMotion } from './utils.js';
import { ouvrirFiche } from './sheet.js';
import { ajouter, ton } from './produits.js';

const CLE_CLIENT = 'ady-client-v1';
const CLE_SUIVI = 'ady-suivi-v1';
const CRENEAUX = ['Dès que possible', 'Dans 15 min', 'Dans 30 min', 'Dans 1 h'];

let panel;
const etat = { etape: 1, position: null, photo: null, photoBlob: null, envoi: false, creneau: CRENEAUX[0], dejaLocalise: false };
let suivi = lireSuivi();
let minuteurSuivi = null;
let focusAvant = null;
let map = null;
let L = null;
let marqueur = null;
let cerclePrecision = null;

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

const flux = () => (panier.mode === 'plage' ? [1, 2, 3] : [1, 'retrait', 3]);
const R = () => catalogue.reglages;

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
      <button class="round-btn" type="button" data-back aria-label="Étape précédente" hidden>${icon('back')}</button>
      <h2 id="commande-titre">Ma commande</h2>
      <button class="round-btn" type="button" data-close-panel aria-label="Fermer">${icon('close')}</button>
    </header>
    <div class="modes" role="radiogroup" aria-label="Comment veux-tu ta commande ?" data-modes>
      <button type="button" role="radio" data-mode="plage">${icon('pin')}<span><b>Livré sur la plage</b><small data-mode-plage-sub>Caravelle · dès 5 €</small></span></button>
      <button type="button" role="radio" data-mode="shop">${icon('bag')}<span><b>Je passe au shop</b><small>Prête à ton arrivée</small></span></button>
    </div>
    <ol class="progress" data-progress><li data-dot="1">Panier</li><li data-dot="2" data-dot-label>Ton spot</li><li data-dot="3">Contact</li></ol>
    <div class="panel__body" data-body>
      <section class="step" data-step="1">
        <p class="notice" data-ferme hidden></p>
        <div class="cart-empty" data-empty>
          <svg viewBox="0 0 728 584" aria-hidden="true"><use href="assets/brand.svg#st-head"/></svg>
          <p><b>Ton panier est vide.</b><br>Une petite soif&nbsp;?</p>
          <a class="btn btn--sm" href="carte" data-close-panel>Voir la carte</a>
        </div>
        <ul class="cart-lines" data-lines></ul>
        <div class="min-meter" data-meter><div class="min-meter__beans" data-meter-beans></div><p data-meter-text></p></div>
        <div class="upsell" data-upsell></div>
      </section>

      <section class="step" data-step="2" hidden>
        <h3 class="step__title">Où es-tu&nbsp;?</h3>
        <p>On te localise tout seul. Déplace l’épingle si besoin, ou touche la carte.</p>
        <div class="map-wrap">
          <div class="map" id="carte-livraison" aria-label="Carte de la plage pour placer ta position"></div>
          <button class="btn btn--sm map-locate" type="button" data-locate>${icon('locate')} Me localiser</button>
        </div>
        <p class="geo-status" data-geo role="status">Ta position n’est pas encore définie.</p>
        <h3 class="step__title">Ton spot en photo <span class="req" data-photo-req>obligatoire</span></h3>
        <p>C’est ce qui aide le plus le livreur à te trouver.</p>
        <div class="photo-tip"><svg viewBox="-6 -6 136 156" aria-hidden="true">${polaroid({ x: 0, y: 0, w: 120, rot: -4 })}</svg><span>Cadre ta serviette ou ton parasol, avec un repère visible&nbsp;: poste de secours, palmier, bateau…</span></div>
        <div class="photo__actions" data-photo-actions>
          <label class="photo__btn photo__btn--main"><input type="file" accept="image/*" capture="environment" data-photo-input>${icon('camera')} Prendre la photo</label>
          <label class="photo__btn"><input type="file" accept="image/*" data-photo-input>${icon('image')} Galerie</label>
        </div>
        <figure class="photo__preview" data-photo-preview hidden>
          <img alt="Photo de ton spot" data-photo-img>
          <figcaption>ton spot</figcaption>
          <button type="button" class="round-btn photo__remove" data-photo-remove aria-label="Supprimer la photo">${icon('close')}</button>
        </figure>
        <label class="field"><span>Un repère en plus&nbsp;? <em>(facultatif)</em></span>
          <input type="text" maxlength="160" placeholder="Ex. parasol jaune, à droite du poste de secours" data-landmark></label>
      </section>

      <section class="step" data-step="retrait" hidden>
        <h3 class="step__title">Tu passes quand&nbsp;?</h3>
        <p>On lance la préparation pour que ce soit prêt à ton arrivée.</p>
        <div class="choices choices--big" role="radiogroup" aria-label="Heure de passage" data-creneaux></div>
        <div class="pickup-card">
          <svg viewBox="0 0 728 584" aria-hidden="true"><use href="assets/brand.svg#st-head"/></svg>
          <div><b>ADY Coffee Shop</b><span data-address-pickup></span><a class="link-arrow" data-directions-pickup target="_blank" rel="noopener">Itinéraire ${icon('arrow')}</a></div>
        </div>
      </section>

      <section class="step" data-step="3" hidden>
        <h3 class="step__title">Tes coordonnées</h3>
        <form data-form novalidate>
          <label class="field"><span>Prénom</span><input type="text" name="prenom" autocomplete="given-name" maxlength="60" required placeholder="Marie"></label>
          <label class="field"><span>Téléphone <em data-tel-hint>(le livreur peut t’appeler)</em></span><input type="tel" name="telephone" autocomplete="tel" inputmode="tel" maxlength="30" placeholder="0690 12 34 56"></label>
          <fieldset class="field"><legend data-pay-legend>Paiement à la livraison</legend><div class="choices" data-payments></div></fieldset>
          <details class="loyal" data-loyal>
            <summary>${icon('card')} J’ai une carte fidélité ADY</summary>
            <label class="field"><span>Numéro de carte <em>(sous le QR code)</em></span><input type="text" name="fidelite" maxlength="20" placeholder="ADY-0000" autocomplete="off" style="text-transform:uppercase"></label>
            <label class="check" data-reward hidden><input type="checkbox" name="recompense"> J’utilise ma récompense&nbsp;: ma boisson la moins chère est offerte</label>
          </details>
          <label class="field"><span>Une note pour nous&nbsp;? <em>(facultatif)</em></span><input type="text" name="note" maxlength="200" placeholder="Bien glacé, sans paille…"></label>
          <label class="check"><input type="checkbox" name="memo" checked> Se souvenir de moi sur ce téléphone</label>
          <input class="hp" type="text" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
        </form>
        <div class="recap" data-recap></div>
        <p class="legal-note">En commandant, tu acceptes nos <a href="cgv" target="_blank">conditions de vente</a>. Ta position et ta photo servent uniquement à te livrer (<a href="mentions-legales#donnees" target="_blank">en savoir plus</a>).</p>
      </section>

      <section class="step" data-step="4" hidden><div data-suivi></div></section>
    </div>
    <footer class="panel__foot">
      <div class="totals" data-totals></div>
      <p class="form-error" data-error role="alert" hidden></p>
      <button class="btn btn--block btn--lg" type="button" data-next>Continuer</button>
    </footer>
  </div>`;
  document.body.appendChild(panel);
}

const q = (sel) => $(sel, panel);

/* ── Ouverture / fermeture ────────────────────────────────── */
export function ouvrirPanneau(etape = 1) {
  if (etape === 4 && !suivi) etape = 1;
  if (etape !== 4 && etape !== 1 && !panierValide()) etape = 1;
  if (!panel.hidden) return allerA(etape);
  focusAvant = document.activeElement;
  $('[data-toast]')?.classList.remove('is-on');
  panel.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  history.pushState({ panneau: true }, '');
  allerA(etape);
  setTimeout(() => q('.panel__head [data-close-panel]').focus({ preventScroll: true }), 60);
}

function fermerPanneau(depuisHistorique = false) {
  if (panel.hidden) return;
  panel.hidden = true;
  document.documentElement.style.overflow = '';
  if (!depuisHistorique && history.state?.panneau) history.back();
  focusAvant?.focus?.({ preventScroll: true });
}

/* ── Étapes ───────────────────────────────────────────────── */
function allerA(n) {
  if (n === 2 && panier.mode === 'shop') n = 'retrait';
  if (n === 'retrait' && panier.mode === 'plage') n = 2;
  etat.etape = n;
  cacherErreur();
  $$('[data-step]', panel).forEach((s) => (s.hidden = String(s.dataset.step) !== String(n)));
  const idx = n === 4 ? 4 : flux().indexOf(n) + 1;
  $$('[data-dot]', panel).forEach((li) => {
    const i = Number(li.dataset.dot);
    li.classList.toggle('is-active', i === idx);
    li.classList.toggle('is-done', i < idx);
  });
  q('[data-dot-label]').textContent = panier.mode === 'plage' ? 'Ton spot' : 'Retrait';
  q('[data-progress]').hidden = n === 4;
  q('[data-modes]').hidden = n !== 1;
  q('[data-back]').hidden = n === 1 || n === 4;
  q('[data-body]').scrollTop = 0;
  if (n === 2) initCarte();
  if (n === 'retrait') majCreneaux();
  if (n === 3) { prerempli(); majContact(); majRecap(); }
  if (n === 4) majSuivi();
  majPied();
}

const fraisLivraison = () => (panier.mode === 'plage' && panier.nb() ? CONFIG.fraisLivraison : 0);
const total = () => panier.sousTotal() + fraisLivraison();
const minimum = () => (panier.mode === 'plage' ? Number(R().beach_min) || 0 : 0);

function blocage() {
  if (!R().orders_open) return 'Les commandes en ligne sont fermées pour le moment. Tu peux toujours passer au shop !';
  if (panier.mode === 'plage' && !R().beach_open) return 'La livraison plage est fermée pour le moment. Tu peux commander à emporter.';
  if (CONFIG.bloquerHorsHoraires && !etatOuverture(CONFIG).livraison) return 'Le shop est fermé pour le moment : reviens pendant les horaires d’ouverture.';
  const horsService = panier.lignes().map((l) => trouverProduit(l.pid)).find((p) => p && !enService(p));
  if (horsService) return `${horsService.nom} n’est servi qu’à l’heure du déjeuner : retire-le pour commander maintenant.`;
  return null;
}

function panierValide() {
  return panier.nb() > 0 && panier.sousTotal() >= minimum() && !blocage();
}

function majPied() {
  const n = etat.etape;
  const st = panier.sousTotal();
  q('[data-totals]').innerHTML = n === 4 || !panier.nb() ? '' : `<div><span>Sous-total</span><span>${euro(st)}</span></div>
    ${panier.mode === 'plage' ? `<div><span>Livraison sur la plage</span><span>${fraisLivraison() ? euro(fraisLivraison()) : 'Offerte'}</span></div>` : ''}
    <div class="totals__grand"><span>Total</span><span>${euro(total())}</span></div>`;
  const b = q('[data-next]');
  const fleche = icon('arrow', 'icon--arrow');
  if (n === 1) {
    const bloque = blocage();
    b.innerHTML = panier.mode === 'plage' ? `Choisir mon spot ${fleche}` : `Choisir mon heure ${fleche}`;
    b.disabled = !panierValide();
    const f = q('[data-ferme]');
    f.hidden = !bloque || !panier.nb();
    f.textContent = bloque || '';
  } else if (n === 2 || n === 'retrait') {
    b.innerHTML = `Continuer ${fleche}`;
    b.disabled = false;
  } else if (n === 3) {
    b.textContent = etat.envoi ? 'Envoi en cours…' : `Envoyer ma commande · ${euro(total())}`;
    b.disabled = etat.envoi;
  } else {
    b.textContent = suivi && !['done', 'cancelled'].includes(suivi.status) ? 'Continuer ma visite' : 'Fermer';
    b.disabled = false;
  }
}

const montrerErreur = (msg) => { const e = q('[data-error]'); e.textContent = msg; e.hidden = false; };
const cacherErreur = () => { q('[data-error]').hidden = true; };

/* ── Mode : plage ou shop ─────────────────────────────────── */
function majModes() {
  const plageOff = !R().beach_open;
  if (plageOff && panier.mode === 'plage') panier.setMode('shop');
  $$('[data-mode]', panel).forEach((b) => {
    const on = b.dataset.mode === panier.mode;
    b.setAttribute('aria-checked', String(on));
    b.classList.toggle('is-on', on);
    b.disabled = b.dataset.mode === 'plage' && plageOff;
  });
  q('[data-mode-plage-sub]').textContent = plageOff ? 'Fermée pour le moment' : `Caravelle · dès ${euroCourt(Number(R().beach_min))}`;
}

/* ── Étape 1 : panier ─────────────────────────────────────── */
function majPanier() {
  if (!panel) return;
  majModes();
  const lignes = panier.lignes();
  q('[data-empty]').hidden = lignes.length > 0;
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

  // jauge du minimum de commande (livraison plage seulement), façon carte fidélité
  const st = panier.sousTotal();
  const min = minimum();
  const meter = q('[data-meter]');
  meter.hidden = !lignes.length || panier.mode !== 'plage';
  if (!meter.hidden) {
    const allumes = Math.round(Math.min(1, min > 0 ? st / min : 1) * 10);
    meter.classList.toggle('is-ok', st >= min);
    q('[data-meter-beans]').innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="bean${i < allumes ? ' is-on' : ''}">${beanSVG()}</span>`).join('');
    q('[data-meter-text]').innerHTML = st >= min ? 'C’est bon, on se déplace jusqu’à toi&nbsp;!' : `Encore <b>${euro(min - st)}</b> pour la livraison sur la plage (minimum ${euroCourt(min)}).`;
  }

  // « Avec ça ? » : les signatures et le salé, pas encore dans le panier
  const dans = new Set(lignes.map((l) => l.pid));
  const idees = catalogue.produits.filter((p) => !p.epuise && enService(p) && p.kind !== 'merch' && !dans.has(p.id) && (p.vedette || p.signature)).slice(0, 8);
  q('[data-upsell]').innerHTML = lignes.length && idees.length ? `<h3>Avec ça&nbsp;?</h3><div class="upsell__list">${idees.map((p) => `
      <button type="button" class="upsell__item" data-idee="${p.id}"><div class="art" style="--tone:${ton(p)}">${illustration(p)}</div><b>${esc(p.nom)}</b><span>${euro(p.prix)} ${icon('plus')}</span></button>`).join('')}</div>` : '';

  if (etat.etape === 3) majRecap();
  if (!panel.hidden && !lignes.length && [2, 'retrait', 3].includes(etat.etape)) allerA(1);
  majPied();
}

/* ── Étape 2 : carte, GPS, photo ──────────────────────────── */
const dansLaZone = (pos) => distanceMetres(pos, zone().centre) <= zone().rayonMetres;

async function initCarte() {
  if (!map) {
    try {
      L = await chargerLeaflet();
    } catch {
      q('#carte-livraison').innerHTML = '<p style="padding:16px">La carte n’a pas pu se charger. Utilise «&nbsp;Me localiser&nbsp;» et la photo de ton spot.</p>';
      return;
    }
    const z = zone();
    map = L.map('carte-livraison', { zoomControl: true, scrollWheelZoom: false }).setView([z.centre.lat, z.centre.lng], 16);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    L.circle([z.centre.lat, z.centre.lng], { radius: z.rayonMetres, color: '#bf472c', weight: 3, dashArray: '8 8', fillColor: '#bf472c', fillOpacity: 0.07, interactive: false }).addTo(map);
    map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2), { padding: [10, 10], animate: false });
    if (CONFIG.shop) L.marker([CONFIG.shop.lat, CONFIG.shop.lng], { interactive: false, keyboard: false, icon: iconeShop(L) }).addTo(map);
    map.on('click', (e) => placer(e.latlng.lat, e.latlng.lng, null, 'manuel'));
    if (etat.position) placer(etat.position.lat, etat.position.lng, etat.position.precision, etat.position.source);
  }
  setTimeout(() => map.invalidateSize(), 80);
  // on évite un clic : la localisation se lance toute seule la première fois
  if (!etat.position && !etat.dejaLocalise) {
    etat.dejaLocalise = true;
    localiser();
  }
}

function placer(lat, lng, precision, source) {
  etat.position = { lat, lng, precision, source };
  if (map && L) {
    if (!marqueur) {
      marqueur = L.marker([lat, lng], { draggable: true, autoPan: true, icon: iconePin(L), title: 'Ma position' }).addTo(map);
      marqueur.on('dragend', () => {
        const p = marqueur.getLatLng();
        cerclePrecision?.remove(); cerclePrecision = null;
        etat.position = { lat: p.lat, lng: p.lng, precision: null, source: 'manuel' };
        majGeo();
      });
    } else marqueur.setLatLng([lat, lng]);
    cerclePrecision?.remove(); cerclePrecision = null;
    if (precision) cerclePrecision = L.circle([lat, lng], { radius: precision, color: '#2a1810', weight: 1, fillOpacity: 0.08, interactive: false }).addTo(map);
  }
  majGeo();
}

function majGeo(message) {
  const el = q('[data-geo]');
  el.classList.remove('is-ok', 'is-ko');
  if (message) { el.textContent = message; el.classList.add('is-ko'); return; }
  if (!etat.position) { el.textContent = 'Ta position n’est pas encore définie.'; return; }
  if (dansLaZone(etat.position)) {
    const p = etat.position.precision;
    el.textContent = `C’est noté, tu es dans la zone de livraison${p ? ` (précision ±${Math.round(p)} m)` : ''}.`;
    el.classList.add('is-ok');
  } else {
    el.textContent = `Hors zone : on livre uniquement sur la ${minusculeInitiale(CONFIG.zone.nom)}. Si ta position est fausse, déplace l’épingle.`;
    el.classList.add('is-ko');
  }
}

function localiser() {
  if (!('geolocation' in navigator) || !window.isSecureContext) {
    majGeo('La localisation n’est pas disponible ici. Touche la carte pour placer l’épingle.');
    return;
  }
  const btn = q('[data-locate]');
  btn.disabled = true;
  q('[data-geo]').textContent = 'Localisation en cours…';
  navigator.geolocation.getCurrentPosition((pos) => {
    btn.disabled = false;
    const { latitude, longitude, accuracy } = pos.coords;
    placer(latitude, longitude, accuracy, 'gps');
    if (!map) return;
    if (dansLaZone(etat.position)) map.setView([latitude, longitude], 18);
    else {
      const z = zone();
      map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2).extend([latitude, longitude]), { padding: [24, 24] });
    }
  }, (err) => {
    btn.disabled = false;
    majGeo(err.code === 1
      ? 'Localisation refusée. Autorise-la dans les réglages de ton navigateur, ou touche la carte pour placer l’épingle.'
      : 'Impossible de te localiser pour le moment. Touche la carte pour placer l’épingle.');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

// Photo redimensionnée et compressée dans le navigateur avant l'envoi
async function compresser(fichier, max) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * r);
    c.height = Math.round(img.naturalHeight * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.75));
    return { blob, apercu: c.toDataURL('image/jpeg', 0.6) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function majPhoto() {
  q('[data-photo-preview]').hidden = !etat.photo;
  q('[data-photo-actions]').hidden = !!etat.photo;
  if (etat.photo) q('[data-photo-img]').src = etat.photo;
}

/* ── Étape « retrait » ────────────────────────────────────── */
function majCreneaux() {
  q('[data-creneaux]').innerHTML = CRENEAUX.map((c) => `<label class="choice"><input type="radio" name="creneau" value="${c}"${c === etat.creneau ? ' checked' : ''}><span>${c}</span></label>`).join('');
  q('[data-address-pickup]').textContent = CONFIG.adresse;
  q('[data-directions-pickup]').href = CONFIG.lienItineraire;
}

/* ── Étape 3 : contact & récap ────────────────────────────── */
function majContact() {
  const plage = panier.mode === 'plage';
  q('[data-tel-hint]').textContent = plage ? '(le livreur peut t’appeler)' : '(facultatif, pour te prévenir)';
  q('[data-pay-legend]').textContent = plage ? 'Paiement à la livraison' : 'Paiement au comptoir';
  const actuel = q('[data-form]').querySelector('input[name="paiement"]:checked')?.value;
  q('[data-payments]').innerHTML = CONFIG.paiements
    .map((p, i) => `<label class="choice"><input type="radio" name="paiement" value="${p.id}"${(actuel ? actuel === p.id : i === 0) ? ' checked' : ''}><span>${esc(p.label)}</span></label>`).join('');
}

function prerempli() {
  const f = q('[data-form]');
  if (f.elements.prenom.value) return;
  try {
    const c = JSON.parse(localStorage.getItem(CLE_CLIENT) || 'null');
    if (!c) return;
    f.elements.prenom.value = c.prenom || '';
    f.elements.telephone.value = c.telephone || '';
    if (c.fidelite) {
      f.elements.fidelite.value = c.fidelite;
      q('[data-loyal]').open = true;
      q('[data-reward]').hidden = false;
    }
    setTimeout(() => {
      const pay = f.querySelector(`input[name="paiement"][value="${c.paiement}"]`);
      if (pay) pay.checked = true;
    });
  } catch { /* stockage indisponible */ }
}

function majRecap() {
  const plage = panier.mode === 'plage';
  const repere = q('[data-landmark]').value.trim();
  q('[data-recap]').innerHTML = `<h4>Récap</h4><ul>${panier.lignes().map((l) => {
    const p = trouverProduit(l.pid);
    const o = libelleOptions(l.pid, l.opts, l.vid);
    return `<li>${l.qty} × ${esc(p.nom)}${o ? ` <span class="muted">(${esc(o)})</span>` : ''}</li>`;
  }).join('')}</ul>
  <div class="recap__spot">${plage && etat.photo ? `<img src="${etat.photo}" alt="Ton spot">` : `<span class="recap__ico">${icon(plage ? 'pin' : 'bag')}</span>`}
    <span>${plage ? `Livraison sur la ${esc(minusculeInitiale(CONFIG.zone.nom))}${repere ? `<br><b>Repère :</b> ${esc(repere)}` : ''}` : `Retrait au shop · <b>${esc(etat.creneau)}</b>`}</span></div>`;
}

function lireContact() {
  const d = new FormData(q('[data-form]'));
  return {
    prenom: String(d.get('prenom') || '').trim(),
    telephone: String(d.get('telephone') || '').trim(),
    paiement: String(d.get('paiement') || ''),
    note: String(d.get('note') || '').trim(),
    fidelite: String(d.get('fidelite') || '').trim().toUpperCase(),
    recompense: d.get('recompense') === 'on',
    memo: d.get('memo') === 'on',
    site: String(d.get('site') || ''),
  };
}

function validerContact() {
  const c = lireContact();
  const f = q('[data-form]');
  const telOk = c.telephone.replace(/\D/g, '').length >= 8;
  const telRequis = panier.mode === 'plage';
  f.elements.prenom.setAttribute('aria-invalid', String(!c.prenom));
  f.elements.telephone.setAttribute('aria-invalid', String(telRequis && !telOk));
  if (!c.prenom) { f.elements.prenom.focus(); return 'Indique ton prénom pour qu’on t’appelle quand c’est prêt.'; }
  if (telRequis && !telOk) { f.elements.telephone.focus(); return 'Ajoute ton numéro : le livreur peut avoir besoin de t’appeler.'; }
  return null;
}

/* ── Envoi ────────────────────────────────────────────────── */
async function envoyer() {
  const msg = validerContact();
  if (msg) return montrerErreur(msg);
  const c = lireContact();
  if (c.site) return; // robot
  cacherErreur();
  etat.envoi = true;
  majPied();
  const plage = panier.mode === 'plage';
  try {
    let photoPath = null;
    if (plage && etat.photoBlob) photoPath = await envoyerPhoto(etat.photoBlob);
    const paiement = CONFIG.paiements.find((p) => p.id === c.paiement)?.label || '';
    const payload = {
      mode: panier.mode,
      name: c.prenom,
      phone: c.telephone,
      when: plage ? null : etat.creneau,
      note: [c.note, paiement && `Paiement : ${paiement}`].filter(Boolean).join(' · '),
      spot: plage ? q('[data-landmark]').value.trim() : null,
      lat: plage ? etat.position?.lat : null,
      lng: plage ? etat.position?.lng : null,
      accuracy: plage && etat.position?.precision ? Math.round(etat.position.precision) : null,
      photo_path: photoPath,
      loyalty_code: c.fidelite || null,
      reward_claimed: !!(c.fidelite && c.recompense),
      items: panier.lignes().map((l) => ({ product_id: l.pid, variant_id: l.vid, qty: l.qty, options: l.opts })),
    };
    const data = await passerCommande(payload);
    try {
      if (c.memo) localStorage.setItem(CLE_CLIENT, JSON.stringify({ prenom: c.prenom, telephone: c.telephone, paiement: c.paiement, fidelite: c.fidelite }));
      else localStorage.removeItem(CLE_CLIENT);
    } catch { /* */ }
    suivi = { token: data.token, number: data.number, mode: panier.mode, total: data.total, discount: data.discount, status: 'new', at: Date.now(), quand: plage ? null : etat.creneau };
    ecrireSuivi();
    panier.vider();
    Object.assign(etat, { photo: null, photoBlob: null, position: null, dejaLocalise: false });
    marqueur?.remove(); marqueur = null;
    cerclePrecision?.remove(); cerclePrecision = null;
    q('[data-landmark]').value = '';
    q('[data-form]').elements.note.value = '';
    q('[data-form]').elements.recompense.checked = false;
    majPhoto();
    etat.envoi = false;
    allerA(4);
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
  plage: [['new', 'Reçue', 'On a ta photo et ta position.'], ['preparing', 'En préparation', 'Le livreur part juste après.'], ['delivering', 'En route vers toi', 'Garde ton téléphone à portée.'], ['done', 'Livrée', 'Bonne plage !']],
};

function majSuivi() {
  const el = q('[data-suivi]');
  if (!suivi) { el.innerHTML = ''; return; }
  if (suivi.status === 'cancelled') {
    el.innerHTML = `<div class="done"><span class="order-num">n° ${suivi.number}</span><h3>Commande annulée</h3><p>Le shop a annulé cette commande. Si c’est une erreur, passe nous voir ou recommande.</p></div>`;
    majPied();
    return;
  }
  const etapes = ETAPES[suivi.mode] || ETAPES.shop;
  let idx = etapes.findIndex(([k]) => k === suivi.status);
  if (suivi.status === 'ready' && suivi.mode === 'plage') idx = 2;
  if (idx < 0) idx = 0;
  const titre = suivi.status === 'done' ? (suivi.mode === 'plage' ? 'Livrée, bonne plage&nbsp;!' : 'Bonne dégustation&nbsp;!') : idx === 0 ? 'C’est parti&nbsp;!' : etapes[idx][1];
  const enRoute = suivi.mode === 'plage' && idx === 2;
  el.innerHTML = `<div class="done">
    <div class="done__art${enRoute ? ' is-route' : ''}">${enRoute ? livreurSeul() : '<svg viewBox="0 0 728 584" aria-hidden="true" style="--st-bg:var(--cream-2);--st-ink:var(--terra)"><use href="assets/brand.svg#st-head"/></svg>'}</div>
    <span class="order-num">n° ${esc(suivi.number)}</span>
    <h3>${titre}</h3>
    <p>${suivi.mode === 'plage' ? `On arrive sur la plage dans <b>${esc(CONFIG.delaiLivraison)}</b> environ.` : `Retrait au shop · <b>${esc(suivi.quand || 'dès que possible')}</b>.`}</p>
    <ol class="timeline">${etapes.map(([, l, d], i) => `<li class="${i < idx ? 'is-done' : i === idx ? (suivi.status === 'done' ? 'is-done' : 'is-now') : ''}"><span><b>${l}</b>${d}</span></li>`).join('')}</ol>
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
      suivi = { ...suivi, status: d.status, total: d.total };
      ecrireSuivi();
      if (d.status === 'ready' && suivi.mode === 'shop') toast(`Commande n° ${suivi.number} prête au comptoir !`);
      if (d.status === 'delivering') toast('Ta commande est en route vers la plage');
      if (d.status === 'done') toast(suivi.mode === 'plage' ? 'Livrée, bonne plage !' : 'Merci et à très vite !');
      if (!panel.hidden && etat.etape === 4) majSuivi();
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
  const libelle = (ETAPES[suivi.mode] || ETAPES.shop).find(([k]) => k === suivi.status)?.[1] || (suivi.status === 'ready' ? 'En route vers toi' : 'Reçue');
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
  q('[data-photo-req]').hidden = !R().beach_photo_required;

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
  q('[data-upsell]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-idee]');
    if (!b) return;
    const p = trouverProduit(b.dataset.idee);
    if (p.variantes.length || p.groupes.some((g) => g.id === 'temperature')) ouvrirFiche(p);
    else ajouter(p, choixParDefaut(p), null, 1, b.querySelector('.art'));
  });
  q('[data-locate]').addEventListener('click', localiser);
  $$('[data-photo-input]', panel).forEach((input) => input.addEventListener('change', async () => {
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Ce fichier n’est pas une image.');
    try {
      const { blob, apercu } = await compresser(f, estDemo() ? 800 : 1280);
      etat.photo = apercu;
      etat.photoBlob = blob;
      majPhoto();
      cacherErreur();
    } catch {
      toast('Impossible de lire cette photo, essaie avec une autre.');
    }
  }));
  q('[data-photo-remove]').addEventListener('click', () => { etat.photo = null; etat.photoBlob = null; majPhoto(); });
  q('[data-landmark]').addEventListener('input', () => etat.etape === 3 && majRecap());
  q('[data-creneaux]').addEventListener('change', (e) => { etat.creneau = e.target.value; });
  const form = q('[data-form]');
  form.addEventListener('input', (e) => {
    e.target.removeAttribute('aria-invalid');
    cacherErreur();
    if (e.target.name === 'fidelite') q('[data-reward]').hidden = !e.target.value.trim();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); envoyer(); });

  q('[data-next]').addEventListener('click', () => {
    const n = etat.etape;
    if (n === 1) {
      const b = blocage();
      if (b) return montrerErreur(b);
      if (panier.sousTotal() < minimum()) return montrerErreur(`Le minimum pour la livraison plage est de ${euroCourt(minimum())}.`);
      return allerA(panier.mode === 'plage' ? 2 : 'retrait');
    }
    if (n === 2) {
      if (!etat.position) return montrerErreur('Place ton épingle sur la carte (ou touche « Me localiser ») pour qu’on te trouve.');
      if (!dansLaZone(etat.position)) return montrerErreur(`Ta position est en dehors de la zone de livraison (${CONFIG.zone.nom}).`);
      if (R().beach_photo_required && !etat.photo) return montrerErreur('Ajoute une petite photo de ton spot : c’est ce qui aide le plus le livreur.');
      return allerA(3);
    }
    if (n === 'retrait') return allerA(3);
    if (n === 3) return envoyer();
    fermerPanneau();
  });
  q('[data-back]').addEventListener('click', () => {
    const f = flux();
    const i = f.indexOf(etat.etape);
    allerA(i > 0 ? f[i - 1] : 1);
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

  panier.onChange(majPanier);
  majPanier();
  window.addEventListener('popstate', () => fermerPanneau(true));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-track-pill]')) ouvrirPanneau(4); });
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
