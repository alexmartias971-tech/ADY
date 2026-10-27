# Ady Coffee Shop — site vitrine + commande livraison plage

Site du **Californian coffee shop Ady** (Sainte-Anne, Guadeloupe).

| Page | Fichier | Rôle |
|---|---|---|
| Accueil | `index.html` | Affiche, signatures, scène animée « Livré les pieds dans le sable », fidélité, « Passe nous voir » |
| La carte | `carte.html` | Toute la carte par catégorie, panier latéral, commande |
| Livraison plage | `livraison.html` | Fonctionnement, zone sur carte, questions fréquentes |
| Fidélité | `fidelite.html` | Carte fidélité Wallet (démo interactive) |
| Le shop | `le-shop.html` | Adresse, horaires, contact, carte |
| CGV, mentions légales, 404 | `cgv.html`, `mentions-legales.html`, `404.html` | Pages légales (champs à compléter surlignés) |

**Commande avec livraison sur la plage de la Caravelle** (accessible depuis toutes les pages via le panier) :
1. panier, avec un minimum de commande (5 € par défaut) et des suggestions ;
2. position GPS ajustable sur la carte de la plage, puis **photo du spot obligatoire** ;
3. prénom, téléphone, paiement à la livraison (espèces / carte). Les coordonnées peuvent être mémorisées sur le téléphone ;
4. confirmation avec un numéro de commande. La commande arrive au shop sur Telegram, avec la photo et l’épingle GPS.

Le site est en HTML/CSS/JS **sans étape de build ni dépendance**. La seule partie serveur est `api/order.js`, une fonction Vercel qui vérifie la commande et la transmet au shop.

---

## 1. Mettre en ligne (GitHub → Vercel)

**Première mise en ligne**
1. Sur GitHub, ouvre le dépôt, fais *Add file → Upload files* et glisse **le contenu** du dossier : `index.html` doit être à la racine. Termine avec *Commit changes*.
2. Sur Vercel, fais *Add New… → Project → Import* sur le dépôt.
   - Project Name : en **minuscules** (ex. `ady-coffee-shop`).
   - Application Preset : **Other**. Ne touche ni à Build ni à Output.
   - Clique sur **Deploy**.

**Mise à jour depuis une version précédente**
Supprime d’abord sur GitHub les anciens fichiers qui n’existent plus : `js/app.js` et le dossier `assets/insta/`. Envoie ensuite les nouveaux fichiers par-dessus. Vercel redéploie tout seul à chaque *commit*.

> Tant que Telegram n’est pas configuré, le tunnel tourne en **mode démo** : le client voit la confirmation, mais la commande n’est transmise à personne (un message le précise). Si un numéro WhatsApp est renseigné dans `js/config.js`, le client est plutôt invité à envoyer sa commande sur WhatsApp.

## 2. Recevoir les commandes sur Telegram (gratuit)

Chaque commande arrive dans un groupe Telegram avec : la **photo du spot**, le récap, le téléphone du client, un bouton « Itinéraire » et l’**épingle GPS**.

1. Dans Telegram, ouvre **@BotFather**, tape `/newbot` et donne un nom (ex. *Ady Commandes*). Il te donne un **token**.
2. Crée un groupe *Commandes Ady* avec l’équipe, **ajoute-y le bot**, puis écris `/start` dans le groupe.
3. Ouvre `https://api.telegram.org/bot<TON_TOKEN>/getUpdates` dans un navigateur. Repère `"chat":{"id":-100…` : ce nombre, signe moins compris, est le **chat id**.
4. Dans Vercel, va dans *Settings → Environment Variables* et ajoute `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`.
5. Va dans *Deployments*, puis **⋯ → Redeploy**, et passe une commande test.

En plus, tu peux recevoir la commande **par e-mail** avec Resend : ajoute `RESEND_API_KEY`, `ORDER_EMAIL_TO` et, une fois le domaine vérifié chez Resend, `ORDER_EMAIL_FROM`.

## 3. Personnaliser

Presque tout se règle dans deux fichiers :

