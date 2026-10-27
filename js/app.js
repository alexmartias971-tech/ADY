// ADY COFFEE SHOP — script principal : carte, panier, animations
import { CONFIG } from './config.js';
import { PRODUITS, CATEGORIES, OPTIONS, trouverProduit, prixLigne, libelleOptions } from './menu.js';
import { illustration } from './illustrations.js';
import { panier } from './cart.js';
import { etatOuverture, JOURS, heure } from './horaires.js';
import { $, $$, euro, euroCourt, esc, minusculeInitiale, toast, beanSVG, giftSVG, reduceMotion } from './utils.js';
import { initCheckout, ouvrirPanneau } from './checkout.js';

document.documentElement.classList.remove('no-js');

/* ── Textes pilotés par config.js ─────────────────────── */
$$('[data-min-order]').forEach((el) => (el.textContent = euroCourt(CONFIG.commandeMinimum)));
$$('[data-delay]').forEach((el) => (el.textContent = CONFIG.delaiLivraison));
$$('[data-zone-name]').forEach((el) => (el.textContent = minusculeInitiale(CONFIG.zone.nom)));
$$('[data-address]').forEach((el) => (el.textContent = CONFIG.adresse));
$$('[data-directions]').forEach((el) => (el.href = CONFIG.lienItineraire));
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

/* ── Bandeaux défilants : on duplique le contenu pour une boucle sans couture ── */
$$('[data-marquee]').forEach((el) => {
  const html = el.innerHTML;
  const reps = Math.max(1, Math.ceil((window.innerWidth * 1.3) / Math.max(el.scrollWidth, 1)));
  el.innerHTML = html.repeat(reps * 2);
});

/* ── Rayons de soleil du hero ─────────────────────────── */
const rays = $('[data-rays]');
if (rays) {
  let d = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const a1 = a - 0.045, a2 = a + 0.045;
    d += `<path d="M200 200 L${200 + Math.cos(a1) * 200} ${200 + Math.sin(a1) * 200} L${200 + Math.cos(a2) * 200} ${200 + Math.sin(a2) * 200}Z"/>`;
  }
  rays.innerHTML = d;
}

/* ── Illustrations décoratives (hero) ─────────────────── */
$$('[data-ill]').forEach((el) => {
  const p = trouverProduit(el.dataset.ill);
  if (p) el.innerHTML = illustration(p);
});

// Gobelet qui voyage du shop jusqu'à la serviette (scène plage)
const courier = $('[data-courier]');
if (courier && !reduceMotion()) {
  const svg = illustration(trouverProduit('iced-latte')).replace('<svg class="ill"', '<svg class="ill" x="-30" y="-78" width="60" height="72"');
  courier.innerHTML = `<g><animateMotion dur="7s" repeatCount="indefinite" rotate="0"><mpath href="#delivery-path"/></animateMotion>${svg}</g>`;
}

/* ── Parallaxe du hero (souris) ───────────────────────── */
const art = $('[data-parallax]');
if (art && window.matchMedia('(pointer: fine)').matches && !reduceMotion()) {
  const floaties = $$('.floaty', art);
  floaties.forEach((f) => f.style.setProperty('--d', f.dataset.depth || 0));
  let raf;
  document.querySelector('.hero').addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const mx = (e.clientX / window.innerWidth - 0.5) * 2;
      const my = (e.clientY / window.innerHeight - 0.5) * 2;
      floaties.forEach((f) => { f.style.setProperty('--mx', mx); f.style.setProperty('--my', my); });
    });
  });
}

/* ── Navigation ───────────────────────────────────────── */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const burger = $('[data-burger]');
const links = $('#menu-principal');
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  links.classList.toggle('is-open', open);
});
links.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    burger.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
  }
});

/* ── Apparitions au scroll ────────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add('is-in');
      revealObs.unobserve(en.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
function observerReveal(root = document) {
  $$('.reveal:not(.is-in)', root).forEach((el) => {
    const freres = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--delay', `${Math.min(freres.indexOf(el), 6) * 0.08}s`);
    revealObs.observe(el);
  });
}
observerReveal();

// Met en pause les animations des illustrations hors écran (économie de batterie)
const pauseObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => en.target.classList.toggle('is-paused', !en.isIntersecting));
}, { rootMargin: '100px' });

/* ── La carte ─────────────────────────────────────────── */
const grid = $('[data-grid]');
const tabs = $('[data-tabs]');
let categorie = 'all';

tabs.innerHTML = [{ id: 'all', label: 'Tout' }, ...CATEGORIES]
  .filter((c) => c.id === 'all' || PRODUITS.some((p) => p.cat === c.id))
  .map((c) => `<button class="tab" role="tab" type="button" data-cat="${c.id}" aria-selected="${c.id === categorie}">${esc(c.label)}</button>`)
  .join('');

tabs.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  categorie = b.dataset.cat;
  $$('.tab', tabs).forEach((t) => t.setAttribute('aria-selected', t === b));
  b.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  renderGrid();
});

