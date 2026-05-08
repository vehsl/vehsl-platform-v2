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
