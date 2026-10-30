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
}));

/* ===== Son des nouvelles commandes ===== */
let soundOn = localStorage.getItem("ady-admin-sound") === "1";
let actx = null;
function paintSound() { const b = $("[data-sound]"); b.textContent = soundOn ? "Son activé" : "Son coupé"; b.setAttribute("aria-pressed", soundOn); }
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
async function loadSettings() {
  const { data, error } = await SB.from("settings").select("*").eq("id", 1).single();
  if (error) return fail(error);
  SETTINGS = data;
  $$("[data-quick]").forEach((i) => (i.checked = !!data[i.dataset.quick]));
  const f = $("[data-settings]");
  f.orders_open.checked = data.orders_open; f.beach_open.checked = data.beach_open;
  f.beach_min.value = data.beach_min; f.food_from.value = String(data.food_from).slice(0, 5); f.food_to.value = String(data.food_to).slice(0, 5);
  f.stamps_goal.value = data.stamps_goal;
}
async function saveSettings(patch) {
  const { error } = await SB.from("settings").update(patch).eq("id", 1);
  if (error) return fail(error);
  toast("Réglages enregistrés"); loadSettings();
}
$$("[data-quick]").forEach((i) => i.addEventListener("change", () => saveSettings({ [i.dataset.quick]: i.checked })));
$("[data-settings]").addEventListener("submit", (e) => {
  e.preventDefault(); const f = e.currentTarget;
  saveSettings({ orders_open: f.orders_open.checked, beach_open: f.beach_open.checked, beach_min: Number(f.beach_min.value || 0), food_from: f.food_from.value, food_to: f.food_to.value, stamps_goal: Number(f.stamps_goal.value || 9) });
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
  const valid = ORDERS.filter((o) => o.status !== "cancelled");
  $('[data-kpi="count"]').textContent = valid.length;
  $('[data-kpi="revenue"]').textContent = euro(valid.filter((o) => o.status === "done").reduce((s, o) => s + Number(o.total), 0));
  $('[data-kpi="open"]').textContent = valid.filter((o) => !["done"].includes(o.status)).length;
  $('[data-kpi="beach"]').textContent = valid.filter((o) => o.mode === "plage").length;
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
function productRow(p) {
  return `<div class="prow${p.available ? "" : " is-off"}" data-pid="${p.id}">
    <input class="prow__name" data-f="name" value="${esc(p.name)}" aria-label="Nom">
    <input class="prow__price" data-f="price" type="number" min="0" step="0.1" value="${Number(p.price)}" aria-label="Prix en euros">
    <input class="prow__desc" data-f="description" value="${esc(p.description)}" placeholder="Description (facultatif)" aria-label="Description">
    <input class="prow__desc" data-f="allergens" value="${esc(p.allergens || "")}" placeholder="Allergènes (ex : lait, gluten, fruits à coque) — obligatoire" aria-label="Allergènes">
    <div class="prow__opts">
      ${GROUPS.filter((g) => g.id !== "temperature").map((g) => `<label><input type="checkbox" data-link="${esc(g.id)}" ${LINKS.some((l) => l.product_id === p.id && l.group_id === g.id) ? "checked" : ""}> ${esc(g.name)}</label>`).join("")}
      <label><input type="checkbox" data-link="temperature" ${LINKS.some((l) => l.product_id === p.id && l.group_id === "temperature") ? "checked" : ""}> Chaud ou glacé</label>
      <label><input type="checkbox" data-f="featured" ${p.featured ? "checked" : ""}> Mis en avant (suggestions « Avec ça ? »)</label>
      <input class="prow__badge" data-f="badge" value="${esc(p.badge || "")}" placeholder="Étiquette (ex : Best-seller)" aria-label="Étiquette sur la carte produit">
      <label><input type="checkbox" data-f="signature" ${p.signature ? "checked" : ""}> Encadré signature</label>
      <label class="switch"><input type="checkbox" data-f="available" ${p.available ? "checked" : ""}><span></span>En vente</label>
      <button class="iconbtn" type="button" data-move="-1" title="Monter">↑</button>
      <button class="iconbtn" type="button" data-move="1" title="Descendre">↓</button>
      <button class="linkish" type="button" data-archive>Retirer de la carte</button>
    </div>
  </div>`;
}
function renderMenuEditor() {
  $("[data-menu-editor]").innerHTML = optionsEditor() + CATS.map((c) => {
    const ps = PRODS.filter((p) => p.category_id === c.id);
    return `<details class="cat" data-cat="${esc(c.id)}" open>
      <summary><span>${esc(c.title)}</span><small>${ps.length} produit${ps.length > 1 ? "s" : ""}</small></summary>
      <details class="cat__edit"><summary>Modifier la catégorie</summary><div class="cat__meta">
        <label>Titre<input data-cf="title" value="${esc(c.title)}"></label>
        <label>Titre de l'encadré signature<input data-cf="signature_label" value="${esc(c.signature_label || "")}"></label>
        <label>Horaires affichés<input data-cf="hours" value="${esc(c.hours || "")}" placeholder="ex : 11h – 15h"></label>
        <label>Note en bas<input data-cf="footnote" value="${esc(c.footnote || "")}"></label>
      </div></details>
      <div class="cat__list">${ps.map(productRow).join("") || `<p class="empty">Aucun produit.</p>`}</div>
      <button class="btn btn--small btn--ghost" type="button" data-add-product>Ajouter un produit</button>
    </details>`;
  }).join("");
}
const editor = $("[data-menu-editor]");
editor.addEventListener("change", async (e) => {
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
  const lk = e.target.closest("[data-link]");
  if (lk) {
    const pid = lk.closest("[data-pid]").dataset.pid, gid = lk.dataset.link;
    const r = lk.checked
      ? await SB.from("product_option_groups").insert({ product_id: pid, group_id: gid, sort: (GROUPS.find((g) => g.id === gid) || {}).sort || 0 })
      : await SB.from("product_option_groups").delete().eq("product_id", pid).eq("group_id", gid);
    if (r.error) return fail(r.error);
    if (lk.checked) LINKS.push({ product_id: pid, group_id: gid }); else LINKS = LINKS.filter((l) => !(l.product_id === pid && l.group_id === gid));
    toast("Enregistré"); return;
  }
  const row = e.target.closest("[data-pid]");
  if (row && e.target.dataset.f) {
    const f = e.target.dataset.f;
    let v = e.target.type === "checkbox" ? e.target.checked : e.target.value.trim();
    if (f === "price") { v = Number(String(v).replace(",", ".")); if (!(v >= 0)) return toast("Prix invalide"); }
    if (f === "name" && !v) return toast("Le nom ne peut pas être vide");
    if (f === "badge" || f === "allergens") v = v || null;
    const { error } = await SB.from("products").update({ [f]: v }).eq("id", row.dataset.pid);
    if (error) return fail(error);
    const p = PRODS.find((x) => x.id === row.dataset.pid); if (p) p[f] = v;
    if (f === "available") row.classList.toggle("is-off", !v);
    toast("Enregistré"); renderStock();
    return;
  }
  const cat = e.target.closest("[data-cat]");
  if (cat && e.target.dataset.cf) {
    const { error } = await SB.from("categories").update({ [e.target.dataset.cf]: e.target.value.trim() || null }).eq("id", cat.dataset.cat);
    if (error) return fail(error);
    toast("Enregistré");
  }
});
editor.addEventListener("click", async (e) => {
  const row = e.target.closest("[data-pid]");
  if (row && e.target.closest("[data-archive]")) {
    if (!confirm("Retirer ce produit de la carte ? (l'historique des commandes est conservé)")) return;
    const { error } = await SB.from("products").update({ archived: true }).eq("id", row.dataset.pid);
    if (error) return fail(error);
    toast("Produit retiré"); loadMenu(); return;
  }
  const mv = e.target.closest("[data-move]");
  if (row && mv) {
    const p = PRODS.find((x) => x.id === row.dataset.pid);
    const sib = PRODS.filter((x) => x.category_id === p.category_id && x.signature === p.signature);
    const i = sib.indexOf(p), j = i + Number(mv.dataset.move);
    if (j < 0 || j >= sib.length) return;
    [sib[i], sib[j]] = [sib[j], sib[i]];
    await Promise.all(sib.map((x, k) => SB.from("products").update({ sort: k }).eq("id", x.id)));
    loadMenu(); return;
  }
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
    const name = prompt("Nom du nouveau produit ?"); if (!name) return;
    const price = Number(String(prompt("Prix en euros ?", "5") || "").replace(",", "."));
    if (!(price >= 0)) return toast("Prix invalide");
    const { data, error } = await SB.from("products").insert({ category_id: cat, name: name.trim(), price, sort: 999 }).select().single();
    if (error) return fail(error);
    if (cat === "merch" || (CATS.find((c) => c.id === cat) || {}).kind === "merch") {
      await SB.from("product_variants").insert(["S", "M", "L", "XL"].map((label, sort) => ({ product_id: data.id, label, sort })));
    }
    toast("Produit ajouté"); loadMenu();
  }
});
$("[data-add-cat]").addEventListener("click", async () => {
  const title = prompt("Nom de la catégorie ?"); if (!title) return;
  const kind = confirm("Ce sont des boissons ? (OK = boissons, Annuler = plats salés)") ? "drink" : "food";
  const id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat-" + Date.now();
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
// Carte : chaque numéro se glisse à sa place, la position est enregistrée en le lâchant
let cartePts = null, cadree = false;
const reperes = [];
function majCartePoints() {
  const el = $("[data-points-map]");
  if (!window.L || !el || !el.offsetWidth) return;
  if (!cartePts) {
    cartePts = L.map(el, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(cartePts);
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

/* ===== Démarrage ===== */
function start() {
  paintSound();
  // hauteur de l'en-tête : les onglets d'étapes se collent juste dessous (téléphone)
  const haut = () => document.documentElement.style.setProperty("--haut-top", $(".top").offsetHeight + "px");
  haut(); addEventListener("resize", haut);
  dayInput.value = todayStr();
  loadSettings(); loadPoints().then(loadOrders); loadMenu(); startRealtime();
  if ("Notification" in window && Notification.permission === "default") {
    document.addEventListener("click", () => Notification.requestPermission(), { once: true });
  }
}
boot();
