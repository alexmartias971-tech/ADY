// Commun à toutes les pages, carte fidélité animée, données structurées pour Google
import { CONFIG } from './reglages.js';
import { chargerCatalogue, catalogue, estDemo, trouverPoint, panier, nettoyerPanier } from './data.js';
import { illustration, defsGlobales } from './illustrations.js';
import { etatOuverture, JOURS, heure, icon, hydrateIcons, $, $$, euro, euroCourt, esc, minusculeInitiale, toast, pointeurFin, reduceMotion, beanSVG, picto } from './utils.js';
import { initCheckout, ouvrirPanneau } from './checkout.js';

/* ═════════════════════════════════════════════════════════════
   Commun à toutes les pages
   ═════════════════════════════════════════════════════════════ */
// Éléments communs à toutes les pages : en-tête, menu mobile, statut d'ouverture,
// panier, suivi de commande, apparitions au défilement, effet 3D.
export async function initUI() {
  document.documentElement.classList.remove('no-js');
  document.body.insertAdjacentHTML('afterbegin', defsGlobales());
  // tant que la base n'est pas branchée, on le dit clairement : rien n'est préparé ni livré
  if (estDemo()) document.body.insertAdjacentHTML('afterbegin', '<p class="demo-bar" role="note"><b>Site de démonstration</b> · les commandes ne sont ni préparées ni livrées. <a href="mentions-legales">En savoir plus</a></p>');
  hydrateIcons();
  initEntete();
  initStatut();
  initContact();
  initReveal();
  textes();

  try {
    await chargerCatalogue();
    nettoyerPanier();
  } catch (e) {
    console.error(e);
    toast('La carte n’a pas pu se charger. Réessaie dans un instant.');
  }
  textes();
  $$('[data-ill]').forEach((el) => {
    const p = catalogue.produits.find((x) => x.nom === el.dataset.ill);
    if (p) el.innerHTML = illustration(p, { glace: el.dataset.glace ? el.dataset.glace === '1' : undefined });
  });
  initPanier();
  initCheckout();
  pointDepuisQR();
  initModes();
  initTilt();
  if (['home', 'le-shop'].includes(document.body.dataset.page)) donneesShop();
}

// Textes issus de la configuration et des réglages du back-office
function textes() {
  const min = Number(catalogue.reglages.beach_min ?? CONFIG.commandeMinimum);
  $$('[data-min-order]').forEach((el) => (el.textContent = euroCourt(min)));
  $$('[data-delay]').forEach((el) => (el.textContent = CONFIG.delaiLivraison));
  $$('[data-zone-name]').forEach((el) => (el.textContent = minusculeInitiale(CONFIG.zone.nom)));
  $$('[data-address]').forEach((el) => (el.textContent = CONFIG.adresse));
  $$('[data-directions]').forEach((el) => (el.href = CONFIG.lienItineraire));
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  $$('[data-insta-link]').forEach((el) => { el.href = CONFIG.instagram; el.hidden = !CONFIG.instagram; });
  $$('[data-insta-pseudo]').forEach((el) => (el.textContent = CONFIG.instagramPseudo || 'Instagram'));
  $$('[data-proof]').forEach((el) => { el.textContent = CONFIG.preuveSociale || ''; el.hidden = !CONFIG.preuveSociale; });
  // carte fidélité digitale : boutons, liens et QR code
  $$('[data-loyalty-cta]:not([data-done])').forEach((el) => {
    el.dataset.done = '1';
    ctaFidelite(el, { clair: !el.dataset.loyaltyCta.includes('sombre'), qr: el.dataset.loyaltyCta.includes('qr') });
  });
  $$('[data-loyalty-link]').forEach((el) => { el.href = CONFIG.lienCarteFidelite; });
  $$('[data-loyalty-only]').forEach((el) => { el.hidden = !CONFIG.lienCarteFidelite; });
  $$('[data-fees]').forEach((el) => {
    el.textContent = CONFIG.fraisLivraison
      ? `La livraison coûte ${euro(CONFIG.fraisLivraison)}, ajoutés au total.`
      : 'La livraison est offerte.';
  });
}

/* ── En-tête & menu mobile ───────────────────────────────── */
function initEntete() {
  const header = $('#site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  // pastille « commande en cours »
  $('.site-header__actions')?.insertAdjacentHTML('afterbegin', '<button class="track-pill" type="button" data-track-pill hidden></button>');

  const burger = $('[data-burger]');
  const menu = $('#mobile-menu');
  if (!burger || !menu) return;
  const basculer = (ouvrir) => {
    burger.setAttribute('aria-expanded', String(ouvrir));
    burger.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.hidden = !ouvrir;
    document.documentElement.style.overflow = ouvrir ? 'hidden' : '';
    header.classList.toggle('is-scrolled', ouvrir || window.scrollY > 24);
  };
  burger.addEventListener('click', () => basculer(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) basculer(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) basculer(false); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) basculer(false); });
}

