# Konter Fajar Cell

Website jual beli HP baru/bekas, aksesoris, dan layanan tukar tambah untuk **Konter Fajar Cell**. Proyek dibuat untuk kebutuhan demonstrasi **PAS** dengan dua peran: halaman pembeli dan dashboard admin.

**Status:** halaman pembeli dan dashboard admin selesai. Data produk tersimpan di **Supabase (PostgreSQL)** dan diakses lewat API Route Next.js. Browser tidak pernah memegang kunci database. Login admin memakai cookie sesi HttpOnly yang ditandatangani server. UI pembeli tetap mendukung quick view, pencarian/sortir katalog, toast feedback, animasi scroll, dan highlight navigasi aktif.

## Akses Cepat (Demo PAS)

| Kebutuhan | Nilai |
| --- | --- |
| Halaman pembeli | <http://localhost:3000/> |
| Dashboard admin | <http://localhost:3000/admin> |
| **PIN Login Admin** | **`123456`** |
| Database | Supabase PostgreSQL, tabel `public.products` |
| Data awal | 15 produk contoh di `schema.sql` / `src/data/products.json` |

> PIN default dapat diubah lewat `ADMIN_PIN` di `.env.local`. Variabel ini **hanya dibaca di server** dan tidak ikut dikirim ke browser. Tanpa file env, PIN tetap **`123456`**.

## Cara Menjalankan Proyek (Supabase)

Prasyarat: **Node.js 20.9+**, npm, dan akun **Supabase** (free tier cukup).

1. **Buat proyek Supabase** di <https://supabase.com/dashboard>. Pilih region terdekat (mis. Singapore) agar latensi dari Indonesia rendah.

2. **Buat tabel dan seed**:
   - Buka **SQL Editor** → **New query**.
   - Tempel seluruh isi [`schema.sql`](schema.sql), lalu klik **Run**.
   - Skema membuat tabel `public.products`, index, mengaktifkan RLS, dan mengisi 15 produk awal. Seed memakai `on conflict (id) do nothing`, jadi aman dijalankan ulang.
   - Verifikasi:

     ```sql
     select category, count(*) from public.products group by category;
     ```

     Hasil yang diharapkan: 8 HP bekas, 3 HP baru, 4 aksesoris.

3. **Ambil kredensial** dari **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.
   - **Service role key** (atau secret key `sb_secret_...` pada dashboard baru) → `SUPABASE_SERVICE_ROLE_KEY`.
   - Jangan memakai anon/publishable key untuk aplikasi ini; API Route membutuhkan akses tulis.

4. **Isi environment**:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=service-role-key-dari-dashboard
   ```

   > `SUPABASE_SERVICE_ROLE_KEY` **hanya untuk server**. Jangan menambahkan prefix `NEXT_PUBLIC_`, jangan menaruhnya di kode client, dan jangan commit `.env.local`.

5. **Install dependency dan jalankan**:

   ```bash
   npm install
   npm run dev
   ```

6. Buka <http://localhost:3000> untuk halaman pembeli, lalu <http://localhost:3000/admin> dan masuk dengan PIN **`123456`**.

> Tanpa kredensial Supabase, halaman pembeli tetap menampilkan 15 data seed dari JSON, tetapi dashboard admin menampilkan error koneksi dan CRUD tidak dapat dipakai. Isi `.env.local` lalu restart `npm run dev`.

## Deploy ke Vercel

1. Push proyek ke repository Git (GitHub/GitLab), lalu import ke **Vercel**.
2. Tambahkan environment variables di **Project Settings → Environment Variables** untuk **Production**, **Preview**, dan **Development**:

   | Variabel | Contoh / catatan |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role/secret key Supabase (server-only) |
   | `ADMIN_PIN` | ganti dengan PIN kuat, bukan `123456` |
   | `ADMIN_SESSION_SECRET` | hasil `openssl rand -hex 32` |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `628...` tanpa `+` dan spasi |
   | `NEXT_PUBLIC_SITE_URL` | URL produksi, mis. `https://konter-fajar-cell.vercel.app` |

