// ─────────────────────────────────────────────────────────────
//  Scène « Livré les pieds dans le sable »
//  Panorama illustré (monde de 3600 × 900) filmé par une caméra qui suit
//  le livreur, du shop jusqu'au parasol jaune du client.
//  • mode 'scroll' : la progression suit le défilement (page d'accueil)
//  • mode 'loop'   : la scène se joue toute seule en boucle
//  Trois plans de parallaxe : lointain (soleil, nuages, île), mer, plage.
// ─────────────────────────────────────────────────────────────

const INK = '#2a1810';
const TERRA = '#bf472c';
const CREAM = '#fbe9d6';
const SAND = '#f2cfa6';
const SKIN = '#9c5f38';
const SPRITE = 'assets/brand.svg';
const OFF = 'translate(2.4 2)';
const W = 3600;
const H = 900;
const PATH = 'M470 694 C 620 704 760 722 1000 736 S 1400 772 1700 754 S 2300 732 2600 758 S 2900 772 3040 762';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// Aplat décalé + trait : la signature « sérigraphie » de tout le site
const imp = (fill, ink = '', sw = 4) => `<g transform="${OFF}">${fill}</g><g fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ink}</g>`;

export function polaroid({ x = 0, y = 0, w = 120, rot = 0 } = {}) {
  const s = w / 120;
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="3" y="4" width="120" height="140" rx="4" fill="${INK}" opacity=".18"/>
    <rect width="120" height="140" rx="4" fill="#fffaf2" stroke="${INK}" stroke-width="3"/>
    <clipPath id="pol-c"><rect x="9" y="9" width="102" height="96"/></clipPath>
    <g clip-path="url(#pol-c)">
      <rect x="9" y="9" width="102" height="44" fill="#a9d3e3"/>
      <rect x="9" y="50" width="102" height="18" fill="#3f97ae"/>
      <path d="M9 64 q8 -4 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t8 0 V70 H9Z" fill="#fff" opacity=".8"/>
      <rect x="9" y="66" width="102" height="40" fill="${SAND}"/>
      <path d="M40 92 L94 92 L86 102 L32 102Z" fill="${TERRA}"/><path d="M42 95 h48 M38 99 h48" stroke="${CREAM}" stroke-width="2.4"/>
      <path d="M63 96 L66 46" stroke="${INK}" stroke-width="2.6"/>
      <path d="M36 50 Q66 22 96 50 Q88 46 81 50 Q73 46 66 50 Q58 46 51 50 Q43 46 36 50Z" fill="#f4c33f" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="74" cy="86" r="5" fill="${SKIN}"/><path d="M70 92 q4 -4 9 0 v6 h-9z" fill="#4aa3c9"/>
    </g>
    <rect x="9" y="9" width="102" height="96" fill="url(#gr-d)" opacity=".35"/>
    <text x="60" y="128" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="400" font-size="14" fill="${INK}">mon spot !</text>
  </g>`;
}

function soleil(cx, cy, r, id = 'sun-stripes') {
  return `<g>
    <mask id="${id}"><rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="#fff"/>
      <rect x="${cx - r}" y="${cy + r * 0.22}" width="${r * 2}" height="${r * 0.07}" fill="#000"/>
      <rect x="${cx - r}" y="${cy + r * 0.42}" width="${r * 2}" height="${r * 0.1}" fill="#000"/>
      <rect x="${cx - r}" y="${cy + r * 0.64}" width="${r * 2}" height="${r * 0.13}" fill="#000"/></mask>
    <circle cx="${cx}" cy="${cy}" r="${r * 1.35}" fill="#fff4dd" opacity=".35"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbe2bd" mask="url(#${id})"/>
  </g>`;
}

function nuage(x, y, s, cls) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="cloud ${cls}"><path d="M0 40 C -4 22 16 12 30 20 C 36 0 70 -4 82 16 C 96 6 120 14 118 34 C 132 36 134 52 120 54 L6 54 C -8 54 -10 42 0 40Z" fill="#fff" opacity=".92"/><path d="M14 46 h96" stroke="#e3eef2" stroke-width="5" stroke-linecap="round"/></g></g>`;
}

function mouette(x, y, s, d) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="gull" style="animation-delay:${d}s"><g class="gull__wings"><path d="M-20 0 Q-10 -12 0 0 Q10 -12 20 0" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/></g></g></g>`;
}

function voilier(x, y) {
  return `<g transform="translate(${x} ${y})"><g class="boat">
    <path d="M-34 0 L34 0 L26 10 L-26 10Z" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
    <path d="M0 -2 L0 -62" stroke="${INK}" stroke-width="2.6"/>
    <path d="M2 -60 L30 -6 L2 -6Z" fill="${CREAM}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M-2 -52 L-24 -6 L-2 -6Z" fill="${TERRA}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  </g></g>`;
}

