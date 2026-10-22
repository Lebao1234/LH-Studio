# LH Studio

Internal workspace for a ~6-person AI film studio: film projects, episodes, tasks, social posts and a publishing calendar, the team, and finances.

| Part | Stack |
|---|---|
| `client/` | React 19, Vite 8, Tailwind v4, shadcn/ui (base-nova, on Base UI), TanStack Query, React Hook Form + Zod, Axios, Recharts, date-fns |
| `server/` | Node 20+, Express 5, MongoDB/Mongoose 9, JWT, Argon2id, Zod, Helmet, CORS, express-rate-limit |

---

## Local development

Requirements: Node 20.11+ (tested on 24), and a MongoDB **replica set**. Atlas always is one. Locally, use Atlas or a single-node replica set, because payments run in multi-document transactions.

```bash
# 1. API
cd server
npm install
cp .env.example .env     # fill MONGO_URI, JWT_* secrets (see comments in the file)
npm run seed:dev         # optional, DEV ONLY: sample studio, users, projects, posts, finance
npm run dev              # http://localhost:5055

# 2. Web app
cd ../client
npm install
cp .env.example .env.local   # VITE_API_URL=http://localhost:5055
npm run dev                  # http://localhost:5173
```

The seed prints the accounts (`owner@lhstudio.dev`, `admin@…`, `bao@…`, `viewer@…`). They all share one password: the value of `SEED_PASSWORD`, or a random one printed once. `npm run seed:dev -- --reset` drops the database first, and it refuses to run with `NODE_ENV=production`.

