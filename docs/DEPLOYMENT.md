# Going live (dev + prod)

Stack: **Next.js** (app), **PostgreSQL** via **Prisma**, **Supabase** (auth + optional storage). Hosting below assumes **Vercel** + **Supabase**; you can swap Vercel for Netlify, Railway, etc.—the env vars stay the same.

## What you need

| Piece | Purpose |
|--------|--------|
| **Git host** | GitHub, GitLab, or Bitbucket (Vercel connects to it). |
| **Supabase — 2 projects** | One DB + auth for **local/dev**, one for **production**. Same schema; different data and keys. |
| **Vercel account** | Builds and serves the site on the internet (`*.vercel.app` or your domain). |
| **Domain (optional)** | Buy at registrar (e.g. Namecheap, Cloudflare); point DNS to Vercel when ready. |

## 1. Two environments, two databases

**Recommended:** create two Supabase projects, e.g. `avitan-dojo-dev` and `avitan-dojo-prod`.

| Environment | Where it runs | `DATABASE_URL` | Supabase project |
|-------------|----------------|------------------|-------------------|
| **Development** | Your laptop (`npm run dev`) | Dev project → Settings → Database → URI (pooler recommended) | Dev project keys |
| **Production** | Vercel | Prod project connection string | Prod project keys |

**Local `.env`:** only dev values. Never commit `.env`.

**Never** point production Vercel env vars at the dev Supabase project if you care about real customer data living only in prod.

### Prisma workflow

- **Local / dev DB:** create schema changes with `npm run db:migrate` (uses `DATABASE_URL` in `.env`).
- **Production DB:** after pushing migrations to Git, apply them with `npm run db:migrate:deploy` against prod’s `DATABASE_URL` (see Vercel build below, or run once from your machine with prod URL).

## 2. Supabase (per project)

For **each** project (dev and prod):

1. **Database:** Settings → Database → copy **connection string** (use **Session pooler** / port `5432` for Prisma migrations if direct IPv4 fails).
2. **API keys:** Settings → API → `URL`, `anon` `public`, `service_role` **secret**.
3. **Auth → URL configuration:**
   - **Site URL:** `http://localhost:3000` (dev project) / `https://your-prod-domain.com` (prod project).
   - **Redirect URLs:** add both `http://localhost:3000/**` and your production origin + `/auth/**`, `/reset-password`, etc. (anything your app uses after Supabase redirects).

## 3. Put the site on the internet (Vercel)

1. Push the repo to GitHub (or GitLab).
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (default).
4. **Environment Variables** (Production): set the same names as `.env.example`:
   - `DATABASE_URL` → **production** Supabase Postgres URL.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` → **production** project.
   - `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app` or your custom domain (must match what users see in the browser).
5. **Build command (production):** use migrations + build so the prod DB schema stays in sync:

   ```bash
   npm run vercel-build
   ```

   In Vercel: **Project → Settings → General → Build & Development Settings → Build Command** → override with `npm run vercel-build` for Production.

   For **Preview** deploys (pull requests), either use a separate preview database URL in Preview env vars, or temporarily set Build Command to `next build` only if you don’t want migrations on preview DBs.

6. Deploy. Open the `.vercel.app` URL and test login and critical flows.

## 4. Custom domain (optional)

1. Vercel → Project → **Settings** → **Domains** → add `www.yoursite.com` (and apex if needed).
2. Add the DNS records Vercel shows (often CNAME / A).
3. Update **Supabase prod** Site URL and redirect allowlist to `https://www.yoursite.com` (and apex if used).
4. Update **`NEXT_PUBLIC_APP_URL`** in Vercel to the same canonical URL and redeploy.

## 5. Checklist before calling it “live”

- [ ] Prod `DATABASE_URL` and Supabase keys are from the **prod** Supabase project only.
- [ ] `NEXT_PUBLIC_APP_URL` is the real public HTTPS URL.
- [ ] Supabase Auth redirect URLs include that origin.
- [ ] `npm run vercel-build` (or `db:migrate:deploy`) has been run successfully against prod at least once after the last migration.
- [ ] MFA, password reset, and login tested on production.

## Security reminders

- **Service role key** only on the **server** (Vercel env). Never in client code or `NEXT_PUBLIC_*`.
- Rotate keys if they were ever committed or leaked.
- Turn on Supabase **Row Level Security** for tables that clients hit via Supabase client, if applicable (your app may use Prisma server-side mostly—align with your architecture).
