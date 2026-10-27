// ─────────────────────────────────────────────────────────────
//  ADY COFFEE SHOP — réglages du site
//  Ce fichier est lu par le site ET par l'API de commande (api/order.js).
//  Tout ce qui est marqué « À CONFIRMER » est une valeur provisoire.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  nom: 'Ady Coffee Shop',
  slogan: 'Une véritable Adyction',

  // Coordonnées (À CONFIRMER)
  adresse: 'Durivage, 97180 Sainte-Anne, Guadeloupe',
  telephone: '',            // ex. '0690 12 34 56' (affiché + bouton « Appeler »)
  whatsapp: '',             // ex. '590690123456' (format international, sans + ni espaces)
  instagram: '',            // ex. 'https://www.instagram.com/votrecompte/'
  lienCarteFidelite: '',    // lien d'inscription à la carte fidélité (Wallet), sinon laissez vide
  lienItineraire: 'https://www.google.com/maps/search/?api=1&query=Ady+Coffee+Sainte-Anne+Guadeloupe',

  // Commande & livraison plage
  commandeMinimum: 5,       // € — montant minimum (hors frais) pour se déplacer
  fraisLivraison: 0,        // € — mettre 1 ou 2 pour facturer la livraison
  delaiLivraison: '15 à 20 min',
  photoObligatoire: true,   // photo du spot obligatoire pour valider
  paiements: [
    { id: 'especes', label: 'Espèces' },
    { id: 'carte', label: 'Carte bancaire (TPE)' },
  ],

  // Zone de livraison : cercle autour de la plage de la Caravelle.
  // Centre et rayon calés sur le contour de la plage dans OpenStreetMap (à confirmer sur place).
  zone: {
    nom: 'Plage de la Caravelle',
    centre: { lat: 16.2181, lng: -61.3965 },
    rayonMetres: 420,
  },
  // Position du coffee shop sur la carte (quartier Durivage, À VÉRIFIER : clic droit sur Google Maps → coordonnées)
  shop: { lat: 16.2234, lng: -61.3978 },

  // Horaires, heure de Guadeloupe (À CONFIRMER). 0 = dimanche … 6 = samedi. null = fermé.
  horaires: {
    0: ['08:00', '17:00'],
    1: null,
    2: ['07:30', '18:00'],
    3: ['07:30', '18:00'],
    4: ['07:30', '18:00'],
    5: ['07:30', '18:00'],
    6: ['08:00', '18:00'],
  },
  // Dernière commande plage acceptée X minutes avant la fermeture
  livraisonStopAvantFermeture: 30,
  // true = on refuse les commandes hors horaires (laissez false tant que les horaires ne sont pas validés)
  bloquerHorsHoraires: false,
};
