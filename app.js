// ============================================================
// KATE STORE — Maicao, La Guajira
// Lógica completa de los 6 módulos comerciales + persistencia
// ============================================================

const STORAGE_KEYS = {
  products: "katestore_products_v1",
  cart: "katestore_cart_v1",
  orders: "katestore_orders_v1",
  analytics: "katestore_analytics_v1",
  sessionVisited: "katestore_session_visited_v1"
};

// ---------- Utilidades ----------
const formatCOP = (amount) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(amount);

const escapeHTML = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : deepClone(fallback);
  } catch {
    return deepClone(fallback);
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silencioso si localStorage está bloqueado
  }
}

function showToast(message) {
  const stack = document.getElementById("toastStack");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-6px)";
    el.style.transition = "all 0.25s ease";
    setTimeout(() => el.remove(), 260);
  }, 3000);
}

// ---------- Estado Global ----------
let state = {
  products: loadState(STORAGE_KEYS.products, INITIAL_PRODUCTS),
  cart: loadState(STORAGE_KEYS.cart, []),
  orders: loadState(STORAGE_KEYS.orders, INITIAL_ORDERS),
  analytics: loadState(STORAGE_KEYS.analytics, INITIAL_ANALYTICS),
  messages: [],
  dbConnected: false,
  dbStatusText: "Conectando con Supabase...",
  activeView: "inicio",
  activeAdminTab: "analytics",
  catalogViewMode: "grid", // "grid" | "list"
  filters: {
    search: "",
    category: "Todas",
    maxPrice: 300000,
    size: "Todas",
    color: "Todos",
    onlyOffers: false,
    sort: "featured"
  },
  checkout: {
    shippingId: "estandar",
    paymentMethod: "Tarjeta de Crédito / Débito"
  }
};

function updateDbBadge() {
  const badge = document.getElementById("dbStatusBadge");
  if (!badge) return;
  if (state.dbConnected) {
    badge.textContent = "● Supabase Conectado (En vivo)";
    badge.style.background = "rgba(46, 125, 82, 0.25)";
    badge.style.borderColor = "rgba(93, 211, 148, 0.5)";
    badge.style.color = "#9EE8BE";
  } else {
    badge.textContent = `● ${state.dbStatusText}`;
    badge.style.background = "rgba(201, 155, 88, 0.22)";
    badge.style.borderColor = "rgba(201, 155, 88, 0.55)";
    badge.style.color = "#FCD396";
  }
}

async function syncFromSupabase(showFeedback = false) {
  if (typeof KateDB === "undefined" || !KateDB.isReady()) {
    state.dbConnected = false;
    state.dbStatusText = "Modo local (sin conexión al SDK)";
    updateDbBadge();
    return;
  }

  try {
    const [products, orders, analytics, messages] = await Promise.all([
      KateDB.fetchProducts(),
      KateDB.fetchOrders(),
      KateDB.fetchAnalytics(),
      KateDB.fetchContactMessages()
    ]);

    if (products.length > 0) {
      state.products = products;
      saveState(STORAGE_KEYS.products, state.products);
    }
    state.orders = orders;
    saveState(STORAGE_KEYS.orders, state.orders);

    if (analytics.dailyVisitors.length > 0) {
      state.analytics = analytics;
      saveState(STORAGE_KEYS.analytics, state.analytics);
    }
    state.messages = messages;

    state.dbConnected = true;
    state.dbStatusText = "Supabase Conectado";
    updateDbBadge();

    renderFeatured();
    if (state.activeView === "catalogo") renderCatalog();
    if (state.activeView === "admin") renderAdmin();
    if (showFeedback) showToast("Datos sincronizados con Supabase.");
  } catch (err) {
    console.warn("Supabase sync fallback a modo local:", err?.message || err);
    state.dbConnected = false;
    state.dbStatusText = "Modo local (ejecuta supabase/schema.sql)";
    updateDbBadge();
    if (showFeedback) {
      showToast("No se encontraron las tablas en Supabase. Ejecuta supabase/schema.sql en tu SQL Editor.");
    }
  }
}

// Registrar visita de sesión para Analítica (Módulo 5)
async function recordVisit() {
  if (!sessionStorage.getItem(STORAGE_KEYS.sessionVisited)) {
    state.analytics.visitors += 1;
    const todayEntry = state.analytics.dailyVisitors[state.analytics.dailyVisitors.length - 1];
    if (todayEntry) todayEntry.count += 1;
    saveState(STORAGE_KEYS.analytics, state.analytics);
    sessionStorage.setItem(STORAGE_KEYS.sessionVisited, "1");
    if (typeof KateDB !== "undefined" && KateDB.isReady()) {
      KateDB.recordVisit().catch(() => {});
    }
  }
}

// ============================================================
// NAVEGACIÓN PRINCIPAL
// ============================================================
function navigateTo(view) {
  if (view === "ofertas") {
    state.filters.onlyOffers = true;
    document.getElementById("onlyOffersCheck").checked = true;
    view = "catalogo";
  } else if (view === "catalogo") {
    // Mantener filtros actuales
  }

  state.activeView = view;

  document.querySelectorAll(".page-view").forEach((sec) => {
    sec.classList.toggle("hidden", sec.id !== `view-${view}`);
  });

  document.querySelectorAll(".nav-link").forEach((btn) => {
    const target = btn.dataset.nav;
    const isOffersActive = view === "catalogo" && state.filters.onlyOffers;
    if (target === "ofertas") {
      btn.classList.toggle("active", isOffersActive);
    } else if (target === "catalogo") {
      btn.classList.toggle("active", view === "catalogo" && !isOffersActive);
    } else {
      btn.classList.toggle("active", target === view);
    }
  });

  document.getElementById("navLinks").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (view === "inicio") renderFeatured();
  if (view === "catalogo") renderCatalog();
  if (view === "admin") renderAdmin();
}