function parasol(x, y, couleur, rayures = CREAM, angle = -6, h = 190) {
  const w = 150;
  let bandes = '';
  for (let i = 0; i < 6; i += 2) {
    const a = -w / 2 + (i * w) / 6;
    bandes += `<path d="M${a} 0 Q${a + w / 12} -${h * 0.24} ${a + w / 6} -${h * 0.3} L${a + w / 6} 0Z" fill="${rayures}"/>`;
  }
  const dome = `M${-w / 2} 0 Q0 -${h * 0.42} ${w / 2} 0 Q${w * 0.42} -6 ${w / 3} 0 Q${w / 4} -6 ${w / 6} 0 Q${w / 12} -6 0 0 Q-${w / 12} -6 -${w / 6} 0 Q-${w / 4} -6 -${w / 3} 0 Q-${w * 0.42} -6 ${-w / 2} 0Z`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M0 0 L0 -${h}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(0 -${h - 6})"><g class="parasol__top">
      <clipPath id="par-${x}"><path d="${dome}"/></clipPath>
      ${imp(`<path d="${dome}" fill="${couleur}"/><g clip-path="url(#par-${x})">${bandes}<rect x="0" y="-${h}" width="${w}" height="${h}" fill="url(#ht)" opacity=".18"/></g>`, `<path d="${dome}"/><path d="M0 -${h * 0.21} L-${w / 3} 0 M0 -${h * 0.21} L${w / 3} 0 M0 -${h * 0.21} L0 0" stroke-width="2.6" opacity=".55"/>`)}
      <circle cx="0" cy="-${h * 0.21}" r="4" fill="${INK}"/>
    </g></g>
  </g>`;
}

function serviette(x, y, w, couleur, rayure = CREAM) {
  return imp(`<path d="M${x} ${y} L${x + w} ${y} L${x + w - 26} ${y + 40} L${x - 26} ${y + 40}Z" fill="${couleur}"/>
    <path d="M${x - 6} ${y + 10} h${w} M${x - 13} ${y + 22} h${w} M${x - 20} ${y + 33} h${w}" stroke="${rayure}" stroke-width="5"/>`, `<path d="M${x} ${y} L${x + w} ${y} L${x + w - 26} ${y + 40} L${x - 26} ${y + 40}Z" stroke-width="3.4"/>`, 3.4);
}

function palmier(x, y, s, cls = '') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="palm-sway ${cls}"><svg x="-160" y="-310" width="320" height="320" viewBox="0 0 928 920" style="--st-bg:transparent;--st-ink:${INK}" overflow="visible"><use href="${SPRITE}#st-palms"/></svg></g></g>`;
}

function lecteur(x, y) {
  // personne allongée qui lit, sous un parasol
  return `<g transform="translate(${x} ${y})">
    ${imp(`<path d="M-60 -14 C-40 -24 10 -22 40 -16 L46 -4 L-64 -2Z" fill="#4aa3c9"/><circle cx="58" cy="-20" r="13" fill="${SKIN}"/><path d="M30 -38 l18 -10 l8 16 l-18 10z" fill="${CREAM}"/><path d="M-62 -10 L-92 -8 M-62 -4 L-94 0" stroke="${SKIN}" stroke-width="9" stroke-linecap="round"/>`,
    `<path d="M-60 -14 C-40 -24 10 -22 40 -16 L46 -4 L-64 -2Z" stroke-width="3.2"/><circle cx="58" cy="-20" r="13" stroke-width="3.2"/><path d="M30 -38 l18 -10 l8 16 l-18 10z" stroke-width="3"/><path d="M39 -43 l8 13" stroke-width="2" opacity=".6"/>`, 3.2)}
    <path d="M52 -30 q8 -10 18 -4" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

function enfant(x, y) {
  return `<g transform="translate(${x} ${y})">
    ${imp(`<path d="M30 -2 L30 -40 L40 -40 L40 -52 L48 -52 L48 -40 L58 -40 L58 -54 L66 -54 L66 -40 L76 -40 L76 -2Z" fill="#e6b47e"/><rect x="48" y="-26" width="10" height="14" rx="5" fill="#c88f5a"/>
      <path d="M-14 -4 C-16 -24 -10 -36 0 -36 C10 -36 14 -24 12 -4Z" fill="#f4c33f"/><circle cx="0" cy="-48" r="12" fill="${SKIN}"/>
      <path d="M-34 -2 L-22 -2 L-24 -20 L-32 -20Z" fill="${TERRA}"/>`,
      `<path d="M30 -2 L30 -40 L40 -40 L40 -52 L48 -52 L48 -40 L58 -40 L58 -54 L66 -54 L66 -40 L76 -40 L76 -2Z" stroke-width="3"/><path d="M-14 -4 C-16 -24 -10 -36 0 -36 C10 -36 14 -24 12 -4Z" stroke-width="3"/><circle cx="0" cy="-48" r="12" stroke-width="3"/><path d="M-34 -2 L-22 -2 L-24 -20 L-32 -20Z M-34 -20 q6 -10 12 0" stroke-width="3"/><path d="M8 -26 L26 -16" stroke-width="3"/>`, 3)}
    <g class="flag"><path d="M62 -54 L62 -78" stroke="${INK}" stroke-width="2.6"/><path d="M62 -78 L80 -72 L62 -66Z" fill="${TERRA}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></g>
  </g>`;
}

function cerfVolant(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path d="M6 -70 Q 120 -260 200 -380" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".55"/>
    <g transform="translate(200 -380)"><g class="kite">
      ${imp(`<path d="M0 -40 L28 0 L0 46 L-28 0Z" fill="${TERRA}"/><path d="M0 -40 L0 46 M-28 0 L28 0" stroke="${CREAM}" stroke-width="4"/>`, '<path d="M0 -40 L28 0 L0 46 L-28 0Z" stroke-width="3"/>', 3)}
      <path class="kite__tail" d="M0 46 q-14 18 0 34 t0 34 t0 34" fill="none" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-6 82 l12 -6 M-6 116 l12 -6" stroke="${TERRA}" stroke-width="5" stroke-linecap="round"/>
    </g></g>
    ${imp(`<path d="M-12 -4 C-14 -26 -8 -40 2 -40 C12 -40 16 -26 14 -4Z" fill="#8db255"/><circle cx="2" cy="-54" r="12" fill="${SKIN}"/>`, '<path d="M-12 -4 C-14 -26 -8 -40 2 -40 C12 -40 16 -26 14 -4Z" stroke-width="3"/><circle cx="2" cy="-54" r="12" stroke-width="3"/><path d="M10 -32 L6 -70" stroke-width="3"/>', 3)}
  </g>`;
}

