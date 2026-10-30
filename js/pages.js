// Script propre à chaque page (chargé par main.js selon <body data-page>) et cartes de la plage
import { CONFIG } from './reglages.js';
import { catalogue, trouverProduit, trouverPoint, libelleOptions, plageSale, enService, panier } from './data.js';
import { esc, picto, $, $$, reduceMotion, pointeurFin, icon, euro, euroCourt, quandVisible } from './utils.js';
import { carteProduit, brancherCartes, ouvrirFiche, ligneProduit, ton } from './produits.js';
import { creerScene, vignetteShop } from './scene.js';
import { creerCarteFidelite, initReveal, pauserHorsEcran, initTilt, donneesCarte } from './ui.js';
import { ouvrirPanneau, ouvrirVisionneuse } from './checkout.js';
import { illustration } from './illustrations.js';

/* ═════════════════════════════════════════════════════════════
   Cartes de la plage (Leaflet sur notre dessin)
   ═════════════════════════════════════════════════════════════ */
// Carte interactive (Leaflet) sur notre carte illustrée de la plage : aucune tuile chargée
// depuis un serveur extérieur, seulement l'image du site (assets/carte-caravelle.svg).
let chargement = null;

export function chargerLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!chargement) {
    chargement = new Promise((ok, ko) => {
      if (!document.querySelector('link[href="css/leaflet.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'css/leaflet.css';
        document.head.appendChild(l);
      }
      const s = document.createElement('script');
      s.src = 'js/leaflet.js';
      s.onload = () => ok(window.L);
      s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  return chargement;
}

export function iconeShop(L) {
  return L.divIcon({ className: '', html: '<div class="ady-shop" title="Ady Coffee Shop"><svg viewBox="0 0 728 584"><use href="assets/brand.svg#st-head"/></svg></div>', iconSize: [46, 46], iconAnchor: [23, 23] });
}

// Repère d'un point de livraison : rond terracotta numéroté
export function iconePoint(L, n) {
  return L.divIcon({
    className: 'ady-point',
    html: `<span class="ady-point__n">${n}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Fond de carte : l'illustration de la plage, posée à sa place exacte (projection Web Mercator)
export function fondPlage(L, map) {
  const { image, bornes } = CONFIG.zone.fond;
  const b = L.latLngBounds(bornes);
  L.imageOverlay(image, b, { alt: '', interactive: false }).addTo(map);
  map.setMaxBounds(b.pad(0.02));
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Dessin ADY · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>');
  const e = CONFIG.zone.etiquette;
  if (e) {
    L.marker([e.lat, e.lng], {
      interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'ady-etiquette', html: `<span style="--angle:${e.angle}deg">${esc(CONFIG.zone.nom)}</span>`, iconSize: [0, 0] }),
    }).addTo(map);
  }
  return b;
}

// La carte ne descend pas sous le zoom où l'illustration remplit le cadre
export function bornerZoom(map, b) {
  const min = map.getBoundsZoom(b, true);
  map.setMinZoom(Math.max(14, min));
}

// Carte « vitrine » : points de livraison + shop (pages Livraison et Le shop)
export async function carteVitrine(el, { centrer = 'points' } = {}) {
  let L;
  try {
    L = await chargerLeaflet();
  } catch {
    el.innerHTML = '<p style="padding:20px">La carte n’a pas pu se charger.</p>';
    return null;
  }
  el.classList.add('carte-plage');
  const c = CONFIG.zone.centre;
  const map = L.map(el, { scrollWheelZoom: false, zoomControl: true, zoomSnap: 0.25, maxZoom: 19, maxBoundsViscosity: 1 }).setView([c.lat, c.lng], 16);
  const fond = fondPlage(L, map);
  const bornes = L.latLngBounds([]);
  catalogue.points.forEach((p, i) => {
    L.marker([p.lat, p.lng], { icon: iconePoint(L, i + 1), title: p.nom, keyboard: false })
      .bindPopup(`<div class="point-pop">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ''}<b>${esc(p.nom)}</b>${p.indication ? `<span>${esc(p.indication)}</span>` : ''}</div>`, { maxWidth: 220 })
      .addTo(map);
    bornes.extend([p.lat, p.lng]);
  });
  if (CONFIG.shop) L.marker([CONFIG.shop.lat, CONFIG.shop.lng], { icon: iconeShop(L), keyboard: false, title: 'Ady Coffee Shop' }).addTo(map);
  if (!bornes.isValid()) bornes.extend([c.lat, c.lng]);
  if (centrer === 'shop' && CONFIG.shop) bornes.extend([CONFIG.shop.lat, CONFIG.shop.lng]);
  map.fitBounds(bornes.pad(0.25), { maxZoom: 17.5, animate: false });
  bornerZoom(map, fond);
  setTimeout(() => { map.invalidateSize(); bornerZoom(map, fond); }, 100);
  return map;
}

/* ═════════════════════════════════════════════════════════════
   Accueil
   ═════════════════════════════════════════════════════════════ */
// Accueil, court et direct, pensé pour le téléphone :
// 1. affiche + « livre-moi sur la plage / je passe le chercher »  2. les plus commandées (ajout en un geste)
// 3. 20 secondes pour commander (scène qui se joue en boucle)  4. fidélité  5. passe nous voir
export function initHome() {
  affiche();
  ruban();
  signatures();
  const el = $('[data-scene-loop]');
  if (el) {
    const scene = creerScene(el, { mode: 'loop' });
    new IntersectionObserver(([en]) => (en.isIntersecting ? scene.jouer() : scene.pause())).observe(el);
  }
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { auto: true });
  const v = $('[data-shop-vignette]');
  if (v) v.innerHTML = vignetteShop();
}

/* ── Défilement : une seule boucle pour toutes les scènes ──── */
const scenes = new Set();
let raf = null;
function boucle() {
  raf = null;
  scenes.forEach((s) => s.actif && s.maj());
}
function suivreDefilement(el, maj, marge = '100px') {
  if (!scenes.size) {
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(boucle); }, { passive: true });
    window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(boucle); });
  }
  const s = { actif: false, maj };
  scenes.add(s);
  new IntersectionObserver(([en]) => { s.actif = en.isIntersecting; if (s.actif) maj(); }, { rootMargin: marge }).observe(el);
  return s;
}
/* ── 1. Affiche : calques en profondeur (souris + défilement) ─ */
function affiche() {
  const poster = $('[data-poster]');
  if (!poster) return;
  // toucher une boisson de l'affiche ouvre sa fiche
  poster.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-name]');
    const p = b && catalogue.produits.find((x) => x.nom === b.dataset.openName);
    if (p && !p.epuise) ouvrirFiche(p);
  });
  if (reduceMotion()) return;
  if (pointeurFin()) {
    let r2;
    $('.hero').addEventListener('pointermove', (e) => {
      cancelAnimationFrame(r2);
      r2 = requestAnimationFrame(() => {
        poster.style.setProperty('--mx', ((e.clientX / window.innerWidth) - 0.5).toFixed(3));
        poster.style.setProperty('--my', ((e.clientY / window.innerHeight) - 0.5).toFixed(3));
      });
    });
  }
  // en défilant, les calques se séparent : le soleil descend, les boissons montent
  suivreDefilement(poster, () => {
    const r = poster.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / r.height));
    poster.style.setProperty('--sp', p.toFixed(3));
  }, '0px');
}

// Bande de mots de la carte + pictos de la marque : elle n'avance que quand on fait défiler
function ruban() {
  const track = $('[data-ribbon]');
  if (!track) return;
  const items = [['Iced latte tiramisu', 'sun'], ['Maracudja matcha tonic', 'palm'], ['Ube latte', 'cup'], ['Citronnade gwozey', 'wave'], ['Affogato', 'bean'], ['Lobster roll', 'hat'], ['Dirty chaï', 'can'], ['Flat white', 'moka']];
  const serie = items.map(([mot, p], i) => `<span class="ribbon__word${i % 2 ? ' ribbon__word--outline' : ''}">${mot}</span>${picto(p)}`).join('');
  track.innerHTML = serie.repeat(2);
  if (reduceMotion()) return;
  suivreDefilement(track.parentElement, () => {
    const r = track.parentElement.getBoundingClientRect();
    const x = -((window.innerHeight - r.top) * 0.35) - 120;
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
  });
}

/* ── 2. Signatures : les boissons mises en avant dans le back-office ─ */
function signatures() {
  const box = $('[data-signatures]');
  if (!box) return;
  const liste = catalogue.produits.filter((p) => p.vedette && p.kind !== 'merch').slice(0, 4);
  box.innerHTML = liste.map((p, i) => carteProduit(p, { i })).join('');
  $$('.pcard', box).forEach((c) => c.classList.add('reveal'));
  brancherCartes(box);
  pauserHorsEcran($$('.pcard', box));
  initReveal(box);
  initTilt(box);
}

/* ═════════════════════════════════════════════════════════════
   La carte
   ═════════════════════════════════════════════════════════════ */
// La carte, façon ardoise du shop : une section par catégorie, les signatures encadrées
// comme sur les écrans au-dessus du comptoir, la navigation collante et le panier à droite.
export function initCarte() {
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
  donneesCarte();
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
  const plageOuverte = catalogue.reglages.beach_open !== false && catalogue.points.length > 0;
  const ligne = $('[data-point-choisi]');
  const maj = () => {
    if (!plageOuverte && panier.mode === 'plage') panier.setMode('shop');
    $$('[data-mode]', box).forEach((b) => {
      const on = b.dataset.mode === panier.mode;
      b.setAttribute('aria-checked', String(on));
      b.classList.toggle('is-on', on);
    });
    box.style.setProperty('--x', panier.mode === 'shop' ? '100%' : '0%');
    // point de livraison déjà choisi (QR code du panneau, ou commande précédente)
    const pt = panier.mode === 'plage' ? trouverPoint(panier.point) : null;
    if (ligne) {
      ligne.hidden = !pt;
      if (pt) ligne.innerHTML = `${icon('pin')}<span>Livraison au point <b>${esc(pt.nom)}</b> · modifiable au moment de commander</span>`;
    }
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
    const pt = plage ? trouverPoint(panier.point) : null;
    const tete = `<h2>Ton panier</h2><p class="cart-aside__mode">${icon(plage ? 'pin' : 'bag')} ${plage ? (pt ? `Livré au point ${esc(pt.nom)}` : 'Livré sur la plage') : 'Retrait au shop'}</p>`;
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
      <button class="btn btn--block" type="button" data-checkout ${manque ? 'disabled' : ''}>Commander ${icon('arrow', 'icon--arrow')}</button>
      <button class="link-arrow" type="button" data-open-cart style="margin-top:14px">Modifier le panier</button>`;
  };
  box.addEventListener('click', (e) => { if (e.target.closest('[data-checkout]')) ouvrirPanneau(); });
  panier.onChange(maj);
  maj();
}

/* ═════════════════════════════════════════════════════════════
   Livraison plage
   ═════════════════════════════════════════════════════════════ */
// Livraison plage : scène qui se joue en boucle, carte et liste des points de livraison (photos en grand)
export function initLivraison() {
  const el = $('[data-scene-loop]');
  if (el) {
    const scene = creerScene(el, { mode: 'loop' });
    new IntersectionObserver(([en]) => (en.isIntersecting ? scene.jouer() : scene.pause())).observe(el);
  }
  const carte = $('[data-zone-map]');
  if (carte) quandVisible(carte, () => carteVitrine(carte));
  // les mêmes numéros que sur la carte
  const liste = $('[data-points-liste]');
  if (liste) {
    liste.innerHTML = catalogue.points.map((p, i) => `<li>
      <button class="points-liste__img" type="button" data-zoom="${i}" aria-label="Voir la photo du point ${esc(p.nom)} en grand">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : ''}<span class="points-liste__n">${i + 1}</span></button>
      <span><b>${esc(p.nom)}</b>${p.indication ? `<small>${esc(p.indication)}</small>` : ''}</span>
    </li>`).join('');
    liste.hidden = !catalogue.points.length;
    liste.addEventListener('click', (e) => {
      const z = e.target.closest('[data-zoom]');
      if (z) ouvrirVisionneuse(catalogue.points.map((p, i) => ({ ...p, n: i + 1 })), Number(z.dataset.zoom));
    });
  }
}

/* ═════════════════════════════════════════════════════════════
   Fidélité
   ═════════════════════════════════════════════════════════════ */
// Fidélité : carte de démonstration interactive
export function initFidelite() {
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { interactif: true });
}

/* ═════════════════════════════════════════════════════════════
   Le shop
   ═════════════════════════════════════════════════════════════ */
// Le shop : vignette illustrée, photos du shop, carte (shop et plage)
export function initShop() {
  const v = $('[data-shop-vignette]');
  if (v) v.innerHTML = vignetteShop();
  const m = $('[data-shop-map]');
  if (m) quandVisible(m, () => carteVitrine(m, { centrer: 'shop' }));
  bobine();
}

/* ── Photos du shop : cartes qui pivotent en 3D selon leur place ─ */
function bobine() {
  const reel = $('[data-reel]');
  if (!reel) return;
  const cartes = $$('.reel__card', reel);
  const prev = $('[data-reel-prev]');
  const next = $('[data-reel-next]');
  const pas = () => (cartes[0]?.getBoundingClientRect().width || 300) + 20;
  prev?.addEventListener('click', () => reel.scrollBy({ left: -pas(), behavior: reduceMotion() ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => reel.scrollBy({ left: pas(), behavior: reduceMotion() ? 'auto' : 'smooth' }));
  if (reduceMotion()) return;
  let r3 = null;
  const maj = () => {
    r3 = null;
    const centre = window.innerWidth / 2;
    cartes.forEach((c) => {
      const r = c.getBoundingClientRect();
      const d = Math.max(-1, Math.min(1, (r.left + r.width / 2 - centre) / (window.innerWidth * 0.6)));
      c.style.setProperty('--d', d.toFixed(3));
      c.style.setProperty('--a', Math.abs(d).toFixed(3));
    });
    if (prev) prev.disabled = reel.scrollLeft < 8;
    if (next) next.disabled = reel.scrollLeft + reel.clientWidth > reel.scrollWidth - 8;
  };
  reel.addEventListener('scroll', () => { if (!r3) r3 = requestAnimationFrame(maj); }, { passive: true });
  window.addEventListener('resize', () => { if (!r3) r3 = requestAnimationFrame(maj); });
  maj();
}
