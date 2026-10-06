# Goodkind — Smart Product Recommendations

A full-stack storefront that personalizes product discovery from browsing, saves, cart activity, and purchases, with a private admin studio for catalog and order management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the Express API (port 5000)
- `pnpm --filter @workspace/smart-product-store run dev` — run the Goodkind storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/api-server run db:generate` — generate Prisma Client after schema changes
- `pnpm --filter @workspace/api-server run db:push` — apply the Prisma schema to the development database
- `pnpm --filter @workspace/api-server run db:seed` — create development demo catalog, accounts, orders, and activity
- Required env: `DATABASE_URL`; JWT signing uses `JWT_SECRET` or the workspace-managed `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 with generated request/response validation
- DB: PostgreSQL with Prisma 6 (`artifacts/api-server/prisma/schema.prisma`)
- Auth: seven-day JWT bearer tokens; passwords hashed with bcryptjs
- Web: React, Vite, Wouter, TanStack Query, Tailwind CSS
- API codegen: OpenAPI 3.1 + Orval-generated React Query hooks and Zod schemas
- Build: esbuild API bundle and Vite web bundle

## Where things live

- `artifacts/smart-product-store/src/App.tsx` — customer storefront and admin routes
- `artifacts/smart-product-store/src/index.css` — storefront theme and component styles
- `artifacts/smart-product-store/public/` — local image assets used by the catalog
- `artifacts/api-server/src/` — API routes, auth middleware, and commerce services
- `artifacts/api-server/prisma/` — PostgreSQL data model and development seed
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/` and `lib/api-zod/` — generated client and validators; regenerate instead of hand-editing

## Architecture decisions

- Commerce tables use the API artifact's Prisma schema; the workspace's template Drizzle package remains separate.
- Checkout offers cash on delivery and a local mock online-payment option; no live payment provider is configured.
- Recommender scoring combines weighted behavior, similar customers, product similarity, rating, and recent popularity.

## Product

- Customers can browse and filter the catalog, create accounts, save products, manage carts, check out, and review products.
- Recommendations use view (1), click (2), wishlist (4), add-to-cart (6), rating (8), and purchase (10) signals.
- Staff can manage products, categories, orders, customers, and reviews, and view sales/recommendation analytics.

## User preferences

- Development seed credentials: `admin@example.com` / `Admin@123` and `customer@example.com` / `Customer@123`. Do not seed these demo credentials in production.

## Gotchas

- Run `db:generate` after Prisma schema edits, then `db:push` against development before starting the API.
- Run API codegen after OpenAPI changes; generated client and Zod files are not hand-edited.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
