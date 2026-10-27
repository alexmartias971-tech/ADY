// Tunnel de commande plage : panier → position + photo → contact → confirmation
import { CONFIG } from './config.js';
import { trouverProduit, libelleOptions } from './menu.js';
import { illustration } from './illustrations.js';
import { panier } from './cart.js';
import { etatOuverture } from './horaires.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale, toast, beanSVG, distanceMetres, reduceMotion } from './utils.js';

const panel = $('#panel');
const body = $('[data-panel-body]');
const btnNext = $('[data-next]');
const btnBack = $('[data-back]');
const erreur = $('[data-error]');
const form = $('[data-contact-form]');

const etat = {
  etape: 1,
  position: null, // { lat, lng, precision, source }
  photo: null,    // dataURL JPEG compressée
  envoi: false,
  numero: null,
};
let focusAvant = null;
let map = null;
let L = null;
let marqueur = null;
let cerclePrecision = null;

/* ── Ouverture / fermeture ────────────────────────────── */
export function ouvrirPanneau(etape = 1) {
  if (!panel.hidden) return allerA(etape);
  focusAvant = document.activeElement;
  $('[data-toast]')?.classList.remove('is-on');
  panel.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  history.pushState({ panneau: true }, '');
  allerA(etape);
  setTimeout(() => $('[data-close-panel].icon-btn', panel)?.focus({ preventScroll: true }), 60);
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
  etat.etape = 1;
  etat.numero = null;
  etat.photo = null;
  etat.position = null;
  if (marqueur) { marqueur.remove(); marqueur = null; }
  if (cerclePrecision) { cerclePrecision.remove(); cerclePrecision = null; }
  majPhoto();
  majStatutGeo();
  form.reset();
  $('[data-landmark]').value = '';
}

/* ── Navigation entre étapes ──────────────────────────── */
function allerA(n) {
  etat.etape = n;
  cacherErreur();
  $$('[data-step]', body).forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  $$('[data-step-dot]').forEach((li) => {
    const i = Number(li.dataset.stepDot);
    li.classList.toggle('is-active', i === n);
    li.classList.toggle('is-done', i < n);
  });
  $('[data-progress]').hidden = n === 4;
  btnBack.hidden = n === 1 || n === 4;
  body.scrollTop = 0;
  if (n === 2) initCarte();
  if (n === 3) majRecap();
  majPied();
}

function majPied() {
  const n = etat.etape;
  const st = panier.sousTotal();
  const total = st + (panier.nb() ? CONFIG.fraisLivraison : 0);
  const totals = $('[data-totals]');
  if (n === 4 || panier.nb() === 0) totals.innerHTML = '';
  else {
    totals.innerHTML = `<div><span>Sous-total</span><span>${euro(st)}</span></div>
      <div><span>Livraison sur la plage</span><span>${CONFIG.fraisLivraison ? euro(CONFIG.fraisLivraison) : 'Offerte'}</span></div>
      <div class="totals__grand"><span>Total</span><span>${euro(total)}</span></div>`;
  }
  const ouverture = etatOuverture(CONFIG);
  const bloque = CONFIG.bloquerHorsHoraires && !ouverture.livraison;
  if (n === 1) {
    btnNext.textContent = bloque ? 'Livraison fermée pour le moment' : 'Choisir mon spot';
    btnNext.disabled = bloque || panier.nb() === 0 || st < CONFIG.commandeMinimum;
  } else if (n === 2) {
    btnNext.textContent = 'Continuer';
    btnNext.disabled = false;
  } else if (n === 3) {
    btnNext.textContent = etat.envoi ? 'Envoi en cours…' : `Envoyer ma commande · ${euro(total)}`;
    btnNext.disabled = etat.envoi;
  } else {
    btnNext.textContent = 'Fermer';
    btnNext.disabled = false;
  }
}

function montrerErreur(msg) {
  erreur.textContent = msg;
  erreur.hidden = false;
}
function cacherErreur() {
  erreur.hidden = true;
}

