/* =====================================================================
   ADY Coffee Shop : espace livreur (/livreur)
   Pensé pour un téléphone, en plein soleil : 3 boutons par livraison.
     Je pars avec → Je suis au point (+ message au client) → Livrée et encaissée
   ===================================================================== */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const euro = (n) => Number(n || 0).toFixed(2).replace(".", ",") + " €";
const SB = window.ADY_CLIENT;
const DEMO = !!(SB && SB.demo);
const TZ = "America/Guadeloupe";

const toastEl = $(".toast"); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("is-on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 2600); }
function fail(e) { console.error(e); toast(e && e.message ? e.message : "Erreur, réessaie."); }

/* ===== Connexion : gérant ou livreur ===== */
async function boot() {
  if (DEMO) {
    $("[data-demo-hint]").hidden = false; $("[data-demo-pill]").hidden = false;
    const f = $("[data-login-form]"); if (!f.email.value) f.email.value = window.ADY_DEMO.email;
  }
  const { data: { session } } = await SB.auth.getSession();
  if (!session) { $("[data-login]").hidden = false; return; }
  let { data: role, error } = await SB.rpc("mon_role");
  if (error) { const r = await SB.rpc("is_admin"); role = r.data ? "gerant" : null; }
  if (!role) { $("[data-login]").hidden = false; $("[data-login-err]").textContent = "Ce compte n'a pas accès aux livraisons."; await SB.auth.signOut(); return; }
  $("[data-lien-gerant]").hidden = role !== "gerant";
  $("[data-login]").hidden = true; $("[data-app]").hidden = false;
  start();
}
$("[data-login-form]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget; $("[data-login-err]").textContent = "";
  const { error } = await SB.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
  if (error) { $("[data-login-err]").textContent = "E-mail ou mot de passe incorrect."; return; }
  boot();
});
$("[data-logout]").addEventListener("click", async () => { await SB.auth.signOut(); location.reload(); });

/* ===== Son quand une commande part en préparation (le livreur va devoir partir) ===== */
let soundOn = localStorage.getItem("ady-livreur-son") === "1";
let actx = null;
function paintSound() { const b = $("[data-sound]"); b.textContent = soundOn ? "Son activé" : "Son coupé"; b.setAttribute("aria-pressed", soundOn); }
$("[data-sound]").addEventListener("click", () => {
  soundOn = !soundOn; localStorage.setItem("ady-livreur-son", soundOn ? "1" : "0");
  if (soundOn) { actx = actx || new AudioContext(); actx.resume(); ding(); }
  paintSound();
});
function ding() {
  if (!soundOn) return;
  try {
    actx = actx || new AudioContext();
    [0, 0.2].forEach((t, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = [988, 1319][i]; o.type = "sine";
      g.gain.setValueAtTime(0.0001, actx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, actx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + t + 0.35);
      o.connect(g).connect(actx.destination); o.start(actx.currentTime + t); o.stop(actx.currentTime + t + 0.37);
    });
  } catch (e) {}
  if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
}

/* ===== Données ===== */
let ORDERS = [], POINTS = [];
let connus = null;   // commandes déjà vues « à récupérer » (pour sonner sur les nouvelles)
function todayStr() { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); }
function dayRange(d) { const start = new Date(d + "T00:00:00-04:00"); return [start.toISOString(), new Date(start.getTime() + 864e5).toISOString()]; }
const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };

async function charger() {
  const [from, to] = dayRange(todayStr());
  const [o, p] = await Promise.all([
    SB.from("orders").select("*, order_items(*)").eq("mode", "plage").gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true }),
    SB.from("delivery_points").select("*").order("sort"),
  ]);
  if (o.error) return fail(o.error);
  if (p.error) return fail(p.error);
  ORDERS = o.data; POINTS = p.data;
  const aRecuperer = ORDERS.filter((x) => ["preparing", "ready"].includes(x.status)).map((x) => x.id);
  if (connus && aRecuperer.some((id) => !connus.has(id))) { ding(); toast("Nouvelle livraison à récupérer au shop"); }
  connus = new Set(aRecuperer);
  afficher();
}

