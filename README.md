# Ady Coffee Shop

Site du **Californian coffee shop Ady** (Durivage, Sainte-Anne, Guadeloupe) : vitrine, commande en ligne **livrée sur la plage de la Caravelle** ou **à retirer au shop**, suivi de commande en direct, back-office pour le gérant et espace pour le livreur.

- HTML, CSS et JavaScript **sans étape de build** : ce qui est dans le dossier est exactement ce qui est mis en ligne.
- Commandes, carte, stock et réglages dans **Supabase** ; le gérant gère tout depuis **`/admin`**, le livreur suit ses livraisons sur **`/livreur`**.
- Tant que `config.js` est vide, tout tourne en **mode démo** dans le navigateur (rien à installer).

---

## Démarrer en 1 minute

```bash
npx serve .
```

Puis ouvre l’adresse affichée (souvent http://localhost:3000).

- Il faut un petit serveur : les pages ne marchent pas en double-cliquant sur le fichier, et les liens sont « sans .html » (`/carte`, `/livraison`…), ce que `serve` gère comme Vercel. Évite l’extension *Live Server*, qui ne les gère pas.
- **Démo complète** : passe une commande sur le site, puis ouvre `/admin` dans le **même navigateur** (identifiant **demo.com@gmail.com**, mot de passe **demo**) et accepte-la. Ouvre ensuite `/livreur` (même compte) : « Je pars avec », « Je suis au point »… Le client voit chaque étape sur le site, jusqu’à « Ton livreur est là ».
- Le bandeau « Site de démonstration » disparaît tout seul quand `config.js` est rempli.
- **QR code d’un point de livraison** : ouvre `/carte?point=panneau-ady`, le point est déjà choisi.

---

## Arborescence

```
ady-coffee-shop/                 75 fichiers, 5 dossiers
├── index.html                   Accueil
├── carte.html                   La carte (façon ardoise) + panier
├── livraison.html               Livraison plage : étapes, points de livraison, questions
├── fidelite.html                Carte fidélité (lien Walty, QR code)
├── le-shop.html                 Photos, adresse, horaires, contact
├── cgv.html, mentions-legales.html, confidentialite.html, 404.html
├── admin.html                   Back-office du gérant (/admin)
├── livreur.html                 Espace livreur (/livreur)
├── apercu.html                  Aperçu en direct d’un produit (affiché dans Carte & prix)
├── config.js                    ★ Connexion Supabase (vide = mode démo)
├── vercel.json                  URL sans .html + en-têtes de sécurité
├── sitemap.xml, robots.txt, llms.txt, site.webmanifest   Référencement (adresse du site écrite dedans)
│
├── css/
│   ├── style.css                Tout le style du site, polices comprises (sommaire en tête)
│   ├── admin.css                Style du back-office et de l’espace livreur
│   └── leaflet.css              Bibliothèque des cartes
│
├── js/
│   ├── reglages.js              ★ Textes, contact, horaires, paiements, liens, carte de la plage
│   ├── main.js                  Point d’entrée de chaque page (+ écran de chargement)
│   ├── boot.js                  Mini-script lu avant l’affichage (chargement une fois par visite)
│   ├── ui.js                    Commun à toutes les pages : en-tête, statut, panier, carte fidélité, données pour Google
│   ├── data.js                  Carte, réglages, commandes, suivi + le panier
│   ├── produits.js              Cartes et lignes produit, ajout au panier, fiche produit
│   ├── checkout.js              Commande sur un seul écran, suivi en direct, photos des points en grand
│   ├── pages.js                 Script propre à chaque page (accueil, carte, livraison…) + cartes de la plage
│   ├── utils.js                 Icônes, horaires d’ouverture, petits outils
│   ├── illustrations.js         Dessins des boissons et plats (SVG générés)
│   ├── scene.js                 Scène « Livré les pieds dans le sable »
│   ├── apercu.js                Aperçu en direct pour le back-office
│   ├── admin.js                 Back-office du gérant
│   ├── livreur.js               Espace livreur
│   ├── demo.js                  Mode démo : fausse base dans le navigateur (à ignorer en production)
│   └── leaflet.js, supabase.js, qrcode.js   Bibliothèques incluses (licences en tête de fichier)
│
├── assets/                      Toutes les images et polices, à plat :
│                                logo, brand.svg, carte-caravelle.svg (la plage dessinée),
│                                photo-*.webp, merch-*.webp (t-shirts), point-*.svg (points de livraison), *.woff2
├── api/walty.js                 Lien avec la carte fidélité Walty (fonction Vercel, clé secrète côté serveur)
└── supabase/
    ├── schema.sql               Base de données, règles de sécurité, fonctions de commande
    └── seed.sql                 La carte de départ (à lancer une seule fois)
```

---

## Où modifier quoi

| Je veux changer… | Où |
|---|---|
| Prix, produits (ajouter, retirer), descriptions, allergènes, options | Back-office `/admin` → *Carte & prix* : touche un produit, l’aperçu du site s’affiche à côté (rien à coder) |
| Un produit en rupture | Back-office `/admin` → *Épuisé ?* (un interrupteur), ou directement en refusant une commande |
| Points de livraison sur la plage : nom, photo, position (glisser sur la carte), QR code à imprimer | Back-office `/admin` → *Points plage* |
| Comptes de l’équipe (gérant, livreur) | Supabase, voir « Mise en service » |
| Minimum plage, horaires du salé, couper les commandes ou la livraison | Back-office `/admin` → *Réglages* |
| Téléphone, WhatsApp, horaires d’ouverture, adresse, Instagram, lien de la carte fidélité, délai de livraison | `js/reglages.js` |
| Connexion à la base | `config.js` (voir « Mise en service ») |
| Couleurs | Variables en haut de `css/style.css` (`--terra`, `--cream`…) |
| Un texte d’une page | Le fichier `.html` de la page |
| L’en-tête ou le pied de page | Ils sont répétés dans chaque fichier `.html` : à modifier dans tous |
| Une photo | `assets/photo-….webp` ou `assets/merch-….webp` (même nom de fichier = rien d’autre à changer) |
| Un dessin de boisson | `js/illustrations.js` (le dessin est choisi d’après le nom du produit) |
| Les textes légaux | `cgv.html`, `mentions-legales.html`, `confidentialite.html` (les infos manquantes sont marquées **DEMO**) |

---

## Comment ça marche

### Le parcours client
Pensé pour quelqu’un sur la plage, au soleil, avec son téléphone : commander en 20 secondes.

1. **Accueil** : « Bouge pas. Ton café arrive. » et deux gros boutons, « Livre-moi sur la plage » ou « Je passe le chercher », visibles sans défiler.
2. **Les plus commandées** (mises en avant dans le back-office), ajoutables en un geste.
3. **20 secondes pour commander** : trois étapes courtes (Choisis, Dis-nous où, C’est là).
4. **Fidélité**, puis **passe nous voir** (adresse, horaires).

Une barre « Commander » reste en bas de l’écran sur toutes les pages.

### Les points de livraison
Le shop pose des repères fixes sur la plage (le panneau ADY, le grand cocotier…), chacun avec **sa photo** et sa position. Le client choisit le sien en commandant ; le livreur l’y attend et le prévient. Chaque point a son **QR code** à coller sur le panneau : en le scannant, le client arrive sur la carte avec son point déjà choisi. Le bouton « Trouver le point le plus proche » trie les points avec la position du téléphone, sans jamais l’envoyer.

### La commande
Un seul écran, qui s’ouvre depuis le panier.
- **Plage** : le panier (minimum 5 €), **1.** le point de livraison (déjà choisi si on vient du QR code) et un signe facultatif, **2.** prénom, nom, téléphone, paiement, puis « Commander avec obligation de paiement » → **suivi en direct**.
- **Shop** : le panier (pas de minimum), **1.** l’heure de passage, **2.** prénom, nom, paiement au comptoir → suivi.
- Les infos du client et son dernier point sont mémorisés s’il le demande : la fois suivante, c’est 3 gestes.
- **Fidélité** : rien à saisir. Le client montre son QR code au livreur ou au comptoir au moment de payer.

### Le gérant (`/admin`)
Idéal sur une tablette au comptoir, et pensé aussi pour le téléphone (une étape à la fois).
- **Commandes** : chaque commande arrive **en direct** avec un son (bouton « Son », à activer une fois). **Accepter** ou **Refuser** : le refus demande un motif que le client voit (« Un produit est épuisé », « Trop de commandes »…) ; pour un produit épuisé, une case le marque « Épuisé » sur le site en même temps. Ensuite : *Prête : le livreur part* → *Livreur au point* → *Livrée* (plage) ou *Prête au comptoir* → *Récupérée* (shop).
- **Épuisé ?** : un interrupteur par produit.
- **Carte & prix** : chaque produit est une vignette avec son dessin. On la touche : une fiche simple s’ouvre (nom, prix, description, allergènes, options, « sur l’accueil »…) et, à côté, **l’aperçu du site en direct** montre le résultat pendant qu’on tape. Tout est enregistré automatiquement.
- **Clients** : les clients du site (commandes, montant, dernière visite, plage ou shop) et, quand Walty est relié, leurs **tampons de fidélité** sur la même ligne (voir « Relier Walty »).
- **Points plage** : glisser chaque numéro sur la carte illustrée (ou « Prendre ma position ici » sur place), changer la photo, imprimer le QR code. Un point sans photo n’est pas proposé aux clients.
- **Réglages** : couper les commandes ou la livraison plage, minimum, horaires du salé ; c’est aussi là qu’apparaîtra l’interrupteur du **paiement en ligne** (voir plus bas).

### Le livreur (`/livreur`)
Sur son téléphone, de gros boutons, trois gestes par livraison :
1. **À récupérer au shop** : les commandes plage acceptées. « Je pars avec ».
2. **À livrer** : la photo du point, son nom, le signe du client, ce qu’il faut encaisser. « Itinéraire » puis **« Je suis au point »** : le téléphone du client affiche aussitôt « Ton livreur est là » avec la photo du point, et le livreur envoie un **message WhatsApp ou SMS déjà écrit** en un geste (ou appelle).
3. **« Livrée et encaissée »**. En bas : les livraisons du jour et le total encaissé.

L’écran reste allumé pendant les livraisons, et un son prévient quand une nouvelle commande est à récupérer.

### Le suivi
À la commande, la base renvoie un numéro et un **jeton secret**. Le téléphone du client demande l’étape toutes les 6 secondes (`order_status`, qui ne renvoie ni nom ni téléphone) : Reçue → En préparation → En route → **Ton livreur est là** → Livrée. Une commande refusée affiche le motif et « Rien à payer ». Le suivi reste 8 heures sur le téléphone : une pastille en haut de l’écran y ramène.

---

## Mise en service

### 1. Supabase (10 min)
1. Crée un projet sur supabase.com. Région : **eu-west-3 (Paris)** conseillée pour le RGPD.
2. *SQL Editor* : colle `supabase/schema.sql` puis *Run*. Ensuite `supabase/seed.sql` puis *Run* (une seule fois). Si la base existe déjà, relance seulement `schema.sql` : il ajoute ce qui manque sans toucher aux données.
3. *Authentication → Providers → Email* : désactive « Allow new users to sign up ».
4. *Authentication → Users → Add user* : crée le compte du gérant, et un compte par livreur.
5. Donne-leur l’accès (*SQL Editor*) :
   ```sql
   -- le gérant : tout le back-office (/admin) et l'espace livreur
   insert into public.admins (user_id, role)
   select id, 'gerant' from auth.users where email = 'email-du-gerant@exemple.com';
   -- un livreur : uniquement /livreur (les livraisons plage)
   insert into public.admins (user_id, role)
   select id, 'livreur' from auth.users where email = 'email-du-livreur@exemple.com';
   ```
6. *Project Settings → API* : copie `Project URL` et la clé `anon public` dans `config.js`.
   La clé *anon* est faite pour être publique (la sécurité repose sur les règles de la base). Ne mets **jamais** la clé `service_role` dans le site.
7. **Les points de livraison** : `/admin` → *Points plage*. Glisse chaque numéro à sa place sur la carte (ou, sur la plage, touche « Prendre ma position ici »), puis « Changer la photo ». Imprime chaque « QR code à imprimer » et colle-le sur son panneau. Sans point actif, la livraison plage n’est pas proposée.

### 2. GitHub → Vercel
1. Envoie le contenu du dossier sur GitHub (`index.html` à la racine). Sur le site GitHub, *Add file → Upload files* accepte 100 fichiers à la fois : le projet en a 75, il passe en une fois (glisse le contenu du dossier, pas le dossier lui-même).
2. Vercel : *Add New… → Project → Import*, nom du projet **en minuscules**, preset **Other**, ne touche ni à Build ni à Output, *Deploy*.
3. Chaque *commit* redéploie le site. Le back-office est sur `https://ton-site/admin`, l’espace livreur sur `https://ton-site/livreur`.

---

## Sécurité et conformité

- **Base** : prix et totaux recalculés côté serveur, stock vérifié, livraison plage acceptée seulement vers un point actif, anti-abus (3 commandes en 10 min par numéro). Les commandes ne sont lisibles que par l’équipe ; un livreur ne voit que les livraisons plage et ne peut que les faire avancer (`livreur_avance`), sans toucher à la carte, aux prix ni aux réglages. Les photos des points sont publiques et seul le gérant peut les déposer.
- **Navigateur** (`vercel.json`) : CSP (seuls le site et Supabase sont autorisés ; les cartes sont un dessin hébergé sur le site), HSTS, site non intégrable ailleurs. Une image hébergée sur un autre site serait bloquée : mets-la dans `assets/`.
- **RGPD** : polices et bibliothèques hébergées sur le site (aucun appel à Google ni à un CDN), pas de cookie ni de mesure d’audience. Le client n’envoie ni photo ni position. Téléphone, signe et note effacés après 30 jours (purge quotidienne via `pg_cron`, et à chaque ouverture du back-office). Le message du livreur peut passer par WhatsApp : c’est indiqué dans la page Confidentialité.
- **Vente à distance** : CGV (rétractation 14 jours pour les t-shirts avec formulaire), lien CGV + confidentialité avant de commander, bouton « Commander avec obligation de paiement », allergènes affichés dans chaque fiche produit.

## Relier Walty (carte fidélité)
L’onglet *Clients* du back-office affiche les tampons Walty de chaque client à côté de ses commandes. Walty reste la référence : le site lit, ne modifie rien et ne copie rien dans sa base.
1. Walty fournit une adresse d’API et une clé pour le shop. Réponse attendue de `GET {adresse}/clients` (en-tête `Authorization: Bearer {clé}`) :
   ```json
   { "objectif": 10,
     "stats": { "cartes": 128, "passages_mois": 342, "cadeaux_mois": 21 },
     "clients": [ { "prenom": "Léa", "nom": "Martin", "telephone": "0690112233", "tampons": 7, "cadeaux": 1, "derniere_visite": "2026-10-28T15:04:00Z" } ] }
   ```
2. Vercel → *Settings → Environment Variables* : `WALTY_API_URL`, `WALTY_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (les mêmes que `config.js`), puis *Redeploy*.
3. `api/walty.js` vérifie que la demande vient bien du gérant connecté avant de répondre. En démo, l’onglet montre un exemple.

## Paiement en ligne (à venir)
Pas encore branché : le client paie à la livraison ou au comptoir. Pour l’ajouter : le shop crée son compte **Stripe** (pays France, SIRET, IBAN), puis on ajoute une fonction Vercel qui recalcule le total depuis la base et ouvre la page de paiement Stripe (carte, Apple Pay, Google Pay). Les clés Stripe vont dans les variables Vercel, jamais dans le site. Le back-office a déjà son emplacement : *Réglages → Paiement en ligne*.

## Référencement (Google)
Déjà fait dans le site : titres et descriptions travaillés page par page, un titre principal (H1) avec le nom et le lieu, adresses canoniques, données structurées (fiche *Café / coffee shop* avec adresse, position, horaires, carte et prix, livraison plage, questions fréquentes), `sitemap.xml`, `robots.txt`, `llms.txt` (pour les assistants IA), manifeste, site rapide, mobile et en HTTPS.

**Adresse du site** : tout est écrit pour `https://ady-coffee-shop.vercel.app`. Si le site a une autre adresse ou un nom de domaine, remplace-la partout (Rechercher / Remplacer dans tous les fichiers).

**Le plus important se passe hors du site** :
1. **Fiche Google Business Profile** du shop (Google Maps) : catégorie « Coffee shop », adresse exacte, horaires, téléphone, photos, lien vers le site et vers `/carte`. C’est elle qui fait apparaître Ady quand on cherche « coffee shop » autour de Sainte-Anne.
2. **Avis Google** : la carte d’avis au comptoir et le lien d’avis sur la carte Walty.
3. **Google Search Console** : ajouter le site et envoyer `sitemap.xml`. Pareil sur Bing Webmaster Tools.
4. **Lien du site** dans la bio Instagram et partout où le shop est cité (même nom, même adresse, même téléphone).
5. Fiches sur Apple Plans (Business Connect), TripAdvisor, PagesJaunes.

## À compléter avant l’ouverture

- **Pages légales** : tout ce qui est marqué **DEMO** (forme juridique, SIREN, TVA, gérant, contact, région Supabase, **médiateur de la consommation**, délais).
- **Allergènes** de chaque produit : back-office → *Carte & prix*.
- `js/reglages.js` : téléphone, WhatsApp, **horaires réels** (ceux du site sont provisoires, et Google les lit), position exacte du shop, chiffre d’abonnés Instagram à vérifier. La position du shop est aussi écrite dans la fiche Google de `index.html` et `le-shop.html` (`"geo"`).
- **Points de livraison** : les cinq points de départ (du ponton au côté est) sont des dessins à des positions approximatives. Remplace-les par de vraies photos, place-les sur la carte et pose les QR codes (back-office → *Points plage*).
- **Paiement en ligne** : pas encore en place (paiement à la livraison ou au comptoir). Il peut s’ajouter avec Stripe Checkout et une petite fonction serveur sur Vercel, quand le shop a son compte Stripe.

---

Carte de la plage dessinée d’après les données © contributeurs OpenStreetMap (ODbL), affichée avec Leaflet. Polices sous licence SIL Open Font License. Carte fidélité digitale : Walty.
