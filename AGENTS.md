# AGENTS.md

## Repo shape
- This repo has **two independent npm projects**: `frontend/` and `backend/`. There is **no root `package.json` or workspace runner**, so do not assume root-level `npm` commands exist.
- Production is a **single Express server**: the backend serves `/api/*` and also serves the built Vue app from `../frontend/dist` by default (`backend/server.js`).

## Commands
- Install deps separately:
  - `cd frontend && npm install`
  - `cd backend && npm install`
- Frontend dev: `cd frontend && npm run dev`
- Backend dev: `cd backend && npm run dev`
- Frontend build: `cd frontend && npm run build`
  - This runs `vue-tsc -b && vite build`, so it is the repo’s main frontend typecheck step.
- Backend prod run: `cd backend && npm start`
- Focused frontend typecheck: `cd frontend && npx vue-tsc -b --noEmit`

## Verification
- There is **no configured test suite, linter, formatter, GitHub Actions workflow, or pre-commit hook** in this repo.
- For frontend changes, use `cd frontend && npm run build` as the primary verification step.
- For backend changes, verify by running the server (`cd backend && npm start` or `npm run dev`) because there is no automated test/typecheck coverage there.

## Architecture notes
- Backend routes are **auto-registered** from every `backend/controller/*.js` file. Each controller exports `{ prefix, mapping }`; `backend/server.js` loads them dynamically. There is no central router file to update.
- The active PostgreSQL pool wrapper is `backend/config/db_pool.js`. `backend/config/database.js` also exists, but current models use `db_pool.js` instead.
- Frontend routing is in `frontend/src/router/index.ts` and uses **hash history** plus dynamic route registration based on the Pinia setting/user stores.
- Frontend API calls go through `frontend/src/utils/request.ts`, which injects the `sqlbot-embedded-token` header from client storage.
- Inbound app auth is **not real JWT verification**: `backend/middleware/requestHandler.js` base64-decodes the `sqlbot-embedded-token` header and matches it against a hardcoded local user list.

## Environment and runtime quirks
- Backend env lives in `backend/.env` for local app settings. The checked-in file expects PostgreSQL on `localhost:5432` and sets `STATIC_DIR=../frontend/dist`.
- Frontend env files set API base URLs:
  - dev: `frontend/.env.development` → `http://localhost:3000/api`
  - prod: `frontend/.env.production` → `./api`
- Root `docker-compose.yml` references a **separate root `.env`** via `env_file:`. That file is **not checked in**; do not confuse it with `backend/.env`.
- `docker-compose.yml` uses the prebuilt image `dataease/sqlbot-embedded-demo:dev`; it does **not** build the local Dockerfile unless you change compose config.

## Data and startup behavior
- The backend requires PostgreSQL credentials from env on startup and exits on connection failure (`backend/config/db_pool.js`).
- Demo tables/settings are created and seeded from backend model code on startup/import, so schema/data behavior is partly driven by model side effects.
- JWT generation uses `jose` (`backend/controller/token.js`), not `jsonwebtoken`.

## Change guidance
- If you add a backend API, follow the existing controller auto-registration pattern instead of creating a new manual router layer.
- If you change production asset serving, check both `backend/server.js` and the root `Dockerfile`; the Dockerfile moves the built frontend to `backend/dist`, while `server.js` defaults `STATIC_DIR` to `../frontend/dist`, so static-path changes need both sides reviewed together.
