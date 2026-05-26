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

Use this to populate the database with categories/subcategories (matching the Explore UI) and a large set of products (with images) so you can test buyer/seller/admin flows.

### Run (Docker)

```bash
docker compose run --rm backend python manage.py migrate
docker compose run --rm backend python manage.py seed_catalog --reset --with-kyc
```

### What it creates

- Categories + subcategories: Vehicles, Industrial, Hardware, Electronics, Furniture, Energy, Apparel, Beauty, Mining, Agriculture, Sports (excludes “Other”)
- Users:
  - Admin: `admin@vehsl.local`
  - Buyer: `buyer@vehsl.local`
  - Sellers: `seller1@vehsl.local`, `seller2@vehsl.local`, …
  - Password (default): `Test123!@#` (override via `SEED_DEFAULT_PASSWORD`)
- Products:
  - Created under each subcategory (configurable)
  - `status=active`, with `hs_code`, ratings, and location
  - 3 images per product (picsum URLs) so cards render

### Options

```bash
# seed more products per subcategory
docker compose run --rm backend python manage.py seed_catalog --products-per-subcategory 20

# include more subcategories per category (default is 9)
docker compose run --rm backend python manage.py seed_catalog --max-subcategories-per-category 9999

# create more seller accounts (default is 3)
docker compose run --rm backend python manage.py seed_catalog --sellers 10
```
