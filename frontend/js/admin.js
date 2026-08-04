(() => {
  'use strict';

  const state = {
    token: null,
    user: null,
    demoMode: false, // true when no backend responded, so we operate on local sample data only
    foods: [],
    categories: [],
    offers: [],
    promoCodes: [],
    orders: [],
    settings: SAMPLE_SETTINGS,
    currentView: 'dashboard'
  };

  const money = (n) => `${state.settings.currencySymbol || 'Rs.'} ${Math.round(n || 0).toLocaleString()}`;
  const uid = () => 'id-' + Math.random().toString(36).slice(2, 10);

  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  async function authedRequest(path, options = {}) {
    return apiRequest(path, {
      ...options,
      headers: { Authorization: `Bearer ${state.token}`, ...(options.headers || {}) }
    });
  }

  /* ---------------- Auth ---------------- */
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';

    try {
      const res = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      state.token = res.token;
      state.user = res.user;
      state.demoMode = false;
      await enterAdmin();
    } catch (err) {
      // No live backend reachable — fall back to a local demo session so the panel is still usable.
      state.token = 'demo-token';
      state.user = { name: 'Demo Admin', email: email || 'demo@foundryflame.com' };
      state.demoMode = true;
      toast('No backend connected — showing demo mode with sample data.', 'error');
      await enterAdmin();
    }
  });

  async function enterAdmin() {
    // Use inline style, not the `hidden` attribute: admin.css sets an unconditional
    // `display` on both .admin-login and .admin-shell, and an author stylesheet rule
    // always beats the browser's default `[hidden] { display: none }` rule at equal
    // specificity — so `.hidden = true/false` was silently doing nothing.
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminShell').style.display = '';
    document.getElementById('adminUser').textContent = `${state.user.name} · ${state.user.email}`;
    await loadAllData();
    switchView('dashboard');
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.token = null;
    document.getElementById('adminShell').style.display = 'none';
    document.getElementById('adminLogin').style.display = '';
    document.getElementById('loginForm').reset();
  });

  /* ---------------- Data loading ---------------- */
  async function loadAllData() {
    if (state.demoMode) {
      state.foods = JSON.parse(JSON.stringify(SAMPLE_FOODS));
      state.categories = JSON.parse(JSON.stringify(SAMPLE_CATEGORIES));
      state.offers = JSON.parse(JSON.stringify(SAMPLE_OFFERS)).map((o) => ({ ...o, active: true, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }));
      state.promoCodes = JSON.parse(JSON.stringify(SAMPLE_PROMO_CODES)).map((p) => ({ ...p, _id: uid(), active: true, usageCount: 0, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString() }));
      state.orders = [];
      state.settings = { ...SAMPLE_SETTINGS };
    } else {
      const [foods, categories, offers, promoCodes, orders, settings] = await Promise.all([
        authedRequest('/foods'), authedRequest('/categories'), authedRequest('/offers'),
        authedRequest('/promo-codes'), authedRequest('/orders'), authedRequest('/settings')
      ]);
      state.foods = foods; state.categories = categories; state.offers = offers;
      state.promoCodes = promoCodes; state.orders = orders; state.settings = settings;
    }
    renderAll();
  }

  function renderAll() {
    renderDashboard();
    renderFoodTable();
    renderCategoryTable();
    renderOrderTable();
    renderOfferTable();
    renderPromoTable();
    fillSettingsForm();
  }

  /* ---------------- Nav / view switching ---------------- */
  const viewTitles = { dashboard: 'Dashboard', menu: 'Menu Management', categories: 'Categories', orders: 'Orders', offers: 'Offers', promocodes: 'Promo Codes', settings: 'Restaurant Settings' };
  document.getElementById('adminNav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (!btn) return;
    switchView(btn.dataset.view);
  });
  function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('#adminNav button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.admin-view').forEach((v) => v.hidden = v.id !== `view-${view}`);
    document.getElementById('viewTitle').textContent = viewTitles[view];
    document.querySelector('.admin-sidebar').classList.remove('open');
  }
  document.getElementById('adminMobileToggle').addEventListener('click', () => {
    document.querySelector('.admin-sidebar').classList.toggle('open');
  });

  /* ---------------- Dashboard ---------------- */
  function renderDashboard() {
    const totalOrders = state.orders.length;
    const pendingOrders = state.orders.filter((o) => o.status === 'Pending').length;
    const totalFoods = state.foods.length;
    const activeOffers = state.offers.filter((o) => o.active).length;

    document.getElementById('statGrid').innerHTML = `
      <div class="stat-card"><span class="stat-icon">🍽</span><div class="stat-label">Menu Items</div><div class="stat-value">${totalFoods}</div></div>
      <div class="stat-card"><span class="stat-icon">🎯</span><div class="stat-label">Active Offers</div><div class="stat-value">${activeOffers}</div></div>
      <div class="stat-card"><span class="stat-icon">📦</span><div class="stat-label">Total Orders</div><div class="stat-value">${totalOrders}</div></div>
      <div class="stat-card"><span class="stat-icon">⏳</span><div class="stat-label">Pending Orders</div><div class="stat-value">${pendingOrders}</div></div>`;

    const recent = [...state.orders].slice(0, 6);
    document.getElementById('recentOrders').innerHTML = recent.length
      ? recent.map((o) => `<div class="mini-row"><span>${o.customerName} · ${o.orderNumber || ''}</span><span>${money(o.grandTotal)}</span></div>`).join('')
      : `<p class="muted">No orders yet — place a test order from the storefront.</p>`;

    const liveOffers = state.offers.filter((o) => o.active);
    document.getElementById('dashOffers').innerHTML = liveOffers.length
      ? liveOffers.map((o) => `<div class="mini-row"><span>${o.title}</span><span>${o.discountLabel}</span></div>`).join('')
      : `<p class="muted">No active offers.</p>`;
  }

  /* ---------------- Menu Management ---------------- */
  function categoryName(catId) {
    const c = state.categories.find((c) => c._id === catId || c._id === (catId?._id));
    return c ? c.name : '—';
  }

  function renderFoodTable(filter = '') {
    const rows = state.foods
      .filter((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
      .map((f) => {
        const catId = typeof f.category === 'object' ? f.category?._id : f.category;
        const sale = f.salePrice != null && f.salePrice < f.originalPrice;
        const flags = [
          f.isFeatured ? '<span class="pill pill-gold">Featured</span>' : '',
          f.isPopular ? '<span class="pill pill-green">Popular</span>' : '',
          f.isBestseller ? '<span class="pill pill-gold">Bestseller</span>' : ''
        ].filter(Boolean).join(' ');
        return `
        <tr data-id="${f._id}">
          <td><img class="thumb" src="${f.image}" alt=""></td>
          <td>${f.name}</td>
          <td>${categoryName(catId)}</td>
          <td>${sale ? `<s class="muted">${money(f.originalPrice)}</s> ${money(f.salePrice)}` : money(f.originalPrice)}</td>
          <td>${f.isAvailable === false ? '<span class="pill pill-red">Unavailable</span>' : '<span class="pill pill-green">Available</span>'}</td>
          <td>${flags || '—'}</td>
          <td><div class="row-actions"><button data-action="edit-food">Edit</button><button data-action="delete-food" class="danger">Delete</button></div></td>
        </tr>`;
      }).join('');
    document.getElementById('foodTableBody').innerHTML = rows || `<tr><td colspan="7" class="muted" style="padding:24px;">No items found.</td></tr>`;
  }

  document.getElementById('menuSearch').addEventListener('input', (e) => renderFoodTable(e.target.value));
  document.getElementById('addFoodBtn').addEventListener('click', () => openFoodModal());

  document.getElementById('foodTableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.dataset.action === 'edit-food') openFoodModal(state.foods.find((f) => f._id === id));
    if (e.target.dataset.action === 'delete-food') deleteFood(id);
  });

  function openFoodModal(food = null) {
    const isEdit = !!food;
    const categoryOptions = state.categories.map((c) => `<option value="${c._id}" ${food && (food.category === c._id || food.category?._id === c._id) ? 'selected' : ''}>${c.name}</option>`).join('');
    openModal(isEdit ? 'Edit Food Item' : 'Add Food Item', `
      <div class="field"><label>Name</label><input id="fName" value="${food?.name || ''}"></div>
      <div class="field"><label>Description</label><textarea id="fDesc" rows="2">${food?.description || ''}</textarea></div>
      <div class="field"><label>Category</label><select id="fCategory">${categoryOptions}</select></div>
      <div class="field"><label>Image URL</label><input id="fImage" value="${food?.image || ''}"></div>
      <div class="check-grid">
        <div class="field"><label>Original Price</label><input type="number" id="fOriginalPrice" value="${food?.originalPrice || ''}"></div>
        <div class="field"><label>Sale Price <span class="optional">(optional)</span></label><input type="number" id="fSalePrice" value="${food?.salePrice ?? ''}"></div>
      </div>
      <div class="check-grid">
        <label class="check-row"><input type="checkbox" id="fAvailable" ${food?.isAvailable !== false ? 'checked' : ''}> Available</label>
        <label class="check-row"><input type="checkbox" id="fFeatured" ${food?.isFeatured ? 'checked' : ''}> Featured</label>
        <label class="check-row"><input type="checkbox" id="fPopular" ${food?.isPopular ? 'checked' : ''}> Popular</label>
        <label class="check-row"><input type="checkbox" id="fBestseller" ${food?.isBestseller ? 'checked' : ''}> Bestseller</label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSave">${isEdit ? 'Save Changes' : 'Add Item'}</button>
      </div>
    `);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', () => saveFood(food?._id));
  }

  async function saveFood(id) {
    const payload = {
      name: val('fName'), description: val('fDesc'), category: val('fCategory'), image: val('fImage'),
      originalPrice: Number(val('fOriginalPrice')) || 0,
      salePrice: val('fSalePrice') === '' ? null : Number(val('fSalePrice')),
      isAvailable: document.getElementById('fAvailable').checked,
      isFeatured: document.getElementById('fFeatured').checked,
      isPopular: document.getElementById('fPopular').checked,
      isBestseller: document.getElementById('fBestseller').checked
    };
    if (!payload.name || !payload.image || !payload.originalPrice) { toast('Please fill in name, image, and price.', 'error'); return; }

    try {
      if (state.demoMode) {
        if (id) Object.assign(state.foods.find((f) => f._id === id), payload);
        else state.foods.unshift({ _id: uid(), rating: 4.5, ratingCount: 0, ...payload });
      } else if (id) {
        const updated = await authedRequest(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        Object.assign(state.foods.find((f) => f._id === id), updated);
      } else {
        const created = await authedRequest('/foods', { method: 'POST', body: JSON.stringify(payload) });
        state.foods.unshift(created);
      }
      toast(id ? 'Item updated' : 'Item added');
      renderFoodTable(); renderDashboard(); closeModal();
    } catch (err) {
      toast(err.message || 'Could not save item.', 'error');
    }
  }

  async function deleteFood(id) {
    if (!confirm('Delete this food item?')) return;
    try {
      if (!state.demoMode) await authedRequest(`/foods/${id}`, { method: 'DELETE' });
      state.foods = state.foods.filter((f) => f._id !== id);
      renderFoodTable(); renderDashboard();
      toast('Item deleted');
    } catch (err) { toast(err.message || 'Could not delete item.', 'error'); }
  }

  /* ---------------- Categories ---------------- */
  function renderCategoryTable() {
    document.getElementById('categoryTableBody').innerHTML = state.categories.map((c) => `
      <tr data-id="${c._id}">
        <td style="font-size:1.2rem;">${c.icon || '🍴'}</td>
        <td>${c.name}</td>
        <td class="muted">${c.slug}</td>
        <td>${c.active !== false ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-gray">Inactive</span>'}</td>
        <td><div class="row-actions"><button data-action="edit-cat">Edit</button><button data-action="delete-cat" class="danger">Delete</button></div></td>
      </tr>`).join('') || `<tr><td colspan="5" class="muted" style="padding:24px;">No categories yet.</td></tr>`;
  }

  document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal());
  document.getElementById('categoryTableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr'); if (!row) return;
    const id = row.dataset.id;
    if (e.target.dataset.action === 'edit-cat') openCategoryModal(state.categories.find((c) => c._id === id));
    if (e.target.dataset.action === 'delete-cat') deleteCategory(id);
  });

  function openCategoryModal(cat = null) {
    openModal(cat ? 'Edit Category' : 'Add Category', `
      <div class="field"><label>Name</label><input id="catName" value="${cat?.name || ''}"></div>
      <div class="field"><label>Icon <span class="optional">(emoji)</span></label><input id="catIcon" value="${cat?.icon || ''}"></div>
      <label class="check-row"><input type="checkbox" id="catActive" ${cat?.active !== false ? 'checked' : ''}> Active</label>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSave">${cat ? 'Save Changes' : 'Add Category'}</button>
      </div>`);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', () => saveCategory(cat?._id));
  }

  async function saveCategory(id) {
    const name = val('catName');
    if (!name) { toast('Category name is required.', 'error'); return; }
    const payload = { name, icon: val('catIcon'), active: document.getElementById('catActive').checked };
    try {
      if (state.demoMode) {
        if (id) Object.assign(state.categories.find((c) => c._id === id), payload);
        else state.categories.push({ _id: uid(), slug: name.toLowerCase().replace(/\s+/g, '-'), ...payload });
      } else if (id) {
        const updated = await authedRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        Object.assign(state.categories.find((c) => c._id === id), updated);
      } else {
        const created = await authedRequest('/categories', { method: 'POST', body: JSON.stringify(payload) });
        state.categories.push(created);
      }
      toast(id ? 'Category updated' : 'Category added');
      renderCategoryTable(); renderFoodTable(); closeModal();
    } catch (err) { toast(err.message || 'Could not save category.', 'error'); }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category? Items using it will need reassigning.')) return;
    try {
      if (!state.demoMode) await authedRequest(`/categories/${id}`, { method: 'DELETE' });
      state.categories = state.categories.filter((c) => c._id !== id);
      renderCategoryTable();
      toast('Category deleted');
    } catch (err) { toast(err.message || 'Could not delete category.', 'error'); }
  }

  /* ---------------- Orders ---------------- */
  const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled'];
  document.getElementById('orderStatusFilter').innerHTML += ORDER_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('');

  function renderOrderTable() {
    const filter = document.getElementById('orderStatusFilter').value;
    const rows = state.orders.filter((o) => !filter || o.status === filter);
    document.getElementById('orderTableBody').innerHTML = rows.length ? rows.map((o) => `
      <tr data-id="${o._id || o.orderNumber}">
        <td>${o.orderNumber || '—'}</td>
        <td>${o.customerName}<br><span class="muted">${o.phone}</span></td>
        <td>${(o.items || []).map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td>
        <td>${money(o.grandTotal)}</td>
        <td>
          <select class="status-select" data-id="${o._id || o.orderNumber}">
            ${ORDER_STATUSES.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td class="muted">${o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
      </tr>`).join('') : `<tr><td colspan="6" class="muted" style="padding:24px;">No orders yet.</td></tr>`;
  }
  document.getElementById('orderStatusFilter').addEventListener('change', renderOrderTable);
  document.getElementById('orderTableBody').addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-select')) return;
    const id = e.target.dataset.id;
    const status = e.target.value;
    try {
      if (!state.demoMode) await authedRequest(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const order = state.orders.find((o) => (o._id || o.orderNumber) === id);
      if (order) order.status = status;
      toast('Order status updated');
      renderDashboard();
    } catch (err) { toast(err.message || 'Could not update status.', 'error'); }
  });

  /* ---------------- Offers ---------------- */
  function renderOfferTable() {
    document.getElementById('offerTableBody').innerHTML = state.offers.map((o) => `
      <tr data-id="${o._id}">
        <td><img class="thumb" src="${o.bannerImage}" alt=""></td>
        <td>${o.title}</td>
        <td>${o.discountLabel}</td>
        <td class="muted">${o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : '—'}</td>
        <td>${o.active ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-gray">Inactive</span>'}</td>
        <td><div class="row-actions"><button data-action="edit-offer">Edit</button><button data-action="delete-offer" class="danger">Delete</button></div></td>
      </tr>`).join('') || `<tr><td colspan="6" class="muted" style="padding:24px;">No offers yet.</td></tr>`;
  }
  document.getElementById('addOfferBtn').addEventListener('click', () => openOfferModal());
  document.getElementById('offerTableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr'); if (!row) return;
    const id = row.dataset.id;
    if (e.target.dataset.action === 'edit-offer') openOfferModal(state.offers.find((o) => o._id === id));
    if (e.target.dataset.action === 'delete-offer') deleteOffer(id);
  });

  function openOfferModal(offer = null) {
    const expires = offer?.expiresAt ? new Date(offer.expiresAt).toISOString().slice(0, 10) : '';
    openModal(offer ? 'Edit Offer' : 'Add Offer', `
      <div class="field"><label>Title</label><input id="ofTitle" value="${offer?.title || ''}"></div>
      <div class="field"><label>Description</label><textarea id="ofDesc" rows="2">${offer?.description || ''}</textarea></div>
      <div class="field"><label>Banner Image URL</label><input id="ofBanner" value="${offer?.bannerImage || ''}"></div>
      <div class="field"><label>Discount Label</label><input id="ofDiscount" placeholder="20% OFF" value="${offer?.discountLabel || ''}"></div>
      <div class="field"><label>Expires</label><input type="date" id="ofExpires" value="${expires}"></div>
      <label class="check-row"><input type="checkbox" id="ofActive" ${offer?.active !== false ? 'checked' : ''}> Active</label>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSave">${offer ? 'Save Changes' : 'Add Offer'}</button>
      </div>`);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', () => saveOffer(offer?._id));
  }

  async function saveOffer(id) {
    const payload = {
      title: val('ofTitle'), description: val('ofDesc'), bannerImage: val('ofBanner'),
      discountLabel: val('ofDiscount'), expiresAt: val('ofExpires') || new Date(Date.now() + 30 * 86400000).toISOString(),
      active: document.getElementById('ofActive').checked
    };
    if (!payload.title || !payload.bannerImage) { toast('Title and banner image are required.', 'error'); return; }
    try {
      if (state.demoMode) {
        if (id) Object.assign(state.offers.find((o) => o._id === id), payload);
        else state.offers.unshift({ _id: uid(), ...payload });
      } else if (id) {
        const updated = await authedRequest(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        Object.assign(state.offers.find((o) => o._id === id), updated);
      } else {
        const created = await authedRequest('/offers', { method: 'POST', body: JSON.stringify(payload) });
        state.offers.unshift(created);
      }
      toast(id ? 'Offer updated' : 'Offer added');
      renderOfferTable(); renderDashboard(); closeModal();
    } catch (err) { toast(err.message || 'Could not save offer.', 'error'); }
  }

  async function deleteOffer(id) {
    if (!confirm('Delete this offer?')) return;
    try {
      if (!state.demoMode) await authedRequest(`/offers/${id}`, { method: 'DELETE' });
      state.offers = state.offers.filter((o) => o._id !== id);
      renderOfferTable(); renderDashboard();
      toast('Offer deleted');
    } catch (err) { toast(err.message || 'Could not delete offer.', 'error'); }
  }

  /* ---------------- Promo Codes ---------------- */
  function renderPromoTable() {
    document.getElementById('promoTableBody').innerHTML = state.promoCodes.map((p) => `
      <tr data-id="${p._id}">
        <td><strong>${p.code}</strong></td>
        <td>${p.discountType === 'percentage' ? 'Percentage' : 'Fixed'}</td>
        <td>${p.discountType === 'percentage' ? p.discountValue + '%' : money(p.discountValue)}</td>
        <td>${money(p.minOrderAmount || 0)}</td>
        <td>${p.usageCount || 0}${p.usageLimit ? ' / ' + p.usageLimit : ''}</td>
        <td class="muted">${p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : '—'}</td>
        <td>${p.active !== false ? '<span class="pill pill-green">Active</span>' : '<span class="pill pill-gray">Inactive</span>'}</td>
        <td><div class="row-actions"><button data-action="edit-promo">Edit</button><button data-action="delete-promo" class="danger">Delete</button></div></td>
      </tr>`).join('') || `<tr><td colspan="8" class="muted" style="padding:24px;">No promo codes yet.</td></tr>`;
  }
  document.getElementById('addPromoBtn').addEventListener('click', () => openPromoModal());
  document.getElementById('promoTableBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr'); if (!row) return;
    const id = row.dataset.id;
    if (e.target.dataset.action === 'edit-promo') openPromoModal(state.promoCodes.find((p) => p._id === id));
    if (e.target.dataset.action === 'delete-promo') deletePromo(id);
  });

  function openPromoModal(promo = null) {
    const expires = promo?.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 10) : '';
    openModal(promo ? 'Edit Promo Code' : 'Add Promo Code', `
      <div class="field"><label>Code</label><input id="pCode" style="text-transform:uppercase" value="${promo?.code || ''}"></div>
      <div class="check-grid">
        <div class="field"><label>Discount Type</label>
          <select id="pType">
            <option value="percentage" ${promo?.discountType === 'percentage' ? 'selected' : ''}>Percentage</option>
            <option value="fixed" ${promo?.discountType === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
          </select>
        </div>
        <div class="field"><label>Value</label><input type="number" id="pValue" value="${promo?.discountValue || ''}"></div>
      </div>
      <div class="check-grid">
        <div class="field"><label>Min Order Amount</label><input type="number" id="pMin" value="${promo?.minOrderAmount || 0}"></div>
        <div class="field"><label>Max Discount <span class="optional">(optional)</span></label><input type="number" id="pMax" value="${promo?.maxDiscountAmount ?? ''}"></div>
      </div>
      <div class="check-grid">
        <div class="field"><label>Usage Limit <span class="optional">(optional)</span></label><input type="number" id="pLimit" value="${promo?.usageLimit ?? ''}"></div>
        <div class="field"><label>Expires</label><input type="date" id="pExpires" value="${expires}"></div>
      </div>
      <label class="check-row"><input type="checkbox" id="pActive" ${promo?.active !== false ? 'checked' : ''}> Active</label>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">Cancel</button>
        <button class="btn btn-primary" id="modalSave">${promo ? 'Save Changes' : 'Add Code'}</button>
      </div>`);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    document.getElementById('modalSave').addEventListener('click', () => savePromo(promo?._id));
  }

  async function savePromo(id) {
    const payload = {
      code: val('pCode').toUpperCase(), discountType: val('pType'), discountValue: Number(val('pValue')) || 0,
      minOrderAmount: Number(val('pMin')) || 0,
      maxDiscountAmount: val('pMax') === '' ? null : Number(val('pMax')),
      usageLimit: val('pLimit') === '' ? null : Number(val('pLimit')),
      expiresAt: val('pExpires') || new Date(Date.now() + 30 * 86400000).toISOString(),
      active: document.getElementById('pActive').checked
    };
    if (!payload.code || !payload.discountValue) { toast('Code and value are required.', 'error'); return; }
    try {
      if (state.demoMode) {
        if (id) Object.assign(state.promoCodes.find((p) => p._id === id), payload);
        else state.promoCodes.unshift({ _id: uid(), usageCount: 0, ...payload });
      } else if (id) {
        const updated = await authedRequest(`/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        Object.assign(state.promoCodes.find((p) => p._id === id), updated);
      } else {
        const created = await authedRequest('/promo-codes', { method: 'POST', body: JSON.stringify(payload) });
        state.promoCodes.unshift(created);
      }
      toast(id ? 'Promo code updated' : 'Promo code added');
      renderPromoTable(); closeModal();
    } catch (err) { toast(err.message || 'Could not save promo code.', 'error'); }
  }

  async function deletePromo(id) {
    if (!confirm('Delete this promo code?')) return;
    try {
      if (!state.demoMode) await authedRequest(`/promo-codes/${id}`, { method: 'DELETE' });
      state.promoCodes = state.promoCodes.filter((p) => p._id !== id);
      renderPromoTable();
      toast('Promo code deleted');
    } catch (err) { toast(err.message || 'Could not delete promo code.', 'error'); }
  }

  /* ---------------- Settings ---------------- */
  function fillSettingsForm() {
    const s = state.settings;
    document.getElementById('setName').value = s.restaurantName || '';
    document.getElementById('setTagline').value = s.tagline || '';
    document.getElementById('setWhatsapp').value = s.whatsappNumber || '';
    document.getElementById('setContact').value = s.contactNumber || '';
    document.getElementById('setDeliveryFee').value = s.deliveryFee ?? 0;
    document.getElementById('setFreeDelivery').value = s.freeDeliveryThreshold ?? 0;
    document.getElementById('setCurrency').value = s.currencySymbol || 'Rs.';
    document.getElementById('setHours').value = s.businessHours || '';
    document.getElementById('setAddress').value = s.address || '';
  }

  document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      restaurantName: val('setName'), tagline: val('setTagline'), whatsappNumber: val('setWhatsapp'),
      contactNumber: val('setContact'), deliveryFee: Number(val('setDeliveryFee')) || 0,
      freeDeliveryThreshold: Number(val('setFreeDelivery')) || 0, currencySymbol: val('setCurrency'),
      businessHours: val('setHours'), address: val('setAddress')
    };
    try {
      if (state.demoMode) {
        Object.assign(state.settings, payload);
      } else {
        const updated = await authedRequest('/settings', { method: 'PUT', body: JSON.stringify(payload) });
        state.settings = updated;
      }
      toast('Settings saved — changes reflect on the storefront instantly.');
      renderDashboard();
    } catch (err) { toast(err.message || 'Could not save settings.', 'error'); }
  });

  /* ---------------- Modal helpers ---------------- */
  const modal = document.getElementById('adminModal');
  const modalOverlay = document.getElementById('modalOverlay');
  function openModal(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    modal.classList.add('open');
    modalOverlay.classList.add('open');
  }
  function closeModal() {
    modal.classList.remove('open');
    modalOverlay.classList.remove('open');
  }
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);
  function val(id) { return document.getElementById(id).value.trim(); }
})();
