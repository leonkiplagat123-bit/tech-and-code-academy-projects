(() => {
  const DELIVERY_FEE = 150;
  const money = (amount) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount).replace("KES", "KSh");
  const state = { menu: [], cart: new Map(), category: "all", query: "" };
  const $ = (selector) => document.querySelector(selector);
  const grid = $("#menu-grid");
  const categories = $("#categories");

  async function request(url, options = {}) {
    const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  function visibleMenu() {
    const query = state.query.trim().toLowerCase();
    return state.menu.filter(item =>
      (state.category === "all" || item.category === state.category) &&
      (!query || item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query))
    );
  }

  function renderMenu() {
    const items = visibleMenu();
    $("#menu-message").textContent = items.length ? "" : "No meals match your search. Try another term or category.";
    grid.innerHTML = items.map(item => {
      const quantity = state.cart.get(item.id) || 0;
      return `<article class="food-card">
        <div class="food-art art-${item.id}" aria-hidden="true"><span>${item.emoji}</span>${item.popular ? '<b class="popular-tag">Neighbourhood favourite</b>' : ""}</div>
        <div class="food-info"><p class="food-category">${item.category}</p><h3>${item.name}</h3><p class="food-description">${item.description}</p>
          <div class="food-bottom"><strong>${money(item.price)}</strong><button class="add-button" data-add="${item.id}" type="button" aria-label="Add ${item.name} to basket">${quantity ? `Added · ${quantity} +` : "Add +"}</button></div>
        </div></article>`;
    }).join("");
  }

  function renderCategories(names) {
    categories.innerHTML = ["all", ...names].map(name => `<button class="filter ${state.category === name ? "active" : ""}" data-category="${name}" type="button">${name === "all" ? "Everything" : name}</button>`).join("");
  }

  function renderCart() {
    const rows = [...state.cart.entries()].filter(([, qty]) => qty > 0);
    const subtotal = rows.reduce((sum, [id, qty]) => sum + state.menu.find(item => item.id === id).price * qty, 0);
    $("#cart-count").textContent = rows.reduce((sum, [, qty]) => sum + qty, 0);
    $("#subtotal").textContent = money(subtotal);
    $("#delivery").textContent = money(DELIVERY_FEE);
    $("#total").textContent = money(subtotal + DELIVERY_FEE);
    $("#checkout-total").textContent = money(subtotal + DELIVERY_FEE);
    $("#cart-items").innerHTML = rows.length ? rows.map(([id, qty]) => {
      const item = state.menu.find(entry => entry.id === id);
      return `<div class="cart-row"><div class="cart-item-emoji">${item.emoji}</div><div class="cart-item-name"><strong>${item.name}</strong><span>${money(item.price)} each</span></div><div class="quantity-controls"><button data-change="${id}" data-delta="-1" aria-label="Remove one ${item.name}" type="button">−</button><span>${qty}</span><button data-change="${id}" data-delta="1" aria-label="Add one ${item.name}" type="button">+</button></div><strong class="line-total">${money(item.price * qty)}</strong></div>`;
    }).join("") : '<p class="muted">Your basket is empty. Add a favourite from the menu.</p>';
    $("#place-order").disabled = rows.length === 0;
    renderMenu();
  }

  function setQuantity(id, delta) {
    const next = (state.cart.get(id) || 0) + delta;
    if (next <= 0) state.cart.delete(id);
    else state.cart.set(id, Math.min(20, next));
    renderCart();
  }

  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) setQuantity(Number(button.dataset.add), 1);
  });
  categories.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderCategories([...new Set(state.menu.map(item => item.category))]);
    renderMenu();
  });
  $("#cart-items").addEventListener("click", event => {
    const button = event.target.closest("[data-change]");
    if (button) setQuantity(Number(button.dataset.change), Number(button.dataset.delta));
  });
  $("#search").addEventListener("input", event => { state.query = event.target.value; renderMenu(); });

  $("#checkout-form").addEventListener("submit", async event => {
    event.preventDefault();
    const message = $("#checkout-message");
    const rows = [...state.cart.entries()].map(([id, quantity]) => ({ id, quantity }));
    if (!rows.length) { message.textContent = "Add at least one item before placing an order."; return; }
    const form = new FormData(event.currentTarget);
    const button = $("#place-order");
    button.disabled = true;
    message.className = "message";
    message.textContent = "Placing your order…";
    try {
      const data = await request("/api/orders", { method: "POST", body: JSON.stringify({
        customer_name: form.get("customer_name"), phone: form.get("phone"),
        address: form.get("address"), notes: form.get("notes"), items: rows
      }) });
      state.cart.clear();
      renderCart();
      event.currentTarget.reset();
      message.className = "message success";
      message.textContent = `Order #${data.order.id} placed! Total: ${money(data.order.total)}. Keep your order number and phone number to track it.`;
      $("#tracking-form").elements.order_id.value = data.order.id;
      $("#tracking-form").elements.phone.value = data.order.phone;
      $("#track").scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      message.className = "message error";
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  $("#tracking-form").addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = $("#tracking-result");
    result.textContent = "Looking up your order…";
    result.className = "tracking-result";
    try {
      const data = await request(`/api/orders/${encodeURIComponent(form.get("order_id"))}?phone=${encodeURIComponent(form.get("phone"))}`);
      const order = data.order;
      result.innerHTML = `<div class="status-heading"><span>Order #${order.id}</span><b class="status-pill">${order.status}</b></div>
        <p>Placed by ${escapeHtml(order.customer_name)} · Total <strong>${money(order.total)}</strong></p>
        <ol class="status-steps">${data.statuses.map((status, index) => `<li class="${data.statuses.indexOf(order.status) >= index ? "reached" : ""}"><span>${index + 1}</span>${status}</li>`).join("")}</ol>
        <p class="muted">Last status recorded: ${escapeHtml(order.status)}.</p>`;
    } catch (error) {
      result.className = "tracking-result error";
      result.textContent = error.message;
    }
  });

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  async function start() {
    try {
      const data = await request("/api/menu");
      state.menu = data.items;
      renderCategories(data.categories);
      renderMenu();
      renderCart();
    } catch (error) {
      $("#menu-message").textContent = "The menu could not load. Check that the Flask server is running, then refresh.";
      console.error(error);
    }
  }
  start();
})();