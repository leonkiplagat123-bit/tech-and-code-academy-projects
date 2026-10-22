const STORAGE_KEY = "jirani-marketplace-listings-v1";
const FAVORITES_KEY = "jirani-marketplace-favorites-v1";

const starterBusinesses = [
  { id: "bakehouse", name: "Maua Bakehouse", category: "Food & Drink", location: "Nyali, Mombasa", price: 350, emoji: "🥐", color: "#f0dfc9", description: "Fresh pastries, sourdough and a little morning magic.", phone: "+254711111111", featured: true },
  { id: "threaded", name: "Threaded Stories", category: "Fashion", location: "Diani, Kwale", price: 1200, emoji: "🧵", color: "#e6d9ed", description: "Colourful everyday wear made with care by local makers.", phone: "+254722222222", featured: true },
  { id: "roots", name: "Roots & Rituals", category: "Beauty & Wellness", location: "Kilimani, Nairobi", price: 800, emoji: "🌿", color: "#dce8cd", description: "Natural hair care, skin essentials and a moment to unwind.", phone: "+254733333333", featured: true },
  { id: "fixit", name: "Fix It Neighbour", category: "Home Services", location: "Bamburi, Mombasa", price: 500, emoji: "🛠️", color: "#e8e3cb", description: "Friendly home repairs, installations and practical help.", phone: "+254744444444", featured: false },
  { id: "pixel", name: "Pixel & Plug", category: "Electronics", location: "CBD, Nairobi", price: 1500, emoji: "🎧", color: "#d8e5e9", description: "Phone accessories, audio gear and everyday tech essentials.", phone: "+254755555555", featured: false },
  { id: "market", name: "The Green Basket", category: "Shopping", location: "Kongowea, Mombasa", price: 250, emoji: "🥑", color: "#e2e9c7", description: "Seasonal produce and pantry staples from nearby growers.", phone: "+254766666666", featured: false }
];

const grid = document.querySelector("#business-grid");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const sortFilter = document.querySelector("#sort-filter");
const favoritesToggle = document.querySelector("#favorites-toggle");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#listing-dialog");
const form = document.querySelector("#listing-form");
const toast = document.querySelector("#toast");

let businesses = loadListings();
let favorites = loadFavorites();
let showFavoritesOnly = false;
let toastTimer;

function loadListings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterBusinesses;
  } catch (error) {
    console.warn("Could not load saved listings.", error);
    return starterBusinesses;
  }
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch (error) {
    console.warn("Could not load saved favorites.", error);
    return [];
  }
}

function saveListings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  } catch (error) {
    showToast("Browser storage is unavailable. Changes may not persist.");
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    showToast("Could not save favorites in this browser.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatPrice(price) {
  const amount = Number(price);
  return amount > 0 ? `From KSh ${amount.toLocaleString("en-KE")}` : "Ask for price";
}

function safePhone(phone = "") {
  return String(phone).replace(/[^\d+]/g, "");
}

function contactURL(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits || digits.length < 9) return "";
  return `https://wa.me/${digits}`;
}

function getVisibleBusinesses() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let visible = businesses.filter(business => {
    const searchable = [business.name, business.category, business.location, business.description].join(" ").toLocaleLowerCase();
    const matchesQuery = searchable.includes(query);
    const matchesCategory = categoryFilter.value === "all" || business.category === categoryFilter.value;
    const matchesFavorites = !showFavoritesOnly || favorites.includes(business.id);
    return matchesQuery && matchesCategory && matchesFavorites;
  });

  if (sortFilter.value === "name") {
    visible.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortFilter.value === "price") {
    visible.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
  } else {
    visible.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name));
  }
  return visible;
}