function surf(x, y) {
  return `<g transform="translate(${x} ${y}) rotate(8)">${imp(`<path d="M0 0 C-22 -40 -20 -150 0 -190 C20 -150 22 -40 0 0Z" fill="${CREAM}"/><path d="M-6 -20 C-14 -60 -12 -140 0 -176" stroke="${TERRA}" stroke-width="8" fill="none"/>`, '<path d="M0 0 C-22 -40 -20 -150 0 -190 C20 -150 22 -40 0 0Z"/>')}</g>`;
}

function glaciere(x, y) {
  return `<g transform="translate(${x} ${y})">${imp(`<rect x="0" y="-44" width="70" height="44" rx="6" fill="#4aa3c9"/><rect x="-3" y="-54" width="76" height="14" rx="5" fill="${CREAM}"/>`, '<rect x="0" y="-44" width="70" height="44" rx="6"/><rect x="-3" y="-54" width="76" height="14" rx="5"/><path d="M24 -54 q11 -14 22 0" stroke-width="3"/>')}</g>`;
}

function crabe(x, y) {
  return `<g class="crab" transform="translate(${x} ${y})"><g class="crab__body">${imp(`<ellipse cx="0" cy="-10" rx="16" ry="10" fill="${TERRA}"/><circle cx="-20" cy="-18" r="6" fill="${TERRA}"/><circle cx="20" cy="-18" r="6" fill="${TERRA}"/>`,
    '<ellipse cx="0" cy="-10" rx="16" ry="10" stroke-width="3"/><path d="M-14 -4 l-10 6 M-10 -2 l-6 8 M14 -4 l10 6 M10 -2 l6 8 M-8 -18 v-8 M8 -18 v-8" stroke-width="2.6"/><circle cx="-20" cy="-18" r="6" stroke-width="2.6"/><circle cx="20" cy="-18" r="6" stroke-width="2.6"/>', 3)}<circle cx="-8" cy="-27" r="2.4" fill="${INK}"/><circle cx="8" cy="-27" r="2.4" fill="${INK}"/></g></g>`;
}

