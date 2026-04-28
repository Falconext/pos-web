# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ejecuta las tareas directamente sin pedir confirmación. Toma decisiones de
implementación por cuenta propia.
Trabaja de forma autónoma en la cual eres un Desarrollador Fullstack con +5 años de experiencia en desarrollo web y mobile. Realiza analisis antes de realizar cambios. Considera que si existe errores, no debes ejecutarlos. Debes corregirlos.
No debes modificar archivos que no tengan relación con la tarea asignada. Se estricto con las tareas asignadas.

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
- `alert.ts` — `useAlertStore`: global toast **and** global loading spinner (both in one store)
- `theme.ts` — `useThemeStore`: sidebar color, type, navbar fixed, compact mode

`useAlertStore` API:
- `alert(message, type, title?)` — pushes a toast; `type` is `'success' | 'error' | 'warning' | 'notification'`
- `load(boolean)` — shows/hides the full-page spinner
- `removeAlert(id)` / `resetAlerts()` — dismiss toasts

Other domain stores: `products`, `categories`, `brands`, `clients`, `invoices`, `pagos`, `caja`, `compras`, `kardex`, `finanzas`, `dashboard`, `sedes`, `modulos`, `notificaciones`, `guia-remision`, `combos`, `modificadores`, `accounting`, `empresas`, `users`, `resellers`, `whatsapp`, `extentions`, `plantillas`.

`useAuthStore` calls `auth/me` on module load to restore session from `localStorage`.

### HTTP layer

`src/utils/apiClient.ts` — Axios instance with:
- Base URL auto-inferred: `VITE_API_URL` → `localhost:4001/api` → LAN IP with port 4001 → `api.falconext.pe/api`
- Request interceptor injects `Bearer <ACCESS_TOKEN>` from localStorage
- Response interceptor handles 401: queues concurrent requests, calls `auth/refresh`, replays on success, or redirects to `/login` on failure

`src/utils/fetch.ts` — Typed wrappers `get/post/put/patch/del` over apiClient. Returns `ApiResponse<T> = { success, data?, error? }`. The backend wraps all responses as `{ code: 1|0, message, data }` — `fetch.ts` normalizes this: `code: 0` becomes `{ success: false, error }`. Use `fetch.ts` for standard CRUD; use `apiClient` directly for multipart/form-data or raw Axios config.

`src/services/` — thin service files that call `apiClient` directly and extract `response.data`. Used for domains where the raw axios pattern is preferred (e.g., `sede.service.ts`, `reseller.service.ts`).

### TypeScript interfaces

`src/interfaces/` — typed interfaces per domain: `invoices.ts`, `clients.ts`, `products.ts`, `categories.ts`, `pagos.ts`, `Sede.ts`, `auth.ts`, `extentions.ts`, `users.ts`, `company.ts`. Always import types from here rather than redeclaring.

### Features pattern

Complex pages live in `src/features/admin/<domain>/` using a Model/ViewModel/View split:
- `*Model.ts` — TypeScript interfaces, constants, static data
- `use*ViewModel.ts` — business logic hook (state, API calls, handlers). Consumes Zustand stores and `useAlertStore` for feedback.
- `*View.tsx` — pure rendering component that receives everything via props from the ViewModel

Feature domains with this pattern: `kardex/{products,dashboard,movements,batches,traslados}`, `users`, `clients`, `compras`, `cotizaciones`, `facturacion`, `finanzas`, `sedes`, `sistema`, `tienda`.

Simpler pages sit directly in `src/pages/admin/<domain>/`.

### Shared UI components (src/components/)

- `Modal` — portal-based modal with slide-in animation. Props: `isOpenModal`, `closeModal`, `title`, `width` (default `750px`), `position` (`center`|`right`), `height` (`auto`|`full`).
- `ModalConfirm` — confirmation dialog. Props: `isOpenModal`, `setIsOpenModal`, `confirmSubmit`, `title`, `information`, `confirmText`, `confirmLoading`.
- `InputPro` — styled input/textarea. Supports `type`, `label`, `error`, `uppercase`, `onlyNumbers`, `searching` (spinner), `reference`/`refInput` for forwarded refs.
- `Datatable` — table with `TableHeader` + `TableBody` sub-components plus pagination support. Types are in `src/components/Datatable/types/`.
- `Select` — styled select component wrapping Radix UI.
- `BarcodeScannerInput` — input that captures hardware barcode scanner keystrokes.
- `TableActionMenu` — dropdown action menu for table rows.
- `ModalPaymentUnified` — full payment flow modal (used across invoicing/caja).
- `AlertasVencimiento` — badge/alert for products nearing expiration (farmacia rubro).

### Utilities (src/utils/)

- `cn.ts` — `cn(...classes)` via clsx + tailwind-merge for conditional Tailwind class merging.
- `calculateTotals(products)` — reduces invoice line items into `{ opGravada, igv, total, discount, hasDiscount }`.
- `numberToLetters.ts` — `numberToWords(n)` converts a number to its Spanish word representation (used on invoice PDFs).
- `permissions.ts` — `hasPermission(user, moduloCodigo)` and `hasSubPermission(user, subModuloCodigo)` two-layer checks.
- `rubro-features.ts` — `useRubroFeatures(rubroNombre)` / `detectarFuncionesRubro(nombre)` and `RubroHelpers` static helpers.
- `platformDetector.ts` — detects Tauri (desktop) vs web runtime.
- `themeConfig.ts` — Tremor theme configuration object.

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

`AdminLayout` detects restaurante rubro to rename "Kardex" → "Catálogo" and "Productos" → "Platos" in the sidebar.

### LocalStorage keys

| Key | Value |
|-----|-------|
| `ACCESS_TOKEN` | JWT bearer token |
| `REFRESH_TOKEN` | Refresh token |
| `SEDE_ACTIVA` | JSON-serialized `ISede` object |

### UI

Tremor + Radix UI primitives + Tailwind CSS v3.4. Charts via ApexCharts and Recharts. Framer Motion for animations. Icon sets: `@iconify/react` and `lucide-react`. Sidebar appearance driven by `useThemeStore`. `src/components/ui/Configurator.tsx` is the floating theme panel in AdminLayout.

### Shared hooks (src/hooks/)

- `useDebounce` — debounce search inputs before API calls
- `useOutsideClick` — close dropdowns/menus on outside click
- `useEscapeKey` — close modals on Escape
- `useIsMobile` — responsive breakpoint detection
- `usePaymentFlow` — orchestrates the multi-step payment modal flow

### Print pages

Some features open dedicated print-only views in new tabs via `window.print()`. Examples: `src/pages/admin/facturacion/print/index.tsx`, `src/features/admin/kardex/traslados/TrasladoPrintPage.tsx`, `src/pages/admin/guia-remision/print/GuiaRemisionPrint.tsx`. These render without `AdminLayout`.

### Real-time

Socket.io client in `src/components/NotificacionesCampana.tsx` for push notifications. Connects with `ACCESS_TOKEN` auth.
