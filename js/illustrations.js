// ─────────────────────────────────────────────────────────────
//  Illustrations des produits — style « sérigraphie / linogravure »
//  • aplats de couleur légèrement décalés du trait (repérage d'impression)
//  • ombres en trame de points (halftone) + grain d'encre
//  • gobelets en perspective, glaçons, condensation, vapeur
//  Les motifs (#ht, #htl, #gr-d, #gr-l) sont déclarés une fois par page (defsGlobales()).
//  Les animations sont dans css/style.css (section « Illustrations »).
// ─────────────────────────────────────────────────────────────

const INK = '#2a1810';
const TERRA = '#bf472c';
const TERRA_D = '#9e3a22';
const CREAM = '#fbe9d6';
const PAPER = '#fff7ec';
const SPRITE = 'assets/brand.svg';
const OFFSET = 'translate(2.2 1.8)';

let uid = 0;
const nid = (p) => `${p}${++uid}`;
const r1 = (n) => Math.round(n * 10) / 10;

export function defsGlobales() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    <pattern id="ht" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><circle cx="2.5" cy="2.5" r="1.15" fill="${INK}"/></pattern>
    <pattern id="ht-big" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><circle cx="4" cy="4" r="1.9" fill="${INK}"/></pattern>
    <pattern id="htl" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><circle cx="2.5" cy="2.5" r="1.1" fill="#fff"/></pattern>
    <pattern id="gr-d" width="160" height="160" patternUnits="userSpaceOnUse"><image href="assets/grain-dark.png" width="160" height="160"/></pattern>
    <pattern id="gr-l" width="160" height="160" patternUnits="userSpaceOnUse"><image href="assets/grain-light.png" width="160" height="160"/></pattern>
  </defs></svg>`;
}

function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function shade(hex, f) {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// Forme organique lissée (cookies, miettes…)
function blob(cx, cy, r, points, jitter, seed, bite) {
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    let rr = r * (1 - jitter / 2 + rand() * jitter);
    if (bite) {
      const d = Math.atan2(Math.sin(a - bite.angle), Math.cos(a - bite.angle));
      if (Math.abs(d) < bite.width) rr -= bite.depth * Math.cos((d / bite.width) * (Math.PI / 2));
    }
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
    if (i === 0) d += `M${r1(p1[0])} ${r1(p1[1])}`;
    d += `C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return `${d}Z`;
}

function svg(label, { defs = '', back = '', print = '', ink = '', top = '' }) {
  return `<svg class="ill" viewBox="0 0 200 240" role="img" aria-label="${label}">
    <defs>${defs}</defs>${back}
    <g class="ill__print" transform="${OFFSET}">${print}</g>
    <g class="ill__ink" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">${ink}</g>
    ${top}</svg>`;
}

const ombre = (cx = 100, cy = 228, rx = 62, ry = 7) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${INK}" opacity=".13"/>`;

function logo(x, y, w, color) {
  return `<svg x="${x}" y="${y}" width="${w}" height="${r1(w * (1208 / 1440))}" viewBox="0 0 1440 1208" style="color:${color}"><use href="${SPRITE}#logo"/></svg>`;
}

function steam(xs, y0, y1) {
  return xs.map((x, i) => `<path class="ill-steam" style="animation-delay:${(i * 0.8).toFixed(1)}s" d="M${x} ${y1} c-8 -7 8 -13 0 -20 c-8 -7 8 -12 0 -${y1 - y0 - 20}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`).join('');
}

function glacon(x, y, s, rot, opacity = 0.75) {
  const c = `${x + s / 2} ${y + s / 2}`;
  return {
    print: `<g class="ill-ice" style="animation-delay:${((x + y) % 7) * 0.31}s"><g transform="rotate(${rot} ${c})"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.24}" fill="#fff" fill-opacity="${opacity}"/><rect x="${x + 4}" y="${y + 4}" width="${s - 8}" height="${s - 8}" rx="${s * 0.18}" fill="#dff1f6" fill-opacity="${opacity * 0.6}"/></g></g>`,
    ink: `<g class="ill-ice" style="animation-delay:${((x + y) % 7) * 0.31}s"><g transform="rotate(${rot} ${c})"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.24}" stroke-width="3" opacity="${opacity < 0.6 ? 0.45 : 1}"/><path d="M${x + 6} ${y + 9} q2 -4 7 -4" stroke="#fff" stroke-width="3"/></g></g>`,
  };
}

function gouttes(seed, zone) {
  const rand = rng(seed);
  let s = '';
  for (let i = 0; i < 7; i++) {
    const x = zone.x + rand() * zone.w;
    const y = zone.y + rand() * zone.h;
    const r = 1.4 + rand() * 1.6;
    s += `<ellipse cx="${r1(x)}" cy="${r1(y + 0.8)}" rx="${r1(r)}" ry="${r1(r * 1.5)}" fill="${INK}" opacity=".18"/><ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r)}" ry="${r1(r * 1.45)}" fill="#fff" opacity=".9"/>`;
  }
  return s;
}

