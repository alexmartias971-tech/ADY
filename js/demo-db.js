/* =====================================================================
   ADY : mode démo
   Une petite base locale (dans le navigateur) qui imite Supabase.
   Utilisée automatiquement tant que config.js n'est pas rempli.
   Back-office démo : demo.com@gmail.com / demo
   ===================================================================== */
(function () {
  const KEY = "ady-demo-db-v3";
  const DEMO_EMAIL = "demo.com@gmail.com";
  const DEMO_PASSWORDS = ["demo", "démo", "Demo", "Démo"];
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));
  const now = () => new Date().toISOString();
  const handlers = [];

  function seed() {
    const S = window.ADY_SEED;
    const db = { categories: [], products: [], product_variants: [], option_groups: [], option_choices: [], product_option_groups: [],
      settings: [{ id: 1, orders_open: true, beach_open: true, beach_min: 5, food_from: "11:00:00", food_to: "15:00:00", stamps_goal: 10,
        beach_lat: 16.2181, beach_lng: -61.3965, beach_radius: 420, beach_photo_required: true, updated_at: now() }],
      orders: [], order_items: [], seq: 100 };
    S.categories.forEach((c) => db.categories.push({ signature_label: null, hours: null, footnote: null, ...c }));
    S.groups.forEach((g) => {
      db.option_groups.push({ id: g.id, name: g.name, sort: g.sort });
      g.choices.forEach(([label, d, def], k) => db.option_choices.push({ id: uid(), group_id: g.id, label, price_delta: d, is_default: !!def, available: true, sort: k }));
    });
    S.products.forEach((p) => {
      const id = uid();
      db.products.push({ id, category_id: p.category_id, name: p.name, description: p.description || "", price: p.price, iced: !!p.iced, signature: !!p.signature,
        available: true, stock: null, image: p.image || null, featured: !!p.featured, badge: p.badge || null, sort: p.sort, archived: false, created_at: now() });
      (p.variants || []).forEach((label, k) => db.product_variants.push({ id: uid(), product_id: id, label, stock: label === "S" ? 2 : 8, sort: k }));
      (p.groups || []).forEach((g, k) => db.product_option_groups.push({ product_id: id, group_id: g, sort: k }));
    });
    return db;
  }
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    const db = seed(); save(db, true); sampleOrders(db); return db;
  }
  function save(db, silent) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { console.warn("Démo : stockage plein", e); }
    if (!silent) handlers.forEach((h) => { try { h(); } catch (e) {} });
  }
  addEventListener("storage", (e) => { if (e.key === KEY) handlers.forEach((h) => { try { h(); } catch (err) {} }); });

  /* ---------- quelques commandes d'exemple pour le back-office ---------- */
  function sampleOrders(db) {
    const find = (n) => db.products.find((p) => p.name === n);
    const choice = (g, l) => db.option_choices.find((c) => c.group_id === g && c.label === l);
    const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
    const mk = (o, items, minutes) => {
      const r = placeOrder(db, o, true);
      if (r.error) return;
      const ord = db.orders.find((x) => x.token === r.data.token);
      ord.created_at = ago(minutes); ord.status = o.status || "new";
    };
    try {
      mk({ mode: "plage", name: "Léa", phone: "0690 11 22 33", spot: "Parasol jaune, à droite du poste de secours", lat: 16.2183, lng: -61.3958, accuracy: 9,
        items: [{ product_id: find("Maracudja matcha tonic").id, qty: 2 }, { product_id: find("Iced latte tiramisu").id, qty: 1, options: [choice("lait", "Avoine").id] }] }, null, 2);
      mk({ mode: "shop", name: "Marc", when: "Dans 15 min", note: "Bien glacé svp", status: "preparing",
        items: [{ product_id: find("Latte").id, qty: 2, options: [choice("temperature", "Glacé").id, choice("sirop", "Caramel").id] }] }, null, 7);
      mk({ mode: "plage", name: "Sarah", phone: "0690 00 00 00", spot: "Serviette rayée rouge", status: "delivering",
        items: [{ product_id: find("Citronnade gwozey peyi").id, qty: 2, options: [choice("format", "50 cl").id] }, { product_id: find("T-shirt ADY Coffee Club").id, variant_id: db.product_variants.find((v) => v.product_id === find("T-shirt ADY Coffee Club").id && v.label === "M").id, qty: 1 }] }, null, 18);
      mk({ mode: "shop", name: "Kévin", when: "Dès que possible", status: "done", items: [{ product_id: find("Cappuccino").id, qty: 2 }] }, null, 52);
    } catch (e) { console.warn(e); }
    save(db, true);
  }

  /* ---------- passer une commande (même logique que place_order en SQL) ---------- */
  function guadeloupeTime() {
    return new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Guadeloupe", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  }
  const fmt = (n) => Number(n).toFixed(2).replace(".", ",");
  function placeOrder(db, p, skipHours) {
    const err = (m) => ({ data: null, error: { message: m } });
    const s = db.settings[0];
    const mode = p.mode || "shop";
    const name = String(p.name || "").trim().slice(0, 60), phone = String(p.phone || "").trim().slice(0, 30);
    if (!s.orders_open) return err("Les commandes en ligne sont fermées pour le moment.");
    if (!["shop", "plage"].includes(mode)) return err("Mode de commande inconnu.");
    if (mode === "plage" && !s.beach_open) return err("La livraison plage est fermée pour le moment.");
    if (!name) return err("Ajoute ton prénom.");
    if (mode === "plage" && !phone) return err("Ajoute ton numéro pour que le livreur puisse t'appeler.");
    if (!Array.isArray(p.items) || !p.items.length) return err("Ta commande est vide.");
    if (mode === "plage" && !skipHours) {
      if (p.lat == null || p.lng == null) return err("Place ton épingle sur la carte pour qu'on te trouve.");
      const rad = (d) => (d * Math.PI) / 180;
      const h = Math.sin(rad(p.lat - s.beach_lat) / 2) ** 2 + Math.cos(rad(s.beach_lat)) * Math.cos(rad(p.lat)) * Math.sin(rad(p.lng - s.beach_lng) / 2) ** 2;
      if (2 * 6371000 * Math.asin(Math.sqrt(h)) > s.beach_radius * 1.15) return err("Ta position est en dehors de la zone de livraison (plage de la Caravelle).");
      if (s.beach_photo_required && !p.photo_path) return err("Ajoute une photo de ton spot pour que le livreur te trouve.");
    }
    // simulation dans une copie : rien n'est écrit si une ligne est refusée
    const work = JSON.parse(JSON.stringify(db));
    const order = { id: uid(), number: ++work.seq, token: uid(), mode, status: "new", customer_name: name, phone: phone || null,
      pickup_when: p.when || null, note: p.note || null, spot: p.spot || null, lat: p.lat ?? null, lng: p.lng ?? null, accuracy: p.accuracy ?? null,
      photo_path: p.photo_path || null, loyalty_code: p.loyalty_code || null, reward_claimed: !!p.reward_claimed,
      subtotal: 0, discount: 0, total: 0, created_at: now(), updated_at: now() };
    const items = [];
    let sub = 0, cheapest = null;
    const t = guadeloupeTime();
    for (const it of p.items) {
      const q = Number(it.qty);
      if (!(q >= 1 && q <= 20)) return err("Quantité invalide.");
      const pr = work.products.find((x) => x.id === it.product_id);
      if (!pr || pr.archived) return err("Un article de ta commande n'est plus à la carte. Recharge la page.");
      if (!pr.available) return err(`${pr.name} est épuisé pour aujourd'hui.`);
      const cat = work.categories.find((c) => c.id === pr.category_id) || {};
      if (!skipHours && cat.kind === "food" && (t < s.food_from.slice(0, 5) || t > s.food_to.slice(0, 5)))
        return err(`${pr.name} est servi de ${s.food_from.slice(0, 5).replace(":", "h")} à ${s.food_to.slice(0, 5).replace(":", "h")}.`);
      const vars = work.product_variants.filter((v) => v.product_id === pr.id);
      let va = null;
      if (vars.length) {
        va = vars.find((v) => v.id === it.variant_id);
        if (!va) return err(`Choisis une taille pour ${pr.name}.`);
        if (va.stock !== null) { if (va.stock < q) return err(`Plus que ${va.stock} en taille ${va.label} pour ${pr.name}.`); va.stock -= q; }
      } else if (pr.stock !== null) {
        if (pr.stock < q) return err(`Plus que ${pr.stock} × ${pr.name} en stock.`);
        pr.stock -= q;
      }
      let unit = Number(pr.price), labels = [], iced = /^(iced|.*tonic|affogato|citronnade|thé glacé)/i.test(pr.name);
      const linked = work.product_option_groups.filter((l) => l.product_id === pr.id).map((l) => l.group_id);
      const chosen = (it.options || []).map((id) => work.option_choices.find((c) => c.id === id));
      if (chosen.some((c) => !c)) return err("Option inconnue. Recharge la page.");
      const seen = new Set();
      for (const c of chosen.sort((a, b) => (work.option_groups.find((g) => g.id === a.group_id)?.sort || 0) - (work.option_groups.find((g) => g.id === b.group_id)?.sort || 0))) {
        if (!linked.includes(c.group_id)) return err(`Option non disponible pour ${pr.name}.`);
        if (seen.has(c.group_id)) return err("Une seule option par choix.");
        if (!c.available) return err(`${c.label} n'est plus disponible.`);
        seen.add(c.group_id);
        unit += Number(c.price_delta);
        if (c.group_id === "temperature") iced = /^glac/i.test(c.label);
        if (!c.is_default) labels.push(c.label + (c.price_delta > 0 ? ` (+${fmt(c.price_delta)} €)` : ""));
      }
      const line = { id: uid(), order_id: order.id, product_id: pr.id, variant_id: va ? va.id : null, name: pr.name, size: va ? va.label : null, iced, qty: q, unit_price: unit, options: labels, free_qty: 0 };
      items.push(line);
      sub += unit * q;
      if (cat.kind === "drink" && (cheapest === null || unit < cheapest.unit)) cheapest = { unit, line };
    }
    if (mode === "plage" && sub < s.beach_min) return err(`Livraison plage dès ${fmt(s.beach_min)} €.`);
    if (order.reward_claimed && order.loyalty_code && cheapest) { order.discount = cheapest.unit; cheapest.line.free_qty = 1; } else order.reward_claimed = false;
    order.subtotal = Math.round(sub * 100) / 100; order.total = Math.round((sub - order.discount) * 100) / 100;
    work.orders.push(order); work.order_items.push(...items);
    Object.assign(db, work);
    return { data: { number: order.number, token: order.token, total: order.total, discount: order.discount }, error: null };
  }

  /* ---------- mini client façon Supabase ---------- */
  const DEFAULTS = {
    products: () => ({ id: uid(), description: "", iced: false, signature: false, available: true, stock: null, image: null, featured: false, badge: null, sort: 0, archived: false, created_at: now() }),
    product_variants: () => ({ id: uid(), stock: null, sort: 0 }),
    categories: () => ({ kind: "drink", sort: 0, signature_label: null, hours: null, footnote: null }),
    option_choices: () => ({ id: uid(), price_delta: 0, is_default: false, available: true, sort: 0 }),
    option_groups: () => ({ sort: 0 }),
    product_option_groups: () => ({ sort: 0 })
  };
  class Query {
    constructor(t) { this.t = t; this.op = "select"; this.f = []; this.o = []; this.one = false; this.embed = false; this.ret = false; }
    select(cols) { if (this.op !== "select") this.ret = true; if (cols && cols.includes("order_items(")) this.embed = true; return this; }
    eq(k, v) { this.f.push((r) => r[k] === v); return this; }
    neq(k, v) { this.f.push((r) => r[k] !== v); return this; }
    in(k, arr) { this.f.push((r) => arr.includes(r[k])); return this; }
    gte(k, v) { this.f.push((r) => r[k] >= v); return this; }
    lt(k, v) { this.f.push((r) => r[k] < v); return this; }
    order(k, o = {}) { this.o.push([k, o.ascending !== false]); return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    update(patch) { this.op = "update"; this.patch = patch; return this; }
    insert(rows) { this.op = "insert"; this.rows = Array.isArray(rows) ? rows : [rows]; return this; }
    upsert(rows) { return this.insert(rows); }
    delete() { this.op = "delete"; return this; }
    then(res, rej) { try { res(this.run()); } catch (e) { rej ? rej(e) : res({ data: null, error: { message: e.message } }); } }
    run() {
      const db = load();
      const T = db[this.t]; if (!T) return { data: null, error: { message: "Table inconnue : " + this.t } };
      const match = (r) => this.f.every((fn) => fn(r));
      let out = [];
      if (this.op === "select") {
        out = T.filter(match).map((r) => ({ ...r }));
        for (const [k, asc] of this.o.slice().reverse()) out.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * (asc ? 1 : -1));
        if (this.embed) out.forEach((r) => (r.order_items = db.order_items.filter((i) => i.order_id === r.id).map((i) => ({ ...i }))));
      } else if (this.op === "update") {
        T.filter(match).forEach((r) => {
          if (this.t === "orders" && this.patch.status === "cancelled" && r.status !== "cancelled") restock(db, r.id);
          Object.assign(r, this.patch, this.t === "orders" || this.t === "settings" ? { updated_at: now() } : {});
          out.push({ ...r });
        });
        save(db);
      } else if (this.op === "insert") {
        this.rows.forEach((row) => { const r = { ...(DEFAULTS[this.t] ? DEFAULTS[this.t]() : {}), ...row }; T.push(r); out.push({ ...r }); });
        save(db);
      } else if (this.op === "delete") {
        db[this.t] = T.filter((r) => !match(r)); save(db);
      }
      if (this.one) return out.length ? { data: out[0], error: null } : { data: null, error: { message: "Introuvable" } };
      return { data: out, error: null };
    }
  }
  function restock(db, orderId) {
    db.order_items.filter((i) => i.order_id === orderId).forEach((i) => {
      if (i.variant_id) { const v = db.product_variants.find((x) => x.id === i.variant_id); if (v && v.stock !== null) v.stock += i.qty; }
      else { const p = db.products.find((x) => x.id === i.product_id); if (p && p.stock !== null) p.stock += i.qty; }
    });
  }

  function createClient() {
    return {
      demo: true,
      from: (t) => new Query(t),
      rpc: async (fn, args = {}) => {
        if (fn === "is_admin") return { data: !!sessionStorage.getItem("ady-demo-session"), error: null };
        if (fn === "place_order") { const db = load(); const r = placeOrder(db, args.p || {}); if (!r.error) save(db); return r; }
        if (fn === "order_status") {
          const o = load().orders.find((x) => x.token === args.p_token);
          return { data: o ? { number: o.number, status: o.status, mode: o.mode, total: o.total, created_at: o.created_at } : null, error: null };
        }
        return { data: null, error: { message: "Fonction inconnue" } };
      },
      storage: {
        from: () => ({
          upload: async (path, blob) => {
            const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
            try { localStorage.setItem("ady-demo-photo:" + path, url); } catch (e) { return { data: null, error: { message: "Photo trop lourde pour la démo" } }; }
            return { data: { path }, error: null };
          },
          createSignedUrl: async (path) => ({ data: { signedUrl: localStorage.getItem("ady-demo-photo:" + path) || "" }, error: null })
        })
      },
      auth: {
        getSession: async () => ({ data: { session: sessionStorage.getItem("ady-demo-session") ? { user: { email: DEMO_EMAIL } } : null } }),
        signInWithPassword: async ({ email, password }) => {
          if (String(email).trim().toLowerCase() === DEMO_EMAIL && DEMO_PASSWORDS.includes(String(password).trim())) {
            sessionStorage.setItem("ady-demo-session", "1"); return { data: {}, error: null };
          }
          return { data: null, error: { message: "Identifiants incorrects" } };
        },
        signOut: async () => { sessionStorage.removeItem("ady-demo-session"); return { error: null }; }
      },
      channel: () => {
        const ch = { on(_, __, fn) { handlers.push(fn); return ch; }, subscribe(cb) { cb && cb("SUBSCRIBED"); return ch; } };
        return ch;
      }
    };
  }
  window.ADY_DEMO = { createClient, reset() { localStorage.removeItem(KEY); Object.keys(localStorage).filter((k) => k.startsWith("ady-demo-photo:")).forEach((k) => localStorage.removeItem(k)); load(); handlers.forEach((h) => h()); }, email: DEMO_EMAIL };
})();

/* Client unique pour le site et le back-office : Supabase si configuré, sinon la démo */
window.ADY_CLIENT = (function () {
  const c = window.ADY_CONFIG || {};
  if (c.supabaseUrl && c.supabaseAnonKey && window.supabase) return window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
  return window.ADY_DEMO.createClient();
})();
