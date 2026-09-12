-- Restaurant & Cafe onboarding template (docs/business/06-restaurant-vertical.md,
-- "Not in this build" list). The category has existed since 055 as a label
-- with nothing behind it; this is the first real template row + pages for it,
-- so a restaurant customer signing up gets an actual site instead of the
-- blank-starter fallback every unbacked category silently produced before
-- published-templates.ts fixed that class of bug.
--
-- Hand-written to match the exact block jsonb shape of the existing
-- "Cleaning service" template (id e9c0e6c4-...) rather than generated —
-- copied field-for-field from a real published page's `blocks` column so it
-- renders correctly on the first try instead of guessing the page-builder's
-- schema blind.
--
-- Menu page uses the ecommerce_products block, reading live from `products`
-- — the same table 086_product_dietary_info.sql extended with spice
-- level/veg-non-veg/tags. A restaurant that fills in their menu as products
-- sees it appear here with no separate "menu" data model to keep in sync.

insert into public.templates (
  id, slug, name, description, category, category_id, tags,
  gradient, thumb_from, thumb_to, accent_color, pages, has_demo, featured,
  owner_id, status, sort_order, active
) values (
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91',
  'restaurant-and-cafe',
  'Restaurant & Cafe',
  'A full ordering site for restaurants and cafes — online menu, dine-in QR ordering, pickup and delivery, all in one.',
  'Restaurant & Cafe',
  'c3334437-61c7-494a-864c-e081a0947235',
  array['restaurant','cafe','food','menu','dine-in','delivery'],
  '', '#f97316', '#facc15', '#f97316',
  5, false, true,
  '4ca1e308-3ec9-4a07-b6d3-83108c3e9df6',
  'published', 0, true
);

-- ─── Home ───────────────────────────────────────────────────────────────
insert into public.pages (id, tenant_id, title, slug, type, status, template_id, order_index, blocks, seo)
values (
  gen_random_uuid(), null, 'Home', 'home', 'page', 'published',
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91', 0,
  '[
    {"id":"rh-hero","type":"hero","order":0,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":0,"left":0,"right":0,"bottom":0},
     "templateVariant":"fullscreen-overlay",
     "data":{"badge":"Now Open","title":"Good Food, Made Fresh","layout":"centered",
       "subtitle":"Dine in, pick up, or have it delivered",
       "typography":{"descColor":"","titleSize":"5xl","titleColor":"","subtitleColor":""},
       "description":"Add a compelling description that explains what you offer and why visitors should care.",
       "primaryButton":{"url":"#menu","label":"View Menu","variant":"primary"},
       "secondaryButton":{"url":"#contact","label":"Find Us","variant":"outline"}}},
    {"id":"rh-text","type":"text","order":1,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"columns":1,"alignment":"center","typography":{"color":"#374151"},
       "content":"<h2>Our Story</h2><p>We started this place because we love food made properly — real ingredients, real care, no shortcuts. Every dish on our menu is something we would happily serve our own family.</p><p>Whether you are joining us at a table, grabbing something on the way home, or having it delivered to your door, we want it to taste like we made it just for you.</p>"}},
    {"id":"rh-features","type":"features","order":2,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},"templateVariant":"icon-list-cards",
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Order However Suits You","subtitle":"Three ways to enjoy what we make","layout":"grid","columns":3,"style":"card",
       "items":[
         {"id":"rh-f1","icon":"UtensilsCrossed","title":"Dine In","description":"Scan the QR code on your table and order straight to the kitchen."},
         {"id":"rh-f2","icon":"ShoppingBag","title":"Pickup","description":"Order ahead online and grab it on your way, no waiting around."},
         {"id":"rh-f3","icon":"Bike","title":"Delivery","description":"Have it brought straight to your door, hot and fresh."}
       ]}},
    {"id":"rh-stats","type":"stats","order":3,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Why Guests Keep Coming Back","style":"plain","layout":"row","animate":true,"columns":4,
       "items":[
         {"id":"rh-s1","label":"Years Serving The Neighborhood","value":"5","suffix":"+"},
         {"id":"rh-s2","label":"Dishes On The Menu","value":"40","suffix":"+"},
         {"id":"rh-s3","label":"Average Rating","value":"4.8","suffix":"★"},
         {"id":"rh-s4","label":"Orders Served","value":"10000","suffix":"+"}
       ]}},
    {"id":"rh-faq","type":"faq","order":4,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Common Questions","subtitle":"Everything you might want to know before ordering",
       "layout":"accordion","allowMultiple":false,
       "items":[
         {"id":"rh-q1","question":"Do you take walk-ins for dine-in?","answer":"Yes — just scan the QR code on any open table and start ordering. No need to wait for staff."},
         {"id":"rh-q2","question":"How long does delivery take?","answer":"Most orders arrive within 30-45 minutes depending on distance and how busy the kitchen is."},
         {"id":"rh-q3","question":"Can I customize an order?","answer":"Yes — leave a note with your order and our kitchen will do their best to accommodate it."},
         {"id":"rh-q4","question":"Do you cater for dietary requirements?","answer":"Check the tags on each menu item for spice level and dietary info, or contact us directly with any questions."}
       ]}},
    {"id":"rh-contact","type":"contact","order":5,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Find Us","subtitle":"Questions, feedback, or a large group booking — reach out",
       "layout":"split","showMap":true,"showContactInfo":true,
       "submitLabel":"Send Message","successMessage":"Thanks! We will get back to you shortly.",
       "fields":[
         {"id":"rh-c1","type":"text","label":"Name","required":true},
         {"id":"rh-c2","type":"email","label":"Email","required":true},
         {"id":"rh-c3","type":"textarea","label":"Message","required":true}
       ]}}
  ]'::jsonb,
  '{}'::jsonb
);

