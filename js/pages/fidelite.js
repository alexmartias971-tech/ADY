// Fidélité : carte de démonstration interactive
import { creerCarteFidelite } from '../loyalty.js';
import { $ } from '../utils.js';

export function init() {
  const stage = $('[data-wallet-stage]');
  if (stage) creerCarteFidelite(stage, { interactif: true });
}
