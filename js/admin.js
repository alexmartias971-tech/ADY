/* =====================================================================
   ADY Coffee Shop : back-office
   ===================================================================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const euro = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " €";
const cfg = window.ADY_CONFIG || {};
const SB = window.ADY_CLIENT;
const DEMO = !!(SB && SB.demo);
const TZ = "America/Guadeloupe";

const toastEl = $(".toast"); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600); }
function fail(e) { console.error(e); toast(e && e.message ? e.message : "Erreur, réessaie."); }

/* ===== Connexion ===== */
async function boot() {
  if (DEMO) {
    $("[data-demo-hint]").hidden = false; $("[data-demo-pill]").hidden = false; $("[data-demo-box]").hidden = false;
    const f = $("[data-login-form]"); if (!f.email.value) f.email.value = window.ADY_DEMO.email;
  }
  const { data: { session } } = await SB.auth.getSession();
  if (!session) { $("[data-login]").hidden = false; return; }
  let { data: role, error } = await SB.rpc("mon_role");
  if (error) { const r = await SB.rpc("is_admin"); role = r.data ? "gerant" : null; }   // base pas encore mise à jour
  if (role === "livreur") { location.replace("livreur"); return; }
  if (role !== "gerant") { $("[data-login]").hidden = false; $("[data-login-err]").textContent = "Ce compte n'a pas accès au back-office."; await SB.auth.signOut(); return; }
  $("[data-login]").hidden = true; $("[data-app]").hidden = false;
  start();
  if (!DEMO) purger();
}

/* ===== Durées de conservation : téléphone, repère et note effacés après 30 jours ===== */
async function purger() {
  try { await SB.rpc("purge_donnees"); } catch (e) { console.warn("Purge des données : réessai à la prochaine ouverture", e); }
}
$("[data-login-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget; $("[data-login-err]").textContent = "";
  const { error } = await SB.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
  if (error) { $("[data-login-err]").textContent = "E-mail ou mot de passe incorrect."; return; }
  boot();
});
$$("[data-logout]").forEach((b) => b.addEventListener("click", async () => { await SB.auth.signOut(); location.reload(); }));

/* ===== Onglets ===== */
$$("[data-view]").forEach((b) => b.addEventListener("click", () => {
  $$("[data-view]").forEach((x) => x.setAttribute("aria-selected", x === b ? "true" : "false"));
  $$("[data-view-panel]").forEach((p) => (p.hidden = p.dataset.viewPanel !== b.dataset.view));
  if (b.dataset.view === "menu") loadMenu();
  if (b.dataset.view === "stock") loadMenu();
  if (b.dataset.view === "points") loadPoints();
  // Clients et Chiffres : derrière le code secret ; on referme dès qu'on va ailleurs
  if (PROTEGES.includes(b.dataset.view)) montrerProtege(b.dataset.view); else verrouiller();
}));

/* ===== Son des nouvelles commandes ===== */
let soundOn = localStorage.getItem("ady-admin-sound") === "1";
let actx = null;
function paintSound() { const b = $("[data-sound]"); b.innerHTML = soundOn ? '<i class="long">Son activé</i><i class="court">Son ✓</i>' : '<i class="long">Son coupé</i><i class="court">Son ✕</i>'; b.setAttribute("aria-pressed", soundOn); }
$("[data-sound]").addEventListener("click", () => {
  soundOn = !soundOn; localStorage.setItem("ady-admin-sound", soundOn ? "1" : "0");
  if (soundOn) { actx = actx || new AudioContext(); actx.resume(); ding(); }
  paintSound();
});
function ding() {
  if (!soundOn) return;
  try {
    actx = actx || new AudioContext();
    [0, 0.18, 0.36].forEach((t, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = [880, 1175, 1568][i]; o.type = "sine";
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.3, actx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.3);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.32);
    });
  } catch (e) {}
}

/* ===== Réglages ===== */
let SETTINGS = null;
const ETATS = { orders_open: ["Ouvertes", "Fermées"], beach_open: ["Ouverte", "Fermée"] };
async function loadSettings() {
  const { data, error } = await SB.from("settings").select("*").eq("id", 1).single();
  if (error) return fail(error);
  SETTINGS = data;
  $$("[data-quick]").forEach((i) => (i.checked = !!data[i.dataset.quick]));
  $$("[data-reglage]").forEach((i) => {
    const v = data[i.dataset.reglage];
    if (i.type === "checkbox") i.checked = !!v;
    else if (i.type === "time") i.value = String(v || "").slice(0, 5);
    else i.value = v ?? "";
  });
  Object.entries(ETATS).forEach(([k, [oui, non]]) => { const b = $(`[data-etat-reglage="${k}"]`); if (b) b.textContent = data[k] ? oui : non; });
}
async function saveSettings(patch) {
  const { error } = await SB.from("settings").update(patch).eq("id", 1);
  if (error) return fail(error);
  toast("Enregistré"); loadSettings();
}
$$("[data-quick]").forEach((i) => i.addEventListener("change", () => saveSettings({ [i.dataset.quick]: i.checked })));
// chaque réglage s'enregistre dès qu'on le change
$("[data-view-panel=settings]").addEventListener("change", (e) => {
  const k = e.target.dataset.reglage; if (!k) return;
  let v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
  if (k === "beach_min") { v = Number(String(v).replace(",", ".")); if (!(v >= 0)) return toast("Montant invalide"); }
  if ((k === "food_from" || k === "food_to") && !v) return;
  saveSettings({ [k]: v });
});

/* ===== Commandes ===== */
let ORDERS = [];
let knownIds = new Set();
let firstLoad = true;
const dayInput = $("[data-day]");
function todayStr() { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); }
function dayRange(d) {
  // Guadeloupe = UTC−4 toute l'année (pas d'heure d'été)
  const start = new Date(d + "T00:00:00-04:00"), end = new Date(start.getTime() + 864e5);
  return [start.toISOString(), end.toISOString()];
}
const timeOf = (iso) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };

async function loadOrders() {
  const [from, to] = dayRange(dayInput.value || todayStr());
  const { data, error } = await SB.from("orders").select("*, order_items(*)").gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true });
  if (error) return fail(error);
  const fresh = data.filter((o) => !knownIds.has(o.id));
  if (!firstLoad && fresh.length && (dayInput.value || todayStr()) === todayStr()) {
    ding();
    toast(fresh.length > 1 ? `${fresh.length} nouvelles commandes` : `Nouvelle commande n° ${fresh[0].number}`);
    if ("Notification" in window && Notification.permission === "granted") new Notification("ADY · nouvelle commande", { body: `n° ${fresh[0].number} · ${fresh[0].mode === "plage" ? "livraison plage" : "à emporter"} · ${euro(fresh[0].total)}` });
  }
  data.forEach((o) => knownIds.add(o.id));
  firstLoad = false;
  ORDERS = data;
  renderOrders();
}

const NEXT = {
  shop: { new: ["preparing", "Accepter"], preparing: ["ready", "Prête au comptoir"], ready: ["done", "Récupérée"] },
  plage: { new: ["preparing", "Accepter"], preparing: ["delivering", "Prête : le livreur part"], ready: ["delivering", "Le livreur part"], delivering: ["arrived", "Livreur au point"], arrived: ["done", "Livrée"] }
};
const LABEL = { new: "Nouvelle", preparing: "En préparation", ready: "Prête", delivering: "En route", arrived: "Livreur au point", done: "Terminée", cancelled: "Annulée" };
// colonne du tableau pour chaque étape
const COL = { new: "new", preparing: "preparing", ready: "ready", delivering: "ready", arrived: "ready", done: "done", cancelled: "done" };