3. Deploy ulang setelah menambah/mengubah environment variables. Nilai `NEXT_PUBLIC_*` dibaca saat build, jadi perubahan baru berlaku setelah redeploy.
4. Tidak ada konfigurasi redirect/auth Supabase yang diperlukan karena aplikasi tidak memakai Supabase Auth di browser.
5. Pastikan proyek Supabase tidak sedang **paused** sebelum demo. Free tier dapat mem-pause proyek setelah lama tidak aktif; buka dashboard Supabase untuk membangunkan kembali.

### Catatan InfinityFree

**InfinityFree tidak dapat menjalankan Next.js** karena hanya mendukung PHP dan MySQL. Dengan migrasi ini, aplikasi membutuhkan hosting Node.js (Vercel/Railway/Render/VPS) dan database Supabase. InfinityFree tidak lagi dipakai.

## Tech Stack

- **Next.js 16** (App Router, Route Handlers) + **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** (`@tailwindcss/postcss`, token desain di `src/app/globals.css`)
- **Lucide React** untuk ikon
- **Supabase** (`@supabase/supabase-js`) + PostgreSQL, kolom `jsonb` untuk detail produk
- **Cookie sesi HttpOnly** + HMAC-SHA256 untuk login admin

### Script

| Perintah            | Fungsi                        |
| ------------------- | ----------------------------- |
| `npm run dev`       | Jalankan development server   |
| `npm run build`     | Build produksi                |
| `npm run start`     | Jalankan hasil build          |
| `npm run lint`      | ESLint                        |
| `npm run typecheck` | Cek tipe tanpa emit (`tsc`)   |

## Fitur Halaman Pembeli

- **Navbar sticky** + top bar kontak, menu mobile (buka/tutup, tutup dengan `Esc`, scroll terkunci saat menu terbuka), tombol Chat Admin WA dan Login Admin.
- **Hero** dengan headline promo, badge kepercayaan, CTA katalog/WhatsApp, dan kartu unit unggulan.
- **Quick view modal** berisi foto, harga, diskon, stok, prosesor, RAM/penyimpanan, layar, kamera, baterai, kelengkapan, kondisi, warna, dan garansi.
- **Katalog HP bekas** dengan pencarian, filter merek, sortir harga/terbaru, badge **Ready Stock / Sold Out**, harga/diskon, dan tombol tanya via WhatsApp.
- **Katalog aksesoris** dan **HP baru** dengan pencarian, sortir, stok, serta status.
- **Form tukar tambah** dengan validasi yang membuka WhatsApp berisi ringkasan data ter-encode.
- **Lokasi toko**: alamat, jam operasional, area COD, dan Google Maps embed.
- **Toast feedback**, animasi masuk viewport, dan `prefers-reduced-motion`.
- 100% responsif; tanpa horizontal overflow pada pengujian lebar 320–1440 px.

## Fitur Dashboard Admin

- **Login PIN** lewat `POST /api/admin/login`; PIN diverifikasi di server dan sesi disimpan sebagai cookie HttpOnly, bukan LocalStorage.
- **Statistik stok**: total produk, unit Ready, unit Sold Out, dan nilai stok berstatus Ready.
- **CRUD produk**: tambah, baca, edit, hapus, dan ubah status satu klik. Semua operasi memanggil API Supabase dan menampilkan status pending serta pesan error.
- **Form dinamis per kategori** (HP bekas, HP baru, aksesoris) dengan validasi client dan server.
- **Foto fleksibel**: path lokal `/images/products/...` atau **URL eksternal** `http(s)`, lengkap dengan *live preview* dan indikator gagal muat.
- **Pencarian & filter** berdasarkan nama/merek/slug, kategori, dan status.
- **Reset data** mengembalikan 15 produk contoh. Seed di-upsert lebih dulu, lalu produk di luar daftar seed dihapus, sehingga kegagalan di tengah proses tidak mengosongkan katalog.
- **Sinkronisasi**: perubahan disiarkan ke tab lain lewat `BroadcastChannel`, resync saat fokus/online/visibility, dan polling ringan 60 detik saat halaman terlihat.
- **Fallback aman**: jika database/API belum merespons, pembeli tetap melihat data seed untuk HTML awal dan dashboard menampilkan banner error dengan tombol coba lagi.

## API

