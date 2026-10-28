# Ady Coffee Shop — site + commande (plage ou à emporter) + back-office

Site du **Californian coffee shop Ady** (Durivage, Sainte-Anne, Guadeloupe).
HTML/CSS/JS **sans étape de build**. Les commandes, la carte et les réglages vivent dans **Supabase** ; l’équipe gère tout depuis **`/admin`**.

| Page | Fichier | Rôle |
|---|---|---|
| Accueil | `index.html` | Le parcours complet, voir ci-dessous |
| La carte | `carte.html` | Carte façon ardoise du shop, choix plage / shop, panier latéral |
| Livraison plage | `livraison.html` | Fonctionnement, zone sur la carte, questions fréquentes |
| Fidélité | `fidelite.html` | Carte Wallet interactive, comment l’utiliser en ligne |
| Le shop | `le-shop.html` | Photos, adresse, horaires, contact, carte |
| Back-office | `admin.html` | Commandes en direct, carte & prix, stock, réglages |
| CGV, mentions, confidentialité, 404 | `cgv.html`, `mentions-legales.html`, `confidentialite.html`, `404.html` | Infos manquantes marquées **DEMO** (en bleu) |

## Le parcours client (pourquoi chaque bloc est à sa place)

Les gens sont sur la plage, au soleil, avec un téléphone : tout est pensé pour commander en quelques gestes.

1. **Affiche + deux grosses entrées** « Livré sur la plage » / « Je passe au shop ». C’est la première décision, elle règle tout le reste (minimum, photo, paiement). Elle est visible sans défiler sur un téléphone.
2. **Les signatures** (gérées dans le back-office, « mise en avant ») : la plupart des commandes, ajoutables en un geste.
3. **« Livré les pieds dans le sable »** raconté au défilement : répond à la vraie inquiétude (« comment ils vont me trouver ? ») avant le passage en caisse.
4. **Le shop en vrai** : les photos (avec le grain), pour la confiance et l’envie.
5. **Le maracudja matcha tonic monté couche par couche** au défilement, avec son bouton « Je le veux » : le désir, puis l’action.
6. **Fidélité** : un tampon par boisson, même livré sur la plage : le livreur scanne le QR code au moment de payer (rien à saisir sur le site).
7. **T-shirts** : vente additionnelle, taille à choisir, récupérée au comptoir ou livrée avec la boisson.
8. **Passe nous voir** : adresse, horaires, preuve sociale Instagram.

**Le tunnel de commande** (panneau qui s’ouvre depuis le panier, sur toutes les pages) :
- *Plage* : panier (minimum 5 €, suggestions) → position GPS automatique, ajustable, puis **photo du spot obligatoire** → nom, prénom, téléphone, paiement (espèces / carte) → bouton « Commander avec obligation de paiement » → **suivi en direct** (reçue, en préparation, en route, livrée).
- *Shop* : panier (pas de minimum) → heure de passage → nom, prénom, paiement au comptoir → suivi (reçue, en préparation, prête au comptoir).
- *Fidélité* : pas de numéro à taper. Le client montre son QR code au livreur ou au comptoir au moment de payer ; le café offert est déduit à ce moment-là.
- *Carte fidélité digitale (Walty)* : le bouton « Créer ma carte » ouvre https://carte.walty.fr/ady-coffee-shop (accueil, page Fidélité avec un QR code à scanner sur ordinateur, FAQ livraison, étape Contact et écran de suivi : « Un tampon sur cette commande ? »). Le lien se règle dans `js/config.js` (`lienCarteFidelite`) ; vide, les boutons disparaissent.
- On peut fermer la page : la pastille en haut de l’écran ramène au suivi.

## Comment le shop reçoit les commandes

Sur le **back-office `/admin`**, onglet **Commandes** : une page web qui marche sur tablette, téléphone ou ordinateur (une tablette posée au comptoir, page ouverte, c’est l’idéal).
- La commande arrive **en direct** (Supabase Realtime), avec un **son** (bouton « Son » à activer une fois en haut du back-office) et une **notification** du navigateur (à autoriser la première fois).
- Chaque commande affiche : numéro, nom et prénom, téléphone (cliquable), articles et options, note, paiement choisi ; pour la plage, le **repère**, la **position sur Google Maps** et la **photo du spot**.
- Un bouton fait avancer la commande : *Accepter et préparer* → *Partie en livraison* / *Prête au comptoir* → *Livrée* / *Récupérée*. *Annuler* remet le stock.
- Les commandes sont enregistrées dans la base **Supabase** (PostgreSQL hébergé), jamais dans le site lui-même.