/* ── Gobelet transparent en perspective ───────────────── */
const xL = (y) => 42 + ((y - 58) * 17) / 164;
const xR = (y) => 200 - xL(y);
const CUP_BODY = 'M42 58 A58 10 0 0 0 158 58 L141 222 A41 7 0 0 1 59 222 Z';
const CUP_FRONT = 'M42 58 L59 222 A41 7 0 0 0 141 222 L158 58';
const liquide = (S) => `M${r1(xL(S))} ${S} A${r1(100 - xL(S))} ${r1(10 - ((S - 58) * 3) / 164)} 0 0 0 ${r1(xR(S))} ${S} L141 222 A41 7 0 0 1 59 222 Z`;

function paille(S, type = 'straw') {
  if (type === 'cinnamon') {
    return {
      print: `<path d="M118 ${S + 40} L138 22" stroke="#8a4b22" stroke-width="13" stroke-linecap="round"/><path d="M118 ${S + 40} L138 22" stroke="#b56a33" stroke-width="5" stroke-linecap="round"/>`,
      ink: `<path d="M138 22 l-5.5 -1 M138 22 l5.5 1.2" stroke-width="3"/><path d="M133.2 26 L120 ${S - 6} M143.4 27 L130 ${S - 4}" stroke-width="3.2"/>`,
    };
  }
  // axe de la paille : de (140, 6) jusqu'au fond (120, S+70) ; le trait s'arrête à la surface
  const xS = 140 - ((S - 6) * 20) / (S + 64);
  return {
    print: `<path d="M120 ${S + 70} L140 6" stroke="${TERRA}" stroke-width="10"/><path d="M120 ${S + 70} L140 6" stroke="${CREAM}" stroke-width="10" stroke-dasharray="6 9"/>`,
    ink: `<path d="M135 5.5 L${r1(xS - 5)} ${S - 1} M145 6.5 L${r1(xS + 5)} ${S}" stroke-width="3.2"/><path d="M135 5.5 L145 6.5" stroke-width="3.2"/>`,
  };
}

/* ── Recettes : couleurs des couches (du fond vers la surface), d'après le nom ── */
const LAIT = '#f1e3cd';
const CAFE = '#7a4426';
const MATCHA = '#8db255';

function recette(nom) {
  const n = nom.toLowerCase();
  if (/tonic/.test(n)) return { couches: [['#f4c33f', 0.3], ['#eef4e4', 0.36], [MATCHA, 0.34]], graines: true, fruit: '#f4c33f' };
  if (/mang/.test(n)) return { couches: [['#f6a23b', 0.32], [LAIT, 0.28], [MATCHA, 0.4]], fruit: '#f6a23b' };
  if (/goyave/.test(n)) return { couches: [['#ee8a8f', 0.32], [LAIT, 0.28], [MATCHA, 0.4]], fruit: '#ee8a8f' };
  if (/banan/.test(n)) return { couches: [['#f2d16b', 0.32], [LAIT, 0.28], [MATCHA, 0.4]] };
  if (/matcha/.test(n)) return { couches: [[LAIT, 0.45], [MATCHA, 0.55]], volute: '#b9d287' };
  if (/ube/.test(n)) return { couches: [[LAIT, 0.4], ['#9a78c6', 0.6]], volute: '#c4adde' };
  if (/gwozey/.test(n)) return { couches: [[/thé/.test(n) ? '#a8324a' : '#c73d52', 1]], fruit: '#e2475e', fleur: true };
  if (/maracudja/.test(n)) return { couches: [[/thé/.test(n) ? '#c98a2e' : '#f2b93b', 1]], graines: true, fruit: '#f4c33f' };
  if (/orange/.test(n)) return { couches: [['#f39a2e', 1]], fruit: '#f39a2e', sansGlace: true };
  if (/citronnade|citron/.test(n)) return { couches: [['#f3e7a6', 1]], fruit: '#e8d84a', bulles: true };
  if (/thé glacé/.test(n)) return { couches: [['#c9853a', 1]], fruit: '#e8d84a' };
  if (/tiramisu/.test(n)) return { couches: [[LAIT, 0.42], [CAFE, 0.34], ['#fff3e0', 0.24]], cacao: true };
  if (/cacahu/.test(n)) return { couches: [[LAIT, 0.45], ['#b57b45', 0.55]], volute: '#e0b98a' };
  if (/caramel/.test(n)) return { couches: [[LAIT, 0.5], [CAFE, 0.5]], filet: '#b8692a' };
  if (/chocolat/.test(n)) return { couches: [['#5e321e', 1]], volute: '#8a5638' };
  if (/dirty/.test(n)) return { couches: [[LAIT, 0.4], ['#c79a6b', 0.4], [CAFE, 0.2]] };
  if (/cha[iï]/.test(n)) return { couches: [[LAIT, 0.42], ['#c79a6b', 0.58]], cannelle: true };
  if (/americano|espresso/.test(n)) return { couches: [['#2e170d', 0.6], ['#4a2614', 0.4]] };
  if (/vanille/.test(n)) return { couches: [[LAIT, 0.5], [CAFE, 0.5]], volute: '#f4e1b8' };
  return { couches: [[LAIT, 0.5], [CAFE, 0.5]], volute: '#ead6bd' };
}

