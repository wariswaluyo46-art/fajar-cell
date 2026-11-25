-- Konter Fajar Cell - skema database Supabase (PostgreSQL)
--
-- Cara pakai:
--   1. Buka dashboard Supabase -> SQL Editor -> New query.
--   2. Tempel seluruh isi file ini, lalu klik Run.
--   3. Salin Project URL dan service_role key dari Project Settings -> API
--      ke .env.local (lihat .env.example).
--
-- RLS & Principle of Least Privilege:
--   - Peran publik (`anon`, `authenticated`) hanya diizinkan membaca katalog (`SELECT`).
--   - Seluruh operasi tulis (`INSERT`, `UPDATE`, `DELETE`) dicabut dari peran publik
--     dan hanya dapat dijalankan di server menggunakan `service_role` key setelah
--     sesi admin terverifikasi (jangan menaruh `service_role` key di kode client).
--
-- Seed bersifat idempoten: produk dengan id yang sama tidak ditimpa saat file
-- dijalankan ulang.

create table if not exists public.products (
  id text primary key,
  name varchar(120) not null,
  slug varchar(160) not null unique,
  category text not null check (category in ('handphone-bekas', 'handphone-baru', 'aksesoris')),
  brand varchar(32) not null,
  price integer not null check (price >= 0),
  original_price integer check (original_price is null or original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  status text not null default 'ready' check (status in ('ready', 'sold-out')),
  image_url text not null,
  images jsonb not null default '[]'::jsonb,
  description text not null default '',
  featured boolean not null default false,
  color varchar(64),
  trade_in_eligible boolean not null default false,
  accessory_type text check (
    accessory_type is null or accessory_type in (
      'charger',
      'tws',
      'headset',
      'tempered-glass',
      'powerbank',
      'speaker',
      'case',
      'lainnya'
    )
  ),
  compatible_with jsonb,
  condition jsonb,
  warranty jsonb,
  specs jsonb,
  created_at timestamptz(3) not null default now(),
  updated_at timestamptz(3) not null default now()
);

create index if not exists idx_products_category_status
  on public.products (category, status);
create index if not exists idx_products_brand
  on public.products (brand);
create index if not exists idx_products_featured
  on public.products (featured);
create index if not exists idx_products_updated_at
  on public.products (updated_at desc);

alter table public.products enable row level security;

-- Aturan eksplisit least-privilege: hanya SELECT publik, operasi tulis dikunci ke service_role
revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;

drop policy if exists "Public read catalog products" on public.products;
create policy "Public read catalog products"
  on public.products
  for select
  to anon, authenticated
  using (true);

insert into public.products (
  id,
  name,
  slug,
  category,
  brand,
  price,
  original_price,
  stock,
  status,
  image_url,
  images,
  description,
  featured,
  color,
  trade_in_eligible,
  accessory_type,
  compatible_with,
  condition,
  warranty,
  specs,
  created_at,
  updated_at
) values
(
  'hp-baru-infinix-smart-20',
  'Infinix Smart 20 8(4+4)/64GB',
  'infinix-smart-20-8-64',
  'handphone-baru',
  'Infinix',
  1149000,
  1299000,
  5,
  'ready',
  '/images/products/infinix-smart-20.jpg',
  '["/images/products/infinix-smart-20.jpg","/images/products/infinix-smart-20-2.jpg"]'::jsonb,
  'Infinix Smart 20 unit baru segel resmi distributor. Dilengkapi RAM 8GB (4+4GB Extended), ROM 64GB, layar luas 6.78 inci Punch-Hole 120Hz yang sangat mulus, baterai 5000mAh tahan seharian, bodi 7.7mm Ultra-Slim, sertifikasi IP54 Splash Proof, dan 1.5M Drop Resistance. Garansi resmi 1 tahun.',
  true,
  'Sunset Orange',
  true,
  NULL,
  NULL,
  NULL,
  '{"active":true,"durationDays":365,"description":"Garansi resmi distributor 1 tahun"}'::jsonb,
  '{"ram":4,"storage":64,"battery":5000,"camera":"8MP AI Dual Camera","screen":"6.78 inci Punch-Hole 120Hz","chipset":"MediaTek Helio G81 Ultimate"}'::jsonb,
  '2026-11-11T05:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-poco-c81-pro',
  'POCO C81 Pro 4/64GB',
  'poco-c81-pro-4-64',
  'handphone-bekas',
  'Xiaomi',
  600000,
  1199000,
  1,
  'ready',
  '/images/products/poco-c81-pro.jpg',
  '["/images/products/poco-c81-pro.jpg","/images/products/poco-c81-pro-2.jpg"]'::jsonb,
  'POCO C81 Pro unit second istimewa, bodi mulus dan seluruh sensor normal. Layar ekstra lega 6.9 inci 120Hz, baterai monster 6000mAh awet seharian penuh, prosesor UNISOC T7250 kencang dengan Xiaomi HyperOS, kamera 13MP AI jernih. Sudah lulus tes fungsi teknisi.',
  true,
  'Shadow Black',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 96%","label":"Unit + Charger","minusCount":0,"completeness":["Unit HP","Charger Fast Charging","Kabel Data"],"batteryHealth":95}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari cek fungsi & servis"}'::jsonb,
  '{"ram":4,"storage":64,"battery":6000,"camera":"13MP AI Camera","screen":"6.9 inci HD+ 120Hz","chipset":"UNISOC T7250 Octa-Core"}'::jsonb,
  '2026-11-10T10:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-samsung-m30s',
  'Samsung Galaxy M30s 4/64GB',
  'samsung-galaxy-m30s-4-64',
  'handphone-bekas',
  'Samsung',
  1150000,
  2999000,
  1,
  'ready',
  '/images/products/samsung-galaxy-m30s.jpg',
  '["/images/products/samsung-galaxy-m30s.jpg","/images/products/samsung-galaxy-m30s-2.jpg"]'::jsonb,
  'Samsung Galaxy M30s fullset dus box original. Layar Super AMOLED 6.4 inci tajam dan bening, baterai jumbo 6000mAh, Triple Camera 48MP Ultra-Wide, chipset Exynos 9611 handal untuk harian dan medsos. Kondisi mulus, sinyal 4G all operator lancar.',
  true,
  'Opal Black',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 95%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box Original","Unit HP","Charger Original","Buku Panduan"],"batteryHealth":90}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":4,"storage":64,"battery":6000,"camera":"48MP + 8MP (Ultra-Wide) + 5MP","screen":"6.4 inci Super AMOLED FHD+","chipset":"Exynos 9611 Octa-Core"}'::jsonb,
  '2026-11-09T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-oppo-a18',
  'OPPO A18 Glowing Blue 4/128GB',
  'oppo-a18-glowing-blue-4-128',
  'handphone-bekas',
  'Oppo',
  400000,
  1499000,
  1,
  'ready',
  '/images/products/oppo-a18.jpg',
  '["/images/products/oppo-a18.jpg","/images/products/oppo-a18-2.jpg"]'::jsonb,
  'OPPO A18 warna Glowing Blue memikat dengan tekstur bodi matte tahan sidik jari. Storage besar 128GB lega menyimpan ribuan foto dan aplikasi, RAM 4GB + Helio G85 smooth, layar 90Hz Sunlight Display, baterai 5000mAh awet seharian. Segel baut utuh.',
  true,
  'Glowing Blue',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 95%","label":"Unit + Charger","minusCount":0,"completeness":["Unit HP","Charger Fast Charging","Kabel Data"],"batteryHealth":92}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":4,"storage":128,"battery":5000,"camera":"8MP Dual AI Camera","screen":"6.56 inci HD+ 90Hz","chipset":"MediaTek Helio G85"}'::jsonb,
  '2026-10-10T10:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-oppo-a15',
  'OPPO A15 3/32GB',
  'oppo-a15-3-32',
  'handphone-bekas',
  'Oppo',
  750000,
  1799000,
  1,
  'ready',
  '/images/products/oppo-a15.jpg',
  '["/images/products/oppo-a15.jpg","/images/products/oppo-a15-2.jpg"]'::jsonb,
  'OPPO A15 unit second lengkap dus box bawaan original. Desain 3D tipis elegan, AI Triple Camera 13MP dengan sensor makro dan bokeh, sensor sidik jari belakang responsif, baterai 4230mAh tahan lama. Semua fitur bekerja normal 100%.',
  false,
  'Mystery Blue',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 94%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box","Unit HP","Charger","Buku Panduan"],"batteryHealth":88}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":3,"storage":32,"battery":4230,"camera":"13MP + 2MP + 2MP AI Triple Camera","screen":"6.52 inci HD+ Waterdrop","chipset":"MediaTek Helio P35"}'::jsonb,
  '2026-10-15T09:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-redmi-9',
  'Xiaomi Redmi 9 4/64GB',
  'xiaomi-redmi-9-4-64',
  'handphone-bekas',
  'Xiaomi',
  300000,
  1799000,
  1,
  'ready',
  '/images/products/xiaomi-redmi-9.jpg',
  '["/images/products/xiaomi-redmi-9.jpg","/images/products/xiaomi-redmi-9-2.jpg"]'::jsonb,
  'Xiaomi Redmi 9 RAM 4GB ROM 64GB varian Ocean Green. Layar resolusi tinggi FHD+ 6.53 inci jernih tajam, prosesor gaming Helio G80 tangguh, Quad Camera 13MP dengan lensa ultra-wide, baterai besar 5020mAh support Type-C 18W Fast Charging. Siap pakai harian.',
  false,
  'Ocean Green',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 93%","label":"Unit + Case + Charger","minusCount":0,"completeness":["Unit HP","Softcase Hijau","Charger Fast Charging"],"batteryHealth":89}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":4,"storage":64,"battery":5020,"camera":"13MP + 8MP + 5MP + 2MP Quad Camera","screen":"6.53 inci Full HD+ Dot Drop","chipset":"MediaTek Helio G80 Gaming"}'::jsonb,
  '2026-10-07T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-vivo-y1s',
  'Vivo Y1s 2/32GB',
  'vivo-y1s-2-32',
  'handphone-bekas',
  'Vivo',
  550000,
  1499000,
  1,
  'ready',
  '/images/products/vivo-y1s.jpg',
  '["/images/products/vivo-y1s.jpg","/images/products/vivo-y1s-2.jpg"]'::jsonb,
  'Vivo Y1s kondisi lengkap dus box original. Desain bodi ramping dan ringan dengan layar 6.22 inci Ultra All Screen, baterai hemat 4030mAh, kamera belakang 13MP jernih, face access unlock cepat. Sangat cocok untuk anak sekolah dan orang tua.',
  false,
  'Aurora Blue',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 95%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box Asli","Unit HP","Charger Bawaan","Buku Panduan"],"batteryHealth":90}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":2,"storage":32,"battery":4030,"camera":"13MP f/2.2","screen":"6.22 inci HD+ Halo FullView","chipset":"MediaTek Helio P35"}'::jsonb,
  '2026-10-18T09:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-oppo-a71',
  'OPPO A71 (2018) 2/16GB',
  'oppo-a71-2018-2-16',
  'handphone-bekas',
  'Oppo',
  450000,
  1899000,
  1,
  'ready',
  '/images/products/oppo-a71-2018.jpg',
  '["/images/products/oppo-a71-2018.jpg","/images/products/oppo-a71-2018-2.jpg"]'::jsonb,
  'OPPO A71 edisi 2018 ''Speedy Operation'' lengkap dus box asli. Ditenagai prosesor Qualcomm Snapdragon 450 14nm yang hemat daya dan stabil, kamera 13MP dengan teknologi AI Beauty, bodi unibody ramping pas digenggam satu tangan.',
  false,
  'Black Metal',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 92%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box Asli","Unit HP","Charger","Buku Garansi/Manual"],"batteryHealth":85}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":2,"storage":16,"battery":3000,"camera":"13MP f/2.2 AF","screen":"5.2 inci HD IPS LCD","chipset":"Qualcomm Snapdragon 450 Octa-Core"}'::jsonb,
  '2026-10-12T11:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-redmi-6a',
  'Xiaomi Redmi 6A 2/16GB',
  'xiaomi-redmi-6a-2-16',
  'handphone-bekas',
  'Xiaomi',
  400000,
  1399000,
  1,
  'ready',
  '/images/products/xiaomi-redmi-6a.jpg',
  '["/images/products/xiaomi-redmi-6a.jpg","/images/products/xiaomi-redmi-6a-2.jpg"]'::jsonb,
  'Xiaomi Redmi 6A unit lengkap dus box warna oranye khas Xiaomi. Layar rasio modern 18:9 HD+ 5.45 inci, prosesor hemat daya 12nm, kamera 13MP tajam dengan PDAF cepat, dual SIM 4G + slot microSD terpisah. Kondisi mesin prima.',
  false,
  'Black',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 93%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box Oranye","Unit HP","Charger","Buku Panduan"],"batteryHealth":88}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":2,"storage":16,"battery":3000,"camera":"13MP f/2.2 PDAF","screen":"5.45 inci HD+ 18:9","chipset":"MediaTek Helio A22"}'::jsonb,
  '2026-10-09T14:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-redmi-7',
  'Xiaomi Redmi 7 3/32GB',
  'xiaomi-redmi-7-3-32',
  'handphone-bekas',
  'Xiaomi',
  350000,
  1899000,
  1,
  'ready',
  '/images/products/xiaomi-redmi-7.jpg',
  '["/images/products/xiaomi-redmi-7.jpg","/images/products/xiaomi-redmi-7-2.jpg"]'::jsonb,
  'Xiaomi Redmi 7 layar lebar 6.26 inci Dot Drop berproteksi Corning Gorilla Glass 5. Prosesor bertenaga Snapdragon 632, dual kamera AI 12MP + 2MP dengan efek bokeh natural, sensor fingerprint belakang cepat, baterai 4000mAh tahan lama.',
  false,
  'Eclipse Black',
  true,
  NULL,
  NULL,
  '{"grade":"Normal 90%","label":"Unit + Charger","minusCount":1,"completeness":["Unit HP","Charger Fast Charging"],"batteryHealth":86}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":3,"storage":32,"battery":4000,"camera":"12MP + 2MP AI Dual Camera","screen":"6.26 inci HD+ Dot Drop","chipset":"Qualcomm Snapdragon 632"}'::jsonb,
  '2026-10-14T09:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-j2-prime',
  'Samsung Galaxy J2 Prime',
  'samsung-galaxy-j2-prime',
  'handphone-bekas',
  'Samsung',
  350000,
  1699000,
  1,
  'ready',
  '/images/products/samsung-galaxy-j2-prime.jpg',
  '["/images/products/samsung-galaxy-j2-prime.jpg","/images/products/samsung-galaxy-j2-prime-2.jpg"]'::jsonb,
  'Samsung Galaxy J2 Prime legendaris lengkap dus box original. Bodi kokoh anti slip dengan baterai yang bisa dilepas-pasang (removable battery), kamera belakang 8MP dan kamera depan dengan LED Flash untuk selfie di tempat gelap. Cocok untuk HP operasional / telepon dasar.',
  false,
  'Gold Edition',
  true,
  NULL,
  NULL,
  '{"grade":"Mulus 91%","label":"Fullset Dus Box","minusCount":0,"completeness":["Dus Box Bawaan","Unit HP","Baterai Original","Charger"],"batteryHealth":88}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":1.5,"storage":8,"battery":2600,"camera":"8MP f/2.2 + LED Flash Depan","screen":"5.0 inci qHD PLS TFT","chipset":"MediaTek MT6737T Quad-Core"}'::jsonb,
  '2026-10-11T13:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'hp-bekas-oppo-a3s',
  'OPPO A3s 2/16GB',
  'oppo-a3s-2-16',
  'handphone-bekas',
  'Oppo',
  200000,
  1999000,
  1,
  'ready',
  '/images/products/oppo-a3s.jpg',
  '["/images/products/oppo-a3s.jpg","/images/products/oppo-a3s-2.jpg"]'::jsonb,
  'OPPO A3s unit second favorit, bonus casing karakter Spider-Man terpasang. Layar lega 6.2 inci Super Full Screen dengan notch kekinian, dual kamera belakang 13MP + 2MP dengan AI Beauty 2.0, baterai monster 4230mAh tahan hingga 2 hari pemakaian normal. Harga sangat terjangkau.',
  false,
  'Red / Dark Purple',
  true,
  NULL,
  NULL,
  '{"grade":"Normal 90%","label":"Unit + Case Spider-Man + Charger","minusCount":0,"completeness":["Unit HP","Case Spider-Man","Charger"],"batteryHealth":87}'::jsonb,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  '{"ram":2,"storage":16,"battery":4230,"camera":"13MP + 2MP Dual Rear Camera","screen":"6.2 inci HD+ Notch Display","chipset":"Qualcomm Snapdragon 450"}'::jsonb,
  '2026-10-06T10:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-earphone-samsung-akg',
  'Earphone Samsung Galaxy S8/S8+ Tuned by AKG Original (3.5mm)',
  'earphone-samsung-akg-original',
  'aksesoris',
  'Samsung',
  35000,
  50000,
  12,
  'ready',
  '/images/products/earphone-samsung-akg.jpg',
  '["/images/products/earphone-samsung-akg.jpg"]'::jsonb,
  'Earphone kabel Samsung Galaxy Tuned by AKG box hitam segel. Kualitas audio premium dengan karakter suara jernih, vokal tegas, dan bass bulat bertenaga. Menggunakan kabel anyaman kain (braided) anti kusut, jack audio 3.5mm universal, lengkap dengan mikrofon dan tombol volume in-line.',
  true,
  'Titanium Black',
  false,
  'headset',
  '["Samsung Galaxy Series","Xiaomi","OPPO","Vivo","Realme","Laptop"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi tukar baru 7 hari jika tidak bersuara"}'::jsonb,
  NULL,
  '2026-11-01T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-earphone-realme-buds-7',
  'Earphone Realme Buds 7 HD Sound Quality (3.5mm)',
  'earphone-realme-buds-7-hd-sound',
  'aksesoris',
  'Realme',
  25000,
  35000,
  15,
  'ready',
  '/images/products/earphone-realme-buds-7.jpg',
  '["/images/products/earphone-realme-buds-7.jpg","/images/products/earphone-realme-buds-7-2.jpg"]'::jsonb,
  'Handsfree Realme Buds 7 kemasan pouch eksklusif. Desain sporty khas warna kuning Realme, driver bass dinamis dengan karakter dentuman suara punchy, eartips silikon lembut kedap suara, in-line mic jernih untuk teleponan dan main game online.',
  true,
  'Realme Yellow & Black',
  false,
  'headset',
  '["Realme","OPPO","Vivo","Xiaomi","Samsung","Semua HP Jack 3.5mm"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi tukar baru 7 hari"}'::jsonb,
  NULL,
  '2026-11-02T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-charger-samsung-4-6a',
  'Charger Samsung Dual USB Fast Charger 4.6A (BST-C08)',
  'charger-samsung-dual-usb-fast-charger-4-6a',
  'aksesoris',
  'Samsung',
  35000,
  50000,
  10,
  'ready',
  '/images/products/charger-samsung-bst-c08.jpg',
  '["/images/products/charger-samsung-bst-c08.jpg"]'::jsonb,
  'Batok charger Samsung 2USB Fast Charger Travel Charger model BST-C08. Memiliki 2 lubang output USB sehingga bisa mengisi daya 2 HP sekaligus dengan arus besar hingga 4.6A VOOC / Fast Charging. Dilengkapi sistem proteksi pintar Safety Charging anti overcharge dan anti panas.',
  true,
  'White Blue',
  false,
  'charger',
  '["Samsung Galaxy","Xiaomi","OPPO","Vivo","Infinix","Realme"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi tukar baru 14 hari"}'::jsonb,
  NULL,
  '2026-11-03T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-charger-realme-3a',
  'Charger Realme Travel Charger 3.0A Quick Charge 3.0 (OP52CAED)',
  'charger-realme-travel-charger-3a-qc3',
  'aksesoris',
  'Realme',
  45000,
  60000,
  8,
  'ready',
  '/images/products/charger-realme-op52caed.jpg',
  '["/images/products/charger-realme-op52caed.jpg"]'::jsonb,
  'Paket batok charger plus kabel data Realme Travel Charger 3.0A box kuning original. Mendukung Qualcomm Quick Charge 3.0 untuk pengisian daya cepat, stabil, dan aman bagi baterai HP. Ukuran mini portable cocok dibawa bepergian.',
  false,
  'Realme Yellow Box / White Adapter',
  false,
  'charger',
  '["Realme","OPPO","Vivo","Xiaomi","Infinix"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi tukar baru 14 hari"}'::jsonb,
  NULL,
  '2026-11-04T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-charger-kodok-lcd',
  'Desktop LCD USB Universal Charger (Charger Kodok Digital)',
  'desktop-lcd-usb-universal-charger-kodok',
  'aksesoris',
  'Lainnya',
  25000,
  35000,
  15,
  'ready',
  '/images/products/charger-kodok-lcd.jpg',
  '["/images/products/charger-kodok-lcd.jpg"]'::jsonb,
  'Charger jepit baterai serbaguna (Charger Kodok) modern dengan layar indikator LCD digital. Menampilkan persentase pengisian baterai secara akurat dan real-time. Dilengkapi pin fleksibel yang cocok untuk segala bentuk baterai HP lepas-pasang, plus 1 port USB output samping.',
  false,
  'Black & White LCD',
  false,
  'charger',
  '["Baterai Samsung","Baterai Nokia","Baterai Smartfren Andromax","Baterai Lepas-Pasang"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi toko 14 hari"}'::jsonb,
  NULL,
  '2026-11-05T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-kabel-metal-180w',
  'Kabel Data Metal Head 180W Fast Charging Type-C (1 Meter)',
  'kabel-data-metal-head-180w-fast-charging-type-c',
  'aksesoris',
  'Lainnya',
  25000,
  35000,
  20,
  'ready',
  '/images/products/kabel-metal-head-180w.jpg',
  '["/images/products/kabel-metal-head-180w.jpg"]'::jsonb,
  'Kabel data dan charger cepat dengan output super kencang hingga 180W. Menggunakan kepala konektor berlapis metal kokoh anti patah, bodi kabel tebal elastis warna hijau neon yang tidak mudah terpelintir, serta konektor USB ke Type-C berkecepatan tinggi.',
  false,
  'Neon Green',
  false,
  'charger',
  '["Semua HP Android Port Type-C (Samsung, Xiaomi, OPPO, Vivo, Infinix, Realme)"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi tukar baru 14 hari"}'::jsonb,
  NULL,
  '2026-11-06T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-kabel-super-120w',
  'Kabel Data Super Cable 120W 6A Fast Charging Silicone (Micro USB)',
  'kabel-data-super-cable-120w-6a-silicone-micro-usb',
  'aksesoris',
  'Lainnya',
  20000,
  30000,
  20,
  'ready',
  '/images/products/kabel-super-cable-120w.jpg',
  '["/images/products/kabel-super-cable-120w.jpg"]'::jsonb,
  'Kabel data badak dengan material High Quality Silicone tebal, kenyal, dan lentur tahan tekukan ribuan kali. Mendukung arus besar 6A dengan daya maksimal 120W untuk pengisian kilat dan transfer data stabil. Menggunakan ujung konektor Micro USB.',
  false,
  'White Silicone',
  false,
  'charger',
  '["HP Android Port Micro USB (Samsung J-Series, Xiaomi Redmi Lawas, OPPO, Vivo)"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi tukar baru 14 hari"}'::jsonb,
  NULL,
  '2026-11-07T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-kabel-meeplus-me04m',
  'Kabel Data MEEPLUS ME04-M Fast Charging Braided (Micro USB 1M)',
  'kabel-data-meeplus-me04m-fast-charging-braided-micro',
  'aksesoris',
  'Lainnya',
  20000,
  30000,
  15,
  'ready',
  '/images/products/kabel-meeplus-me04m.jpg',
  '["/images/products/kabel-meeplus-me04m.jpg"]'::jsonb,
  'Kabel data MEEPLUS model ME04-M panjang 1000mm (1 Meter). Terbuat dari rajutan nylon braided ekstra kuat anti putus, dilengkapi SR extended protection pada leher konektor untuk mencegah kabel retak, serta output voltase tinggi yang aman dan stabil.',
  false,
  'Black Braided',
  false,
  'charger',
  '["Semua smartphone & perangkat Micro USB"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":14,"description":"Garansi tukar baru 14 hari"}'::jsonb,
  NULL,
  '2026-11-08T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-earphone-ecle-braided',
  'Earphone ECLE 3C Digital In-Ear Braided Stereo (3.5mm)',
  'earphone-ecle-3c-digital-in-ear-braided-stereo',
  'aksesoris',
  'Lainnya',
  20000,
  30000,
  10,
  'ready',
  '/images/products/earphone-ecle-braided.jpg',
  '["/images/products/earphone-ecle-braided.jpg"]'::jsonb,
  'Earphone kabel ECLE kemasan pouch zipper kedap air. Menggunakan kabel transparan lilitan kepang (braided wire) dengan housing metalik abu-abu titanium yang mewah. Suara vokal sangat jernih dan detail, dilengkapi mikrofon telepon bawaan.',
  false,
  'Titanium Braided',
  false,
  'headset',
  '["Semua HP Android dengan Jack Audio 3.5mm"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi tukar baru 7 hari"}'::jsonb,
  NULL,
  '2026-11-09T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-earphone-u19-macaron',
  'Earphone U19 Macaron Pastel 3.5mm Extra Bass',
  'earphone-u19-macaron-pastel-extra-bass',
  'aksesoris',
  'Lainnya',
  15000,
  25000,
  25,
  'ready',
  '/images/products/earphone-u19-macaron.jpg',
  '["/images/products/earphone-u19-macaron.jpg"]'::jsonb,
  'Handsfree U19 Macaron warna pastel doff favorit remaja dan anak muda. Suara bass nendang dan nyaman dipakai berjam-jam tanpa sakit di telinga. Dilengkapi mikrofon untuk panggilan suara dan tombol navigasi praktis.',
  false,
  'Pastel Macaron Series',
  false,
  'headset',
  '["Semua smartphone Android Jack 3.5mm & Laptop"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi tukar baru 7 hari"}'::jsonb,
  NULL,
  '2026-11-10T08:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-tempered-glass-xpro',
  'Tempered Glass 9H XPRO Anti Clear Layar Bening (Redmi 9A / Universal)',
  'tempered-glass-9h-xpro-anti-clear-redmi-9a',
  'aksesoris',
  'Lainnya',
  15000,
  25000,
  30,
  'ready',
  '/images/products/tempered-glass-xpro-redmi-9a.jpg',
  '["/images/products/tempered-glass-xpro-redmi-9a.jpg"]'::jsonb,
  'Pelindung layar kaca tempered glass 9H XPRO jernih anti gores. Dilapisi teknologi Oleophobic coating kimiawi untuk mencegah minyak dan bekas sidik jari menempel, sensitivitas sentuhan tetap 100% responsif. Siap dipasangkan langsung secara gratis dan presisi di konter kami.',
  false,
  'Ultra Clear Bening',
  false,
  'tempered-glass',
  '["Xiaomi Redmi 9A","Redmi 9C","Redmi 10A","Redmi 10C","Universal Layar 6.53 inci"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi pasang rapi tanpa gelembung di toko"}'::jsonb,
  NULL,
  '2026-11-10T09:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
),
(
  'acc-card-reader-all-in-one',
  'Card Reader All in One USB 2.0 Pro Swivel (Micro SD to USB)',
  'card-reader-all-in-one-usb-2-pro-swivel',
  'aksesoris',
  'Lainnya',
  15000,
  20000,
  20,
  'ready',
  '/images/products/card-reader-usb-all-in-one.jpg',
  '["/images/products/card-reader-usb-all-in-one.jpg"]'::jsonb,
  'Alat pembaca kartu memori (Card Reader) model putar / swivel flashdisk USB 2.0 Pro. Membaca kartu MicroSD / TF Card langsung ke port USB laptop, komputer, speaker aktif, atau tape mobil tanpa ribet. Desain putar pelindung tanpa tutup yang rawan hilang.',
  false,
  'Purple Translucent',
  false,
  'lainnya',
  '["Kartu Micro SD / TF Card","Laptop","Komputer PC","Speaker Aktif USB"]'::jsonb,
  NULL,
  '{"active":true,"durationDays":7,"description":"Garansi tukar baru 7 hari"}'::jsonb,
  NULL,
  '2026-11-10T10:00:00.000Z',
  '2026-11-11T05:00:00.000Z'
)
on conflict (id) do nothing;

