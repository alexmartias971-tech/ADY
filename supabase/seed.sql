-- Carte de départ ADY (à lancer une seule fois, après schema.sql)
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('cafeinees','Les caféinées','drink','Boissons signatures',null,null,0);
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('sale','Le salé','food','Les accompagnements','11h – 15h',null,1);
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('matcha','Matcha','drink','Boisson signature',null,null,2);
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('gourmandes','Les gourmandes','drink','Les glacées',null,null,3);
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('rafraichissements','Rafraîchissements','drink',null,null,null,4);
insert into public.categories (id,title,kind,signature_label,hours,footnote,sort) values ('merch','T-shirts','merch',null,null,null,5);
insert into public.option_groups (id,name,sort) values ('temperature','Température',0);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('temperature','Chaud',0,true,0);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('temperature','Glacé',0,false,1);
insert into public.option_groups (id,name,sort) values ('lait','Lait',1);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('lait','Lait de vache',0,true,0);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('lait','Avoine',0.5,false,1);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('lait','Coco',0.5,false,2);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('lait','Amande',0.5,false,3);
insert into public.option_groups (id,name,sort) values ('sirop','Sirop',2);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('sirop','Sans sirop',0,true,0);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('sirop','Vanille',0.5,false,1);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('sirop','Caramel',0.5,false,2);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('sirop','Noisette',0.5,false,3);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('sirop','Coco',0.5,false,4);
insert into public.option_groups (id,name,sort) values ('format','Format',3);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('format','33 cl',0,true,0);
insert into public.option_choices (group_id,label,price_delta,is_default,sort) values ('format','50 cl',1,false,1);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Espresso','',2.5,false,false,false,null,null,0) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Double espresso','',3.5,false,false,false,null,null,1) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Americano','',3.5,false,false,false,null,null,2) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Cappuccino','',4,false,false,false,null,null,3) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('lait',0),('sirop',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Flat white','',4.5,false,false,false,null,null,4) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('lait',0),('sirop',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Latte','',5,true,false,false,null,null,5) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1),('sirop',2)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Caramel macchiato','',5.5,true,false,false,null,null,6) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Latte sirop de vanille','',5.5,true,false,false,null,null,7) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1),('sirop',2)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Iced latte tiramisu','Double espresso, lait, nuage tiramisu',6,true,true,true,'Best-seller',null,8) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('lait',0),('sirop',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('cafeinees','Latte beurre de cacahuète','',6,true,true,false,null,null,9) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1),('sirop',2)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','ADY club sandwich','Pain de mie, poulet boucané, bacon grillé, salade, tomate, ADY sauce',14,false,false,false,null,null,0) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Hot dog','Pain brioché, saucisse, pickles, oignons frits, ADY sauce',11.5,false,false,false,null,null,1) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Salade César bowl','Poulet boucané, salade, tomate, croûtons, parmesan, sauce César',13,false,false,false,null,null,2) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Salade César wrap','Poulet boucané, salade, tomate, croûtons, parmesan, sauce César',13,false,false,false,null,null,3) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Breakfast burrito','Tortilla, oeufs brouillés, röstis de pomme de terre, bacon grillé, cheddar',13,false,false,false,null,null,4) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Veggie wrap','Tortilla, chou rouge, carotte, concombre, feta, oignon rouge, grenade, ADY sauce',12,false,false,false,null,null,5) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Smoked fish bagel','Bagel, marlin & thon fumés, oeufs brouillés, fromage frais, avocat',14,false,false,false,null,null,6) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Breakfast bagel','Bagel, oeufs brouillés, bacon grillé, cheddar, oignons frits, ADY sauce',12,false,false,false,null,null,7) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Caribbean lobster roll','Pain brioché, langouste, avocat, sauce maison',18,false,false,false,null,null,8) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Frites classiques','',3.5,false,true,false,null,null,9) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('sale','Frites gourmandes','Frites, cheddar, oignons frits',5,false,true,false,null,null,10) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Matcha latte','',5,true,false,false,null,null,0) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Matcha latte vanille','',5.5,true,false,false,null,null,1) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Mango matcha latte','Purée de mangue',6,true,false,true,'Fruit péyi',null,2) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Goyave matcha latte','Purée de goyave',6,true,false,false,null,null,3) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Banana matcha latte','Caramel de banane',6,true,false,false,null,null,4) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('matcha','Maracudja matcha tonic','Matcha, sirop de maracudja & tonic',6.5,true,true,true,'Coup de cœur',null,5) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Chocolat chaud','',4,true,false,false,null,null,0) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Chaï latte','',5,true,false,false,null,null,1) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Dirty chaï latte','',5.5,true,false,false,null,null,2) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Thé & infusion','',4,false,false,false,null,null,3) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Ube latte','',5,true,false,false,null,null,4) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('temperature',0),('lait',1)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Affogato café','Glace vanille ou coco',5,false,true,false,null,null,5) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('gourmandes','Affogato matcha','Glace vanille ou coco',5,false,true,false,null,null,6) returning id)
select 1 from p;
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Citronnade maison','',4,false,false,false,null,null,0) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Citronnade maracudja','',4.5,false,false,false,null,null,1) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Citronnade gwozey peyi','',4.5,false,false,true,'Fait maison',null,2) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Thé glacé gwozey peyi','',4.5,false,false,false,null,null,3) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Thé glacé citron','',4.5,false,false,false,null,null,4) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Thé glacé maracudja','',4.5,false,false,false,null,null,5) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('rafraichissements','Jus d''orange','',4,false,false,false,null,null,6) returning id)
insert into public.product_option_groups (product_id,group_id,sort) select p.id, g.id, g.sort from p, (values ('format',0)) as g(id,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('merch','Maillot ADY Californian','Le maillot rayé crème et rouge, ADY en grand sur le devant.',35,false,false,false,null,'assets/merch-maillot.webp',0) returning id)
insert into public.product_variants (product_id,label,sort) select p.id, v.label, v.sort from p, (values ('S',0),('M',1),('L',2),('XL',3)) as v(label,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('merch','T-shirt ADY Coffee Club','Rouge, dos illustré « Sainte-Anne | Guadeloupe ».',25,false,false,false,null,'assets/merch-club.webp',1) returning id)
insert into public.product_variants (product_id,label,sort) select p.id, v.label, v.sort from p, (values ('S',0),('M',1),('L',2),('XL',3)) as v(label,sort);
with p as (insert into public.products (category_id,name,description,price,iced,signature,featured,badge,image,sort) values ('merch','T-shirt ADY Club crème','Crème, imprimé rouge et palmiers.',25,false,false,false,null,'assets/merch-creme.webp',2) returning id)
insert into public.product_variants (product_id,label,sort) select p.id, v.label, v.sort from p, (values ('S',0),('M',1),('L',2),('XL',3)) as v(label,sort);

-- Points de livraison de départ, d'ouest en est (dessins provisoires) : à ajuster
-- et à photographier depuis le back-office (Points plage → glisser le numéro sur
-- la carte, ou « Prendre ma position ici », puis « Changer la photo »).
insert into public.delivery_points (slug, name, hint, lat, lng, photo_url, sort) values
  ('le-ponton', 'Le ponton', 'Au bout ouest de la plage, à côté du ponton en bois', 16.21965, -61.39851, 'assets/point-ponton.svg', 0),
  ('cocotier', 'Le grand cocotier', 'Entre le ponton et le panneau, sous le grand cocotier', 16.21941, -61.39755, 'assets/point-cocotier.svg', 1),
  ('panneau-ady', 'Panneau ADY', 'Au milieu de la plage, le panneau rouge ADY Coffee Shop', 16.21831, -61.39634, 'assets/point-panneau-ady.svg', 2),
  ('la-pointe', 'Côté pointe', 'Au sud, juste avant la pointe', 16.21739, -61.39491, 'assets/point-pointe.svg', 3),
  ('cote-est', 'Côté est', 'De l’autre côté de la pointe, face à la baie', 16.21878, -61.39452, 'assets/point-cote-est.svg', 4)
on conflict (slug) do nothing;
