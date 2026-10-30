// ─────────────────────────────────────────────────────────────
//  ADY COFFEE SHOP — réglages du site (textes, contact, horaires, paiements, liens)
//  La carte, les prix, le minimum plage et la zone se gèrent dans le back-office (/admin).
//  La connexion à la base est dans config.js, à la racine.
//  Tout ce qui est marqué « À CONFIRMER » est une valeur provisoire.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  nom: 'Ady Coffee Shop',
  slogan: 'Une véritable Adyction',

  // Coordonnées (À CONFIRMER)
  adresse: 'Durivage, 97180 Sainte-Anne, Guadeloupe',
  telephone: '',            // ex. '0690 12 34 56' (affiché + bouton « Appeler »)
  whatsapp: '',             // ex. '590690123456' (format international, sans + ni espaces)
  instagram: 'https://www.instagram.com/adycoffeeshop/',
  instagramPseudo: '@adycoffeeshop',
  preuveSociale: '2 300+ personnes nous suivent déjà sur Instagram', // laisser vide pour ne rien afficher
  lienCarteFidelite: 'https://carte.walty.fr/ady-coffee-shop', // création de la carte fidélité digitale (Walty), vide = pas de bouton
  lienItineraire: 'https://www.google.com/maps/search/?api=1&query=Ady+Coffee+Sainte-Anne+Guadeloupe',

  // Livraison plage (le minimum de commande se règle dans le back-office)
  commandeMinimum: 5,       // € — valeur affichée tant que la carte n'est pas chargée
  fraisLivraison: 0,        // € — mettre 1 ou 2 pour facturer la livraison
  delaiLivraison: '15 à 20 min',
  paiements: [
    { id: 'especes', label: 'Espèces' },
    { id: 'carte', label: 'Carte bancaire (TPE)' },
  ],

  // Plage livrée. Les points de livraison (panneau ADY, grand cocotier…) se gèrent
  // dans le back-office ; le centre ne sert qu'à cadrer la carte s'il n'y a aucun point.
  zone: {
    nom: 'Plage de la Caravelle',
    centre: { lat: 16.2181, lng: -61.3965 },
    // carte illustrée de la plage (dessinée d'après OpenStreetMap) et le rectangle qu'elle couvre
    fond: { image: 'assets/carte-caravelle.svg', bornes: [[16.2146, -61.4014], [16.2246, -61.3910]] },
    // étiquette posée sur le sable
    etiquette: { lat: 16.21858, lng: -61.39800, angle: 37 },
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