-- Verifikasi cepat setelah impor:
-- select category, count(*) as total from public.products group by category;

-- =============================================================================
-- FASE 1 OMS & E-COMMERCE: RESERVASI STOK ATOMIK, ORDER & TIKET SERVIS
-- =============================================================================

create extension if not exists pgcrypto;

-- 1. Tabel cart_reservations (hold stok sementara 15 menit anti-overselling)
create table if not exists public.cart_reservations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 8 and 128),
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status text not null default 'held' check (status in ('held', 'converted', 'released', 'expired')),
  expires_at timestamptz(3) not null,
  created_at timestamptz(3) not null default now(),
  updated_at timestamptz(3) not null default now()
);

create unique index if not exists idx_cart_reservations_active_session_product
  on public.cart_reservations (session_id, product_id)
  where status = 'held';

create index if not exists idx_cart_reservations_product_status_expires
  on public.cart_reservations (product_id, status, expires_at);

create index if not exists idx_cart_reservations_session_status
  on public.cart_reservations (session_id, status);

alter table public.cart_reservations enable row level security;
revoke all on table public.cart_reservations from anon, authenticated;

-- 2. Tabel orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  session_id text,
  customer_name varchar(120) not null,
  customer_phone varchar(32) not null,
  delivery_method text not null check (delivery_method in ('cod', 'pickup')),
  payment_method text not null check (payment_method in ('qris', 'dana', 'cod')),
  payment_unique_code integer not null default 0 check (payment_unique_code >= 0 and payment_unique_code <= 999),
  payment_proof_url text,
  destination_address text not null default '',
  destination_lat double precision,
  destination_lng double precision,
  distance_km numeric(6,2) not null default 0 check (distance_km >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  subtotal integer not null check (subtotal >= 0),
  total_amount integer not null check (total_amount >= 0),
  notes text not null default '',
  status text not null default 'pending_approval' check (
    status in (
      'pending_approval',
      'payment_review',
      'approved',
      'out_for_delivery',
      'ready_for_pickup',
      'completed',
      'rejected',
      'cancelled',
      'expired'
    )
  ),
  stock_deducted boolean not null default false,
  admin_notes text not null default '',
  approved_at timestamptz(3),
  completed_at timestamptz(3),
  created_at timestamptz(3) not null default now(),
  updated_at timestamptz(3) not null default now()
);