### First owner (no seed)
1. Set `BOOTSTRAP_TOKEN` (16+ random chars) on the server.
2. Open `/register`. While no studio exists, the page offers **Khởi tạo studio** and asks for that token.
3. Remove `BOOTSTRAP_TOKEN` afterwards. Everyone else joins through invitations: **Đội ngũ → Mời thành viên** gives you a one-time link (there's no e-mail service in V1).

### Tests
```bash
cd server && npm test     # Vitest + Supertest against an in-memory MongoDB replica set
cd client && npm run lint && npm run build
```

---

## Architecture

### Backend: modular monolith (`server/`)
```
config/        env (Zod-validated), database, cors
middlewares/   authenticate, studioContext, authorize, validate, csrf, rateLimiter, errorHandler
modules/<x>/   <x>.model.js · <x>.validation.js · <x>.service.js · <x>.controller.js · <x>.routes.js
               auth, users, studios, projects, episodes, tasks, channels, posts, finances, dashboard
shared/        db (mongoose + global JSON plugin, withTransaction), errors, utils, constants
routes/        /api/v1 router
```
- **Routes** attach validation and authorization. **Controllers** read `req.valid` (parsed by Zod) and call **services**. **Services** hold every business rule and scope every query by `req.ctx.studioId`.
- Request bodies are never passed straight to Mongoose. Each update schema lists its allowed fields explicitly, and derived fields (`paidAmount`, `paymentCount`, payment-derived status) are not in any client schema.
- Response envelope: `{ success, message, data, meta }`, and errors use `{ success:false, message, code, errors[] }`. 400 = request validation, 401 = authentication, 403 = permission, 404 = not found or not visible, 409 = conflict or duplicate, 422 = business rule, 429 = rate limit.

### Collections
The 14 business collections: `studios, users, studio_members, projects, project_members, episodes, tasks, task_assignments, channels, posts, post_metrics, finance_categories, transactions, transaction_payments`.

Two supporting security collections: `auth_sessions` (refresh-token sessions, TTL index on `expiresAt`) and `studio_invitations`.

Key indexes:
- uniques on `studios.slug`, `users.email`, `{studioId,userId}`, `{studioId,code}`, `{projectId,userId}`, `{projectId,episodeNumber}`, `{taskId,userId}`, `{studioId,type,code}`
- partial unique `one_lead_per_task`, `payment_idempotency` `{transactionId,idempotencyKey}` and `single_reversal`
- filter indexes on status, dates and studio

Production runs with `autoIndex: false`. Run `npm run sync-indexes` after deploying schema changes.

### Money
VND amounts are integers stored as BSON Long (Mongoose `BigInt`, driver `useBigInt64`). The API accepts and returns them as **decimal strings** (`"50000000"`). The client formats them without floating point (`50.000.000 ₫`). Each amount is capped at 10^15 ₫.

### Frontend (`client/src`)
```
app/          providers, router (guards), layouts
features/     auth, dashboard, projects, episodes, tasks, posts, calendar, channels, team, finance
components/   ui (shadcn — untouched), layout (sidebar/header), shared (DataTable, StatusBadge, ConfirmDialog, FormField…)
lib/          api (axios + per-domain modules), utils/format, constants/labels
hooks/        use-url-filters (shareable filters in the URL), use-lookups (cached pickers)
```

---

## Security model

**Tokens**
- Access JWT: 15 min, HS256. Algorithm, issuer, audience and expiry are verified. It lives **in memory only** and is sent as `Authorization: Bearer`.
- Refresh JWT: 7 days, in an `HttpOnly` cookie on `Path=/api/v1/auth`. Only its SHA-256 hash is stored, in `auth_sessions`.
- Every refresh **rotates** the token atomically. Replaying an old token revokes the whole session (reuse detection). A 20-second grace window absorbs benign multi-tab races.
- Logout revokes the session and clears the cookie. A password change revokes the user's other sessions.
- Every authenticated request re-checks the session and the user's status, so revocation and suspension take effect immediately.

**CSRF**
- Cookie endpoints (`login`, `register`, `refresh`, `logout`) require the `X-CSRF-Protection: 1` header, plus an allow-listed `Origin` or `Referer` when the browser sends one.
- A custom header forces a CORS preflight, and CORS only approves origins listed in `CLIENT_URL`.

**Axios client**
- Concurrent 401s share one refresh request, and the original request is retried once.
- 403, 404 and 422 are never retried.
- If the refresh fails, auth state is cleared and the router redirects to `/login`.

**Registration**
- No open sign-up. The first owner uses the one-time bootstrap token.
- Everyone else needs an invitation whose role is fixed on the server. Clients can never choose their own role.

**Role-based access (RBAC)**

| | owner | admin | member | viewer |
|---|---|---|---|---|
| All projects | ✔ | ✔ | only projects they belong to | only projects they belong to (read-only) |
| Create/edit production data | ✔ | ✔ | ✔ (project roles apply) | ✗ |
| Channels, team management | ✔ | ✔ (cannot touch owners) | ✗ | ✗ |
| Finance (read & write) | ✔ | ✔ | ✗ | ✗ |

Project roles control finer actions:
- project settings and members: `manager`
- episodes: `manager`, `editor`, `creator`
- tasks: any project role, and assignees can update their own tasks

The initial owner, and the last active owner, can't be demoted or removed. Resources in other studios return 404.

**Rate limits** (all configurable)

| Endpoint group | Limit |
|---|---|
| Login, per email + IP | 5 failed attempts / 15 min |
| Login, per IP | 30 failed attempts / 15 min |
| Register | 3 / hour / IP |
| Refresh | 30 / 15 min |
| General API | 300 / min / user (the brief suggested 100; a single dashboard load is ~8 requests) |
| Finance writes | 20 / min / user |

Every limit returns a standard 429 response with `Retry-After`.

**Other protections**
- Helmet, 512 kB body limit, `trust proxy` set to an exact hop count, generic 500 responses in production.
- Request bodies are never logged.
- The CSV export neutralises spreadsheet formulas.

**Finance integrity**
- Payments are recorded only through the finance service, inside a snapshot transaction, using a conditional pipeline update (`paidAmount + amount ≤ totalAmount`).
- A unique `(transactionId, idempotencyKey)` index blocks duplicate submissions.
- Settled records are locked to title/description edits. Records with payments can't be deleted.
- Corrections are **reversal entries**: the payment history is never rewritten.
- Dashboard cash figures come from `transaction_payments.paidAt`. Expected figures are the unpaid remainder of outstanding transactions, filtered by `expectedDate`.

---

## Deployment (Render + MongoDB Atlas)

`render.yaml` defines both services.

1. **Atlas**
   - Create a cluster and a database user with the least privilege that works.
   - Add Render's outbound IPs to the network access list, or `0.0.0.0/0` combined with a strong password.
   - Copy the connection string into `MONGO_URI`.
2. **API: Render Web Service** (`rootDir: server`, `npm start`, health check `/health`)
   - Set `MONGO_URI`, `CLIENT_URL=https://<web>.onrender.com`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`, `TRUST_PROXY=1`.
   - The blueprint generates the JWT secrets.
   - Run `npm run sync-indexes` once from a Render shell.
3. **Web: Render Static Site** (`rootDir: client`, publish `dist`)
   - Set `VITE_API_URL=https://<api>.onrender.com`.
   - The SPA rewrite `/* → /index.html` is in the blueprint.
4. **First owner:** set `BOOTSTRAP_TOKEN`, register once, then delete the variable.

`*.onrender.com` subdomains are cross-site to each other (public-suffix list), which is why the cookie needs `SameSite=None; Secure`. With custom domains such as `app.example.com` and `api.example.com`, prefer `COOKIE_SAMESITE=lax`.

Keep `numInstances: 1` while the rate limiter uses its in-memory store. Before scaling out, plug in a shared store such as Redis (`rate-limit-redis`).

---

## Assumptions & known limitations (V1)
- **No automatic social publishing.** Posts are scheduled and marked published by hand, and platform tokens are never stored.
- **"Recent activity"** on the dashboard is built from the most recently updated records. There is no audit-log collection.
- **No platform/channel filter in finance.** Transactions aren't linked to channels in the ERD.
- **One "current" studio per session.** It's the earliest active membership, or `X-Studio-Id`. The UI has no studio switcher.
- **Invitations are shared as links.** There's no e-mail delivery.
- **The finance summary range uses local calendar months** chosen in the UI. The dashboard's "this month" uses the studio timezone (default `Asia/Ho_Chi_Minh`).