// Couvercle des boissons chaudes, selon la famille
function couvercle(nom) {
  const n = nom.toLowerCase();
  if (/matcha/.test(n)) return { lid: '#8db255', manchon: CREAM };
  if (/ube/.test(n)) return { lid: '#9a78c6', manchon: CREAM };
  if (/chocolat/.test(n)) return { lid: '#5e321e', manchon: TERRA };
  if (/cha[iï]/.test(n)) return { lid: '#c79a6b', manchon: TERRA };
  if (/thé|infusion/.test(n)) return { lid: '#f4c33f', manchon: TERRA, tag: true };
  if (/flat|cappuccino/.test(n)) return { lid: TERRA, manchon: CREAM };
  if (/latte|macchiato/.test(n)) return { lid: CREAM, manchon: TERRA };
  return { lid: INK, manchon: TERRA };
}

/* ── Gobelet transparent : couches qui ondulent, glaçons, garnitures ── */
function gobeletGlace(nom, label) {
  const r = recette(nom);
  const id = nid('g');
  const S = 88;
  const L = liquide(S);
  const surf = { rx: r1(100 - xL(S)), ry: r1(10 - ((S - 58) * 3) / 164) };
  const H = 222 - S;
  // couches empilées depuis le fond, avec une frontière ondulée
  let y = 222;
  let couches = '';
  r.couches.forEach(([c, k], i) => {
    const h = H * k;
    y -= h;
    const haut = i === r.couches.length - 1 ? S - 14 : y;
    couches += `<path d="M30 ${r1(haut + 3)} q12.5 -6 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 V${r1(y + h + 4)} H30Z" fill="${c}"/>`;
  });
  const top = r.couches[r.couches.length - 1][0];
  const fond = r.couches.find((_, i) => { let yy = 222; for (let j = 0; j <= i; j++) yy -= H * r.couches[j][1]; return yy < 175; })?.[0] || top;
  const logoColor = luminance(fond) > 0.6 ? TERRA : CREAM;
  const defs = `<clipPath id="${id}l"><path d="${L}"/></clipPath><clipPath id="${id}r"><rect x="122" y="0" width="80" height="240"/></clipPath><clipPath id="${id}s"><rect x="0" y="0" width="200" height="${S + 1}"/></clipPath>`;
  const p = paille(S, r.cannelle ? 'cinnamon' : 'straw');
  let liq = couches;
  if (r.volute) liq += `<g class="ill-swirl"><path d="M50 ${S + 54} C 70 ${S + 34} 92 ${S + 70} 116 ${S + 48} S 150 ${S + 38} 160 ${S + 56}" stroke="${r.volute}" stroke-width="7" fill="none" opacity=".85" stroke-linecap="round"/></g>`;
  if (r.filet) liq += `<path d="M54 ${S + 6} q10 26 2 52 q-6 26 8 64 M146 ${S + 4} q-10 30 -2 56 q6 26 -8 60" stroke="${r.filet}" stroke-width="5.5" fill="none" opacity=".9" stroke-linecap="round"/>`;
  if (r.graines) {
    const rand = rng(nom.length * 7 + 3);
    for (let i = 0; i < 18; i++) liq += `<ellipse cx="${r1(58 + rand() * 84)}" cy="${r1(S + 70 + rand() * 60)}" rx="2.6" ry="1.7" fill="${INK}" opacity=".85"/>`;
  }
  if (r.bulles) liq += [0, 1, 2, 3].map((i) => `<circle class="ill-bubble" style="animation-delay:${i * 0.6}s" cx="${70 + i * 16}" cy="${S + 110}" r="${2 + (i % 2)}" fill="#fff" opacity=".85"/>`).join('');
  if (r.fleur) liq += `<g opacity=".9" transform="translate(84 ${S + 70})"><path d="M0 -12 q8 -10 14 0 q10 6 0 14 q4 12 -10 10 q-10 8 -12 -4 q-12 -4 -2 -14 q-2 -12 10 -6z" fill="#e2475e"/><circle r="3.5" fill="#f4c33f"/></g>`;
  const ices = r.sansGlace ? [] : [glacon(80, S + 18, 26, 22, 0.38), glacon(108, S + 40, 24, -10, 0.34)];
  let print = `${p.print}<path d="${CUP_BODY}" fill="#fff" fill-opacity=".32"/>
    <g clip-path="url(#${id}l)">${liq}${ices.map((i) => i.print).join('')}
      <path d="${L}" fill="url(#ht)" opacity=".17" clip-path="url(#${id}r)"/>
      <path d="${L}" fill="url(#gr-d)" opacity=".55"/></g>
    <ellipse cx="100" cy="${S}" rx="${surf.rx}" ry="${surf.ry}" fill="${shade(top, 0.12)}"/><ellipse cx="86" cy="${S - 1.5}" rx="18" ry="2.6" fill="#fff" opacity=".35"/>
    ${logo(69, 150, 62, logoColor)}`;
  if (r.cacao) print += `<g fill="#5b3020">${[[66, S - 2], [84, S - 5], [104, S - 1], [122, S - 4], [94, S + 3], [134, S]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.2"/>`).join('')}</g>`;
  let ink = ices.map((i) => i.ink).join('') + `<g clip-path="url(#${id}s)">${p.ink}</g>`;
  if (!r.sansGlace) {
    const hautG = [glacon(62, S - 22, 30, -14, 0.8), glacon(100, S - 18, 28, 12, 0.8)];
    print += hautG.map((i) => i.print).join('');
    ink += hautG.map((i) => i.ink).join('');
  }
  ink += `<ellipse cx="100" cy="${S}" rx="${surf.rx}" ry="${surf.ry}" stroke-width="2.6" opacity=".55"/><ellipse cx="100" cy="58" rx="58" ry="10"/><path d="${CUP_FRONT}"/><path d="M63 214 A37 6 0 0 0 137 214" stroke-width="2.4" opacity=".35"/>`;
  let topL = `<path d="M53 78 L65 206" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/><path d="M60 82 L62.5 108" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>${gouttes(nom.length * 13 + 5, { x: 72, y: 110, w: 70, h: 90 })}`;
  if (r.fruit) {
    topL += `<g class="ill-float-soft" transform="rotate(-20 158 56)">
      <path d="M136 56 A22 22 0 0 1 180 56 Z" fill="${r.fruit}" stroke="${INK}" stroke-width="4" transform="translate(1.5 1.2)"/>
      <path d="M136 56 A22 22 0 0 1 180 56 Z" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M142 56 A16 16 0 0 1 174 56" fill="${shade(r.fruit, 0.45)}"/>
      ${r.graines ? `<g fill="${INK}"><circle cx="150" cy="50" r="1.8"/><circle cx="158" cy="46" r="1.8"/><circle cx="166" cy="51" r="1.8"/></g>` : `<path d="M158 56 V42 M158 56 L147 46 M158 56 L169 46" stroke="${shade(r.fruit, -0.2)}" stroke-width="2"/>`}</g>`;
  }
  return svg(label, { defs, back: ombre(100, 228, 56, 7), print, ink, top: topL });
}

/* ── Gobelet carton (boissons chaudes) ────────────────── */
const xLh = (y) => 52 + ((y - 74) * 12) / 148;

function gobeletChaud(nom, label) {
  const { lid, manchon: sleeve, tag } = couvercle(nom);
  const id = nid('h');
  const body = 'M52 74 L64 222 A36 6 0 0 0 136 222 L148 74 Z';
  const sl = (y1, y2) => `M${r1(xLh(y1))} ${y1} A${r1(100 - xLh(y1))} 6 0 0 0 ${r1(200 - xLh(y1))} ${y1} L${r1(200 - xLh(y2))} ${y2} A${r1(100 - xLh(y2))} 6 0 0 1 ${r1(xLh(y2))} ${y2} Z`;
  const defs = `<clipPath id="${id}b"><path d="${body}"/></clipPath><clipPath id="${id}r"><rect x="118" y="0" width="90" height="240"/></clipPath>`;
  const print = `<path d="${body}" fill="${PAPER}"/>
    <g clip-path="url(#${id}b)"><path d="${sl(118, 178)}" fill="${sleeve}"/>
      <rect x="40" y="60" width="130" height="170" fill="url(#ht)" opacity=".16" clip-path="url(#${id}r)"/>
      <rect x="40" y="60" width="130" height="170" fill="url(#gr-d)" opacity=".5"/></g>
    ${logo(80, 130, 40, luminance(sleeve) > 0.6 ? TERRA : CREAM)}
    <path d="M46 62 L154 62 L151 76 A51 7 0 0 1 49 76 Z" fill="${lid}"/>
    <path d="M62 62 C64 50 74 46 100 46 C126 46 136 50 138 62 Z" fill="${shade(lid, 0.12)}"/>
    <ellipse cx="100" cy="62" rx="54" ry="9" fill="${shade(lid, 0.06)}"/>
    <ellipse cx="118" cy="51.5" rx="9" ry="3.2" fill="${INK}" opacity=".75"/>
    ${tag ? `<path d="M140 70 Q150 100 146 120" stroke="${INK}" stroke-width="1.6" fill="none"/><rect x="136" y="118" width="20" height="24" rx="2" fill="#f4c33f"/>` : ''}`;
  const ink = `<path d="M52 76 L64 222 A36 6 0 0 0 136 222 L148 76"/><path d="${sl(118, 178)}" stroke-width="3.2"/>
    <path d="M123 82 L118 218" stroke-width="2" opacity=".3"/><path d="M46 62 L49 76 A51 7 0 0 0 151 76 L154 62"/><ellipse cx="100" cy="62" rx="54" ry="9"/>
    <path d="M62 60 C64 50 74 46 100 46 C126 46 136 50 138 60" stroke-width="3.4"/>${tag ? '<rect x="136" y="118" width="20" height="24" rx="2" stroke-width="2.6"/>' : ''}`;
  const top = `${steam([82, 100, 118], 0, 40)}<path d="M60 90 L70 210" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
  return svg(label, { defs, back: ombre(100, 228, 50, 7), print, ink, top });
}

