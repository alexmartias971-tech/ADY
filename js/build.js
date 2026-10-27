// ─────────────────────────────────────────────────────────────
//  « Le maracudja matcha tonic, monté face à la mer »
//  Le gobelet se remplit au fil du défilement : glaçons → sirop de
//  maracudja → tonic → matcha → paille et demi-maracudja.
// ─────────────────────────────────────────────────────────────
const INK = '#2a1810';
const TERRA = '#bf472c';
const CREAM = '#fbe9d6';
const OFF = 'translate(2.4 2)';

// gobelet (mêmes proportions que les illustrations), dessiné à l'échelle ×1,7
const xL = (y) => 42 + ((y - 58) * 17) / 164;
const CUP_BODY = 'M42 58 A58 10 0 0 0 158 58 L141 222 A41 7 0 0 1 59 222 Z';
const CUP_FRONT = 'M42 58 L59 222 A41 7 0 0 0 141 222 L158 58';
const S = 86;
const LIQ = `M${xL(S).toFixed(1)} ${S} A${(100 - xL(S)).toFixed(1)} 9.5 0 0 0 ${(200 - xL(S)).toFixed(1)} ${S} L141 222 A41 7 0 0 1 59 222 Z`;
const H = 222 - S; // 136
const COUCHES = { sirop: H * 0.3, tonic: H * 0.36, matcha: H * 0.34 };

const vagueHaut = (couleur) => `<path d="M-40 0 q12.5 -6 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 V200 H-40Z" fill="${couleur}"/>`;

function glacon(x, y, s, r) {
  return `<g class="bd-ice" data-ice><g transform="rotate(${r} ${x + s / 2} ${y + s / 2})">
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.24}" fill="#fff" fill-opacity=".7" stroke="${INK}" stroke-width="3"/>
    <rect x="${x + 4}" y="${y + 4}" width="${s - 8}" height="${s - 8}" rx="${s * 0.18}" fill="#dff1f6" fill-opacity=".45"/>
    <path d="M${x + 6} ${y + 9} q2 -4 7 -4" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g></g>`;
}

