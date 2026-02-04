// ======= Datos (puedes editar y meter tus productos reales) =======
const PRODUCTS = [
  {
    id: "m1",
    name: "Manilla Ónix Minimal",
    category: "manillas",
    price: 39000,
    material: "Cuero + acero",
    color: "Negro",
    featured: true,
    image: "./img/1.jpg",
    desc: "Diseño sobrio, ajuste cómodo y herrajes premium."
  },
  {
    id: "m2",
    name: "Manilla Aurora Trenzada",
    category: "manillas",
    price: 45000,
    material: "Cuero trenzado",
    color: "Caramelo",
    featured: false,
    image: "./img/2.jpeg",
    desc: "Textura elegante con acabado artesanal."
  },
  {
    id: "p1",
    name: "Pulsera Perla Urbana",
    category: "pulseras",
    price: 52000,
    material: "Perla sintética + acero",
    color: "Marfil",
    featured: true,
    image: "./img/3.jpeg",
    desc: "Un toque clásico para looks modernos."
  },
  {
    id: "p2",
    name: "Pulsera Cadena Nébula",
    category: "pulseras",
    price: 61000,
    material: "Acero inoxidable",
    color: "Plata",
    featured: false,
    image: "./img/4.jpeg",
    desc: "Brillo discreto con eslabones finos."
  },
  {
    id: "a1",
    name: "Anillo Halo",
    category: "anillos",
    price: 56000,
    material: "Acero inoxidable",
    color: "Plata",
    featured: true,
    image: "./img/5.jpeg",
    desc: "Perfil delgado, perfecto para combinar."
  },
  {
    id: "a2",
    name: "Anillo Sello Eclipse",
    category: "anillos",
    price: 72000,
    material: "Acero + acabado mate",
    color: "Grafito",
    featured: false,
    image: "./img/6.jpeg",
    desc: "Presencia fuerte, estética minimal."
  },
  {
    id: "c1",
    name: "Collar Línea Boreal",
    category: "collares",
    price: 68000,
    material: "Acero inoxidable",
    color: "Plata",
    featured: true,
    image: "./img/7.jpeg",
    desc: "Cadena fina con caída elegante."
  },
  {
    id: "c2",
    name: "Collar Dije Luna",
    category: "collares",
    price: 74000,
    material: "Acero + baño",
    color: "Dorado suave",
    featured: false,
    image: "./img/8.jpeg",
    desc: "Dije sutil, ideal para regalo."
  }
];

// ======= Helpers =======
const $ = (sel) => document.querySelector(sel);
const money = (n) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const STORAGE_KEY = "lumina_cart_v1";

// ======= Estado =======
let state = {
  search: "",
  category: "all",
  sort: "featured",
  cart: loadCart()
};

// ======= Elementos =======
const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");
const clearSearchBtn = $("#clearSearchBtn");
const categorySelect = $("#categorySelect");
const sortSelect = $("#sortSelect");
const resultsHint = $("#resultsHint");

const cartDrawer = $("#cartDrawer");
const cartBackdrop = $("#cartBackdrop");
const cartOpenBtn = $("#cartOpenBtn");
const cartCloseBtn = $("#cartCloseBtn");
const cartItems = $("#cartItems");
const cartCount = $("#cartCount");
const cartSub = $("#cartSub");
const subtotalEl = $("#subtotal");
const shippingEl = $("#shipping");
const totalEl = $("#total");
const clearCartBtn = $("#clearCartBtn");
const checkoutBtn = $("#checkoutBtn");

const modal = $("#productModal");
const modalBackdrop = $("#modalBackdrop");
const modalCloseBtn = $("#modalCloseBtn");  
const modalContent = $("#modalContent");

const toast = $("#toast");
const openFeaturedBtn = $("#openFeaturedBtn");

// ======= Render productos =======
function getFilteredProducts() {
  const q = state.search.trim().toLowerCase();
  let items = PRODUCTS.filter(p => {
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.material.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q);

    const matchesCategory = state.category === "all" || p.category === state.category;
    return matchesSearch && matchesCategory;
  });

  switch (state.sort) {
    case "priceAsc":
      items.sort((a,b) => a.price - b.price); break;
    case "priceDesc":
      items.sort((a,b) => b.price - a.price); break;
    case "nameAsc":
      items.sort((a,b) => a.name.localeCompare(b.name, "es")); break;
    case "featured":
    default:
      items.sort((a,b) => (b.featured === true) - (a.featured === true) || a.price - b.price);
  }

  return items;
}

