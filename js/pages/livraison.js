// Livraison plage : scène qui se joue en boucle + carte de la zone
import { creerScene } from '../scene.js';
import { carteVitrine } from '../map.js';
import { $, quandVisible } from '../utils.js';

export function init() {
  const el = $('[data-scene-loop]');
  if (el) {
    const scene = creerScene(el, { mode: 'loop' });
    new IntersectionObserver(([en]) => (en.isIntersecting ? scene.jouer() : scene.pause())).observe(el);
  }
  const zone = $('[data-zone-map]');
  if (zone) quandVisible(zone, () => carteVitrine(zone));
}
