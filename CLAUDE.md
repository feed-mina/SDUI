# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SDUI (Server-Driven UI) — UI structure is defined as metadata in the database and served by the backend. The frontend engine interprets this metadata at runtime to render screens, so most UI changes require no client redeploy.

## Repository Structure

```
SDUI/
├── SDUI-server/          # Spring Boot backend (Java 17, Gradle)
├── metadata-project/     # Next.js frontend (TypeScript, React 19)
└── docker-compose.yml    # Local dev: PostgreSQL (5433), Redis (6379), backend (8080)
```

## Commands

### Frontend (`metadata-project/`)
```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # ESLint
npm run test      # Jest (all tests in tests/**)
npx jest tests/path/to/file.test.tsx  # Single test file
npx playwright test  # E2E tests
```

### Backend (`SDUI-server/`)
```bash
./gradlew bootRun           # Run server (requires DB + Redis)
./gradlew build             # Build JAR
./gradlew test              # Run all tests
./gradlew test --tests "com.domain.demo_backend.SomeTest"  # Single test
```

### Local Infrastructure
```bash
docker-compose up -d   # Start PostgreSQL + Redis (from repo root)
```

## Architecture

### Data Flow

```
URL /view/[screenId]
  → MetadataProvider  → GET /api/ui/{screenId}  → UiController → UiService (builds tree)
                                                                 ↑ Redis cache (1 hr)
  → CommonPage
  → DynamicEngine (receives metadata tree + pageData + formData)
      → useDynamicEngine  (data binding: formData > rowData > pageData)
      → componentMap lookup by component_type
      → renders React components
```

### Key Concepts

**`ui_metadata` table** — Every row is a UI component. Key fields:
- `screen_id`: groups all components for a screen (e.g. `LOGIN_PAGE`, `DIARY_LIST`)
- `component_type`: maps to a React component (`INPUT`, `TEXT`, `BUTTON`, `MODAL`, `IMAGE`, etc.)
- `group_id` / `parent_group_id`: builds the parent-child tree; groups render as `<div>` wrappers
- `ref_data_id`: links a component or group to a key in `pageData`; groups with `ref_data_id` are **Repeaters** (mapped over arrays)
- `action_type`: determines which action handler fires (e.g. `LOGIN_SUBMIT`, `DIARY_WRITE`)
- `group_direction`: `ROW` → `flex-row-layout` | `COLUMN` → `flex-col-layout`
- `css_class`: applied as className; outermost engine container always gets `engine-container`

**`query_master` table** — Stores SQL queries keyed by `sql_key`. Backend looks up and executes these for dynamic data fetching, cached in Redis as `SQL:{sqlKey}`.

### Frontend Key Files

| File | Role |
|------|------|
| `components/DynamicEngine/DynamicEngine.tsx` | Traverses the metadata tree and renders components |
| `components/DynamicEngine/useDynamicEngine.tsx` | Data binding logic (formData priority over pageData) |
| `components/constants/componentMap.tsx` | Maps `component_type` string → React component |
| `components/constants/screenMap.ts` | Maps URL paths → `screenId` strings |
| `components/providers/MetadataProvider.tsx` | Fetches metadata via React Query; provides `screenId`, `refId`, `menuTree` |
| `components/DynamicEngine/hook/usePageHook.tsx` | Dispatches actions to `useUserActions` or `useBusinessActions` |
| `app/view/[...slug]/page.tsx` | Single `CommonPage` handles all screens |

### Adding a New Component Type

1. Create a React component in `components/fields/`
2. Add it to `componentMap` in `components/constants/componentMap.tsx` with an uppercase string key
3. Add rows to `ui_metadata` in the DB with that `component_type` value

### Adding a New Screen

1. Insert rows into `ui_metadata` with the new `screen_id`
2. Add the screen to `SCREEN_MAP` in `components/constants/screenMap.ts` if it needs a static URL
3. If the screen needs auth protection, add its `screen_id` to `PROTECTED_SCREENS` in `app/view/[...slug]/page.tsx`

### Action Handler Pattern

`usePageHook` routes action dispatches:
- `userActionTypes` list (LOGIN_SUBMIT, LOGOUT, REGISTER_SUBMIT, VERIFY_CODE, etc.) → `useUserActions`
- All other action types → `useBusinessActions`

### RBAC

`MetadataProvider` builds the React Query key as `${rolePrefix}_${screenId}` (e.g. `USER_DIARY_LIST`). The backend uses this to filter metadata by role when needed.

### Backend Key Packages

| Package | Role |
|---------|------|
| `domain/ui` | `UiController` → `UiService` builds flat DB records into a nested tree; served at `GET /api/ui/{screenId}` |
| `domain/query` | `QueryMasterService` — fetch SQL from `query_master` table, cache in Redis |
| `domain/user` | Auth: `AuthController` (login/register/email verify), `KakaoController` (OAuth) |
| `global/security` | Spring Security config, `JwtAuthenticationFilter`, `JwtUtil` |
| `global/config` | `RedisConfig`, `WebConfig` (CORS), `WebSocketConfig` |

### API Proxy

Next.js proxies `/api/*` → `http://localhost:8080` (dev) or the production EC2 host. Configure in `metadata-project/next.config.ts`.

### Testing

- Frontend unit tests: `tests/` directory using Jest + React Testing Library + MSW for API mocking
- Reports written to `tests/logs/frontend-report.html`
- E2E tests: Playwright (`playwright.config.ts`)
- Backend: JUnit 5 (`./gradlew test`)