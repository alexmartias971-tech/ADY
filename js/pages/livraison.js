// Livraison plage : scène qui se joue en boucle, carte et liste des points de livraison
import { catalogue } from '../data.js';
import { creerScene } from '../scene.js';
import { carteVitrine } from '../map.js';
import { $, esc, quandVisible } from '../utils.js';

export function init() {
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
      <span class="points-liste__img">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : ''}<span class="points-liste__n">${i + 1}</span></span>
      <span><b>${esc(p.nom)}</b>${p.indication ? `<small>${esc(p.indication)}</small>` : ''}</span>
    </li>`).join('');
    liste.hidden = !catalogue.points.length;
  }
}