Semua response memakai `Cache-Control: no-store`. Operasi tulis wajib memiliki cookie sesi admin; tanpa sesi, API mengembalikan `401`.

| Method | Endpoint | Akses | Fungsi |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Publik | Daftar seluruh produk |
| `GET` | `/api/products/[id]` | Publik | Detail satu produk |
| `POST` | `/api/products` | Admin | Tambah produk |
| `PUT` | `/api/products/[id]` | Admin | Update penuh produk |
| `PATCH` | `/api/products/[id]` | Admin | Update cepat `price`, `stock`, `status` |
| `DELETE` | `/api/products/[id]` | Admin | Hapus produk |
| `POST` | `/api/products/reset` | Admin | Reset ke 15 produk seed |
| `POST` | `/api/admin/login` | Publik | Verifikasi PIN, set cookie sesi |
| `GET` | `/api/admin/login` | Publik | Cek status sesi saat ini |
| `DELETE` | `/api/admin/login` | Admin | Logout dan hapus cookie |

Contoh request:

```bash
curl http://localhost:3000/api/products

curl -c cookies.txt -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"pin\":\"123456\"}"

curl -b cookies.txt -X PATCH http://localhost:3000/api/products/hp-bekas-001 \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"sold-out\",\"stock\":0}"
```

### Keamanan

- PIN hanya ada di server (`ADMIN_PIN`), tidak memakai prefix `NEXT_PUBLIC_`.
- Perbandingan PIN memakai SHA-256 + `crypto.timingSafeEqual`.
- Rate limit login 8 percobaan per 60 detik per IP; body dibatasi 1 KB.
- Cookie `kfc_admin_session` bersifat `HttpOnly`, `SameSite=Lax`, `Secure` di produksi, berlaku 12 jam, dan ditandatangani HMAC-SHA256 dengan `ADMIN_SESSION_SECRET`.
- Payload produk divalidasi ulang di server (batas ukuran, tipe, kategori, harga, stok, status, dan sumber gambar).
- **RLS aktif** di tabel `products` tanpa policy publik. Semua akses data melewati API Route memakai service role key di server; browser tidak bisa membaca/menulis tabel langsung.
- `src/lib/supabase.ts` memakai `import "server-only"` agar build gagal bila modul tersebut tidak sengaja diimpor Client Component.
- Service role key melewati RLS. Jika key bocor, seluruh data dapat diakses; ganti key dan audit log Supabase bila terjadi kebocoran.
- Ganti `ADMIN_PIN` dan `ADMIN_SESSION_SECRET` sebelum deployment publik.

## Struktur Folder

```
konter-fajar-cell/
├─ schema.sql                    # Skema + seed 15 produk untuk Supabase
├─ public/images/products/       # Foto placeholder produk
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout + font + ToastProvider
│  │  ├─ page.tsx                # Halaman pembeli + QuickViewProvider
│  │  ├─ admin/page.tsx          # Rute /admin
│  │  ├─ globals.css             # Tailwind v4 + token desain
│  │  └─ api/
│  │     ├─ admin/login/         # Login, cek sesi, logout
│  │     └─ products/            # CRUD + reset produk
│  ├─ components/
│  │  ├─ admin/                  # Login, dashboard, tabel, form, konfirmasi
│  │  ├─ catalog/                # QuickView
│  │  ├─ layout/                 # Navbar, Footer, floating WhatsApp
│  │  ├─ sections/               # Hero, katalog, tukar tambah, lokasi
│  │  └─ ui/                     # Modal, toast, card, controls
│  ├─ data/
│  │  ├─ products.json           # Seed untuk SSR/fallback
│  │  └─ store.json              # Profil toko
│  ├─ hooks/
│  │  ├─ use-admin-session.ts    # Sesi cookie via API
│  │  └─ use-products.ts         # State produk reaktif
│  ├─ lib/
│  │  ├─ admin-auth.ts           # PIN, token sesi, cookie
│  │  ├─ api-response.ts         # Helper JSON + parser body
│  │  ├─ supabase.ts             # Client Supabase server-only
│  │  ├─ products-db.ts          # Query + mapping Product
│  │  ├─ product-input.ts        # Validasi payload API
│  │  ├─ product-repository.ts   # Client fetch + store + sinkronisasi
│  │  ├─ product-form.ts         # Default, validasi, konversi form
│  │  ├─ product-images.ts       # Validasi path/URL gambar
│  │  ├─ products.ts             # Type guard + akses seed
│  │  └─ utils.ts                # cn(), rupiah, slug, tanggal
│  └─ types/                     # Product union, form, admin, store
├─ .env.example
├─ next.config.ts
└─ tsconfig.json
```