function espresso(nom, label) {
  const id = nid('e');
  const double = /double/i.test(nom);
  const cup = 'M52 122 C52 168 70 190 100 190 C130 190 148 168 148 122 Z';
  const defs = `<clipPath id="${id}c"><path d="${cup}"/></clipPath><clipPath id="${id}r"><rect x="112" y="0" width="90" height="240"/></clipPath>`;
  const print = `<ellipse cx="100" cy="194" rx="80" ry="17" fill="${TERRA}"/><ellipse cx="100" cy="194" rx="80" ry="17" fill="url(#gr-d)" opacity=".5"/>
    <ellipse cx="100" cy="190" rx="50" ry="9" fill="${TERRA_D}" opacity=".45"/>
    <path d="M146 136 C 172 132 174 168 142 170" stroke="${PAPER}" stroke-width="7" fill="none"/><path d="${cup}" fill="${PAPER}"/>
    <g clip-path="url(#${id}c)"><rect x="40" y="110" width="120" height="90" fill="url(#ht)" opacity=".18" clip-path="url(#${id}r)"/><rect x="40" y="110" width="120" height="90" fill="url(#gr-d)" opacity=".5"/></g>
    <ellipse cx="100" cy="122" rx="48" ry="10" fill="${PAPER}"/><ellipse cx="100" cy="123.5" rx="41" ry="7.5" fill="#b8743f"/>
    <path class="ill-swirl" d="M74 123 C 84 118 96 128 108 122 S 124 120 128 124" stroke="#dca46c" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    ${logo(84, 146, 32, TERRA)}${double ? `<text x="100" y="212" text-anchor="middle" font-family="Big Shoulders Stencil, sans-serif" font-weight="800" font-size="16" fill="${CREAM}">×2</text>` : ''}`;
  const ink = `<ellipse cx="100" cy="194" rx="80" ry="17"/><path d="M146 136 C 172 132 174 168 142 170" stroke-width="13"/>
    <path d="M52 122 C52 168 70 190 100 190 C130 190 148 168 148 122"/><ellipse cx="100" cy="122" rx="48" ry="10"/><ellipse cx="100" cy="123.5" rx="41" ry="7.5" stroke-width="2.4" opacity=".55"/>`;
  const top = `<path d="M146 136 C 172 132 174 168 142 170" stroke="${PAPER}" stroke-width="5" fill="none"/>${steam([88, 110], 50, 104)}
    <path d="M62 136 C62 158 72 174 84 182" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
  return svg(label, { defs, back: ombre(100, 214, 70, 6), print, ink, top });
}

function affogato(nom, label) {
  const versement = /matcha/i.test(nom) ? MATCHA : '#6b3418';
  const print = `<path d="M50 120 L62 196 Q64 204 72 204 L128 204 Q136 204 138 196 L150 120 Z" fill="#fff" fill-opacity=".45"/>
    <path d="M56 150 L62 196 Q64 204 72 204 L128 204 Q136 204 138 196 L144 150 Q100 162 56 150Z" fill="${shade(versement, 0.15)}"/>
    <path d="M64 124 C60 92 84 76 100 78 C118 76 142 92 136 124 Q100 136 64 124Z" fill="#fff8ec"/>
    <path d="M64 124 C60 92 84 76 100 78 C118 76 142 92 136 124 Q100 136 64 124Z" fill="url(#ht)" opacity=".1"/>
    <path d="M100 80 C102 96 92 104 98 120 C100 132 92 140 96 150" stroke="${versement}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M72 102 c6 -8 14 -10 20 -6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const ink = `<path d="M50 120 L62 196 Q64 204 72 204 L128 204 Q136 204 138 196 L150 120"/><path d="M64 124 C60 92 84 76 100 78 C118 76 142 92 136 124" stroke-width="3.6"/>
    <path d="M70 32 L100 70" stroke-width="3"/><path d="M58 22 h32 l-4 14 h-24z" stroke-width="3"/>`;
  const top = `<path d="M58 22 h32 l-4 14 h-24z" fill="#fff6ea"/><path d="M84 36 L98 76" stroke="${versement}" stroke-width="5" stroke-linecap="round"/><path d="M58 22 h32 l-4 14 h-24z" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  return svg(label, { back: ombre(100, 214, 54, 6), print, ink, top });
}

