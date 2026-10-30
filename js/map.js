// Carte interactive (Leaflet + OpenStreetMap), chargée seulement quand on en a besoin
import { CONFIG } from './reglages.js';
import { catalogue } from './data.js';
import { esc } from './utils.js';

let chargement = null;

export function chargerLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (!chargement) {
    chargement = new Promise((ok, ko) => {
      if (!document.querySelector('link[href="vendor/leaflet/leaflet.css"]')) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'vendor/leaflet/leaflet.css';
        document.head.appendChild(l);
      }
      const s = document.createElement('script');
      s.src = 'vendor/leaflet/leaflet.js';
      s.onload = () => ok(window.L);
      s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  return chargement;
}

export function iconeShop(L) {
  return L.divIcon({ className: '', html: '<div class="ady-shop" title="Ady Coffee Shop"><svg viewBox="0 0 728 584"><use href="assets/brand.svg#st-head"/></svg></div>', iconSize: [46, 46], iconAnchor: [23, 23] });
}

// Repère d'un point de livraison : drapeau terracotta numéroté
export function iconePoint(L, n) {
  return L.divIcon({
    className: 'ady-point',
    html: `<span class="ady-point__n">${n}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Carte « vitrine » : points de livraison + shop (pages Livraison et Le shop)
export async function carteVitrine(el, { centrer = 'points' } = {}) {
  let L;
  try {
    L = await chargerLeaflet();
  } catch {
    el.innerHTML = '<p style="padding:20px">La carte n’a pas pu se charger.</p>';
    return null;
  }
  const c = CONFIG.zone.centre;
  const map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([c.lat, c.lng], 16);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  const bornes = L.latLngBounds([]);
  catalogue.points.forEach((p, i) => {
    L.marker([p.lat, p.lng], { icon: iconePoint(L, i + 1), title: p.nom, keyboard: false })
      .bindPopup(`<div class="point-pop">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ''}<b>${esc(p.nom)}</b>${p.indication ? `<span>${esc(p.indication)}</span>` : ''}</div>`, { maxWidth: 220 })
      .addTo(map);
    bornes.extend([p.lat, p.lng]);
  });
  if (CONFIG.shop) L.marker([CONFIG.shop.lat, CONFIG.shop.lng], { icon: iconeShop(L), keyboard: false, title: 'Ady Coffee Shop' }).addTo(map);
  if (!bornes.isValid()) bornes.extend([c.lat, c.lng]);
  if (centrer === 'shop' && CONFIG.shop) bornes.extend([CONFIG.shop.lat, CONFIG.shop.lng]);
  map.fitBounds(bornes.pad(0.25), { maxZoom: 17, animate: false });
  setTimeout(() => map.invalidateSize(), 100);
  return map;
}
