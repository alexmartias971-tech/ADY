// ─────────────────────────────────────────────────────────────
//  LA CARTE — produits, prix et options
//  ⚠️ Carte et prix PROVISOIRES : remplacez-les par la vraie carte d'Ady.
//  Ce fichier est aussi lu par l'API : le prix est toujours recalculé côté serveur.
//
//  Pour chaque produit :
//    id       identifiant unique (minuscules, tirets)
//    cat      id de la catégorie
//    prix     en euros (5.5 = 5,50 €)
//    options  groupes d'options proposés (voir OPTIONS)
//    dispo    false = affiché « Bientôt » et non commandable
//    visuel   illustration animée générée (type : iced, hot, espresso, frappe,
//             can, cookie, cake, croissant, bowl, toast)
//    photo    (facultatif) chemin d'une photo, ex. 'assets/produits/iced-latte.jpg'
// ─────────────────────────────────────────────────────────────

export const OPTIONS = {
  lait: {
    label: 'Lait',
    choix: [
      { id: 'entier', label: 'Lait entier', prix: 0 },
      { id: 'avoine', label: 'Avoine', prix: 0.5 },
      { id: 'coco', label: 'Coco', prix: 0.5 },
      { id: 'amande', label: 'Amande', prix: 0.5 },
    ],
  },
  sirop: {
    label: 'Sirop',
    choix: [
      { id: 'sans', label: 'Sans sirop', prix: 0 },
      { id: 'vanille', label: 'Vanille', prix: 0.5 },
      { id: 'caramel', label: 'Caramel', prix: 0.5 },
      { id: 'noisette', label: 'Noisette', prix: 0.5 },
      { id: 'coco', label: 'Coco', prix: 0.5 },
    ],
  },
  sucre: {
    label: 'Sucre',
    choix: [
      { id: 'normal', label: 'Normal', prix: 0 },
      { id: 'peu', label: 'Peu sucré', prix: 0 },
      { id: 'sans', label: 'Sans sucre', prix: 0 },
    ],
  },
};

export const CATEGORIES = [
  { id: 'iced', label: 'Iced & cold' },
  { id: 'hot', label: 'Cafés chauds' },
  { id: 'matcha', label: 'Matcha & co' },
  { id: 'fresh', label: 'Fraîcheur' },
  { id: 'food', label: 'À grignoter' },
];