function renderProducts() {
  const items = getFilteredProducts();
  resultsHint.textContent = items.length
    ? `Mostrando ${items.length} producto(s).`
    : `No encontramos productos con ese filtro.`;

  productsGrid.innerHTML = items.map(p => `
    <article class="card">
      <div class="card__img">
        ${productImageOrFallback(p)}
        <span class="badge">${capitalize(p.category)}</span>
      </div>

      <div class="card__body">
        <div class="card__name">
          <span>${escapeHtml(p.name)}</span>
          <span class="price">${money(p.price)}</span>
        </div>
        <div class="card__desc">${escapeHtml(p.desc)}</div>
        <div class="card__actions">
          <button class="iconBtn" data-action="view" data-id="${p.id}">Ver</button>
          <button class="btn btn--small" data-action="add" data-id="${p.id}">Agregar</button>
        </div>
      </div>
    </article>
  `).join("");

  productsGrid.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "add") addToCart(id, 1);
      if (action === "view") openProductModal(id);
    });
  });
}

// ======= Carrito =======
function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function cartItemsArray() {
  return Object.entries(state.cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === id), qty }))
    .filter(x => x.product && x.qty > 0);
}

function cartCountTotal() {
  return cartItemsArray().reduce((sum, x) => sum + x.qty, 0);
}

function cartSubtotal() {
  return cartItemsArray().reduce((sum, x) => sum + x.qty * x.product.price, 0);
}

function shippingCost(subtotal) {
  // Simple: envío gratis desde 120k, si no 9k
  if (subtotal === 0) return 0;
  return subtotal >= 120000 ? 0 : 9000;
}

function addToCart(id, qty) {
  state.cart[id] = (state.cart[id] || 0) + qty;
  saveCart();
  renderCart();
  showToast("Agregado al carrito ✅");
}

function setQty(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
  saveCart();
  renderCart();
}

function clearCart() {
  state.cart = {};
  saveCart();
  renderCart();
  showToast("Carrito vacío.");
}

function renderCart() {
  const items = cartItemsArray();
  const count = cartCountTotal();
  cartCount.textContent = String(count);
  cartSub.textContent = `${count} artículo(s)`;

  if (!items.length) {
    cartItems.innerHTML = `
      <div class="muted" style="padding:10px 2px;">
        Tu carrito está vacío. Agrega algo del catálogo ✨
      </div>
    `;
  } else {
    cartItems.innerHTML = items.map(({ product, qty }) => `
      <div class="cartItem">
        <div class="cartItem__thumb" aria-hidden="true"></div>
        <div class="cartItem__meta">
          <div class="cartItem__top">
            <div>
              <div style="font-weight:750;">${escapeHtml(product.name)}</div>
              <div class="muted tiny">${capitalize(product.category)} • ${escapeHtml(product.material)} • ${escapeHtml(product.color)}</div>
            </div>
            <button class="iconBtn" data-remove="${product.id}" aria-label="Quitar">🗑️</button>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div class="qty">
              <button data-dec="${product.id}" aria-label="Disminuir">−</button>
              <span>${qty}</span>
              <button data-inc="${product.id}" aria-label="Aumentar">+</button>
            </div>
            <div class="price">${money(product.price * qty)}</div>
          </div>
        </div>
      </div>
    `).join("");

    cartItems.querySelectorAll("button[data-remove]").forEach(b => {
      b.addEventListener("click", () => setQty(b.dataset.remove, 0));
    });
    cartItems.querySelectorAll("button[data-dec]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.dec;
        setQty(id, (state.cart[id] || 1) - 1);
      });
    });
    cartItems.querySelectorAll("button[data-inc]").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.inc;
        setQty(id, (state.cart[id] || 0) + 1);
      });
    });
  }

  const sub = cartSubtotal();
  const ship = shippingCost(sub);
  subtotalEl.textContent = money(sub);
  shippingEl.textContent = ship === 0 ? "Gratis" : money(ship);
  totalEl.textContent = money(sub + ship);

  checkoutBtn.disabled = (sub === 0);
  clearCartBtn.disabled = (sub === 0);
  checkoutBtn.style.opacity = checkoutBtn.disabled ? ".6" : "1";
  clearCartBtn.style.opacity = clearCartBtn.disabled ? ".6" : "1";
}

