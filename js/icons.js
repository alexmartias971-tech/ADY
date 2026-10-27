// Pictogrammes de la marque (style linogravure, une couleur = currentColor)
// et icônes d'interface. Usage : icon('palm'), icon('arrow', 'cls').

const PICTOS = {
  sun: '<circle cx="24" cy="24" r="9.5"/><g fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M24 4.5v5M24 38.5v5M4.5 24h5M38.5 24h5M10.2 10.2l3.5 3.5M34.3 34.3l3.5 3.5M10.2 37.8l3.5-3.5M34.3 13.7l3.5-3.5"/></g>',
  palm: '<path d="M24.5 45c1-9 .5-18-3-26l-2 .8c3 7.7 3.5 16.2 2 25.2Z"/><path d="M20.5 18C15 11 8 10 3 14c6-1 11 1 17.5 4ZM20.5 18c-6.5-1-12.5 2-15.5 8 5-4 10-6 15.5-8ZM20.5 18c-.5-7 2.5-12 8.5-14-4 5-6 9-8.5 14ZM20.5 18c5.5-6 13.5-7 19.5-3-7-1-13 0-19.5 3ZM20.5 18c6.5-1 12.5 2 15.5 9-5-5-10-7-15.5-9Z"/><circle cx="21.5" cy="20.5" r="2"/><circle cx="24.2" cy="19.6" r="1.8"/>',
  cup: '<path d="M27 14 31 3.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="10" y="11" width="28" height="4.5" rx="2"/><path d="M12 16.5 15.5 44h17L36 16.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M13.7 29 15.5 42.5h17L34.3 29Z"/><rect x="17" y="20" width="6" height="6" rx="1.6" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="25" y="22.5" width="6" height="6" rx="1.6" fill="none" stroke="currentColor" stroke-width="2.4" transform="rotate(14 28 25.5)"/>',
  bean: '<path fill-rule="evenodd" d="M24 6c10 0 16 10 13 22s-15 16-22 10S9 18 14 12c3-4 6-6 10-6Zm-.8 1.5c-5.7 7.5 5.8 18-2 33l2.4.3c8-15.3-3.4-25.8 2.2-33.2Z"/>',
  wave: '<g fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"><path d="M3 19c5-6 10-6 15 0s10 6 15 0 8-5 12-2"/><path d="M3 31c5-6 10-6 15 0s10 6 15 0 8-5 12-2"/></g>',
  hat: '<path d="M3 31c0-4 10-6 21-6s21 2 21 6-10 6-21 6S3 35 3 31Z"/><path fill-rule="evenodd" d="M15 27.5c-.5-10 3.5-16.5 9-16.5s9.5 6.5 9 16.5Zm.3-5.2h17.4v2.6H15.3Z"/>',
  moka: '<rect x="21" y="3" width="6" height="4.5" rx="1.2"/><path fill-rule="evenodd" d="M15 8h18l2.5 14h-23Zm5.5 2.2v10h1.5v-10Zm5.6 0v10h1.5v-10Z"/><rect x="13.5" y="22.5" width="21" height="3.6" rx="1"/><path fill-rule="evenodd" d="M12.5 26.6h23L33 44H15Zm7.4 2v13.5h1.6V28.6Zm6.6 0v13.5h1.6V28.6Z"/><path d="M15.3 9.5 8.5 11.2l4.8 3.6Z"/><path d="M33 10.5c8 0 8.6 10.5 2 11" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>',
  can: '<path fill-rule="evenodd" d="M18 5h12l3 4v30l-3 4H18l-3-4V9Zm-1 8v1.8h14V13Zm0 21.4v1.8h14v-1.8ZM20 18.5l3.6-1 1 3.6-3.6 1Zm5.6 3.2 3.4 1.4-1.4 3.4-3.4-1.4Zm-4.4 4.4 3.5.4-.4 3.5-3.5-.4Z"/>',
  pin: '<path fill-rule="evenodd" d="M24 45S10 32.4 10 22a14 14 0 0 1 28 0c0 10.4-14 23-14 23Zm0-17a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/>',
  camera: '<path fill-rule="evenodd" d="M6 14h8l3.5-5h13l3.5 5h8v26H6Zm18 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-3.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9ZM35 18v3h4v-3Z"/>',
  card: '<path fill-rule="evenodd" d="M7 11h34a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Zm2 7v3.2h15V18Zm0 7v2.4h10V25Zm25.5 6a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>',
  gift: '<path fill-rule="evenodd" d="M6 16h36v8H6Zm3 10h30v17H9Zm13-10v27h4V16ZM24 15c-3-7-11-8-11-3 0 3 5 3 11 3Zm0 0c3-7 11-8 11-3 0 3-5 3-11 3Z"/>',
  star: '<path d="M24 4.5c1.6 9.7 5.6 13.9 15 15.5-9.4 1.6-13.4 5.8-15 15.5-1.6-9.7-5.6-13.9-15-15.5 9.4-1.6 13.4-5.8 15-15.5Z"/>',
};

const UI = {
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bag: '<path d="M5.5 8.5h13l-1 11.5h-11Z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  pin: '<path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  card: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h3"/>',
  camera: '<path d="M4 8h3.2l1.8-2.5h6L16.8 8H20v11H4Z"/><circle cx="12" cy="13.2" r="3.4"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 16l5-4.5 4 3.5 3-2.5 5 4"/><circle cx="15.5" cy="9.5" r="1.5"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5L16 13l4 1.5v3A2.5 2.5 0 0 1 17.5 20 14 14 0 0 1 4 6.5 2.5 2.5 0 0 1 6.5 4Z"/>',
  locate: '<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16"/>',
  insta: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6" fill="currentColor"/>',
  chat: '<path d="M4.5 18.5 5.6 15A7.5 7.5 0 1 1 9 18.3Z"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
};

export function picto(name, cls = '') {
  return `<svg class="picto ${cls}" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">${PICTOS[name] || ''}</svg>`;
}

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI[name] || ''}</svg>`;
}

// Remplit les <i data-picto="palm"> et <i data-icon="arrow"> présents dans le HTML
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-picto]').forEach((el) => { el.outerHTML = picto(el.dataset.picto, el.className); });
  root.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon, el.className); });
}

export const PICTO_NAMES = Object.keys(PICTOS);
