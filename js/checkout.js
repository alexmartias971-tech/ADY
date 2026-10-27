// Tunnel de commande plage : panier → spot (GPS + photo) → contact → confirmation
import { CONFIG } from './config.js';
import { PRODUITS, trouverProduit, libelleOptions } from './menu.js';
import { illustration } from './illustrations.js';
import { panier } from './cart.js';
import { etatOuverture } from './horaires.js';
import { icon } from './icons.js';
import { polaroid } from './scene.js';
import { chargerLeaflet, iconePin, iconeShop } from './map.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale, toast, beanSVG, distanceMetres, reduceMotion } from './utils.js';
import { ouvrirFiche } from './sheet.js';
import { ajouter } from './produits.js';

const CLE_CLIENT = 'ady-client-v1';
const TONS = { iced: 'var(--sky)', hot: 'var(--peach)', matcha: 'var(--sage)', fresh: 'var(--sun)', food: 'var(--sand)' };

let panel;
const etat = { etape: 1, position: null, photo: null, envoi: false, numero: null };
let focusAvant = null;
let map = null;
let L = null;
let marqueur = null;
let cerclePrecision = null;

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
    <ol class="progress" data-progress><li data-dot="1">Panier</li><li data-dot="2">Ton spot</li><li data-dot="3">Contact</li></ol>
    <div class="panel__body" data-body>
      <section class="step" data-step="1">
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
        <p>Touche «&nbsp;Me localiser&nbsp;», puis déplace l’épingle si besoin. Tu peux aussi toucher la carte.</p>
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
          <input type="text" maxlength="140" placeholder="Ex. parasol jaune, à droite du poste de secours" data-landmark></label>
      </section>

      <section class="step" data-step="3" hidden>
        <h3 class="step__title">Tes coordonnées</h3>
        <form data-form novalidate>
          <label class="field"><span>Prénom</span><input type="text" name="prenom" autocomplete="given-name" maxlength="40" required placeholder="Marie"></label>
          <label class="field"><span>Téléphone <em>(le livreur peut t’appeler)</em></span><input type="tel" name="telephone" autocomplete="tel" inputmode="tel" maxlength="20" required placeholder="0690 12 34 56"></label>
          <fieldset class="field"><legend>Paiement à la livraison</legend><div class="choices" data-payments></div></fieldset>
          <label class="field"><span>Une note pour nous&nbsp;? <em>(facultatif)</em></span><textarea name="note" rows="2" maxlength="300" placeholder="Allergie, monnaie à prévoir…"></textarea></label>
          <label class="check"><input type="checkbox" name="memo" checked> Se souvenir de moi sur cet appareil</label>
          <input class="hp" type="text" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
        </form>
        <div class="recap" data-recap></div>
        <p class="legal-note">En commandant, tu acceptes nos <a href="cgv" target="_blank">conditions de vente</a>. Ta position et ta photo servent uniquement à te livrer (<a href="mentions-legales#donnees" target="_blank">en savoir plus</a>).</p>
      </section>

      <section class="step" data-step="4" hidden>
        <div class="done">
          <svg class="done__art" viewBox="0 0 728 584" aria-hidden="true" style="--st-bg:var(--cream-2);--st-ink:var(--terra)"><use href="assets/brand.svg#st-head"/></svg>
          <h3 data-done-title>C’est parti&nbsp;!</h3>
          <div data-done-text></div>
          <div class="done__actions" data-done-actions></div>
        </div>
      </section>
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
  if (etape > 1 && panier.sousTotal() < CONFIG.commandeMinimum) etape = 1;
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
  if (etat.etape === 4) reinitialiser();
  if (!depuisHistorique && history.state?.panneau) history.back();
  focusAvant?.focus?.({ preventScroll: true });
}

function reinitialiser() {
  Object.assign(etat, { etape: 1, numero: null, photo: null, position: null });
  marqueur?.remove(); marqueur = null;
  cerclePrecision?.remove(); cerclePrecision = null;
  majPhoto();
  majGeo();
  q('[data-landmark]').value = '';
  q('[data-form]').elements.note.value = '';
}

/* ── Étapes ───────────────────────────────────────────────── */
function allerA(n) {
  etat.etape = n;
  cacherErreur();
  $$('[data-step]', panel).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  $$('[data-dot]', panel).forEach((li) => {
    const i = Number(li.dataset.dot);
    li.classList.toggle('is-active', i === n);
    li.classList.toggle('is-done', i < n);
  });
  q('[data-progress]').hidden = n === 4;
  q('[data-back]').hidden = n === 1 || n === 4;
  q('#commande-titre').textContent = n === 4 ? 'Merci !' : 'Ma commande';
  q('[data-body]').scrollTop = 0;
  if (n === 2) initCarte();
  if (n === 3) { prerempli(); majRecap(); }
  majPied();
}