/* ── Étape 1 : panier ─────────────────────────────────── */
function majPanier() {
  const lignes = panier.lignes();
  $('[data-cart-empty]').hidden = lignes.length > 0;
  $('[data-min-meter]').hidden = lignes.length === 0;
  $('[data-cart-lines]').innerHTML = lignes.map((l) => {
    const p = trouverProduit(l.id);
    const opts = libelleOptions(p, l.choix);
    return `<li class="cart-line">
      <div class="cart-line__art">${illustration(p)}</div>
      <div>
        <div class="cart-line__name">${esc(p.nom)}</div>
        ${opts ? `<div class="cart-line__opts">${esc(opts)}</div>` : ''}
        <div class="cart-line__price">${euro(panier.prixUnitaire(l) * l.qty)}</div>
      </div>
      <div class="stepper" data-line="${esc(l.cle)}">
        <button type="button" data-delta="-1" aria-label="Retirer un ${esc(p.nom)}">−</button>
        <output>${l.qty}</output>
        <button type="button" data-delta="1" aria-label="Ajouter un ${esc(p.nom)}">+</button>
      </div>
    </li>`;
  }).join('');

  // Jauge du minimum de commande, façon carte fidélité
  const st = panier.sousTotal();
  const min = CONFIG.commandeMinimum;
  const ratio = min > 0 ? Math.min(1, st / min) : 1;
  const allumes = Math.round(ratio * 10);
  const meter = $('[data-min-meter]');
  meter.classList.toggle('is-ok', st >= min);
  $('[data-min-beans]').innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="bean${i < allumes ? ' is-on' : ''}">${beanSVG()}</span>`).join('');
  $('[data-min-text]').innerHTML = st >= min
    ? `C’est bon, on se déplace jusqu’à toi&nbsp;!`
    : `Encore <b>${euro(min - st)}</b> pour atteindre le minimum de ${euroCourt(min)} et être livré sur la plage.`;

  if (etat.etape === 3) majRecap();
  if (!panel.hidden && lignes.length === 0 && etat.etape !== 1 && etat.etape !== 4) allerA(1);
  majPied();
}

$('[data-cart-lines]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-delta]');
  if (!b) return;
  const cle = b.closest('[data-line]').dataset.line;
  const ligne = panier.lignes().find((l) => l.cle === cle);
  if (ligne) panier.setQty(cle, ligne.qty + Number(b.dataset.delta));
});

/* ── Étape 2 : carte, géolocalisation, photo ──────────── */
function chargerScript(src) {
  return new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = ko;
    document.head.appendChild(s);
  });
}
function chargerCss(href) {
  if ($(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
}

const iconePin = () => L.divIcon({
  className: 'ady-pin',
  html: '<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 50 C 6 34 2 26 2 19 A18 18 0 0 1 38 19 C 38 26 34 34 20 50Z" fill="#bf472c" stroke="#2a1810" stroke-width="3"/><circle cx="20" cy="19" r="7" fill="#fbe9d6"/></svg>',
  iconSize: [40, 52],
  iconAnchor: [20, 50],
});

async function initCarte() {
  if (map) {
    setTimeout(() => map.invalidateSize(), 60);
    return;
  }
  try {
    chargerCss('vendor/leaflet/leaflet.css');
    if (!window.L) await chargerScript('vendor/leaflet/leaflet.js');
    L = window.L;
  } catch {
    $('#map').innerHTML = '<p style="padding:16px">La carte n’a pas pu se charger. Utilise «&nbsp;Me localiser&nbsp;» et la photo de ton spot.</p>';
    return;
  }
  const z = CONFIG.zone;
  map = L.map('map', { zoomControl: true, scrollWheelZoom: false }).setView([z.centre.lat, z.centre.lng], 16);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  L.circle([z.centre.lat, z.centre.lng], {
    radius: z.rayonMetres, color: '#bf472c', weight: 3, dashArray: '8 8', fillColor: '#bf472c', fillOpacity: 0.07, interactive: false,
  }).addTo(map);
  map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2), { padding: [10, 10], animate: false });
  if (CONFIG.shop) {
    L.marker([CONFIG.shop.lat, CONFIG.shop.lng], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({ className: '', html: '<div class="ady-shop" title="Le shop"><svg viewBox="0 0 728 584"><use href="assets/brand.svg#st-head"/></svg></div>', iconSize: [46, 46], iconAnchor: [23, 23] }),
    }).addTo(map);
  }
  map.on('click', (e) => placer(e.latlng.lat, e.latlng.lng, null, 'manuel'));
  if (etat.position) placer(etat.position.lat, etat.position.lng, etat.position.precision, etat.position.source);
  setTimeout(() => map.invalidateSize(), 80);
}

function placer(lat, lng, precision, source) {
  etat.position = { lat, lng, precision, source };
  if (map && L) {
    if (!marqueur) {
      marqueur = L.marker([lat, lng], { draggable: true, autoPan: true, icon: iconePin(), title: 'Ma position' }).addTo(map);
      marqueur.on('dragend', () => {
        const p = marqueur.getLatLng();
        if (cerclePrecision) { cerclePrecision.remove(); cerclePrecision = null; }
        etat.position = { lat: p.lat, lng: p.lng, precision: null, source: 'manuel' };
        majStatutGeo();
      });
    } else marqueur.setLatLng([lat, lng]);
    if (cerclePrecision) { cerclePrecision.remove(); cerclePrecision = null; }
    if (precision) {
      cerclePrecision = L.circle([lat, lng], { radius: precision, color: '#2a1810', weight: 1, fillOpacity: 0.08, interactive: false }).addTo(map);
    }
  }
  majStatutGeo();
}

function dansLaZone(pos) {
  return distanceMetres(pos, CONFIG.zone.centre) <= CONFIG.zone.rayonMetres;
}

function majStatutGeo(message) {
  const el = $('[data-geo-status]');
  el.classList.remove('is-ok', 'is-ko');
  if (message) {
    el.textContent = message;
    el.classList.add('is-ko');
    return;
  }
  if (!etat.position) {
    el.textContent = 'Ta position n’est pas encore définie.';
    return;
  }
  if (dansLaZone(etat.position)) {
    const p = etat.position.precision;
    el.textContent = `✓ C’est noté, tu es dans la zone de livraison${p ? ` (précision ±${Math.round(p)} m)` : ''}. Tu peux déplacer l’épingle pour l’affiner.`;
    el.classList.add('is-ok');
  } else {
    el.textContent = `Hors zone : on livre uniquement sur la ${minusculeInitiale(CONFIG.zone.nom)}. Si ta position est fausse, déplace l’épingle sur la carte.`;
    el.classList.add('is-ko');
  }
}

$('[data-locate]').addEventListener('click', () => {
  if (!('geolocation' in navigator) || !window.isSecureContext) {
    majStatutGeo('La localisation n’est pas disponible sur ce navigateur. Touche la carte pour placer l’épingle.');
    return;
  }
  const btn = $('[data-locate]');
  btn.disabled = true;
  $('[data-geo-status]').textContent = 'Localisation en cours…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      const { latitude, longitude, accuracy } = pos.coords;
      placer(latitude, longitude, accuracy, 'gps');
      if (!map) return;
      if (dansLaZone(etat.position)) map.setView([latitude, longitude], 18);
      else {
        // hors zone : on montre à la fois la zone et la position
        const z = CONFIG.zone;
        map.fitBounds(L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2).extend([latitude, longitude]), { padding: [24, 24] });
      }
    },
    (err) => {
      btn.disabled = false;
      majStatutGeo(err.code === 1
        ? 'Localisation refusée. Autorise-la dans les réglages de ton navigateur, ou touche la carte pour placer l’épingle.'
        : 'Impossible de te localiser pour le moment. Touche la carte pour placer l’épingle.');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
  );
});

// Photo : redimensionnée et compressée dans le navigateur avant l'envoi (~200-400 Ko)
async function compresser(fichier, max = 1280, qualite = 0.72) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', qualite);
  } finally {
    URL.revokeObjectURL(url);
  }
}

$$('[data-photo-input]').forEach((input) => input.addEventListener('change', async () => {
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
$('[data-photo-remove]').addEventListener('click', () => {
  etat.photo = null;
  majPhoto();
});

function majPhoto() {
  const preview = $('[data-photo-preview]');
  preview.hidden = !etat.photo;
  $('.photo__actions').hidden = !!etat.photo;
  if (etat.photo) $('[data-photo-img]').src = etat.photo;
}

/* ── Étape 3 : contact & récap ────────────────────────── */
$('[data-payments]').innerHTML = CONFIG.paiements
  .map((p, i) => `<label class="choice"><input type="radio" name="paiement" value="${p.id}"${i === 0 ? ' checked' : ''}><span>${esc(p.label)}</span></label>`)
  .join('');
$('[data-photo-req]').hidden = !CONFIG.photoObligatoire;

function majRecap() {
  const lignes = panier.lignes();
  const repere = $('[data-landmark]').value.trim();
  $('[data-recap]').innerHTML = `<h4>Récap</h4>
    <ul>${lignes.map((l) => {
      const p = trouverProduit(l.id);
      const opts = libelleOptions(p, l.choix);
      return `<li>${l.qty}× ${esc(p.nom)}${opts ? ` <span class="muted">(${esc(opts)})</span>` : ''}</li>`;
    }).join('')}</ul>
    <div class="recap__spot">${etat.photo ? `<img src="${etat.photo}" alt="Ton spot">` : ''}<span>Livraison sur la ${esc(minusculeInitiale(CONFIG.zone.nom))}${repere ? `<br><b>Repère :</b> ${esc(repere)}` : ''}</span></div>`;
}

function lireContact() {
  const data = new FormData(form);
  return {
    prenom: String(data.get('prenom') || '').trim(),
    telephone: String(data.get('telephone') || '').trim(),
    paiement: String(data.get('paiement') || ''),
    note: String(data.get('note') || '').trim(),
    site: String(data.get('site') || ''),
  };
}

function validerContact() {
  const c = lireContact();
  const champPrenom = form.elements.prenom;
  const champTel = form.elements.telephone;
  const telOk = c.telephone.replace(/\D/g, '').length >= 8;
  champPrenom.setAttribute('aria-invalid', String(!c.prenom));
  champTel.setAttribute('aria-invalid', String(!telOk));
  if (!c.prenom) { champPrenom.focus(); return 'Indique ton prénom pour que le livreur puisse t’appeler.'; }
  if (!telOk) { champTel.focus(); return 'Ton numéro de téléphone semble incomplet.'; }
  return null;
}

/* ── Envoi ────────────────────────────────────────────── */
function lienMaps(pos) {
  return `https://www.google.com/maps?q=${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;
}

