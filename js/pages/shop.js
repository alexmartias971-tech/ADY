// Le shop : vignette illustrée, photos du shop, carte (shop et plage)
import { vignetteShop } from '../scene.js';
import { carteVitrine } from '../map.js';
import { $, $$, quandVisible, reduceMotion } from '../utils.js';

export function init() {
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

