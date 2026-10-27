// Accueil, dans l'ordre du parcours :
// 1. affiche + choix « livré sur la plage / je passe au shop »  2. signatures (ajout en un geste)
// 3. livraison racontée au défilement  4. photos du shop  5. la boisson montée couche par couche
// 6. fidélité  7. t-shirts  8. passe nous voir
import { catalogue, trouverProduit, choixParDefaut } from '../data.js';
import { carteProduit, brancherCartes, ajouter } from '../produits.js';
import { ouvrirFiche } from '../sheet.js';
import { creerScene, vignetteShop } from '../scene.js';
import { creerBuild } from '../build.js';
import { creerCarteFidelite } from '../loyalty.js';
import { picto } from '../icons.js';
import { initReveal, pauserHorsEcran, initTilt } from '../ui.js';
import { $, $$, euroCourt, reduceMotion, pointeurFin } from '../utils.js';

export function init() {
  affiche();
  ruban();
  signatures();
  histoire();
  bobine();
  montage();
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { auto: true });
  tshirts();
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
window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(boucle); }, { passive: true });
window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(boucle); });
function suivreDefilement(el, maj, marge = '100px') {
  const s = { actif: false, maj };
  scenes.add(s);
  new IntersectionObserver(([en]) => { s.actif = en.isIntersecting; if (s.actif) maj(); }, { rootMargin: marge }).observe(el);
  return s;
}
const hauteurEntete = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
// progression 0 → 1 d'une piste « collante » (le visuel reste fixe pendant qu'on défile)
function progression(track) {
  const h = hauteurEntete();
  const r = track.getBoundingClientRect();
  const course = r.height - (window.innerHeight - h);
  return Math.min(1, Math.max(0, (h - r.top) / Math.max(1, course)));
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

/* ── 3. Livraison racontée au défilement ──────────────────── */
function histoire() {
  const track = $('[data-story]');
  if (!track) return;
  const steps = $$('.story__step', track);
  const bars = $$('.story__bar span', track);
  const hint = $('.story__hint', track);
  const scene = creerScene($('[data-scene]', track), {
    onEtape: (i) => steps.forEach((s, k) => s.classList.toggle('is-active', k === i)),
  });
  if (reduceMotion()) { scene.set(1); return; }
  const seuils = [0, 0.12, 0.44, 0.86, 1];
  suivreDefilement(track, () => {
    const p = progression(track);
    scene.set(p);
    bars.forEach((b, k) => b.style.setProperty('--p', Math.min(1, Math.max(0, (p - seuils[k]) / (seuils[k + 1] - seuils[k]))).toFixed(3)));
    if (hint) hint.style.opacity = p > 0.03 ? 0 : 1;
  });
}

/* ── 4. Photos du shop : cartes qui pivotent en 3D selon leur place ─ */
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

/* ── 5. Le maracudja matcha tonic, monté face à la mer ────── */
function montage() {
  const track = $('[data-build]');
  if (!track) return;
  const p = catalogue.produits.find((x) => /maracudja matcha tonic/i.test(x.nom));
  const steps = $$('.build__steps li', track);
  const btn = $('[data-build-add]', track);
  const appliquer = creerBuild($('[data-build-scene]', track), { prix: p ? euroCourt(p.prix).replace(/\s/g, '') : undefined });
  if (p && btn) {
    if (p.epuise) { btn.disabled = true; btn.textContent = 'Épuisé pour aujourd’hui'; }
    btn.addEventListener('click', () => {
      const prod = trouverProduit(p.id);
      if (!prod) return;
      if (prod.variantes.length) return ouvrirFiche(prod);
      ajouter(prod, choixParDefaut(prod), null, 1, $('[data-build-scene]', track));
    });
  } else if (btn) btn.hidden = true;
  if (p) $$('[data-build-price]', track).forEach((el) => (el.textContent = euroCourt(p.prix)));

  const activer = (i) => steps.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.classList.toggle('is-done', k < i); });
  if (reduceMotion()) { appliquer(1); activer(4); return; }
  const stage = $('.build__stage', track);
  pauserHorsEcran([track.closest('.build')]);
  suivreDefilement(track, () => {
    const pr = progression(track);
    activer(appliquer(pr));
    // le gobelet pivote doucement pendant qu'il se remplit
    stage.style.setProperty('--rot', ((pr - 0.5) * 16).toFixed(2));
    track.style.setProperty('--bp', pr.toFixed(3));
  });
}

/* ── 7. T-shirts : photo du portant + cartes produit ─────── */
function tshirts() {
  const box = $('[data-merch]');
  if (!box) return;
  const liste = catalogue.produits.filter((p) => p.kind === 'merch');
  if (!liste.length) { box.closest('section')?.remove(); return; }
  box.innerHTML = liste.map((p, i) => carteProduit(p, { i })).join('');
  $$('.pcard', box).forEach((c) => c.classList.add('reveal'));
  brancherCartes(box);
  initReveal(box);
  initTilt(box);
}

