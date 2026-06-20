# Shimeka E-commerce Platform

Full-stack e-commerce platform for makeup and clothing, built with NestJS, Next.js, Prisma, and PostgreSQL.

## Architecture

```
shimeka-nest/
├── apps/
│   ├── api/          # NestJS backend (REST API)
│   ├── admin/        # Next.js admin dashboard (port 3001)
│   └── storefront/   # Next.js customer-facing store (port 3000)
├── packages/
│   └── shared/       # Shared types, enums, constants
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma ORM, PostgreSQL |
| Auth | JWT (access + refresh tokens), argon2, role-based guards |
| Admin | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Storefront | Next.js 14 (App Router), Tailwind CSS, Framer Motion, GSAP |
| Monorepo | pnpm workspaces, Turborepo |
| File Upload | Local disk (swappable to S3 via StorageProvider interface) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Installation

```bash
pnpm install
```

### Environment Variables

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/shimeka-nest-db
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
UPLOAD_DIR=./uploads
PORT=4000
```

### Database Setup

```bash
# Generate Prisma client
pnpm --filter @shimeka/api prisma:generate

# Run migrations
pnpm --filter @shimeka/api prisma:migrate

# Seed sample data
pnpm --filter @shimeka/api db:seed
```

### Development

```bash
# Run all apps concurrently
pnpm dev

# Or run individually
pnpm --filter @shimeka/api dev        # API on :4000
pnpm --filter @shimeka/storefront dev  # Storefront on :3000
pnpm --filter @shimeka/admin dev       # Admin on :3001
```

### Build

```bash
pnpm build
```

## Seed Data

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shimeka.com | Admin@12345 |
| Staff | staff@shimeka.com | Staff@12345 |
| Customer | customer@example.com | Customer@123 |

**Coupons:** WELCOME10 (10% off), FLAT200 (৳200 off)

## API Endpoints

Base: `http://localhost:4000/api/v1`

### Public
- `GET /categories/tree` — Category tree
- `GET /products` — Product listing (paginated, filterable)
- `GET /products/:slug` — Product detail
- `POST /auth/register` — Customer registration
- `POST /auth/login` — Customer login
- `POST /coupons/validate` — Validate coupon

### Customer (JWT required)
- `GET /users/profile` — Get profile
- `PATCH /users/profile` — Update profile
- `GET/POST /cart/*` — Cart operations
- `POST /orders` — Create order
- `GET /orders/my` — Order history

### Admin (Admin JWT required)
- `POST /admin/auth/login` — Admin login
- `GET /admin/dashboard/*` — Dashboard stats
- `GET/POST/PATCH/DELETE /admin/products/*` — Product CRUD
- `GET/POST/PATCH/DELETE /admin/categories/*` — Category CRUD
- `GET/PATCH /admin/orders/*` — Order management
- `GET/POST/PATCH/DELETE /admin/coupons/*` — Coupon CRUD
- `GET /admin/users/customers` — Customer list

## Features

### Storefront
- Responsive product browsing with categories and filters
- Product search with server-side rendering (ISR)
- Shopping cart (guest & authenticated)
- Checkout with shipping zones (Dhaka ৳60, outside ৳100)
- Guest and authenticated ordering
- Customer account (profile, orders, addresses)
- Product reviews (verified purchase)
- Wishlist
- Hero banners and CMS content

### Admin Dashboard
- Dashboard with stats, revenue chart, recent orders
- Product CRUD with image upload
- Category management (tree structure)
- Order management with payment/delivery status updates & notes
- Customer management (view, block/unblock)
- Coupon CRUD

### API
- JWT auth with refresh token rotation
- Role-based access control (Admin, Staff, Customer)
- Rate limiting
- File upload with swappable storage providers
- Pagination, search, and filtering
- Manual payment and delivery status tracking with status logs

## Phase 1 Scope

This is phase 1 — the following are explicitly excluded:
- Payment gateway integration (manual payment status only)
- Multi-vendor support
- Subscription/recurring orders
- Multi-language (i18n)
- Advanced email/SMS automation