function orderCard(o) {
  const items = (o.order_items || []).map((i) => `<li><b>${i.qty} ×</b> ${esc(i.name)}${i.size ? ` <span class="tag">${esc(i.size)}</span>` : ""}${i.iced ? ` <span class="tag tag--ice">glacé</span>` : ""}${(i.options || []).filter((o) => !/^glac/i.test(o)).map((o) => ` <span class="tag tag--opt">${esc(o)}</span>`).join("")}${i.free_qty ? ` <span class="tag tag--free">1 offerte</span>` : ""}</li>`).join("");
  const nx = (NEXT[o.mode] || {})[o.status];
  const map = o.lat ? `https://maps.google.com/?q=${o.lat},${o.lng}` : null;
  const pt = POINTS.find((x) => x.id === o.point_id);
  const [lieu, ...signe] = String(o.spot || "").split(" · ");
  return `<article class="order order--${o.mode} order--${o.status}" data-order="${o.id}">
    <header>
      <span class="order__num">n° ${o.number}</span>
      <span class="pill pill--${o.mode}">${o.mode === "plage" ? "Plage" : "Au shop"}</span>
      <span class="order__time" title="${timeOf(o.created_at)}">${timeOf(o.created_at)} · ${ago(o.created_at)}</span>
    </header>
    <p class="order__who"><b>${esc(o.customer_name)}</b>${o.phone ? ` · <a href="tel:${esc(o.phone.replace(/\s/g, ""))}">${esc(o.phone)}</a>` : ""}${o.mode === "shop" && o.pickup_when ? ` · ${esc(o.pickup_when)}` : ""}</p>
    <ul class="order__items">${items}</ul>
    ${o.note ? `<p class="order__note">${esc(o.note)}</p>` : ""}
    ${o.mode === "plage" ? `<div class="order__beach">
        <div class="order__point">
          ${pt && pt.photo_url ? `<button class="order__pointimg" type="button" data-photo-url="${esc(pt.photo_url)}" aria-label="Voir la photo du point"><img src="${esc(pt.photo_url)}" alt=""></button>` : ""}
          <p><small>Point de livraison</small><b>${esc(lieu || (pt ? pt.name : "—"))}</b>${signe.length ? `<span>Signe : ${esc(signe.join(" · "))}</span>` : ""}</p>
        </div>
        ${map ? `<a class="btn btn--small btn--ghost" href="${map}" target="_blank" rel="noopener">Voir sur la carte</a>` : ""}
      </div>` : ""}
    ${o.loyalty_code ? `<p class="order__loyal">Carte ${esc(o.loyalty_code)}${o.reward_claimed ? " · <b>boisson offerte : vérifier la carte</b>" : ""}</p>` : ""}
    ${o.status === "cancelled" && o.cancel_reason ? `<p class="order__motif">${esc(o.cancel_reason)}</p>` : ""}
    ${["delivering", "arrived"].includes(o.status) ? `<p class="order__etape">${o.status === "arrived" ? "Le livreur attend au point" : "En route vers le point"}</p>` : ""}
    <footer>
      <span class="order__total">${o.discount > 0 ? `<s>${euro(o.subtotal)}</s> ` : ""}${euro(o.total)}</span>
      ${o.status === "new" ? `<button class="btn btn--small btn--danger" type="button" data-refuser>Refuser</button>` : ""}
      ${nx ? `<button class="btn btn--small${o.status === "new" ? " btn--go" : ""}" type="button" data-status="${nx[0]}">${nx[1]}</button>` : `<span class="pill">${LABEL[o.status]}</span>`}
      ${!["new", "done", "cancelled"].includes(o.status) ? `<button class="linkish" type="button" data-refuser>Annuler</button>` : ""}
    </footer>
  </article>`;
}
function renderOrders() {
  ["new", "preparing", "ready", "done"].forEach((c) => {
    const list = ORDERS.filter((o) => COL[o.status] === c);
    if (c === "done") list.reverse();
    const el = $(`[data-col="${c}"] .col__list`);
    el.innerHTML = list.length ? list.map(orderCard).join("") : `<p class="empty">${c === "new" ? "Aucune commande à valider." : "Rien ici."}</p>`;
    $(`[data-col="${c}"] h2`).dataset.count = list.length;
    $(`[data-col-count="${c}"]`).textContent = list.length;
  });
  const nNew = ORDERS.filter((o) => o.status === "new").length;
  const b = $("[data-new-count]"); b.hidden = !nNew; b.textContent = nNew;
  document.title = (nNew ? `(${nNew}) ` : "") + "Back-office · ADY";
}
$(".board").addEventListener("click", async (e) => {
  const card = e.target.closest("[data-order]"); if (!card) return;
  const id = card.dataset.order;
  const st = e.target.closest("[data-status]");
  if (st) {
    st.disabled = true;
    const o = ORDERS.find((x) => x.id === id);
    const { error } = await SB.from("orders").update({ status: st.dataset.status }).eq("id", id);
    if (error) return fail(error);
    if (o && o.status === "new") toast(`n° ${o.number} acceptée : direction « En préparation »`);
    loadOrders();
  }
  if (e.target.closest("[data-refuser]")) ouvrirMotif(ORDERS.find((x) => x.id === id));
  const ph = e.target.closest("[data-photo-url]");
  if (ph) { const lb = $("[data-lightbox]"); $("img", lb).src = ph.dataset.photoUrl; lb.hidden = false; $("[data-lightbox-close]").focus(); }
});
$("[data-lightbox]").addEventListener("click", (e) => { if (e.target.closest("[data-lightbox-close]") || e.target === e.currentTarget) e.currentTarget.hidden = true; });
addEventListener("keydown", (e) => { if (e.key === "Escape") { $("[data-lightbox]").hidden = true; $("[data-motif]").hidden = true; } });

// Téléphone : une étape à la fois (onglets au-dessus du tableau)
$("[data-board-tabs]").addEventListener("click", (e) => {
  const b = e.target.closest("[data-col-tab]"); if (!b) return;
  $(".board").dataset.boardCol = b.dataset.colTab;
  $$("[data-col-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
});

/* ===== Refuser / annuler une commande : le client voit le motif ===== */
const MOTIFS = [
  ["epuise", "Un produit est épuisé", "Un produit de ta commande est épuisé."],
  ["affluence", "Trop de commandes en ce moment", "Trop de commandes en ce moment : réessaie dans un petit moment."],
  ["plage", "Pas de livraison plage pour l’instant", "Pas de livraison sur la plage pour l’instant : tu peux passer au shop."],
  ["fermeture", "Le shop ferme bientôt", "Le shop ferme bientôt. À demain !"],
  ["autre", "Autre motif", ""]
];
let motifPour = null;
const motifForm = $("[data-motif-form]");
function ouvrirMotif(o) {
  if (!o) return;
  motifPour = o;
  $("[data-motif-titre]").textContent = `${o.status === "new" ? "Refuser" : "Annuler"} la commande n° ${o.number}`;
  $("[data-motif-choix]").innerHTML = MOTIFS.filter(([k]) => k !== "plage" || o.mode === "plage")
    .map(([k, l], i) => `<label class="motif__opt"><input type="radio" name="motif" value="${k}"${i ? "" : " checked"}><span>${esc(l)}</span></label>`).join("");
  const prods = [...new Map((o.order_items || []).filter((i) => i.product_id).map((i) => [i.product_id, i.name])).entries()];
  $("[data-motif-produits]").innerHTML = prods.map(([id, n]) => `<label class="motif__prod"><input type="checkbox" value="${esc(id)}" data-nom="${esc(n)}"> ${esc(n)}</label>`).join("");
  motifForm.autre.value = "";
  majMotif();
  $("[data-motif]").hidden = false;
  $("input[name=motif]", motifForm).focus();
}
function majMotif() {
  const v = motifForm.motif.value;
  $("[data-motif-epuise]").hidden = v !== "epuise" || !$("[data-motif-produits]").children.length;
  $("[data-motif-autre]").hidden = v !== "autre";
}
motifForm.addEventListener("change", majMotif);
$("[data-motif-fermer]").addEventListener("click", () => ($("[data-motif]").hidden = true));
$("[data-motif]").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.hidden = true; });
motifForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const o = motifPour; if (!o) return;
  const v = motifForm.motif.value;
  const coches = $$("[data-motif-produits] input:checked");
  let raison = (MOTIFS.find(([k]) => k === v) || [])[2];
  if (v === "epuise" && coches.length) raison = `Épuisé : ${coches.map((c) => c.dataset.nom).join(", ")}.`;
  if (v === "autre") { raison = motifForm.autre.value.trim(); if (!raison) return toast("Écris le motif pour le client"); }
  const { error } = await SB.from("orders").update({ status: "cancelled", cancel_reason: raison }).eq("id", o.id);
  if (error) return fail(error);
  if (v === "epuise" && coches.length) {
    const r = await SB.from("products").update({ available: false }).in("id", coches.map((c) => c.value));
    if (r.error) fail(r.error); else loadMenu();
  }
  $("[data-motif]").hidden = true;
  toast(`n° ${o.number} ${o.status === "new" ? "refusée" : "annulée"} : le client est prévenu`);
  loadOrders();
});
$("[data-demo-reset]").addEventListener("click", () => { if (!confirm("Remettre la démo à zéro (carte, stock et commandes d'exemple) ?")) return; window.ADY_DEMO.reset(); firstLoad = true; knownIds = new Set(); loadSettings(); loadPoints(); loadOrders(); loadMenu(); toast("Démo réinitialisée"); });
dayInput.addEventListener("change", () => { firstLoad = true; loadOrders(); });

function startRealtime() {
  let t;
  const refresh = () => { clearTimeout(t); t = setTimeout(loadOrders, 400); };
  SB.channel("ady-orders")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
    .subscribe((status) => {
      const el = $("[data-live]");
      if (status === "SUBSCRIBED") { el.textContent = "En direct : les nouvelles commandes arrivent toutes seules."; el.classList.add("is-on"); }
      else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) { el.textContent = "Direct coupé, actualisation toutes les 20 s."; el.classList.remove("is-on"); }
    });
  setInterval(loadOrders, 20000);            // filet de sécurité
  setInterval(renderOrders, 60000);          // met à jour les « il y a X min »
}

