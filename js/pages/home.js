// Accueil, court et direct, pensé pour le téléphone :
// 1. affiche + « livre-moi sur la plage / je passe le chercher »  2. les plus commandées (ajout en un geste)
// 3. 20 secondes pour commander (scène qui se joue en boucle)  4. fidélité  5. passe nous voir
import { catalogue } from '../data.js';
import { carteProduit, brancherCartes } from '../produits.js';
import { ouvrirFiche } from '../sheet.js';
import { creerScene, vignetteShop } from '../scene.js';
import { creerCarteFidelite } from '../loyalty.js';
import { picto } from '../icons.js';
import { initReveal, pauserHorsEcran, initTilt } from '../ui.js';
import { $, $$, reduceMotion, pointeurFin } from '../utils.js';

export function init() {
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
window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(boucle); }, { passive: true });
window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(boucle); });
function suivreDefilement(el, maj, marge = '100px') {
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