## Model Data dan Skema

`Product` adalah discriminated union berdasarkan `category`:

```ts
type Product = UsedPhoneProduct | NewPhoneProduct | AccessoryProduct;
```

Tabel `public.products` menyimpan kolom inti (`id`, `name`, `slug`, `category`, `brand`, `price`, `original_price`, `stock`, `status`, `image_url`) dan kolom detail:

- `images`, `compatible_with`: `jsonb` array.
- `condition`: `jsonb` `{ grade, label, minusCount, completeness, batteryHealth? }`.
- `warranty`: `jsonb` `{ active, durationDays, description }`.
- `specs`: `jsonb` `{ ram, storage, chipset?, screen?, camera?, battery? }`.
- `description`, `featured`, `color`, `trade_in_eligible`, `accessory_type`.
- `created_at`, `updated_at` (`timestamptz(3)`).

Slug dibuat unik oleh server (menambahkan `-2`, `-3`, dst. bila bentrok). Harga berupa Rupiah tanpa desimal. Supabase/PostgREST tidak menyediakan transaksi lintas request dari client JS, jadi reset memakai urutan aman: upsert seed → hapus produk tambahan.

## Alur Data

```
schema.sql ──► Supabase PostgreSQL (public.products)
                          ▲
                          │ service role key (server-only)
                          │
                 API Route /api/products
                          ▲
                          │ fetch
                          │
                  product-repository
                          │
                          ▼
               useProducts() / useProductsState()
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
     Halaman pembeli              Dashboard admin
            ▲                           │
            │                           ▼
   BroadcastChannel / focus /   POST/PUT/PATCH/DELETE
   online / polling 60 detik          │
            └────────── API ◄──────────┘
```

- Server merender 15 produk seed dari JSON agar HTML awal dan SEO langsung terisi.
- Setelah hydration, klien mengambil data terbaru dari `/api/products`.
- Mutasi admin menulis ke Supabase lewat API, memperbarui snapshot lokal, lalu menyiarkan sinyal ke tab lain.
- Tab lain resync lewat `BroadcastChannel`, saat fokus/online/visibility berubah, dan polling 60 detik selama halaman terlihat.
- Tidak ada data produk atau sesi login di LocalStorage.

## Konfigurasi Environment

```env
# Publik (boleh diketahui; aplikasi ini memakai URL di server)
NEXT_PUBLIC_WHATSAPP_NUMBER=6281234567890
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Server-only
ADMIN_PIN=123456
ADMIN_SESSION_SECRET=ganti-dengan-secret-acak-minimal-32-karakter
SUPABASE_SERVICE_ROLE_KEY=service-role-key-dari-dashboard
```

Restart `npm run dev` setelah mengubah `.env.local`. Build produksi tidak memerlukan kredensial karena Route Handler dibuat dinamis dan client Supabase dibuat saat request pertama. Tanpa env Supabase, API mengembalikan `500` dengan pesan generik; detail konfigurasi yang kurang terlihat di log server.

## Catatan

- **Gambar adalah placeholder** di `public/images/products/`. Ganti dengan foto asli memakai nama file yang sama, sesuaikan path, atau isi URL eksternal lewat form admin.
- URL gambar eksternal harus direct link `http(s)`. Gambar dirender dengan `<img>` native (bukan optimizer `next/image`) dan `referrerPolicy="no-referrer"`, sehingga tidak perlu `remotePatterns`; host yang melarang hotlink dapat membuat pratinjau gagal.
- Database yang mati tidak membuat halaman pembeli blank: data seed tetap tampil. Dashboard menampilkan banner error dan aksi **Coba lagi**.
- Nomor WhatsApp untuk link diambil dari `NEXT_PUBLIC_WHATSAPP_NUMBER`; sesuaikan juga `whatsappNumber` dan `displayPhone` di `src/data/store.json`.
- Reset data tidak menghapus sesi login.
- Untuk produksi, gunakan HTTPS agar cookie `Secure` aktif. Jangan pernah menaruh service role key di repository publik.
- Proyek Supabase free tier dapat di-pause setelah lama tidak aktif. Data tetap tersimpan; buka dashboard Supabase sebelum demo.