// ============================================================
// TARJETAS DE PRODUCTO (HOME Y CATÁLOGO)
// ============================================================
function createProductCardHTML(p) {
  const isOut = p.stock <= 0;
  const badgeClass = isOut
    ? "agotado"
    : p.badge === "Oferta" || p.originalPrice
    ? "oferta"
    : "";
  const badgeText = isOut ? "Agotado" : p.badge || (p.originalPrice ? "Oferta" : "");

  const stockLabel = isOut
    ? `<div class="stock-pill out">● Sin stock disponible</div>`
    : p.stock <= 5
    ? `<div class="stock-pill low">● ¡Últimas ${p.stock} unidades!</div>`
    : `<div class="stock-pill">● Disponible (${p.stock} unid.)</div>`;

  const swatchesHTML = p.colors
    .map(
      (c) =>
        `<span class="swatch-dot" title="${c.name}" style="background:${c.hex};"></span>`
    )
    .join("");

  return `
    <article class="product-card">
      <div class="product-media" data-open-product="${p.id}">
        <img src="${normalizeImageSrc(p.image)}" alt="${p.name}" loading="lazy" onerror="handleKateImgError(this)" />
        ${badgeText ? `<span class="product-badge ${badgeClass}">${badgeText}</span>` : ""}
      </div>
      <div class="product-body">
        <span class="product-cat">${p.category} • ${p.sku}</span>
        <h3 class="product-title" data-open-product="${p.id}">${p.name}</h3>
        <p class="product-desc-short">${p.description}</p>
        <div class="product-meta-row">
          <div class="price-box">
            <span class="price-current">${formatCOP(p.price)}</span>
            ${p.originalPrice ? `<span class="price-old">${formatCOP(p.originalPrice)}</span>` : ""}
          </div>
          <div class="swatches">${swatchesHTML}</div>
        </div>
        ${stockLabel}
        <div class="product-card-actions">
          <button class="btn btn-outline btn-sm" data-open-product="${p.id}">Ver detalle</button>
          <button class="btn btn-primary btn-sm" data-quick-add="${p.id}" ${isOut ? "disabled style='opacity:0.5; cursor:not-allowed;'" : ""}>
            ${isOut ? "Agotado" : "+ Carrito"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderFeatured() {
  const container = document.getElementById("featuredGrid");
  const featured = state.products.filter((p) => p.featured).slice(0, 6);
  const list = featured.length >= 3 ? featured : state.products.slice(0, 6);
  container.innerHTML = list.map(createProductCardHTML).join("");
}

// ============================================================
// MÓDULO 1: CATÁLOGO Y FILTROS
// ============================================================
function renderFilterChips() {
  const categories = ["Todas", ...new Set(state.products.map((p) => p.category))];
  const sizes = ["Todas", "XS", "S", "M", "L", "XL", "Única"];
  const allColors = ["Todos", ...new Set(state.products.flatMap((p) => p.colors.map((c) => c.name)))];

  document.getElementById("categoryFilterChips").innerHTML = categories
    .map(
      (cat) =>
        `<button class="chip ${state.filters.category === cat ? "active" : ""}" data-filter-cat="${cat}">${cat}</button>`
    )
    .join("");

  document.getElementById("sizeFilterChips").innerHTML = sizes
    .map(
      (sz) =>
        `<button class="chip ${state.filters.size === sz ? "active" : ""}" data-filter-size="${sz}">${sz}</button>`
    )
    .join("");

  document.getElementById("colorFilterChips").innerHTML = allColors
    .map(
      (col) =>
        `<button class="chip ${state.filters.color === col ? "active" : ""}" data-filter-color="${col}">${col}</button>`
    )
    .join("");
}

function renderCatalog() {
  renderFilterChips();

  const { search, category, maxPrice, size, color, onlyOffers, sort } = state.filters;
  const q = search.trim().toLowerCase();

  let filtered = state.products.filter((p) => {
    if (category !== "Todas" && p.category !== category) return false;
    if (p.price > maxPrice) return false;
    if (size !== "Todas" && !p.sizes.includes(size)) return false;
    if (color !== "Todos" && !p.colors.some((c) => c.name === color)) return false;
    if (onlyOffers && !p.originalPrice && p.badge !== "Oferta") return false;
    if (q) {
      const hay = `${p.name} ${p.category} ${p.description} ${p.sku}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "views-desc") filtered.sort((a, b) => b.views - a.views);
  if (sort === "featured") filtered.sort((a, b) => Number(b.featured) - Number(a.featured));

  const grid = document.getElementById("catalogGrid");
  grid.classList.toggle("list-view", state.catalogViewMode === "list");

  document.getElementById("catalogCount").textContent =
    filtered.length === 1
      ? "Mostrando 1 prenda"
      : `Mostrando ${filtered.length} prendas disponibles`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card-panel" style="grid-column:1/-1; text-align:center; padding:3rem 1.5rem;">
        <h3 style="font-family:var(--font-serif); margin-bottom:0.5rem;">No encontramos prendas con esos filtros</h3>
        <p style="color:var(--text-muted); margin-bottom:1.2rem;">Prueba limpiando los filtros o ampliando el rango de precio.</p>
        <button class="btn btn-primary btn-sm" id="emptyResetFilters">Ver todo el catálogo</button>
      </div>
    `;
    const btn = document.getElementById("emptyResetFilters");
    if (btn) btn.addEventListener("click", resetFilters);
  } else {
    grid.innerHTML = filtered.map(createProductCardHTML).join("");
  }
}

function resetFilters() {
  state.filters = {
    search: "",
    category: "Todas",
    maxPrice: 300000,
    size: "Todas",
    color: "Todos",
    onlyOffers: false,
    sort: "featured"
  };
  document.getElementById("searchInput").value = "";
  document.getElementById("priceRange").value = 300000;
  document.getElementById("priceRangeLabel").textContent = formatCOP(300000);
  document.getElementById("onlyOffersCheck").checked = false;
  document.getElementById("sortSelect").value = "featured";
  renderCatalog();
}

// ============================================================
// PÁGINA / MODAL DE DETALLE DEL PRODUCTO (ZOOM + ÁNGULOS)
// ============================================================
let detailState = {
  productId: null,
  angleIdx: 0,
  colorIdx: 0,
  size: "",
  qty: 1,
  zoomed: false
};

function openProductDetail(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  // Incrementar vistas en vivo para Módulo 5 Analítica (Local + Supabase)
  product.views = (product.views || 0) + 1;
  saveState(STORAGE_KEYS.products, state.products);
  if (state.dbConnected) {
    KateDB.incrementProductViews(productId).catch(() => {});
  }

  detailState = {
    productId,
    angleIdx: 0,
    colorIdx: 0,
    size: product.sizes[0] || "Única",
    qty: 1,
    zoomed: false
  };

  renderProductDetailModal();
  document.getElementById("productModal").classList.remove("hidden");
}

function renderProductDetailModal() {
  const p = state.products.find((item) => item.id === detailState.productId);
  if (!p) return;

  const angle = p.angles[detailState.angleIdx] || { label: "Principal", pos: "50% 30%", scale: 1 };
  const isOut = p.stock <= 0;

  const thumbsHTML = p.angles
    .map(
      (a, idx) => `
      <button class="thumb-btn ${idx === detailState.angleIdx ? "active" : ""}" data-angle-idx="${idx}">
        <div class="thumb-preview">
          <img src="${normalizeImageSrc(p.image)}" alt="${a.label}" onerror="handleKateImgError(this)" style="object-position:${a.pos}; transform:scale(${a.scale});" />
        </div>
        <span class="thumb-caption">${a.label}</span>
      </button>
    `
    )
    .join("");

  const colorsHTML = p.colors
    .map(
      (c, idx) => `
      <button class="color-option ${idx === detailState.colorIdx ? "active" : ""}" data-detail-color="${idx}">
        <span class="swatch-dot" style="background:${c.hex};"></span>
        <span>${c.name}</span>
      </button>
    `
    )
    .join("");

  const sizesHTML = p.sizes
    .map(
      (sz) => `
      <button class="chip ${sz === detailState.size ? "active" : ""}" data-detail-size="${sz}">${sz}</button>
    `
    )
    .join("");

  document.getElementById("productModalContent").innerHTML = `
    <div class="detail-grid">
      <div>
        <div class="zoom-stage ${detailState.zoomed ? "zoomed" : ""}" id="zoomStage" title="Haz clic para acercar o alejar">
          <img
            id="zoomImg"
            src="${normalizeImageSrc(p.image)}"
            alt="${p.name}"
            onerror="handleKateImgError(this)"
            style="object-position:${angle.pos}; transform:scale(${detailState.zoomed ? Math.max(angle.scale * 1.45, 2.05) : angle.scale});"
          />
          <span class="zoom-hint">${detailState.zoomed ? "🔍 Clic para alejar" : "🔍 Clic para hacer zoom"}</span>
        </div>
        <div class="thumb-row">${thumbsHTML}</div>
      </div>

      <div>
        <span class="section-eyebrow">${p.category} • SKU ${p.sku}</span>
        <h2 style="font-family:var(--font-serif); font-size:1.8rem; line-height:1.2; margin-bottom:0.65rem;">${p.name}</h2>

        <div class="price-box" style="margin-bottom:0.65rem;">
          <span style="font-size:1.55rem; font-weight:800; color:var(--primary);">${formatCOP(p.price)}</span>
          ${p.originalPrice ? `<span class="price-old" style="font-size:1rem;">${formatCOP(p.originalPrice)}</span>` : ""}
        </div>

        <div class="stock-pill ${isOut ? "out" : p.stock <= 5 ? "low" : ""}">
          ${isOut ? "● Agotado temporalmente" : `● En stock: ${p.stock} unidades disponibles en Maicao`}
        </div>

        <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1.1rem;">${p.description}</p>

        <div class="variant-section">
          <span class="filter-label">Color: ${p.colors[detailState.colorIdx]?.name || ""}</span>
          <div class="chip-list">${colorsHTML}</div>
        </div>

        <div class="variant-section">
          <span class="filter-label">Talla</span>
          <div class="chip-list">${sizesHTML}</div>
        </div>

        <div class="variant-section" style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
          <div>
            <span class="filter-label">Cantidad</span>
            <div class="qty-control">
              <button class="qty-btn" id="detailQtyMinus">−</button>
              <span class="qty-val">${detailState.qty}</span>
              <button class="qty-btn" id="detailQtyPlus">+</button>
            </div>
          </div>
          <div style="flex:1; min-width:190px; padding-top:1.1rem;">
            <button class="btn btn-primary btn-block" id="detailAddToCart" ${isOut ? "disabled style='opacity:0.5;'" : ""}>
              ${isOut ? "Producto agotado" : "Añadir al carrito"}
            </button>
          </div>
        </div>

        <div class="specs-table">
          <strong style="display:block; margin-bottom:0.5rem; font-size:0.86rem; text-transform:uppercase; letter-spacing:0.06em;">
            Especificaciones Técnicas
          </strong>
          <dl>
            <div class="specs-row"><dt>Materiales</dt><dd>${p.specs.material}</dd></div>
            <div class="specs-row"><dt>Medidas</dt><dd>${p.specs.medidas}</dd></div>
            <div class="specs-row"><dt>Peso aprox.</dt><dd>${p.specs.peso}</dd></div>
            <div class="specs-row"><dt>Cuidados</dt><dd>${p.specs.cuidados}</dd></div>
            <div class="specs-row"><dt>Origen</dt><dd>${p.specs.origen}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `;

  // Eventos del modal de detalle
  const zoomStage = document.getElementById("zoomStage");
  const zoomImg = document.getElementById("zoomImg");

  zoomStage.addEventListener("click", () => {
    detailState.zoomed = !detailState.zoomed;
    renderProductDetailModal();
  });

  zoomStage.addEventListener("mousemove", (e) => {
    if (!detailState.zoomed) return;
    const rect = zoomStage.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    zoomImg.style.transformOrigin = `${xPct}% ${yPct}%`;
  });

  document.querySelectorAll("[data-angle-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailState.angleIdx = Number(btn.dataset.angleIdx);
      detailState.zoomed = false;
      renderProductDetailModal();
    });
  });

  document.querySelectorAll("[data-detail-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailState.colorIdx = Number(btn.dataset.detailColor);
      renderProductDetailModal();
    });
  });

  document.querySelectorAll("[data-detail-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      detailState.size = btn.dataset.detailSize;
      renderProductDetailModal();
    });
  });

  document.getElementById("detailQtyMinus").addEventListener("click", () => {
    if (detailState.qty > 1) {
      detailState.qty--;
      renderProductDetailModal();
    }
  });

  document.getElementById("detailQtyPlus").addEventListener("click", () => {
    if (detailState.qty < p.stock) {
      detailState.qty++;
      renderProductDetailModal();
    } else {
      showToast(`Stock máximo disponible: ${p.stock} unidades.`);
    }
  });

  document.getElementById("detailAddToCart").addEventListener("click", () => {
    addToCart(p.id, detailState.size, p.colors[detailState.colorIdx]?.name || "Estándar", detailState.qty);
    document.getElementById("productModal").classList.add("hidden");
    openCartDrawer();
  });
}

// ============================================================
// MÓDULO 2: CARRITO DE COMPRAS
// ============================================================
function addToCart(productId, size, color, qty = 1) {
  const product = state.products.find((p) => p.id === productId);
  if (!product || product.stock <= 0) {
    showToast("Esta prenda está agotada en este momento.");
    return;
  }

  const chosenSize = size || product.sizes[0] || "Única";
  const chosenColor = color || product.colors[0]?.name || "Estándar";
  const key = `${productId}__${chosenSize}__${chosenColor}`;

  const existing = state.cart.find((item) => item.key === key);
  const currentTotalOfProduct = state.cart
    .filter((i) => i.productId === productId)
    .reduce((sum, i) => sum + i.qty, 0);

  if (currentTotalOfProduct + qty > product.stock) {
    showToast(`Solo quedan ${product.stock} unidades en inventario.`);
    return;
  }

  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      key,
      productId,
      name: product.name,
      image: product.image,
      price: product.price,
      size: chosenSize,
      color: chosenColor,
      qty
    });
  }

  saveState(STORAGE_KEYS.cart, state.cart);
  updateCartBadge();
  renderCartDrawer();
  showToast(`Añadido al carrito: ${product.name}`);
}

function updateCartItemQty(key, delta) {
  const item = state.cart.find((i) => i.key === key);
  if (!item) return;

  const product = state.products.find((p) => p.id === item.productId);
  const newQty = item.qty + delta;

  if (newQty <= 0) {
    removeCartItem(key);
    return;
  }

  if (product && newQty > product.stock) {
    showToast(`Stock máximo alcanzado (${product.stock} unid.).`);
    return;
  }

  item.qty = newQty;
  saveState(STORAGE_KEYS.cart, state.cart);
  updateCartBadge();
  renderCartDrawer();
}

function removeCartItem(key) {
  state.cart = state.cart.filter((i) => i.key !== key);
  saveState(STORAGE_KEYS.cart, state.cart);
  updateCartBadge();
  renderCartDrawer();
}

function calculateCartTotals(shippingId = "estandar") {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const baseSinIva = Math.round(subtotal / (1 + STORE_CONFIG.ivaRate));
  const ivaEstimado = subtotal - baseSinIva;

  const shipOpt =
    STORE_CONFIG.shippingOptions.find((s) => s.id === shippingId) ||
    STORE_CONFIG.shippingOptions[1];

  let shippingCost = shipOpt.cost;
  if (shippingId === "estandar" && subtotal >= STORE_CONFIG.freeShippingThreshold) {
    shippingCost = 0;
  }

  return {
    subtotal,
    baseSinIva,
    ivaEstimado,
    shippingCost,
    shippingOption: shipOpt,
    total: subtotal + shippingCost
  };
}

function updateCartBadge() {
  const totalItems = state.cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById("cartBadge").textContent = totalItems;
}

function openCartDrawer() {
  renderCartDrawer();
  document.getElementById("cartDrawer").classList.remove("hidden");
}

function closeCartDrawer() {
  document.getElementById("cartDrawer").classList.add("hidden");
}

function renderCartDrawer() {
  const body = document.getElementById("cartItemsContainer");
  const footer = document.getElementById("cartFooter");

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem;">
        <div style="font-size:2.6rem; margin-bottom:0.6rem;">🛍️</div>
        <h4 style="font-family:var(--font-serif); font-size:1.25rem; margin-bottom:0.4rem;">Tu carrito está vacío</h4>
        <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.3rem;">
          Explora nuestra colección de moda femenina en Maicao y encuentra tu próximo outfit favorito.
        </p>
        <button class="btn btn-primary btn-sm" id="cartGoShopBtn">Explorar catálogo</button>
      </div>
    `;
    footer.innerHTML = "";
    const btn = document.getElementById("cartGoShopBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        closeCartDrawer();
        navigateTo("catalogo");
      });
    }
    return;
  }

  body.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${normalizeImageSrc(item.image)}" alt="${item.name}" onerror="handleKateImgError(this)" />
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-meta">Talla: <strong>${item.size}</strong> • Color: <strong>${item.color}</strong></div>
          <div class="cart-item-row">
            <div class="qty-control">
              <button class="qty-btn" data-cart-minus="${item.key}" aria-label="Restar">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn" data-cart-plus="${item.key}" aria-label="Sumar">+</button>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <strong>${formatCOP(item.price * item.qty)}</strong>
              <button class="remove-btn" data-cart-remove="${item.key}" title="Eliminar">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  const totals = calculateCartTotals("estandar");
  const faltaEnvioGratis = Math.max(0, STORE_CONFIG.freeShippingThreshold - totals.subtotal);

  footer.innerHTML = `
    <div style="font-size:0.82rem; padding:0.55rem 0.8rem; border-radius:10px; background:var(--surface); border:1px solid var(--border); margin-bottom:0.9rem; color:var(--olive); font-weight:600;">
      ${
        faltaEnvioGratis === 0
          ? "🎉 ¡Tienes envío estándar GRATIS en Maicao y La Guajira!"
          : `🚚 Te faltan ${formatCOP(faltaEnvioGratis)} para envío estándar GRATIS.`
      }
    </div>
    <div class="summary-line"><span>Subtotal productos</span><span>${formatCOP(totals.subtotal)}</span></div>
    <div class="summary-line"><span>IVA estimado incluido (19%)</span><span>${formatCOP(totals.ivaEstimado)}</span></div>
    <div class="summary-line"><span>Envío estándar estimado</span><span>${totals.shippingCost === 0 ? "GRATIS" : formatCOP(totals.shippingCost)}</span></div>
    <div class="summary-line total"><span>Total estimado</span><span>${formatCOP(totals.total)}</span></div>
    <button class="btn btn-primary btn-block" id="proceedCheckoutBtn">Proceder al pago →</button>
  `;

  document.querySelectorAll("[data-cart-minus]").forEach((b) =>
    b.addEventListener("click", () => updateCartItemQty(b.dataset.cartMinus, -1))
  );
  document.querySelectorAll("[data-cart-plus]").forEach((b) =>
    b.addEventListener("click", () => updateCartItemQty(b.dataset.cartPlus, 1))
  );
  document.querySelectorAll("[data-cart-remove]").forEach((b) =>
    b.addEventListener("click", () => removeCartItem(b.dataset.cartRemove))
  );
  document.getElementById("proceedCheckoutBtn").addEventListener("click", () => {
    closeCartDrawer();
    openCheckoutModal();
  });
}

