-- =====================================================================
-- ADY Coffee Shop : base de données (Supabase)
-- À coller dans Supabase > SQL Editor, puis « Run ». Une seule fois.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Admins (comptes qui ont accès au back-office) ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Carte ----------
create table if not exists public.categories (
  id text primary key,                         -- ex : cafeinees, sale, merch
  title text not null,
  kind text not null default 'drink' check (kind in ('drink','food','merch')),
  signature_label text,                        -- titre de l'encadré (« Boissons signatures »…)
  hours text,                                  -- affichage, ex : « 11h – 15h »
  footnote text,
  sort int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(7,2) not null check (price >= 0),
  iced boolean not null default false,         -- existe aussi en glacé
  signature boolean not null default false,    -- dans l'encadré signature
  available boolean not null default true,     -- false = « épuisé » affiché sur le site
  stock int check (stock is null or stock >= 0), -- null = stock non suivi
  image text,
  featured boolean not null default false,     -- mis en avant dans « Commence par celles-là »
  badge text,                                  -- petite étiquette sur la carte produit (« Best-seller »…)
  sort int not null default 0,
  archived boolean not null default false,     -- supprimé de la carte (gardé pour l'historique)
  created_at timestamptz not null default now()
);
create unique index if not exists products_name_live on public.products (lower(name)) where not archived;

create table if not exists public.product_variants (     -- tailles des t-shirts
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  stock int check (stock is null or stock >= 0),
  sort int not null default 0
);

-- ---------- Options (lait, sirop, format…) ----------
create table if not exists public.option_groups (
  id text primary key,                         -- ex : lait, sirop, format, temperature
  name text not null,
  sort int not null default 0
);
create table if not exists public.option_choices (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.option_groups(id) on update cascade on delete cascade,
  label text not null,
  price_delta numeric(6,2) not null default 0,
  is_default boolean not null default false,
  available boolean not null default true,
  sort int not null default 0
);
create table if not exists public.product_option_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  group_id text not null references public.option_groups(id) on update cascade on delete cascade,
  sort int not null default 0,
  primary key (product_id, group_id)
);

-- ---------- Réglages (une seule ligne) ----------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  orders_open boolean not null default true,   -- interrupteur général des commandes en ligne
  beach_open boolean not null default true,    -- livraison plage active
  beach_min numeric(7,2) not null default 5,
  food_from time not null default '11:00',
  food_to time not null default '15:00',
  stamps_goal int not null default 10,
  updated_at timestamptz not null default now()
);
-- zone de livraison plage (centre et rayon calés sur la plage de la Caravelle dans OpenStreetMap)
alter table public.settings add column if not exists beach_lat double precision not null default 16.2181;
alter table public.settings add column if not exists beach_lng double precision not null default -61.3965;
alter table public.settings add column if not exists beach_radius int not null default 420;
alter table public.settings add column if not exists beach_photo_required boolean not null default true;
insert into public.settings (id) values (1) on conflict do nothing;

-- ---------- Commandes ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  token uuid not null default gen_random_uuid() unique,   -- sert au client pour suivre sa commande
  mode text not null check (mode in ('shop','plage')),
  status text not null default 'new' check (status in ('new','preparing','ready','delivering','done','cancelled')),
  customer_name text not null,
  phone text,
  pickup_when text,
  note text,
  spot text,
  lat double precision,
  lng double precision,
  accuracy int,
  photo_path text,
  loyalty_code text,
  reward_claimed boolean not null default false,
  subtotal numeric(8,2) not null default 0,
  discount numeric(8,2) not null default 0,
  total numeric(8,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name text not null,
  size text,
  iced boolean not null default false,
  qty int not null check (qty between 1 and 20),
  unit_price numeric(7,2) not null,           -- prix unitaire options comprises
  options jsonb not null default '[]'::jsonb,  -- ex : ["Glacé", "Avoine (+0,50 €)"]
  free_qty int not null default 0
);

-- updated_at automatique
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- Commande annulée : le stock revient automatiquement
create or replace function public.restock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.product_variants v set stock = v.stock + i.qty
      from public.order_items i where i.order_id = new.id and i.variant_id = v.id and v.stock is not null;
    update public.products p set stock = p.stock + i.qty
      from public.order_items i where i.order_id = new.id and i.variant_id is null and i.product_id = p.id and p.stock is not null;
  end if;
  return new;
end $$;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock after update of status on public.orders for each row execute function public.restock_on_cancel();

