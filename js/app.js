const API_URL = "https://dummyjson.com/products";
const app = document.querySelector("#app");
const cartCount = document.querySelector("#cartCount");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");

let products = [];
let cart = JSON.parse(localStorage.getItem("princeCart") || "[]");

const money = value => `$${Number(value).toFixed(2)}`;

function saveCart() {
  localStorage.setItem("princeCart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
}

function navigate(path) {
  if (location.hash !== `#${path}`) location.hash = path;
  else renderRoute();
}

function layout(content) {
  app.innerHTML = content;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function productCard(product) {
  return `
    <article class="card">
      <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
      <div class="card-body">
        <span class="tag">${product.category}</span>
        <h3>${product.title}</h3>
        <p>${product.description.slice(0, 90)}...</p>
        <div class="price">${money(product.price)}</div>
        <div class="card-actions">
          <button class="btn" data-add="${product.id}">Add to cart</button>
          <button class="btn secondary" data-view="${product.id}">Details</button>
        </div>
      </div>
    </article>
  `;
}

function bindProductEvents() {
  document.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => addToCart(Number(button.dataset.add)));
  });
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => navigate(`/product/${button.dataset.view}`));
  });
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity += 1;
  else cart.push({ id, title: product.title, price: product.price, thumbnail: product.thumbnail, quantity: 1 });
  saveCart();
  alert(`${product.title} added to cart.`);
}

async function loadProducts() {
  if (products.length) return products;
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Unable to load products.");
  const data = await response.json();
  products = data.products;
  return products;
}

async function renderHome() {
  layout(`
    <section class="hero">
      <div>
        <span class="tag">Task 5 Capstone Project</span>
        <h1>Everything you need, in one place.</h1>
        <p>A responsive product catalog with API data, search, filters, client-side routing, cart state and localStorage persistence.</p>
        <a class="btn" href="#/products">Explore products</a>
      </div>
      <div class="hero-art" aria-hidden="true">🛍️</div>
    </section>
    <div class="section-heading"><h2>Featured products</h2><a href="#/products">View all</a></div>
    <div id="featured" class="products-grid"><div class="spinner">Loading products...</div></div>
  `);
  try {
    const data = await loadProducts();
    document.querySelector("#featured").innerHTML = data.slice(0, 4).map(productCard).join("");
    bindProductEvents();
  } catch (error) {
    document.querySelector("#featured").innerHTML = `<p class="status error">${error.message}</p>`;
  }
}

async function renderProducts() {
  layout(`
    <div class="section-heading"><h1>All Products</h1><span id="resultCount"></span></div>
    <div class="controls">
      <input class="field" id="search" type="search" placeholder="Search products..." aria-label="Search products">
      <select class="field" id="category" aria-label="Filter by category"><option value="">All categories</option></select>
      <select class="field" id="sort" aria-label="Sort products">
        <option value="default">Sort by</option>
        <option value="low">Price: low to high</option>
        <option value="high">Price: high to low</option>
        <option value="name">Name: A to Z</option>
      </select>
    </div>
    <div id="productGrid" class="products-grid"><div class="spinner">Loading products...</div></div>
  `);

  try {
    const data = await loadProducts();
    const categorySelect = document.querySelector("#category");
    [...new Set(data.map(item => item.category))].sort().forEach(category => {
      categorySelect.insertAdjacentHTML("beforeend", `<option value="${category}">${category}</option>`);
    });

    const renderFiltered = () => {
      const search = document.querySelector("#search").value.toLowerCase().trim();
      const category = categorySelect.value;
      const sort = document.querySelector("#sort").value;
      let filtered = data.filter(item =>
        item.title.toLowerCase().includes(search) &&
        (!category || item.category === category)
      );
      if (sort === "low") filtered.sort((a, b) => a.price - b.price);
      if (sort === "high") filtered.sort((a, b) => b.price - a.price);
      if (sort === "name") filtered.sort((a, b) => a.title.localeCompare(b.title));
      document.querySelector("#resultCount").textContent = `${filtered.length} products`;
      document.querySelector("#productGrid").innerHTML = filtered.length
        ? filtered.map(productCard).join("")
        : `<p class="status">No products found.</p>`;
      bindProductEvents();
    };

    ["search", "category", "sort"].forEach(id => document.querySelector(`#${id}`).addEventListener("input", renderFiltered));
    renderFiltered();
  } catch (error) {
    document.querySelector("#productGrid").innerHTML = `<p class="status error">${error.message}</p>`;
  }
}

