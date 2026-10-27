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

function gobeletGlace(v, label) {
  const id = nid('g');
  const dome = v.style === 'frappe';
  const S = dome ? 66 : 90;
  const L = liquide(S);
  const surf = { rx: r1(100 - xL(S)), ry: r1(10 - ((S - 58) * 3) / 164) };
  const fondClair = luminance(v.bas) > 0.6;
  const logoColor = v.logo || (fondClair ? TERRA : CREAM);
  let defs = `<clipPath id="${id}l"><path d="${L}"/></clipPath><clipPath id="${id}r"><rect x="122" y="0" width="80" height="240"/></clipPath><clipPath id="${id}s"><rect x="0" y="0" width="200" height="${S + 1}"/></clipPath>
    <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.haut}"/><stop offset=".38" stop-color="${v.haut}"/><stop offset=".72" stop-color="${v.bas}"/><stop offset="1" stop-color="${v.bas}"/></linearGradient>`;
  let print = '';
  let ink = '';
  let top = '';

  // paille (derrière la face avant)
  const p = paille(S, v.paille);
  print += p.print;

  // teinte du plastique
  print += `<path d="${CUP_BODY}" fill="#fff" fill-opacity=".32"/>`;

  // liquide
  let liq = '';
  if (v.style === 'layer') {
    // deux couches nettes (matcha sur lait) + coulures
    const B = S + 58;
    liq += `<path d="${L}" fill="${v.bas}"/>
      <path d="M30 ${S - 14} H170 V${B} q-10 7 -20 0 t-20 0 t-20 0 t-20 0 t-20 0 t-20 0 t-20 0 V${S - 14}Z" fill="${v.haut}"/>
      <path d="M70 ${B} q-3 18 2 34 M98 ${B + 2} q4 22 -2 44 M128 ${B} q-2 14 3 26" stroke="${v.haut}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".85"/>
      <g fill="${shade(v.haut, -0.25)}" opacity=".6"><circle cx="80" cy="${S + 22}" r="2"/><circle cx="112" cy="${S + 34}" r="1.6"/><circle cx="96" cy="${S + 14}" r="1.4"/><circle cx="130" cy="${S + 24}" r="1.8"/></g>`;
  } else if (v.style === 'latte') {
    liq += `<path d="${L}" fill="url(#${id}d)"/>
      <g class="ill-swirl"><path d="M50 ${S + 46} C 70 ${S + 26} 92 ${S + 62} 116 ${S + 40} S 150 ${S + 30} 160 ${S + 48}" stroke="${v.bas}" stroke-width="8" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="M58 ${S + 74} C 80 ${S + 58} 104 ${S + 86} 146 ${S + 66}" stroke="${v.bas}" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
      <path d="M70 ${S + 22} C 86 ${S + 12} 100 ${S + 30} 124 ${S + 18}" stroke="${shade(v.haut, 0.25)}" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/></g>`;
  } else if (v.style === 'smoothie') {
    liq += `<path d="${L}" fill="url(#${id}d)"/><path d="${L}" fill="url(#htl)" opacity=".25"/>`;
    const rand = rng(31);
    for (let i = 0; i < 26; i++) liq += `<ellipse cx="${r1(56 + rand() * 88)}" cy="${r1(S + 8 + rand() * 120)}" rx="1.8" ry="1.2" fill="${INK}" opacity=".75"/>`;
  } else {
    liq += `<path d="${L}" fill="url(#${id}d)"/>`;
  }
  if (v.style === 'limonade') {
    liq += `<g opacity=".95"><circle cx="78" cy="${S + 64}" r="17" fill="#cfe27a"/><circle cx="78" cy="${S + 64}" r="12.5" fill="#e9f3b5"/><path d="M78 ${S + 52} V${S + 76} M66 ${S + 64} H90 M69.5 ${S + 55.5} l17 17 M86.5 ${S + 55.5} l-17 17" stroke="#b7cf55" stroke-width="2.2"/>
      <path d="M112 ${S + 92} q14 -16 28 -6 q-12 16 -28 6z" fill="#5f9a3a"/><path d="M104 ${S + 40} q10 -14 24 -8 q-10 14 -24 8z" fill="#6fa944"/></g>`;
    top += [0, 1, 2, 3].map((i) => `<circle class="ill-bubble" style="animation-delay:${i * 0.6}s" cx="${70 + i * 16}" cy="${S + 110}" r="${2 + (i % 2)}" fill="#fff" opacity=".8"/>`).join('');
  }
  if (v.filet) liq += `<path d="M54 ${S + 6} q10 26 2 52 q-6 26 8 64 M146 ${S + 4} q-10 30 -2 56 q6 26 -8 60 M100 ${S + 2} q6 20 -2 40" stroke="${v.filet}" stroke-width="5.5" fill="none" opacity=".9" stroke-linecap="round"/>`;

  // glaçons immergés
  const ices = [];
  if (v.glace !== false) {
    ices.push(glacon(80, S + 18, 26, 22, 0.38), glacon(108, S + 40, 24, -10, 0.34));
  }
  print += `<g clip-path="url(#${id}l)">${liq}${ices.map((i) => i.print).join('')}
    <path d="${L}" fill="url(#ht)" opacity=".17" clip-path="url(#${id}r)"/>
    <path d="${L}" fill="url(#gr-d)" opacity=".55"/></g>`;
  // surface
  print += `<ellipse cx="100" cy="${S}" rx="${surf.rx}" ry="${surf.ry}" fill="${shade(v.haut, 0.12)}"/><ellipse cx="86" cy="${S - 1.5}" rx="18" ry="2.6" fill="#fff" opacity=".35"/>`;
  // logo imprimé sur le gobelet
  print += logo(69, 150, 62, logoColor);

  ink += ices.map((i) => i.ink).join('');
  ink += `<g clip-path="url(#${id}s)">${p.ink}</g>`;

  // glaçons qui dépassent
  if (v.glace !== false && !dome) {
    const hautG = [glacon(62, S - 22, 30, -14, 0.8), glacon(100, S - 18, 28, 12, 0.8)];
    print += hautG.map((i) => i.print).join('');
    ink += hautG.map((i) => i.ink).join('');
  }

  ink += `<ellipse cx="100" cy="${S}" rx="${surf.rx}" ry="${surf.ry}" stroke-width="2.6" opacity=".55"/>`;
  ink += `<ellipse cx="100" cy="58" rx="58" ry="10"/><path d="${CUP_FRONT}"/><path d="M63 214 A37 6 0 0 0 137 214" stroke-width="2.4" opacity=".35"/>`;

  if (dome) {
    defs += `<clipPath id="${id}dm"><path d="M40 60 Q44 8 100 6 Q156 8 160 60 Z"/></clipPath>`;
    print += `<path d="M40 60 Q44 8 100 6 Q156 8 160 60 Z" fill="#fff" fill-opacity=".35"/>
      <g clip-path="url(#${id}dm)"><g class="ill-float-soft"><path d="M50 62 C46 44 62 38 72 42 C70 26 88 20 98 28 C104 14 126 18 126 32 C142 30 152 44 146 62 Z" fill="#fffaf2"/>
      <path d="M50 62 C46 44 62 38 72 42 C70 26 88 20 98 28 C104 14 126 18 126 32 C142 30 152 44 146 62 Z" fill="url(#ht)" opacity=".1"/>
      <path d="M58 48 q8 7 16 0 t16 0 t16 0 t16 0 t14 2" stroke="${v.filet || TERRA}" stroke-width="5" fill="none" stroke-linecap="round"/></g></g>`;
    ink += `<path d="M40 60 Q44 8 100 6 Q156 8 160 60"/><path d="M58 48 C60 40 70 38 76 42 M96 30 C100 24 110 22 118 28" stroke-width="2.6" opacity=".5"/>`;
    ink += `<path d="M135 2.5 L129 30 M145 3.5 L139 30 M135 2.5 L145 3.5" stroke-width="3.2"/>`;
    print += `<path d="M134 30 L140 3" stroke="${TERRA}" stroke-width="10"/><path d="M134 30 L140 3" stroke="${CREAM}" stroke-width="10" stroke-dasharray="6 9"/>`;
  }

  // reflets + gouttes de condensation
  top += `<path d="M53 78 L65 206" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/><path d="M60 82 L62.5 108" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".9"/>`;
  top += gouttes(String(label).length * 13 + 5, { x: 72, y: 110, w: 70, h: 90 });

  if (v.fruit) {
    top += `<g class="ill-float-soft" transform="rotate(-20 158 56)">
      <path d="M136 56 A22 22 0 0 1 180 56 Z" fill="${v.fruit}" stroke="${INK}" stroke-width="4" transform="translate(1.5 1.2)"/>
      <path d="M136 56 A22 22 0 0 1 180 56 Z" fill="none" stroke="${INK}" stroke-width="4"/>
      <path d="M142 56 A16 16 0 0 1 174 56" fill="${shade(v.fruit, 0.45)}"/>
      <path d="M158 56 V42 M158 56 L147 46 M158 56 L169 46" stroke="${shade(v.fruit, -0.2)}" stroke-width="2"/></g>`;
  }

  return svg(label, { defs, back: ombre(100, 228, 56, 7), print, ink, top });
}

