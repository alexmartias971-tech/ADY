// Accueil : affiche du héro, bande de pictos, signatures, scène de livraison, fidélité, shop
import { PRODUITS } from '../menu.js';
import { carteProduit, brancherCartes } from '../produits.js';
import { creerScene, vignetteShop } from '../scene.js';
import { creerCarteFidelite } from '../loyalty.js';
import { picto } from '../icons.js';
import { initReveal, pauserHorsEcran } from '../ui.js';
import { $, $$, reduceMotion, pointeurFin } from '../utils.js';

export function init() {
  affiche();
  ruban();
  signatures();
  histoire();
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { auto: true });
  const v = $('[data-shop-vignette]');
  if (v) v.innerHTML = vignetteShop();
}

// Parallaxe douce des calques de l'affiche (souris uniquement)
function affiche() {
  const poster = $('[data-poster]');
  if (!poster || !pointeurFin() || reduceMotion()) return;
  let raf;
  $('.hero').addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      poster.style.setProperty('--mx', ((e.clientX / window.innerWidth) - 0.5).toFixed(3));
      poster.style.setProperty('--my', ((e.clientY / window.innerHeight) - 0.5).toFixed(3));
    });
  });
}

// Bande de mots + pictos de la marque : elle n'avance que quand on fait défiler la page
function ruban() {
  const track = $('[data-ribbon]');
  if (!track) return;
  const items = [['Iced latte', 'sun'], ['Matcha', 'palm'], ['Cold brew', 'can'], ['Espresso', 'bean'], ['Frappé', 'wave'], ['Açaí bowl', 'hat'], ['Moka', 'moka']];
  const serie = items.map(([mot, p], i) => `<span class="ribbon__word${i % 2 ? ' ribbon__word--outline' : ''}">${mot}</span>${picto(p)}`).join('');
  track.innerHTML = serie.repeat(3);
  if (reduceMotion()) return;
  let actif = false;
  let raf = null;
  const maj = () => {
    raf = null;
    const r = track.parentElement.getBoundingClientRect();
    const x = -((window.innerHeight - r.top) * 0.35) - 120;
    track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
  };
  const onScroll = () => { if (actif && !raf) raf = requestAnimationFrame(maj); };
  new IntersectionObserver(([en]) => { actif = en.isIntersecting; if (actif) maj(); }).observe(track.parentElement);
  window.addEventListener('scroll', onScroll, { passive: true });
  maj();
}

function signatures() {
  const box = $('[data-signatures]');
  if (!box) return;
  box.innerHTML = PRODUITS.filter((p) => p.signature).map((p, i) => carteProduit(p, { i })).join('');
  $$('.pcard', box).forEach((c) => c.classList.add('reveal'));
  brancherCartes(box);
  pauserHorsEcran($$('.pcard', box));
  initReveal(box);
}

// Scène de livraison pilotée par le défilement
function histoire() {
  const track = $('[data-story]');
  if (!track) return;
  const steps = $$('.story__step', track);
  const bars = $$('.story__bar span', track);
  const hint = $('.story__hint', track);
  const scene = creerScene($('[data-scene]', track), {
    onEtape: (i) => steps.forEach((s, k) => s.classList.toggle('is-active', k === i)),
  });
  if (reduceMotion()) {
    scene.set(1);
    return;
  }
  const seuils = [0, 0.12, 0.44, 0.86, 1];
  let raf = null;
  let actif = false;
  const maj = () => {
    raf = null;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    const r = track.getBoundingClientRect();
    const course = r.height - (window.innerHeight - header);
    const p = Math.min(1, Math.max(0, (header - r.top) / Math.max(1, course)));
    scene.set(p);
    bars.forEach((b, k) => b.style.setProperty('--p', Math.min(1, Math.max(0, (p - seuils[k]) / (seuils[k + 1] - seuils[k]))).toFixed(3)));
    if (hint) hint.style.opacity = p > 0.03 ? 0 : 1;
  };
  new IntersectionObserver(([en]) => { actif = en.isIntersecting; if (actif) maj(); }, { rootMargin: '100px' }).observe(track);
  window.addEventListener('scroll', () => { if (actif && !raf) raf = requestAnimationFrame(maj); }, { passive: true });
  window.addEventListener('resize', () => actif && maj());
  maj();
}