/* ===== Carte & prix ===== */
let CATS = [], PRODS = [], VARS = [], GROUPS = [], CHOICES = [], LINKS = [];
async function loadMenu() {
  const [c, p, v, g, ch, l] = await Promise.all([
    SB.from("categories").select("*").order("sort"),
    SB.from("products").select("*").eq("archived", false).order("sort"),
    SB.from("product_variants").select("*").order("sort"),
    SB.from("option_groups").select("*").order("sort"),
    SB.from("option_choices").select("*").order("sort"),
    SB.from("product_option_groups").select("*")
  ]);
  const bad = [c, p, v, g, ch, l].find((r) => r.error); if (bad) return fail(bad.error);
  CATS = c.data; PRODS = p.data; VARS = v.data; GROUPS = g.data; CHOICES = ch.data; LINKS = l.data;
  renderMenuEditor(); renderStock();
}
function optionsEditor() {
  return `<details class="cat cat--opts"><summary><span>Options et suppléments</span><small>lait, sirop, format…</small></summary>
    <p class="cat__intro">Le prix indiqué s'ajoute au prix du produit. Une option décochée n'est plus proposée sur le site.</p>
    ${GROUPS.map((g) => `<div class="ogroup"><h3>${esc(g.name)}</h3>${CHOICES.filter((c) => c.group_id === g.id).map((c) => `
      <div class="ochoice" data-choice-id="${c.id}">
        <input data-cf2="label" value="${esc(c.label)}" aria-label="Nom de l'option">
        <label class="ochoice__price">+ <input data-cf2="price_delta" type="number" min="0" step="0.1" value="${Number(c.price_delta)}" aria-label="Supplément en euros"> €</label>
        <label class="switch"><input type="checkbox" data-cf2="available" ${c.available ? "checked" : ""}><span></span>Proposée</label>
      </div>`).join("")}
      <button class="btn btn--small btn--ghost" type="button" data-add-choice="${esc(g.id)}">Ajouter un choix</button></div>`).join("")}
  </details>`;
}
// Les dessins des produits viennent du site lui-même : le gérant voit le même visuel que ses clients
// (dans un script classique, import() part du dossier du script : js/)
let ILL = null;
import("./illustrations.js").then((m) => { ILL = m; if (PRODS.length) renderMenuEditor(); });
const TEINTES = { cafeinees: "#f4b89f", matcha: "#c9d8a6", gourmandes: "#f2d3b0", rafraichissements: "#bfdce5", sale: "#f7d58a", merch: "#efd2b2" };
const catDe = (p) => CATS.find((c) => c.id === p.category_id) || {};
const dessin = (p) => (ILL ? ILL.illustration({ nom: p.name, kind: catDe(p).kind, image: p.image, glace: p.iced }) : "");
function tuile(p) {
  return `<button class="ptile${p.available ? "" : " is-off"}" type="button" data-edit="${p.id}" style="--teinte:${TEINTES[p.category_id] || "#f2d3b0"}">
    <span class="ptile__art">${dessin(p)}</span>
    <span class="ptile__nom">${esc(p.name)}</span>
    <span class="ptile__prix">${euro(p.price)}</span>
    <span class="ptile__tags">${p.available ? "" : `<em class="t-off">Épuisé</em>`}${p.featured ? "<em>Accueil</em>" : ""}${p.signature ? "<em>Signature</em>" : ""}${p.allergens ? "" : `<em class="t-warn">Allergènes ?</em>`}</span>
  </button>`;
}
function renderMenuEditor() {
  $("[data-options-editor]").innerHTML = optionsEditor();
  $("[data-menu-editor]").innerHTML = CATS.map((c) => {
    const ps = PRODS.filter((p) => p.category_id === c.id);
    return `<section class="cat" data-cat="${esc(c.id)}">
      <header class="cat__tete"><h2>${esc(c.title)}</h2><small>${ps.length} produit${ps.length > 1 ? "s" : ""}</small></header>
      <div class="ptiles">${ps.map(tuile).join("")}<button class="ptile ptile--ajout" type="button" data-add-product><span aria-hidden="true">+</span>Ajouter un produit</button></div>
      <details class="cat__edit"><summary>Modifier la catégorie</summary><div class="cat__meta">
        <label>Titre<input data-cf="title" value="${esc(c.title)}"></label>
        <label>Titre de l'encadré signature<input data-cf="signature_label" value="${esc(c.signature_label || "")}"></label>
        <label>Horaires affichés<input data-cf="hours" value="${esc(c.hours || "")}" placeholder="ex : 11h – 15h"></label>
        <label>Note en bas<input data-cf="footnote" value="${esc(c.footnote || "")}"></label>
      </div></details>
    </section>`;
  }).join("");
  if (FICHE) remplirOptions(PRODS.find((x) => x.id === FICHE));
}

// Enregistre un champ d'un produit (nom, prix, description, en vente…)
async function sauverProduit(pid, f, el) {
  let v = el.type === "checkbox" ? el.checked : el.value.trim();
  if (f === "price") { v = Number(String(v).replace(",", ".")); if (!(v >= 0)) { toast("Prix invalide"); return false; } }
  if (f === "name" && !v) { toast("Le nom ne peut pas être vide"); return false; }
  if (f === "badge" || f === "allergens") v = v || null;
  const { error } = await SB.from("products").update({ [f]: v }).eq("id", pid);
  if (error) { fail(error); return false; }
  const p = PRODS.find((x) => x.id === pid); if (p) p[f] = v;
  renderStock();
  return true;
}
// Ajoute ou retire une option (lait, sirop, taille, chaud ou glacé) pour un produit
async function sauverOption(pid, gid, oui) {
  const r = oui
    ? await SB.from("product_option_groups").insert({ product_id: pid, group_id: gid, sort: (GROUPS.find((g) => g.id === gid) || {}).sort || 0 })
    : await SB.from("product_option_groups").delete().eq("product_id", pid).eq("group_id", gid);
  if (r.error) { fail(r.error); return false; }
  if (oui) LINKS.push({ product_id: pid, group_id: gid }); else LINKS = LINKS.filter((l) => !(l.product_id === pid && l.group_id === gid));
  return true;
}

