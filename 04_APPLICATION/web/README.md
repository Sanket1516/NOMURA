# VAAKYA web (Next.js PWA)

Next.js 16 App Router, React 19, TypeScript 7, Tailwind CSS 4, ShadCN-style components (hand-written on `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`). Architecture: `02_ARCHITECTURE/FRONTEND_ARCHITECTURE.md`.

## Run

```bash
npm ci
npm run build && npx next start          # http://localhost:3000
```

Without configuration the app runs in **preview mode**: sign in as one of four synthetic personas from `/login`. Every screen is labelled "Sample data", nothing is saved, and AI features show "not connected" instead of fake answers.

## Configure live mode

| Variable | Example | Purpose |
|---|---|---|
| `APP_URL` | `https://vaakya.example` | Public URL of this app |
| `API_URL` | `http://api:8000` | Internal FastAPI URL |
| `OIDC_ISSUER` | `http://keycloak:8080/realms/vaakya` | Issuer for server-side token calls |
| `OIDC_PUBLIC_ISSUER` | `https://vaakya.example/auth/realms/vaakya` | Issuer the browser is redirected to |
| `OIDC_CLIENT_ID` | `vaakya-web` | Confidential client |
| `OIDC_CLIENT_SECRET` | from a secret store | Never committed |
| `PREVIEW_MODE` | `on` / `off` | Turn sample-data preview off in production |

## Test

```bash
npm test                 # Vitest unit tests
npx playwright test      # E2E + axe (set PLAYWRIGHT_BROWSERS_PATH if browsers are preinstalled)
SCREENSHOTS=1 npx playwright test e2e/screenshots.spec.ts   # regenerate product screenshots
npm run licences         # licence policy check
```

## Structure

`app/(public)` landing, login, register · `app/(onboarding)` consent, persona, profile · `app/(app)` the signed-in app · `app/api/auth/*` OIDC BFF · `app/api/proxy/*` token-attaching API proxy · `components/{ui,a11y,ai,finance,layout,voice}` · `lib/` types, formatting, sample data, server session.