const iconPlus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

function carte(p, i) {
  const soon = p.dispo === false;
  const visuel = p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.nom)}" loading="lazy">` : illustration(p);
  const bouton = soon
    ? '<button class="add-btn" type="button" disabled>Bientôt</button>'
    : `<button class="add-btn" type="button" data-add="${p.id}" aria-label="Ajouter ${esc(p.nom)} au panier">${iconPlus}<span>Ajouter</span></button>`;
  return `<article class="card${soon ? ' is-soon' : ''}" data-cat="${p.cat}" data-id="${p.id}" style="--i:${i}">
    ${p.tag ? `<span class="card__tag">${esc(p.tag)}</span>` : ''}
    <span class="in-cart" data-in-cart hidden></span>
    <div class="card__art">${visuel}</div>
    <div class="card__body">
      <h3 class="card__name">${esc(p.nom)}</h3>
      <p class="card__desc">${esc(p.desc)}</p>
      <div class="card__foot"><span class="price">${euro(p.prix)}</span>${bouton}</div>
    </div>
  </article>`;
}

function renderGrid() {
  const liste = PRODUITS.filter((p) => categorie === 'all' || p.cat === categorie);
  grid.innerHTML = liste.map(carte).join('');
  $$('.card', grid).forEach((c) => pauseObs.observe(c));
  majBadges();
}
renderGrid();

grid.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  const p = trouverProduit(b.dataset.add);
  if (p.options?.length) ouvrirOptions(p, b.closest('.card').querySelector('.card__art'));
  else {
    panier.ajouter(p.id);
    voler(b.closest('.card').querySelector('.card__art'));
    toast(`Ajouté : ${p.nom}`);
  }
});

function majBadges() {
  $$('.card', grid).forEach((c) => {
    const n = panier.qtyProduit(c.dataset.id);
    const badge = $('[data-in-cart]', c);
    badge.hidden = n === 0;
    badge.textContent = n;
    badge.setAttribute('aria-label', `${n} dans le panier`);
  });
}

/* ── Feuille d'options (lait, sirop…) ─────────────────── */
const sheet = $('#sheet');
const sheetForm = $('[data-sheet-form]');
let produitSheet = null;
let qtySheet = 1;
let focusAvantSheet = null;

function ouvrirOptions(p, source) {
  produitSheet = p;
  qtySheet = 1;
  focusAvantSheet = document.activeElement;
  $('[data-sheet-art]').innerHTML = illustration(p);
  $('[data-sheet-title]').textContent = p.nom;
  $('[data-sheet-desc]').textContent = p.desc;
  $('[data-sheet-options]').innerHTML = p.options.map((g) => {
    const def = OPTIONS[g];
    return `<fieldset class="opt-group"><legend>${esc(def.label)}</legend><div class="choice-row">${def.choix
      .map((c, i) => `<label class="choice"><input type="radio" name="${g}" value="${c.id}"${i === 0 ? ' checked' : ''}><span>${esc(c.label)}${c.prix ? ` <small>+${euro(c.prix)}</small>` : ''}</span></label>`)
      .join('')}</div></fieldset>`;
  }).join('');
  sheet.hidden = false;
  sheet._source = source;
  majSheet();
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => $('input', sheet)?.focus({ preventScroll: true }), 50);
}

function choixSheet() {
  const data = new FormData(sheetForm);
  const choix = {};
  for (const g of produitSheet.options) choix[g] = data.get(g);
  return choix;
}

function majSheet() {
  const unit = prixLigne(produitSheet, choixSheet());
  $('output', sheet).textContent = qtySheet;
  $('[data-sheet-submit]').textContent = `Ajouter · ${euro(unit * qtySheet)}`;
}

function fermerSheet() {
  sheet.hidden = true;
  if ($('#panel').hidden) document.documentElement.style.overflow = '';
  focusAvantSheet?.focus?.({ preventScroll: true });
}

sheetForm.addEventListener('change', majSheet);
$('[data-sheet-qty]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-qty]');
  if (!b) return;
  qtySheet = Math.min(20, Math.max(1, qtySheet + Number(b.dataset.qty)));
  majSheet();
});
sheetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const choix = choixSheet();
  panier.ajouter(produitSheet.id, choix, qtySheet);
  const opts = libelleOptions(produitSheet, choix);
  const source = $('[data-sheet-art]');
  voler(source);
  toast(`Ajouté : ${qtySheet > 1 ? `${qtySheet}× ` : ''}${produitSheet.nom}${opts ? ` (${opts})` : ''}`);
  fermerSheet();
});
$$('[data-close-sheet]').forEach((b) => b.addEventListener('click', fermerSheet));

/* ── Le gobelet « vole » jusqu'au panier ──────────────── */
function cibleCompteur() {
  const bar = $('[data-cartbar]');
  if (bar && !bar.hidden && bar.getBoundingClientRect().width) return bar;
  return $('.nav .cart-btn');
}