/* ----- Fiche produit : champs simples + aperçu du site en direct ----- */
let FICHE = null;
let apercuPret = false;
const fiche = $("[data-fiche]");
const ficheForm = $("[data-fiche-form]");
const cadreApercu = $("[data-apercu-frame]");
const LIBELLES_OPTIONS = { lait: "Le lait", sirop: "Un sirop", format: "La taille", temperature: "Chaud ou glacé" };
window.addEventListener("message", (e) => {
  if (e.origin === location.origin && e.data && e.data.type === "ady-apercu-pret") { apercuPret = true; envoyerApercu(); }
});
const champ = (f) => ficheForm.querySelector(`[data-f="${f}"]`);
function remplirOptions(p) {
  if (!p) return;
  $("[data-fiche-options]").innerHTML = GROUPS.map((g) => `<label class="puce"><input type="checkbox" data-link="${esc(g.id)}" ${LINKS.some((l) => l.product_id === p.id && l.group_id === g.id) ? "checked" : ""}><span>${esc(LIBELLES_OPTIONS[g.id] || g.name)}</span></label>`).join("");
}
function brouillon() {
  const p = PRODS.find((x) => x.id === FICHE);
  if (!p) return null;
  const d = { ...p };
  ["name", "price", "description", "allergens", "badge"].forEach((f) => (d[f] = champ(f).value));
  ["available", "featured", "signature"].forEach((f) => (d[f] = champ(f).checked));
  return d;
}
function envoyerApercu() {
  const d = brouillon();
  if (d && apercuPret && cadreApercu.contentWindow) cadreApercu.contentWindow.postMessage({ type: "ady-apercu", produit: d }, location.origin);
}
function majVente() { $("[data-vente-txt]").textContent = champ("available").checked ? "En vente" : "Épuisé : pas commandable"; }
// l'accueil montre 4 produits « mis en avant » au maximum
function majCompteAccueil() {
  const p = PRODS.find((x) => x.id === FICHE);
  if (!p || catDe(p).kind === "merch") { $("[data-accueil-compte]").textContent = ""; return; }
  const n = PRODS.filter((x) => x.id !== FICHE && x.featured && catDe(x).kind !== "merch").length + (champ("featured").checked ? 1 : 0);
  $("[data-accueil-compte]").textContent = n > 4 ? `${n} produits cochés : seuls les 4 premiers de la carte s’affichent.` : `${n} sur 4 places utilisées.`;
}
function ouvrirFicheProduit(pid) {
  const p = PRODS.find((x) => x.id === pid);
  if (!p) return;
  FICHE = pid;
  champ("name").value = p.name; champ("price").value = Number(p.price); champ("description").value = p.description || "";
  champ("allergens").value = p.allergens || ""; champ("badge").value = p.badge || "";
  champ("available").checked = !!p.available; champ("featured").checked = !!p.featured; champ("signature").checked = !!p.signature;
  $("#fiche-titre").textContent = p.name;
  $("[data-fiche-etat]").textContent = "Enregistré automatiquement";
  remplirOptions(p); majVente(); majCompteAccueil();
  fiche.classList.remove("is-apercu");
  fiche.hidden = false;
  document.documentElement.style.overflow = "hidden";
  envoyerApercu();
  $(".fiche__tete [data-fiche-fermer]").focus({ preventScroll: true });
}
function fermerFicheProduit() {
  if (fiche.hidden) return;
  fiche.hidden = true;
  document.documentElement.style.overflow = "";
  const pid = FICHE; FICHE = null;
  renderMenuEditor();
  $(`[data-edit="${pid}"]`)?.focus({ preventScroll: true });
}
ficheForm.addEventListener("submit", (e) => e.preventDefault());
ficheForm.addEventListener("input", () => { majVente(); majCompteAccueil(); envoyerApercu(); });
ficheForm.addEventListener("change", async (e) => {
  if (!FICHE) return;
  const etat = $("[data-fiche-etat]");
  etat.textContent = "Enregistrement…";
  let ok = true;
  if (e.target.dataset.link) ok = await sauverOption(FICHE, e.target.dataset.link, e.target.checked);
  else if (e.target.dataset.f) ok = await sauverProduit(FICHE, e.target.dataset.f, e.target);
  if (e.target.dataset.f === "name" && ok) $("#fiche-titre").textContent = e.target.value.trim();
  etat.textContent = ok ? "Enregistré ✓" : "Pas enregistré : vérifie ce champ";
  envoyerApercu();
});
fiche.addEventListener("click", async (e) => {
  if (e.target.closest("[data-fiche-fermer]")) return fermerFicheProduit();
  if (e.target.closest("[data-fiche-voir]")) return fiche.classList.toggle("is-apercu");
  const mv = e.target.closest("[data-fiche-move]");
  if (mv && FICHE) {
    const p = PRODS.find((x) => x.id === FICHE);
    const sib = PRODS.filter((x) => x.category_id === p.category_id && x.signature === p.signature);
    const i = sib.indexOf(p), j = i + Number(mv.dataset.ficheMove);
    if (j < 0 || j >= sib.length) return toast(j < 0 ? "Il est déjà en premier" : "Il est déjà en dernier");
    [sib[i], sib[j]] = [sib[j], sib[i]];
    await Promise.all(sib.map((x, k) => SB.from("products").update({ sort: k }).eq("id", x.id)));
    sib.forEach((x, k) => (x.sort = k));
    PRODS.sort((a, b) => a.sort - b.sort);
    toast(mv.dataset.ficheMove < 0 ? "Monté d’un cran" : "Descendu d’un cran");
    return;
  }
  if (e.target.closest("[data-fiche-retirer]") && FICHE) {
    if (!confirm("Retirer ce produit de la carte ? (l'historique des commandes est conservé)")) return;
    const { error } = await SB.from("products").update({ archived: true }).eq("id", FICHE);
    if (error) return fail(error);
    fiche.hidden = true; document.documentElement.style.overflow = ""; FICHE = null;
    toast("Produit retiré de la carte"); loadMenu();
  }
});
addEventListener("keydown", (e) => { if (e.key === "Escape" && !fiche.hidden) fermerFicheProduit(); });

/* ----- La page Carte & prix : vignettes, catégories, options ----- */
const menuPanel = $('[data-view-panel="menu"]');
menuPanel.addEventListener("change", async (e) => {
  const oc = e.target.closest("[data-choice-id]");
  if (oc && e.target.dataset.cf2) {
    const f = e.target.dataset.cf2;
    let v = e.target.type === "checkbox" ? e.target.checked : e.target.value.trim();
    if (f === "price_delta") { v = Number(String(v).replace(",", ".")); if (!(v >= 0)) return toast("Prix invalide"); }
    if (f === "label" && !v) return toast("Le nom ne peut pas être vide");
    const { error } = await SB.from("option_choices").update({ [f]: v }).eq("id", oc.dataset.choiceId);
    if (error) return fail(error);
    toast("Enregistré"); return;
  }
  const cat = e.target.closest("[data-cat]");
  if (cat && e.target.dataset.cf) {
    const { error } = await SB.from("categories").update({ [e.target.dataset.cf]: e.target.value.trim() || null }).eq("id", cat.dataset.cat);
    if (error) return fail(error);
    const c = CATS.find((x) => x.id === cat.dataset.cat); if (c) c[e.target.dataset.cf] = e.target.value.trim() || null;
    toast("Enregistré");
  }
});
menuPanel.addEventListener("click", async (e) => {
  const ed = e.target.closest("[data-edit]");
  if (ed) return ouvrirFicheProduit(ed.dataset.edit);
  const ac = e.target.closest("[data-add-choice]");
  if (ac) {
    const label = prompt("Nom du choix (ex : Lait d'avoine) ?"); if (!label) return;
    const d = Number(String(prompt("Supplément en euros ?", "0.5") || "0").replace(",", "."));
    const { error } = await SB.from("option_choices").insert({ group_id: ac.dataset.addChoice, label: label.trim(), price_delta: d >= 0 ? d : 0, sort: 99 });
    if (error) return fail(error);
    toast("Choix ajouté"); loadMenu(); return;
  }
  const add = e.target.closest("[data-add-product]");
  if (add) {
    const cat = add.closest("[data-cat]").dataset.cat;
    const name = prompt("Nom du nouveau produit ?"); if (!name || !name.trim()) return;
    const price = Number(String(prompt("Prix en euros ?", "5") || "").replace(",", "."));
    if (!(price >= 0)) return toast("Prix invalide");
    const { data, error } = await SB.from("products").insert({ category_id: cat, name: name.trim(), price, sort: 999 }).select().single();
    if (error) return fail(error);
    if ((CATS.find((c) => c.id === cat) || {}).kind === "merch") {
      await SB.from("product_variants").insert(["S", "M", "L", "XL"].map((label, sort) => ({ product_id: data.id, label, sort })));
    }
    toast("Produit ajouté : complète sa fiche");
    await loadMenu();
    ouvrirFicheProduit(data.id);
  }
});
$("[data-add-cat]").addEventListener("click", async () => {
  const title = prompt("Nom de la catégorie ?"); if (!title) return;
  const kind = confirm("Ce sont des boissons ? (OK = boissons, Annuler = plats salés)") ? "drink" : "food";
  const id = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat-" + Date.now();
  const { error } = await SB.from("categories").insert({ id, title: title.trim(), kind, sort: CATS.length });
  if (error) return fail(error);
  toast("Catégorie ajoutée"); loadMenu();
});

/* ===== Stock ===== */
function stockCell(table, id, stock) {
  const tracked = stock !== null && stock !== undefined;
  return `<div class="stock" data-table="${table}" data-id="${id}">
    <label class="switch"><input type="checkbox" data-track ${tracked ? "checked" : ""}><span></span>Suivi</label>
    ${tracked ? `<button class="iconbtn" type="button" data-step="-1" aria-label="Retirer 1">−</button>
      <input type="number" min="0" value="${stock}" data-qty aria-label="Quantité en stock" class="${stock === 0 ? "is-zero" : stock <= 3 ? "is-low" : ""}">
      <button class="iconbtn" type="button" data-step="1" aria-label="Ajouter 1">+</button>` : `<span class="muted">Non suivi</span>`}
  </div>`;
}
function renderStock() {
  $("[data-stock]").innerHTML = CATS.map((c) => {
    const ps = PRODS.filter((p) => p.category_id === c.id); if (!ps.length) return "";
    return `<div class="sgroup"><h2>${esc(c.title)}</h2>${ps.map((p) => {
      const vs = VARS.filter((v) => v.product_id === p.id);
      return `<div class="srow${p.available ? "" : " is-off"}">
        <div class="srow__name"><b>${esc(p.name)}</b>
          <label class="switch"><input type="checkbox" data-avail="${p.id}" ${p.available ? "checked" : ""}><span></span>${p.available ? "En vente" : "Épuisé aujourd'hui"}</label>
        </div>
        ${vs.length ? `<div class="srow__vars">${vs.map((v) => `<div class="var"><span>${esc(v.label)}</span>${stockCell("product_variants", v.id, v.stock)}</div>`).join("")}</div>` : stockCell("products", p.id, p.stock)}
      </div>`;
    }).join("")}</div>`;
  }).join("");
}
const stockEl = $("[data-stock]");
async function setStock(table, id, value) {
  const { error } = await SB.from(table).update({ stock: value }).eq("id", id);
  if (error) return fail(error);
  const arr = table === "products" ? PRODS : VARS; const r = arr.find((x) => x.id === id); if (r) r.stock = value;
  renderStock();
}
stockEl.addEventListener("click", (e) => {
  const st = e.target.closest("[data-step]"); if (!st) return;
  const cell = st.closest("[data-table]"), inp = $("[data-qty]", cell);
  setStock(cell.dataset.table, cell.dataset.id, Math.max(0, Number(inp.value || 0) + Number(st.dataset.step)));
});
stockEl.addEventListener("change", async (e) => {
  const cell = e.target.closest("[data-table]");
  if (cell && e.target.matches("[data-track]")) return setStock(cell.dataset.table, cell.dataset.id, e.target.checked ? 10 : null);
  if (cell && e.target.matches("[data-qty]")) return setStock(cell.dataset.table, cell.dataset.id, Math.max(0, Math.floor(Number(e.target.value || 0))));
  const av = e.target.closest("[data-avail]");
  if (av) {
    const { error } = await SB.from("products").update({ available: av.checked }).eq("id", av.dataset.avail);
    if (error) return fail(error);
    const p = PRODS.find((x) => x.id === av.dataset.avail); if (p) p.available = av.checked;
    renderStock(); renderMenuEditor(); toast(av.checked ? "Remis en vente" : "Marqué épuisé");
  }
});
$("[data-restore-all]").addEventListener("click", async () => {
  if (!confirm("Remettre tous les produits « épuisés » en vente ?")) return;
  const { error } = await SB.from("products").update({ available: true }).eq("available", false).eq("archived", false);
  if (error) return fail(error);
  toast("Tout est remis en vente"); loadMenu();
});

