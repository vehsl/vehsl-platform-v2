# Vehsl Platform v2

Next.js 15 (App Router) frontend + Django REST backend + Postgres, orchestrated via Docker Compose.

## Structure

```
vehsl-platform-v2/
├── docker-compose.yml          # orchestrates frontend + backend
├── .env.example
├── frontend/                   # Next.js 15, TypeScript, Tailwind v4, shadcn/ui
│   ├── Dockerfile
│   └── src/
│       ├── app/                # App Router routes (signup, products, orders, admin, /)
│       ├── components/ui/      # shadcn primitives
│       ├── lib/                # utils, api client
│       ├── hooks/
│       ├── styles/             # tailwind, theme, fonts
│       └── types/
├── backend/                    # Django + DRF
│   ├── Dockerfile
│   ├── manage.py
│   ├── config/                 # settings/urls/wsgi
│   └── apps/                   # accounts, catalog, orders, payments, inventory
└── _legacy/                    # original React + Vite modules (reference only)
```

## Local development

```bash
cp .env.example .env
docker compose up --build
```

## Docker

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/

### Dev admin user (auto-created)
- Email: `admin@vehsl.local`
- Password: `admin`
- Override via `.env`: `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`

Do not use these credentials in production.

## Seed catalog data (categories + products)

Use this to populate the database with categories/subcategories (matching the Explore UI) and products (with variations, pricing tiers, shipping fields, images, and docs) so you can test buyer/seller/admin flows.

### Run (Docker)

```bash
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py seed_catalog --reset --with-kyc
```

### Seed with specific buyer/seller emails

```bash
docker compose run --rm backend python manage.py seed_catalog --reset --with-kyc --buyer-email buyer@vehsl.local --seller-email seller@vehsl.local
```

### Remove seeded products (cleanup)

Use this if you want to remove all products created by the seed script from the buyer side (SKUs starting with `SEED-`). It also removes those products from buyer cart/wishlist so there are no stale items.

```bash
docker compose run --rm backend python manage.py seed_catalog --remove-seed-products
```

### What it creates

- Categories + subcategories: Vehicles, Industrial, Hardware, Electronics, Furniture, Energy, Apparel, Beauty, Mining, Agriculture, Sports (excludes “Other”)
- Users:
  - Admin: `admin@vehsl.local`
  - Buyer: `buyer@vehsl.local` (override via `--buyer-email`)
  - Seller: `seller@vehsl.local` (override via `--seller-email`)
  - Password (default): `Test123!@#` (override via `SEED_DEFAULT_PASSWORD`)
- Products:
  - Created for the seeded seller
  - `status=active`, with `hs_code`, origin/shipping/sample fields, and detail_config (quality/logistics)
  - Variations: Color (Red/Blue)
  - Pricing tiers: product-level + variation-level
  - Media: 3 images per product (picsum URLs) + 1 document per product (example URL)

### Options

```bash
# seed more products per subcategory
docker compose run --rm backend python manage.py seed_catalog --products-per-subcategory 20

# include more subcategories per category
docker compose run --rm backend python manage.py seed_catalog --max-subcategories-per-category 9999

# create more seller accounts (optional)
docker compose run --rm backend python manage.py seed_catalog --sellers 3
```