function voler(source) {
  const target = cibleCompteur();
  if (!source || !target || reduceMotion()) return bump();
  const svg = source.querySelector('svg.ill, img');
  if (!svg) return bump();
  const a = source.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = 'flyer';
  flyer.innerHTML = svg.outerHTML;
  const w = Math.min(a.width * 0.6, 120);
  flyer.style.width = `${w}px`;
  flyer.style.left = `${a.left + a.width / 2 - w / 2}px`;
  flyer.style.top = `${a.top + a.height / 2 - w / 2}px`;
  document.body.appendChild(flyer);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = flyer.animate([
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 120}px) scale(.8) rotate(-20deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.2) rotate(20deg)`, opacity: 0.4 },
  ], { duration: 750, easing: 'cubic-bezier(.5,0,.5,1)' });
  anim.onfinish = () => { flyer.remove(); bump(); };
}

function bump() {
  $$('.cart-btn, [data-cartbar]').forEach((el) => {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  });
}

/* ── Compteurs du panier ──────────────────────────────── */
function majCompteurs() {
  const n = panier.nb();
  $$('[data-cart-count]').forEach((el) => (el.textContent = n));
  $$('[data-cart-total]').forEach((el) => (el.textContent = euro(panier.sousTotal())));
  $('[data-cartbar]').hidden = n === 0;
  majBadges();
}
panier.onChange(majCompteurs);
majCompteurs();

/* ── Horaires & statut ouvert/fermé ───────────────────── */
function majHoraires() {
  const etat = etatOuverture(CONFIG);
  $$('[data-status]').forEach((el) => {
    el.hidden = false;
    el.textContent = etat.texte;
    el.classList.toggle('is-open', etat.ouvert);
    el.classList.toggle('is-closed', !etat.ouvert);
  });
  const ordre = [1, 2, 3, 4, 5, 6, 0];
  $('[data-hours]').innerHTML = ordre.map((j) => {
    const p = CONFIG.horaires[j];
    return `<li class="${j === etat.jour ? 'is-today' : ''}"><span>${JOURS[j]}</span><span>${p ? `${heure(p[0])} – ${heure(p[1])}` : 'Fermé'}</span></li>`;
  }).join('');
}
majHoraires();
setInterval(majHoraires, 60000);

/* ── Contact / Instagram / fidélité ───────────────────── */
const contact = $('[data-contact]');
const liensContact = [];
if (CONFIG.telephone) liensContact.push(`<a class="btn btn--cream btn--sm" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">Appeler · ${esc(CONFIG.telephone)}</a>`);
if (CONFIG.whatsapp) liensContact.push(`<a class="btn btn--cream btn--sm" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`);
if (CONFIG.instagram) liensContact.push(`<a class="btn btn--cream btn--sm" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
contact.innerHTML = liensContact.length
  ? liensContact.join('')
  : '<p>Passe nous voir directement au shop, ou commande en ligne si tu es sur la plage.</p><a class="btn btn--terra btn--sm" href="#carte">Commander</a>';

if (CONFIG.instagram) {
  const cta = $('[data-insta-cta]');
  cta.innerHTML = `<a class="btn btn--terra" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Suivre Ady sur Instagram</a>`;
  cta.hidden = false;
}

if (CONFIG.lienCarteFidelite) {
  $('[data-loyalty-cta]').innerHTML = `<a class="btn btn--cream btn--lg" href="${esc(CONFIG.lienCarteFidelite)}" target="_blank" rel="noopener">Je récupère ma carte</a>`;
}

/* ── Carte fidélité animée : les tampons se remplissent ── */
const beans = $('[data-beans]');
if (beans) {
  beans.innerHTML = Array.from({ length: 10 }, () => `<span class="bean">${beanSVG()}</span>`).join('') + `<span class="bean bean--gift">${giftSVG()}</span>`;
  const items = $$('.bean', beans);
  const compteur = $('[data-stamp-count]');
  let timer = null;
  let n = 0;
  const tick = () => {
    if (n < 10) {
      items[n].classList.add('is-on');
      n += 1;
      compteur.textContent = `${n}/10`;
      timer = setTimeout(tick, 260);
    } else {
      items[10].classList.add('is-on');
      timer = setTimeout(() => {
        items.forEach((b) => b.classList.remove('is-on'));
        n = 0;
        compteur.textContent = '0/10';
        timer = setTimeout(tick, 700);
      }, 2600);
    }
  };
  if (reduceMotion()) {
    items.slice(0, 3).forEach((b) => b.classList.add('is-on'));
    compteur.textContent = '3/10';
  } else {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !timer) timer = setTimeout(tick, 400);
      else if (!en.isIntersecting && timer) { clearTimeout(timer); timer = null; }
    }, { threshold: 0.4 }).observe(beans);
  }
}

/* ── Panneau de commande ──────────────────────────────── */
initCheckout();
$$('[data-open-panel]').forEach((b) => b.addEventListener('click', () => ouvrirPanneau(1)));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !sheet.hidden) fermerSheet();
});