/* ── Gobelet carton (boissons chaudes) ────────────────── */
const xLh = (y) => 52 + ((y - 74) * 12) / 148;

function gobeletChaud(v, label) {
  const id = nid('h');
  const lid = v.couvercle || TERRA;
  const sleeve = v.manchon || TERRA;
  const body = 'M52 74 L64 222 A36 6 0 0 0 136 222 L148 74 Z';
  const sl = (y1, y2) => `M${r1(xLh(y1))} ${y1} A${r1(100 - xLh(y1))} 6 0 0 0 ${r1(200 - xLh(y1))} ${y1} L${r1(200 - xLh(y2))} ${y2} A${r1(100 - xLh(y2))} 6 0 0 1 ${r1(xLh(y2))} ${y2} Z`;
  const defs = `<clipPath id="${id}b"><path d="${body}"/></clipPath><clipPath id="${id}r"><rect x="118" y="0" width="90" height="240"/></clipPath>`;
  const print = `
    <path d="${body}" fill="${PAPER}"/>
    <g clip-path="url(#${id}b)"><path d="${sl(118, 178)}" fill="${sleeve}"/>
      <rect x="40" y="60" width="130" height="170" fill="url(#ht)" opacity=".16" clip-path="url(#${id}r)"/>
      <rect x="40" y="60" width="130" height="170" fill="url(#gr-d)" opacity=".5"/></g>
    ${logo(80, 130, 40, luminance(sleeve) > 0.6 ? TERRA : CREAM)}
    <path d="M46 62 L154 62 L151 76 A51 7 0 0 1 49 76 Z" fill="${lid}"/>
    <path d="M62 62 C64 50 74 46 100 46 C126 46 136 50 138 62 Z" fill="${shade(lid, 0.12)}"/>
    <ellipse cx="100" cy="62" rx="54" ry="9" fill="${shade(lid, 0.06)}"/>
    <path d="M62 62 C64 50 74 46 100 46 C126 46 136 50 138 62 Z" fill="url(#gr-d)" opacity=".5"/>
    <ellipse cx="118" cy="51.5" rx="9" ry="3.2" fill="${INK}" opacity=".75"/>`;
  const ink = `<path d="M52 76 L64 222 A36 6 0 0 0 136 222 L148 76"/>
    <path d="${sl(118, 178)}" stroke-width="3.2"/>
    <path d="M123 82 L118 218" stroke-width="2" opacity=".3"/>
    <path d="M46 62 L49 76 A51 7 0 0 0 151 76 L154 62"/><ellipse cx="100" cy="62" rx="54" ry="9"/>
    <path d="M62 60 C64 50 74 46 100 46 C126 46 136 50 138 60" stroke-width="3.4"/>`;
  const top = `${steam([82, 100, 118], 0, 40)}
    <path d="M60 90 L70 210" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
    <path d="M58 66 L70 66" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  return svg(label, { defs, back: ombre(100, 228, 50, 7), print, ink, top });
}

function espresso(v, label) {
  const id = nid('e');
  const cup = 'M52 122 C52 168 70 190 100 190 C130 190 148 168 148 122 Z';
  const defs = `<clipPath id="${id}c"><path d="${cup}"/></clipPath><clipPath id="${id}r"><rect x="112" y="0" width="90" height="240"/></clipPath>`;
  const print = `
    <ellipse cx="100" cy="194" rx="80" ry="17" fill="${TERRA}"/>
    <ellipse cx="100" cy="194" rx="80" ry="17" fill="url(#gr-d)" opacity=".5"/>
    <ellipse cx="100" cy="190" rx="50" ry="9" fill="${TERRA_D}" opacity=".45"/>
    <path d="M146 136 C 172 132 174 168 142 170" stroke="${PAPER}" stroke-width="7" fill="none"/>
    <path d="${cup}" fill="${PAPER}"/>
    <g clip-path="url(#${id}c)"><rect x="40" y="110" width="120" height="90" fill="url(#ht)" opacity=".18" clip-path="url(#${id}r)"/><rect x="40" y="110" width="120" height="90" fill="url(#gr-d)" opacity=".5"/></g>
    <ellipse cx="100" cy="122" rx="48" ry="10" fill="${PAPER}"/>
    <ellipse cx="100" cy="123.5" rx="41" ry="7.5" fill="#b8743f"/>
    <path class="ill-swirl" d="M74 123 C 84 118 96 128 108 122 S 124 120 128 124" stroke="#dca46c" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <g fill="#e2b07a"><circle cx="118" cy="126" r="1.6"/><circle cx="84" cy="121" r="1.2"/><circle cx="96" cy="127" r="1.1"/></g>
    ${logo(84, 146, 32, TERRA)}`;
  const ink = `<ellipse cx="100" cy="194" rx="80" ry="17"/><path d="M50 196 A50 9 0 0 0 150 196" stroke-width="2.4" opacity=".4"/>
    <path d="M146 136 C 172 132 174 168 142 170" stroke-width="13" opacity="1"/>
    <path d="M52 122 C52 168 70 190 100 190 C130 190 148 168 148 122"/><ellipse cx="100" cy="122" rx="48" ry="10"/>
    <ellipse cx="100" cy="123.5" rx="41" ry="7.5" stroke-width="2.4" opacity=".55"/>`;
  const top = `<path d="M146 136 C 172 132 174 168 142 170" stroke="${PAPER}" stroke-width="5" fill="none"/>
    ${steam([88, 110], 50, 104)}
    <path d="M62 136 C62 158 72 174 84 182" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`;
  return svg(label, { defs, back: ombre(100, 214, 70, 6), print, ink, top });
}

function canette(v, label) {
  const ice = [glacon(30, 186, 28, -18, 0.85), glacon(144, 192, 24, 14, 0.85)];
  const print = `<g class="ill-float-soft"><svg x="24" y="6" width="152" height="200" viewBox="0 0 680 800" style="--st-bg:${PAPER};--st-ink:${TERRA}"><use href="${SPRITE}#st-can"/></svg></g>${ice.map((i) => i.print).join('')}`;
  const ink = ice.map((i) => i.ink).join('');
  const top = `${gouttes(77, { x: 84, y: 70, w: 50, h: 90 })}<g class="ill-sparkle" fill="${TERRA}"><path d="M172 46 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><path style="animation-delay:.9s" d="M28 98 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/></g>`;
  return svg(label, { back: ombre(100, 224, 64, 7), print, ink, top });
}

/* ── Douceurs ─────────────────────────────────────────── */
function cookie(v, label) {
  const id = nid('k');
  const back = blob(118, 108, 62, 16, 0.12, 19, null);
  const front = blob(94, 138, 70, 18, 0.11, 7, { angle: -0.75, width: 0.5, depth: 20 });
  const rand = rng(11);
  let chips = '';
  [[66, 112], [110, 104], [88, 140], [128, 140], [64, 160], [104, 172], [140, 116], [80, 186], [124, 182], [96, 118]].forEach(([x, y]) => {
    chips += `<path d="${blob(x, y, 5.5 + rand() * 4, 6, 0.45, x * y, null)}" fill="#3e1f12"/>`;
  });
  const defs = `<clipPath id="${id}f"><path d="${front}"/></clipPath><clipPath id="${id}b"><path d="${back}"/></clipPath>`;
  const fond = `${ombre(100, 218, 70, 8)}<g transform="${OFFSET}"><path d="${back}" fill="#c98b4f"/><g clip-path="url(#${id}b)"><rect width="200" height="240" fill="url(#ht)" opacity=".22"/><rect width="200" height="240" fill="url(#gr-d)" opacity=".5"/></g></g>
    <path d="${back}" fill="none" stroke="${INK}" stroke-width="3.6"/>`;
  const print = `
    <path d="${front}" fill="#dca464"/>
    <g clip-path="url(#${id}f)">
      <path d="${blob(94, 138, 56, 16, 0.16, 3, null)}" fill="#e8b979" opacity=".7"/>
      ${chips}
      <circle cx="130" cy="176" r="70" fill="url(#ht)" opacity=".22"/>
      <rect width="200" height="240" fill="url(#gr-d)" opacity=".6"/>
    </g>`;
  const ink = `<path d="${front}"/>
    <path d="M60 128 q14 -6 22 4 M112 158 q10 -10 22 -4 M84 166 q4 8 14 8" stroke-width="2.6" opacity=".55"/>`;
  const top = `<g class="ill-sparkle"><path d="${blob(158, 86, 5, 6, 0.4, 5, null)}" fill="#dca464" stroke="${INK}" stroke-width="2.4"/><path style="animation-delay:.7s" d="${blob(172, 106, 3.5, 6, 0.4, 9, null)}" fill="#dca464" stroke="${INK}" stroke-width="2"/></g>
    <path d="M58 104 q8 -10 20 -12" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".6"/>`;
  return svg(label, { defs, back: fond, print, ink, top });
}

function bananaBread(v, label) {
  const id = nid('b');
  const slice = 'M40 98 C40 62 70 50 100 50 C130 50 160 62 160 98 L156 198 C156 204 152 208 146 208 L54 208 C48 208 44 204 44 198 Z';
  const crumb = 'M54 104 C56 76 76 68 100 68 C124 68 144 76 146 104 L143 190 C143 194 140 196 136 196 L64 196 C60 196 57 194 57 190 Z';
  const defs = `<clipPath id="${id}c"><path d="${crumb}"/></clipPath><clipPath id="${id}s"><path d="${slice}"/></clipPath>`;
  const rand = rng(23);
  let trous = '';
  for (let i = 0; i < 18; i++) trous += `<ellipse cx="${r1(62 + rand() * 78)}" cy="${r1(80 + rand() * 110)}" rx="${r1(1.4 + rand() * 2.2)}" ry="${r1(1 + rand() * 1.4)}" fill="#b98447" opacity=".7"/>`;
  const print = `
    <path d="${slice}" fill="#8a4b22"/>
    <g clip-path="url(#${id}s)"><rect width="200" height="240" fill="url(#gr-d)" opacity=".6"/></g>
    <path d="${crumb}" fill="#e7bb78"/>
    <g clip-path="url(#${id}c)">
      ${trous}
      <g fill="#f7e6a6" stroke="#cf9f4c" stroke-width="2.2"><ellipse cx="80" cy="116" rx="14" ry="10"/><ellipse cx="124" cy="132" rx="15" ry="10"/><ellipse cx="90" cy="166" rx="13" ry="9"/><ellipse cx="132" cy="176" rx="10" ry="7.5"/></g>
      <g fill="#c99a4f"><circle cx="78" cy="114" r="1.3"/><circle cx="83" cy="118" r="1.3"/><circle cx="122" cy="130" r="1.3"/><circle cx="127" cy="134" r="1.3"/><circle cx="88" cy="165" r="1.2"/></g>
      <g fill="#6b3a1c"><path d="M104 96 l8 -3 4 6 -6 5 -7 -2z"/><path d="M66 140 l7 -2 3 6 -5 4 -6 -2z"/><path d="M112 160 l6 -2 3 5 -4 4 -5 -2z"/></g>
      <rect x="110" width="100" height="240" fill="url(#ht)" opacity=".16"/>
      <rect width="200" height="240" fill="url(#gr-d)" opacity=".5"/>
    </g>`;
  const ink = `<path d="${slice}"/><path d="${crumb}" stroke-width="2.6" opacity=".55"/>`;
  const top = `<path d="M62 80 q16 -10 36 -10" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".45"/>`;
  return svg(label, { defs, back: ombre(100, 216, 66, 7), print, ink, top });
}

function croissant(v, label) {
  const id = nid('c');
  const segs = [
    [24, 168, 15, 22, -58], [176, 168, 15, 22, 58],
    [42, 146, 21, 29, -40], [158, 146, 21, 29, 40],
    [66, 128, 26, 37, -20], [134, 128, 26, 37, 20],
    [100, 122, 31, 45, 0],
  ];
  const defs = `<radialGradient id="${id}g" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#f4c77f"/><stop offset=".7" stop-color="#d98f43"/><stop offset="1" stop-color="#b8692c"/></radialGradient>`;
  let corps = '';
  segs.forEach(([cx, cy, rx, ry, rot], i) => {
    const t = `rotate(${rot} ${cx} ${cy})`;
    corps += `<g transform="${OFFSET}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="${t}" fill="url(#${id}g)"/>
      <ellipse cx="${cx + rx * 0.35}" cy="${cy + ry * 0.35}" rx="${rx * 0.7}" ry="${ry * 0.6}" transform="${t}" fill="url(#ht)" opacity=".2"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="${t}" fill="url(#gr-d)" opacity=".55"/></g>
      <g fill="none" stroke="${INK}" stroke-linecap="round"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="${t}" stroke-width="4.2"/>
      <path d="M${cx - rx * 0.55} ${cy - ry * 0.15} Q${cx} ${cy + ry * 0.12} ${cx + rx * 0.55} ${cy - ry * 0.15}" transform="${t}" stroke-width="2.4" opacity="${i === 6 ? 0.55 : 0.4}"/>
      ${i > 1 ? `<path d="M${cx - rx * 0.45} ${cy - ry * 0.55} q${rx * 0.3} -${ry * 0.12} ${rx * 0.6} 0" transform="${t}" stroke="#fff" stroke-width="3" opacity=".65"/>` : ''}</g>`;
  });
  return svg(label, { defs, back: `${ombre(100, 196, 82, 9)}<g class="ill-float-soft">${corps}</g>` });
}