/* ===== Message au client : WhatsApp ou SMS déjà écrit ===== */
// 0690… → 590690… (Guadeloupe), 06… → 336… (métropole), +… gardé tel quel
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
const prenom = (nom) => String(nom || "").trim().split(/\s+/)[0] || "";
const lieu = (o, pt) => String(o.spot || "").split(" · ")[0] || (pt ? pt.name : "le point");
function message(o, pt) {
  return `Bonjour ${prenom(o.customer_name)} ! C'est ton livreur ADY Coffee Shop ☕ Je suis au point « ${lieu(o, pt)} » avec ta commande n° ${o.number}. Je t'attends !`;
}

/* ===== Affichage ===== */
const paiement = (o) => (String(o.note || "").match(/Paiement : (.+)$/) || [])[1] || "";
const noteClient = (o) => String(o.note || "").replace(/\s*·?\s*Paiement : .+$/, "").trim();
const articles = (o) => (o.order_items || []).map((i) => `<li><b>${i.qty} ×</b> ${esc(i.name)}${i.size ? ` <span class="tag">${esc(i.size)}</span>` : ""}${i.iced ? ` <span class="tag tag--ice">glacé</span>` : ""}${(i.options || []).filter((x) => !/^glac/i.test(x)).map((x) => ` <span class="tag tag--opt">${esc(x)}</span>`).join("")}</li>`).join("");
const nbArticles = (o) => (o.order_items || []).reduce((s, i) => s + i.qty, 0);

function carteLivraison(o) {
  const pt = POINTS.find((x) => x.id === o.point_id);
  const signe = String(o.spot || "").split(" · ").slice(1).join(" · ");
  const tel = String(o.phone || "").replace(/\s/g, "");
  const au = o.status === "arrived";
  const gps = o.lat ? `https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}&travelmode=walking` : null;
  const note = noteClient(o);
  return `<article class="liv-card${au ? " is-au-point" : ""}" data-id="${o.id}">
    ${pt && pt.photo_url ? `<button class="liv-card__photo" type="button" data-zoom="${esc(pt.photo_url)}" aria-label="Agrandir la photo du point"><img src="${esc(pt.photo_url)}" alt=""></button>` : ""}
    <div class="liv-card__body">
      <p class="liv-card__meta"><span class="liv-card__num">n° ${o.number}</span> · ${ago(o.created_at)}${au ? ` · <b class="liv-card__etat">Au point</b>` : ""}</p>
      <h3>${esc(lieu(o, pt))}</h3>
      ${pt && pt.hint ? `<p class="liv-card__hint">${esc(pt.hint)}</p>` : ""}
      ${signe ? `<p class="liv-card__signe">Signe : <b>${esc(signe)}</b></p>` : ""}
      <p class="liv-card__client"><b>${esc(o.customer_name)}</b>${tel ? ` · <a href="tel:${esc(tel)}">${esc(o.phone)}</a>` : ""}</p>
      <ul class="liv-card__items">${articles(o)}</ul>
      ${note ? `<p class="order__note">${esc(note)}</p>` : ""}
      <p class="liv-card__pay">À encaisser : <b>${euro(o.total)}</b>${paiement(o) ? ` · ${esc(paiement(o))}` : ""}</p>
      <p class="liv-card__fid">Carte fidélité&nbsp;? Scanne son QR code au moment de payer.</p>
      ${au ? `<p class="liv-card__aide">Son téléphone affiche déjà «&nbsp;Ton livreur est là&nbsp;». Préviens aussi ${esc(prenom(o.customer_name)) || "ton client"}&nbsp;: WhatsApp ou SMS s’ouvre sur ton portable avec le message déjà écrit, tu n’as plus qu’à appuyer sur Envoyer.</p>
      <div class="liv-card__msg">
        ${tel ? `<a class="btn btn--wa" href="https://wa.me/${international(tel)}?text=${encodeURIComponent(message(o, pt))}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn--ghost" href="sms:+${international(tel)}?&body=${encodeURIComponent(message(o, pt))}">SMS</a>
        <a class="btn btn--ghost" href="tel:${esc(tel)}">Appeler</a>` : ""}
      </div>
      <button class="btn btn--go btn--big" type="button" data-avance="done">Livrée et encaissée</button>`
      : `<div class="liv-card__msg">${gps ? `<a class="btn btn--ghost" href="${gps}" target="_blank" rel="noopener">Itinéraire</a>` : ""}</div>
      <button class="btn btn--go btn--big" type="button" data-avance="arrived">Je suis au point</button>`}
    </div>
  </article>`;
}
function carteShop(o) {
  const pt = POINTS.find((x) => x.id === o.point_id);
  const prete = o.status === "ready";
  return `<article class="liv-card liv-card--shop" data-id="${o.id}">
    <div class="liv-card__body">
      <p class="liv-card__meta"><span class="liv-card__num">n° ${o.number}</span> · ${ago(o.created_at)} · <span class="pill${prete ? " pill--ok" : ""}">${prete ? "Prête" : "En préparation"}</span></p>
      <h3>${esc(lieu(o, pt))}</h3>
      <p class="liv-card__client"><b>${esc(o.customer_name)}</b> · ${nbArticles(o)} article${nbArticles(o) > 1 ? "s" : ""} · ${euro(o.total)}</p>
      <ul class="liv-card__items">${articles(o)}</ul>
      <button class="btn btn--big" type="button" data-avance="delivering">Je pars avec</button>
    </div>
  </article>`;
}
function afficher() {
  const route = ORDERS.filter((o) => ["delivering", "arrived"].includes(o.status));
  const shop = ORDERS.filter((o) => ["preparing", "ready"].includes(o.status));
  const faites = ORDERS.filter((o) => o.status === "done").reverse();
  const attente = ORDERS.filter((o) => o.status === "new").length;
  $('[data-list="route"]').innerHTML = route.length ? route.map(carteLivraison).join("") : `<p class="empty">Rien à livrer pour l’instant.</p>`;
  $('[data-list="shop"]').innerHTML = (shop.length ? shop.map(carteShop).join("") : `<p class="empty">Aucune commande en préparation.</p>`)
    + (attente ? `<p class="liv__attente">${attente} commande${attente > 1 ? "s" : ""} plage en attente de validation par le shop.</p>` : "");
  $('[data-list="faites"]').innerHTML = faites.map((o) => `<p class="liv-fait"><b>n° ${o.number}</b> · ${esc(lieu(o, POINTS.find((x) => x.id === o.point_id)))} · ${euro(o.total)}${paiement(o) ? ` · ${esc(paiement(o))}` : ""}</p>`).join("") || `<p class="empty">Aucune pour l’instant.</p>`;
  $('[data-n="route"]').textContent = route.length;
  $('[data-n="shop"]').textContent = shop.length;
  $("[data-resume]").textContent = `Livrées aujourd’hui : ${faites.length} · ${euro(faites.reduce((s, o) => s + Number(o.total), 0))}`;
  document.title = (route.length + shop.length ? `(${route.length + shop.length}) ` : "") + "Livraisons · ADY";
}