function total() {
  return panier.sousTotal() + (panier.nb() ? CONFIG.fraisLivraison : 0);
}

function majPied() {
  const n = etat.etape;
  const st = panier.sousTotal();
  const totals = q('[data-totals]');
  totals.innerHTML = n === 4 || !panier.nb() ? '' : `<div><span>Sous-total</span><span>${euro(st)}</span></div>
    <div><span>Livraison sur la plage</span><span>${CONFIG.fraisLivraison ? euro(CONFIG.fraisLivraison) : 'Offerte'}</span></div>
    <div class="totals__grand"><span>Total</span><span>${euro(total())}</span></div>`;
  const bouton = q('[data-next]');
  const bloque = CONFIG.bloquerHorsHoraires && !etatOuverture(CONFIG).livraison;
  if (n === 1) {
    bouton.innerHTML = bloque ? 'Livraison fermée pour le moment' : `Choisir mon spot ${icon('arrow', 'icon--arrow')}`;
    bouton.disabled = bloque || !panier.nb() || st < CONFIG.commandeMinimum;
  } else if (n === 2) {
    bouton.innerHTML = `Continuer ${icon('arrow', 'icon--arrow')}`;
    bouton.disabled = false;
  } else if (n === 3) {
    bouton.textContent = etat.envoi ? 'Envoi en cours…' : `Envoyer · ${euro(total())}`;
    bouton.disabled = etat.envoi;
  } else {
    bouton.textContent = 'Fermer';
    bouton.disabled = false;
  }
}

const montrerErreur = (msg) => { const e = q('[data-error]'); e.textContent = msg; e.hidden = false; };
const cacherErreur = () => { q('[data-error]').hidden = true; };