function texteWhatsApp(c) {
  const lignes = panier.lignes().map((l) => {
    const p = trouverProduit(l.id);
    const opts = libelleOptions(p, l.choix);
    return `${l.qty}× ${p.nom}${opts ? ` (${opts})` : ''} — ${euro(panier.prixUnitaire(l) * l.qty)}`;
  });
  const total = panier.sousTotal() + CONFIG.fraisLivraison;
  const paiement = CONFIG.paiements.find((p) => p.id === c.paiement)?.label || c.paiement;
  const repere = $('[data-landmark]').value.trim();
  return [
    `Bonjour Ady ! Commande plage${etat.numero ? ` ${etat.numero}` : ''}`,
    ...lignes,
    `Total : ${euro(total)} · Paiement : ${paiement}`,
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
  etat.envoi = true;
  majPied();

  const payload = {
    lignes: panier.lignes().map((l) => ({ id: l.id, choix: l.choix, qty: l.qty })),
    client: { prenom: c.prenom, telephone: c.telephone },
    paiement: c.paiement,
    note: c.note,
    repere: $('[data-landmark]').value.trim(),
    position: etat.position,
    photo: etat.photo,
    site: c.site,
  };

  let rep = null;
  let data = {};
  try {
    rep = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    data = await rep.json().catch(() => ({}));
  } catch {
    rep = null;
  }
  etat.envoi = false;

  if (rep?.ok && data.ok) {
    etat.numero = data.numero;
    return succes({ total: data.total, paiement: c.paiement });
  }
  // API absente ou pas encore configurée (aperçu Vercel sans variables, serveur local…)
  const nonConfiguree = !rep ? false : (data.code === 'non_configure' || [404, 405, 501].includes(rep.status));
  if (nonConfiguree) {
    etat.numero = data.numero || null;
    return CONFIG.whatsapp ? planWhatsApp(c) : succes({ demo: true, total: panier.sousTotal() + CONFIG.fraisLivraison, paiement: c.paiement });
  }
  if (rep && rep.status >= 400 && rep.status < 500 && data.erreur) {
    majPied();
    return montrerErreur(data.erreur);
  }
  majPied();
  montrerErreur(CONFIG.whatsapp
    ? 'Oups, la commande n’est pas partie. Vérifie ta connexion et réessaie, ou envoie-la par WhatsApp.'
    : 'Oups, la commande n’est pas partie. Vérifie ta connexion et réessaie.');
  if (CONFIG.whatsapp) {
    const lien = document.createElement('a');
    lien.className = 'btn btn--cream btn--sm';
    lien.style.marginTop = '8px';
    lien.target = '_blank';
    lien.rel = 'noopener';
    lien.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texteWhatsApp(c))}`;
    lien.textContent = 'Envoyer par WhatsApp';
    erreur.appendChild(document.createElement('br'));
    erreur.appendChild(lien);
  }
}

function succes({ total, paiement, demo = false }) {
  const libPaiement = CONFIG.paiements.find((p) => p.id === paiement)?.label || '';
  $('[data-done-title]').innerHTML = 'C’est parti&nbsp;!';
  $('[data-done-text]').innerHTML = `${etat.numero ? `Commande <span class="order-num">${esc(etat.numero)}</span><br>` : ''}
    On prépare tout ça et on arrive sur la plage dans <b>${esc(CONFIG.delaiLivraison)}</b> environ.
    Garde ton téléphone à portée&nbsp;: le livreur peut t’appeler.<br><br>
    À régler à la livraison&nbsp;: <b>${euro(total)}</b>${libPaiement ? ` · ${esc(libPaiement)}` : ''}
    ${demo ? '<br><br><small class="muted">Mode démo : la commande n’a pas été transmise au shop (API non configurée, voir le README).</small>' : ''}`;
  $('[data-done-actions]').innerHTML = CONFIG.telephone
    ? `<a class="btn btn--cream btn--sm" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">Appeler le shop</a>`
    : '';
  panier.vider();
  allerA(4);
  confettis();
}