/* ===== Actions ===== */
const SUITE = { delivering: "C’est parti : direction le point", arrived: "C’est affiché sur son téléphone. Envoie-lui aussi un message.", done: "Livrée, merci !" };
$("[data-app]").addEventListener("click", async (e) => {
  const z = e.target.closest("[data-zoom]");
  if (z) { const lb = $("[data-lightbox]"); $("img", lb).src = z.dataset.zoom; lb.hidden = false; return; }
  const b = e.target.closest("[data-avance]"); if (!b) return;
  const id = b.closest("[data-id]").dataset.id;
  b.disabled = true;
  const { error } = await SB.rpc("livreur_avance", { p_id: id, p_status: b.dataset.avance });
  if (error) { fail(error); charger(); return; }
  toast(SUITE[b.dataset.avance]);
  charger();
});
$("[data-lightbox]").addEventListener("click", (e) => { if (e.target.closest("[data-lightbox-close]") || e.target === e.currentTarget) e.currentTarget.hidden = true; });
addEventListener("keydown", (e) => { if (e.key === "Escape") $("[data-lightbox]").hidden = true; });

/* ===== Direct ===== */
function start() {
  paintSound();
  charger();
  let t;
  const refresh = () => { clearTimeout(t); t = setTimeout(charger, 400); };
  SB.channel("ady-livreur")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
    .subscribe((status) => {
      const el = $("[data-live]");
      if (status === "SUBSCRIBED") { el.textContent = "En direct : les livraisons arrivent toutes seules."; el.classList.add("is-on"); }
      else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) { el.textContent = "Direct coupé, actualisation toutes les 20 s."; el.classList.remove("is-on"); }
    });
  setInterval(charger, 20000);
  setInterval(afficher, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { charger(); garderAllume(); } });
  garderAllume();
}
// l'écran reste allumé pendant les livraisons (si le téléphone le permet)
async function garderAllume() {
  try { if ("wakeLock" in navigator && !document.hidden) await navigator.wakeLock.request("screen"); } catch (e) {}
}
boot();
