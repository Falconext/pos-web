# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev          # Vite dev server on port 5174
pnpm run build        # Production build → dist/
pnpm run lint         # ESLint check
pnpm run test         # Jest (jsdom environment)
pnpm run test:watch   # Jest watch mode
```

Run a single test file:
```bash
npx jest src/path/to/file.test.ts
npx jest --testNamePattern="pattern"
```

## Architecture

React 19 + Vite SPA. Path alias `@` → `src/`.

### Route structure (App.tsx)

Three independent route trees:
- `/administrador/*` — `ProtectedRoute` → `AdminLayout` (Outlet). Authenticated business users.
- `/reseller/*` — `ProtectedRoute` → `RoleRoute(RESELLER)` → `ResellerLayout`. Distributor dashboard.
- `/tienda/:slug/*` — Public storefront (no auth). Separate UX with its own login at `/tienda/login`.

`ProtectedRoute` blocks on `auth.isLoading`, redirects to `/login` if no `auth`. `RoleRoute` additionally checks `auth.rol`.

Multi-sede flow: after login with 2+ sedes, `pendingSedes` is set and user is redirected to `/sede-seleccion`. After selecting, `auth/select-sede` issues final tokens with sedeId embedded.

### State (Zustand)

One store per domain in `src/zustand/`. Key stores:
- `auth.ts` — `useAuthStore`: user, sedeActiva, pendingSedes, login/logout/selectSede/me
- `alert.ts` — `useAlertStore`: global toast **and** global loading spinner (both in one store — use `loading` for full-page loaders, `alert()` for toasts)
- `theme.ts` — `useThemeStore`: sidebar color, type, navbar fixed, compact mode

Other domain stores: `products`, `categories`, `brands`, `clients`, `invoices`, `pagos`, `caja`, `compras`, `kardex`, `finanzas`, `dashboard`, `sedes`, `modulos`, `notificaciones`, `guia-remision`, `combos`, `modificadores`, `accounting`, `empresas`, `users`, `resellers`, `whatsapp`, `extentions`, `plantillas`.

`useAuthStore` calls `auth/me` on module load to restore session from `localStorage`.

### HTTP layer

`src/utils/apiClient.ts` — Axios instance with:
- Base URL auto-inferred: `VITE_API_URL` → `localhost:4001/api` → LAN IP with port 4001 → `api.falconext.pe/api`
- Request interceptor injects `Bearer <ACCESS_TOKEN>` from localStorage
- Response interceptor handles 401: queues concurrent requests, calls `auth/refresh`, replays on success, or redirects to `/login` on failure

`src/utils/fetch.ts` — Typed wrappers `get/post/put/patch/del` over apiClient. Returns `ApiResponse<T>`. Backend wraps all responses as `{ code: 1|0, message, data }` — `code: 0` is thrown as an error. Use `fetch.ts` wrappers for standard CRUD; use `apiClient` directly for multipart/form-data uploads or when you need raw Axios config.

### Features pattern

Complex pages live in `src/features/admin/<domain>/` using a Model/ViewModel/View split:
- `*Model.ts` — TypeScript interfaces, constants, static data
- `use*ViewModel.ts` — business logic hook (state, API calls, handlers). Consumes Zustand stores and `useAlertStore` for feedback.
- `*View.tsx` — pure rendering component that receives everything via props from the ViewModel

Feature domains with this pattern: `kardex/{products,dashboard,movements,batches,traslados}`, `users`, `clients`, `compras`, `cotizaciones`, `facturacion`, `finanzas`, `sedes`, `sistema`, `tienda`.

Simpler pages sit directly in `src/pages/admin/<domain>/`.

### Permissions (src/utils/permissions.ts)

Two-layer check: Plan modules → User permissions.
- `ADMIN_SISTEMA` bypasses all checks.
- `ADMIN_EMPRESA` passes plan-layer, bypasses user-layer.
- `USUARIO_EMPRESA` must pass both `hasPermission(user, moduloCodigo)` and optionally `hasSubPermission(user, subModuloCodigo)`.
- `AdminLayout` uses these to show/hide sidebar items.

### Rubro-aware features (src/utils/rubro-features.ts)

Features are auto-detected from `empresa.rubro.nombre` — no manual config flags needed. The `useRubroFeatures(rubroNombre)` hook returns a `RubroFeatures` object:
- `gestionLotes` / `requiereVencimientos` / `permiteFraccionamiento` → true for farmacia/botica
- `usaCodigoBarras` → true for bodega/supermarket (overridable via `empresa.usaCodigoBarrasManual`)
- `gestionOfertas` → true for bodega/supermarket

`AdminLayout` also detects restaurante rubro to rename "Kardex" → "Catálogo" and "Productos" → "Platos" in the sidebar.

### LocalStorage keys

| Key | Value |
|-----|-------|
| `ACCESS_TOKEN` | JWT bearer token |
| `REFRESH_TOKEN` | Refresh token |
| `SEDE_ACTIVA` | JSON-serialized `ISede` object |

### UI

Tremor + Radix UI primitives + Tailwind CSS v3.4. Charts via ApexCharts and Recharts. Framer Motion for animations. Icon sets: `@iconify/react` and `lucide-react`. Sidebar appearance (color, collapsed state) driven by `useThemeStore`. Use `src/utils/cn.ts` (clsx + tailwind-merge) for conditional class merging.

### Shared hooks (src/hooks/)

- `useDebounce` — debounce search inputs before API calls
- `useOutsideClick` — close dropdowns/menus on outside click
- `useEscapeKey` — close modals on Escape
- `useIsMobile` — responsive breakpoint detection
- `usePaymentFlow` — orchestrates the multi-step payment modal flow

### Print pages

Some features have dedicated print-only views that `window.print()` targets. Examples: `src/pages/admin/facturacion/print/index.tsx`, `src/features/admin/kardex/traslados/TrasladoPrintPage.tsx`, `src/pages/admin/guia-remision/print/GuiaRemisionPrint.tsx`. These render without `AdminLayout` and are opened in new tabs.

### Real-time

Socket.io client in `src/components/NotificacionesCampana.tsx` for push notifications. Connects with `ACCESS_TOKEN` auth.