// ======= Drawer (carrito) =======
function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

// ======= Modal producto =======
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  modalContent.innerHTML = `
    <div class="modalMedia" aria-hidden="true">
      ${productImageOrFallback(p, true)}
    </div>
    <div class="modalInfo">
      <h3>${escapeHtml(p.name)}</h3>
      <div class="kv">
        <span>${capitalize(p.category)}</span>
        <span>${escapeHtml(p.material)}</span>
        <span>${escapeHtml(p.color)}</span>
        ${p.featured ? "<span>★ Destacado</span>" : ""}
      </div>
      <p class="muted">${escapeHtml(p.desc)} Ideal para combinar con looks casuales o formales.</p>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:6px;">
        <div class="price" style="font-size:1.2rem;">${money(p.price)}</div>
        <button class="btn" id="modalAddBtn">Agregar al carrito</button>
      </div>
      <div class="tiny muted">Tip: cambia imágenes reales y conecta a una pasarela (Stripe/MercadoPago) cuando quieras.</div>
    </div>
  `;

  $("#modalAddBtn").addEventListener("click", () => {
    addToCart(p.id, 1);
    closeModal();
    openCart();
  });

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

// ======= Toast =======
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
}

// ======= Eventos UI =======
searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  renderProducts();
});
clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  state.search = "";
  renderProducts();
  searchInput.focus();
});

categorySelect.addEventListener("change", () => {
  state.category = categorySelect.value;
  renderProducts();
});
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  renderProducts();
});

cartOpenBtn.addEventListener("click", () => { renderCart(); openCart(); });
cartCloseBtn.addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);

modalBackdrop.addEventListener("click", closeModal);
modalCloseBtn.addEventListener("click", closeModal);

clearCartBtn.addEventListener("click", clearCart);

checkoutBtn.addEventListener("click", () => {
  const sub = cartSubtotal();
  const ship = shippingCost(sub);
  const total = sub + ship;

  // Checkout simulado
  showToast("Checkout listo ✅ (simulado)");
  alert(
    `Pedido simulado:\n\nSubtotal: ${money(sub)}\nEnvío: ${ship === 0 ? "Gratis" : money(ship)}\nTotal: ${money(total)}\n\nSiguiente paso: conectar pasarela de pago.`
  );
});

openFeaturedBtn.addEventListener("click", () => {
  state.sort = "featured";
  sortSelect.value = "featured";
  state.category = "all";
  categorySelect.value = "all";
  renderProducts();
  document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
});

// Accesibilidad: ESC cierra modal/drawer
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeCart();
  }
});

// ======= Inicio =======
renderProducts();
renderCart();

// ======= Utils =======
function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productImageOrFallback(p, isModal = false){
  const label = (p?.name || "Producto").split(" ").slice(0,2).join(" ");
  const cls = isModal ? 'style="width:100%;height:100%;object-fit:cover;display:block;"' : "";
  
  if (p?.image) {
    // usamos onerror para que si la ruta está mal, caiga al fallback
    return `
      <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}"
           ${cls}
           onerror="this.outerHTML='<div class=\\'imgFallback\\'>${escapeHtml(label)}</div>'">
    `;
  }

  return `<div class="imgFallback">${escapeHtml(label)}</div>`;
}

function escapeAttr(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}


// Filtros colapsables en móvil
const filtersToggleBtn = document.querySelector("#filtersToggleBtn");
const filtersPanel = document.querySelector("#filtersPanel");

if (filtersToggleBtn && filtersPanel) {
  filtersToggleBtn.addEventListener("click", () => {
    filtersPanel.classList.toggle("open");
    filtersToggleBtn.textContent = filtersPanel.classList.contains("open")
      ? "Filtros ▴"
      : "Filtros ▾";
  });
}
