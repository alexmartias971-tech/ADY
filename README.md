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
| CGV, mentions, 404 | `cgv.html`, `mentions-legales.html`, `404.html` | Champs à compléter surlignés en rose |

## Le parcours client (pourquoi chaque bloc est à sa place)

Les gens sont sur la plage, au soleil, avec un téléphone : tout est pensé pour commander en quelques gestes.

1. **Affiche + deux grosses entrées** « Livré sur la plage » / « Je passe au shop ». C’est la première décision, elle règle tout le reste (minimum, photo, paiement). Elle est visible sans défiler sur un téléphone.
2. **Les signatures** (gérées dans le back-office, « mise en avant ») : la plupart des commandes, ajoutables en un geste.
3. **« Livré les pieds dans le sable »** raconté au défilement : répond à la vraie inquiétude (« comment ils vont me trouver ? ») avant le passage en caisse.
4. **Le shop en vrai** : les photos (avec le grain), pour la confiance et l’envie.
5. **Le maracudja matcha tonic monté couche par couche** au défilement, avec son bouton « Je le veux » : le désir, puis l’action.
6. **Fidélité** : un tampon par boisson, même livré sur la plage (numéro de carte saisi à la commande).
7. **T-shirts** : vente additionnelle, taille à choisir, récupérée au comptoir ou livrée avec la boisson.
8. **Passe nous voir** : adresse, horaires, preuve sociale Instagram.

**Le tunnel de commande** (panneau qui s’ouvre depuis le panier, sur toutes les pages) :
- *Plage* : panier (minimum 5 €, suggestions) → position GPS automatique, ajustable, puis **photo du spot obligatoire** → prénom, téléphone, paiement (espèces / carte), carte fidélité → **suivi en direct** (reçue, en préparation, en route, livrée).
- *Shop* : panier (pas de minimum) → heure de passage → prénom, paiement au comptoir → suivi (reçue, en préparation, prête au comptoir).
- On peut fermer la page : la pastille en haut de l’écran ramène au suivi.

## 0. Mode démo (rien à configurer)

Tant que `config.js` est vide, le site et le back-office tournent en démo, dans le navigateur :
- passe une commande sur le site, puis ouvre **`/admin`** dans le **même navigateur** : identifiant **demo.com@gmail.com**, mot de passe **demo** ;
- fais avancer la commande : le client voit l’étape changer en direct sur le site (toutes les 6 s) ;
- bouton « Réinitialiser la démo » dans Réglages.

Dès que `config.js` est rempli, la démo se coupe toute seule et tout passe par Supabase.

## 1. Supabase (10 min)

1. Crée un projet sur supabase.com. Région : **eu-west-3 (Paris)** conseillée pour le RGPD (`us-east-1` est un peu plus rapide depuis la Guadeloupe).
2. **SQL Editor** : colle `supabase/schema.sql`, *Run*. Puis `supabase/seed.sql`, *Run* (la carte actuelle, une seule fois).
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
- **Carte & prix** : nom, prix, description, options (chaud/glacé, lait, sirop, format), mise en avant (« Commence par celles-là ») avec étiquette, ordre, en vente / épuisé.
- **Stock** : optionnel, par produit et par taille de t-shirt. À 0, le site affiche « Épuisé ».
- **Réglages** : couper les commandes en ligne ou la livraison plage d’un clic, minimum plage, horaires du salé, tampons fidélité, **photo obligatoire, rayon et centre de la zone de livraison**.

## 4. Ce qui est vérifié côté base (le client ne peut pas tricher)

- Prix et total recalculés par la base ; stock vérifié et décrémenté dans la même opération.
- Plats salés refusés hors horaires (heure de Guadeloupe).
- Livraison plage refusée hors zone ou sans photo (si la photo est obligatoire).
- Commandes, téléphones et photos lisibles uniquement par les comptes admins ; les photos sont dans un espace privé.

## 5. À compléter avant l’ouverture

- `js/config.js` : **téléphone**, **WhatsApp**, **horaires réels** (ceux du site sont provisoires), lien de la carte fidélité Wallet si vous en avez un, position exacte du shop (`shop`).
- Zone de livraison : centre et rayon à vérifier sur place (Réglages du back-office).
- `cgv.html` et `mentions-legales.html` : forme juridique, SIREN, gérant, contact, médiateur, durée de conservation des photos (surlignés en rose).
- Allergènes : liste à fournir (mentionnée sur la carte et dans les CGV).

## 6. Fichiers utiles

| Fichier | Contenu |
|---|---|
| `config.js` | Connexion Supabase (vide = démo) |
| `js/config.js` | Textes, contact, horaires, paiements, zone par défaut |
| `js/data.js` | Lecture de la carte, envoi de la commande, suivi |
| `js/checkout.js` | Tunnel de commande et suivi en direct |
| `js/illustrations.js`, `js/scene.js`, `js/build.js` | Illustrations et animations (dessinées en SVG, rien à télécharger) |
| `supabase/schema.sql`, `supabase/seed.sql` | Base de données et carte de départ |
| `assets/photos/`, `assets/merch/` | Photos du shop et des t-shirts (remplaçables, mêmes noms) |

Les cartes utilisent © OpenStreetMap (bibliothèque Leaflet incluse dans `vendor/`).