/* ===== Points de livraison sur la plage ===== */
let POINTS = [];
async function loadPoints() {
  const { data, error } = await SB.from("delivery_points").select("*").order("sort");
  if (error) return fail(error);
  POINTS = data;
  renderPoints();
  if (ORDERS.length) renderOrders();
}
const slugify = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "point";
function pointRow(p, i) {
  return `<article class="ptrow${p.active ? "" : " is-off"}" data-point="${p.id}">
    <div class="ptrow__photo">
      ${p.photo_url ? `<img src="${esc(p.photo_url)}" alt="Photo du point ${esc(p.name)}">` : `<span class="muted">Pas encore de photo</span>`}
      <label class="btn btn--small btn--ghost">Changer la photo<input type="file" accept="image/*" capture="environment" data-photo-point hidden></label>
    </div>
    <div class="ptrow__main">
      <div class="ptrow__line"><span class="ptrow__n">${i + 1}</span><input data-pf="name" value="${esc(p.name)}" aria-label="Nom du point"></div>
      <input data-pf="hint" value="${esc(p.hint || "")}" placeholder="Indication (ex : au milieu de la plage, face au ponton)" aria-label="Indication pour le client">
      <p class="ptrow__pos">Position : <a href="https://maps.google.com/?q=${p.lat},${p.lng}" target="_blank" rel="noopener">${Number(p.lat).toFixed(5)}, ${Number(p.lng).toFixed(5)}</a> · lien du QR : <code>/carte?point=${esc(p.slug)}</code></p>
      <div class="ptrow__actions">
        <button class="btn btn--small" type="button" data-ici>Prendre ma position ici</button>
        <button class="btn btn--small btn--ghost" type="button" data-qr>QR code à imprimer</button>
        <label class="switch"><input type="checkbox" data-pf="active" ${p.active ? "checked" : ""}${!p.photo_url && !p.active ? " disabled" : ""}><span></span>Proposé aux clients</label>
        ${p.photo_url ? "" : `<span class="ptrow__manque">Ajoute une photo pour le proposer</span>`}
        <button class="iconbtn" type="button" data-pmove="-1" title="Monter">↑</button>
        <button class="iconbtn" type="button" data-pmove="1" title="Descendre">↓</button>
        <button class="linkish" type="button" data-supprimer>Supprimer</button>
      </div>
    </div>
  </article>`;
}
function renderPoints() {
  $("[data-points-admin]").innerHTML = POINTS.length ? POINTS.map(pointRow).join("")
    : `<p class="empty">Aucun point pour l'instant : la livraison plage n'est pas proposée aux clients tant qu'il n'y en a pas au moins un.</p>`;
  majCartePoints();
}
// Carte : la même illustration de la plage que sur le site ; chaque numéro se glisse à sa place,
// la position est enregistrée en le lâchant
let cartePts = null, cadree = false, ZONE = null;
const reperes = [];
import("./reglages.js").then(({ CONFIG }) => { ZONE = CONFIG.zone; majCartePoints(); });
function majCartePoints() {
  const el = $("[data-points-map]");
  if (!window.L || !ZONE || !el || !el.offsetWidth) return;
  if (!cartePts) {
    cartePts = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, maxZoom: 19, maxBoundsViscosity: 1 });
    const b = L.latLngBounds(ZONE.fond.bornes);
    L.imageOverlay(ZONE.fond.image, b, { interactive: false }).addTo(cartePts);
    cartePts.setMaxBounds(b.pad(0.02));
    cartePts.attributionControl.setPrefix(false);
    cartePts.attributionControl.addAttribution('Dessin ADY · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>');
    cartePts.setMinZoom(Math.max(14, cartePts.getBoundsZoom(b, true)));
  }
  cartePts.invalidateSize();
  reperes.splice(0).forEach((m) => m.remove());
  const bornes = L.latLngBounds([]);
  POINTS.forEach((p, i) => {
    const m = L.marker([p.lat, p.lng], { draggable: true, autoPan: true, title: p.name,
      icon: L.divIcon({ className: "ady-point" + (p.active ? "" : " is-off"), html: `<span class="ady-point__n">${i + 1}</span>`, iconSize: [40, 40], iconAnchor: [20, 20] }) })
      .bindTooltip(esc(p.name), { direction: "top", offset: [0, -18] }).addTo(cartePts);
    m.on("dragend", () => { const ll = m.getLatLng(); majPoint(p.id, { lat: ll.lat, lng: ll.lng }, `« ${p.name} » déplacé`); });
    reperes.push(m); bornes.extend([p.lat, p.lng]);
  });
  if (!cadree) {
    if (bornes.isValid()) cartePts.fitBounds(bornes.pad(0.4), { maxZoom: 18, animate: false }); else cartePts.setView([16.2181, -61.3965], 16);
    cadree = true;
  }
}
async function majPoint(id, patch, message = "Enregistré") {
  const { error } = await SB.from("delivery_points").update(patch).eq("id", id);
  if (error) return fail(error);
  Object.assign(POINTS.find((x) => x.id === id) || {}, patch);
  renderPoints(); toast(message);
}
// Photo prise sur place : réduite dans le navigateur, puis enregistrée (stockage public « points »)
async function photoPoint(id, fichier) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const r = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    // un point tout neuf (sans photo, pas encore proposé) est proposé aux clients dès sa première photo
    const p = POINTS.find((x) => x.id === id) || {};
    const premiere = !p.photo_url && !p.active;
    const fin = (photo_url) => majPoint(id, premiere ? { photo_url, active: true } : { photo_url }, premiere ? "Photo enregistrée : le point est proposé aux clients" : "Photo enregistrée");
    if (DEMO) return fin(c.toDataURL("image/jpeg", 0.7));
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.82));
    const chemin = `${id}-${Date.now()}.jpg`;
    const up = await SB.storage.from("points").upload(chemin, blob, { contentType: "image/jpeg" });
    if (up.error) return fail(up.error);
    const { data } = SB.storage.from("points").getPublicUrl(chemin);
    fin(data.publicUrl);
  } catch (e) { fail(e); } finally { URL.revokeObjectURL(url); }
}
// Affiche à imprimer : QR code qui ouvre la carte avec ce point déjà choisi
function ouvrirAffiche(p) {
  const url = `${location.origin}/carte?point=${encodeURIComponent(p.slug)}`;
  const qr = qrcode(0, "M"); qr.addData(url); qr.make();
  $("[data-affiche-page]").innerHTML = `
    <img class="affiche__logo" src="assets/mark-red.webp" alt="ADY Coffee Shop">
    <h2>Commande ici,<br>on te livre ici</h2>
    <div class="affiche__qr">${qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true, title: "QR code : commander, point " + p.name })}</div>
    <p class="affiche__point">Point « ${esc(p.name)} »</p>
    <p class="affiche__aide">Scanne avec ton téléphone · livré ici en 15 à 20 min · paiement à la livraison</p>
    <p class="affiche__url">${esc(url.replace(/^https?:\/\//, ""))}</p>`;
  $("[data-affiche]").hidden = false;
}
$("[data-affiche-fermer]").addEventListener("click", () => ($("[data-affiche]").hidden = true));
$("[data-affiche-imprimer]").addEventListener("click", () => window.print());
const pointsEl = $("[data-points-admin]");
pointsEl.addEventListener("change", (e) => {
  const row = e.target.closest("[data-point]"); if (!row) return;
  if (e.target.matches("[data-photo-point]")) { const f = e.target.files && e.target.files[0]; if (f) photoPoint(row.dataset.point, f); return; }
  const f = e.target.dataset.pf; if (!f) return;
  const v = e.target.type === "checkbox" ? e.target.checked : e.target.value.trim();
  if (f === "name" && !v) { toast("Le nom ne peut pas être vide"); return renderPoints(); }
  majPoint(row.dataset.point, { [f]: v }, f === "active" ? (v ? "Point proposé aux clients" : "Point masqué") : "Enregistré");
});
pointsEl.addEventListener("click", async (e) => {
  const row = e.target.closest("[data-point]"); if (!row) return;
  const p = POINTS.find((x) => x.id === row.dataset.point); if (!p) return;
  if (e.target.closest("[data-qr]")) return ouvrirAffiche(p);
  if (e.target.closest("[data-ici]")) {
    if (!("geolocation" in navigator)) return toast("Localisation indisponible sur cet appareil");
    toast("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (pos) => majPoint(p.id, { lat: pos.coords.latitude, lng: pos.coords.longitude }, `Position enregistrée (± ${Math.round(pos.coords.accuracy)} m)`),
      () => toast("Position refusée : autorise la localisation pour ce site"),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    return;
  }
  const mv = e.target.closest("[data-pmove]");
  if (mv) {
    const i = POINTS.indexOf(p), j = i + Number(mv.dataset.pmove);
    if (j < 0 || j >= POINTS.length) return;
    [POINTS[i], POINTS[j]] = [POINTS[j], POINTS[i]];
    await Promise.all(POINTS.map((x, k) => SB.from("delivery_points").update({ sort: k }).eq("id", x.id)));
    return loadPoints();
  }
  if (e.target.closest("[data-supprimer]")) {
    if (!confirm(`Supprimer le point « ${p.name} » ? Son QR code ne marchera plus. (Pour le masquer un temps, décoche plutôt « Proposé aux clients ».)`)) return;
    const { error } = await SB.from("delivery_points").delete().eq("id", p.id);
    if (error) return fail(error);
    toast("Point supprimé"); loadPoints();
  }
});
$("[data-add-point]").addEventListener("click", async () => {
  const name = prompt("Nom du point (ex : Panneau ADY, Le grand cocotier) ?"); if (!name || !name.trim()) return;
  let slug = slugify(name), n = 2;
  while (POINTS.some((x) => x.slug === slug)) slug = `${slugify(name).slice(0, 36)}-${n++}`;
  const c = cartePts ? cartePts.getCenter() : null;
  const ref = c ? { lat: c.lat, lng: c.lng } : POINTS[0] || { lat: 16.2181, lng: -61.3965 };
  const { error } = await SB.from("delivery_points").insert({ slug, name: name.trim(), hint: "", lat: ref.lat, lng: ref.lng, sort: POINTS.length, active: false });
  if (error) return fail(error);
  toast("Point ajouté au centre de la carte : glisse-le à sa place, puis ajoute sa photo"); loadPoints();
});

/* ===== Code secret du gérant : « Clients » et « Chiffres » ===== */
// Le code est vérifié par la base (jamais stocké dans la page). Les deux onglets se referment
// dès qu'on va ailleurs, ou après 3 minutes sans toucher l'écran.
const PROTEGES = ["clients", "chiffres"];
const CADENAS_GRAND = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><circle cx="12" cy="15.2" r="1.3"/></svg>';
let ouvert = false, minuteurVerrou = null;
const vueActive = () => ($("[data-view][aria-selected=true]") || { dataset: {} }).dataset.view;
function relancerMinuteur() {
  clearTimeout(minuteurVerrou);
  if (!ouvert) return;
  minuteurVerrou = setTimeout(() => {
    verrouiller();
    if (PROTEGES.includes(vueActive())) montrerProtege(vueActive());
    toast("Masqué automatiquement");
  }, 3 * 60 * 1000);
}
function verrouiller() {
  ouvert = false; clearTimeout(minuteurVerrou);
  PROTEGES.forEach((v) => ($(`[data-zone-${v}]`).innerHTML = ""));
  $("[data-cli-detail]")?.remove();
}
async function montrerProtege(vue) {
  const zone = $(`[data-zone-${vue}]`);
  if (ouvert) { relancerMinuteur(); return vue === "clients" ? loadClients() : loadChiffres(); }
  const { data: existe } = await SB.rpc("code_existe");
  zone.innerHTML = `<form class="verrou" data-verrou-form>
      <span class="verrou__icone">${CADENAS_GRAND}</span>
      <h2>${existe ? "Réservé au gérant" : "Choisis ton code secret"}</h2>
      <p>${existe ? "Entre ton code pour voir tes clients et tes chiffres." : "4 à 6 chiffres. Il protège tes clients et tes chiffres : ne le donne pas à ton équipe."}</p>
      <input class="verrou__code" type="password" name="code" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="Code secret" required>
      ${existe ? "" : '<input class="verrou__code" type="password" name="confirme" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="Retape le code" placeholder="Retape-le" required>'}
      <button class="btn" type="submit">${existe ? "Ouvrir" : "Enregistrer mon code"}</button>
      <p class="verrou__err" data-verrou-err role="alert"></p>
      ${DEMO ? '<p class="login__demo">Code de la démo : <b>1234</b></p>' : ""}
    </form>`;
  const f = $("[data-verrou-form]", zone);
  f.code.focus({ preventScroll: true });
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("[data-verrou-err]", f); err.textContent = "";
    const code = f.code.value.trim();
    if (!existe) {
      if (code !== f.confirme.value.trim()) { err.textContent = "Les deux codes ne sont pas pareils."; return; }
      const { error } = await SB.rpc("definir_code", { p_ancien: null, p_nouveau: code });
      if (error) { err.textContent = error.message; return; }
    } else {
      const { data: ok, error } = await SB.rpc("verifier_code", { p_code: code });
      if (error) { err.textContent = error.message; return; }
      if (!ok) { err.textContent = "Ce n’est pas le bon code."; f.code.value = ""; f.code.focus(); return; }
    }
    ouvert = true; relancerMinuteur();
    montrerProtege(vue);
  });
}
$$("[data-verrouiller]").forEach((b) => b.addEventListener("click", () => { verrouiller(); montrerProtege(vueActive()); }));
PROTEGES.forEach((v) => $(`[data-view-panel="${v}"]`).addEventListener("pointerdown", relancerMinuteur));
// changer son code (Réglages) : l'ancien code est demandé seulement s'il en existe un
async function majFormCode() {
  const { data: existe } = await SB.rpc("code_existe");
  $("[data-code-ancien]").hidden = !existe;
}
$("[data-code-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const { error } = await SB.rpc("definir_code", { p_ancien: f.ancien.value.trim() || null, p_nouveau: f.nouveau.value.trim() });
  if (error) return toast(error.message);
  f.reset(); verrouiller(); majFormCode();
  toast("Code enregistré");
});