## Comment marche le suivi de commande

1. Quand le client valide, la base renvoie un **numéro** et un **jeton secret** (impossible à deviner).
2. Le téléphone du client demande l’étape de sa commande toutes les 6 secondes avec ce jeton (`order_status`). La réponse ne contient que le numéro, l’étape et le total : aucune donnée personnelle.
3. Quand l’équipe appuie sur un bouton dans `/admin`, l’étape change en base ; le client la voit au passage suivant, avec une petite notification à l’écran.
4. Le suivi est gardé 8 heures sur le téléphone : si le client ferme la page, la pastille en haut de l’écran le ramène au suivi.

## 0. Mode démo (rien à configurer)

Tant que `config.js` est vide, le site et le back-office tournent en démo, dans le navigateur :
- passe une commande sur le site, puis ouvre **`/admin`** dans le **même navigateur** : identifiant **demo.com@gmail.com**, mot de passe **demo** ;
- fais avancer la commande : le client voit l’étape changer en direct sur le site (toutes les 6 s) ;
- bouton « Réinitialiser la démo » dans Réglages.

Dès que `config.js` est rempli, la démo se coupe toute seule et tout passe par Supabase. En démo, un bandeau « Site de démonstration » s’affiche en haut de chaque page ; il disparaît avec la démo.

## 1. Supabase (10 min)

1. Crée un projet sur supabase.com. Région : **eu-west-3 (Paris)** conseillée pour le RGPD (`us-east-1` est un peu plus rapide depuis la Guadeloupe).
2. **SQL Editor** : colle `supabase/schema.sql`, *Run*. Puis `supabase/seed.sql`, *Run* (la carte actuelle, une seule fois).
   Si la base existait déjà : relance seulement `schema.sql`, il ajoute ce qui manque sans toucher aux données.
3. **Authentication → Providers → Email** : désactive « Allow new users to sign up ».
4. **Authentication → Users → Add user** : crée le compte du gérant (e-mail + mot de passe).
5. Donne-lui l’accès au back-office (SQL Editor) :
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-du-gerant@exemple.com';
   ```
6. **Project Settings → API** : copie `Project URL` et la clé `anon public` dans `config.js` :
   ```js
   window.ADY_CONFIG = { supabaseUrl: "https://xxxx.supabase.co", supabaseAnonKey: "eyJ..." };
   ```
   La clé *anon* est faite pour être publique : la sécurité repose sur les règles de la base (voir plus bas). Ne mets **jamais** la clé `service_role` dans le site.

## 2. Mise en ligne (GitHub → Vercel)

1. Sur GitHub, *Add file → Upload files* et glisse **le contenu** du dossier (`index.html` à la racine), puis *Commit changes*.
   Si le dépôt contient une ancienne version, supprime d’abord les fichiers qui n’existent plus : `api/`, `js/app.js`, `js/menu.js`, `assets/insta/`.
2. Sur Vercel : *Add New… → Project → Import* le dépôt. Nom du projet **en minuscules** (ex. `ady-coffee-shop`), *Application Preset* : **Other**, ne touche ni à Build ni à Output, *Deploy*.
3. Vercel redéploie tout seul à chaque *commit*. Le back-office est sur `https://ton-site/admin`.

## 3. Le back-office (`/admin`)

- **Commandes** : arrivent en direct (son + notification). Un bouton fait avancer chaque commande ; le client le voit sur son téléphone. Pour la plage : position sur Google Maps, photo du spot, repère, numéro de carte fidélité. Annuler remet le stock.
- **Carte & prix** : nom, prix, description, **allergènes** (obligatoires, affichés dans la fiche produit), options (chaud/glacé, lait, sirop, format), mise en avant (« Commence par celles-là ») avec étiquette, ordre, en vente / épuisé.
- **Stock** : optionnel, par produit et par taille de t-shirt. À 0, le site affiche « Épuisé ».
- **Réglages** : couper les commandes en ligne ou la livraison plage d’un clic, minimum plage, horaires du salé, tampons fidélité, **photo obligatoire, rayon et centre de la zone de livraison**.

