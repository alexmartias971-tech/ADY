// Chargé avant l'affichage : l'écran de chargement n'apparaît qu'à la première page de la visite.
try {
  if (sessionStorage.getItem('ady-vu')) document.documentElement.classList.add('deja-vu');
} catch (e) { /* navigation privée stricte */ }