/* ===== Walty (carte fidélité) : lecture seule ===== */
// Walty reste la référence : on lit ses données (via /api/walty, la clé reste côté serveur),
// on ne les modifie pas et on ne les copie pas dans la base du site.
const WALTY_ESPACE = "https://walty.fr/espace";
const telCle = (t) => String(t || "").replace(/\D/g, "").slice(-9);
let WALTY = null;
async function lireWalty() {
  if (DEMO) return waltyDemo();
  try {
    const { data: { session } } = await SB.auth.getSession();
    const r = await fetch("/api/walty", { headers: { Authorization: "Bearer " + (session && session.access_token) } });
    if (!r.ok) return { connecte: false };
    return { connecte: true, ...(await r.json()) };
  } catch (e) { return { connecte: false }; }
}
// Exemple pour la démo : ce que l'on verrait avec la formule « Tout compris »
function waltyDemo() {
  return { connecte: true, exemple: true, objectif: 10,
    stats: { cartes: 128, passages_mois: 342, cadeaux_mois: 21 },
    clients: [
      { prenom: "Léa", nom: "Martin", telephone: "0690 11 22 33", tampons: 7, cadeaux: 1, derniere_visite: new Date(Date.now() - 2 * 864e5).toISOString() },
      { prenom: "Sarah", nom: "Louis", telephone: "0690 00 00 00", tampons: 10, cadeaux: 2, derniere_visite: new Date(Date.now() - 864e5).toISOString() },
      { prenom: "Marc", nom: "Dupont", telephone: "", tampons: 3, cadeaux: 0, derniere_visite: new Date(Date.now() - 6 * 864e5).toISOString() },
      { prenom: "Nadia", nom: "Célestin", telephone: "0691 45 67 89", tampons: 9, cadeaux: 3, derniere_visite: new Date(Date.now() - 3 * 864e5).toISOString() },
      { prenom: "Yann", nom: "Bordelais", telephone: "0690 98 76 54", tampons: 1, cadeaux: 0, derniere_visite: new Date(Date.now() - 12 * 864e5).toISOString() },
    ] };
}
function blocWalty(w, avecStats) {
  return `<div class="walty">
    <div class="walty__tete"><b>Carte fidélité Walty</b><span class="pill${w.connecte ? " pill--ok" : ""}">${w.connecte ? (w.exemple ? "Exemple (démo)" : "Reliée") : "Pas encore reliée"}</span>
      <a class="btn btn--small btn--ghost" href="${WALTY_ESPACE}" target="_blank" rel="noopener">Modifier ma carte sur Walty</a></div>
    ${avecStats && w.stats ? `<div class="walty__stats"><div><b>${w.stats.cartes ?? "–"}</b><span>cartes créées</span></div><div><b>${w.stats.passages_mois ?? "–"}</b><span>passages ce mois</span></div><div><b>${w.stats.cadeaux_mois ?? "–"}</b><span>cadeaux offerts ce mois</span></div></div>` : ""}
    ${w.connecte ? "" : `<p class="muted">Une fois reliée (formule « Tout compris »), les tampons de chaque client s’affichent ici. La carte elle-même se règle toujours sur Walty.</p>`}
  </div>`;
}

