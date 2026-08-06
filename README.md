# Foundry & Flame — Restaurant Ordering Platform

A full ordering platform: a polished customer-facing site (menu, cart, checkout with
WhatsApp order handoff, offers, promo codes) plus an admin dashboard (menu, categories,
orders, offers, promo codes, settings), backed by a Node/Express/MongoDB API.

```
project/
├── frontend/            Static site — deploy as its own Vercel project
│   ├── index.html         Customer-facing storefront
│   ├── admin-<random>.html  Restaurant admin dashboard (unguessable path, see note below)
│   ├── 404.html
│   ├── vercel.json
│   ├── css/
│   └── js/
│       ├── config.js       ← Set your deployed backend URL here before publishing
│       ├── data.js         Sample data (storefront preview only, never used for admin login/promo codes)
│       ├── api.js          API client
│       ├── app.js          Storefront logic (cart, checkout, WhatsApp, etc.)
│       └── admin.js        Admin dashboard logic
└── backend/              Node.js + Express + MongoDB (Mongoose) API — deploy as its own Vercel project
    ├── api/index.js         Vercel serverless entry point
    ├── vercel.json
    ├── models/ controllers/ routes/ middleware/ config/
    ├── server.js
    ├── seed.js              Sample menu + your first real admin login
    └── README.md            Backend-specific setup
```

## Your admin panel URL

The admin dashboard file lives at a filename that isn't `admin.html`, so customers
browsing the storefront have no obvious link to click:

- Current filename: **`iamadmin.html`**
- There is **no link to it anywhere on the public site** — bookmark the full URL
  yourself after deploying, e.g. `https://your-frontend-project.vercel.app/iamadmin`.
- It's **not listed in `robots.txt`** on purpose — putting a "secret" path in
  `robots.txt` would actually publish it to anyone who reads that file. Instead, the
  page itself has a `noindex, nofollow` meta tag, which keeps it out of Google without
  disclosing the path publicly.
- This is obscurity, not real access control — the JWT login is still the actual
  security boundary. Don't rely on the filename alone; use a strong admin password.
  Worth knowing: `iamadmin` is short and guessable by a determined person poking
  around common admin paths, more so than a random suffix would be — if you want
  stronger obscurity later, swap it for something like
  `admin-<random-hex>.html` (generate one with
  `python3 -c "import secrets; print('admin-' + secrets.token_hex(8))"`).
- **To rename it again later:** rename the file and update nothing else —
  everything else references the admin page only via that one filename, since there
  are no other links to it in the project.

## How the two halves connect

- The **admin panel requires a real backend.** There is no demo/offline login anymore —
  if the API is unreachable or the credentials are wrong, sign-in fails with a clear
  error. Accounts are created by `backend/seed.js` (or directly in MongoDB).
- **Promo code validation always hits the live API.** If the backend is unreachable,
  checkout shows "could not verify this code" rather than silently approving a sample
  code.
- The **storefront menu/offers/settings** still have a sample-data fallback in
  `js/data.js` purely so the page isn't blank if the API hiccups for a moment — this
  does not apply to login or promo codes.

## Deploying to Vercel (recommended path)

Deploy the backend and frontend as **two separate Vercel projects** from this same
repo (Vercel lets you set a different "Root Directory" per project).

### 1) Backend project

1. In Vercel, **Add New → Project**, import this repo, and set **Root Directory** to
   `backend`.
2. Framework Preset: **Other**. Build command / output directory: leave blank — this
   is a serverless function (`api/index.js` + `vercel.json` already handle routing).
3. Add these **Environment Variables** (Project Settings → Environment Variables),
   for both Production and Preview:

   | Variable | Example value | Notes |
   |---|---|---|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/foundry-flame` | Create a free cluster at mongodb.com/atlas. In Atlas, allow network access from `0.0.0.0/0` (Vercel's IPs aren't static). |
   | `JWT_SECRET` | a long random string | Generate one with `openssl rand -hex 32`. |
   | `JWT_EXPIRES_IN` | `7d` | Optional, defaults to `7d`. |
   | `CORS_ORIGIN` | `https://your-frontend-project.vercel.app` | Comma-separate multiple domains once you add a custom domain. |
   | `SEED_ADMIN_EMAIL` | `owner@yourrestaurant.com` | Only used by `npm run seed`, not needed at runtime. |
   | `SEED_ADMIN_PASSWORD` | a strong password | Only used by `npm run seed`. |

4. Deploy. Note the resulting URL, e.g. `https://foundry-flame-backend.vercel.app`.
5. Seed your database and first admin account **from your own machine** (Vercel
   doesn't run one-off scripts): create a local `backend/.env` with the same
   `MONGO_URI`/`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`, then run:
   ```bash
   cd backend
   npm install
   npm run seed
   ```
6. Confirm it's live: visit `https://your-backend-project.vercel.app/api/health` —
   you should see `{"status":"ok", ...}`.

### 2) Frontend project

1. **Add New → Project** again on the same repo, set **Root Directory** to `frontend`.
2. Framework Preset: **Other** (it's plain HTML/CSS/JS — no build step, no env vars
   needed for this project).
3. Before or after deploying, edit `frontend/js/config.js`:
   ```js
   window.__API_BASE__ = 'https://your-backend-project.vercel.app/api';
   ```
   Commit and push (or redeploy) so the live site picks it up.
4. Deploy. Visit the resulting URL — the storefront should load, and
   your admin URL (see "Your admin panel URL" below) should let you sign in with the account created in step 1.5.
5. Go back to the **backend** project's `CORS_ORIGIN` env variable and make sure it
   matches this frontend URL exactly, then redeploy the backend if you changed it.

### Post-deploy checklist

- [ ] `GET /api/health` on the backend returns `{"status":"ok"}`
- [ ] Admin login at your admin URL succeeds with the seeded account, and fails with a
      visible error on a wrong password (no silent demo access)
- [ ] A menu item edited in the admin panel shows up on the storefront within a page
      refresh
- [ ] Applying a real promo code at checkout works; a fake one shows "not valid"
- [ ] Checkout → Place Order opens WhatsApp with the order pre-filled, and on mobile
      the "Place Order" button is fully visible without scrolling the page
- [ ] Restaurant Settings → WhatsApp Number is your real number (digits + country
      code, e.g. `923001234567`)

## Local development (no Vercel)

**Backend:**
```bash
cd backend
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, SEED_ADMIN_EMAIL/PASSWORD
npm run seed
npm run dev                 # http://localhost:5000
```

**Frontend:** set `window.__API_BASE__` in `frontend/js/config.js` to
`http://localhost:5000/api`, then open `frontend/index.html` directly or serve the
folder (`npx serve frontend`).

## Before going live for a real restaurant

- Set the real `whatsappNumber` in Restaurant Settings — this is what checkout and the
  contact form message.
- Replace the sample menu/offers/promo codes (seeded by `backend/seed.js`) with your
  real ones via the admin panel, or delete and re-seed with your own data.
- Use a strong, unique `JWT_SECRET` and a real admin password — never the sample
  values from `.env.example`.