## 4. Sécurité

- **Côté base** : prix et total recalculés par la base ; stock vérifié et décrémenté dans la même opération ; plats salés refusés hors horaires ; livraison refusée hors zone ou sans photo ; pas plus de 3 commandes en 10 minutes pour un même numéro, et un plafond global contre les avalanches de fausses commandes.
- **Accès** : commandes, téléphones et photos lisibles uniquement par les comptes admins (règles RLS) ; photos dans un espace privé, nom de fichier imposé, 2 Mo maximum, images uniquement. Inscription publique désactivée (étape 1.3).
- **Navigateur** (`vercel.json`) : politique de sécurité du contenu (CSP) qui n’autorise que le site, Supabase et les tuiles OpenStreetMap, HTTPS forcé (HSTS), site impossible à intégrer dans une autre page, permissions limitées à la position et à l’appareil photo.
- Les images de produits doivent être dans `assets/` (ou le stockage Supabase) : une image hébergée ailleurs serait bloquée par la CSP.

## 5. Conformité (RGPD, vente à distance)

Ce qui est en place :
- **Aucun appel à un service tiers inutile** : polices et bibliothèques hébergées sur le site (pas de Google Fonts, pas de CDN). Pas de cookie, pas de mesure d’audience, donc pas de bandeau cookies à afficher.
- **Pages** : mentions légales, CGV (rétractation 14 jours pour les t-shirts avec formulaire, exclusion pour les boissons et plats, garanties légales, fidélité, médiation, Bloctel), politique de confidentialité.
- **Tunnel** : lien vers les CGV et la confidentialité avant de commander, bouton « Commander avec obligation de paiement » (art. L221-14), allergènes affichés avant l’ajout au panier, « se souvenir de moi » décoché par défaut.
- **Durées de conservation appliquées** : photos supprimées après 7 jours, téléphone / position / repère / note effacés après 30 jours. La purge tourne chaque jour si l’extension `pg_cron` est disponible (installée par `schema.sql`), et à chaque ouverture du back-office.
- **Confirmation sur support durable** : le ticket de caisse remis à la livraison ou au retrait (prévu dans les CGV).

Tout ce qui est marqué **DEMO** dans les pages légales doit être complété avant d’ouvrir les commandes (voir ci-dessous).

## 6. À compléter avant l’ouverture

- **Pages légales** (`cgv.html`, `mentions-legales.html`, `confidentialite.html`, générées depuis les mêmes textes) : forme juridique et capital, SIREN/RCS, TVA, directeur de la publication, e-mail et téléphone, région Supabase, **médiateur de la consommation** (adhésion obligatoire), délai de conservation d’une commande non retirée, conduite si le client est introuvable, durée de conservation comptable. Tous ces endroits sont marqués **DEMO**.
- **Allergènes** de chaque produit : dans le back-office, *Carte & prix*.
- `js/config.js` : **téléphone**, **WhatsApp**, **horaires réels** (ceux du site sont provisoires), position exacte du shop (`shop`), et le chiffre d’abonnés Instagram (`preuveSociale`) à vérifier.
- Zone de livraison : centre et rayon à vérifier sur place (Réglages du back-office).

## 7. Fichiers utiles

| Fichier | Contenu |
|---|---|
| `config.js` | Connexion Supabase (vide = démo) |
| `js/config.js` | Textes, contact, horaires, paiements, zone par défaut |
| `js/data.js` | Lecture de la carte, envoi de la commande, suivi |
| `js/checkout.js` | Tunnel de commande et suivi en direct |
| `js/illustrations.js`, `js/scene.js`, `js/build.js` | Illustrations et animations (dessinées en SVG, rien à télécharger) |
| `js/boot.js`, `js/loader.js` | Écran de chargement (une fois par visite) |
| `css/fonts.css`, `assets/fonts/` | Polices hébergées sur le site |
| `vendor/` | Leaflet (cartes) et supabase-js, hébergés sur le site |
| `supabase/schema.sql`, `supabase/seed.sql` | Base de données et carte de départ |
| `assets/photos/`, `assets/merch/` | Photos du shop et des t-shirts (remplaçables, mêmes noms) |

Les cartes utilisent © OpenStreetMap (bibliothèque Leaflet incluse dans `vendor/`).
