// Carte fidélité façon Wallet : effet 3D au survol, tampons qui se posent un à un
import { CONFIG } from './config.js';
import { beanSVG, reduceMotion, pointeurFin, esc } from './utils.js';
import { picto } from './icons.js';

const TOTAL = 10;

// Faux QR code décoratif (motif déterministe)
function qr() {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let cells = '';
  for (let y = 0; y < 21; y++) {
    for (let x = 0; x < 21; x++) {
      const coin = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (!coin && r() > 0.52) cells += `M${x} ${y}h1v1h-1z`;
    }
  }
  const finder = (x, y) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return `<svg viewBox="0 0 21 21" shape-rendering="crispEdges" aria-hidden="true"><path fill="#2a1810" fill-rule="evenodd" d="${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}"/><path fill="#2a1810" d="${cells}"/></svg>`;
}

export function creerCarteFidelite(stage, { interactif = false, auto = true } = {}) {
  stage.innerHTML = `<div class="wallet" data-wallet tabindex="${interactif ? 0 : -1}" role="${interactif ? 'button' : 'img'}" aria-label="${interactif ? 'Carte fidélité de démonstration : touche-la pour ajouter un tampon' : 'Exemple de carte fidélité Ady : 10 tampons pour une boisson offerte'}">
      <div class="wallet__head">
        <svg viewBox="0 0 728 584" aria-hidden="true"><use href="assets/brand.svg#st-head"/></svg>
        <span class="wallet__brand">ADY COFFEE SHOP</span>
        <span class="wallet__count"><small>Tampons</small><b data-count>0/${TOTAL}</b></span>
      </div>
      <div class="wallet__beans" data-beans>${Array.from({ length: TOTAL }, () => `<span class="bean">${beanSVG()}</span>`).join('')}<span class="bean bean--gift">${picto('gift')}</span></div>
      <div class="wallet__art"><svg viewBox="0 0 1440 1208" aria-hidden="true"><use href="assets/brand.svg#logo"/></svg><div class="wallet__qr">${qr()}</div></div>
      <div class="wallet__fields"><span><small>Client</small><b>Marie</b></span><span style="text-align:right"><small>Récompense</small><b>Une boisson offerte</b></span></div>
      <p class="wallet__note" data-note>Plus que ${TOTAL} tampons pour : une boisson offerte</p>
    </div>
    ${interactif ? `<span class="wallet__hint">${picto('bean')} Touche la carte pour la tamponner</span>` : ''}`;

  const carte = stage.querySelector('[data-wallet]');
  const beans = [...stage.querySelectorAll('.bean')];
  const compteur = stage.querySelector('[data-count]');
  const note = stage.querySelector('[data-note]');
  let n = 0;

  const afficher = () => {
    beans.forEach((b, i) => b.classList.toggle('is-on', i < n || (i === TOTAL && n >= TOTAL)));
    compteur.textContent = `${Math.min(n, TOTAL)}/${TOTAL}`;
    note.textContent = n >= TOTAL ? 'Bravo ! Ta boisson est offerte.' : `Plus que ${TOTAL - n} tampon${TOTAL - n > 1 ? 's' : ''} pour : une boisson offerte`;
  };

  const tamponner = () => {
    n = n >= TOTAL ? 0 : n + 1;
    afficher();
    if (n === TOTAL) confettis(stage);
  };

  // effet 3D qui suit le pointeur
  if (pointeurFin() && !reduceMotion()) {
    carte.addEventListener('pointermove', (e) => {
      const r = carte.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      carte.classList.add('is-tracking');
      carte.style.setProperty('--ry', `${(px - 0.5) * 18}deg`);
      carte.style.setProperty('--rx', `${(0.5 - py) * 14}deg`);
      carte.style.setProperty('--gx', `${px * 100}%`);
      carte.style.setProperty('--gy', `${py * 100}%`);
    });
    carte.addEventListener('pointerleave', () => {
      carte.classList.remove('is-tracking');
      ['--rx', '--ry'].forEach((v) => carte.style.setProperty(v, '0deg'));
    });
  }

  if (interactif) {
    carte.addEventListener('click', tamponner);
    carte.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tamponner(); } });
    n = 3;
    afficher();
  } else if (auto) {
    // démonstration : les tampons se posent une fois quand la carte arrive à l'écran
    if (reduceMotion()) { n = 3; afficher(); return; }
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const step = () => {
        if (n >= TOTAL) { confettis(stage); return; }
        n += 1;
        afficher();
        setTimeout(step, n < TOTAL ? 230 : 400);
      };
      setTimeout(step, 500);
    }, { threshold: 0.5 });
    io.observe(carte);
  }
}

function confettis(stage) {
  if (reduceMotion()) return;
  const couleurs = ['#fbe9d6', '#f4c33f', '#2a1810', '#fff'];
  const r = stage.getBoundingClientRect();
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.innerHTML = beanSVG();
    el.style.color = couleurs[i % couleurs.length];
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top + r.height * 0.35}px`;
    document.body.appendChild(el);
    const a = Math.random() * Math.PI * 2;
    const d = 90 + Math.random() * 160;
    el.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 180}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
    ], { duration: 1300 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
  }
}

export function ctaFidelite(el, { clair = true } = {}) {
  if (!el) return;
  el.innerHTML = CONFIG.lienCarteFidelite
    ? `<a class="btn ${clair ? 'btn--light' : ''} btn--lg" href="${esc(CONFIG.lienCarteFidelite)}" target="_blank" rel="noopener">Je récupère ma carte</a>`
    : `<p class="label" style="margin:0">Demande-la au comptoir ou au livreur.</p>`;
}