/* ── Étape 1 : panier ─────────────────────────────────────── */
function majPanier() {
  const lignes = panier.lignes();
  q('[data-empty]').hidden = lignes.length > 0;
  q('[data-meter]').hidden = lignes.length === 0;
  q('[data-lines]').innerHTML = lignes.map((l) => {
    const p = trouverProduit(l.id);
    const opts = libelleOptions(p, l.choix);
    return `<li class="cart-line">
      <div class="cart-line__art" style="--tone:${TONS[p.cat]}">${illustration(p)}</div>
      <div><div class="cart-line__name">${esc(p.nom)}</div>${opts ? `<div class="cart-line__opts">${esc(opts)}</div>` : ''}<div class="cart-line__price">${euro(panier.prixUnitaire(l) * l.qty)}</div></div>
      <div class="stepper stepper--sm" data-line="${esc(l.cle)}">
        <button type="button" data-delta="-1" aria-label="Retirer un ${esc(p.nom)}">${icon(l.qty === 1 ? 'close' : 'minus')}</button>
        <output>${l.qty}</output>
        <button type="button" data-delta="1" aria-label="Ajouter un ${esc(p.nom)}">${icon('plus')}</button>
      </div></li>`;
  }).join('');

  const st = panier.sousTotal();
  const min = CONFIG.commandeMinimum;
  const allumes = Math.round(Math.min(1, min > 0 ? st / min : 1) * 10);
  q('[data-meter]').classList.toggle('is-ok', st >= min);
  q('[data-meter-beans]').innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="bean${i < allumes ? ' is-on' : ''}">${beanSVG()}</span>`).join('');
  q('[data-meter-text]').innerHTML = st >= min
    ? 'C’est bon, on se déplace jusqu’à toi&nbsp;!'
    : `Encore <b>${euro(min - st)}</b> pour atteindre le minimum de ${euroCourt(min)}.`;

  // Suggestions : douceurs et boissons pas encore dans le panier
  const dans = new Set(lignes.map((l) => l.id));
  const idees = PRODUITS.filter((p) => p.dispo !== false && !dans.has(p.id) && (p.cat === 'food' || p.signature)).slice(0, 6);
  q('[data-upsell]').innerHTML = lignes.length && idees.length ? `<h3>Avec ça&nbsp;?</h3><div class="upsell__list">${idees.map((p) => `
      <button type="button" class="upsell__item" data-idee="${p.id}"><div class="art" style="--tone:${TONS[p.cat]}">${illustration(p)}</div><b>${esc(p.nom)}</b><span>${euro(p.prix)} ${icon('plus')}</span></button>`).join('')}</div>` : '';

  if (etat.etape === 3) majRecap();
  if (!panel.hidden && !lignes.length && etat.etape > 1 && etat.etape < 4) allerA(1);
  majPied();
}

/* ── Étape 2 : carte, GPS, photo ──────────────────────────── */
const dansLaZone = (pos) => distanceMetres(pos, CONFIG.zone.centre) <= CONFIG.zone.rayonMetres;

async function initCarte() {
  if (map) { setTimeout(() => map.invalidateSize(), 60); return; }
  try {
    L = await chargerLeaflet();
  } catch {
    q('#carte-livraison').innerHTML = '<p style="padding:16px">La carte n’a pas pu se charger. Utilise «&nbsp;Me localiser&nbsp;» et la photo de ton spot.</p>';
    return;
  }
  const z = CONFIG.zone;
  map = L.map('carte-livraison', { zoomControl: true, scrollWheelZoom: false }).setView([z.centre.lat, z.centre.lng], 16);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
  L.circle([z.centre.lat, z.centre.lng], { radius: z.rayonMetres, color: '#bf472c', weight: 3, dashArray: '8 8', fillColor: '#bf472c', fillOpacity: 0.07, interactive: false }).addTo(map);
  map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2), { padding: [10, 10], animate: false });
  if (CONFIG.shop) L.marker([CONFIG.shop.lat, CONFIG.shop.lng], { interactive: false, keyboard: false, icon: iconeShop(L) }).addTo(map);
  map.on('click', (e) => placer(e.latlng.lat, e.latlng.lng, null, 'manuel'));
  if (etat.position) placer(etat.position.lat, etat.position.lng, etat.position.precision, etat.position.source);
  setTimeout(() => map.invalidateSize(), 80);
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
      const z = CONFIG.zone;
      map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2).extend([latitude, longitude]), { padding: [24, 24] });
    }
  }, (err) => {
    btn.disabled = false;
    majGeo(err.code === 1
      ? 'Localisation refusée. Autorise-la dans les réglages de ton navigateur, ou touche la carte pour placer l’épingle.'
      : 'Impossible de te localiser pour le moment. Touche la carte pour placer l’épingle.');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

// Photo redimensionnée et compressée dans le navigateur (~200-400 Ko)
async function compresser(fichier, max = 1280, qualite = 0.72) {
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
    return c.toDataURL('image/jpeg', qualite);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function majPhoto() {
  q('[data-photo-preview]').hidden = !etat.photo;
  q('[data-photo-actions]').hidden = !!etat.photo;
  if (etat.photo) q('[data-photo-img]').src = etat.photo;
}

/* ── Étape 3 : contact & récap ────────────────────────────── */
function prerempli() {
  const f = q('[data-form]');
  if (f.elements.prenom.value) return;
  try {
    const c = JSON.parse(localStorage.getItem(CLE_CLIENT) || 'null');
    if (c) {
      f.elements.prenom.value = c.prenom || '';
      f.elements.telephone.value = c.telephone || '';
      const pay = f.querySelector(`input[name="paiement"][value="${c.paiement}"]`);
      if (pay) pay.checked = true;
    }
  } catch { /* stockage indisponible */ }
}

function majRecap() {
  const repere = q('[data-landmark]').value.trim();
  q('[data-recap]').innerHTML = `<h4>Récap</h4><ul>${panier.lignes().map((l) => {
    const p = trouverProduit(l.id);
    const opts = libelleOptions(p, l.choix);
    return `<li>${l.qty} × ${esc(p.nom)}${opts ? ` <span class="muted">(${esc(opts)})</span>` : ''}</li>`;
  }).join('')}</ul>
  <div class="recap__spot">${etat.photo ? `<img src="${etat.photo}" alt="Ton spot">` : ''}<span>Livraison sur la ${esc(minusculeInitiale(CONFIG.zone.nom))}${repere ? `<br><b>Repère :</b> ${esc(repere)}` : ''}</span></div>`;
}

function lireContact() {
  const d = new FormData(q('[data-form]'));
  return {
    prenom: String(d.get('prenom') || '').trim(),
    telephone: String(d.get('telephone') || '').trim(),
    paiement: String(d.get('paiement') || ''),
    note: String(d.get('note') || '').trim(),
    memo: d.get('memo') === 'on',
    site: String(d.get('site') || ''),
  };
}

function validerContact() {
  const c = lireContact();
  const f = q('[data-form]');
  const telOk = c.telephone.replace(/\D/g, '').length >= 8;
  f.elements.prenom.setAttribute('aria-invalid', String(!c.prenom));
  f.elements.telephone.setAttribute('aria-invalid', String(!telOk));
  if (!c.prenom) { f.elements.prenom.focus(); return 'Indique ton prénom pour que le livreur puisse t’appeler.'; }
  if (!telOk) { f.elements.telephone.focus(); return 'Ton numéro de téléphone semble incomplet.'; }
  return null;
}

/* ── Envoi ────────────────────────────────────────────────── */
const lienMaps = (pos) => `https://www.google.com/maps?q=${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;

function texteWhatsApp(c) {
  const paiement = CONFIG.paiements.find((p) => p.id === c.paiement)?.label || c.paiement;
  const repere = q('[data-landmark]').value.trim();
  return [
    `Bonjour Ady ! Commande plage${etat.numero ? ` ${etat.numero}` : ''}`,
    ...panier.lignes().map((l) => {
      const p = trouverProduit(l.id);
      const opts = libelleOptions(p, l.choix);
      return `${l.qty} × ${p.nom}${opts ? ` (${opts})` : ''} — ${euro(panier.prixUnitaire(l) * l.qty)}`;
    }),
    `Total : ${euro(total())} · Paiement : ${paiement}`,
    `Prénom : ${c.prenom} · Tél : ${c.telephone}`,
    `Position : ${lienMaps(etat.position)}${etat.position.precision ? ` (±${Math.round(etat.position.precision)} m)` : ''}`,
    repere ? `Repère : ${repere}` : '',
    c.note ? `Note : ${c.note}` : '',
    'Je vous envoie la photo de mon spot juste après.',
  ].filter(Boolean).join('\n');
}

async function envoyer() {
  const msg = validerContact();
  if (msg) return montrerErreur(msg);
  cacherErreur();
  const c = lireContact();
  try {
    if (c.memo) localStorage.setItem(CLE_CLIENT, JSON.stringify({ prenom: c.prenom, telephone: c.telephone, paiement: c.paiement }));
    else localStorage.removeItem(CLE_CLIENT);
  } catch { /* stockage indisponible */ }
  etat.envoi = true;
  majPied();

  const payload = {
    lignes: panier.lignes().map((l) => ({ id: l.id, choix: l.choix, qty: l.qty })),
    client: { prenom: c.prenom, telephone: c.telephone },
    paiement: c.paiement,
    note: c.note,
    repere: q('[data-landmark]').value.trim(),
    position: etat.position,
    photo: etat.photo,
    site: c.site,
  };

  let rep = null;
  let data = {};
  try {
    rep = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    data = await rep.json().catch(() => ({}));
  } catch { rep = null; }
  etat.envoi = false;

  if (rep?.ok && data.ok) {
    etat.numero = data.numero;
    return succes({ total: data.total, paiement: c.paiement });
  }
  // API absente ou pas encore configurée (aperçu sans variables Telegram, serveur local…)
  const nonConfiguree = rep && (data.code === 'non_configure' || [404, 405, 501].includes(rep.status));
  if (nonConfiguree) {
    etat.numero = data.numero || null;
    return CONFIG.whatsapp ? planWhatsApp(c) : succes({ demo: true, total: total(), paiement: c.paiement });
  }
  majPied();
  if (rep && rep.status >= 400 && rep.status < 500 && data.erreur) return montrerErreur(data.erreur);
  montrerErreur('Oups, la commande n’est pas partie. Vérifie ta connexion et réessaie.');
  if (CONFIG.whatsapp) {
    const e = q('[data-error]');
    e.insertAdjacentHTML('beforeend', `<br><a class="btn btn--sm btn--dark" style="margin-top:10px" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texteWhatsApp(c))}">Envoyer par WhatsApp</a>`);
  }
}

function succes({ total: montant, paiement, demo = false }) {
  const lib = CONFIG.paiements.find((p) => p.id === paiement)?.label || '';
  q('[data-done-title]').innerHTML = 'C’est parti&nbsp;!';
  q('[data-done-text]').innerHTML = `
    ${etat.numero ? `<span class="order-num">${esc(etat.numero)}</span>` : ''}
    <p>On arrive sur la plage dans <b>${esc(CONFIG.delaiLivraison)}</b> environ. Garde ton téléphone à portée&nbsp;: le livreur peut t’appeler.</p>
    <p>À régler à la livraison&nbsp;: <b>${euro(montant)}</b>${lib ? ` · ${esc(lib)}` : ''}</p>
    <ol class="timeline">
      <li class="is-done"><span><b>Commande reçue</b>On a ta photo et ta position.</span></li>
      <li class="is-now"><span><b>En préparation au shop</b>Ça glace, ça mousse.</span></li>
      <li><span><b>En route</b>À pied, direction ton parasol.</span></li>
      <li><span><b>Livré</b>Tu paies sur place.</span></li>
    </ol>
    ${demo ? '<p class="muted" style="font-size:13px;margin-top:16px">Mode démo : la commande n’a pas été transmise au shop (réception non configurée, voir le README).</p>' : ''}`;
  q('[data-done-actions]').innerHTML = CONFIG.telephone ? `<a class="btn btn--sm btn--dark" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} Appeler le shop</a>` : '';
  panier.vider();
  allerA(4);
  confettis();
}

function planWhatsApp(c) {
  const lien = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texteWhatsApp(c))}`;
  q('[data-done-title]').innerHTML = 'Dernière étape';
  q('[data-done-text]').innerHTML = '<p>Envoie ta commande au shop sur WhatsApp, puis <b>joins la photo de ton spot</b> dans la conversation.</p>';
  q('[data-done-actions]').innerHTML = `<a class="btn btn--lg" href="${lien}" target="_blank" rel="noopener" data-wa>${icon('chat')} Envoyer sur WhatsApp</a>`;
  q('[data-wa]').addEventListener('click', () => panier.vider());
  allerA(4);
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
  q('[data-payments]').innerHTML = CONFIG.paiements
    .map((p, i) => `<label class="choice"><input type="radio" name="paiement" value="${p.id}"${i === 0 ? ' checked' : ''}><span>${esc(p.label)}</span></label>`).join('');
  q('[data-photo-req]').hidden = !CONFIG.photoObligatoire;

  q('[data-lines]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-delta]');
    if (!b) return;
    const cle = b.closest('[data-line]').dataset.line;
    const ligne = panier.lignes().find((l) => l.cle === cle);
    if (ligne) panier.setQty(cle, ligne.qty + Number(b.dataset.delta));
  });
  q('[data-upsell]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-idee]');
    if (!b) return;
    const p = trouverProduit(b.dataset.idee);
    if (p.options?.length) ouvrirFiche(p);
    else ajouter(p, {}, 1, b.querySelector('.art'));
  });
  q('[data-locate]').addEventListener('click', localiser);
  $$('[data-photo-input]', panel).forEach((input) => input.addEventListener('change', async () => {
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Ce fichier n’est pas une image.');
    try {
      etat.photo = await compresser(f);
      majPhoto();
      cacherErreur();
    } catch {
      toast('Impossible de lire cette photo, essaie avec une autre.');
    }
  }));
  q('[data-photo-remove]').addEventListener('click', () => { etat.photo = null; majPhoto(); });
  q('[data-landmark]').addEventListener('input', () => etat.etape === 3 && majRecap());
  const form = q('[data-form]');
  form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); cacherErreur(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); envoyer(); });

  q('[data-next]').addEventListener('click', () => {
    const n = etat.etape;
    if (n === 1) {
      if (panier.sousTotal() < CONFIG.commandeMinimum) return montrerErreur(`Le minimum de commande pour la livraison est de ${euroCourt(CONFIG.commandeMinimum)}.`);
      return allerA(2);
    }
    if (n === 2) {
      if (!etat.position) return montrerErreur('Place ton épingle sur la carte (ou touche « Me localiser ») pour qu’on te trouve.');
      if (!dansLaZone(etat.position)) return montrerErreur(`Ta position est en dehors de la zone de livraison (${CONFIG.zone.nom}).`);
      if (CONFIG.photoObligatoire && !etat.photo) return montrerErreur('Ajoute une petite photo de ton spot : c’est ce qui aide le plus le livreur.');
      return allerA(3);
    }
    if (n === 3) return envoyer();
    fermerPanneau();
  });
  q('[data-back]').addEventListener('click', () => allerA(Math.max(1, etat.etape - 1)));
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-close-panel]');
    if (!b) return;
    const cible = b.getAttribute('href');
    // lien interne : on attend le retour de l'historique avant de naviguer
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
  document.addEventListener('keydown', (e) => {
    const ficheOuverte = document.querySelector('#fiche-produit:not([hidden])');
    if (e.key === 'Escape' && !panel.hidden && !ficheOuverte) fermerPanneau();
    if (e.key === 'Tab' && !panel.hidden && !ficheOuverte) {
      const f = $$('a[href], button:not([disabled]), input:not(.hp), textarea, [tabindex]:not([tabindex="-1"])', panel).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
}