create index if not exists idx_orders_status_created
  on public.orders (status, created_at desc);

create index if not exists idx_orders_customer_phone
  on public.orders (customer_phone);

create index if not exists idx_orders_created_at
  on public.orders (created_at desc);

alter table public.orders enable row level security;
revoke all on table public.orders from anon, authenticated;

-- 3. Tabel order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name varchar(160) not null,
  product_image text not null default '',
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  warranty_days integer not null default 0 check (warranty_days >= 0),
  created_at timestamptz(3) not null default now()
);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

create index if not exists idx_order_items_product_id
  on public.order_items (product_id);

alter table public.order_items enable row level security;
revoke all on table public.order_items from anon, authenticated;

-- 4. Tabel order_status_history
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by text not null check (changed_by in ('customer', 'admin', 'system')),
  note text not null default '',
  created_at timestamptz(3) not null default now()
);

create index if not exists idx_order_status_history_order_created
  on public.order_status_history (order_id, created_at asc);

alter table public.order_status_history enable row level security;
revoke all on table public.order_status_history from anon, authenticated;

-- 5. Tabel service_tickets
create table if not exists public.service_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  brand varchar(64) not null,
  device_model varchar(120) not null,
  issues jsonb not null default '[]'::jsonb,
  customer_name varchar(120) not null,
  customer_phone varchar(32) not null,
  visit_type text not null default 'datang-langsung' check (visit_type in ('datang-langsung', 'tanya-stok-dulu')),
  estimated_cost_min integer not null default 0 check (estimated_cost_min >= 0),
  estimated_cost_max integer not null default 0 check (estimated_cost_max >= 0),
  notes text not null default '',
  admin_notes text not null default '',
  status text not null default 'received' check (
    status in (
      'received',
      'diagnosing',
      'waiting_parts',
      'repairing',
      'ready_for_pickup',
      'completed',
      'cancelled'
    )
  ),
  created_at timestamptz(3) not null default now(),
  updated_at timestamptz(3) not null default now()
);