/* ── Statut ouvert / fermé + horaires ─────────────────────── */
function initStatut() {
  const maj = () => {
    const etat = etatOuverture(CONFIG);
    $$('[data-status]').forEach((el) => {
      el.hidden = false;
      el.textContent = etat.texte;
      el.classList.toggle('is-open', etat.ouvert);
      el.classList.toggle('is-closed', !etat.ouvert);
    });
    const ordre = [1, 2, 3, 4, 5, 6, 0];
    $$('[data-hours]').forEach((ul) => {
      ul.innerHTML = ordre.map((j) => {
        const p = CONFIG.horaires[j];
        return `<li class="${j === etat.jour ? 'is-today' : ''}"><span>${JOURS[j]}</span><span>${p ? `${heure(p[0])} – ${heure(p[1])}` : 'Fermé'}</span></li>`;
      }).join('');
    });
  };
  maj();
  setInterval(maj, 60000);
}

/* ── Liens de contact ─────────────────────────────────────── */
function initContact() {
  const liens = [];
  if (CONFIG.telephone) liens.push(`<a class="btn btn--sm" href="tel:${CONFIG.telephone.replace(/[^\d+]/g, '')}">${icon('phone')} ${esc(CONFIG.telephone)}</a>`);
  if (CONFIG.whatsapp) liens.push(`<a class="btn btn--sm btn--dark" href="https://wa.me/${CONFIG.whatsapp}" target="_blank" rel="noopener">${icon('chat')} WhatsApp</a>`);
  if (CONFIG.instagram) liens.push(`<a class="btn btn--sm btn--dark" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">${icon('insta')} ${esc(CONFIG.instagramPseudo || 'Instagram')}</a>`);
  $$('[data-contact]').forEach((el) => {
    el.innerHTML = liens.length ? liens.join('') : '<p class="muted" style="margin:0">Passe directement au shop, ou commande en ligne.</p>';
  });
  $$('[data-insta]').forEach((el) => {
    if (CONFIG.instagram) el.innerHTML = `<a href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram ${esc(CONFIG.instagramPseudo || '')}</a>`;
    else el.remove();
  });
}

/* ── Apparitions au défilement ────────────────────────────── */
let revealObs = null;
export function initReveal(root = document) {
  if (!revealObs) {
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          revealObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }
  $$('.reveal:not(.is-in)', root).forEach((el) => {
    const freres = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--delay', `${Math.min(freres.indexOf(el), 5) * 0.08}s`);
    revealObs.observe(el);
  });
}

// Met en pause les animations des illustrations hors de l'écran
const pauseObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => en.target.classList.toggle('is-paused', !en.isIntersecting));
}, { rootMargin: '120px' });
export function pauserHorsEcran(els) {
  els.forEach((el) => pauseObs.observe(el));
}

