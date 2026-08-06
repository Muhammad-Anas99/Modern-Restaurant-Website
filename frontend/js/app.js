(() => {
  'use strict';

  /* ---------------- State ---------------- */
  const state = {
    foods: [],
    categories: [],
    offers: [],
    settings: SAMPLE_SETTINGS,
    activeCategory: 'all',
    searchTerm: '',
    cart: [], // [{ foodId, name, price, image, quantity }]
    promo: null, // { code, discount }
    pendingOrder: null, // { payload, reference } — set when WhatsApp opens, cleared once confirmed sent
    testimonialIndex: 0
  };

  const money = (n) => `${state.settings.currencySymbol || 'Rs.'} ${Math.round(n).toLocaleString()}`;

  /* ---------------- Toasts ---------------- */
  function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  /* ---------------- Data loading ---------------- */
  async function loadData() {
    const [foods, categories, offers, settings] = await Promise.all([
      Api.getFoods(), Api.getCategories(), Api.getOffers(), Api.getSettings()
    ]);
    state.foods = foods;
    state.categories = categories;
    state.offers = offers;
    state.settings = settings;

    renderCategoryFilters();
    renderMenu();
    renderOffers();
    renderWhyChooseUs();
    renderGallery();
    renderTestimonials();
    renderFaqs();
    renderContactDetails();
    renderFooterMeta();
    wireWhatsappFloat();
  }

  /* ---------------- Category filters ---------------- */
  function renderCategoryFilters() {
    const wrap = document.getElementById('categoryFilters');
    const chips = state.categories.map(
      (c) => `<button class="chip" data-category="${c._id}">${c.icon || ''} ${c.name}</button>`
    );
    wrap.innerHTML = `<button class="chip active" data-category="all">All</button>` + chips.join('');
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      wrap.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      renderMenu();
    });
  }

  /* ---------------- Menu grid ---------------- */
  function categoryIdOf(food) {
    return typeof food.category === 'object' && food.category !== null ? food.category._id : food.category;
  }

  function renderMenu() {
    const grid = document.getElementById('menuGrid');
    const empty = document.getElementById('menuEmpty');
    const term = state.searchTerm.trim().toLowerCase();

    const items = state.foods.filter((f) => {
      const inCategory = state.activeCategory === 'all' || categoryIdOf(f) === state.activeCategory;
      const inSearch = !term || f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term);
      return inCategory && inSearch;
    });

    empty.hidden = items.length !== 0;
    grid.innerHTML = items.map(foodCardHtml).join('');
    revealOnScroll(grid.querySelectorAll('.food-card'));
  }

  function foodCardHtml(f) {
    const salePrice = f.salePrice != null && f.salePrice < f.originalPrice ? f.salePrice : null;
    const discountPct = salePrice ? Math.round(((f.originalPrice - salePrice) / f.originalPrice) * 100) : 0;
    const category = state.categories.find((c) => c._id === categoryIdOf(f));

    const badges = [];
    if (salePrice) badges.push(`<span class="badge badge-sale">-${discountPct}%</span>`);
    if (f.isBestseller) badges.push(`<span class="badge badge-bestseller">Bestseller</span>`);
    if (f.isAvailable === false) badges.push(`<span class="badge badge-unavailable">Sold Out</span>`);

    return `
    <article class="food-card" data-id="${f._id}">
      <div class="food-media">
        <img src="${f.image}" alt="${f.name}" loading="lazy">
        <div class="food-badges">${badges.join('')}</div>
      </div>
      <div class="food-body">
        ${category ? `<span class="food-cat">${category.name}</span>` : ''}
        <div class="food-top">
          <h3 class="food-name">${f.name}</h3>
          <span class="food-rating">
            <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.2L12 18l-6.4 3.7 1.4-7.2-5.3-5 7.2-.9z"/></svg>
            ${(f.rating || 0).toFixed(1)}
          </span>
        </div>
        <p class="food-desc">${f.description}</p>
        <div class="food-footer">
          <div class="food-price">
            <span class="price-current">${money(salePrice || f.originalPrice)}</span>
            ${salePrice ? `<span class="price-original">${money(f.originalPrice)}</span>` : ''}
          </div>
          <button class="add-btn" data-id="${f._id}" ${f.isAvailable === false ? 'disabled' : ''} aria-label="Add ${f.name} to cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </article>`;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (!btn || btn.disabled) return;
    addToCart(btn.dataset.id);
    btn.classList.add('added');
    const icon = btn.querySelector('svg');
    icon.innerHTML = '<path d="M20 6 9 17l-5-5"/>';
    setTimeout(() => {
      btn.classList.remove('added');
      icon.innerHTML = '<path d="M12 5v14M5 12h14"/>';
    }, 900);
  });

  /* ---------------- Cart ---------------- */
  function addToCart(foodId) {
    const food = state.foods.find((f) => f._id === foodId);
    if (!food) return;
    const price = food.salePrice != null && food.salePrice < food.originalPrice ? food.salePrice : food.originalPrice;
    const existing = state.cart.find((i) => i.foodId === foodId);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cart.push({ foodId, name: food.name, price, image: food.image, quantity: 1 });
    }
    renderCart();
    toast(`${food.name} added to cart`);
    bumpCartCount();
  }

  function changeQty(foodId, delta) {
    const item = state.cart.find((i) => i.foodId === foodId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) state.cart = state.cart.filter((i) => i.foodId !== foodId);
    renderCart();
  }

  function removeItem(foodId) {
    state.cart = state.cart.filter((i) => i.foodId !== foodId);
    renderCart();
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function deliveryFee(subtotal) {
    if (subtotal === 0) return 0;
    const threshold = state.settings.freeDeliveryThreshold;
    if (threshold != null && subtotal >= threshold) return 0;
    return state.settings.deliveryFee || 0;
  }

  function bumpCartCount() {
    const el = document.getElementById('cartCount');
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 400);
  }

  function renderCart() {
    const body = document.getElementById('cartBody');
    const count = state.cart.reduce((n, i) => n + i.quantity, 0);
    const countEl = document.getElementById('cartCount');
    countEl.textContent = count;
    countEl.classList.toggle('show', count > 0);

    if (state.cart.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <p>Your cart is empty.<br>Add something fresh off the fire.</p>
        </div>`;
    } else {
      body.innerHTML = state.cart.map((i) => `
        <div class="cart-item">
          <img src="${i.image}" alt="${i.name}">
          <div class="cart-item-info">
            <h5>${i.name}</h5>
            <div class="cart-item-price">${money(i.price)} each</div>
            <div class="cart-item-actions">
              <div class="qty-control">
                <button data-action="dec" data-id="${i.foodId}">−</button>
                <span>${i.quantity}</span>
                <button data-action="inc" data-id="${i.foodId}">+</button>
              </div>
              <button class="remove-item" data-action="remove" data-id="${i.foodId}">Remove</button>
            </div>
          </div>
        </div>`).join('');
    }

    updateTotals();
  }

  document.getElementById('cartBody').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'inc') changeQty(id, 1);
    if (action === 'dec') changeQty(id, -1);
    if (action === 'remove') removeItem(id);
  });

  function updateTotals() {
    const subtotal = cartSubtotal();
    let discount = 0;
    if (state.promo) {
      discount = state.promo.discount;
      document.getElementById('discountRow').hidden = false;
      document.getElementById('sumDiscount').textContent = `-${money(discount)}`;
    } else {
      document.getElementById('discountRow').hidden = true;
    }
    const delivery = deliveryFee(subtotal - discount);
    const total = Math.max(subtotal - discount, 0) + delivery;

    document.getElementById('sumSubtotal').textContent = money(subtotal);
    document.getElementById('sumDelivery').textContent = delivery === 0 && subtotal > 0 ? 'Free' : money(delivery);
    document.getElementById('sumTotal').textContent = money(total);
    document.getElementById('checkoutBtn').disabled = state.cart.length === 0;
  }

  /* Promo code */
  document.getElementById('promoApply').addEventListener('click', async () => {
    const input = document.getElementById('promoInput');
    const code = input.value.trim();
    const msg = document.getElementById('promoMessage');
    if (!code) return;
    const subtotal = cartSubtotal();
    const result = await Api.validatePromo(code, subtotal);
    if (result.valid) {
      state.promo = { code: code.toUpperCase(), discount: result.discount };
      msg.textContent = `"${code.toUpperCase()}" applied — you saved ${money(result.discount)}.`;
      msg.className = 'promo-message success';
      toast('Promo code applied');
    } else {
      state.promo = null;
      msg.textContent = result.reason || 'That code is not valid.';
      msg.className = 'promo-message error';
    }
    updateTotals();
  });

  /* ---------------- Cart drawer open/close ---------------- */
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }
  document.getElementById('cartToggle').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  /* ---------------- Checkout ---------------- */
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutOverlay = document.getElementById('checkoutOverlay');

  function openCheckout() {
    if (state.cart.length === 0) return;
    closeCart();
    renderCheckoutSummary();
    checkoutModal.classList.add('open');
    checkoutOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCheckout() {
    checkoutModal.classList.remove('open');
    checkoutOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
  document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
  checkoutOverlay.addEventListener('click', closeCheckout);

  function renderCheckoutSummary() {
    const subtotal = cartSubtotal();
    const discount = state.promo ? state.promo.discount : 0;
    const delivery = deliveryFee(subtotal - discount);
    const total = Math.max(subtotal - discount, 0) + delivery;

    document.getElementById('summaryItems').innerHTML = state.cart.map((i) => `
      <div class="summary-line">
        <span class="si-name">${i.name} <span class="si-qty">× ${i.quantity}</span></span>
        <span>${money(i.price * i.quantity)}</span>
      </div>`).join('');

    document.getElementById('coSubtotal').textContent = money(subtotal);
    document.getElementById('coDiscountRow').hidden = !state.promo;
    if (state.promo) document.getElementById('coDiscount').textContent = `-${money(discount)}`;
    document.getElementById('coDelivery').textContent = delivery === 0 ? 'Free' : money(delivery);
    document.getElementById('coTotal').textContent = money(total);
  }

  document.getElementById('placeOrderBtn').addEventListener('click', () => {
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name || !phone || !address) {
      toast('Please fill in your name, phone, and address.', 'error');
      return;
    }
    if (state.cart.length === 0) return;

    const subtotal = cartSubtotal();
    const discount = state.promo ? state.promo.discount : 0;
    const delivery = deliveryFee(subtotal - discount);
    const grandTotal = Math.max(subtotal - discount, 0) + delivery;

    const payload = {
      customerName: name,
      phone,
      address,
      notes,
      items: state.cart.map((i) => ({ food: i.foodId, name: i.name, unitPrice: i.price, quantity: i.quantity })),
      subtotal,
      discount,
      promoCode: state.promo ? state.promo.code : null,
      deliveryFee: delivery,
      tax: 0,
      grandTotal
    };

    // Not saved yet — the order only reaches the database once the customer confirms
    // they actually sent it in WhatsApp (see confirmSent/confirmNotSent below). There's
    // no browser API that reports whether someone tapped Send inside WhatsApp, so this
    // explicit confirmation step is the closest honest substitute for that signal.
    const reference = `REF-${Date.now().toString(36).toUpperCase()}`;
    state.pendingOrder = { payload, reference };

    const waNumber = (state.settings.whatsappNumber || '').replace(/\D/g, '');
    const message = buildWhatsappOrderMessage(reference, payload);
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');

    closeCheckout();
    openConfirmModal();
  });

  /* ---------------- Confirm-sent step (only now does the order get saved) ---------------- */
  const confirmModal = document.getElementById('confirmOrderModal');
  const confirmOverlay = document.getElementById('confirmOverlay');

  function openConfirmModal() {
    confirmModal.classList.add('open');
    confirmOverlay.classList.add('open');
  }
  function closeConfirmModal() {
    confirmModal.classList.remove('open');
    confirmOverlay.classList.remove('open');
  }

  document.getElementById('confirmSent').addEventListener('click', async () => {
    if (!state.pendingOrder) { closeConfirmModal(); return; }
    const btn = document.getElementById('confirmSent');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      await Api.placeOrder(state.pendingOrder.payload);
      toast('Order confirmed — thank you!');
      state.cart = [];
      state.promo = null;
      state.pendingOrder = null;
      renderCart();
      document.getElementById('checkoutForm').reset();
    } catch (err) {
      toast('Could not save your order — please try again or contact us directly.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Yes, I sent it';
      closeConfirmModal();
    }
  });

  document.getElementById('confirmNotSent').addEventListener('click', () => {
    // Cart and pending order are kept intact — nothing is saved. The customer can
    // reopen checkout later and try again whenever they're ready.
    closeConfirmModal();
    toast('No problem — your cart is still here whenever you\'re ready.');
  });
  confirmOverlay.addEventListener('click', () => {
    closeConfirmModal();
  });

  function buildWhatsappOrderMessage(reference, payload) {
    const lines = [];
    lines.push(`Hi ${state.settings.restaurantName || 'Foundry & Flame'}! I'd like to place an order.`);
    lines.push('');
    lines.push(`*Reference:* ${reference}`);
    lines.push(`*Name:* ${payload.customerName}`);
    lines.push(`*Phone:* ${payload.phone}`);
    lines.push(`*Delivery Address:* ${payload.address}`);
    lines.push('');
    lines.push('*Items:*');
    payload.items.forEach((i) => {
      lines.push(`• ${i.name} × ${i.quantity} — ${money(i.unitPrice * i.quantity)}`);
    });
    lines.push('');
    lines.push(`Subtotal: ${money(payload.subtotal)}`);
    if (payload.discount > 0) lines.push(`Discount (${payload.promoCode || ''}): -${money(payload.discount)}`);
    lines.push(`Delivery: ${payload.deliveryFee === 0 ? 'Free' : money(payload.deliveryFee)}`);
    lines.push(`*Grand Total: ${money(payload.grandTotal)}*`);
    lines.push(`Payment: Cash on Delivery`);
    if (payload.notes) {
      lines.push('');
      lines.push(`Notes: ${payload.notes}`);
    }
    return lines.join('\n');
  }

  /* ---------------- Offers ---------------- */
  function renderOffers() {
    const track = document.getElementById('offersTrack');
    if (!state.offers.length) {
      track.innerHTML = `<p class="muted">No live offers right now — check back soon.</p>`;
      return;
    }
    track.innerHTML = state.offers.map((o) => `
      <div class="offer-card">
        <img src="${o.bannerImage}" alt="${o.title}" loading="lazy">
        <div class="offer-card-content">
          <span class="offer-badge">${o.discountLabel}</span>
          <h3>${o.title}</h3>
          <p>${o.description}</p>
        </div>
      </div>`).join('');
  }

  /* ---------------- Why choose us ---------------- */
  function renderWhyChooseUs() {
    document.getElementById('whyChooseUs').innerHTML = WHY_CHOOSE_US.map((w) => `
      <div class="why-item">
        <div class="why-icon">${w.icon}</div>
        <div><h4>${w.title}</h4><p>${w.desc}</p></div>
      </div>`).join('');
  }

  /* ---------------- Gallery ---------------- */
  function renderGallery() {
    document.getElementById('galleryGrid').innerHTML = SAMPLE_GALLERY.map((src) => `
      <a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Foundry & Flame kitchen" loading="lazy"></a>`).join('');
  }

  /* ---------------- Testimonials ---------------- */
  function renderTestimonials() {
    const track = document.getElementById('testimonialTrack');
    const dotsWrap = document.getElementById('testimonialDots');
    track.innerHTML = `<div class="testimonial-track-inner" id="testimonialInner">${
      SAMPLE_TESTIMONIALS.map((t) => `
        <div class="testimonial-card">
          <p class="testimonial-quote">"${t.quote}"</p>
          <div class="testimonial-person">
            <div class="testimonial-avatar">${t.name.charAt(0)}</div>
            <div><strong>${t.name}</strong><span>Verified order</span></div>
          </div>
        </div>`).join('')
    }</div>`;
    dotsWrap.innerHTML = SAMPLE_TESTIMONIALS.map((_, i) => `<button data-i="${i}" class="${i === 0 ? 'active' : ''}"></button>`).join('');
    dotsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      goToTestimonial(Number(btn.dataset.i));
    });
  }

  function goToTestimonial(i) {
    state.testimonialIndex = (i + SAMPLE_TESTIMONIALS.length) % SAMPLE_TESTIMONIALS.length;
    const inner = document.getElementById('testimonialInner');
    inner.style.transform = `translateX(-${state.testimonialIndex * 100}%)`;
    document.querySelectorAll('#testimonialDots button').forEach((b, idx) => b.classList.toggle('active', idx === state.testimonialIndex));
  }
  document.getElementById('testimonialPrev').addEventListener('click', () => goToTestimonial(state.testimonialIndex - 1));
  document.getElementById('testimonialNext').addEventListener('click', () => goToTestimonial(state.testimonialIndex + 1));
  setInterval(() => goToTestimonial(state.testimonialIndex + 1), 6000);

  /* ---------------- FAQ ---------------- */
  function renderFaqs() {
    document.getElementById('faqList').innerHTML = SAMPLE_FAQS.map((f, i) => `
      <div class="faq-item" data-i="${i}">
        <button class="faq-question">
          ${f.q}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <div class="faq-answer"><div class="faq-answer-inner">${f.a}</div></div>
      </div>`).join('');

    document.getElementById('faqList').addEventListener('click', (e) => {
      const q = e.target.closest('.faq-question');
      if (!q) return;
      q.closest('.faq-item').classList.toggle('open');
    });
  }

  /* ---------------- Contact / footer meta ---------------- */
  function renderContactDetails() {
    const s = state.settings;
    document.getElementById('contactDetails').innerHTML = `
      <li><span class="ci-icon">📍</span><span>${s.address || ''}</span></li>
      <li><span class="ci-icon">📞</span><span>${s.contactNumber || ''}</span></li>
      <li><span class="ci-icon">🕐</span><span>${s.businessHours || ''}</span></li>`;
  }

  function renderFooterMeta() {
    document.getElementById('footerAddress').textContent = state.settings.address || '';
    document.getElementById('footerHours').textContent = state.settings.businessHours || '';
    document.getElementById('footerYear').textContent = new Date().getFullYear();
    document.getElementById('footerSocial').innerHTML = `
      <a href="#" aria-label="Instagram" target="_blank" rel="noopener">IG</a>
      <a href="#" aria-label="Facebook" target="_blank" rel="noopener">FB</a>
      <a href="#" aria-label="TikTok" target="_blank" rel="noopener">TT</a>`;
  }

  function wireWhatsappFloat() {
    const num = (state.settings.whatsappNumber || '').replace(/\D/g, '');
    document.getElementById('whatsappFloat').href = `https://wa.me/${num}`;
  }

  /* ---------------- Contact form -> WhatsApp ---------------- */
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const phone = document.getElementById('cPhone').value.trim();
    const subject = document.getElementById('cSubject').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    if (!name || !phone || !subject || !message) return;

    const num = (state.settings.whatsappNumber || '').replace(/\D/g, '');
    const text = [
      `Hi ${state.settings.restaurantName || 'Foundry & Flame'}, I have a question.`,
      '',
      `*Name:* ${name}`,
      `*Phone:* ${phone}`,
      `*Subject:* ${subject}`,
      '',
      message
    ].join('\n');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    e.target.reset();
    toast('Opening WhatsApp…');
  });

  /* ---------------- Newsletter ---------------- */
  document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    toast("You're on the list!");
    e.target.reset();
  });

  /* ---------------- Header behavior ---------------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
    document.getElementById('backToTop').classList.toggle('show', window.scrollY > 600);
  });

  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.classList.toggle('open');
    mobileNav.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', open);
  });
  mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    menuToggle.classList.remove('open');
    mobileNav.classList.remove('open');
  }));

  const searchToggle = document.getElementById('searchToggle');
  const searchBar = document.getElementById('searchBar');
  const searchInput = document.getElementById('searchInput');
  searchToggle.addEventListener('click', () => {
    const open = searchBar.classList.toggle('open');
    searchToggle.setAttribute('aria-expanded', open);
    if (open) searchInput.focus();
  });
  document.getElementById('searchClose').addEventListener('click', () => {
    searchBar.classList.remove('open');
    searchInput.value = '';
    state.searchTerm = '';
    renderMenu();
  });
  searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderMenu();
  });

  document.getElementById('backToTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------- Scroll reveal ---------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  function revealOnScroll(nodeList) {
    nodeList.forEach((el) => revealObserver.observe(el));
  }

  /* ---------------- Boot ---------------- */
  window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loading-screen').classList.add('hidden'), 400);
  });

  loadData();
  renderCart();
})();