create index if not exists idx_service_tickets_status_created
  on public.service_tickets (status, created_at desc);

create index if not exists idx_service_tickets_phone
  on public.service_tickets (customer_phone);

alter table public.service_tickets enable row level security;
revoke all on table public.service_tickets from anon, authenticated;

-- =============================================================================
-- RPC FUNCTIONS (ATOMIC & RACE-CONDITION SAFE)
-- =============================================================================

-- RPC 1: cleanup_expired_reservations()
create or replace function public.cleanup_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  update public.cart_reservations
  set
    status = 'expired',
    updated_at = now()
  where status = 'held'
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- RPC 2: reserve_cart_item()
create or replace function public.reserve_cart_item(
  p_session_id text,
  p_product_id text,
  p_qty integer,
  p_ttl_minutes integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id text := btrim(coalesce(p_session_id, ''));
  v_product_id text := btrim(coalesce(p_product_id, ''));
  v_ttl integer := greatest(1, least(coalesce(p_ttl_minutes, 15), 60));
  v_product public.products%rowtype;
  v_other_cart_held integer := 0;
  v_pending_order_held integer := 0;
  v_available integer := 0;
  v_expires_at timestamptz(3);
  v_reservation_id uuid;
begin
  perform public.cleanup_expired_reservations();

  if char_length(v_session_id) < 8 or char_length(v_session_id) > 128 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_SESSION',
      'message', 'Sesi keranjang tidak valid.',
      'product_id', v_product_id
    );
  end if;

  if v_product_id = '' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PRODUCT',
      'message', 'ID produk tidak valid.',
      'product_id', v_product_id
    );
  end if;

  if coalesce(p_qty, 0) <= 0 then
    update public.cart_reservations
    set
      status = 'released',
      updated_at = now()
    where session_id = v_session_id
      and product_id = v_product_id
      and status = 'held';

    return jsonb_build_object(
      'ok', true,
      'released', true,
      'product_id', v_product_id
    );
  end if;

  select *
  into v_product
  from public.products
  where id = v_product_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Produk tidak ditemukan.',
      'product_id', v_product_id,
      'available_stock', 0
    );
  end if;

  if v_product.status <> 'ready' or v_product.stock <= 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'OUT_OF_STOCK',
      'message', 'Stok produk tidak tersedia.',
      'product_id', v_product_id,
      'available_stock', 0
    );
  end if;

  select coalesce(sum(cr.quantity), 0)::integer
  into v_other_cart_held
  from public.cart_reservations cr
  where cr.product_id = v_product_id
    and cr.status = 'held'
    and cr.expires_at > now()
    and cr.session_id <> v_session_id;

  select coalesce(sum(oi.quantity), 0)::integer
  into v_pending_order_held
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where oi.product_id = v_product_id
    and o.stock_deducted = false
    and o.status in ('pending_approval', 'payment_review');

  v_available := greatest(0, v_product.stock - v_other_cart_held - v_pending_order_held);

  if p_qty > v_available then
    return jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_STOCK',
      'message', case
        when v_available = 0 then 'Stok sedang dipesan pengunjung lain. Cek lagi beberapa menit lagi.'
        else format('Stok tersedia tersisa %s unit.', v_available)
      end,
      'product_id', v_product_id,
      'available_stock', v_available
    );
  end if;

  v_expires_at := now() + make_interval(mins => v_ttl);

  select cr.id
  into v_reservation_id
  from public.cart_reservations cr
  where cr.session_id = v_session_id
    and cr.product_id = v_product_id
    and cr.status = 'held'
  for update;

  if found then
    update public.cart_reservations
    set
      quantity = p_qty,
      expires_at = v_expires_at,
      updated_at = now()
    where id = v_reservation_id;
  else
    insert into public.cart_reservations (
      session_id,
      product_id,
      quantity,
      status,
      expires_at
    ) values (
      v_session_id,
      v_product_id,
      p_qty,
      'held',
      v_expires_at
    )
    returning id into v_reservation_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id,
    'product_id', v_product_id,
    'quantity', p_qty,
    'expires_at', v_expires_at,
    'available_stock', v_available
  );
