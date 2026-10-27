// Carte interactive (Leaflet + OpenStreetMap), chargée seulement quand on en a besoin
import { CONFIG } from './config.js';
import { zone } from './data.js';

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

export function iconePin(L) {
  return L.divIcon({
    className: 'ady-pin',
    html: '<svg viewBox="0 0 40 52" aria-hidden="true"><path d="M20 50 C 6 34 2 26 2 19 A18 18 0 0 1 38 19 C 38 26 34 34 20 50Z" fill="#bf472c" stroke="#2a1810" stroke-width="3"/><circle cx="20" cy="19" r="7" fill="#fbe9d6"/></svg>',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
  });
}

// Carte « vitrine » : zone de livraison + shop (pages Livraison et Le shop)
export async function carteVitrine(el, { centrer = 'zone' } = {}) {
  let L;
  try {
    L = await chargerLeaflet();
  } catch {
    el.innerHTML = '<p style="padding:20px">La carte n’a pas pu se charger.</p>';
    return null;
  }
  const z = zone();
  const map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([z.centre.lat, z.centre.lng], 15);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  L.circle([z.centre.lat, z.centre.lng], { radius: z.rayonMetres, color: '#bf472c', weight: 3, dashArray: '8 8', fillColor: '#bf472c', fillOpacity: 0.08, interactive: false }).addTo(map);
  if (CONFIG.shop) L.marker([CONFIG.shop.lat, CONFIG.shop.lng], { icon: iconeShop(L), keyboard: false, title: 'Ady Coffee Shop' }).addTo(map);
  const bornes = L.latLng(z.centre.lat, z.centre.lng).toBounds(z.rayonMetres * 2);
  if (centrer === 'shop' && CONFIG.shop) bornes.extend([CONFIG.shop.lat, CONFIG.shop.lng]);
  map.fitBounds(bornes, { padding: [20, 20], animate: false });
  setTimeout(() => map.invalidateSize(), 100);
  return map;
}
