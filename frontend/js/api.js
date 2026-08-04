/**
 * Thin API client. Set API_BASE to your deployed backend
 * (see /backend, or the README) once it's live — e.g.
 *   const API_BASE = 'https://api.yourrestaurant.com/api';
 * Until then, every call below fails fast and the app falls back
 * to the bundled sample data in js/data.js so the site still works.
 */
const API_BASE = window.__API_BASE__ || 'http://localhost:5000/api';
const FETCH_TIMEOUT = 4000;

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
      // Offline fallback: validate against the bundled sample codes
      const promo = SAMPLE_PROMO_CODES.find((p) => p.code === code.toUpperCase());
      if (!promo) return { valid: false, reason: 'That promo code does not exist.' };
      if (subtotal < (promo.minOrderAmount || 0)) {
        return { valid: false, reason: `Minimum order amount is ${promo.minOrderAmount}.` };
      }
      let discount = promo.discountType === 'percentage' ? (subtotal * promo.discountValue) / 100 : promo.discountValue;
      if (promo.maxDiscountAmount != null) discount = Math.min(discount, promo.maxDiscountAmount);
      return { valid: true, discount: Math.round(Math.min(discount, subtotal) * 100) / 100 };
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