end;
$$;

-- RPC 3: create_order_from_cart()
create or replace function public.create_order_from_cart(
  p_session_id text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_method text,
  p_payment_method text,
  p_payment_unique_code integer default 0,
  p_payment_proof_url text default null,
  p_destination_address text default '',
  p_destination_lat double precision default null,
  p_destination_lng double precision default null,
  p_distance_km numeric default 0,
  p_shipping_fee integer default 0,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id text := btrim(coalesce(p_session_id, ''));
  v_customer_name text := btrim(coalesce(p_customer_name, ''));
  v_customer_phone text := btrim(coalesce(p_customer_phone, ''));
  v_delivery_method text := btrim(coalesce(p_delivery_method, ''));
  v_payment_method text := btrim(coalesce(p_payment_method, ''));
  v_proof_url text := nullif(btrim(coalesce(p_payment_proof_url, '')), '');
  v_address text := btrim(coalesce(p_destination_address, ''));
  v_notes text := btrim(coalesce(p_notes, ''));
  v_distance_km numeric(6,2) := greatest(0, coalesce(p_distance_km, 0));
  v_shipping_fee integer := 0;
  v_unique_code integer := 0;
  v_subtotal integer := 0;
  v_total_amount integer := 0;
  v_initial_status text := 'pending_approval';
  v_item_count integer := 0;
  v_row record;
  v_other_cart_held integer := 0;
  v_pending_order_held integer := 0;
  v_available integer := 0;
  v_order_id uuid;
  v_order_code text;
  v_date_part text;
  v_attempt integer := 0;
begin
  perform public.cleanup_expired_reservations();

  if char_length(v_session_id) < 8 or char_length(v_session_id) > 128 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_SESSION',
      'message', 'Sesi keranjang tidak valid.'
    );
  end if;

  if v_customer_name = '' or v_customer_phone = '' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_CUSTOMER',
      'message', 'Nama dan nomor WhatsApp pembeli wajib diisi.'
    );
  end if;

  if v_delivery_method not in ('cod', 'pickup') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_DELIVERY',
      'message', 'Metode pengiriman tidak valid.'
    );
  end if;

  if v_payment_method not in ('qris', 'dana', 'cod') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYMENT',
      'message', 'Metode pembayaran tidak valid.'
    );
  end if;

  if coalesce(p_shipping_fee, 0) < 0 or coalesce(p_distance_km, 0) < 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_SHIPPING',
      'message', 'Jarak dan ongkos kirim tidak valid.'
    );
  end if;

  for v_row in
    select
      cr.id as reservation_id,
      cr.product_id,
      cr.quantity,
      p.name as product_name,
      p.price as unit_price,
      p.stock as product_stock,
      p.status as product_status,
      p.image_url,
      p.warranty
    from public.cart_reservations cr
    join public.products p on p.id = cr.product_id
    where cr.session_id = v_session_id
      and cr.status = 'held'
      and cr.expires_at > now()
    order by p.id asc
    for update of p, cr
  loop
    v_item_count := v_item_count + 1;

    if v_row.product_status <> 'ready' or v_row.product_stock <= 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'OUT_OF_STOCK',
        'product_id', v_row.product_id,
        'message', format('Produk "%s" sudah tidak tersedia.', v_row.product_name)
      );
    end if;

    select coalesce(sum(cr2.quantity), 0)::integer
    into v_other_cart_held
    from public.cart_reservations cr2
    where cr2.product_id = v_row.product_id
      and cr2.status = 'held'
      and cr2.expires_at > now()
      and cr2.session_id <> v_session_id;

    select coalesce(sum(oi.quantity), 0)::integer
    into v_pending_order_held
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = v_row.product_id
      and o.stock_deducted = false
      and o.status in ('pending_approval', 'payment_review');

    v_available := greatest(0, v_row.product_stock - v_other_cart_held - v_pending_order_held);

    if v_row.quantity > v_available then
      return jsonb_build_object(
        'ok', false,
        'code', 'INSUFFICIENT_STOCK',
        'product_id', v_row.product_id,
        'message', format('Stok "%s" tidak mencukupi (tersedia %s unit).', v_row.product_name, v_available)
      );
    end if;

    v_subtotal := v_subtotal + (v_row.unit_price * v_row.quantity);
  end loop;

  if v_item_count = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'CART_EMPTY_OR_EXPIRED',
      'message', 'Keranjang kosong atau masa reservasi 15 menit sudah habis.'
    );
  end if;

  v_shipping_fee := case
    when v_delivery_method = 'pickup' then 0
    else greatest(0, coalesce(p_shipping_fee, 0))
  end;

  v_unique_code := case
    when v_payment_method = 'cod' then 0
    else greatest(0, least(999, coalesce(p_payment_unique_code, 0)))
  end;

  v_total_amount := v_subtotal + v_shipping_fee + v_unique_code;

  v_initial_status := case
    when v_payment_method in ('qris', 'dana') and v_proof_url is not null then 'payment_review'
    else 'pending_approval'
  end;

  v_date_part := to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD');

  loop
    v_attempt := v_attempt + 1;
    v_order_code := format(
      'FC-%s-%s',
      v_date_part,
      upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4))
    );

    exit when not exists (
      select 1 from public.orders o where o.order_code = v_order_code
    );

    if v_attempt >= 10 then
      raise exception 'Gagal membuat kode pesanan unik.';
    end if;
  end loop;

  insert into public.orders (
    order_code,
    session_id,
    customer_name,
    customer_phone,
    delivery_method,
    payment_method,
    payment_unique_code,
    payment_proof_url,
    destination_address,
    destination_lat,
    destination_lng,
    distance_km,
    shipping_fee,
    subtotal,
    total_amount,
    notes,
    status,
    stock_deducted
  ) values (
    v_order_code,
    v_session_id,
    v_customer_name,
    v_customer_phone,
    v_delivery_method,
    v_payment_method,
    v_unique_code,
    v_proof_url,
    v_address,
    p_destination_lat,
    p_destination_lng,
    v_distance_km,
    v_shipping_fee,
    v_subtotal,
    v_total_amount,
    v_notes,
    v_initial_status,
    false
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id,
    product_id,
    product_name,
    product_image,
    unit_price,
    quantity,
    warranty_days
  )
  select
    v_order_id,
    p.id,
    p.name,
    p.image_url,
    p.price,
    cr.quantity,
    case
      when p.warranty is not null
        and coalesce(p.warranty->>'active', '') = 'true'
        and coalesce(p.warranty->>'durationDays', '') ~ '^[0-9]+$'
      then (p.warranty->>'durationDays')::integer
      else 0
    end
  from public.cart_reservations cr
  join public.products p on p.id = cr.product_id
  where cr.session_id = v_session_id
    and cr.status = 'held'
    and cr.expires_at > now()
  order by p.id asc;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    note
  ) values (
    v_order_id,
    null,
    v_initial_status,
    'customer',
    case
      when v_initial_status = 'payment_review' then 'Pesanan dibuat dengan bukti pembayaran.'
      else 'Pesanan dibuat dan menunggu konfirmasi admin.'
    end
  );

  update public.cart_reservations
  set
    status = 'converted',
    updated_at = now()
  where session_id = v_session_id
    and status = 'held';

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'status', v_initial_status,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'payment_unique_code', v_unique_code,
    'total_amount', v_total_amount
  );