// ============================================================
// MÓDULO 3: PASARELA DE PAGO (CHECKOUT)
// ============================================================
function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast("Agrega al menos una prenda al carrito antes de pagar.");
    return;
  }
  renderCheckoutForm();
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function renderCheckoutForm() {
  const totals = calculateCartTotals(state.checkout.shippingId);

  const shippingCards = STORE_CONFIG.shippingOptions
    .map((opt) => {
      const effectiveCost =
        opt.id === "estandar" && totals.subtotal >= STORE_CONFIG.freeShippingThreshold
          ? 0
          : opt.cost;
      const selected = state.checkout.shippingId === opt.id;
      return `
        <label class="radio-card ${selected ? "selected" : ""}">
          <div style="display:flex; gap:0.65rem; align-items:flex-start;">
            <input type="radio" name="shippingOpt" value="${opt.id}" ${selected ? "checked" : ""} />
            <div>
              <strong style="font-size:0.9rem;">${opt.name}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">${opt.eta} • ${opt.description}</div>
            </div>
          </div>
          <strong style="font-size:0.88rem; white-space:nowrap;">${effectiveCost === 0 ? "GRATIS" : formatCOP(effectiveCost)}</strong>
        </label>
      `;
    })
    .join("");

  const paymentMethods = [
    { id: "Tarjeta de Crédito / Débito", desc: "Visa, Mastercard, American Express (cifrado SSL)" },
    { id: "Nequi / Daviplata", desc: "Transferencia inmediata al 315 842 9104" },
    { id: "Transferencia Bancolombia / PSE", desc: "Débito desde tu cuenta bancaria en Colombia" },
    { id: "PayPal", desc: "Pago protegido con tu cuenta PayPal" },
    { id: "Pago Contra Entrega (Efectivo)", desc: "Disponible para domicilios en Maicao" }
  ];

  const paymentCards = paymentMethods
    .map((pm) => {
      const selected = state.checkout.paymentMethod === pm.id;
      return `
        <label class="radio-card ${selected ? "selected" : ""}">
          <div style="display:flex; gap:0.65rem; align-items:flex-start;">
            <input type="radio" name="paymentMethod" value="${pm.id}" ${selected ? "checked" : ""} />
            <div>
              <strong style="font-size:0.9rem;">${pm.id}</strong>
              <div style="font-size:0.78rem; color:var(--text-muted);">${pm.desc}</div>
            </div>
          </div>
        </label>
      `;
    })
    .join("");

  const itemsMini = state.cart
    .map(
      (i) => `
      <div style="display:flex; justify-content:space-between; gap:0.5rem; font-size:0.85rem; padding:0.45rem 0; border-bottom:1px dashed var(--border);">
        <span>${i.qty}× ${i.name} <em style="color:var(--text-muted);">(${i.size}, ${i.color})</em></span>
        <strong>${formatCOP(i.price * i.qty)}</strong>
      </div>
    `
    )
    .join("");

  document.getElementById("checkoutModalContent").innerHTML = `
    <div style="padding:1.5rem 2rem 0; clear:both;">
      <span class="section-eyebrow">Pago Seguro • Cifrado SSL 256-bit</span>
      <h2 style="font-family:var(--font-serif); font-size:1.7rem;">Finalizar Compra</h2>
    </div>

    <form id="checkoutForm" class="checkout-grid">
      <div>
        <h3 class="form-section-title">1. Datos de contacto del cliente</h3>
        <div class="form-grid-2">
          <div class="field">
            <label for="chkName">Nombre completo *</label>
            <input type="text" id="chkName" class="input-field" placeholder="Ej: María José Redondo" required />
          </div>
          <div class="field">
            <label for="chkDoc">Cédula / Documento *</label>
            <input type="text" id="chkDoc" class="input-field" placeholder="Ej: 1121456789" required />
          </div>
          <div class="field">
            <label for="chkEmail">Correo electrónico *</label>
            <input type="email" id="chkEmail" class="input-field" placeholder="maria@correo.com" required />
          </div>
          <div class="field">
            <label for="chkPhone">Celular / WhatsApp *</label>
            <input type="tel" id="chkPhone" class="input-field" placeholder="315 000 0000" required />
          </div>
        </div>

        <h3 class="form-section-title">2. Dirección de envío y facturación</h3>
        <div class="form-grid-2">
          <div class="field">
            <label for="chkCity">Municipio / Ciudad *</label>
            <select id="chkCity" class="input-field">
              <option value="Maicao, La Guajira">Maicao, La Guajira</option>
              <option value="Riohacha, La Guajira">Riohacha, La Guajira</option>
              <option value="Uribia, La Guajira">Uribia, La Guajira</option>
              <option value="Albania / Fonseca, La Guajira">Albania / Fonseca, La Guajira</option>
              <option value="Valledupar, Cesar">Valledupar, Cesar</option>
              <option value="Barranquilla / Santa Marta">Barranquilla / Santa Marta</option>
              <option value="Otra ciudad de Colombia">Otra ciudad de Colombia</option>
            </select>
          </div>
          <div class="field">
            <label for="chkBarrio">Barrio / Sector *</label>
            <input type="text" id="chkBarrio" class="input-field" placeholder="Ej: El Carmen, Centro, San José" required />
          </div>
        </div>
        <div class="field">
          <label for="chkAddress">Dirección exacta *</label>
          <input type="text" id="chkAddress" class="input-field" placeholder="Calle / Carrera, número de casa o apartamento" required />
        </div>
        <div class="field">
          <label style="display:flex; align-items:center; gap:0.5rem; font-weight:500; cursor:pointer;">
            <input type="checkbox" id="diffBillingCheck" />
            Usar una dirección de facturación diferente
          </label>
          <input type="text" id="chkBillingAddress" class="input-field hidden" style="margin-top:0.5rem;" placeholder="Dirección de facturación completa" />
        </div>

        <h3 class="form-section-title">3. Opciones de envío</h3>
        <div id="shippingRadios">${shippingCards}</div>

        <h3 class="form-section-title">4. Método de pago</h3>
        <div id="paymentRadios">${paymentCards}</div>

        <div id="cardFieldsBox" class="${state.checkout.paymentMethod === "Tarjeta de Crédito / Débito" ? "" : "hidden"}" style="background:var(--bg); border:1px solid var(--border); padding:1rem; border-radius:10px; margin-top:0.65rem;">
          <div class="field">
            <label for="cardNum">Número de tarjeta (simulación segura)</label>
            <input type="text" id="cardNum" class="input-field" placeholder="4532 •••• •••• 1234" maxlength="19" />
          </div>
          <div class="form-grid-2">
            <div class="field" style="margin-bottom:0;">
              <label for="cardExp">Vencimiento</label>
              <input type="text" id="cardExp" class="input-field" placeholder="MM/AA" maxlength="5" />
            </div>
            <div class="field" style="margin-bottom:0;">
              <label for="cardCvv">CVV</label>
              <input type="password" id="cardCvv" class="input-field" placeholder="123" maxlength="4" />
            </div>
          </div>
        </div>
      </div>

      <aside class="checkout-summary-box">
        <h3 style="font-family:var(--font-serif); font-size:1.25rem; margin-bottom:0.8rem;">Resumen de tu Pedido</h3>
        <div style="margin-bottom:1rem;">${itemsMini}</div>

        <div class="summary-line"><span>Subtotal</span><span>${formatCOP(totals.subtotal)}</span></div>
        <div class="summary-line"><span>Base gravable</span><span>${formatCOP(totals.baseSinIva)}</span></div>
        <div class="summary-line"><span>IVA (19% incluido)</span><span>${formatCOP(totals.ivaEstimado)}</span></div>
        <div class="summary-line"><span>Envío (${totals.shippingOption.name.split("(")[0].trim()})</span><span id="chkShipCost">${totals.shippingCost === 0 ? "GRATIS" : formatCOP(totals.shippingCost)}</span></div>
        <div class="summary-line total"><span>Total a pagar</span><span id="chkTotalCost">${formatCOP(totals.total)}</span></div>

        <button type="submit" class="btn btn-primary btn-block" style="margin-top:0.5rem;">
          🔒 Confirmar y Pagar ${formatCOP(totals.total)}
        </button>
        <p style="font-size:0.76rem; color:var(--text-muted); text-align:center; margin-top:0.75rem;">
          Al confirmar recibirás tu número de pedido y correo de confirmación instantáneo.
        </p>
      </aside>
    </form>
  `;

  // Toggle dirección de facturación
  document.getElementById("diffBillingCheck").addEventListener("change", (e) => {
    document.getElementById("chkBillingAddress").classList.toggle("hidden", !e.target.checked);
  });

  // Cambio de envío (actualiza costos en vivo sin perder inputs)
  document.querySelectorAll('input[name="shippingOpt"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.checkout.shippingId = e.target.value;
      document.querySelectorAll("#shippingRadios .radio-card").forEach((c) => c.classList.remove("selected"));
      e.target.closest(".radio-card").classList.add("selected");
      const t = calculateCartTotals(state.checkout.shippingId);
      document.getElementById("chkShipCost").textContent = t.shippingCost === 0 ? "GRATIS" : formatCOP(t.shippingCost);
      document.getElementById("chkTotalCost").textContent = formatCOP(t.total);
      document.querySelector('#checkoutForm button[type="submit"]').textContent = `🔒 Confirmar y Pagar ${formatCOP(t.total)}`;
    });
  });

  // Cambio de método de pago
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      state.checkout.paymentMethod = e.target.value;
      document.querySelectorAll("#paymentRadios .radio-card").forEach((c) => c.classList.remove("selected"));
      e.target.closest(".radio-card").classList.add("selected");
      document
        .getElementById("cardFieldsBox")
        .classList.toggle("hidden", state.checkout.paymentMethod !== "Tarjeta de Crédito / Débito");
    });
  });

  // Confirmar compra
  document.getElementById("checkoutForm").addEventListener("submit", handlePlaceOrder);
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  const name = document.getElementById("chkName").value.trim();
  const doc = document.getElementById("chkDoc").value.trim();
  const email = document.getElementById("chkEmail").value.trim();
  const phone = document.getElementById("chkPhone").value.trim();
  const city = document.getElementById("chkCity").value;
  const barrio = document.getElementById("chkBarrio").value.trim();
  const address = document.getElementById("chkAddress").value.trim();
  const diffBilling = document.getElementById("diffBillingCheck").checked;
  const billingAddress = diffBilling ? document.getElementById("chkBillingAddress").value.trim() : "";

  const totals = calculateCartTotals(state.checkout.shippingId);
  const orderNumber = `KATE-2026-${Math.floor(1050 + Math.random() * 8900)}`;
  const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

  const newOrder = {
    id: orderNumber,
    date: nowStr,
    customer: {
      name,
      doc,
      email,
      phone,
      city,
      address: `${address}, Barrio ${barrio}`,
      billingAddress
    },
    items: state.cart.map((i) => ({
      name: i.name,
      size: i.size,
      color: i.color,
      qty: i.qty,
      price: i.price
    })),
    shippingMethod: totals.shippingOption.name,
    shippingCost: totals.shippingCost,
    paymentMethod: state.checkout.paymentMethod,
    subtotal: totals.subtotal,
    tax: totals.ivaEstimado,
    total: totals.total,
    status: "Pendiente"
  };

  // Descontar inventario en vivo
  const purchasedItems = [...state.cart];
  purchasedItems.forEach((cartItem) => {
    const prod = state.products.find((p) => p.id === cartItem.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - cartItem.qty);
    }
  });

  // Guardar pedido en Supabase si está conectado
  if (state.dbConnected) {
    try {
      await KateDB.createOrder(newOrder);
      await Promise.all(
        purchasedItems.map((cartItem) => {
          const prod = state.products.find((p) => p.id === cartItem.productId);
          return prod ? KateDB.updateProductInventory(prod.id, prod.price, prod.stock) : Promise.resolve();
        })
      );
    } catch (err) {
      console.warn("Error guardando pedido en Supabase:", err?.message || err);
    }
  }

  // Guardar pedido, actualizar analítica y vaciar carrito
  state.orders.unshift(newOrder);
  state.cart = [];

  saveState(STORAGE_KEYS.products, state.products);
  saveState(STORAGE_KEYS.orders, state.orders);
  saveState(STORAGE_KEYS.cart, state.cart);

  updateCartBadge();
  renderFeatured();
  if (state.activeView === "catalogo") renderCatalog();
  if (state.activeView === "admin") renderAdmin();

  // Pantalla de confirmación "Gracias por tu compra"
  document.getElementById("checkoutModalContent").innerHTML = `
    <div class="confirmation-box">
      <div class="confirmation-icon">✓</div>
      <span class="section-eyebrow">Pedido Confirmado</span>
      <h2 style="font-family:var(--font-serif); font-size:2rem; margin-bottom:0.5rem;">¡Gracias por tu compra, ${name.split(" ")[0]}!</h2>
      <p style="color:var(--text-muted); max-width:500px; margin:0 auto 1.4rem;">
        Hemos enviado un correo de confirmación a <strong>${email}</strong> con el detalle de tu factura y seguimiento por WhatsApp al <strong>${phone}</strong>.
      </p>

      <div style="background:var(--bg); border:1px solid var(--border); border-radius:14px; padding:1.25rem; max-width:480px; margin:0 auto 1.6rem; text-align:left; font-size:0.9rem;">
        <div class="summary-line"><span>Número de pedido</span><strong style="color:var(--primary);">${newOrder.id}</strong></div>
        <div class="summary-line"><span>Método de envío</span><strong>${newOrder.shippingMethod}</strong></div>
        <div class="summary-line"><span>Dirección</span><span>${newOrder.customer.address}, ${newOrder.customer.city}</span></div>
        <div class="summary-line"><span>Método de pago</span><strong>${newOrder.paymentMethod}</strong></div>
        <div class="summary-line total" style="margin-bottom:0;"><span>Total pagado</span><span>${formatCOP(newOrder.total)}</span></div>
      </div>

      <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-primary" id="finishCloseBtn">Seguir comprando</button>
        <button class="btn btn-outline" id="goAdminOrderBtn">Ver pedido en Panel Admin</button>
      </div>
    </div>
  `;

  showToast(`Pedido ${newOrder.id} registrado exitosamente.`);

  document.getElementById("finishCloseBtn").addEventListener("click", () => {
    document.getElementById("checkoutModal").classList.add("hidden");
  });

  document.getElementById("goAdminOrderBtn").addEventListener("click", () => {
    document.getElementById("checkoutModal").classList.add("hidden");
    state.activeAdminTab = "orders";
    navigateTo("admin");
  });
}