function planWhatsApp(c) {
  const lien = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texteWhatsApp(c))}`;
  $('[data-done-title]').innerHTML = 'Dernière étape';
  $('[data-done-text]').innerHTML = 'Envoie ta commande au shop sur WhatsApp, puis <b>joins la photo de ton spot</b> dans la conversation.';
  $('[data-done-actions]').innerHTML = `<a class="btn btn--terra btn--lg" href="${lien}" target="_blank" rel="noopener" data-wa>Envoyer sur WhatsApp</a>`;
  $('[data-wa]').addEventListener('click', () => panier.vider());
  allerA(4);
}

function confettis() {
  if (reduceMotion()) return;
  const couleurs = ['#bf472c', '#fbe9d6', '#2a1810', '#8fb651', '#9ccbe0'];
  const box = $('.panel__box').getBoundingClientRect();
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.innerHTML = beanSVG();
    el.style.color = couleurs[i % couleurs.length];
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top + 160}px`;
    document.body.appendChild(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 200;
    el.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 260}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 1400 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
  }
}

/* ── Boutons du pied de panneau ───────────────────────── */
btnNext.addEventListener('click', () => {
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
btnBack.addEventListener('click', () => allerA(Math.max(1, etat.etape - 1)));
$$('[data-close-panel]').forEach((b) => b.addEventListener('click', (e) => {
  // lien interne (ex. « Voir la carte ») : on attend que l'historique soit revenu en arrière avant de défiler
  const cible = b.getAttribute('href');
  if (cible?.startsWith('#')) {
    e.preventDefault();
    const aller = () => $(cible)?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    if (history.state?.panneau) window.addEventListener('popstate', () => setTimeout(aller, 30), { once: true });
    else setTimeout(aller, 30);
  }
  fermerPanneau();
}));
$('[data-landmark]').addEventListener('input', () => etat.etape === 3 && majRecap());
form.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); cacherErreur(); });
form.addEventListener('submit', (e) => { e.preventDefault(); envoyer(); });

export function initCheckout() {
  panier.onChange(majPanier);
  majPanier();
  window.addEventListener('popstate', () => fermerPanneau(true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden && $('#sheet').hidden) fermerPanneau();
    // garde le focus dans le panneau
    if (e.key === 'Tab' && !panel.hidden && $('#sheet').hidden) {
      const focusables = $$('a[href], button:not([disabled]), input:not([type="hidden"]):not(.hp), textarea, [tabindex]:not([tabindex="-1"])', panel)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    }
  });
}