end;
$$;

-- RPC 4: admin_transition_order()
create or replace function public.admin_transition_order(
  p_order_id uuid,
  p_next_status text,
  p_admin_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_next_status text := btrim(coalesce(p_next_status, ''));
  v_note text := btrim(coalesce(p_admin_note, ''));
  v_transition_allowed boolean := false;
  v_stock_deducted boolean;
  v_item record;
  v_product public.products%rowtype;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_FOUND',
      'message', 'Pesanan tidak ditemukan.'
    );
  end if;

  if v_order.status = v_next_status then
    return jsonb_build_object(
      'ok', true,
      'unchanged', true,
      'order_id', v_order.id,
      'order_code', v_order.order_code,
      'from_status', v_order.status,
      'to_status', v_next_status,
      'stock_deducted', v_order.stock_deducted
    );
  end if;

  v_transition_allowed := case v_order.status
    when 'pending_approval' then v_next_status in ('payment_review', 'approved', 'rejected', 'cancelled', 'expired')
    when 'payment_review' then v_next_status in ('approved', 'rejected', 'cancelled', 'expired')
    when 'approved' then v_next_status in ('out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled')
    when 'out_for_delivery' then v_next_status in ('completed', 'cancelled')
    when 'ready_for_pickup' then v_next_status in ('completed', 'cancelled')
    else false
  end;

  if not v_transition_allowed then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_TRANSITION',
      'message', format('Transisi status dari "%s" ke "%s" tidak diizinkan.', v_order.status, v_next_status)
    );
  end if;

  if v_next_status in ('rejected', 'cancelled') and v_note = '' then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOTE_REQUIRED',
      'message', 'Alasan penolakan atau pembatalan wajib diisi.'
    );
  end if;

  v_stock_deducted := v_order.stock_deducted;

  -- Konsumsi stok secara atomik (hanya sekali, idempoten lewat flag stock_deducted)
  if v_next_status in ('approved', 'out_for_delivery', 'ready_for_pickup', 'completed')
     and not v_stock_deducted then

    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as qty
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_id is not null
      group by oi.product_id
      order by oi.product_id asc
    loop
      select *
      into v_product
      from public.products
      where id = v_item.product_id
      for update;

      if not found then
        return jsonb_build_object(
          'ok', false,
          'code', 'PRODUCT_NOT_FOUND',
          'message', 'Salah satu produk pada pesanan tidak lagi tersedia di katalog.'
        );
      end if;

      if v_product.stock < v_item.qty then
        return jsonb_build_object(
          'ok', false,
          'code', 'INSUFFICIENT_STOCK',
          'message', format('Stok "%s" tidak mencukupi untuk disetujui (tersisa %s unit).', v_product.name, v_product.stock)
        );
      end if;
    end loop;

    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as qty
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_id is not null
      group by oi.product_id
      order by oi.product_id asc
    loop
      update public.products
      set
        stock = stock - v_item.qty,
        status = case when stock - v_item.qty <= 0 then 'sold-out' else status end,
        updated_at = now()
      where id = v_item.product_id;
    end loop;

    v_stock_deducted := true;
  end if;

  -- Pengembalian stok jika order yang sudah dipotong stoknya dibatalkan / ditolak / expired
  if v_next_status in ('rejected', 'cancelled', 'expired')
     and v_stock_deducted then

    for v_item in
      select oi.product_id, sum(oi.quantity)::integer as qty
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_id is not null
      group by oi.product_id
      order by oi.product_id asc
    loop
      update public.products
      set
        stock = stock + v_item.qty,
        status = case when status = 'sold-out' and stock + v_item.qty > 0 then 'ready' else status end,
        updated_at = now()
      where id = v_item.product_id;
    end loop;

    v_stock_deducted := false;
  end if;

  update public.orders
  set
    status = v_next_status,
    stock_deducted = v_stock_deducted,
    admin_notes = case when v_note <> '' then v_note else admin_notes end,
    approved_at = case
      when v_next_status = 'approved' and approved_at is null then now()
      else approved_at
    end,
    completed_at = case
      when v_next_status = 'completed' and completed_at is null then now()
      else completed_at
    end,
    updated_at = now()
  where id = v_order.id;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    note
  ) values (
    v_order.id,
    v_order.status,
    v_next_status,
    'admin',
    v_note
  );

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'order_code', v_order.order_code,
    'from_status', v_order.status,
    'to_status', v_next_status,
    'stock_deducted', v_stock_deducted
  );