-- =====================================================================
-- Passer une commande (appelée par le site). Les prix sont recalculés
-- ici, côté serveur : le client ne peut pas les modifier.
-- =====================================================================
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings;
  o public.orders;
  it jsonb;
  pr public.products;
  va public.product_variants;
  cat public.categories;
  q int;
  sub numeric := 0;
  cheapest numeric := null;
  cheapest_item uuid := null;
  new_item uuid;
  ch public.option_choices;
  opt_ids uuid[];
  opt_labels jsonb;
  unit numeric;
  is_iced boolean;
  local_t time := (now() at time zone 'America/Guadeloupe')::time;
  v_mode text := coalesce(p->>'mode', 'shop');
  v_name text := left(trim(coalesce(p->>'name', '')), 60);
  v_phone text := left(trim(coalesce(p->>'phone', '')), 30);
  v_disc numeric := 0;
begin
  select * into s from public.settings where id = 1;
  if not s.orders_open then raise exception 'Les commandes en ligne sont fermées pour le moment.'; end if;
  if v_mode not in ('shop','plage') then raise exception 'Mode de commande inconnu.'; end if;
  if v_mode = 'plage' and not s.beach_open then raise exception 'La livraison plage est fermée pour le moment.'; end if;
  if v_name = '' then raise exception 'Ajoute ton prénom.'; end if;
  if v_mode = 'plage' and v_phone = '' then raise exception 'Ajoute ton numéro pour que le livreur puisse t''appeler.'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then raise exception 'Ta commande est vide.'; end if;
  -- livraison plage : position dans la zone (petite tolérance pour le GPS) et photo du spot
  if v_mode = 'plage' then
    if (p->>'lat') is null or (p->>'lng') is null then raise exception 'Place ton épingle sur la carte pour qu''on te trouve.'; end if;
    if 2 * 6371000 * asin(sqrt(
         power(sin(radians(((p->>'lat')::double precision - s.beach_lat) / 2)), 2)
         + cos(radians(s.beach_lat)) * cos(radians((p->>'lat')::double precision))
         * power(sin(radians(((p->>'lng')::double precision - s.beach_lng) / 2)), 2))) > s.beach_radius * 1.15 then
      raise exception 'Ta position est en dehors de la zone de livraison (plage de la Caravelle).';
    end if;
    if s.beach_photo_required and coalesce(p->>'photo_path', '') !~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then
      raise exception 'Ajoute une photo de ton spot pour que le livreur te trouve.';
    end if;
  end if;
  if jsonb_array_length(p->'items') > 30 then raise exception 'Commande trop longue.'; end if;

  insert into public.orders (mode, customer_name, phone, pickup_when, note, spot, lat, lng, accuracy, photo_path, loyalty_code, reward_claimed)
  values (v_mode, v_name, nullif(v_phone,''),
          left(p->>'when', 40), left(p->>'note', 240), left(p->>'spot', 160),
          (p->>'lat')::double precision, (p->>'lng')::double precision, (p->>'accuracy')::int,
          case when (p->>'photo_path') ~ '^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then p->>'photo_path' end,
          nullif(left(p->>'loyalty_code', 20), ''), coalesce((p->>'reward_claimed')::boolean, false))
  returning * into o;

  for it in select * from jsonb_array_elements(p->'items') loop
    q := (it->>'qty')::int;
    if q is null or q < 1 or q > 20 then raise exception 'Quantité invalide.'; end if;

    select * into pr from public.products where id = (it->>'product_id')::uuid for update;
    if not found or pr.archived then raise exception 'Un article de ta commande n''est plus à la carte. Recharge la page.'; end if;
    if not pr.available then raise exception '% est épuisé pour aujourd''hui.', pr.name; end if;
    select * into cat from public.categories where id = pr.category_id;

    if cat.kind = 'food' and (local_t < s.food_from or local_t > s.food_to) then
      raise exception '% est servi de % à %.', pr.name, to_char(current_date + s.food_from, 'HH24"h"MI'), to_char(current_date + s.food_to, 'HH24"h"MI');
    end if;

    va := null;
    if exists (select 1 from public.product_variants where product_id = pr.id) then
      select * into va from public.product_variants where id = (it->>'variant_id')::uuid and product_id = pr.id for update;
      if not found then raise exception 'Choisis une taille pour %.', pr.name; end if;
      if va.stock is not null then
        if va.stock < q then raise exception 'Plus que % en taille % pour %.', va.stock, va.label, pr.name; end if;
        update public.product_variants set stock = stock - q where id = va.id;
      end if;
    elsif pr.stock is not null then
      if pr.stock < q then raise exception 'Plus que % × % en stock.', pr.stock, pr.name; end if;
      update public.products set stock = stock - q where id = pr.id;
    end if;

    -- options : une par groupe, uniquement parmi les groupes liés au produit
    unit := pr.price; opt_labels := '[]'::jsonb; is_iced := pr.iced and pr.name ~* '^(iced|.*tonic|affogato|citronnade|thé glacé)';
    select coalesce(array_agg(x::uuid), '{}') into opt_ids from jsonb_array_elements_text(coalesce(it->'options', '[]'::jsonb)) x;
    if array_length(opt_ids, 1) > 6 then raise exception 'Trop d''options.'; end if;
    if exists (
      select c.group_id from public.option_choices c where c.id = any(opt_ids) group by c.group_id having count(*) > 1
    ) then raise exception 'Une seule option par choix.'; end if;
    for ch in select c.* from public.option_choices c
              join public.option_groups g on g.id = c.group_id
              where c.id = any(opt_ids) order by g.sort loop
      if not exists (select 1 from public.product_option_groups pog where pog.product_id = pr.id and pog.group_id = ch.group_id) then
        raise exception 'Option non disponible pour %.', pr.name;
      end if;
      if not ch.available then raise exception '% n''est plus disponible.', ch.label; end if;
      unit := unit + ch.price_delta;
      if ch.group_id = 'temperature' then is_iced := ch.label ilike 'glac%'; end if;
      if not ch.is_default then
        opt_labels := opt_labels || to_jsonb(ch.label || case when ch.price_delta > 0 then ' (+' || replace(to_char(ch.price_delta, 'FM990.00'), '.', ',') || ' €)' else '' end);
      end if;
    end loop;
    if (select count(*) from public.option_choices where id = any(opt_ids)) <> coalesce(array_length(opt_ids, 1), 0) then
      raise exception 'Option inconnue. Recharge la page.';
    end if;

    insert into public.order_items (order_id, product_id, variant_id, name, size, iced, qty, unit_price, options)
    values (o.id, pr.id, va.id, pr.name, va.label, is_iced, q, unit, opt_labels)
    returning id into new_item;

    sub := sub + unit * q;
    if cat.kind = 'drink' and (cheapest is null or unit < cheapest) then cheapest := unit; cheapest_item := new_item; end if;
  end loop;

  if v_mode = 'plage' and sub < s.beach_min then
    raise exception 'Livraison plage dès % €.', replace(to_char(s.beach_min, 'FM990.00'), '.', ',');
  end if;

  -- 10e boisson offerte : la moins chère du panier (le shop vérifie la carte à la remise)
  if o.reward_claimed and o.loyalty_code is not null and cheapest_item is not null then
    v_disc := cheapest;
    update public.order_items set free_qty = 1 where id = cheapest_item;
  else
    update public.orders set reward_claimed = false where id = o.id;
  end if;

  update public.orders set subtotal = sub, discount = v_disc, total = sub - v_disc where id = o.id
  returning * into o;

  return jsonb_build_object('number', o.number, 'token', o.token, 'total', o.total, 'discount', o.discount);