| Fichier | Contenu |
|---|---|
| `js/config.js` | Minimum de commande, frais, délai, moyens de paiement, **zone de livraison**, position du shop, **horaires**, téléphone, WhatsApp, Instagram, lien de la carte fidélité |
| `js/menu.js` | **Produits, prix, descriptions, options** (lait, sirop, sucre), catégories et leurs accroches, produits mis en avant sur l’accueil (`signature: true`) |

- **Zone de livraison** : elle est calée sur le contour de la plage « La Caravelle » dans OpenStreetMap (centre 16.2181, -61.3965, rayon 420 m). La position du shop (quartier Durivage) est **approximative** : sur Google Maps, fais un clic droit sur le shop pour copier ses coordonnées.
- **Horaires** : une fois confirmés, passe `bloquerHorsHoraires: true` pour refuser les commandes quand le shop est fermé.
- **Photos de produits** (facultatif) : dépose-les dans `assets/produits/` et ajoute `photo: 'assets/produits/iced-latte.jpg'` au produit. Elles remplacent alors l’illustration.
- **Menu de navigation et pied de page** : ils sont présents dans chaque fichier `.html`. Si tu ajoutes une page, mets les liens à jour dans chacun.

### Logo et illustrations
- `assets/brand.svg` contient le logo et les stickers Ady, vectorisés à partir des visuels de la marque. Si tu as les fichiers vectoriels officiels, remplace le contenu de chaque `<symbol>` en gardant son `id` (`logo`, `st-head`, `st-can`, `st-moka`, `st-palms`, `st-oval`).
- Les boissons et douceurs sont dessinées en code dans `js/illustrations.js` (style sérigraphie : aplats décalés, trame, grain).
- La scène de la plage est dans `js/scene.js` et les pictogrammes de la marque dans `js/icons.js`.

## 4. À compléter avant le lancement
- [ ] Vraie carte et vrais prix (`js/menu.js`) : **les produits et prix actuels sont provisoires**
- [ ] Horaires, téléphone, WhatsApp, Instagram, lien de la carte fidélité (`js/config.js`)
- [ ] Position exacte du shop, et vérification de la zone sur place
- [ ] Mentions légales et CGV : champs surlignés (forme juridique, gérant, médiateur, allergènes…)
- [ ] Une fois le domaine connu, mettre l’URL complète de l’image de partage dans chaque page :
      `<meta property="og:image" content="https://ton-domaine/assets/og-image.jpg">`
- [ ] Variables Telegram dans Vercel, puis une commande test depuis la plage

## 5. Structure

```
*.html                  pages du site
css/style.css           design system (couleurs, typo, composants) — variables en haut du fichier
js/main.js              point d’entrée (charge le module de la page)
js/config.js            ⚙️ réglages du shop
js/menu.js              ☕ la carte
js/ui.js                en-tête, menu mobile, statut ouvert/fermé, panier
js/produits.js          cartes produit + ajout au panier
js/sheet.js             fiche produit (options, quantité)
js/checkout.js          tunnel de commande (carte de la plage, GPS, photo, envoi)
js/scene.js             scène animée de la livraison + vignette du shop
js/loyalty.js           carte fidélité 3D
js/illustrations.js     illustrations des produits
js/icons.js             pictogrammes de la marque et icônes
js/map.js               cartes Leaflet / OpenStreetMap
js/pages/*.js           code propre à chaque page
api/order.js            fonction Vercel : vérifie et transmet la commande
assets/                 logo, stickers, textures de grain, favicon, image de partage
vendor/leaflet/         Leaflet 1.9.4 (licence BSD)
```

## Notes techniques
- Les prix sont **toujours recalculés côté serveur** à partir de `js/menu.js`. Le minimum, la zone et la photo y sont aussi vérifiés.
- La photo est compressée dans le navigateur (~200-400 Ko) avant l’envoi. Aucune donnée client n’est stockée par le site.
- Animations : la scène de la plage suit le défilement, et la bande de pictos ne bouge que quand on fait défiler la page. Si l’appareil demande moins d’animations (`prefers-reduced-motion`), tout est coupé.
- Navigation entre les pages avec transitions douces (View Transitions, navigateurs récents).
- Pour tester en local avec l’API : `npx vercel dev`. Sinon, n’importe quel serveur statique qui gère les URL sans `.html` (ex. `npx serve`) fonctionne, en mode démo.