function acaiBowl(v, label) {
  const id = nid('a');
  const bowl = 'M22 116 C24 180 58 206 100 206 C142 206 176 180 178 116 Z';
  const defs = `<clipPath id="${id}b"><path d="${bowl}"/></clipPath><clipPath id="${id}t"><ellipse cx="100" cy="116" rx="72" ry="17"/></clipPath>`;
  const banane = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6.5" fill="#f7e6a6"/><ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="#e9cd7c"/>`;
  const print = `
    <path d="${bowl}" fill="${CREAM}"/>
    <g clip-path="url(#${id}b)">
      <path d="M20 150 Q100 176 180 150 L180 162 Q100 188 20 162 Z" fill="${TERRA}"/>
      <path d="M20 174 Q100 198 180 174 L180 180 Q100 204 20 180 Z" fill="${TERRA}"/>
      <rect x="112" y="100" width="90" height="120" fill="url(#ht)" opacity=".18"/>
      <rect width="200" height="240" fill="url(#gr-d)" opacity=".55"/>
    </g>
    <ellipse cx="100" cy="116" rx="72" ry="17" fill="#5b2a4e"/>
    <g clip-path="url(#${id}t)">
      <ellipse cx="100" cy="116" rx="72" ry="17" fill="url(#htl)" opacity=".12"/>
      ${banane(54, 114)}${banane(72, 108)}${banane(90, 105)}
      <g fill="#b07a3e"><circle cx="112" cy="110" r="4.5"/><circle cx="121" cy="114" r="4"/><circle cx="116" cy="120" r="3.6"/><circle cx="128" cy="108" r="3.4"/><circle cx="106" cy="118" r="3.2"/></g>
      <g fill="#d8433a"><path d="M138 112 q8 -12 18 -2 q-8 12 -18 2z"/><path d="M144 122 q8 -10 16 -1 q-7 10 -16 1z"/></g>
      <g fill="#2f2a5a"><circle cx="70" cy="122" r="3.4"/><circle cx="80" cy="124" r="3"/><circle cx="62" cy="125" r="2.6"/></g>
      <g fill="#fff"><path d="M92 122 l8 -3 1 2 -8 3z"/><path d="M100 127 l7 -1 0 2 -7 1z"/></g>
    </g>
    <path d="M48 116 q10 -6 18 2 t18 -2 t18 2 t18 -2" stroke="#f0b440" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M150 96 q14 -18 26 -10 q-8 16 -26 10z" fill="#7fae4a"/>`;
  const ink = `<path d="M22 116 C24 180 58 206 100 206 C142 206 176 180 178 116"/><ellipse cx="100" cy="116" rx="78" ry="21"/>
    <ellipse cx="100" cy="116" rx="72" ry="17" stroke-width="2.4" opacity=".6"/>
    <path d="M150 96 q14 -18 26 -10 q-8 16 -26 10z M152 96 q10 -6 22 -9" stroke-width="2.6"/>
    <path d="M70 206 Q100 214 130 206" stroke-width="3.4"/>`;
  const top = `<path d="M34 128 C36 156 46 172 60 184" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`;
  return svg(label, { defs, back: ombre(100, 214, 62, 7), print, ink, top });
}

