# Ady Coffee Shop — site vitrine + commande livraison plage

Site du **Californian coffee shop Ady** (Sainte-Anne, Guadeloupe) :

- vitrine (le shop, la carte animée, la carte fidélité, Instagram, infos pratiques) ;
- **commande avec livraison sur la plage de la Caravelle** :
  - minimum de commande (5 € par défaut) ;
  - position GPS du client, ajustable à la main sur une carte de la plage ;
  - **photo du spot obligatoire** (serviette, parasol, repère…) pour que le livreur trouve le client ;
  - paiement à la livraison (espèces / carte).

Le site est en HTML/CSS/JS, **sans étape de build ni dépendance** : on le pousse sur GitHub, Vercel le met en ligne tel quel.
La seule partie serveur est `api/order.js`, une fonction serverless Vercel qui transmet la commande au shop.

---

## 1. Mettre en ligne (GitHub → Vercel)

1. **GitHub** : créez un dépôt (ex. `ady-coffee-shop`), puis *Add file → Upload files* et glissez-y **le contenu** du dossier (pas le .zip lui-même : `index.html` doit être à la racine du dépôt). Validez avec *Commit changes*.
2. **Vercel** : *Add New… → Project → Import* le dépôt GitHub.
   - Framework Preset : **Other**
   - Build Command : *(vide)* · Output Directory : *(vide)*
   - Cliquez sur **Deploy**.
3. Le site est en ligne sur `https://<nom-du-projet>.vercel.app`. Chaque modification poussée sur GitHub redéploie automatiquement.

> Tant que Telegram (ou l’e-mail) n’est pas configuré, le tunnel de commande fonctionne en **mode démo** : le client voit la confirmation, mais la commande n’est transmise à personne (un message le précise). Si un numéro WhatsApp est renseigné dans `js/config.js`, le client est plutôt invité à envoyer sa commande sur WhatsApp.

## 2. Recevoir les commandes sur Telegram (recommandé, gratuit)

Chaque commande arrive dans un groupe Telegram avec **la photo du spot, le récap, le téléphone du client, un bouton « Itinéraire » et l’épingle GPS** (un appui ouvre la navigation).

1. Dans Telegram, ouvrez **@BotFather** → `/newbot` → donnez un nom (ex. *Ady Commandes*). Il vous donne un **token** du type `123456:ABC-xyz…`.
2. Créez un groupe *Commandes Ady* avec l’équipe et **ajoutez-y le bot**. Écrivez `/start` dans le groupe.
3. Ouvrez dans un navigateur : `https://api.telegram.org/bot<VOTRE_TOKEN>/getUpdates`
   Repérez `"chat":{"id":-100…` : ce nombre (avec le signe moins) est le **chat id**.
4. Vercel → votre projet → **Settings → Environment Variables** :
   - `TELEGRAM_BOT_TOKEN` = le token
   - `TELEGRAM_CHAT_ID` = le chat id
5. **Deployments → ⋯ → Redeploy** (les variables ne sont prises en compte qu’après un redéploiement).
6. Passez une commande test depuis votre téléphone, sur la plage ou en déplaçant l’épingle dans la zone.

### En plus (ou à la place) : par e-mail avec Resend

Créez un compte sur resend.com, puis ajoutez dans Vercel :
`RESEND_API_KEY`, `ORDER_EMAIL_TO` (une ou plusieurs adresses séparées par des virgules) et, une fois votre domaine vérifié chez Resend, `ORDER_EMAIL_FROM` (ex. `Ady <commandes@votredomaine.fr>`).
La photo du spot est jointe à l’e-mail.

## 3. Personnaliser

Tout se règle dans deux fichiers, sans toucher au reste :

| Fichier | Contenu |
|---|---|
| `js/config.js` | Minimum de commande, frais de livraison, délai, moyens de paiement, **zone de livraison** (centre + rayon), position du shop, **horaires**, téléphone, WhatsApp, Instagram, lien de la carte fidélité |
| `js/menu.js` | **Produits, prix, descriptions, options** (lait, sirop, sucre), catégories. Un produit peut avoir une `photo` à la place de l’illustration animée |

- **Coordonnées GPS** : sur Google Maps, clic droit sur un point → les coordonnées s’affichent (ex. `16.2207, -61.3962`). Vérifiez sur place que le cercle de la zone couvre bien toute la plage.
- **Horaires** : une fois confirmés, passez `bloquerHorsHoraires: true` pour refuser les commandes quand le shop est fermé.
- **Photos de produits** : déposez-les dans `assets/produits/` et ajoutez `photo: 'assets/produits/iced-latte.jpg'` au produit.
- **Galerie Instagram** : remplacez les images de `assets/insta/` (format portrait 4:5 idéal).

### Logo et illustrations

`assets/brand.svg` contient le logo et les stickers Ady (bonhomme au chapeau, canette, cafetière italienne, palmiers, ovale « ADY coffee shop »). Ils ont été **vectorisés à partir des visuels Instagram** : c’est fidèle et net à l’écran, mais si vous avez les **fichiers vectoriels officiels** (AI/SVG), remplacez le contenu de chaque `<symbol>` par le tracé officiel en gardant son `id` (`logo`, `st-head`, `st-can`, `st-moka`, `st-palms`, `st-oval`).
`assets/logo-ady-creme.svg` et `assets/logo-ady-rouge.svg` sont des versions autonomes du logo.

## 4. À compléter avant le lancement

- [ ] Vraie carte et vrais prix (`js/menu.js`) : **les produits et prix actuels sont provisoires**
- [ ] Horaires, téléphone, WhatsApp, Instagram, lien carte fidélité (`js/config.js`)
- [ ] Coordonnées GPS de la zone de livraison et du shop, vérifiées sur place
- [ ] Mentions légales (`mentions-legales.html`, champs surlignés)
- [ ] Une fois le domaine connu, mettre l’URL complète de l’image de partage dans `index.html` :
      `<meta property="og:image" content="https://votre-domaine/assets/og-image.jpg">`
- [ ] Variables Telegram dans Vercel + une commande test

## 5. Structure

```
index.html              page principale
mentions-legales.html   mentions légales + données personnelles
404.html                page introuvable
css/style.css           styles (couleurs de la marque en haut du fichier)
js/config.js            ⚙️ réglages du shop
js/menu.js              ☕ la carte
js/app.js               carte, panier, animations
js/checkout.js          tunnel de commande (carte de la plage, GPS, photo, envoi)
js/illustrations.js     illustrations animées des boissons et douceurs
js/cart.js · horaires.js · utils.js
api/order.js            fonction Vercel : vérifie et transmet la commande
assets/                 logo, stickers, favicon, image de partage, photos
vendor/leaflet/         carte interactive (Leaflet 1.9.4, licence BSD)
```

## Notes techniques

- La carte de la plage utilise **Leaflet** et les tuiles **OpenStreetMap** (attribution affichée).
- La photo est redimensionnée et compressée dans le navigateur (~200-400 Ko) avant l’envoi.
- Les prix sont **toujours recalculés côté serveur** à partir de `js/menu.js` ; le minimum, la zone et la photo sont aussi vérifiés côté serveur.
- Aucune donnée client n’est stockée par le site : la commande est transmise puis oubliée.
- Le panier est gardé dans le navigateur du client (localStorage).
- Accessibilité : navigation clavier, focus visible, `prefers-reduced-motion` respecté (animations coupées).
- Tester en local avec l’API : `npx vercel dev` (sinon n’importe quel serveur statique, en mode démo).
