// Fidélité : carte de démonstration interactive
import { creerCarteFidelite, ctaFidelite } from '../loyalty.js';
import { $, $$ } from '../utils.js';

export function init() {
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { interactif: true });
  $$('[data-loyalty-cta]').forEach((el) => ctaFidelite(el, { clair: el.dataset.loyaltyCta !== 'sombre' }));
}