function scene() {
  let graines = '';
  for (let i = 0; i < 16; i++) graines += `<ellipse cx="${62 + ((i * 37) % 78)}" cy="${12 + ((i * 23) % 30)}" rx="2.6" ry="1.7" fill="${INK}"/>`;
  let bulles = '';
  for (let i = 0; i < 9; i++) bulles += `<circle class="bd-bubble" style="animation-delay:${(i * 0.37).toFixed(2)}s" cx="${64 + ((i * 29) % 74)}" cy="${20 + ((i * 17) % 34)}" r="${1.6 + (i % 3) * 0.7}" fill="#fff"/>`;
  return `<svg class="bd-svg" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Un maracudja matcha tonic qui se monte au fil du défilement, posé sur le sable de la plage de la Caravelle">
  <defs>
    <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c6da"/><stop offset="1" stop-color="#f7dcc0"/></linearGradient>
    <linearGradient id="bd-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aaabd"/><stop offset="1" stop-color="#2f8499"/></linearGradient>
    <mask id="bd-sun"><rect width="400" height="520" fill="#fff"/><rect y="178" width="400" height="6" fill="#000"/><rect y="194" width="400" height="8" fill="#000"/><rect y="212" width="400" height="10" fill="#000"/></mask>
    <clipPath id="bd-liq"><path d="${LIQ}"/></clipPath>
  </defs>
  <rect width="400" height="520" fill="url(#bd-sky)"/>
  <circle cx="300" cy="170" r="70" fill="#fbe2bd" mask="url(#bd-sun)"/>
  <g class="bd-cloud"><path d="M40 92 c-2 -10 10 -16 18 -11 c4 -12 24 -14 30 -2 c8 -6 22 -1 20 11 c8 1 8 10 0 11 h-64 c-8 0 -10 -7 -4 -9z" fill="#fff" opacity=".9"/></g>
  <rect y="232" width="400" height="90" fill="url(#bd-sea)"/>
  <g class="bd-waves"><path d="M-80 250 q20 -7 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#bfe3ea" stroke-width="3"/>
    <path d="M-80 276 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#9fd2dd" stroke-width="3"/></g>
  <path d="M0 312 C 120 300 260 322 400 306 V520 H0Z" fill="#f2cfa6"/>
  <path d="M0 312 C 120 300 260 322 400 306" fill="none" stroke="#fffaf2" stroke-width="6" stroke-linecap="round" opacity=".9"/>
  <g transform="translate(-30 330)"><g class="bd-palm"><svg x="-10" y="-300" width="200" height="200" viewBox="0 0 928 920" style="--st-bg:transparent;--st-ink:${INK}" overflow="visible"><use href="assets/brand.svg#st-palms"/></svg></g></g>
  <ellipse cx="206" cy="486" rx="110" ry="14" fill="${INK}" opacity=".16"/>

  <!-- demi-maracudja posé sur le sable -->
  <g class="bd-fruit" transform="translate(300 476)">
    <g transform="${OFF}"><path d="M-32 0 a32 26 0 0 0 64 0z" fill="#5e2a47"/><ellipse cx="0" cy="0" rx="32" ry="11" fill="#efe3c6"/><ellipse cx="0" cy="0" rx="26" ry="8.5" fill="#f4c33f"/></g>
    <path d="M-32 0 a32 26 0 0 0 64 0z" fill="none" stroke="${INK}" stroke-width="3.4"/><ellipse cx="0" cy="0" rx="32" ry="11" fill="none" stroke="${INK}" stroke-width="3"/>
    <g fill="${INK}"><ellipse cx="-10" cy="-1" rx="2.4" ry="1.5"/><ellipse cx="2" cy="-3" rx="2.4" ry="1.5"/><ellipse cx="12" cy="1" rx="2.4" ry="1.5"/><ellipse cx="-3" cy="3" rx="2.2" ry="1.4"/></g>
  </g>

  <g transform="translate(32 110) scale(1.7)">
    <!-- versements -->
    <rect class="bd-stream" data-stream="sirop" x="96" y="-90" width="7" height="0" rx="3.5" fill="#f2a72a"/>
    <rect class="bd-stream" data-stream="tonic" x="96" y="-90" width="6" height="0" rx="3" fill="#eaf6f2" stroke="#bfe3ea" stroke-width="1"/>
    <rect class="bd-stream" data-stream="matcha" x="95" y="-90" width="8" height="0" rx="4" fill="#86b347"/>
    <!-- paille qui descend -->
    <g data-paille><path d="M120 156 L140 6" stroke="${TERRA}" stroke-width="10"/><path d="M120 156 L140 6" stroke="${CREAM}" stroke-width="10" stroke-dasharray="6 9"/>
      <path d="M135 5.5 L115.5 150 M145 6.5 L125.5 152 M135 5.5 L145 6.5" stroke="${INK}" stroke-width="3.2" fill="none"/></g>
    <path d="${CUP_BODY}" fill="#fff" fill-opacity=".35"/>
    <g clip-path="url(#bd-liq)">
      <g data-couche="matcha"><g class="bd-wave">${vagueHaut('#8db255')}</g>
        <g class="bd-wisps" data-wisps fill="none" stroke="#7fa83c" stroke-linecap="round"><path d="M70 10 c-6 16 8 26 0 44" stroke-width="5"/><path d="M104 14 c8 14 -6 24 4 42" stroke-width="4"/><path d="M128 8 c-5 14 6 22 0 36" stroke-width="5"/></g></g>
      <g data-couche="tonic"><g class="bd-wave bd-wave--2">${vagueHaut('#eef4e4')}</g><g data-bulles>${bulles}</g></g>
      <g data-couche="sirop"><g class="bd-wave">${vagueHaut('#f4c33f')}</g><g>${graines}</g></g>
      <rect x="40" y="40" width="130" height="200" fill="url(#gr-d)" opacity=".5"/>
      <rect x="122" y="40" width="60" height="200" fill="url(#ht)" opacity=".16"/>
    </g>
    ${glacon(66, 182, 30, -10)}${glacon(98, 186, 28, 14)}${glacon(74, 148, 28, 20)}${glacon(104, 150, 30, -14)}${glacon(80, 112, 28, 8)}
    <svg x="69" y="150" width="62" height="52" viewBox="0 0 1440 1208" style="color:${CREAM}" data-logo-cup><use href="assets/brand.svg#logo"/></svg>
    <g fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="100" cy="58" rx="58" ry="10"/><path d="${CUP_FRONT}"/></g>
    <path d="M53 78 L65 206" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
    <g data-gouttes opacity="0">${[[78, 120], [126, 104], [88, 176], [122, 160], [70, 196], [132, 196]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 0.8}" rx="2" ry="3" fill="${INK}" opacity=".18"/><ellipse cx="${x}" cy="${y}" rx="2" ry="2.9" fill="#fff" opacity=".9"/>`).join('')}</g>
    <!-- demi-maracudja sur le bord -->
    <g data-garniture transform="rotate(-20 158 56)"><g class="bd-garniture">
      <path d="M136 56 A22 22 0 0 1 180 56 Z" fill="#5e2a47" stroke="${INK}" stroke-width="4"/>
      <path d="M141 56 A17 17 0 0 1 175 56 Z" fill="#f4c33f"/><g fill="${INK}"><circle cx="150" cy="50" r="1.8"/><circle cx="158" cy="45" r="1.8"/><circle cx="166" cy="50" r="1.8"/></g></g></g>
  </g>
  <g data-prix class="bd-price" transform="translate(104 440) rotate(-8)"><g class="bd-price__in">
    <circle r="40" fill="${TERRA}" stroke="${INK}" stroke-width="4"/><text y="8" text-anchor="middle" font-family="Big Shoulders Stencil, sans-serif" font-weight="800" font-size="24" fill="${CREAM}" data-prix-txt>6,50€</text>
  </g></g>
  </svg>`;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const phase = (p, a, b) => clamp01((p - a) / (b - a));

export function creerBuild(scene0, { prix } = {}) {
  scene0.innerHTML = scene();
  const svg = scene0.querySelector('svg');
  if (prix) svg.querySelector('[data-prix-txt]').textContent = prix;
  const glacons = [...svg.querySelectorAll('[data-ice]')];
  const couche = (n) => svg.querySelector(`[data-couche="${n}"]`);
  const stream = (n) => svg.querySelector(`[data-stream="${n}"]`);
  const paille = svg.querySelector('[data-paille]');
  const garniture = svg.querySelector('[data-garniture]');
  const gouttes = svg.querySelector('[data-gouttes]');
  const wisps = svg.querySelector('[data-wisps]');
  const prixG = svg.querySelector('[data-prix]');
  const logo = svg.querySelector('[data-logo-cup]');

  return function appliquer(p) {
    // 1. glaçons (0 → 0,18) : ils tombent l'un après l'autre
    glacons.forEach((g, i) => {
      const t = phase(p, 0.02 + i * 0.03, 0.1 + i * 0.03);
      const rebond = t < 1 ? (1 - t) ** 2 : 0;
      g.setAttribute('transform', `translate(0 ${(-260 * rebond).toFixed(1)}) rotate(${(rebond * 40 * (i % 2 ? 1 : -1)).toFixed(1)} 100 150)`);
      g.style.opacity = t > 0 ? 1 : 0;
    });
    // 2. sirop (0,2 → 0,4), 3. tonic (0,42 → 0,62), 4. matcha (0,64 → 0,84)
    const ps = phase(p, 0.2, 0.4);
    const pt = phase(p, 0.42, 0.62);
    const pm = phase(p, 0.64, 0.84);
    const ySirop = 222 - COUCHES.sirop * ps;
    const yTonic = ySirop - COUCHES.tonic * pt;
    const yMatcha = yTonic - COUCHES.matcha * pm;
    couche('sirop').setAttribute('transform', `translate(0 ${ySirop.toFixed(1)})`);
    couche('tonic').setAttribute('transform', `translate(0 ${yTonic.toFixed(1)})`);
    couche('matcha').setAttribute('transform', `translate(0 ${yMatcha.toFixed(1)})`);
    wisps.style.opacity = (pm * 0.7).toFixed(2);
    const verse = (n, t, surface) => {
      const actif = t > 0 && t < 1;
      const s = stream(n);
      s.setAttribute('height', actif ? Math.max(0, surface + 90).toFixed(1) : 0);
    };
    verse('sirop', ps, ySirop);
    verse('tonic', pt, yTonic);
    verse('matcha', pm, yMatcha);
    // logo crème sur le sirop, rouge une fois le tonic versé
    logo.style.color = pt > 0.5 ? TERRA : CREAM;
    // 5. paille, garniture, gouttes, prix (0,86 → 1)
    const pf = phase(p, 0.86, 0.96);
    paille.setAttribute('transform', `translate(0 ${(-180 * (1 - pf)).toFixed(1)})`);
    paille.style.opacity = pf > 0 ? 1 : 0;
    garniture.style.opacity = pf > 0.6 ? 1 : 0;
    garniture.classList.toggle('is-on', pf > 0.6);
    gouttes.setAttribute('opacity', phase(p, 0.9, 1).toFixed(2));
    prixG.classList.toggle('is-on', p > 0.93);
    return p < 0.2 ? 0 : p < 0.42 ? 1 : p < 0.64 ? 2 : p < 0.86 ? 3 : 4;
  };
}