/* ===== Clients ===== */
let CLIENTS = [];
let FILTRE = "tous";
const jour = (iso) => (iso ? new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" }).format(new Date(iso)) : "–");
const ilYa = (iso) => { if (!iso) return "–"; const j = Math.floor((Date.now() - new Date(iso)) / 864e5); return j <= 0 ? "aujourd’hui" : j === 1 ? "hier" : `il y a ${j} jours`; };
const initiales = (nom) => String(nom).trim().split(/\s+/).slice(0, 2).map((m) => m[0] || "").join("").toUpperCase();
const TEINTES_AV = ["#f4b89f", "#c9d8a6", "#bfdce5", "#f7d58a", "#efd2b2", "#e9c3d6"];
const teinte = (nom) => TEINTES_AV[[...String(nom)].reduce((s, c) => s + c.charCodeAt(0), 0) % TEINTES_AV.length];
function international(tel) {
  const d = String(tel || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  if (d.startsWith("00")) return d.slice(2);
  if (/^0(590|690|691)/.test(d)) return "590" + d.slice(1);
  if (/^0(596|696|697)/.test(d)) return "596" + d.slice(1);
  if (/^0(594|694)/.test(d)) return "594" + d.slice(1);
  if (/^0(262|692|693|639)/.test(d)) return "262" + d.slice(1);
  if (/^0\d{9}$/.test(d)) return "33" + d.slice(1);
  return d;
}
const objectifFid = () => (WALTY && WALTY.objectif) || (SETTINGS && SETTINGS.stamps_goal) || 10;
const FILTRES = [
  ["tous", "Tous", () => true],
  ["fideles", "Fidèles", (c) => c.commandes >= 2 || (c.fid && c.fid.tampons >= 5)],
  ["cadeau", "Cadeau prêt", (c) => c.fid && c.fid.tampons >= objectifFid()],
  ["relancer", "À relancer", (c) => { const d = [c.derniere, c.fid && c.fid.visite].filter(Boolean).sort().pop(); return d && Date.now() - new Date(d) > 21 * 864e5; }],
  ["nouveaux", "Nouveaux", (c) => c.commandes === 1 && Date.now() - new Date(c.derniere) < 14 * 864e5],
];
async function loadClients() {
  const zone = $("[data-zone-clients]");
  if (!zone.querySelector("[data-clients]")) {
    zone.innerHTML = `<div data-walty></div>
      <div class="cli-barre"><div class="cli-filtres" data-cli-filtres role="tablist" aria-label="Filtrer"></div>
        <label class="recherche"><span class="sr-only">Rechercher</span><input type="search" placeholder="Rechercher un nom ou un téléphone" data-clients-recherche></label></div>
      <div class="clients" data-clients></div>
      <p class="muted clients__note">Commandes des 90 derniers jours. Les numéros de téléphone des commandes sont effacés au bout de 30 jours (page Confidentialité).</p>`;
    $("[data-clients-recherche]", zone).addEventListener("input", renderClients);
    $("[data-cli-filtres]", zone).addEventListener("click", (e) => { const b = e.target.closest("[data-filtre]"); if (b) { FILTRE = b.dataset.filtre; renderClients(); } });
    $("[data-clients]", zone).addEventListener("click", (e) => { const c = e.target.closest("[data-cli]"); if (c && !e.target.closest("a")) ouvrirClient(Number(c.dataset.cli)); });
  }
  const depuis = new Date(Date.now() - 90 * 864e5).toISOString();
  const [{ data, error }, walty] = await Promise.all([
    SB.from("orders").select("customer_name, phone, total, mode, status, created_at, order_items(name, qty)").gte("created_at", depuis).order("created_at", { ascending: false }),
    lireWalty(),
  ]);
  if (error) return fail(error);
  WALTY = walty;
  // un client = un numéro de téléphone, ou à défaut un nom
  const parCle = new Map();
  data.filter((o) => o.status !== "cancelled").forEach((o) => {
    const cle = telCle(o.phone) || "nom:" + String(o.customer_name).trim().toLowerCase();
    const c = parCle.get(cle) || { nom: o.customer_name, tel: o.phone || "", commandes: 0, total: 0, plage: 0, derniere: o.created_at, premiere: o.created_at, historique: [] };
    c.commandes++; c.total += Number(o.total); if (o.mode === "plage") c.plage++;
    if (!c.tel && o.phone) c.tel = o.phone;
    c.premiere = o.created_at;
    c.historique.push(o);
    parCle.set(cle, c);
  });
  const liste = [...parCle.values()];
  // chaque carte Walty rejoint le client du site qui a le même téléphone (sinon le même nom)
  (walty.clients || []).forEach((w) => {
    const nom = `${w.prenom || ""} ${w.nom || ""}`.trim();
    const c = liste.find((x) => (telCle(w.telephone) && telCle(x.tel) === telCle(w.telephone)) || x.nom.trim().toLowerCase() === nom.toLowerCase());
    const fid = { tampons: w.tampons, cadeaux: w.cadeaux, visite: w.derniere_visite };
    if (c) { c.fid = fid; if (!c.tel && w.telephone) c.tel = w.telephone; }
    else liste.push({ nom, tel: w.telephone || "", commandes: 0, total: 0, plage: 0, derniere: null, premiere: null, historique: [], fid });
  });
  CLIENTS = liste.sort((a, b) => b.commandes - a.commandes || (b.fid?.tampons || 0) - (a.fid?.tampons || 0));
  $("[data-walty]", zone).innerHTML = blocWalty(walty, false);
  renderClients();
}
function barreFid(f) {
  const obj = objectifFid();
  const pct = Math.min(100, Math.round((f.tampons / obj) * 100));
  return `<span class="fid"><span class="fid__barre"><i style="width:${pct}%"></i></span><small>${f.tampons >= obj ? "<b>Cadeau prêt</b>" : `${f.tampons}/${obj} tampons`}</small></span>`;
}
function renderClients() {
  const q = $("[data-clients-recherche]").value.trim().toLowerCase();
  const qTel = q.replace(/\D/g, "");
  $("[data-cli-filtres]").innerHTML = FILTRES.map(([k, l, fn]) => `<button type="button" role="tab" data-filtre="${k}" aria-selected="${k === FILTRE}">${l} <span>${CLIENTS.filter(fn).length}</span></button>`).join("");
  const test = (FILTRES.find(([k]) => k === FILTRE) || FILTRES[0])[2];
  const liste = CLIENTS.map((c, i) => [c, i]).filter(([c]) => test(c) && (!q || c.nom.toLowerCase().includes(q) || (qTel.length > 2 && c.tel.replace(/\D/g, "").includes(qTel))));
  $("[data-clients]").innerHTML = liste.length ? liste.map(([c, i]) => `<article class="cli" data-cli="${i}" tabindex="0" role="button" aria-label="Voir la fiche de ${esc(c.nom)}">
      <span class="cli__av" style="background:${teinte(c.nom)}">${esc(initiales(c.nom))}</span>
      <span class="cli__qui"><b>${esc(c.nom)}</b>${c.tel ? `<small>${esc(c.tel)}</small>` : ""}</span>
      <span class="cli__tags">${c.commandes >= 2 ? '<em class="t-fid">Fidèle</em>' : ""}${c.fid && c.fid.tampons >= objectifFid() ? '<em class="t-cad">Cadeau prêt</em>' : ""}${c.commandes === 1 && Date.now() - new Date(c.derniere) < 14 * 864e5 ? '<em class="t-new">Nouveau</em>' : ""}${!c.commandes ? '<em>Au comptoir</em>' : ""}</span>
      <span class="cli__chiffres">${c.commandes ? `<b>${c.commandes}</b> commande${c.commandes > 1 ? "s" : ""} · <b>${euro(c.total)}</b><small>dernière : ${ilYa(c.derniere)}</small>` : `<small>Pas encore commandé en ligne</small>`}</span>
      <span class="cli__fid">${c.fid ? barreFid(c.fid) : `<small class="muted">${WALTY && WALTY.connecte ? "Pas de carte fidélité" : ""}</small>`}</span>
    </article>`).join("") : `<p class="empty">${q ? "Aucun client ne correspond." : "Personne dans cette liste pour l’instant."}</p>`;
}
function ouvrirClient(i) {
  const c = CLIENTS[i]; if (!c) return;
  $("[data-cli-detail]")?.remove();
  const tel = c.tel.replace(/\s/g, "");
  const el = document.createElement("div");
  el.className = "cli-detail"; el.dataset.cliDetail = ""; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", c.nom);
  el.innerHTML = `<div class="cli-detail__fond" data-fermer-cli></div>
    <div class="cli-detail__box">
      <header><span class="cli__av cli__av--grand" style="background:${teinte(c.nom)}">${esc(initiales(c.nom))}</span>
        <div><h2>${esc(c.nom)}</h2>${c.tel ? `<p>${esc(c.tel)}</p>` : ""}</div>
        <button class="iconbtn" type="button" data-fermer-cli>Fermer</button></header>
      ${tel ? `<div class="cli-detail__actions"><a class="btn btn--small" href="tel:${esc(tel)}">Appeler</a><a class="btn btn--small btn--wa" href="https://wa.me/${international(tel)}" target="_blank" rel="noopener">WhatsApp</a></div>` : ""}
      <div class="cli-detail__chiffres">
        <div><b>${c.commandes}</b><span>commande${c.commandes > 1 ? "s" : ""}</span></div>
        <div><b>${euro(c.total)}</b><span>dépensé en ligne</span></div>
        <div><b>${c.commandes ? euro(c.total / c.commandes) : "–"}</b><span>panier moyen</span></div>
        <div><b>${c.commandes ? `${c.plage}/${c.commandes}` : "–"}</b><span>livré sur la plage</span></div>
      </div>
      <section><h3>Carte fidélité</h3>${c.fid ? `${barreFid(c.fid)}<p class="muted">${c.fid.cadeaux ? `${c.fid.cadeaux} cadeau${c.fid.cadeaux > 1 ? "x" : ""} déjà offert${c.fid.cadeaux > 1 ? "s" : ""} · ` : ""}dernier passage : ${ilYa(c.fid.visite)}</p>` : `<p class="muted">${WALTY && WALTY.connecte ? "Pas de carte fidélité." : "Walty pas encore relié."}</p>`}</section>
      <section><h3>Ses commandes en ligne</h3>${c.historique.length ? `<ul class="historique">${c.historique.map((o) => `<li><span class="historique__date">${jour(o.created_at)}</span><span>${(o.order_items || []).map((x) => `${x.qty} × ${esc(x.name)}`).join(", ") || "–"}</span><span class="pill pill--${o.mode}">${o.mode === "plage" ? "Plage" : "Shop"}</span><b>${euro(o.total)}</b></li>`).join("")}</ul>` : '<p class="muted">Aucune sur les 90 derniers jours.</p>'}</section>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener("click", (e) => { if (e.target.closest("[data-fermer-cli]")) el.remove(); });
  $(".cli-detail__box [data-fermer-cli]", el).focus({ preventScroll: true });
}
addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("[data-cli-detail]")?.remove();
  if (e.key === "Enter" && e.target.matches && e.target.matches("[data-cli]")) ouvrirClient(Number(e.target.dataset.cli));
});

/* ===== Chiffres ===== */
let PERIODE = "jour";
const PERIODES = [["jour", "Aujourd’hui"], ["semaine", "7 jours"], ["mois", "Ce mois-ci"], ["mois-1", "Mois dernier"]];
const debut = (ymd) => new Date(ymd + "T00:00:00-04:00");   // Guadeloupe = UTC−4 toute l'année
function bornes(per) {
  const auj = todayStr(), [y, m] = auj.split("-").map(Number);
  const demain = new Date(debut(auj).getTime() + 864e5);
  if (per === "semaine") return [new Date(debut(auj).getTime() - 6 * 864e5), demain];
  if (per === "mois") return [debut(`${y}-${String(m).padStart(2, "0")}-01`), demain];
  if (per === "mois-1") { const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1; return [debut(`${py}-${String(pm).padStart(2, "0")}-01`), debut(`${y}-${String(m).padStart(2, "0")}-01`)]; }
  return [debut(auj), demain];
}
async function loadChiffres() {
  const zone = $("[data-zone-chiffres]");
  const [de, a] = bornes(PERIODE);
  const [{ data, error }, walty] = await Promise.all([
    SB.from("orders").select("total, mode, status, created_at, order_items(name, qty, product_id)").gte("created_at", de.toISOString()).lt("created_at", a.toISOString()).order("created_at", { ascending: true }),
    lireWalty(),
  ]);
  if (error) return fail(error);
  WALTY = walty;
  const valides = data.filter((o) => o.status !== "cancelled");
  const faites = valides.filter((o) => o.status === "done");
  const ca = faites.reduce((s, o) => s + Number(o.total), 0);
  const enCours = valides.filter((o) => o.status !== "done").reduce((s, o) => s + Number(o.total), 0);
  const plage = valides.filter((o) => o.mode === "plage").length;
  // barres : par heure aujourd'hui, par jour sinon
  const parHeure = PERIODE === "jour";
  const cles = [];
  if (parHeure) for (let h = 7; h <= 19; h++) cles.push(String(h));
  else for (let t = de.getTime(); t < a.getTime(); t += 864e5) cles.push(new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(t + 12 * 36e5)));
  const sommes = Object.fromEntries(cles.map((k) => [k, 0]));
  faites.forEach((o) => {
    const d = new Date(o.created_at);
    const k = parHeure ? String((d.getUTCHours() + 20) % 24) : new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);   // heure de Guadeloupe (UTC−4)
    if (k in sommes) sommes[k] += Number(o.total);
  });
  const max = Math.max(1, ...Object.values(sommes));
  const etiquette = (k) => (parHeure ? `${k}h` : new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(new Date(k + "T12:00:00")));
  // les produits les plus vendus
  const ventes = new Map();
  valides.forEach((o) => (o.order_items || []).forEach((i) => ventes.set(i.name, (ventes.get(i.name) || 0) + i.qty)));
  const top = [...ventes].sort((x, y) => y[1] - x[1]).slice(0, 5);
  const dessinNom = (nom) => { const p = PRODS.find((x) => x.name === nom); return p ? dessin(p) : ILL ? ILL.illustration({ nom }) : ""; };
  zone.innerHTML = `<div class="periodes" role="tablist" aria-label="Période">${PERIODES.map(([k, l]) => `<button type="button" role="tab" data-periode="${k}" aria-selected="${k === PERIODE}">${l}</button>`).join("")}</div>
    <div class="chiffres">
      <div class="chiffre chiffre--grand"><span>Chiffre d’affaires</span><b>${euro(ca)}</b><small>commandes livrées ou récupérées${enCours ? ` · ${euro(enCours)} encore en cours` : ""}</small></div>
      <div class="chiffre"><span>Commandes</span><b>${valides.length}</b><small>${data.length - valides.length ? `${data.length - valides.length} refusée${data.length - valides.length > 1 ? "s" : ""}` : "aucune refusée"}</small></div>
      <div class="chiffre"><span>Panier moyen</span><b>${faites.length ? euro(ca / faites.length) : "–"}</b></div>
      <div class="chiffre"><span>Livrées sur la plage</span><b>${valides.length ? Math.round((plage / valides.length) * 100) : 0} %</b><small>${plage} sur ${valides.length}</small></div>
    </div>
    <section class="graph"><h2>${parHeure ? "Ventes d’aujourd’hui, heure par heure" : "Ventes, jour par jour"}</h2>
      <div class="barres" role="img" aria-label="Chiffre d’affaires ${parHeure ? "par heure" : "par jour"}">${cles.map((k) => `<div class="barre" title="${etiquette(k)} : ${euro(sommes[k])}"><em>${sommes[k] ? Math.round(sommes[k]) + " €" : ""}</em><i style="height:${Math.max(2, Math.round((sommes[k] / max) * 130))}px"></i><span>${etiquette(k)}</span></div>`).join("")}</div>
    </section>
    <section class="palmares"><h2>Les plus vendus</h2>${top.length ? `<ol>${top.map(([n, q]) => `<li><span class="palmares__art">${dessinNom(n)}</span><b>${esc(n)}</b><span>${q} vendu${q > 1 ? "s" : ""}</span></li>`).join("")}</ol>` : '<p class="muted">Pas encore de vente sur cette période.</p>'}</section>
    ${blocWalty(walty, true)}`;
  $$("[data-periode]", zone).forEach((b) => b.addEventListener("click", () => { PERIODE = b.dataset.periode; loadChiffres(); }));
}

/* ===== Démarrage ===== */
function start() {
  paintSound();
  // hauteur de l'en-tête : les onglets d'étapes se collent juste dessous (téléphone)
  const haut = () => document.documentElement.style.setProperty("--haut-top", $(".top").offsetHeight + "px");
  haut(); addEventListener("resize", haut);
  dayInput.value = todayStr();
  loadSettings(); majFormCode(); loadPoints().then(loadOrders); loadMenu(); startRealtime();
  if ("Notification" in window && Notification.permission === "default") {
    document.addEventListener("click", () => Notification.requestPermission(), { once: true });
  }
}
boot();