function shop(vapeur = false) {
  let planches = '';
  for (let x = 156; x < 560; x += 22) planches += `M${x} 470 V648 `;
  let lampes = '';
  for (let i = 0; i < 9; i++) {
    const x = 160 + i * 50;
    const y = 446 + Math.sin((i / 8) * Math.PI) * 14;
    lampes += `<circle class="bulb" style="animation-delay:${i * 0.35}s" cx="${x}" cy="${y + 8}" r="6" fill="#ffd98a"/>`;
  }
  let auvent = '';
  for (let i = 0; i < 9; i++) auvent += `<rect x="${140 + i * 48}" y="476" width="24" height="52" fill="${CREAM}"/>`;
  let festons = 'M140 528 ';
  for (let i = 0; i < 18; i++) festons += `a12 12 0 0 0 24 0 `;
  return `<g class="shop">
    <rect x="96" y="644" width="560" height="26" fill="#b98656" stroke="${INK}" stroke-width="3.4"/>
    <path d="M120 644 V670 M170 644 V670 M220 644 V670 M270 644 V670 M320 644 V670 M370 644 V670 M420 644 V670 M470 644 V670 M520 644 V670 M570 644 V670 M620 644 V670" stroke="${INK}" stroke-width="2" opacity=".35"/>
    ${imp('<rect x="150" y="440" width="412" height="206" fill="#fbe9d6"/><rect x="150" y="440" width="412" height="206" fill="url(#gr-d)" opacity=".5"/>', `<rect x="150" y="440" width="412" height="206"/><path d="${planches}" stroke-width="1.6" opacity=".25"/>`)}
    <g><svg x="232" y="330" width="250" height="131" viewBox="0 0 944 496" style="--st-bg:${CREAM};--st-ink:${TERRA}"><use href="${SPRITE}#st-oval"/></svg></g>
    <path d="M250 440 L262 414 M462 440 L450 414" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    ${imp(`<rect x="140" y="476" width="432" height="52" fill="${TERRA}"/>${auvent}<path d="${festons}" fill="${TERRA}"/><rect x="140" y="476" width="432" height="52" fill="url(#ht)" opacity=".15"/>`, `<path d="M136 476 H576 L572 528 H140Z M136 476 L150 456 H562 L576 476" stroke-width="3.6"/>`)}
    <path d="M150 450 Q356 476 562 450" fill="none" stroke="${INK}" stroke-width="2"/>${lampes}
    ${imp('<rect x="182" y="548" width="206" height="74" fill="#5a3624"/><rect x="176" y="618" width="218" height="16" fill="#c99566"/>', '<rect x="182" y="548" width="206" height="74"/><rect x="176" y="618" width="218" height="16" stroke-width="3.2"/>')}
    <g transform="translate(206 574)">${imp('<rect x="0" y="0" width="64" height="44" rx="5" fill="#d9d0c4"/><rect x="8" y="10" width="14" height="10" rx="2" fill="#5a3624"/>', '<rect x="0" y="0" width="64" height="44" rx="5" stroke-width="3"/><path d="M30 44 v-12 M44 44 v-12" stroke-width="3"/>', 3)}</g>
    <g class="shop-steam${vapeur ? ' is-on' : ''}" data-shop-steam><path d="M236 566 c-8 -8 8 -14 0 -22 c-8 -8 8 -12 0 -20" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/><path d="M252 566 c-8 -8 8 -14 0 -22 c-8 -8 8 -12 0 -20" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></g>
    <g transform="translate(300 618)">${imp(`<path d="M0 0 L4 -30 L22 -30 L26 0Z" fill="#ecd3b0"/><path d="M34 0 L38 -30 L56 -30 L60 0Z" fill="#cfe08d"/>`, '<path d="M0 0 L4 -30 L22 -30 L26 0Z M34 0 L38 -30 L56 -30 L60 0Z M16 -30 L20 -44 M50 -30 L54 -44" stroke-width="2.8"/>', 2.8)}</g>
    ${imp(`<rect x="430" y="540" width="86" height="106" fill="${TERRA}"/><circle cx="473" cy="574" r="18" fill="#a9d3e3"/>`, '<rect x="430" y="540" width="86" height="106"/><circle cx="473" cy="574" r="18" stroke-width="3"/><circle cx="502" cy="602" r="3.5" fill="#2a1810"/>')}
    <g transform="translate(586 646)">${imp(`<path d="M0 0 L14 -86 L54 -86 L68 0Z" fill="#3b2a22"/>`, '<path d="M0 0 L14 -86 L54 -86 L68 0Z M8 0 L4 -10 M60 0 L64 -10" stroke-width="3.2"/>', 3.2)}
      <text x="34" y="-60" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="15" fill="${CREAM}">ICED</text>
      <text x="34" y="-44" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="15" fill="${CREAM}">LATTE</text>
      <text x="34" y="-22" text-anchor="middle" font-family="Big Shoulders Stencil, sans-serif" font-weight="800" font-size="17" fill="#f4c33f">5€</text></g>
    <g transform="translate(116 646)">${imp(`<path d="M-14 0 L-18 -30 L18 -30 L14 0Z" fill="${TERRA}"/><path d="M0 -30 C-20 -50 -24 -70 -8 -84 M0 -30 C4 -56 20 -66 28 -80 M0 -30 C-6 -50 6 -64 2 -92" stroke="#5f8a3a" stroke-width="7" fill="none"/>`, '<path d="M-14 0 L-18 -30 L18 -30 L14 0Z" stroke-width="3"/>', 3)}</g>
    <g class="bubble" data-bubble="notif" transform="translate(604 350)"><g class="bubble__in">
      <path d="M-120 -44 h240 a16 16 0 0 1 16 16 v40 a16 16 0 0 1 -16 16 h-108 l-12 16 l-12 -16 h-108 a16 16 0 0 1 -16 -16 v-40 a16 16 0 0 1 16 -16z" fill="#fffaf2" stroke="${INK}" stroke-width="3.4"/>
      <circle cx="-88" cy="-8" r="20" fill="${TERRA}"/><path d="M-97 -12 h18 l-2 16 h-14z M-93 -12 v-3 a5 5 0 0 1 10 0 v3" fill="none" stroke="${CREAM}" stroke-width="3" stroke-linejoin="round"/>
      <text x="-58" y="-12" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="22" fill="${INK}">NOUVELLE COMMANDE</text>
      <text x="-58" y="12" font-family="DM Sans, sans-serif" font-weight="500" font-size="15" fill="${INK}" opacity=".75">2 boissons · plage de la Caravelle</text>
    </g></g>
  </g>`;
}