/* ── Le salé ──────────────────────────────────────────── */
// Grain + trame d'ombre, limités au contour de la forme
function matiere(d, { trame = 118 } = {}) {
  const id = nid('m');
  return {
    defs: `<clipPath id="${id}"><path d="${d}"/></clipPath>`,
    calque: `<g clip-path="url(#${id})"><rect width="200" height="240" fill="url(#gr-d)" opacity=".5"/><rect x="${trame}" width="${200 - trame}" height="240" fill="url(#ht)" opacity=".15"/></g>`,
  };
}
function couche(d, fill) { return `<path d="${d}" fill="${fill}"/>`; }
function vague(x0, x1, y, amp, n) {
  const pas = (x1 - x0) / n;
  let d = `M${x0} ${y}`;
  for (let i = 0; i < n; i++) d += ` q${r1(pas / 2)} ${i % 2 ? amp : -amp} ${r1(pas)} 0`;
  return d;
}

function club(nom, label) {
  const pain = '#f3d6a2';
  const croute = '#c98e4e';
  const L = 38, R = 162;
  const m = matiere(`M${L} 202 V72 Q${L} 46 ${L + 16} 64 H${R - 16} Q${R} 46 ${R} 72 V202Z`);
  const tranche = (y, h, dome = 0) => `<path d="M${L} ${y + h} L${L} ${y + 8} Q${L} ${y - dome} ${L + 16} ${y} L${R - 16} ${y} Q${R} ${y - dome} ${R} ${y + 8} L${R} ${y + h}Z" fill="${croute}"/><path d="M${L + 6} ${y + h - 4} L${L + 6} ${y + 10} Q${L + 6} ${y + 4 - dome * 0.6} ${L + 18} ${y + 6} L${R - 18} ${y + 6} Q${R - 6} ${y + 4 - dome * 0.6} ${R - 6} ${y + 10} L${R - 6} ${y + h - 4}Z" fill="${pain}"/>`;
  const print = `${tranche(178, 22)}
    ${couche(`${vague(L - 6, R + 6, 172, 6, 12)} V182 H${L - 6}Z`, '#7fae4a')}
    ${couche(`M${L + 2} 158 H${R - 2} V172 H${L + 2}Z`, '#d8433a')}
    ${couche(`M${L} 140 Q100 132 ${R} 140 V160 H${L}Z`, '#e8b98a')}
    ${tranche(116, 26)}
    ${couche(`${vague(L - 4, R + 4, 110, 5, 10)} V120 H${L - 4}Z`, '#b5452f')}
    ${couche(`${vague(L - 8, R + 8, 100, 6, 12)} V112 H${L - 8}Z`, '#8fbf55')}
    ${tranche(64, 38, 18)}
    ${m.calque}`;
  const ink = `<path d="M${L} 200 V186 Q${L} 178 ${L + 16} 178 H${R - 16} Q${R} 178 ${R} 186 V200Z"/>
    <path d="M${L} 142 V124 Q${L} 116 ${L + 16} 116 H${R - 16} Q${R} 116 ${R} 124 V142Z"/>
    <path d="M${L} 102 V72 Q${L} 46 ${L + 16} 64 H${R - 16} Q${R} 46 ${R} 72 V102Z"/>
    <path d="${vague(L - 6, R + 6, 172, 6, 12)}" stroke-width="2.6"/><path d="${vague(L - 8, R + 8, 100, 6, 12)}" stroke-width="2.6"/>
    <path d="M100 20 V150" stroke-width="3"/>`;
  const top = `<path d="M100 20 V150" stroke="#e9c48a" stroke-width="3"/><g class="ill-float-soft"><path d="M100 20 L128 27 L100 34Z" fill="${TERRA}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/></g>`;
  return svg(label, { defs: m.defs, back: ombre(100, 212, 70, 7), print, ink, top });
}