async function renderProduct(id) {
  layout(`<div class="spinner">Loading product...</div>`);
  try {
    const product = (await loadProducts()).find(item => item.id === Number(id));
    if (!product) return layout(`<p class="status error">Product not found.</p>`);
    layout(`
      <article class="card" style="max-width:800px;margin:auto">
        <img src="${product.thumbnail}" alt="${product.title}">
        <div class="card-body">
          <span class="tag">${product.category}</span>
          <h1>${product.title}</h1>
          <p>${product.description}</p>
          <p><strong>Rating:</strong> ${product.rating} / 5</p>
          <p><strong>Stock:</strong> ${product.stock}</p>
          <div class="price">${money(product.price)}</div>
          <div class="card-actions">
            <button class="btn" id="addProduct">Add to cart</button>
            <a class="btn secondary" href="#/products">Back to products</a>
          </div>
        </div>
      </article>
    `);
    document.querySelector("#addProduct").addEventListener("click", () => addToCart(product.id));
  } catch (error) {
    layout(`<p class="status error">${error.message}</p>`);
  }
}

function renderCart() {
  if (!cart.length) {
    layout(`<div class="empty"><h1>Your cart is empty</h1><p>Add some products to see them here.</p><a class="btn" href="#/products">Shop now</a></div>`);
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  layout(`
    <div class="section-heading"><h1>Your Cart</h1><span>${cart.length} item types</span></div>
    <div class="cart-list">
      ${cart.map(item => `
        <article class="cart-item">
          <img src="${item.thumbnail}" alt="${item.title}">
          <div>
            <h3>${item.title}</h3>
            <p>${money(item.price)} each</p>
            <button class="btn danger" data-remove="${item.id}">Remove</button>
          </div>
          <div class="qty">
            <button data-decrease="${item.id}" aria-label="Decrease quantity">−</button>
            <strong>${item.quantity}</strong>
            <button data-increase="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </article>
      `).join("")}
    </div>
    <div class="cart-summary">
      <h2>Total: ${money(total)}</h2>
      <button class="btn" id="checkout">Checkout demo</button>
    </div>
  `);

  document.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => {
    cart = cart.filter(item => item.id !== Number(button.dataset.remove));
    saveCart(); renderCart();
  }));
  document.querySelectorAll("[data-increase]").forEach(button => button.addEventListener("click", () => {
    const item = cart.find(item => item.id === Number(button.dataset.increase));
    item.quantity += 1; saveCart(); renderCart();
  }));
  document.querySelectorAll("[data-decrease]").forEach(button => button.addEventListener("click", () => {
    const item = cart.find(item => item.id === Number(button.dataset.decrease));
    item.quantity -= 1;
    if (item.quantity <= 0) cart = cart.filter(cartItem => cartItem.id !== item.id);
    saveCart(); renderCart();
  }));
  document.querySelector("#checkout").addEventListener("click", () => alert("This is a demo checkout. No payment was processed."));
}

function renderAbout() {
  layout(`
    <article class="card">
      <div class="card-body">
        <h1>About Prince Store</h1>
        <p>This capstone project combines semantic HTML, responsive CSS, JavaScript state management, asynchronous REST API requests, filtering, client-side routing and localStorage.</p>
        <h2>Included concepts</h2>
        <ul>
          <li>Modular frontend structure</li>
          <li>Hash-based client-side routing</li>
          <li>Fetch API with async/await</li>
          <li>Error handling for network requests</li>
          <li>Search, filtering and sorting</li>
          <li>Cart CRUD operations</li>
          <li>Persistent browser data using localStorage</li>
          <li>Responsive and accessible interface</li>
        </ul>
      </div>
    </article>
  `);
}

function renderRoute() {
  const path = location.hash.slice(1) || "/";
  navLinks.classList.remove("open");
  if (path === "/") return renderHome();
  if (path === "/products") return renderProducts();
  if (path === "/cart") return renderCart();
  if (path === "/about") return renderAbout();
  if (path.startsWith("/product/")) return renderProduct(path.split("/")[2]);
  layout(`<p class="status error">Page not found. <a href="#/">Return home</a>.</p>`);
}

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});
window.addEventListener("hashchange", renderRoute);
updateCartCount();
renderRoute();