end $$;

-- Suivi d'une commande par le client (avec son jeton secret)
create or replace function public.order_status(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('number', number, 'status', status, 'mode', mode, 'total', total, 'created_at', created_at)
  from public.orders where token = p_token;
$$;

revoke all on function public.place_order(jsonb) from public;
revoke all on function public.order_status(uuid) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.order_status(uuid) to anon, authenticated;

-- =====================================================================
-- Sécurité (RLS)
-- =====================================================================
alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.settings enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_choices enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "admins lisent leur ligne" on public.admins;
create policy "admins lisent leur ligne" on public.admins for select to authenticated using (user_id = auth.uid());

-- la carte et les réglages sont publics en lecture, modifiables par les admins
do $$ declare t text; begin
  foreach t in array array['categories','products','product_variants','settings','option_groups','option_choices','product_option_groups'] loop
    execute format('drop policy if exists "lecture publique" on public.%I', t);
    execute format('create policy "lecture publique" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "admins écrivent" on public.%I', t);
    execute format('create policy "admins écrivent" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- les commandes ne sont visibles que par les admins (le site passe par place_order)
drop policy if exists "admins commandes" on public.orders;
create policy "admins commandes" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins lignes" on public.order_items;
create policy "admins lignes" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Photos du spot (livraison plage) : le client dépose, seuls les admins lisent
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('spots', 'spots', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "dépôt photo spot" on storage.objects;
create policy "dépôt photo spot" on storage.objects for insert to anon, authenticated with check (bucket_id = 'spots');
drop policy if exists "admins lisent les photos" on storage.objects;
create policy "admins lisent les photos" on storage.objects for select to authenticated using (bucket_id = 'spots' and public.is_admin());

-- =====================================================================
-- Temps réel : le back-office reçoit les nouvelles commandes instantanément
-- =====================================================================
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;