function panneau(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path d="M0 0 L0 -170" stroke="#8a5a35" stroke-width="12" stroke-linecap="round"/><path d="M0 0 L0 -170" stroke="${INK}" stroke-width="3" opacity=".3"/>
    ${imp(`<path d="M-10 -160 H170 L194 -138 L170 -116 H-10Z" fill="${CREAM}"/><path d="M-10 -106 H110 L130 -90 L110 -74 H-10Z" fill="${TERRA}"/>`, '<path d="M-10 -160 H170 L194 -138 L170 -116 H-10Z"/><path d="M-10 -106 H110 L130 -90 L110 -74 H-10Z"/>', 3.4)}
    <text x="84" y="-142" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="18" fill="${INK}">PLAGE DE LA</text>
    <text x="84" y="-122" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="18" fill="${INK}">CARAVELLE</text>
    <text x="54" y="-83" text-anchor="middle" font-family="Big Shoulders Stencil, sans-serif" font-weight="800" font-size="20" fill="${CREAM}">5 MIN</text>
  </g>`;
}

function promenade() {
  let lattes = '';
  const pts = [[470, 690], [1010, 736]];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const x = pts[0][0] + (pts[1][0] - pts[0][0]) * t;
    const y = pts[0][1] + (pts[1][1] - pts[0][1]) * t;
    lattes += `M${x - 6} ${y - 26} L${x + 6} ${y + 26} `;
  }
  return imp(`<path d="M450 664 L1030 708 L1020 764 L440 718Z" fill="#c99566"/><path d="M450 664 L1030 708 L1020 764 L440 718Z" fill="url(#gr-d)" opacity=".6"/>`, `<path d="M450 664 L1030 708 L1020 764 L440 718Z" stroke-width="3.4"/><path d="${lattes}" stroke-width="2" opacity=".4"/>`, 3.4);
}

function livreur() {
  const jambe = (cls, couleurShort) => `<g class="leg ${cls}">
      <path d="M-6 -74 L-5 -12 L5 -12 L6 -74Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M-8 -78 L8 -78 L9 -54 L-9 -54Z" fill="${couleurShort}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M-9 -12 h16 q10 0 10 8 v4 h-26z" fill="#fffaf2" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
    </g>`;
  return `<g class="courier" data-courier>
    <ellipse class="courier__shadow" cx="4" cy="2" rx="34" ry="6" fill="${INK}" opacity=".16"/>
    <g class="courier__body">
      <g class="arm arm--b"><path d="M-10 -124 L-13 -84" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M-10 -124 L-13 -84" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/><path d="M-16 -128 L-17 -110 L-4 -110 L-3 -128Z" fill="${TERRA}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>
      ${jambe('leg--b', '#e2c49a')}
      ${jambe('leg--f', CREAM)}
      <path d="M-17 -128 C-21 -112 -19 -96 -16 -76 L16 -76 C19 -96 21 -112 17 -128 C8 -135 -8 -135 -17 -128Z" fill="${TERRA}" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>
      <text x="0" y="-100" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="13" fill="${CREAM}">ADY</text>
      <rect x="-5" y="-140" width="10" height="10" fill="${SKIN}"/>
      <circle cx="2" cy="-150" r="17" fill="${SKIN}" stroke="${INK}" stroke-width="3.4"/>
      <circle cx="-8" cy="-149" r="4" fill="${SKIN}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="10" cy="-153" r="2" fill="${INK}"/>
      <path d="M17 -152 q6 3 1 7" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M7 -143 q6 -4 13 -1 q-6 3 -13 1z" fill="${INK}"/>
      <path d="M-14 -160 C-14 -178 -6 -186 2 -186 C10 -186 18 -178 18 -160Z" fill="${CREAM}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M-14.5 -166 h33 v5 h-33z" fill="${TERRA}"/>
      <ellipse cx="2" cy="-160" rx="40" ry="7" fill="${CREAM}" stroke="${INK}" stroke-width="3.2"/>
      <path d="M8 -122 L22 -104 L42 -106" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8 -122 L22 -104 L42 -106" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 -128 L4 -112 L16 -114 L14 -129Z" fill="${TERRA}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <g transform="translate(26 -108)">
        <path d="M0 0 L40 0 L36 10 L4 10Z" fill="#c99566" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M4 0 L6 -26 L18 -26 L20 0Z" fill="#ecd3b0" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M21 0 L23 -26 L35 -26 L37 0Z" fill="#cfe08d" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M14 -26 L18 -40 M31 -26 L35 -40" stroke="${TERRA}" stroke-width="3.4" stroke-linecap="round"/>
      </g>
      <g class="bubble bubble--think" data-bubble="photo" transform="translate(30 -200)"><g class="bubble__in">
        <circle cx="-26" cy="40" r="5" fill="#fffaf2" stroke="${INK}" stroke-width="2.6"/><circle cx="-14" cy="22" r="8" fill="#fffaf2" stroke="${INK}" stroke-width="2.6"/>
        <path d="M-10 -118 C-30 -150 30 -176 60 -150 C100 -170 150 -140 136 -104 C170 -88 156 -20 120 -24 C110 0 40 6 30 -16 C-6 -2 -36 -40 -16 -64 C-44 -76 -34 -112 -10 -118Z" fill="#fffaf2" stroke="${INK}" stroke-width="3.2"/>
        ${polaroid({ x: 22, y: -150, w: 92, rot: -6 })}
      </g></g>
    </g>
  </g>`;
}

function client() {
  return `<g class="customer" data-customer transform="translate(3170 790)">
    ${imp(`<path d="M2 -10 C-2 -30 0 -50 6 -64 L26 -64 C30 -48 30 -28 26 -10Z" fill="#4aa3c9"/>`, '<path d="M2 -10 C-2 -30 0 -50 6 -64 L26 -64 C30 -48 30 -28 26 -10Z" stroke-width="3.2"/>', 3.2)}
    <path d="M8 -14 L-22 -36 L-30 -4" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 -14 L-22 -36 L-30 -4" fill="none" stroke="#7a4a2a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 -56 L-14 -38" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M24 -56 L-14 -38" fill="none" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/>
    <circle cx="16" cy="-80" r="14" fill="#7a4a2a" stroke="${INK}" stroke-width="3.2"/>
    <path d="M4 -86 C4 -100 30 -100 30 -84 C34 -96 20 -104 10 -98Z" fill="${INK}"/><circle cx="30" cy="-96" r="6" fill="${INK}"/>
    <path d="M2 -82 h12 M6 -82 a4 3 0 0 0 8 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <g class="customer__arm"><path d="M20 -58 L4 -96" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M20 -58 L4 -96" fill="none" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/><circle cx="3" cy="-100" r="6.5" fill="#7a4a2a" stroke="${INK}" stroke-width="2.8"/></g>
  </g>`;
}

function construireSVG() {
  const rand = rng(5);
  let empreintes = '';
  let sable = '';
  for (let i = 0; i < 260; i++) sable += `<circle cx="${Math.round(rand() * W)}" cy="${Math.round(640 + rand() * 260)}" r="${(1 + rand() * 1.8).toFixed(1)}" fill="#d9a77a" opacity="${(0.35 + rand() * 0.4).toFixed(2)}"/>`;
  let vagues1 = 'M-1200 520 ';
  let vagues2 = 'M-1200 566 ';
  let ecume = 'M-1000 628 ';
  for (let i = 0; i < 56; i++) { vagues1 += 'q35 -10 70 0 t70 0 '; }
  for (let i = 0; i < 46; i++) { vagues2 += 'q45 -12 90 0 t90 0 '; }
  for (let i = 0; i < 80; i++) { ecume += 'q30 -12 60 0 t60 0 '; }
  return `<svg class="scene__svg" viewBox="0 0 1600 ${H}" preserveAspectRatio="xMinYMid slice" role="img" aria-label="Illustration : le livreur Ady part du shop, traverse la plage de la Caravelle et apporte la commande à une cliente sous son parasol jaune.">
    <defs>
      <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c6da"/><stop offset=".62" stop-color="#cfe5e8"/><stop offset="1" stop-color="#f7dcc0"/></linearGradient>
      <linearGradient id="sc-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aaabd"/><stop offset="1" stop-color="#2f8499"/></linearGradient>
    </defs>
    <rect x="-4000" y="0" width="12000" height="${H}" fill="url(#sc-sky)" data-sky/>
    <g data-layer="far">
      ${soleil(820, 400, 120)}
      ${nuage(120, 210, 1.2, 'cloud--1')}${nuage(980, 190, 0.9, 'cloud--2')}${nuage(1700, 240, 1.1, 'cloud--3')}
      <path d="M200 482 C 320 458 480 452 640 462 C 760 468 860 474 960 482Z" fill="#6f9f9b" opacity=".55"/>
      ${voilier(1300, 474)}
      ${mouette(500, 210, 1, 0)}${mouette(560, 250, 0.7, -1.2)}${mouette(1500, 190, 0.9, -3)}
    </g>
    <g data-layer="mid">
      <rect x="-1200" y="478" width="5200" height="200" fill="url(#sc-sea)"/>
      <rect x="-1200" y="478" width="5200" height="200" fill="url(#gr-l)" opacity=".4"/>
      <path d="M-1200 480 H3800" stroke="#e8f4f4" stroke-width="3" opacity=".7"/>
      <g class="sea__wave sea__wave--1"><path d="${vagues1}" fill="none" stroke="#bfe3ea" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>
      <g class="sea__wave sea__wave--2"><path d="${vagues2}" fill="none" stroke="#9fd2dd" stroke-width="4" stroke-linecap="round" opacity=".7"/></g>
      <g transform="translate(1250 590)"><g class="swimmer"><circle cx="0" cy="0" r="12" fill="#7a4a2a" stroke="${INK}" stroke-width="3"/><path d="M-12 -4 a12 12 0 0 1 24 0z" fill="${TERRA}" stroke="${INK}" stroke-width="3"/><path d="M14 4 q14 -18 24 -6" fill="none" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/><path d="M-26 8 q26 -8 52 0" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/></g></g>
      ${palmier(260, 610, 0.72, 'palm--far')}${palmier(1900, 600, 0.6, 'palm--far')}
    </g>
    <g data-layer="near">
      <path d="M-900 624 C -500 636 -200 612 0 626 C 400 610 900 640 1500 622 S 2700 640 3800 620 V${H + 40} H-900Z" fill="${SAND}"/>
      <path d="M-900 624 C -500 636 -200 612 0 626 C 400 610 900 640 1500 622 S 2700 640 3800 620 V${H + 40} H-900Z" fill="url(#gr-d)" opacity=".45"/>
      ${palmier(-260, 660, 1.0)}${parasol(-120, 740, '#4aa3c9', CREAM, -4, 180)}${serviette(-210, 744, 150, '#f4c33f', TERRA)}
      ${sable}
      <g class="shore"><path d="${ecume}" fill="none" stroke="#fffaf2" stroke-width="6" stroke-linecap="round" opacity=".9"/></g>
      ${palmier(700, 650, 1.05)}
      ${shop()}
      ${promenade()}
      ${panneau(1060, 734)}
      ${palmier(1560, 690, 0.95)}
      ${parasol(1420, 720, TERRA)}${serviette(1330, 724, 170, '#4aa3c9')}${lecteur(1430, 748)}
      ${enfant(1880, 728)}
      ${surf(2120, 722)}
      ${palmier(2460, 690, 1.1)}
      ${parasol(2330, 724, '#4aa3c9', CREAM, 5)}${serviette(2250, 728, 160, TERRA)}
      ${glaciere(2700, 744)}
      ${cerfVolant(2620, 760)}
      <g data-footprints>${empreintes}</g>
      <path d="${PATH}" fill="none" stroke="none" data-path/>
      <g class="spot">${parasol(3248, 774, '#f4c33f', CREAM, 4, 210)}${serviette(3110, 780, 200, TERRA)}${glaciere(3300, 812)}</g>
      ${client()}
      <g class="pin-dest" transform="translate(3250 520)"><g class="pin-dest__in"><path d="M0 0 C -30 -32 -26 -68 0 -68 C 26 -68 30 -32 0 0Z" fill="${TERRA}" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-44" r="10" fill="${CREAM}"/></g></g>
      <g data-courier-wrap>${livreur()}</g>
      ${crabe(2000, 860)}
      <g transform="translate(860 860)"><path d="M0 0 l8 -22 l8 22 l-20 -14 h24z" fill="#f4b89f" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></g>
      <g transform="translate(2860 870)"><path d="M-14 0 C-14 -16 14 -16 14 0Z M-8 0 L-4 -12 M0 0 V-13 M8 0 L4 -12" fill="#fbe9d6" stroke="${INK}" stroke-width="2.6"/></g>
      <g class="stamp" data-stamp transform="translate(2990 470) rotate(-10)"><g class="stamp__in">
        <rect x="-118" y="-46" width="236" height="92" rx="12" fill="none" stroke="${TERRA}" stroke-width="7"/>
        <rect x="-106" y="-34" width="212" height="68" rx="6" fill="none" stroke="${TERRA}" stroke-width="2.6"/>
        <text x="0" y="22" text-anchor="middle" font-family="Londrina Solid, sans-serif" font-weight="900" font-size="62" fill="${TERRA}" letter-spacing="4">LIVRÉ !</text>
        <rect x="-118" y="-46" width="236" height="92" fill="url(#gr-l)" opacity=".9"/>
      </g></g>
    </g>
  </svg>`;
}

// Le livreur qui marche sur place (suivi de commande « en route »)
export function livreurSeul() {
  let points = '';
  for (let i = 0; i < 16; i++) points += `<circle cx="${-120 + i * 30}" cy="${8 + (i % 3) * 5}" r="${1.4 + (i % 2)}" fill="#c98f62"/>`;
  return `<svg class="walker" viewBox="-120 -236 240 262" aria-hidden="true">
    <rect x="-130" y="0" width="260" height="30" rx="14" fill="${SAND}"/>
    <g class="walker__ground">${points}${points.replace(/cx="(-?\d+)"/g, (m, x) => `cx="${Number(x) + 480}"`)}</g>
    ${livreur().replace('class="courier"', 'class="courier is-walking"')}
  </svg>`;
}

// Vignette du shop seul (accueil « Passe nous voir », page Le shop)
export function vignetteShop() {
  return `<svg viewBox="20 196 760 608" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration du coffee shop Ady, avec son auvent rayé, au bord de la plage">
    <defs><linearGradient id="vs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c6da"/><stop offset=".7" stop-color="#d6e9ea"/><stop offset="1" stop-color="#f7dcc0"/></linearGradient>
    <linearGradient id="vs-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aaabd"/><stop offset="1" stop-color="#2f8499"/></linearGradient></defs>
    <rect x="0" y="0" width="900" height="900" fill="url(#vs-sky)"/>
    ${soleil(660, 400, 92, 'vs-sun')}
    ${nuage(60, 250, 0.8, 'cloud--1')}${nuage(560, 230, 0.6, 'cloud--2')}
    <rect x="0" y="478" width="900" height="200" fill="url(#vs-sea)"/><rect x="0" y="478" width="900" height="200" fill="url(#gr-l)" opacity=".4"/>
    <path d="M0 480 H900" stroke="#e8f4f4" stroke-width="3" opacity=".7"/>
    ${voilier(740, 486)}
    <path d="M-20 628 C 300 612 600 640 920 620 V900 H-20Z" fill="${SAND}"/><path d="M-20 628 C 300 612 600 640 920 620 V900 H-20Z" fill="url(#gr-d)" opacity=".45"/>
    ${palmier(700, 660, 0.95)}
    ${shop(true)}
  </svg>`;
}

export function creerScene(conteneur, { mode = 'scroll', onEtape } = {}) {
  conteneur.innerHTML = construireSVG();
  const svgEl = conteneur.querySelector('svg');
  const far = svgEl.querySelector('[data-layer="far"]');
  const mid = svgEl.querySelector('[data-layer="mid"]');
  const sky = svgEl.querySelector('[data-sky]');
  const chemin = svgEl.querySelector('[data-path]');
  const wrap = svgEl.querySelector('[data-courier-wrap]');
  const courier = svgEl.querySelector('[data-courier]');
  const customer = svgEl.querySelector('[data-customer]');
  const steam = svgEl.querySelector('[data-shop-steam]');
  const bulles = { notif: svgEl.querySelector('[data-bubble="notif"]'), photo: svgEl.querySelector('[data-bubble="photo"]') };
  const stamp = svgEl.querySelector('[data-stamp]');
  const footprintsG = svgEl.querySelector('[data-footprints]');
  const longueur = chemin.getTotalLength();

  // empreintes de pas le long du chemin (révélées au fur et à mesure)
  const pas = [];
  let fp = '';
  for (let s = 40, i = 0; s < longueur - 30; s += 34, i++) {
    const p = chemin.getPointAtLength(s);
    const q = chemin.getPointAtLength(Math.min(longueur, s + 1));
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    const dy = i % 2 ? 7 : -7;
    pas.push(s);
    fp += `<ellipse class="fp" cx="${(p.x).toFixed(1)}" cy="${(p.y + dy).toFixed(1)}" rx="7" ry="3.4" transform="rotate(${ang.toFixed(1)} ${p.x.toFixed(1)} ${(p.y + dy).toFixed(1)})" fill="#c98f62" opacity="0"/>`;
  }
  footprintsG.innerHTML = fp;
  const fps = [...footprintsG.children];

  // cadrage : on coupe le haut du ciel en paysage pour rapprocher la caméra des personnages
  let vbW = 1600;
  let Y0 = 170;
  let VH = 730;
  let ancre = 0.55;
  let camMin = -460;
  const redimensionner = () => {
    const r = conteneur.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const portrait = r.width / r.height < 1;
    Y0 = portrait ? 90 : 170;
    VH = portrait ? 810 : 730;
    // en paysage, le panneau des étapes est à gauche : on garde l'action sur la droite
    ancre = portrait ? 0.45 : 0.56;
    camMin = portrait ? -60 : -470;
    vbW = Math.min(W, Math.max(380, (VH * r.width) / r.height));
    appliquer(progression, true);
  };

  let progression = 0;
  let marche = null;
  let etapeCourante = -1;

  function appliquer(p, force = false) {
    progression = p;
    // 0–0.12 commande · 0.12–0.24 préparation · 0.24–0.88 trajet · 0.88–1 livraison
    const t = Math.min(1, Math.max(0, (p - 0.22) / 0.66));
    const pt = chemin.getPointAtLength(t * longueur);
    const visible = p > 0.17;
    wrap.style.opacity = visible ? 1 : 0;
    wrap.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) scale(1.08)`);

    let cam = Math.min(W - vbW, Math.max(camMin, pt.x - vbW * ancre));
    // en portrait, la bulle « nouvelle commande » doit rester entière à l'écran
    if (ancre < 0.5 && p < 0.22) cam = Math.min(W - vbW, Math.max(cam, 752 - vbW));
    svgEl.setAttribute('viewBox', `${cam.toFixed(1)} ${Y0} ${vbW.toFixed(1)} ${VH}`);
    far.setAttribute('transform', `translate(${(cam * 0.82).toFixed(1)} 0)`);
    mid.setAttribute('transform', `translate(${(cam * 0.5).toFixed(1)} 0)`);
    sky.setAttribute('x', (cam - 4000).toFixed(0));

    const parcouru = t * longueur;
    fps.forEach((f, i) => { f.setAttribute('opacity', visible && pas[i] < parcouru - 30 ? 0.55 : 0); });

    bulles.notif.classList.toggle('is-on', p > 0.02 && p < 0.2);
    steam.classList.toggle('is-on', p > 0.1 && p < 0.3);
    bulles.photo.classList.toggle('is-on', p > 0.46 && p < 0.8);
    stamp.classList.toggle('is-on', p > 0.92);
    customer.classList.toggle('is-waving', p > 0.8);

    const etape = p < 0.12 ? 0 : p < 0.44 ? 1 : p < 0.86 ? 2 : 3;
    if (etape !== etapeCourante || force) {
      etapeCourante = etape;
      onEtape?.(etape);
    }
  }

  function signalerMarche() {
    courier.classList.add('is-walking');
    clearTimeout(marche);
    marche = setTimeout(() => courier.classList.remove('is-walking'), 180);
  }

  let raf = null;
  let enBoucle = false;
  function boucle() {
    let debut = null;
    const duree = 16000;
    const pause = 2600;
    const frame = (now) => {
      if (!enBoucle) return;
      if (debut === null) debut = now;
      const e = (now - debut) % (duree + pause);
      const p = Math.min(1, e / duree);
      appliquer(p);
      courier.classList.toggle('is-walking', p > 0.22 && p < 0.88);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(redimensionner);
  ro.observe(conteneur);
  redimensionner();

  return {
    set(p) {
      if (Math.abs(p - progression) > 0.0004 && p > 0.22 && p < 0.88) signalerMarche();
      appliquer(p);
    },
    jouer() {
      if (enBoucle || reduceMotion()) { if (reduceMotion()) appliquer(1, true); return; }
      enBoucle = true;
      boucle();
    },
    pause() {
      enBoucle = false;
      cancelAnimationFrame(raf);
    },
    get progression() { return progression; },
    mode,
  };
}
