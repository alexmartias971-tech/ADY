/* Mode démo : la carte de départ (ADY_SEED) puis la petite base locale qui imite Supabase */
/* Carte de départ du mode démo (même contenu que supabase/seed.sql) */
window.ADY_SEED = {"categories":[{"id":"cafeinees","title":"Les caféinées","kind":"drink","signature_label":"Boissons signatures","hours":null,"footnote":null,"sort":0},{"id":"sale","title":"Le salé","kind":"food","signature_label":"Les accompagnements","hours":"11h – 15h","footnote":null,"sort":1},{"id":"matcha","title":"Matcha","kind":"drink","signature_label":"Boisson signature","hours":null,"footnote":null,"sort":2},{"id":"gourmandes","title":"Les gourmandes","kind":"drink","signature_label":"Les glacées","hours":null,"footnote":null,"sort":3},{"id":"rafraichissements","title":"Rafraîchissements","kind":"drink","signature_label":null,"hours":null,"footnote":null,"sort":4},{"id":"merch","title":"T-shirts","kind":"merch","sort":5}],"products":[{"category_id":"cafeinees","name":"Espresso","description":"","price":2.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":0,"groups":[]},{"category_id":"cafeinees","name":"Double espresso","description":"","price":3.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":1,"groups":[]},{"category_id":"cafeinees","name":"Americano","description":"","price":3.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":2,"groups":[]},{"category_id":"cafeinees","name":"Cappuccino","description":"","price":4,"iced":false,"signature":false,"featured":false,"badge":null,"sort":3,"groups":["lait","sirop"]},{"category_id":"cafeinees","name":"Flat white","description":"","price":4.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":4,"groups":["lait","sirop"]},{"category_id":"cafeinees","name":"Latte","description":"","price":5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":5,"groups":["temperature","lait","sirop"]},{"category_id":"cafeinees","name":"Caramel macchiato","description":"","price":5.5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":6,"groups":["temperature","lait"]},{"category_id":"cafeinees","name":"Latte sirop de vanille","description":"","price":5.5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":7,"groups":["temperature","lait","sirop"]},{"category_id":"cafeinees","name":"Iced latte tiramisu","description":"Double espresso, lait, nuage tiramisu","price":6,"iced":true,"signature":true,"featured":true,"badge":"Best-seller","sort":8,"groups":["lait","sirop"]},{"category_id":"cafeinees","name":"Latte beurre de cacahuète","description":"","price":6,"iced":true,"signature":true,"featured":false,"badge":null,"sort":9,"groups":["temperature","lait","sirop"]},{"category_id":"sale","name":"ADY club sandwich","description":"Pain de mie, poulet boucané, bacon grillé, salade, tomate, ADY sauce","price":14,"iced":false,"signature":false,"featured":false,"badge":null,"sort":0,"groups":[]},{"category_id":"sale","name":"Hot dog","description":"Pain brioché, saucisse, pickles, oignons frits, ADY sauce","price":11.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":1,"groups":[]},{"category_id":"sale","name":"Salade César bowl","description":"Poulet boucané, salade, tomate, croûtons, parmesan, sauce César","price":13,"iced":false,"signature":false,"featured":false,"badge":null,"sort":2,"groups":[]},{"category_id":"sale","name":"Salade César wrap","description":"Poulet boucané, salade, tomate, croûtons, parmesan, sauce César","price":13,"iced":false,"signature":false,"featured":false,"badge":null,"sort":3,"groups":[]},{"category_id":"sale","name":"Breakfast burrito","description":"Tortilla, oeufs brouillés, röstis de pomme de terre, bacon grillé, cheddar","price":13,"iced":false,"signature":false,"featured":false,"badge":null,"sort":4,"groups":[]},{"category_id":"sale","name":"Veggie wrap","description":"Tortilla, chou rouge, carotte, concombre, feta, oignon rouge, grenade, ADY sauce","price":12,"iced":false,"signature":false,"featured":false,"badge":null,"sort":5,"groups":[]},{"category_id":"sale","name":"Smoked fish bagel","description":"Bagel, marlin & thon fumés, oeufs brouillés, fromage frais, avocat","price":14,"iced":false,"signature":false,"featured":false,"badge":null,"sort":6,"groups":[]},{"category_id":"sale","name":"Breakfast bagel","description":"Bagel, oeufs brouillés, bacon grillé, cheddar, oignons frits, ADY sauce","price":12,"iced":false,"signature":false,"featured":false,"badge":null,"sort":7,"groups":[]},{"category_id":"sale","name":"Caribbean lobster roll","description":"Pain brioché, langouste, avocat, sauce maison","price":18,"iced":false,"signature":false,"featured":false,"badge":null,"sort":8,"groups":[]},{"category_id":"sale","name":"Frites classiques","description":"","price":3.5,"iced":false,"signature":true,"featured":false,"badge":null,"sort":9,"groups":[]},{"category_id":"sale","name":"Frites gourmandes","description":"Frites, cheddar, oignons frits","price":5,"iced":false,"signature":true,"featured":false,"badge":null,"sort":10,"groups":[]},{"category_id":"matcha","name":"Matcha latte","description":"","price":5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":0,"groups":["temperature","lait"]},{"category_id":"matcha","name":"Matcha latte vanille","description":"","price":5.5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":1,"groups":["temperature","lait"]},{"category_id":"matcha","name":"Mango matcha latte","description":"Purée de mangue","price":6,"iced":true,"signature":false,"featured":true,"badge":"Fruit péyi","sort":2,"groups":["temperature","lait"]},{"category_id":"matcha","name":"Goyave matcha latte","description":"Purée de goyave","price":6,"iced":true,"signature":false,"featured":false,"badge":null,"sort":3,"groups":["temperature","lait"]},{"category_id":"matcha","name":"Banana matcha latte","description":"Caramel de banane","price":6,"iced":true,"signature":false,"featured":false,"badge":null,"sort":4,"groups":["temperature","lait"]},{"category_id":"matcha","name":"Maracudja matcha tonic","description":"Matcha, sirop de maracudja & tonic","price":6.5,"iced":true,"signature":true,"featured":true,"badge":"Coup de cœur","sort":5,"groups":[]},{"category_id":"gourmandes","name":"Chocolat chaud","description":"","price":4,"iced":true,"signature":false,"featured":false,"badge":null,"sort":0,"groups":["temperature","lait"]},{"category_id":"gourmandes","name":"Chaï latte","description":"","price":5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":1,"groups":["temperature","lait"]},{"category_id":"gourmandes","name":"Dirty chaï latte","description":"","price":5.5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":2,"groups":["temperature","lait"]},{"category_id":"gourmandes","name":"Thé & infusion","description":"","price":4,"iced":false,"signature":false,"featured":false,"badge":null,"sort":3,"groups":[]},{"category_id":"gourmandes","name":"Ube latte","description":"","price":5,"iced":true,"signature":false,"featured":false,"badge":null,"sort":4,"groups":["temperature","lait"]},{"category_id":"gourmandes","name":"Affogato café","description":"Glace vanille ou coco","price":5,"iced":false,"signature":true,"featured":false,"badge":null,"sort":5,"groups":[]},{"category_id":"gourmandes","name":"Affogato matcha","description":"Glace vanille ou coco","price":5,"iced":false,"signature":true,"featured":false,"badge":null,"sort":6,"groups":[]},{"category_id":"rafraichissements","name":"Citronnade maison","description":"","price":4,"iced":false,"signature":false,"featured":false,"badge":null,"sort":0,"groups":["format"]},{"category_id":"rafraichissements","name":"Citronnade maracudja","description":"","price":4.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":1,"groups":["format"]},{"category_id":"rafraichissements","name":"Citronnade gwozey peyi","description":"","price":4.5,"iced":false,"signature":false,"featured":true,"badge":"Fait maison","sort":2,"groups":["format"]},{"category_id":"rafraichissements","name":"Thé glacé gwozey peyi","description":"","price":4.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":3,"groups":["format"]},{"category_id":"rafraichissements","name":"Thé glacé citron","description":"","price":4.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":4,"groups":["format"]},{"category_id":"rafraichissements","name":"Thé glacé maracudja","description":"","price":4.5,"iced":false,"signature":false,"featured":false,"badge":null,"sort":5,"groups":["format"]},{"category_id":"rafraichissements","name":"Jus d'orange","description":"","price":4,"iced":false,"signature":false,"featured":false,"badge":null,"sort":6,"groups":["format"]},{"category_id":"merch","name":"Maillot ADY Californian","description":"Le maillot rayé crème et rouge, ADY en grand sur le devant.","price":35,"image":"assets/merch-maillot.webp","iced":false,"signature":false,"featured":false,"badge":null,"sort":0,"groups":[],"variants":["S","M","L","XL"]},{"category_id":"merch","name":"T-shirt ADY Coffee Club","description":"Rouge, dos illustré « Sainte-Anne | Guadeloupe ».","price":25,"image":"assets/merch-club.webp","iced":false,"signature":false,"featured":false,"badge":null,"sort":1,"groups":[],"variants":["S","M","L","XL"]},{"category_id":"merch","name":"T-shirt ADY Club crème","description":"Crème, imprimé rouge et palmiers.","price":25,"image":"assets/merch-creme.webp","iced":false,"signature":false,"featured":false,"badge":null,"sort":2,"groups":[],"variants":["S","M","L","XL"]}],"groups":[{"id":"temperature","name":"Température","sort":0,"choices":[["Chaud",0,true],["Glacé",0]]},{"id":"lait","name":"Lait","sort":1,"choices":[["Lait de vache",0,true],["Avoine",0.5],["Coco",0.5],["Amande",0.5]]},{"id":"sirop","name":"Sirop","sort":2,"choices":[["Sans sirop",0,true],["Vanille",0.5],["Caramel",0.5],["Noisette",0.5],["Coco",0.5]]},{"id":"format","name":"Format","sort":3,"choices":[["33 cl",0,true],["50 cl",1]]}]};

/* =====================================================================
   ADY : mode démo
   Une petite base locale (dans le navigateur) qui imite Supabase.
   Utilisée automatiquement tant que config.js n'est pas rempli.
   Back-office (/admin) et espace livreur (/livreur) démo : demo.com@gmail.com / demo
   ===================================================================== */
(function () {
  const KEY = "ady-demo-db-v8";
  const DEMO_EMAIL = "demo.com@gmail.com";
  const DEMO_PASSWORDS = ["demo", "démo", "Demo", "Démo"];
  const SESSION = "ady-demo-session";   // partagée entre /admin et /livreur, comme une vraie session
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));
  const now = () => new Date().toISOString();
  const handlers = [];

  function seed() {
    const S = window.ADY_SEED;
    const db = { categories: [], products: [], product_variants: [], option_groups: [], option_choices: [], product_option_groups: [],
      settings: [{ id: 1, orders_open: true, beach_open: true, beach_min: 5, food_from: "11:00:00", food_to: "15:00:00", stamps_goal: 10, updated_at: now() }],
      delivery_points: [], orders: [], order_items: [], seq: 100 };
    // points de livraison de départ (mêmes que supabase/seed.sql)
    [["le-ponton", "Le ponton", "Au bout ouest de la plage, à côté du ponton en bois", 16.21965, -61.39851, "ponton"],
     ["cocotier", "Le grand cocotier", "Entre le ponton et le panneau, sous le grand cocotier", 16.21941, -61.39755, "cocotier"],
     ["panneau-ady", "Panneau ADY", "Au milieu de la plage, le panneau rouge ADY Coffee Shop", 16.21831, -61.39634, "panneau-ady"],
     ["la-pointe", "Côté pointe", "Au sud, juste avant la pointe", 16.21739, -61.39491, "pointe"],
     ["cote-est", "Côté est", "De l’autre côté de la pointe, face à la baie", 16.21878, -61.39452, "cote-est"]]
      .forEach(([slug, name, hint, lat, lng, img], sort) => db.delivery_points.push({ id: uid(), slug, name, hint, lat, lng, photo_url: `assets/point-${img}.svg`, active: true, sort, created_at: now() }));
    S.categories.forEach((c) => db.categories.push({ signature_label: null, hours: null, footnote: null, ...c }));
    S.groups.forEach((g) => {
      db.option_groups.push({ id: g.id, name: g.name, sort: g.sort });
      g.choices.forEach(([label, d, def], k) => db.option_choices.push({ id: uid(), group_id: g.id, label, price_delta: d, is_default: !!def, available: true, sort: k }));
    });
    S.products.forEach((p) => {
      const id = uid();
      db.products.push({ id, category_id: p.category_id, name: p.name, description: p.description || "", price: p.price, iced: !!p.iced, signature: !!p.signature,
        available: true, stock: null, image: p.image || null, featured: !!p.featured, badge: p.badge || null, allergens: null, sort: p.sort, archived: false, created_at: now() });
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
    const point = (slug) => db.delivery_points.find((x) => x.slug === slug).id;
    try {
      mk({ mode: "plage", name: "Léa Martin", phone: "0690 11 22 33", point_id: point("panneau-ady"), spot: "Chapeau de paille, serviette jaune",
        items: [{ product_id: find("Maracudja matcha tonic").id, qty: 2 }, { product_id: find("Iced latte tiramisu").id, qty: 1, options: [choice("lait", "Avoine").id] }] }, null, 2);
      mk({ mode: "shop", name: "Marc Dupont", when: "Dans 15 min", note: "Bien glacé svp", status: "preparing",
        items: [{ product_id: find("Latte").id, qty: 2, options: [choice("temperature", "Glacé").id, choice("sirop", "Caramel").id] }] }, null, 7);
      mk({ mode: "plage", name: "Sarah Louis", phone: "0690 00 00 00", point_id: point("cocotier"), status: "delivering",
        items: [{ product_id: find("Citronnade gwozey peyi").id, qty: 2, options: [choice("format", "50 cl").id] }, { product_id: find("T-shirt ADY Coffee Club").id, variant_id: db.product_variants.find((v) => v.product_id === find("T-shirt ADY Coffee Club").id && v.label === "M").id, qty: 1 }] }, null, 18);
      mk({ mode: "shop", name: "Kévin Bernard", when: "Dès que possible", status: "done", items: [{ product_id: find("Cappuccino").id, qty: 2 }] }, null, 52);
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
    const name = String(p.name || "").trim().slice(0, 80), phone = String(p.phone || "").trim().slice(0, 30);
    if (!s.orders_open) return err("Les commandes en ligne sont fermées pour le moment.");
    if (!["shop", "plage"].includes(mode)) return err("Mode de commande inconnu.");
    if (mode === "plage" && !s.beach_open) return err("La livraison plage est fermée pour le moment.");
    if (!name) return err("Ajoute ton nom et ton prénom.");
    if (mode === "plage" && !phone) return err("Ajoute ton numéro : on te prévient quand ta commande est au point.");
    if (!Array.isArray(p.items) || !p.items.length) return err("Ta commande est vide.");
    let pt = null;
    if (mode === "plage") {
      if (!p.point_id) return err("Choisis ton point de livraison sur la plage.");
      pt = db.delivery_points.find((x) => x.id === p.point_id && x.active);
      if (!pt) return err("Ce point de livraison n'est plus disponible. Choisis-en un autre.");
    }
    // simulation dans une copie : rien n'est écrit si une ligne est refusée
    const work = JSON.parse(JSON.stringify(db));
    const order = { id: uid(), number: ++work.seq, token: uid(), mode, status: "new", cancel_reason: null, customer_name: name, phone: phone || null,
      pickup_when: mode === "shop" ? p.when || null : null, note: p.note || null,
      spot: pt ? pt.name + (String(p.spot || "").trim() ? " · " + String(p.spot).trim().slice(0, 120) : "") : null,
      lat: pt ? pt.lat : null, lng: pt ? pt.lng : null, point_id: pt ? pt.id : null,
      loyalty_code: p.loyalty_code || null, reward_claimed: !!p.reward_claimed,
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
    product_option_groups: () => ({ sort: 0 }),
    delivery_points: () => ({ id: uid(), hint: "", photo_url: null, active: true, sort: 0, created_at: now() })
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
        const connecte = !!localStorage.getItem(SESSION);
        if (fn === "is_admin" || fn === "is_staff") return { data: connecte, error: null };
        if (fn === "mon_role") return { data: connecte ? "gerant" : null, error: null };
        // code secret du gérant (démo : 1234 tant qu'il n'a pas été changé)
        if (fn === "code_existe") return { data: connecte, error: null };
        if (fn === "verifier_code") return { data: connecte && String(args.p_code || "") === (load().code || "1234"), error: null };
        if (fn === "definir_code") {
          const db = load();
          if (!/^[0-9]{4,6}$/.test(String(args.p_nouveau || ""))) return { data: null, error: { message: "Le code doit faire 4 à 6 chiffres." } };
          if (String(args.p_ancien || "") !== (db.code || "1234")) return { data: null, error: { message: "L'ancien code n'est pas le bon." } };
          db.code = String(args.p_nouveau); save(db, true);
          return { data: true, error: null };
        }
        if (fn === "livreur_avance") {
          if (!connecte) return { data: null, error: { message: "Accès refusé." } };
          const db = load(); const o = db.orders.find((x) => x.id === args.p_id);
          if (!o || o.mode !== "plage") return { data: null, error: { message: "Livraison introuvable." } };
          const ok = { delivering: ["preparing", "ready"], arrived: ["delivering"], done: ["delivering", "arrived"] }[args.p_status] || [];
          if (!ok.includes(o.status)) return { data: null, error: { message: "Cette commande a déjà changé d'étape. Actualise la page." } };
          o.status = args.p_status; o.updated_at = now(); save(db);
          return { data: { status: o.status }, error: null };
        }
        if (fn === "place_order") { const db = load(); const r = placeOrder(db, args.p || {}); if (!r.error) save(db); return r; }
        if (fn === "order_status") {
          const o = load().orders.find((x) => x.token === args.p_token);
          return { data: o ? { number: o.number, status: o.status, mode: o.mode, total: o.total, created_at: o.created_at, reason: o.cancel_reason || null } : null, error: null };
        }
        return { data: null, error: { message: "Fonction inconnue" } };
      },
      auth: {
        getSession: async () => ({ data: { session: localStorage.getItem(SESSION) ? { user: { email: DEMO_EMAIL } } : null } }),
        signInWithPassword: async ({ email, password }) => {
          if (String(email).trim().toLowerCase() === DEMO_EMAIL && DEMO_PASSWORDS.includes(String(password).trim())) {
            localStorage.setItem(SESSION, "1"); return { data: {}, error: null };
          }
          return { data: null, error: { message: "Identifiants incorrects" } };
        },
        signOut: async () => { localStorage.removeItem(SESSION); return { error: null }; }
      },
      channel: () => {
        const ch = { on(_, __, fn) { handlers.push(fn); return ch; }, subscribe(cb) { cb && cb("SUBSCRIBED"); return ch; } };
        return ch;
      }
    };
  }
  window.ADY_DEMO = { createClient, reset() { localStorage.removeItem(KEY); load(); handlers.forEach((h) => h()); }, email: DEMO_EMAIL };
})();

/* Client unique pour le site et le back-office : Supabase si configuré, sinon la démo */
window.ADY_CLIENT = (function () {
  const c = window.ADY_CONFIG || {};
  if (c.supabaseUrl && c.supabaseAnonKey && window.supabase) return window.supabase.createClient(c.supabaseUrl, c.supabaseAnonKey);
  return window.ADY_DEMO.createClient();
})();