-- ─── Menu ───────────────────────────────────────────────────────────────
insert into public.pages (id, tenant_id, title, slug, type, status, template_id, order_index, blocks, seo)
values (
  gen_random_uuid(), null, 'Menu', 'menu', 'page', 'published',
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91', 1,
  '[
    {"id":"rm-hero","type":"hero","order":0,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":0,"left":0,"right":0,"bottom":0},
     "templateVariant":"fullscreen-overlay",
     "data":{"badge":"Menu","title":"What We''re Serving","layout":"centered",
       "subtitle":"Made fresh, every day",
       "typography":{"descColor":"","titleSize":"5xl","titleColor":"","subtitleColor":""},
       "description":"Add a compelling description that explains what you offer and why visitors should care.",
       "primaryButton":{"url":"#products","label":"Order Now","variant":"primary"},
       "secondaryButton":{"url":"/contact","label":"Contact Us","variant":"outline"}}},
    {"id":"rm-products","type":"ecommerce_products","order":1,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Full Menu","subtitle":"Add your dishes as products to fill this in",
       "displayCount":24,"layout":"grid","columns":3,"sortBy":"latest",
       "showAddToCart":true,"showDescription":true,"showBadges":true,"showRating":false,
       "cardStyle":"default","imageRatio":"square","sectionPadding":"md","titleAlignment":"center"}}
  ]'::jsonb,
  '{}'::jsonb
);

-- ─── About ──────────────────────────────────────────────────────────────
insert into public.pages (id, tenant_id, title, slug, type, status, template_id, order_index, blocks, seo)
values (
  gen_random_uuid(), null, 'About', 'about', 'page', 'published',
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91', 2,
  '[
    {"id":"ra-text","type":"text","order":0,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"columns":1,"alignment":"center","typography":{"color":"#374151"},
       "content":"<h2>About Us</h2><p>Add a compelling description that explains what you offer and why visitors should care.</p>"}},
    {"id":"ra-gallery","type":"gallery","order":1,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"A Look Inside","layout":"grid","columns":3,"gap":"md","lightbox":true,"images":[]}},
    {"id":"ra-icon-grid","type":"icon_grid","order":2,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},"templateVariant":"minimal-inline",
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Good To Know","style":"plain","columns":4,"iconSize":"md",
       "items":[
         {"id":"ra-i1","icon":"BadgeCheck","label":"Licensed Kitchen"},
         {"id":"ra-i2","icon":"Leaf","label":"Fresh Ingredients"},
         {"id":"ra-i3","icon":"Clock","label":"Fast Service"},
         {"id":"ra-i4","icon":"Star","label":"Highly Rated"}
       ]}}
  ]'::jsonb,
  '{}'::jsonb
);

-- ─── Order Info (fulfillment explainer + hours) ─────────────────────────
insert into public.pages (id, tenant_id, title, slug, type, status, template_id, order_index, blocks, seo)
values (
  gen_random_uuid(), null, 'Order Info', 'order-info', 'page', 'published',
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91', 3,
  '[
    {"id":"ro-features","type":"features","order":0,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},"templateVariant":"bento-grid",
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"How Ordering Works","subtitle":"Dine-in, pickup, or delivery — pick what suits you","layout":"grid","columns":3,"style":"card",
       "items":[
         {"id":"ro-f1","icon":"QrCode","title":"Dine In","description":"Scan the QR code on your table. Your order goes straight to the kitchen and is brought to where you are sitting."},
         {"id":"ro-f2","icon":"ShoppingBag","title":"Pickup","description":"Order online and choose a pickup time. Skip the queue — just walk in and collect."},
         {"id":"ro-f3","icon":"Bike","title":"Delivery","description":"Order online with your address. We will get it to your door as soon as it is ready."}
       ]}},
    {"id":"ro-stats","type":"stats","order":1,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Opening Hours","style":"plain","layout":"row","animate":false,"columns":4,
       "items":[
         {"id":"ro-s1","label":"Mon - Fri","value":"11am","suffix":" - 10pm"},
         {"id":"ro-s2","label":"Saturday","value":"11am","suffix":" - 11pm"},
         {"id":"ro-s3","label":"Sunday","value":"12pm","suffix":" - 9pm"},
         {"id":"ro-s4","label":"Kitchen Closes", "value":"30", "suffix":" min before"}
       ]}}
  ]'::jsonb,
  '{}'::jsonb
);

-- ─── Contact ────────────────────────────────────────────────────────────
insert into public.pages (id, tenant_id, title, slug, type, status, template_id, order_index, blocks, seo)
values (
  gen_random_uuid(), null, 'Contact', 'contact', 'page', 'published',
  'a1e4f9c2-6b8d-4f3a-9e21-7c5d8b0f2a91', 4,
  '[
    {"id":"rc-contact","type":"contact","order":0,"width":"full","visible":true,"animation":"none",
     "background":{"type":"none"},
     "margin":{"top":0,"left":0,"right":0,"bottom":0},"padding":{"top":64,"left":24,"right":24,"bottom":64},
     "data":{"title":"Get In Touch","subtitle":"Bookings, feedback, or questions — we would love to hear from you",
       "layout":"split","showMap":true,"showContactInfo":true,
       "submitLabel":"Send Message","successMessage":"Thanks! We will get back to you shortly.",
       "fields":[
         {"id":"rc-f1","type":"text","label":"Name","required":true},
         {"id":"rc-f2","type":"email","label":"Email","required":true},
         {"id":"rc-f3","type":"text","label":"Subject","required":false},
         {"id":"rc-f4","type":"textarea","label":"Message","required":true}
       ]}}
  ]'::jsonb,
  '{}'::jsonb
);
