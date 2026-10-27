// Le shop : vignette illustrée + carte (shop et plage)
import { vignetteShop } from '../scene.js';
import { carteVitrine } from '../map.js';
import { $, quandVisible } from '../utils.js';

export function init() {
  const v = $('[data-shop-vignette]');
  if (v) v.innerHTML = vignetteShop();
  const m = $('[data-shop-map]');
  if (m) quandVisible(m, () => carteVitrine(m, { centrer: 'shop' }));
}
