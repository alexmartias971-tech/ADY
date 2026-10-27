// ─────────────────────────────────────────────────────────────
//  API de commande — fonction serverless Vercel (POST /api/order)
//
//  Reçoit la commande du site, recalcule les prix côté serveur,
//  vérifie le minimum, la zone de livraison et la photo, puis
//  transmet la commande au shop :
//    • Telegram (recommandé) : photo du spot + récap + épingle GPS
//      → variables TELEGRAM_BOT_TOKEN et TELEGRAM_CHAT_ID
//    • E-mail via Resend (facultatif)
//      → variables RESEND_API_KEY, ORDER_EMAIL_TO (et ORDER_EMAIL_FROM)
//  Rien n'est stocké sur le serveur.
// ─────────────────────────────────────────────────────────────
import { CONFIG } from '../js/config.js';
import { OPTIONS, trouverProduit, prixLigne, libelleOptions } from '../js/menu.js';
import { etatOuverture } from '../js/horaires.js';

const PHOTO_MAX_OCTETS = 3.5 * 1024 * 1024;

const euro = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nettoyer = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

function distanceMetres(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 0690 12 34 56 → +590 690 12 34 56 (numéros guadeloupéens)
function telephoneInternational(tel) {
  const chiffres = tel.replace(/[^\d+]/g, '');
  if (/^0(590|690|691)\d{6}$/.test(chiffres)) return `+590${chiffres.slice(1)}`;
  if (/^0\d{9}$/.test(chiffres)) return `+33${chiffres.slice(1)}`;
  return chiffres;
}

function numeroCommande() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `ADY-${s}`;
}

class ErreurCommande extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function valider(body) {
  if (!body || typeof body !== 'object') throw new ErreurCommande('Commande illisible.');

  // Lignes : on ne fait jamais confiance aux prix envoyés par le navigateur
  if (!Array.isArray(body.lignes) || body.lignes.length === 0) throw new ErreurCommande('Ton panier est vide.');
  if (body.lignes.length > 30) throw new ErreurCommande('Trop d’articles dans la commande.');
  const lignes = body.lignes.map((l) => {
    const p = trouverProduit(String(l?.id));
    if (!p || p.dispo === false) throw new ErreurCommande('Un produit de ton panier n’est plus disponible. Recharge la page.');
    const qty = Number(l.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new ErreurCommande('Quantité invalide.');
    const choix = {};
    for (const g of p.options || []) {
      const v = l.choix?.[g] ?? OPTIONS[g].choix[0].id;
      if (!OPTIONS[g].choix.some((c) => c.id === v)) throw new ErreurCommande('Option invalide.');
      choix[g] = v;
    }
    const unitaire = prixLigne(p, choix);
    return { produit: p, choix, qty, unitaire, total: Math.round(unitaire * qty * 100) / 100 };
  });
  const sousTotal = Math.round(lignes.reduce((s, l) => s + l.total, 0) * 100) / 100;
  if (sousTotal < CONFIG.commandeMinimum) {
    throw new ErreurCommande(`Le minimum de commande pour la livraison est de ${euro(CONFIG.commandeMinimum)}.`);
  }

  // Client
  const prenom = nettoyer(body.client?.prenom, 40);
  const telephone = nettoyer(body.client?.telephone, 20);
  if (!prenom) throw new ErreurCommande('Indique ton prénom.');
  if (telephone.replace(/\D/g, '').length < 8) throw new ErreurCommande('Ton numéro de téléphone semble incomplet.');

  const paiement = CONFIG.paiements.find((p) => p.id === body.paiement);
  if (!paiement) throw new ErreurCommande('Choisis un moyen de paiement.');

  // Position : dans la zone de livraison (petite tolérance pour l'imprécision du GPS)
  const lat = Number(body.position?.lat);
  const lng = Number(body.position?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new ErreurCommande('Ta position est manquante.');
  const distance = distanceMetres({ lat, lng }, CONFIG.zone.centre);
  if (distance > CONFIG.zone.rayonMetres * 1.15) throw new ErreurCommande(`Ta position est en dehors de la zone de livraison (${CONFIG.zone.nom}).`);
  const precision = Number(body.position?.precision) || null;
  const source = body.position?.source === 'gps' ? 'GPS' : 'placée à la main';

  // Photo du spot
  let photo = null;
  if (body.photo) {
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.photo));
    if (!m) throw new ErreurCommande('La photo n’a pas pu être lue, essaie avec une autre.');
    photo = { type: m[1], buffer: Buffer.from(m[2], 'base64') };
    if (photo.buffer.length > PHOTO_MAX_OCTETS) throw new ErreurCommande('La photo est trop lourde.');
  } else if (CONFIG.photoObligatoire) {
    throw new ErreurCommande('Ajoute une photo de ton spot pour que le livreur te trouve.');
  }

  return {
    lignes,
    sousTotal,
    frais: CONFIG.fraisLivraison,
    total: Math.round((sousTotal + CONFIG.fraisLivraison) * 100) / 100,
    prenom,
    telephone,
    telInter: telephoneInternational(telephone),
    paiement: paiement.label,
    note: nettoyer(body.note, 300),
    repere: nettoyer(body.repere, 140),
    position: { lat, lng, precision, source },
    photo,
  };
}