function petitPain(nom, label) {
  const homard = /lobster|homard|langouste/i.test(nom);
  const pain = '#e7a95a';
  const m = matiere('M24 148 C20 120 40 108 60 110 L140 110 C160 108 180 120 176 148 C172 176 150 184 100 184 C50 184 28 176 24 148Z');
  const print = `<path d="M24 148 C20 120 40 108 60 110 L140 110 C160 108 180 120 176 148 C172 176 150 184 100 184 C50 184 28 176 24 148Z" fill="${pain}"/>
    ${homard
    ? `<g>${[[50, 104], [70, 98], [92, 102], [114, 96], [136, 102], [154, 108]].map(([x, y], i) => `<path d="M${x - 12} ${y + 10} q2 -18 14 -16 q12 2 10 18z" fill="${i % 2 ? '#f08a6b' : '#f6b28c'}"/>`).join('')}
       <g fill="#9fc657">${[[60, 112], [100, 110], [140, 112]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
       <g fill="#4f7a2a"><circle cx="80" cy="100" r="2"/><circle cx="126" cy="98" r="2"/></g>`
    : `<path d="M16 120 C14 104 30 98 44 100 L156 100 C170 98 186 104 184 120 C182 132 170 136 156 134 L44 134 C30 136 18 132 16 120Z" fill="#b5523a"/>
       <path d="M36 112 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#f4c33f" stroke-width="5" fill="none" stroke-linecap="round"/>
       <g fill="#7fae4a">${[[58, 106], [96, 104], [134, 106]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="6" rx="2"/>`).join('')}</g>
       <g fill="#a8642e">${[[46, 98], [72, 96], [110, 95], [146, 97], [88, 99]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`}
    <path d="M30 140 C40 126 160 126 170 140 C166 160 150 168 100 168 C50 168 34 160 30 140Z" fill="${shade(pain, 0.18)}"/>
    ${m.calque}`;
  const ink = `<path d="M24 148 C20 120 40 108 60 110 L140 110 C160 108 180 120 176 148 C172 176 150 184 100 184 C50 184 28 176 24 148Z"/>
    ${homard ? '' : '<path d="M16 120 C14 104 30 98 44 100 L156 100 C170 98 186 104 184 120 C182 132 170 136 156 134 L44 134 C30 136 18 132 16 120Z" stroke-width="3.4"/>'}
    <path d="M48 150 q52 10 104 0" stroke-width="2.4" opacity=".4"/>`;
  return svg(label, { defs: m.defs, back: ombre(100, 196, 80, 8), print, ink });
}

function wrap(nom, label) {
  const n = nom.toLowerCase();
  const garniture = /veggie/.test(n) ? ['#7b3a6e', '#f39a2e', '#8fbf55', '#fff8ec'] : /burrito/.test(n) ? ['#f4d35e', '#e9c28a', '#b5452f', '#f39a2e'] : ['#8fbf55', '#e8b98a', '#d8433a', '#fff8ec'];
  const tortilla = '#f2d9a6';
  const moitie = (dx, rot) => `<g transform="translate(${dx} 0) rotate(${rot} 100 140)">
      <path d="M58 70 L142 70 L150 200 L50 200Z" fill="${tortilla}"/>
      <ellipse cx="100" cy="70" rx="42" ry="20" fill="${shade(tortilla, -0.08)}"/>
      ${garniture.map((c, i) => `<ellipse cx="${88 + (i % 2) * 22}" cy="${64 + (i > 1 ? 8 : -2)}" rx="${16 - i * 2}" ry="8" fill="${c}"/>`).join('')}
      <path d="M58 70 L142 70 L150 200 L50 200Z" fill="url(#gr-d)" opacity=".45"/>
      <path d="M110 80 L118 196" stroke="#d9b780" stroke-width="3"/>
    </g>`;
  const inkM = (dx, rot) => `<g transform="translate(${dx} 0) rotate(${rot} 100 140)"><path d="M58 70 L50 200 L150 200 L142 70"/><ellipse cx="100" cy="70" rx="42" ry="20"/></g>`;
  const print = `${moitie(-26, -10)}`;
  return svg(label, {
    back: `${ombre(100, 212, 76, 7)}<g transform="${OFFSET}">${moitie(30, 12)}</g><g fill="none" stroke="${INK}" stroke-width="4.2" stroke-linejoin="round">${inkM(30, 12)}</g>`,
    print,
    ink: inkM(-26, -10),
  });
}

function bagel(nom, label) {
  const poisson = /fish|saumon|thon|marlin/i.test(nom);
  const croute = '#c98545';
  const m = matiere('M24 172 C22 152 50 146 100 146 C150 146 178 152 176 172 C174 188 150 194 100 194 C50 194 26 188 24 172Z');
  const m2 = matiere('M24 120 C22 92 52 76 100 76 C148 76 178 92 176 120 C170 128 140 132 100 132 C60 132 30 128 24 120Z');
  const print = `<path d="M24 172 C22 152 50 146 100 146 C150 146 178 152 176 172 C174 188 150 194 100 194 C50 194 26 188 24 172Z" fill="${croute}"/>
    ${poisson
    ? `<path d="${vague(22, 178, 140, 6, 10)} V152 H22Z" fill="#f08a6b"/><path d="${vague(28, 172, 132, 5, 10)} V142 H28Z" fill="#fff8ec"/><path d="${vague(30, 170, 124, 5, 8)} V134 H30Z" fill="#f4d35e"/><path d="M60 122 q20 -8 40 0 t40 0 v8 h-80z" fill="#9fc657"/>`
    : `<path d="${vague(22, 178, 140, 6, 10)} V152 H22Z" fill="#b5452f"/><path d="M26 130 H174 L168 144 H32Z" fill="#f4b832"/><path d="${vague(30, 170, 124, 5, 8)} V134 H30Z" fill="#f4d35e"/>`}
    <path d="M24 120 C22 92 52 76 100 76 C148 76 178 92 176 120 C170 128 140 132 100 132 C60 132 30 128 24 120Z" fill="${croute}"/>
    <path d="M40 104 C50 90 150 90 160 104" fill="${shade(croute, 0.25)}" opacity=".7"/>
    <g fill="#fff4dc">${[[60, 96], [80, 88], [104, 86], [128, 90], [146, 98], [92, 100], [118, 102]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.8" transform="rotate(${x % 40} ${x} ${y})"/>`).join('')}</g>
    ${m.calque}${m2.calque}`;
  const ink = `<path d="M24 172 C22 152 50 146 100 146 C150 146 178 152 176 172 C174 188 150 194 100 194 C50 194 26 188 24 172Z"/>
    <path d="M24 120 C22 92 52 76 100 76 C148 76 178 92 176 120 C170 128 140 132 100 132 C60 132 30 128 24 120Z"/>`;
  return svg(label, { defs: m.defs + m2.defs, back: ombre(100, 204, 80, 8), print, ink });
}

function bowl(nom, label) {
  const id = nid('w');
  const b = 'M22 116 C24 180 58 206 100 206 C142 206 176 180 178 116 Z';
  const defs = `<clipPath id="${id}b"><path d="${b}"/></clipPath><clipPath id="${id}t"><ellipse cx="100" cy="116" rx="72" ry="17"/></clipPath>`;
  const print = `<path d="${b}" fill="${CREAM}"/>
    <g clip-path="url(#${id}b)"><path d="M20 150 Q100 176 180 150 L180 162 Q100 188 20 162 Z" fill="${TERRA}"/><rect x="112" y="100" width="90" height="120" fill="url(#ht)" opacity=".18"/><rect width="200" height="240" fill="url(#gr-d)" opacity=".55"/></g>
    <ellipse cx="100" cy="116" rx="72" ry="17" fill="#6f9e3c"/>
    <g clip-path="url(#${id}t)">
      ${[[44, 112], [70, 104], [100, 102], [130, 104], [156, 112], [84, 120], [118, 122]].map(([x, y], i) => `<path d="M${x - 16} ${y + 6} q8 -18 18 -14 q10 -6 14 8 q-14 10 -32 6z" fill="${i % 2 ? '#8fbf55' : '#a9d06a'}"/>`).join('')}
      <g fill="#e8b98a">${[[64, 110], [118, 108], [94, 118]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="9" rx="3" transform="rotate(-8 ${x} ${y})"/>`).join('')}</g>
      <g fill="#d9a35c">${[[82, 104], [136, 112], [54, 120]].map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="9" rx="2"/>`).join('')}</g>
      <g fill="#d8433a"><circle cx="110" cy="100" r="5"/><circle cx="72" cy="122" r="4.5"/></g>
      <g fill="#fff8ec">${[[100, 112], [126, 118], [60, 106]].map(([x, y]) => `<path d="M${x} ${y} l9 -3 1 3 -9 3z"/>`).join('')}</g>
    </g>`;
  const ink = `<path d="M22 116 C24 180 58 206 100 206 C142 206 176 180 178 116"/><ellipse cx="100" cy="116" rx="78" ry="21"/><path d="M70 206 Q100 214 130 206" stroke-width="3.4"/>`;
  return svg(label, { defs, back: ombre(100, 214, 62, 7), print, ink, top: `<path d="M34 128 C36 156 46 172 60 184" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>` });
}

function frites(nom, label) {
  const gourmandes = /gourmand|cheddar/i.test(nom);
  const rand = rng(gourmandes ? 9 : 4);
  let batons = '';
  for (let i = 0; i < 11; i++) {
    const x = 58 + i * 8.5 + rand() * 4;
    const h = 60 + rand() * 40;
    const a = -12 + rand() * 24;
    batons += `<rect x="${r1(x)}" y="${r1(120 - h)}" width="11" height="${r1(h + 30)}" rx="3" fill="${rand() > 0.5 ? '#f4c55a' : '#eab14a'}" transform="rotate(${r1(a)} ${r1(x + 5)} 140)"/>`;
  }
  const print = `${batons}
    ${gourmandes ? `<path d="M56 96 q14 12 26 0 q12 14 24 0 q12 12 24 0 q10 10 18 0 v20 h-92z" fill="#f4b832"/><g fill="#a8642e">${[[66, 92], [90, 88], [112, 90], [134, 94]].map(([x, y]) => `<path d="M${x} ${y} q6 -6 12 0" stroke="#8a4b22" stroke-width="3" fill="none"/>`).join('')}</g>` : ''}
    <path d="M44 110 L156 110 L142 206 Q140 212 132 212 L68 212 Q60 212 58 206Z" fill="${TERRA}"/>
    <path d="M60 110 L66 212 M84 110 L86 212 M116 110 L114 212 M140 110 L134 212" stroke="${CREAM}" stroke-width="9"/>
    <rect x="40" y="100" width="120" height="120" fill="url(#gr-d)" opacity=".45"/>
    ${logo(76, 150, 48, CREAM)}`;
  const ink = `<path d="M44 110 L156 110 L142 206 Q140 212 132 212 L68 212 Q60 212 58 206Z"/><path d="M44 110 Q100 126 156 110" stroke-width="3"/>`;
  return svg(label, { back: ombre(100, 218, 54, 7), print: `<g class="ill-float-soft">${print}</g>`, ink: `<g class="ill-float-soft">${ink}</g>` });
}

function plat(nom, label) {
  const n = nom.toLowerCase();
  if (/club|sandwich/.test(n)) return club(nom, label);
  if (/hot dog|roll|homard|langouste/.test(n)) return petitPain(nom, label);
  if (/wrap|burrito/.test(n)) return wrap(nom, label);
  if (/bagel/.test(n)) return bagel(nom, label);
  if (/frite/.test(n)) return frites(nom, label);
  return bowl(nom, label);
}

/* ── Point d'entrée ───────────────────────────────────── */
// p = produit (data.js) ; options.glace force la version glacée (fiche produit)
export function illustration(p, { glace } = {}) {
  const nom = p.nom || '';
  const label = nom.replace(/[&<>"']/g, '');
  if (p.kind === 'merch' && p.image) return `<img class="ill ill--photo" src="${p.image.replace(/["<>\s]/g, '')}" alt="" loading="lazy">`;
  if (p.kind === 'food') return plat(nom, label);
  if (/affogato/i.test(nom)) return affogato(nom, label);
  const froid = glace ?? (p.glace || /^(iced|.*tonic|citronnade|thé glacé|jus)/i.test(nom));
  if (froid) return gobeletGlace(nom, label);
  if (/espresso/i.test(nom)) return espresso(nom, label);
  return gobeletChaud(nom, label);
}
