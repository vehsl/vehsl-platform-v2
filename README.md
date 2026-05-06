# Vehsl Platform v2

Next.js 15 (App Router) frontend + Node/Express backend, orchestrated via Docker Compose.

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
├── backend/                    # Node + Express
│   ├── Dockerfile
│   └── src/server.js
└── _legacy/                    # original React + Vite modules (reference only)
```

## Local development

```bash
# Frontend
cd frontend && npm install && npm run dev    # → http://localhost:3000

# Backend
cd backend && npm install && npm run dev     # → http://localhost:4000
```

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Frontend on `:3000`, backend on `:4000`.

## Migration status

| Module | Source | Target route | Status |
|---|---|---|---|
| Signup | `_legacy/Signup page Vehsl complete/` | `/signup` | pending |
| Product View | `_legacy/Product View Page/` | `/products/[id]` | pending |
| Order Details | `_legacy/Order Details View/` | `/orders/[id]` | pending |
| Admin | `_legacy/Admin Management Modules/` | `/admin` | pending |
| Landing | `_legacy/Platonic E-commerce Platform Design 100426/` | `/` | pending |
# vehsl-platform-v2