// ============================================================
// MÓDULO 4: ATENCIÓN AL CLIENTE (FAQ, CONTACTO, CHAT, LEGAL)
// ============================================================
function renderFAQ() {
  const container = document.getElementById("faqList");
  container.innerHTML = FAQ_ITEMS.map(
    (item, idx) => `
    <div class="faq-item ${idx === 0 ? "open" : ""}">
      <button class="faq-trigger" data-faq-idx="${idx}">
        <span>${item.q}</span>
        <span>${idx === 0 ? "−" : "+"}</span>
      </button>
      <div class="faq-answer">${item.a}</div>
    </div>
  `
  ).join("");

  container.querySelectorAll(".faq-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".faq-item");
      const isOpen = parent.classList.contains("open");
      parent.classList.toggle("open", !isOpen);
      btn.lastElementChild.textContent = isOpen ? "+" : "−";
    });
  });
}

function getBotReply(text) {
  const t = text.toLowerCase();
  if (t.includes("envio") || t.includes("envío") || t.includes("domicilio") || t.includes("tiempo")) {
    return "En Maicao hacemos entregas Exprés hoy mismo (2 a 4 horas) por $15.000, envío estándar por $8.000 (GRATIS desde $220.000) o recogida gratis en Calle 12 # 10-45.";
  }
  if (t.includes("pago") || t.includes("nequi") || t.includes("tarjeta") || t.includes("efectivo")) {
    return "Aceptamos Tarjetas Crédito/Débito, Nequi, Daviplata, PSE/Bancolombia, PayPal y pago contra entrega en efectivo en Maicao.";
  }
  if (t.includes("talla") || t.includes("medida")) {
    return "Manejamos tallas XS, S, M, L y XL según referencia. En la ficha de cada prenda encuentras las medidas exactas y materiales.";
  }
  if (t.includes("cambio") || t.includes("devolu") || t.includes("garant")) {
    return "Tienes 15 días calendario para cambios de talla sin costo en nuestra tienda de Maicao y 30 días de garantía por confección.";
  }
  if (t.includes("ubic") || t.includes("direc") || t.includes("donde") || t.includes("horario")) {
    return "Estamos en Calle 12 # 10-45, Local 104, Zona Comercial Centro, Maicao, La Guajira. Lun–Sáb 9 a.m. a 7 p.m. y Dom 10 a.m. a 2 p.m.";
  }
  return "Gracias por escribirnos ✨ Para atención personalizada inmediata también puedes tocar el botón verde de WhatsApp (+57 315 842 9104) o dejarnos tu consulta en Atención al Cliente.";
}

