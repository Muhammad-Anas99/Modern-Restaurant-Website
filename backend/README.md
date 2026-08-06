# Foundry & Flame — Backend API

Node.js + Express + MongoDB (Mongoose) API powering the ordering platform: menu, categories,
offers, promo codes, orders, and restaurant settings, with JWT-protected admin routes.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET, etc.
npm run seed            # creates sample menu data + your first admin login
npm run dev              # starts the API on http://localhost:5000
```

`MONGO_URI` can point at a local MongoDB instance or a free MongoDB Atlas cluster
(recommended for production — see mongodb.com/atlas).

## Image uploads

`POST /api/uploads` (admin-only, `multipart/form-data`, field name `image`) uploads a
menu/offer image and returns `{ url }`. It streams the file straight to
[Vercel Blob](https://vercel.com/docs/storage/vercel-blob) — nothing is written to
local disk, which matters because Vercel's serverless filesystem is read-only/ephemeral.

To enable it:
1. Vercel dashboard → your **backend** project → **Storage** → **Create Database** → **Blob**.
2. Connect it to the project — Vercel adds `BLOB_READ_WRITE_TOKEN` to your environment
   variables automatically.
3. For local development, copy that same token: **Storage → your Blob store → .env.local**
   tab, and paste it into your local `backend/.env` as `BLOB_READ_WRITE_TOKEN=...`.

Without this token, image uploads return a clear 500 error telling you it's not
configured — pasting an image URL directly still works either way.

## Auth

`POST /api/auth/login` with `{ email, password }` returns a JWT. Send it as
`Authorization: Bearer <token>` on every admin request. The seed script creates
the first admin account from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`.

## Routes overview

| Resource | Public | Admin (JWT required) |
|---|---|---|
| `/api/foods` | `GET /`, `GET /:id` | `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/categories` | `GET /` | `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/offers` | `GET /?activeOnly=true` | `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/promo-codes` | `POST /validate` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/orders` | `POST /` (place order) | `GET /`, `GET /stats`, `PATCH /:id/status` |
| `/api/settings` | `GET /` | `PUT /` |
| `/api/uploads` | — | `POST /` (multipart `image` field) |

A discounted food item automatically exposes `effectivePrice` and `discountPercent` — the
frontend never needs manual math, so a sale price set in the admin panel is reflected
everywhere instantly.

## Deploying

Any Node host works (Render, Railway, Fly.io, a VPS, or Vercel — see below). Point
`MONGO_URI` at Atlas, set `CORS_ORIGIN` to your deployed frontend domain(s), and set
a strong `JWT_SECRET`.

### Deploying this backend to Vercel

This folder already includes `vercel.json` and `api/index.js` so it runs as a Vercel
serverless function — see the root `README.md` for the full step-by-step guide
(project setup, required environment variables, and how to connect the frontend
to it once it's live).