## Hasil Audit

Audit terakhir: **21 Oktober 2026**.

| Pemeriksaan | Hasil |
| --- | --- |
| TypeScript strict (`npm run typecheck`) | Lolos, tanpa error |
| ESLint (`npm run lint`) | Lolos, tanpa warning/error |
| Production build (`npm run build`) | Lolos; `/`, `/admin`, `/api/admin/login`, `/api/products`, `/api/products/[id]`, `/api/products/reset` terbentuk |
| Dependency produksi (`npm audit --omit=dev`) | 0 vulnerability |
| Dependency dev (`npm audit`) | 5 high pada rantai `eslint-config-next` → `fast-glob` → `micromatch` → `braces`; belum diperbaiki karena `npm audit fix --force` menurunkan `eslint-config-next` ke 14.2.35 (breaking). Tidak masuk bundle produksi. |
| SQL seed | 15 produk (8 HP bekas, 3 HP baru, 4 aksesoris) digenerate dari `src/data/products.json`; skema dan seed dijalankan di PostgreSQL in-memory (pg-mem) dan menghasilkan 15 baris |
| Uji integrasi Supabase | 21 request terhadap mock PostgREST lolos: reset, list, create, slug unik, update, patch stok/status, get, delete, dan reset ulang |
| Uji live Supabase | `GET /api/products` ke proyek Supabase berhasil: 15 produk (8 HP bekas, 3 HP baru, 4 aksesoris) dengan mapping JSONB benar. Uji tulis live tidak dijalankan agar data demo tidak berubah; alur tulis diuji lewat mock PostgREST. |
| Otorisasi | POST/PUT/PATCH/DELETE tanpa cookie → `401` (diuji dengan API lokal) |

## Troubleshooting

**`Konfigurasi Supabase belum lengkap`** — isi `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di `.env.local`, lalu restart `npm run dev`.

**`relation "public.products" does not exist`** — `schema.sql` belum dijalankan di SQL Editor proyek Supabase yang benar.

**`new row violates check constraint`** — nilai `category`, `status`, atau `accessory_type` tidak sesuai skema. Periksa payload form/API.

**`duplicate key value violates unique constraint "products_slug_key"`** — slug bentrok. Server biasanya menambahkan `-2`/`-3`; bila terjadi saat reset, hapus produk yang memakai slug seed terlebih dahulu.

**`permission denied for table products`** — pastikan API memakai **service role key**, bukan anon/publishable key, dan key berasal dari proyek yang sama dengan URL.

**`Invalid API key` / `JWT expired`** — service role key salah atau sudah dirotasi di dashboard Supabase. Salin ulang lalu restart/redeploy.

**API mengembalikan 500 tetapi data seed masih tampil** — halaman pembeli memakai fallback SSR; periksa log server Next.js untuk pesan Supabase yang sebenarnya.

**Proyek Supabase paused** — buka dashboard Supabase untuk membangunkan proyek. Setelah aktif, refresh halaman.

**Perubahan `.env.local` tidak terbaca** — hentikan lalu jalankan ulang `npm run dev`.

**Port 3000 dipakai proses lain** — hentikan proses tersebut atau jalankan `npm run dev -- -p 3001`.

**PowerShell menolak `npm`** — gunakan `npm.cmd install` / `npm.cmd run dev`, atau izinkan script lokal dengan `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Tahap Selanjutnya

1. Halaman detail produk (`/katalog/[kategori]/[slug]`).
2. Pengaturan kontak toko di database (saat ini masih dari `src/data/store.json`).
3. Upload file foto langsung dari admin ke **Supabase Storage**.
4. Multi-user admin dengan Supabase Auth, peran, dan audit log.
5. Pagination/limit katalog saat jumlah produk bertambah besar.