/* ── Effet 3D : les cartes s'inclinent sous la souris ─────── */
export function initTilt(root = document) {
  if (!pointeurFin() || reduceMotion()) return;
  $$('[data-tilt]:not([data-tilt-on])', root).forEach((el) => {
    el.dataset.tiltOn = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tx', `${(-y * 10).toFixed(2)}deg`);
      el.style.setProperty('--ty', `${(x * 12).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(0)}%`);
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
      el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(0)}%`);
      el.classList.add('is-tilting');
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--tx', '0deg');
      el.style.setProperty('--ty', '0deg');
      el.style.setProperty('--mx', '0');
      el.style.setProperty('--my', '0');
    });
  });
}

/* ── Liens « livré sur la plage » / « je passe au shop » ──── */
function initModes() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-set-mode]');
    if (a) panier.setMode(a.dataset.setMode);
  });
}

/* ── QR code d'un point de livraison : /carte?point=panneau-ady ── */
// Le client qui scanne le panneau sur la plage arrive avec son point déjà choisi.
function pointDepuisQR() {
  const cle = new URLSearchParams(location.search).get('point');
  if (!cle) return;
  const pt = trouverPoint(cle);
  if (!pt) return;
  panier.setMode('plage');
  panier.setPoint(pt.id);
  toast(`Livraison au point « ${pt.nom} »`);
  history.replaceState(history.state, '', location.pathname + location.hash);
}

/* ── Panier : compteurs, barre mobile ─────────────────────── */
function initPanier() {
  document.body.insertAdjacentHTML('beforeend', `<button class="cartbar" type="button" data-cartbar data-open-cart hidden>
      <span class="cartbar__count" data-cart-count>0</span>
      <span class="cartbar__label">Mon panier<small data-cartbar-mode></small></span>
      <span class="cartbar__total" data-cart-total>0,00 €</span>
    </button>
    <a class="cartbar cartbar--vide" href="carte" data-cartbar-vide hidden><span class="cartbar__label">Commander<small>Livré sur la plage ou à emporter</small></span>${icon('arrow', 'icon--arrow')}</a>`);
  const sansBoutonVide = ['carte', 'cgv', 'mentions', 'confidentialite', '404'].includes(document.body.dataset.page);
  const maj = () => {
    const n = panier.nb();
    $$('[data-cart-count]').forEach((el) => (el.textContent = n));
    $$('[data-cart-total]').forEach((el) => (el.textContent = euro(panier.sousTotal())));
    $$('[data-cartbar-mode]').forEach((el) => (el.textContent = panier.mode === 'plage' ? 'Livré sur la plage' : 'Retrait au shop'));
    $('[data-cartbar]').hidden = n === 0;
    // panier vide : sur téléphone, un bouton « Commander » reste toujours à portée de pouce
    $('[data-cartbar-vide]').hidden = n > 0 || sansBoutonVide;
  };
  panier.onChange(maj);
  maj();
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) ouvrirPanneau(1);
  });
}

/* ═════════════════════════════════════════════════════════════
   Carte fidélité
   ═════════════════════════════════════════════════════════════ */
// Carte fidélité façon Wallet : effet 3D au survol, tampons qui se posent un à un
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
      <div class="wallet__art"><svg viewBox="0 0 1440 1208" aria-hidden="true"><use href="assets/brand.svg#logo"/></svg><div class="wallet__qr">${CONFIG.lienCarteFidelite ? '<img src="assets/qr-carte-fidelite.svg" alt="" width="78" height="78">' : qr()}</div></div>
      <div class="wallet__fields"><span><small>Client</small><b>Marie</b></span><span style="text-align:right"><small>Récompense</small><b>Un café offert</b></span></div>
      <p class="wallet__note" data-note>Plus que ${TOTAL} tampons pour : un café offert</p>
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
    note.textContent = n >= TOTAL ? 'Bravo ! Ton café est offert.' : `Plus que ${TOTAL - n} tampon${TOTAL - n > 1 ? 's' : ''} pour : un café offert`;
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

// Bouton « Créer ma carte » (page Walty) ; avec un QR code à scanner quand on est sur ordinateur
export function ctaFidelite(el, { clair = true, qr = false } = {}) {
  if (!el) return;
  if (!CONFIG.lienCarteFidelite) {
    el.innerHTML = '<p class="label" style="margin:0">Demande-la au comptoir ou au livreur.</p>';
    return;
  }
  el.innerHTML = `<div class="loyal-cta">
      <a class="btn ${clair ? 'btn--light' : ''} btn--lg" href="${esc(CONFIG.lienCarteFidelite)}" target="_blank" rel="noopener">Créer ma carte ${icon('arrow', 'icon--arrow')}</a>
      <p class="loyal-cta__hint">Gratuit, sans appli · 10 secondes · Apple Wallet ou Google Wallet</p>
    </div>
    ${qr ? `<figure class="loyal-qr"><img src="assets/qr-carte-fidelite.svg" alt="QR code qui ouvre la création de la carte fidélité ADY" width="132" height="132"><figcaption>Sur ordinateur&nbsp;? Scanne-le avec ton téléphone, la carte s’ajoute à ton Wallet.</figcaption></figure>` : ''}`;
}

/* ═════════════════════════════════════════════════════════════
   Données structurées pour Google
   ═════════════════════════════════════════════════════════════ */
// Données structurées ajoutées au chargement (schema.org), à partir des réglages du site :
// les horaires et le téléphone du shop (js/reglages.js) et la carte avec ses prix.
// Elles complètent la fiche « CafeOrCoffeeShop » écrite dans index.html et le-shop.html (même @id).
const JOURS_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const racine = () => {
  const c = document.querySelector('link[rel="canonical"]');
  return c ? new URL(c.href).origin : location.origin;
};
function ajouterDonnees(donnees) {
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(donnees);
  document.head.appendChild(s);
}

// Horaires (regroupés quand plusieurs jours ont les mêmes) et téléphone
export function donneesShop() {
  const groupes = new Map();
  Object.entries(CONFIG.horaires).forEach(([j, h]) => {
    if (!h) return;
    const cle = h.join('-');
    groupes.set(cle, [...(groupes.get(cle) || []), JOURS_SCHEMA[j]]);
  });
  const d = {
    '@context': 'https://schema.org', '@type': 'CafeOrCoffeeShop', '@id': `${racine()}/#shop`,
    openingHoursSpecification: [...groupes].map(([cle, jours]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: jours, opens: cle.split('-')[0], closes: cle.split('-')[1] })),
  };
  if (CONFIG.telephone) d.telephone = CONFIG.telephone;
  ajouterDonnees(d);
}

// La carte : sections, produits et prix (Google peut l'afficher pour « menu Ady Coffee Shop »)
export function donneesCarte() {
  if (!catalogue.produits.length) return;
  ajouterDonnees({
    '@context': 'https://schema.org', '@type': 'Menu', '@id': `${racine()}/carte#menu`, name: 'La carte d’Ady Coffee Shop', inLanguage: 'fr',
    hasMenuSection: catalogue.categories.map((c) => ({
      '@type': 'MenuSection', name: c.titre,
      hasMenuItem: catalogue.produits.filter((p) => p.cat === c.id).map((p) => ({
        '@type': 'MenuItem', name: p.nom, ...(p.desc ? { description: p.desc } : {}),
        offers: { '@type': 'Offer', price: p.prix.toFixed(2), priceCurrency: 'EUR', availability: `https://schema.org/${p.epuise ? 'OutOfStock' : 'InStock'}` },
      })),
    })).filter((s) => s.hasMenuItem.length),
  });
}