export const PRODUITS = [
  // Iced & cold
  { id: 'iced-latte', cat: 'iced', nom: 'Iced latte', prix: 5, tag: 'Best-seller',
    desc: 'Double espresso, lait frais et beaucoup de glaçons. Le classique de la plage.',
    options: ['lait', 'sirop'], visuel: { type: 'iced', bas: '#ead2b0', haut: '#7a4526' } },
  { id: 'iced-caramel', cat: 'iced', nom: 'Iced caramel latte', prix: 5.5,
    desc: 'Espresso, lait, sirop caramel et un filet de caramel sur les parois.',
    options: ['lait'], visuel: { type: 'iced', bas: '#efcf9c', haut: '#9a5a2c', filet: '#b8692a' } },
  { id: 'cold-brew', cat: 'iced', nom: 'Cold brew', prix: 4.5, tag: 'Infusé 18 h',
    desc: 'Café infusé à froid toute une nuit. Doux, intense, servi en canette bien fraîche.',
    visuel: { type: 'can' } },
  { id: 'iced-americano', cat: 'iced', nom: 'Iced americano', prix: 4,
    desc: 'Espresso allongé d’eau fraîche, sur glace. Simple et efficace.',
    options: ['sirop'], visuel: { type: 'iced', bas: '#3b2014', haut: '#5a301b' } },
  { id: 'frappe-caramel', cat: 'iced', nom: 'Frappé caramel', prix: 6,
    desc: 'Café mixé avec glace et lait, chantilly et sauce caramel.',
    options: ['lait'], visuel: { type: 'frappe', bas: '#e3c09a', haut: '#c99566', filet: '#a95a22' } },

  // Cafés chauds
  { id: 'espresso', cat: 'hot', nom: 'Espresso', prix: 2,
    desc: 'Court, corsé, une belle crème noisette.',
    visuel: { type: 'espresso' } },
  { id: 'americano', cat: 'hot', nom: 'Americano', prix: 3,
    desc: 'Espresso allongé à l’eau chaude.',
    options: ['sirop'], visuel: { type: 'hot', couvercle: '#2a1810' } },
  { id: 'cappuccino', cat: 'hot', nom: 'Cappuccino', prix: 4,
    desc: 'Espresso, lait chaud et mousse de lait onctueuse.',
    options: ['lait', 'sirop'], visuel: { type: 'hot', couvercle: '#bf472c' } },
  { id: 'latte', cat: 'hot', nom: 'Latte', prix: 4.5,
    desc: 'Espresso et beaucoup de lait velouté.',
    options: ['lait', 'sirop'], visuel: { type: 'hot', couvercle: '#fbe9d6' } },
  { id: 'flat-white', cat: 'hot', nom: 'Flat white', prix: 4.5,
    desc: 'Double ristretto et lait micro-moussé, plus serré qu’un latte.',
    options: ['lait'], visuel: { type: 'hot', couvercle: '#9ccbe0' } },

  // Matcha & co
  { id: 'iced-matcha', cat: 'matcha', nom: 'Iced matcha latte', prix: 5.5, tag: 'Coup de cœur',
    desc: 'Matcha fouetté, lait frais, glaçons. Vert, frais, addictif.',
    options: ['lait', 'sucre'], visuel: { type: 'iced', bas: '#e6efd2', haut: '#8fb651' } },
  { id: 'matcha-latte', cat: 'matcha', nom: 'Matcha latte chaud', prix: 5,
    desc: 'Matcha et lait chaud mousseux.',
    options: ['lait', 'sucre'], visuel: { type: 'hot', couvercle: '#8fb651' } },
  { id: 'iced-chai', cat: 'matcha', nom: 'Iced chaï latte', prix: 5,
    desc: 'Thé noir aux épices (cannelle, cardamome, gingembre), lait et glace.',
    options: ['lait'], visuel: { type: 'iced', bas: '#ecd0ab', haut: '#b47a4b' } },

  // Fraîcheur
  { id: 'smoothie-mangue', cat: 'fresh', nom: 'Smoothie mangue passion', prix: 6,
    desc: 'Mangue, fruit de la passion et banane, mixés minute.',
    visuel: { type: 'iced', bas: '#f0a03a', haut: '#f6c255', sansGlace: true, fruit: '#f6c255' } },
  { id: 'limonade', cat: 'fresh', nom: 'Limonade citron vert', prix: 4,
    desc: 'Citron vert pressé, menthe, eau pétillante. La meilleure contre le soleil.',
    options: ['sucre'], visuel: { type: 'iced', bas: '#e7efb6', haut: '#d6e58a', fruit: '#a8c94a' } },

  // À grignoter
  { id: 'cookie', cat: 'food', nom: 'Cookie choco', prix: 3,
    desc: 'Gros cookie moelleux aux pépites de chocolat.',
    visuel: { type: 'cookie' } },
  { id: 'banana-bread', cat: 'food', nom: 'Banana bread', prix: 3.5,
    desc: 'Cake banane maison, la tranche.',
    visuel: { type: 'cake' } },
  { id: 'croissant', cat: 'food', nom: 'Croissant', prix: 2,
    desc: 'Pur beurre, doré comme il faut.',
    visuel: { type: 'croissant' } },
  { id: 'acai-bowl', cat: 'food', nom: 'Açaí bowl', prix: 9,
    desc: 'Açaí, banane, granola, fruits frais et miel. Californian style.',
    visuel: { type: 'bowl' } },
  { id: 'avocado-toast', cat: 'food', nom: 'Avocado toast', prix: 8.5,
    desc: 'Pain de campagne grillé, avocat, citron vert, graines et piment.',
    visuel: { type: 'toast' } },
];

// Utilitaires partagés (site + API)
export function trouverProduit(id) {
  return PRODUITS.find((p) => p.id === id);
}

// Calcule le prix unitaire d'une ligne avec ses options. Renvoie null si invalide.
export function prixLigne(produit, choix = {}) {
  let prix = produit.prix;
  for (const groupe of produit.options || []) {
    const def = OPTIONS[groupe];
    const valeur = choix[groupe] ?? def.choix[0].id;
    const c = def.choix.find((x) => x.id === valeur);
    if (!c) return null;
    prix += c.prix;
  }
  return Math.round(prix * 100) / 100;
}

export function libelleOptions(produit, choix = {}) {
  return (produit.options || [])
    .map((g) => {
      const def = OPTIONS[g];
      const c = def.choix.find((x) => x.id === (choix[g] ?? def.choix[0].id));
      // on n'affiche que les choix différents du choix par défaut
      return c && c !== def.choix[0] ? c.label : null;
    })
    .filter(Boolean)
    .join(', ');
}