function businessCard(business) {
  const isSaved = favorites.includes(business.id);
  const contact = contactURL(business.phone);
  const contactAction = contact
    ? `<a class="contact-link" href="${contact}" target="_blank" rel="noopener noreferrer" aria-label="Contact ${escapeHTML(business.name)} on WhatsApp">Contact business ↗</a>`
    : `<span class="contact-link">Contact details unavailable</span>`;

  return `
    <article class="business-card">
      <div class="card-visual" style="--card-bg:${escapeHTML(business.color || "#e8eddc")}">
        <span class="category-chip">${escapeHTML(business.category)}</span>
        <button class="save-button" data-favorite="${escapeHTML(business.id)}" aria-label="${isSaved ? "Remove from" : "Add to"} saved businesses" aria-pressed="${isSaved}">${isSaved ? "♥" : "♡"}</button>
        <span class="business-emoji" aria-hidden="true">${escapeHTML(business.emoji || "🏪")}</span>
      </div>
      <div class="card-body">
        <div class="card-title-row"><div><h3>${escapeHTML(business.name)}</h3><p class="location">⌖ ${escapeHTML(business.location)}</p></div><span class="price">${escapeHTML(formatPrice(business.price))}</span></div>
        <p class="card-description">${escapeHTML(business.description)}</p>
        <div class="card-footer"><span class="card-category">LOCAL BUSINESS</span>${contactAction}</div>
      </div>
    </article>`;
}

function renderBusinesses() {
  const visible = getVisibleBusinesses();
  grid.innerHTML = visible.map(businessCard).join("");
  resultsCount.textContent = `Showing ${visible.length} of ${businesses.length} businesses`;
  emptyState.hidden = visible.length !== 0;
  grid.hidden = visible.length === 0;
  favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
  favoritesToggle.querySelector("span").textContent = showFavoritesOnly ? "Show all" : "Show saved";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function openListingDialog() {
  form.reset();
  document.querySelector("#form-error").textContent = "";
  dialog.showModal();
}

function closeListingDialog() {
  dialog.close();
}

[document.querySelector("#open-listing"), document.querySelector("#open-listing-bottom")].forEach(button => {
  button.addEventListener("click", openListingDialog);
});
document.querySelector("#close-dialog").addEventListener("click", closeListingDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeListingDialog);

dialog.addEventListener("click", event => {
  if (event.target === dialog) closeListingDialog();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const category = String(data.get("category") || "").trim();
  const location = String(data.get("location") || "").trim();
  const description = String(data.get("description") || "").trim();
  const rawPrice = String(data.get("price") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const emoji = String(data.get("emoji") || "").trim() || "🏪";
  const errorElement = document.querySelector("#form-error");

  if (!name || !category || !location || !description) {
    errorElement.textContent = "Please complete the required fields.";
    return;
  }
  if (rawPrice && (!Number.isFinite(Number(rawPrice)) || Number(rawPrice) < 0)) {
    errorElement.textContent = "Enter a valid non-negative price.";
    return;
  }
  if (phone && !/[\d]{7,}/.test(phone.replace(/\D/g, ""))) {
    errorElement.textContent = "Enter a valid phone number or leave it blank.";
    return;
  }

  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  businesses.unshift({
    id, name, category, location, description, emoji,
    price: rawPrice ? Number(rawPrice) : 0,
    phone: safePhone(phone), color: "#e4ebd8", featured: false
  });
  saveListings();
  searchInput.value = "";
  categoryFilter.value = "all";
  sortFilter.value = "featured";
  showFavoritesOnly = false;
  renderBusinesses();
  closeListingDialog();
  showToast("Your demo listing has been added!");
  document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
});

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-favorite]");
  if (!button) return;
  const id = button.dataset.favorite;
  if (favorites.includes(id)) {
    favorites = favorites.filter(favoriteId => favoriteId !== id);
    showToast("Removed from saved businesses.");
  } else {
    favorites.push(id);
    showToast("Business saved to your favourites.");
  }
  saveFavorites();
  renderBusinesses();
});

searchInput.addEventListener("input", renderBusinesses);
categoryFilter.addEventListener("change", renderBusinesses);
sortFilter.addEventListener("change", renderBusinesses);
favoritesToggle.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  renderBusinesses();
});
document.querySelector("#reset-filters").addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  sortFilter.value = "featured";
  showFavoritesOnly = false;
  renderBusinesses();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) && !dialog.open) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderBusinesses();
