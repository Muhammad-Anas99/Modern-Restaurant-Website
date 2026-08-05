/**
 * Thin API client. Set API_BASE to your deployed backend
 * (see /backend, or the README) once it's live — e.g.
 *   const API_BASE = 'https://api.yourrestaurant.com/api';
 * Until then, every call below fails fast and the app falls back
 * to the bundled sample data in js/data.js so the site still works.
 */
// Strip any trailing slash so `${API_BASE}${path}` never produces a double slash
// (e.g. config.js set to '.../api/' would otherwise build '.../api//auth/login',
// which Vercel's rewrite won't match — showing up in the browser as "Failed to fetch").
const API_BASE = (window.__API_BASE__ || '/api').replace(/\/+$/, '');
// 12s, not 4s: a cold serverless start connecting to MongoDB for the first time can
// take longer than a few seconds, and a too-short timeout here just masks the real
// error behind a confusing "signal aborted" instead of showing what actually failed.
const FETCH_TIMEOUT = 12000;

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request failed (${res.status})`);
    }
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

const Api = {
  async getFoods() {
    try { return await apiRequest('/foods'); } catch { return SAMPLE_FOODS; }
  },
  async getCategories() {
    try { return await apiRequest('/categories'); } catch { return SAMPLE_CATEGORIES; }
  },
  async getOffers() {
    try { return await apiRequest('/offers?activeOnly=true'); } catch { return SAMPLE_OFFERS; }
  },
  async getSettings() {
    try { return await apiRequest('/settings'); } catch { return SAMPLE_SETTINGS; }
  },
  async validatePromo(code, subtotal) {
    try {
      return await apiRequest('/promo-codes/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      });
    } catch {
      // Demo/offline promo validation has been disabled — a promo code must always be
      // checked against the live database, never approved locally against sample data.
      return { valid: false, reason: 'Could not verify this code right now. Please try again in a moment.' };
    }
  },
  async placeOrder(payload) {
    try {
      return await apiRequest('/orders', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      // Offline fallback: still succeed locally so checkout/WhatsApp flow works in demo mode
      return { orderNumber: `DEMO-${Date.now().toString(36).toUpperCase()}`, ...payload };
    }
  }
};