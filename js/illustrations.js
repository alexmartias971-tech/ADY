// Illustrations animées des produits (SVG générés).
// Les animations (glaçons, vapeur, vagues…) sont définies dans css/style.css (section « Illustrations »).

const LINE = '#2a1810';
const TERRA = '#bf472c';
const CREAM = '#fbe9d6';
const SPRITE = 'assets/brand.svg';

let uid = 0;

function luminance(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Pseudo-aléatoire déterministe : même dessin à chaque chargement
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

// Forme « organique » irrégulière (cookie, miettes…)
function blob(cx, cy, r, points, jitter, seed, bite) {
  const rand = rng(seed);
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    let rr = r * (1 - jitter / 2 + rand() * jitter);
    if (bite && Math.abs(a - bite.angle) < bite.width) {
      rr -= bite.depth * Math.cos(((a - bite.angle) / bite.width) * (Math.PI / 2));
    }
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  // courbe lissée passant par les points
  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
    if (i === 0) d += `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

function wrap(inner, label) {
  return `<svg class="ill" viewBox="0 0 200 240" role="img" aria-label="${label}" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function steam(xs, top = 4, bottom = 46) {
  return xs
    .map((x, i) => `<path class="ill-steam" style="animation-delay:${i * 0.7}s" d="M${x} ${bottom} c-9 -8 9 -14 0 -22 c-9 -8 9 -12 0 -${bottom - top - 22}" stroke="${LINE}" stroke-width="4.5" opacity=".55"/>`)
    .join('');
}

function cubes(id, positions) {
  return positions
    .map(([x, y, r, s], i) => `<g class="ill-cube" style="animation-delay:${(i * 0.45).toFixed(2)}s"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="7" transform="rotate(${r} ${x + s / 2} ${y + s / 2})" fill="#fff" fill-opacity=".5" stroke="${LINE}" stroke-width="3.5"/><path d="M${x + 7} ${y + 9} l6 -2" stroke="#fff" stroke-width="3" transform="rotate(${r} ${x + s / 2} ${y + s / 2})"/></g>`)
    .join('');
}

function logoOnCup(x, y, w, color) {
  const h = w * (1208 / 1440);
  return `<svg x="${x}" y="${y}" width="${w}" height="${h.toFixed(1)}" viewBox="0 0 1440 1208" style="color:${color}"><use href="${SPRITE}#logo"/></svg>`;
}

// ── Gobelet transparent (iced latte, matcha, smoothie…)
function iced(v, label, dome = false) {
  const id = `ic${++uid}`;
  const cup = 'M46 66 L62 220 Q63 229 72 229 L128 229 Q137 229 138 220 L154 66 Z';
  const light = luminance(v.bas) > 0.62;
  const surface = dome ? 74 : 92;
  let s = `<defs><clipPath id="${id}c"><path d="${cup}"/></clipPath>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.haut}"/><stop offset=".45" stop-color="${v.haut}"/><stop offset=".75" stop-color="${v.bas}"/><stop offset="1" stop-color="${v.bas}"/></linearGradient></defs>`;
  // paille (partie arrière)
  s += `<g class="ill-straw"><path d="M120 200 L140 6" stroke="${LINE}" stroke-width="15"/><path d="M120 200 L140 6" stroke="${TERRA}" stroke-width="9"/><path d="M120 200 L140 6" stroke="${CREAM}" stroke-width="9" stroke-dasharray="7 11"/></g>`;
  s += `<g clip-path="url(#${id}c)">
    <rect x="30" y="${surface}" width="140" height="150" fill="url(#${id}g)"/>
    <g class="ill-wave"><path d="M-60 ${surface} q12.5 -7 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 V${surface + 14} H-60Z" fill="${v.haut}"/></g>`;
  if (v.filet) s += `<path d="M58 ${surface + 10} q10 30 2 60 q-6 30 6 70 M144 ${surface + 6} q-10 34 -2 64 q6 28 -6 66" stroke="${v.filet}" stroke-width="5" opacity=".9"/>`;
  if (!v.sansGlace) s += cubes(id, [[66, surface + 4, -12, 30], [100, surface + 14, 16, 28], [76, surface + 42, 24, 26]]);
  else s += `<g class="ill-cube"><circle cx="80" cy="${surface + 30}" r="4" fill="#fff" opacity=".6"/><circle cx="118" cy="${surface + 60}" r="3" fill="#fff" opacity=".6"/><circle cx="96" cy="${surface + 90}" r="5" fill="#fff" opacity=".5"/></g>`;
  s += `</g>`;
  s += logoOnCup(70, 150, 60, light ? TERRA : CREAM);
  // reflets + contour
  s += `<path d="M58 84 L70 206" stroke="#fff" stroke-width="5" opacity=".55"/><path d="${cup}" stroke="${LINE}" stroke-width="5"/>`;
  if (dome) {
    s += `<path d="M44 66 Q46 16 100 14 Q154 16 156 66 Z" fill="#fff" fill-opacity=".35" stroke="${LINE}" stroke-width="5"/>
      <g class="ill-float-soft"><path d="M58 64 Q56 44 74 42 Q72 26 92 26 Q98 12 114 20 Q132 20 130 38 Q148 40 144 64 Z" fill="#fffaf2" stroke="${LINE}" stroke-width="4"/>
      <path d="M66 48 q8 6 16 0 t16 0 t16 0 t16 0" stroke="${v.filet || TERRA}" stroke-width="5"/></g>`;
  }
  s += `<rect x="38" y="58" width="124" height="12" rx="6" fill="#fff" fill-opacity=".5" stroke="${LINE}" stroke-width="5"/>`;
  if (v.fruit) {
    s += `<g class="ill-float-soft" transform="rotate(-18 156 60)"><circle cx="156" cy="60" r="22" fill="${v.fruit}" stroke="${LINE}" stroke-width="4.5"/><circle cx="156" cy="60" r="14" fill="#fff" fill-opacity=".45"/><path d="M156 46 V74 M142 60 H170 M146 50 L166 70 M166 50 L146 70" stroke="${v.fruit}" stroke-width="2.5"/></g>`;
  }
  return wrap(s, label);
}

// ── Gobelet carton (boissons chaudes) : couvercle coloré + manchon terracotta
function hot(v, label) {
  const lid = v.couvercle || TERRA;
  const lidDark = luminance(lid) < 0.25;
  let s = steam([80, 100, 120], 2, 40);
  s += `<path d="M58 84 L70 226 Q71 233 79 233 L121 233 Q129 233 130 226 L142 84 Z" fill="#fff6ea" stroke="${LINE}" stroke-width="5"/>
    <path d="M63 130 L137 130 L132 188 L68 188 Z" fill="${TERRA}" stroke="${LINE}" stroke-width="4.5"/>`;
  s += logoOnCup(78, 136, 44, CREAM);
  s += `<path d="M60 52 Q62 40 78 40 L122 40 Q138 40 140 52 L142 70 L58 70 Z" fill="${lid}" stroke="${LINE}" stroke-width="5"/>
    <rect x="48" y="66" width="104" height="18" rx="7" fill="${lid}" stroke="${LINE}" stroke-width="5"/>
    <rect x="108" y="46" width="18" height="7" rx="3.5" fill="${lidDark ? CREAM : LINE}" opacity=".7"/>
    <path d="M70 100 L76 120" stroke="#fff" stroke-width="5" opacity=".9"/>`;
  return wrap(s, label);
}

function espresso(v, label) {
  let s = steam([88, 108], 40, 96);
  s += `<ellipse cx="100" cy="196" rx="78" ry="16" fill="${TERRA}" stroke="${LINE}" stroke-width="5"/>
    <ellipse cx="100" cy="192" rx="46" ry="8" fill="#9e3a22" opacity=".5"/>
    <path d="M140 132 q30 -4 30 20 q0 24 -34 24" stroke="${LINE}" stroke-width="13"/>
    <path d="M140 132 q30 -4 30 20 q0 24 -34 24" stroke="#fff6ea" stroke-width="5"/>
    <path d="M52 112 Q52 192 100 192 Q148 192 148 112 Z" fill="#fff6ea" stroke="${LINE}" stroke-width="5"/>
    <ellipse cx="100" cy="114" rx="45" ry="9" fill="#b5743f" stroke="${LINE}" stroke-width="4.5"/>
    <g class="ill-wave-soft"><ellipse cx="92" cy="113" rx="16" ry="3" fill="#d7a06a"/></g>
    <path d="M64 130 q2 30 18 44" stroke="${TERRA}" stroke-width="5" opacity=".5"/>`;
  return wrap(s, label);
}

function can(v, label) {
  const s = `<g class="ill-float-soft"><svg x="22" y="12" width="156" height="184" viewBox="0 0 680 800" style="--st-bg:#fff6ea;--st-ink:${TERRA}"><use href="${SPRITE}#st-can"/></svg></g>
    <g class="ill-sparkle" fill="${TERRA}"><path d="M170 52 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><path style="animation-delay:.8s" d="M30 170 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/></g>
    <ellipse cx="100" cy="222" rx="52" ry="7" fill="${LINE}" opacity=".12"/>`;
  return wrap(s, label);
}

function cookie(v, label) {
  const shape = blob(100, 124, 74, 16, 0.12, 7, { angle: -0.7, width: 0.55, depth: 22 });
  const rand = rng(11);
  let chips = '';
  const spots = [[72, 96], [118, 92], [92, 130], [134, 132], [70, 150], [110, 162], [146, 104], [84, 176], [130, 176]];
  for (const [x, y] of spots) {
    const r = 6 + rand() * 4;
    chips += `<path d="${blob(x, y, r, 6, 0.4, Math.floor(x * y), null)}" fill="#4a2617"/>`;
  }
  const s = `<g class="ill-float-soft"><ellipse cx="100" cy="212" rx="60" ry="8" fill="${LINE}" opacity=".12"/>
    <path d="${shape}" fill="#d9a062" stroke="${LINE}" stroke-width="5"/>
    <path d="${blob(100, 124, 58, 14, 0.15, 3, { angle: -0.7, width: 0.6, depth: 20 })}" stroke="#b97b3f" stroke-width="3" opacity=".6"/>
    ${chips}</g>
    <g class="ill-sparkle"><circle cx="160" cy="54" r="4" fill="#d9a062" stroke="${LINE}" stroke-width="2.5"/><circle style="animation-delay:.6s" cx="176" cy="74" r="3" fill="#d9a062" stroke="${LINE}" stroke-width="2"/></g>`;
  return wrap(s, label);
}

function cake(v, label) {
  const s = `<g class="ill-float-soft"><ellipse cx="100" cy="214" rx="70" ry="8" fill="${LINE}" opacity=".12"/>
    <path d="M38 96 Q40 62 100 58 Q160 62 162 96 L160 196 Q160 204 152 204 L48 204 Q40 204 40 196 Z" fill="#8e4f24" stroke="${LINE}" stroke-width="5"/>
    <path d="M50 102 Q54 76 100 74 Q146 76 150 102 L148 186 Q148 192 142 192 L58 192 Q52 192 52 186 Z" fill="#e8bd7c"/>
    <g fill="#f6e3a1" stroke="#c99a4a" stroke-width="2.5"><ellipse cx="78" cy="118" rx="12" ry="9"/><ellipse cx="124" cy="132" rx="13" ry="9"/><ellipse cx="90" cy="164" rx="12" ry="8"/><ellipse cx="132" cy="172" rx="9" ry="7"/></g>
    <g fill="#6b3a1c"><circle cx="106" cy="104" r="4"/><circle cx="68" cy="146" r="3.5"/><circle cx="112" cy="156" r="3"/><circle cx="140" cy="110" r="3"/></g>
    <path d="M62 82 q20 -10 40 -6" stroke="#c07a3e" stroke-width="4"/></g>`;
  return wrap(s, label);
}

function croissant(v, label) {
  const seg = (cx, cy, rx, ry, rot) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#e2a457" stroke="${LINE}" stroke-width="5"/>
     <path d="M${cx - rx * 0.5} ${cy - ry * 0.4} q${rx * 0.5} ${ry * 0.3} ${rx} 0" transform="rotate(${rot} ${cx} ${cy})" stroke="#f3c983" stroke-width="4"/>`;
  const s = `<g class="ill-float-soft"><ellipse cx="100" cy="196" rx="76" ry="9" fill="${LINE}" opacity=".12"/>
    ${seg(30, 160, 16, 22, -50)}${seg(170, 160, 16, 22, 50)}
    ${seg(52, 138, 22, 30, -32)}${seg(148, 138, 22, 30, 32)}
    ${seg(76, 124, 26, 38, -14)}${seg(124, 124, 26, 38, 14)}
    ${seg(100, 120, 30, 44, 0)}</g>`;
  return wrap(s, label);
}

function bowl(v, label) {
  const s = `<g class="ill-float-soft"><ellipse cx="100" cy="218" rx="64" ry="8" fill="${LINE}" opacity=".12"/>
    <ellipse cx="100" cy="122" rx="74" ry="20" fill="#5b2a4e" stroke="${LINE}" stroke-width="5"/>
    <g fill="#f6e3a1" stroke="${LINE}" stroke-width="3"><circle cx="64" cy="116" r="11"/><circle cx="84" cy="108" r="11"/><circle cx="104" cy="104" r="11"/></g>
    <g fill="#c9a06a"><circle cx="64" cy="116" r="2"/><circle cx="84" cy="108" r="2"/><circle cx="104" cy="104" r="2"/></g>
    <g fill="#b07a3e" stroke="${LINE}" stroke-width="2.5"><circle cx="128" cy="112" r="6"/><circle cx="140" cy="118" r="5"/><circle cx="122" cy="122" r="5"/><circle cx="148" cy="108" r="4"/></g>
    <path d="M80 128 q6 -14 18 -8 q-2 12 -18 8z" fill="#d8433a" stroke="${LINE}" stroke-width="3"/>
    <path d="M104 132 q8 -12 18 -4 q-4 12 -18 4z" fill="#d8433a" stroke="${LINE}" stroke-width="3"/>
    <path d="M150 98 q12 -16 22 -10 q-6 14 -22 10z" fill="#8fb651" stroke="${LINE}" stroke-width="3"/>
    <path d="M26 122 Q28 206 100 208 Q172 206 174 122 Q172 142 100 142 Q28 142 26 122 Z" fill="${CREAM}" stroke="${LINE}" stroke-width="5"/>
    <path d="M36 162 Q100 182 164 162" stroke="${TERRA}" stroke-width="8"/>
    <path d="M44 182 Q100 198 156 182" stroke="${TERRA}" stroke-width="5"/></g>`;
  return wrap(s, label);
}

function toast(v, label) {
  const s = `<g class="ill-float-soft"><ellipse cx="100" cy="214" rx="70" ry="8" fill="${LINE}" opacity=".12"/>
    <g transform="rotate(-8 100 130)">
    <path d="M44 120 Q20 112 26 82 Q34 50 70 52 Q86 34 112 38 Q148 36 166 62 Q186 80 174 110 L166 196 Q166 204 158 204 L54 204 Q46 204 46 196 Z" fill="#a8642e" stroke="${LINE}" stroke-width="5"/>
    <path d="M56 118 Q38 108 42 86 Q48 64 74 66 Q90 50 112 52 Q140 52 154 70 Q168 84 160 108 L154 188 Q154 192 150 192 L62 192 Q58 192 58 188 Z" fill="#e6b877"/>
    <g fill="#9cbf4f" stroke="${LINE}" stroke-width="3.5">
      <path d="M62 132 q36 -36 86 -26 q-30 20 -86 26z"/><path d="M62 154 q40 -30 90 -16 q-34 18 -90 16z"/><path d="M64 176 q38 -24 86 -10 q-32 16 -86 10z"/>
    </g>
    <g stroke="#4f7a2a" stroke-width="3"><path d="M74 126 q30 -18 62 -18"/><path d="M76 149 q32 -14 66 -10"/><path d="M78 172 q30 -10 62 -6"/></g>
    <g fill="#d8433a"><circle cx="90" cy="118" r="2.5"/><circle cx="128" cy="140" r="2.5"/><circle cx="104" cy="164" r="2.5"/><circle cx="140" cy="168" r="2"/></g>
    <g fill="${LINE}"><circle cx="112" cy="124" r="2"/><circle cx="84" cy="146" r="2"/><circle cx="122" cy="156" r="2"/><circle cx="96" cy="180" r="2"/></g>
    </g></g>`;
  return wrap(s, label);
}

export function illustration(produit) {
  const v = produit.visuel || { type: 'iced', bas: '#e9cfae', haut: '#7a4526' };
  const label = produit.nom;
  switch (v.type) {
    case 'hot': return hot(v, label);
    case 'espresso': return espresso(v, label);
    case 'frappe': return iced(v, label, true);
    case 'can': return can(v, label);
    case 'cookie': return cookie(v, label);
    case 'cake': return cake(v, label);
    case 'croissant': return croissant(v, label);
    case 'bowl': return bowl(v, label);
    case 'toast': return toast(v, label);
    default: return iced(v, label);
  }
}