end;
$$;

-- RPC 5: get_products_availability()
create or replace function public.get_products_availability(
  p_session_id text default null
)
returns table (
  product_id text,
  total_stock integer,
  reserved_by_others integer,
  reserved_by_self integer,
  pending_order_qty integer,
  available_stock integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with active_carts as (
    select
      cr.product_id,
      coalesce(sum(case when p_session_id is not null and cr.session_id = p_session_id then cr.quantity else 0 end), 0)::integer as reserved_by_self,
      coalesce(sum(case when p_session_id is null or cr.session_id <> p_session_id then cr.quantity else 0 end), 0)::integer as reserved_by_others
    from public.cart_reservations cr
    where cr.status = 'held'
      and cr.expires_at > now()
    group by cr.product_id
  ),
  pending_orders as (
    select
      oi.product_id,
      coalesce(sum(oi.quantity), 0)::integer as pending_order_qty
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id is not null
      and o.stock_deducted = false
      and o.status in ('pending_approval', 'payment_review')
    group by oi.product_id
  )
  select
    p.id as product_id,
    p.stock as total_stock,
    coalesce(ac.reserved_by_others, 0)::integer as reserved_by_others,
    coalesce(ac.reserved_by_self, 0)::integer as reserved_by_self,
    coalesce(po.pending_order_qty, 0)::integer as pending_order_qty,
    case
      when p.status <> 'ready' then 0
      else greatest(0, p.stock - coalesce(ac.reserved_by_others, 0) - coalesce(po.pending_order_qty, 0))
    end::integer as available_stock
  from public.products p
  left join active_carts ac on ac.product_id = p.id
  left join pending_orders po on po.product_id = p.id;
$$;

-- Least-privilege: hanya service_role yang boleh memanggil RPC OMS
revoke all on function public.cleanup_expired_reservations() from public, anon, authenticated;
grant execute on function public.cleanup_expired_reservations() to service_role;

revoke all on function public.reserve_cart_item(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_cart_item(text, text, integer, integer) to service_role;

revoke all on function public.create_order_from_cart(text, text, text, text, text, integer, text, text, double precision, double precision, numeric, integer, text) from public, anon, authenticated;
grant execute on function public.create_order_from_cart(text, text, text, text, text, integer, text, text, double precision, double precision, numeric, integer, text) to service_role;

revoke all on function public.admin_transition_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_transition_order(uuid, text, text) to service_role;

revoke all on function public.get_products_availability(text) from public, anon, authenticated;
grant execute on function public.get_products_availability(text) to service_role;

-- =============================================================================
-- PENGATURAN PEMBAYARAN & KOORDINAT TOKO DINAMIS (EDITABLE DARI /admin)
-- =============================================================================

create table if not exists public.store_settings (
  id text primary key default 'default' check (id = 'default'),
  qris_image_url text not null default '/images/qris-konter-fajar-cell.svg',
  dana_number varchar(24) not null default '085156069234',
  dana_account_name varchar(120) not null default 'Konter Fajar Cell',
  store_lat double precision not null default -7.3679 check (store_lat between -90 and 90),
  store_lng double precision not null default 109.6836 check (store_lng between -180 and 180),
  updated_at timestamptz(3) not null default now()
);

alter table public.store_settings enable row level security;
revoke all on table public.store_settings from anon, authenticated;
grant select on table public.store_settings to anon, authenticated;

drop policy if exists "Public read store settings" on public.store_settings;
create policy "Public read store settings"
  on public.store_settings
  for select
  to anon, authenticated
  using (id = 'default');

insert into public.store_settings (id)
values ('default')
on conflict (id) do nothing;