function lienMaps({ lat, lng }) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function messageHTML(c, numero) {
  const p = c.position;
  return [
    `☕️ <b>Commande plage ${numero}</b>`,
    `👤 ${esc(c.prenom)} · 📞 ${esc(c.telInter)}`,
    `💶 <b>${euro(c.total)}</b> · ${esc(c.paiement)}${c.frais ? ` (dont livraison ${euro(c.frais)})` : ''}`,
    '',
    ...c.lignes.map((l) => {
      const opts = libelleOptions(l.produit, l.choix);
      return `• ${l.qty}× ${esc(l.produit.nom)}${opts ? ` <i>(${esc(opts)})</i>` : ''} — ${euro(l.total)}`;
    }),
    '',
    c.repere ? `📍 <b>Repère :</b> ${esc(c.repere)}` : null,
    `🧭 Position ${p.source}${p.precision ? ` (±${Math.round(p.precision)} m)` : ''} · <a href="${lienMaps(p)}">Ouvrir dans Maps</a>`,
    c.note ? `📝 ${esc(c.note)}` : null,
  ].filter((x) => x !== null).join('\n');
}

async function telegram(methode, donnees, estFormulaire = false) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${methode}`;
  const rep = await fetch(url, estFormulaire
    ? { method: 'POST', body: donnees }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(donnees) });
  const json = await rep.json().catch(() => ({}));
  if (!json.ok) throw new Error(`Telegram ${methode} : ${json.description || rep.status}`);
  return json.result;
}

async function envoyerTelegram(c, numero) {
  const chat = process.env.TELEGRAM_CHAT_ID;
  const texte = messageHTML(c, numero);
  const clavier = { inline_keyboard: [[{ text: '🧭 Itinéraire', url: lienMaps(c.position) }]] };
  let premier;
  if (c.photo && texte.length <= 1024) {
    const fd = new FormData();
    fd.append('chat_id', chat);
    fd.append('caption', texte);
    fd.append('parse_mode', 'HTML');
    fd.append('reply_markup', JSON.stringify(clavier));
    fd.append('photo', new Blob([c.photo.buffer], { type: `image/${c.photo.type}` }), `spot-${numero}.${c.photo.type === 'jpeg' ? 'jpg' : c.photo.type}`);
    premier = await telegram('sendPhoto', fd, true);
  } else {
    premier = await telegram('sendMessage', { chat_id: chat, text: texte, parse_mode: 'HTML', reply_markup: clavier, disable_web_page_preview: true });
    if (c.photo) {
      const fd = new FormData();
      fd.append('chat_id', chat);
      fd.append('caption', `📸 Spot de ${c.prenom} (${numero})`);
      fd.append('photo', new Blob([c.photo.buffer], { type: `image/${c.photo.type}` }), `spot-${numero}.jpg`);
      await telegram('sendPhoto', fd, true);
    }
  }
  // Épingle GPS cliquable, en réponse au message de la commande
  await telegram('sendLocation', {
    chat_id: chat,
    latitude: c.position.lat,
    longitude: c.position.lng,
    ...(c.position.precision ? { horizontal_accuracy: Math.min(1500, Math.round(c.position.precision)) } : {}),
    reply_parameters: { message_id: premier.message_id },
  });
}

async function envoyerEmail(c, numero) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${messageHTML(c, numero).replace(/\n/g, '<br>')}</div>`;
  const rep = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ORDER_EMAIL_FROM || 'Ady Coffee Shop <onboarding@resend.dev>',
      to: process.env.ORDER_EMAIL_TO.split(',').map((s) => s.trim()),
      subject: `☕️ Commande plage ${numero} · ${c.prenom} · ${euro(c.total)}`,
      html,
      attachments: c.photo ? [{ filename: `spot-${numero}.jpg`, content: c.photo.buffer.toString('base64') }] : [],
    }),
  });
  if (!rep.ok) throw new Error(`Resend : ${rep.status} ${await rep.text().catch(() => '')}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erreur: 'Méthode non autorisée.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }

  // Pot de miel anti-robots : champ caché que seuls les robots remplissent
  if (body?.site) return res.status(200).json({ ok: true, numero: numeroCommande(), total: 0 });

  if (CONFIG.bloquerHorsHoraires && !etatOuverture(CONFIG).livraison) {
    return res.status(409).json({ ok: false, erreur: 'La livraison plage est fermée pour le moment. Reviens pendant les horaires d’ouverture !' });
  }

  let commande;
  try {
    commande = valider(body);
  } catch (e) {
    if (e instanceof ErreurCommande) return res.status(e.status).json({ ok: false, erreur: e.message });
    throw e;
  }

  const numero = numeroCommande();
  const canaux = [];
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) canaux.push(envoyerTelegram(commande, numero));
  if (process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_TO) canaux.push(envoyerEmail(commande, numero));

  if (canaux.length === 0) {
    return res.status(503).json({ ok: false, code: 'non_configure', numero, erreur: 'La réception des commandes n’est pas encore configurée.' });
  }

  const resultats = await Promise.allSettled(canaux);
  resultats.filter((r) => r.status === 'rejected').forEach((r) => console.error('[commande]', numero, r.reason));
  if (resultats.every((r) => r.status === 'rejected')) {
    return res.status(502).json({ ok: false, code: 'envoi_echoue', erreur: 'La commande n’a pas pu être transmise au shop. Réessaie dans un instant.' });
  }

  return res.status(200).json({ ok: true, numero, total: commande.total });
}