function avocadoToast(v, label) {
  const id = nid('t');
  const bread = 'M46 118 C24 112 26 82 46 74 C54 52 82 42 104 46 C134 42 166 58 166 88 C178 100 172 116 164 120 L158 196 C158 202 154 206 148 206 L58 206 C52 206 48 202 48 196 Z';
  const mie = 'M58 118 C42 110 44 90 58 84 C66 66 86 58 104 60 C128 58 152 70 152 92 C160 102 156 112 150 116 L146 186 C146 190 143 193 139 193 L66 193 C62 193 59 190 59 186 Z';
  const defs = `<clipPath id="${id}m"><path d="${mie}"/></clipPath><clipPath id="${id}b"><path d="${bread}"/></clipPath>`;
  const pain = `${ombre(104, 216, 70, 7)}<g transform="${OFFSET}">
      <path d="${bread}" fill="#a8642e"/><g clip-path="url(#${id}b)"><rect width="200" height="240" fill="url(#gr-d)" opacity=".55"/></g>
      <path d="${mie}" fill="#ebbd7b"/>
      <g clip-path="url(#${id}m)"><rect x="116" width="90" height="240" fill="url(#ht)" opacity=".14"/><rect width="200" height="240" fill="url(#gr-d)" opacity=".45"/></g></g>
    <path d="${bread}" fill="none" stroke="${INK}" stroke-width="4.2"/><path d="${mie}" fill="none" stroke="${INK}" stroke-width="2.4" opacity=".5"/>`;
  // tranches d'avocat : croissants qui se chevauchent, du fond vers l'avant
  let tranches = '';
  [[62, 108, -26], [62, 124, -14], [62, 140, -3], [62, 156, 8], [62, 172, 18]].forEach(([x, y, rot]) => {
    const d = `M${x} ${y} C ${x + 18} ${y - 26} ${x + 66} ${y - 30} ${x + 88} ${y - 8} C ${x + 62} ${y - 6} ${x + 26} ${y + 4} ${x} ${y} Z`;
    const din = `M${x + 8} ${y - 3} C ${x + 24} ${y - 20} ${x + 60} ${y - 22} ${x + 78} ${y - 9} C ${x + 54} ${y - 8} ${x + 28} ${y - 1} ${x + 8} ${y - 3} Z`;
    tranches += `<g transform="rotate(${rot} ${x} ${y})"><g transform="${OFFSET}"><path d="${d}" fill="#7da23f"/><path d="${din}" fill="#cfe08d"/><path d="${din}" fill="url(#ht)" opacity=".12"/></g>
      <path d="${d}" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/></g>`;
  });
  const garniture = `<g fill="${INK}"><circle cx="96" cy="104" r="1.6"/><circle cx="122" cy="132" r="1.6"/><circle cx="104" cy="158" r="1.6"/><circle cx="134" cy="164" r="1.4"/><circle cx="84" cy="146" r="1.4"/></g>
    <g fill="#fff4dc"><ellipse cx="112" cy="114" rx="2" ry="1.2"/><ellipse cx="90" cy="134" rx="2" ry="1.2"/><ellipse cx="128" cy="150" rx="2" ry="1.2"/><ellipse cx="100" cy="178" rx="2" ry="1.2"/></g>
    <g fill="#d8433a"><path d="M104 124 l3 -2 1 3z"/><path d="M126 158 l3 -2 1 3z"/><path d="M84 166 l3 -2 1 3z"/><path d="M116 100 l3 -2 1 3z"/></g>
    <g transform="${OFFSET}"><path d="M150 200 A22 22 0 0 1 186 184 Z" fill="#b9d462"/><path d="M155 197 A16 16 0 0 1 181 186" fill="#e3efab"/></g>
    <path d="M150 200 A22 22 0 0 1 186 184 Z" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/>`;
  return svg(label, { defs, back: pain + tranches + garniture });
}

export function illustration(produit) {
  const v = produit.visuel || { type: 'iced', style: 'latte', bas: '#ead2b0', haut: '#7a4526' };
  const label = produit.nom;
  switch (v.type) {
    case 'hot': return gobeletChaud(v, label);
    case 'espresso': return espresso(v, label);
    case 'can': return canette(v, label);
    case 'cookie': return cookie(v, label);
    case 'cake': return bananaBread(v, label);
    case 'croissant': return croissant(v, label);
    case 'bowl': return acaiBowl(v, label);
    case 'toast': return avocadoToast(v, label);
    default: return gobeletGlace(v, label);
  }
}