function openLegalModal(docKey) {
  const doc = LEGAL_DOCS[docKey];
  if (!doc) return;
  document.getElementById("legalModalContent").innerHTML = `
    <span class="section-eyebrow">Información Legal • Kate Store Maicao</span>
    <h2 style="font-family:var(--font-serif); font-size:1.55rem; margin-bottom:1rem;">${doc.title}</h2>
    <div style="font-size:0.92rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.75rem;">
      ${doc.body}
    </div>
  `;
  document.getElementById("legalModal").classList.remove("hidden");
}

// ============================================================
// MÓDULO 5: ANALÍTICA Y GESTIÓN (ADMIN)
// ============================================================
function renderAdmin() {
  // Activar pestaña seleccionada
  document.querySelectorAll(".admin-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.adminTab === state.activeAdminTab);
  });
  document.querySelectorAll(".admin-pane").forEach((p) => {
    p.classList.toggle("hidden", p.id !== `admin-tab-${state.activeAdminTab}`);
  });

  // Calcular KPIs en tiempo real
  const totalOrdersCount = state.analytics.completedPurchasesBase + state.orders.length;
  const conversionRate = ((totalOrdersCount / Math.max(1, state.analytics.visitors)) * 100).toFixed(2);
  const totalRevenue = state.orders
    .filter((o) => o.status !== "Cancelado")
    .reduce((sum, o) => sum + o.total, 0);
  const totalStockUnits = state.products.reduce((sum, p) => sum + p.stock, 0);

  document.getElementById("adminKpis").innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Visitantes (GA4)</div>
      <div class="kpi-value">${state.analytics.visitors.toLocaleString("es-CO")}</div>
      <div class="kpi-trend">▲ +14.2% vs semana anterior</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Tasa de Conversión</div>
      <div class="kpi-value">${conversionRate}%</div>
      <div class="kpi-trend">${totalOrdersCount} compras registradas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Ventas en Pedidos</div>
      <div class="kpi-value">${formatCOP(totalRevenue)}</div>
      <div class="kpi-trend">${state.orders.length} pedidos en gestión</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Inventario Activo</div>
      <div class="kpi-value">${totalStockUnits} unid.</div>
      <div class="kpi-trend">${state.products.length} referencias publicadas</div>
    </div>
  `;

  updateDbBadge();
  renderAnalyticsCharts();
  renderInventoryTable();
  renderOrdersTable();
  renderMessagesTable();
}

function renderAnalyticsCharts() {
  // 1. Gráfico SVG de visitantes últimos 7 días
  const data = state.analytics.dailyVisitors;
  const maxVal = Math.max(...data.map((d) => d.count), 10);
  const chartW = 460;
  const chartH = 190;
  const barW = 36;
  const gap = (chartW - data.length * barW) / (data.length + 1);

  const barsSVG = data
    .map((d, i) => {
      const h = Math.round((d.count / maxVal) * 130);
      const x = gap + i * (barW + gap);
      const y = 150 - h;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" fill="${i === data.length - 1 ? "#C4633E" : "#C99B58"}" />
          <text x="${x + barW / 2}" y="${y - 6}" text-anchor="middle" font-size="11" font-weight="700" fill="#231A16">${d.count}</text>
          <text x="${x + barW / 2}" y="172" text-anchor="middle" font-size="12" fill="#6C5D53">${d.day}</text>
        </g>
      `;
    })
    .join("");

  document.getElementById("visitorsChart").innerHTML = `
    <svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%; height:auto; display:block;">
      <line x1="12" y1="150" x2="${chartW - 12}" y2="150" stroke="#E6DACB" stroke-width="1.5" />
      ${barsSVG}
    </svg>
  `;

  // 2. Productos más vistos
  const sortedByViews = [...state.products].sort((a, b) => (b.views || 0) - (a.views || 0));
  const maxViews = Math.max(...sortedByViews.map((p) => p.views || 1), 1);

  document.getElementById("topProductsChart").innerHTML = sortedByViews
    .map((p) => {
      const pct = Math.round(((p.views || 0) / maxViews) * 100);
      return `
        <div class="bar-chart-row">
          <div class="bar-chart-meta">
            <strong>${p.name}</strong>
            <span style="color:var(--text-muted);">${p.views || 0} vistas</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderInventoryTable() {
  const tbody = document.getElementById("inventoryTableBody");
  tbody.innerHTML = state.products
    .map(
      (p) => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <img src="${normalizeImageSrc(p.image)}" alt="${p.name}" onerror="handleKateImgError(this)" style="width:42px; height:52px; object-fit:cover; border-radius:6px;" />
            <div>
              <strong>${p.name}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${p.sku}</div>
            </div>
          </div>
        </td>
        <td>${p.category}</td>
        <td>
          <input type="number" class="inline-input" id="inv-price-${p.id}" value="${p.price}" min="1000" step="1000" />
        </td>
        <td>
          <input type="number" class="inline-input" id="inv-stock-${p.id}" value="${p.stock}" min="0" style="width:72px;" />
        </td>
        <td>${p.views || 0}</td>
        <td>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn btn-dark btn-sm" data-save-inv="${p.id}">Guardar</button>
            <label class="btn btn-outline btn-sm" style="cursor:pointer; margin:0;" title="Subir nueva foto a Supabase Storage">
              📷 Foto
              <input type="file" accept="image/*" data-upload-img="${p.id}" style="display:none;" />
            </label>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-upload-img]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const id = input.dataset.uploadImg;
      const prod = state.products.find((p) => p.id === id);
      if (!prod) return;

      showToast(`Subiendo foto de ${prod.name}...`);
      try {
        const publicUrl = await KateDB.uploadProductImage(file, prod.sku || prod.id);
        prod.image = publicUrl;
        saveState(STORAGE_KEYS.products, state.products);
        if (state.dbConnected) {
          await KateDB.updateProductImage(prod.id, publicUrl);
        }
        renderAdmin();
        renderFeatured();
        if (state.activeView === "catalogo") renderCatalog();
        showToast(`¡Foto actualizada en Supabase para ${prod.name}!`);
      } catch (err) {
        console.warn("Error subiendo imagen:", err?.message || err);
        showToast("Error al subir foto. Ejecuta supabase/storage.sql en Supabase primero.");
      }
    });
  });

  tbody.querySelectorAll("[data-save-inv]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.saveInv;
      const prod = state.products.find((p) => p.id === id);
      if (!prod) return;

      const newPrice = Number(document.getElementById(`inv-price-${id}`).value);
      const newStock = Number(document.getElementById(`inv-stock-${id}`).value);

      if (newPrice >= 1000) prod.price = newPrice;
      if (newStock >= 0) prod.stock = newStock;

      saveState(STORAGE_KEYS.products, state.products);
      if (state.dbConnected) {
        try {
          await KateDB.updateProductInventory(prod.id, prod.price, prod.stock);
        } catch (err) {
          console.warn("Error actualizando inventario en Supabase:", err?.message || err);
        }
      }
      renderAdmin();
      renderFeatured();
      showToast(`Inventario actualizado: ${prod.name}`);
    });
  });
}

function renderOrdersTable() {
  const tbody = document.getElementById("ordersTableBody");
  const statuses = ["Pendiente", "Preparando", "Enviado", "Entregado", "Cancelado"];

  tbody.innerHTML = state.orders
    .map(
      (o) => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td style="white-space:nowrap; font-size:0.82rem; color:var(--text-muted);">${o.date}</td>
        <td>
          <strong>${o.customer.name}</strong>
          <div style="font-size:0.78rem; color:var(--text-muted);">${o.customer.email} • ${o.customer.phone}</div>
          <div style="font-size:0.78rem; color:var(--text-muted);">${o.customer.address}, ${o.customer.city}</div>
        </td>
        <td style="font-size:0.82rem;">
          ${o.items.map((i) => `${i.qty}× ${i.name} (${i.size})`).join("<br/>")}
          <div style="color:var(--text-muted); margin-top:0.2rem;">${o.shippingMethod} • ${o.paymentMethod}</div>
        </td>
        <td style="white-space:nowrap;"><strong>${formatCOP(o.total)}</strong></td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-start;">
            <span class="status-badge status-${o.status}">${o.status}</span>
            <select class="inline-input" style="width:125px;" data-order-status="${o.id}">
              ${statuses.map((s) => `<option value="${s}" ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("[data-order-status]").forEach((sel) => {
    sel.addEventListener("change", async (e) => {
      const order = state.orders.find((o) => o.id === sel.dataset.orderStatus);
      if (!order) return;
      order.status = e.target.value;
      saveState(STORAGE_KEYS.orders, state.orders);
      if (state.dbConnected) {
        try {
          await KateDB.updateOrderStatus(order.id, order.status);
        } catch (err) {
          console.warn("Error actualizando pedido en Supabase:", err?.message || err);
        }
      }
      renderAdmin();
      showToast(`Pedido ${order.id} marcado como "${order.status}".`);
    });
  });
}

function renderMessagesTable() {
  const tbody = document.getElementById("messagesTableBody");
  if (!tbody) return;
  if (!state.messages || state.messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
          Aún no hay mensajes enviados desde el formulario de Atención al Cliente.
        </td>
      </tr>
    `;
    return;
  }
  tbody.innerHTML = state.messages
    .map((m) => {
      const dateStr = m.created_at
        ? new Date(m.created_at).toISOString().slice(0, 16).replace("T", " ")
        : "Ahora";
      return `
        <tr>
          <td style="white-space:nowrap; font-size:0.82rem; color:var(--text-muted);">${dateStr}</td>
          <td><strong>${escapeHTML(m.name)}</strong></td>
          <td>${escapeHTML(m.email)}</td>
          <td style="font-size:0.86rem;">${escapeHTML(m.message)}</td>
        </tr>
      `;
    })
    .join("");
}

// ============================================================
// INICIALIZACIÓN Y EVENTOS GLOBALES
// ============================================================
function bindEvents() {
  // Navegación
  document.body.addEventListener("click", (e) => {
    const navTarget = e.target.closest("[data-nav]");
    if (navTarget) {
      e.preventDefault();
      if (navTarget.dataset.nav === "catalogo") {
        state.filters.onlyOffers = false;
        document.getElementById("onlyOffersCheck").checked = false;
      }
      navigateTo(navTarget.dataset.nav);
      return;
    }

    const openProd = e.target.closest("[data-open-product]");
    if (openProd) {
      openProductDetail(openProd.dataset.openProduct);
      return;
    }

    const quickAdd = e.target.closest("[data-quick-add]");
    if (quickAdd) {
      addToCart(quickAdd.dataset.quickAdd);
      return;
    }

    const catChip = e.target.closest("[data-filter-cat]");
    if (catChip) {
      state.filters.category = catChip.dataset.filterCat;
      renderCatalog();
      return;
    }

    const sizeChip = e.target.closest("[data-filter-size]");
    if (sizeChip) {
      state.filters.size = sizeChip.dataset.filterSize;
      renderCatalog();
      return;
    }

    const colorChip = e.target.closest("[data-filter-color]");
    if (colorChip) {
      state.filters.color = colorChip.dataset.filterColor;
      renderCatalog();
      return;
    }

    const legalBtn = e.target.closest("[data-legal]");
    if (legalBtn) {
      openLegalModal(legalBtn.dataset.legal);
      return;
    }

    const adminTab = e.target.closest("[data-admin-tab]");
    if (adminTab) {
      state.activeAdminTab = adminTab.dataset.adminTab;
      renderAdmin();
      return;
    }
  });

  // Menú móvil
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });

  // Filtros de catálogo
  document.getElementById("searchInput").addEventListener("input", (e) => {
    state.filters.search = e.target.value;
    renderCatalog();
  });

  document.getElementById("priceRange").addEventListener("input", (e) => {
    state.filters.maxPrice = Number(e.target.value);
    document.getElementById("priceRangeLabel").textContent = formatCOP(state.filters.maxPrice);
    renderCatalog();
  });

  document.getElementById("onlyOffersCheck").addEventListener("change", (e) => {
    state.filters.onlyOffers = e.target.checked;
    renderCatalog();
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.filters.sort = e.target.value;
    renderCatalog();
  });

  document.getElementById("clearFiltersBtn").addEventListener("click", resetFilters);

  document.getElementById("gridViewBtn").addEventListener("click", () => {
    state.catalogViewMode = "grid";
    document.getElementById("gridViewBtn").classList.add("active");
    document.getElementById("listViewBtn").classList.remove("active");
    renderCatalog();
  });

  document.getElementById("listViewBtn").addEventListener("click", () => {
    state.catalogViewMode = "list";
    document.getElementById("listViewBtn").classList.add("active");
    document.getElementById("gridViewBtn").classList.remove("active");
    renderCatalog();
  });

  // Carrito Drawer
  document.getElementById("openCartBtn").addEventListener("click", openCartDrawer);
  document.getElementById("closeCartBtn").addEventListener("click", closeCartDrawer);
  document.getElementById("cartDrawer").addEventListener("click", (e) => {
    if (e.target.id === "cartDrawer") closeCartDrawer();
  });

  // Cierre de modales
  [
    ["productModal", "closeProductModal"],
    ["checkoutModal", "closeCheckoutModal"],
    ["legalModal", "closeLegalModal"],
    ["newProductModal", "closeNewProductModal"]
  ].forEach(([modalId, closeId]) => {
    const modal = document.getElementById(modalId);
    document.getElementById(closeId).addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => {
      if (e.target.id === modalId) modal.classList.add("hidden");
    });
  });

  // Formulario de Contacto (Módulo 4 -> Guarda en Supabase)
  document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();

    state.messages.unshift({ name, email, message, created_at: new Date().toISOString() });
    if (state.dbConnected) {
      try {
        await KateDB.createContactMessage({ name, email, message });
      } catch (err) {
        console.warn("Error guardando mensaje en Supabase:", err?.message || err);
      }
    }
    showToast(`¡Gracias ${name}! Recibimos tu mensaje y te responderemos pronto.`);
    e.target.reset();
  });

  // Chat en vivo flotante
  const chatWidget = document.getElementById("chatWidget");
  document.getElementById("toggleChatBtn").addEventListener("click", () => {
    chatWidget.classList.toggle("hidden");
  });
  document.getElementById("closeChatBtn").addEventListener("click", () => {
    chatWidget.classList.add("hidden");
  });
  document.getElementById("chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    const box = document.getElementById("chatMessages");
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.textContent = msg;
    box.appendChild(userBubble);
    input.value = "";
    setTimeout(() => {
      const botBubble = document.createElement("div");
      botBubble.className = "chat-bubble bot";
      botBubble.textContent = getBotReply(msg);
      box.appendChild(botBubble);
      box.scrollTop = box.scrollHeight;
    }, 350);
    box.scrollTop = box.scrollHeight;
  });

  // Admin: Nuevo producto
  document.getElementById("openNewProductBtn").addEventListener("click", () => {
    document.getElementById("newProductModal").classList.remove("hidden");
  });

  document.getElementById("newProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("npName").value.trim();
    const category = document.getElementById("npCategory").value;
    const price = Number(document.getElementById("npPrice").value);
    const stock = Number(document.getElementById("npStock").value);
    const desc = document.getElementById("npDesc").value.trim();

    const fallbackImgs = {
      Vestidos: "./assets/vestido-brisa.jpg",
      Conjuntos: "./assets/conjunto-cabo.jpg",
      Blusas: "./assets/blusa-palma.jpg",
      Faldas: "./assets/falda-arena.jpg",
      Accesorios: "./assets/bolso-guajira.jpg"
    };

    const sku = `KATE-NEW-${Math.floor(100 + Math.random() * 899)}`;
    let imageUrl = fallbackImgs[category] || "./assets/vestido-brisa.jpg";
    const fileInput = document.getElementById("npImageFile");
    if (fileInput && fileInput.files && fileInput.files[0]) {
      try {
        showToast("Subiendo imagen a Supabase Storage...");
        imageUrl = await KateDB.uploadProductImage(fileInput.files[0], sku);
      } catch (err) {
        console.warn("No se pudo subir imagen a Storage:", err?.message || err);
        showToast("No se pudo subir la foto a Storage (ejecuta supabase/storage.sql). Se usó imagen predeterminada.");
      }
    }

    const newProd = {
      id: `prod-${Date.now()}`,
      sku,
      name,
      category,
      price,
      originalPrice: null,
      featured: true,
      badge: "Nuevo",
      stock,
      views: 1,
      image: imageUrl,
      angles: [
        { label: "Vista frontal", pos: "50% 25%", scale: 1 },
        { label: "Detalle tela", pos: "50% 45%", scale: 1.6 },
        { label: "Acercamiento", pos: "50% 70%", scale: 1.5 }
      ],
      colors: [
        { name: "Marfil", hex: "#F3EDE2" },
        { name: "Terracota", hex: "#C4633E" }
      ],
      sizes: category === "Accesorios" ? ["Única"] : ["S", "M", "L"],
      description: desc,
      specs: {
        material: "Confección fresca seleccionada para clima cálido",
        medidas: "Ajuste estándar colombiano",
        peso: "320 g",
        cuidados: "Lavar a mano con agua fría",
        origen: "Kate Store Maicao"
      }
    };

    state.products.unshift(newProd);
    saveState(STORAGE_KEYS.products, state.products);
    if (state.dbConnected) {
      try {
        await KateDB.upsertProduct(newProd);
      } catch (err) {
        console.warn("Error publicando producto en Supabase:", err?.message || err);
      }
    }
    document.getElementById("newProductModal").classList.add("hidden");
    e.target.reset();
    renderAdmin();
    renderFeatured();
    showToast(`Prenda "${name}" publicada en el catálogo.`);
  });

  // Admin: Recargar desde Supabase
  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    syncFromSupabase(true);
  });
}

// ---------- Arranque ----------
document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  updateCartBadge();
  renderFeatured();
  renderFAQ();
  await syncFromSupabase(false);
  recordVisit();
});
