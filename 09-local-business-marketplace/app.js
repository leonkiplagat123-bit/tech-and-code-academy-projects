const STORAGE_KEY = "jirani-marketplace-listings-v1";
const FAVORITES_KEY = "jirani-marketplace-favorites-v1";
const REVIEWS_KEY = "jirani-marketplace-reviews-v1";
const demoReviews = { bakehouse: [{id:"demo-1",name:"A local customer",rating:5,text:"Lovely fresh pastries and friendly service.",date:"Demo review"},{id:"demo-2",name:"Neighbourhood foodie",rating:4,text:"Great morning stop. The sourdough is a favourite.",date:"Demo review"}], threaded:[{id:"demo-3",name:"A local customer",rating:5,text:"Beautiful pieces and thoughtful details.",date:"Demo review"}], roots:[{id:"demo-4",name:"A local customer",rating:4,text:"A calm place with helpful recommendations.",date:"Demo review"}], fixit:[], pixel:[], market:[] };

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
const locationFilter = document.querySelector("#location-filter");
const ratingFilter = document.querySelector("#rating-filter");
const detailsDialog = document.querySelector("#details-dialog");
const detailsContent = document.querySelector("#business-details");
const sortFilter = document.querySelector("#sort-filter");
const favoritesToggle = document.querySelector("#favorites-toggle");
const resultsCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#listing-dialog");
const form = document.querySelector("#listing-form");
const toast = document.querySelector("#toast");

let businesses = loadListings();
let favorites = loadFavorites();
let reviews = loadReviews();
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

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY) || "null") || JSON.parse(JSON.stringify(demoReviews)); }
  catch (error) { return JSON.parse(JSON.stringify(demoReviews)); }
}
function saveReviews() { try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)); } catch (error) { showToast("Could not save reviews in this browser."); } }
function getReviews(id) { return Array.isArray(reviews[id]) ? reviews[id] : []; }
function ratingSummary(id) { const list = getReviews(id); return { count: list.length, average: list.length ? list.reduce((sum, item) => sum + Number(item.rating || 0), 0) / list.length : 0 }; }
function stars(value) { const n = Math.round(value); return "★".repeat(n) + "☆".repeat(5 - n); }
function ratingMarkup(id) { const r = ratingSummary(id); return r.count ? '<span class="rating-stars" aria-label="' + r.average.toFixed(1) + ' out of 5 stars">' + stars(r.average) + '</span><span class="rating-number">' + r.average.toFixed(1) + '<span class="rating-count"> (' + r.count + ')</span></span>' : '<span class="no-rating">Not rated yet</span>'; }

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
    const matchesLocation = !locationFilter.value.trim() || String(business.location || "").toLocaleLowerCase().includes(locationFilter.value.trim().toLocaleLowerCase());
    const matchesFavorites = !showFavoritesOnly || favorites.includes(business.id);
    const matchesRating = ratingSummary(business.id).average >= Number(ratingFilter.value || 0);
    return matchesQuery && matchesCategory && matchesLocation && matchesFavorites && matchesRating;
  });

  if (sortFilter.value === "name") {
    visible.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortFilter.value === "price") {
    visible.sort((a, b) => (Number(a.price) || Infinity) - (Number(b.price) || Infinity));
  } else if (sortFilter.value === "rating") {
    visible.sort((a, b) => ratingSummary(b.id).average - ratingSummary(a.id).average || ratingSummary(b.id).count - ratingSummary(a.id).count);
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
        <div class="card-rating">${ratingMarkup(business.id)}</div>
        <p class="card-description">${escapeHTML(business.description)}</p>
        <div class="card-footer"><span class="card-category">${escapeHTML(business.category)}</span><button class="details-button" data-details="${escapeHTML(business.id)}">View details ↗</button></div><div class="card-contact">${contactAction}</div>
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

function renderDetails(id) {
  const business = businesses.find(item => item.id === id);
  if (!business) return;
  const summary = ratingSummary(id), list = getReviews(id), contact = contactURL(business.phone);
  detailsContent.innerHTML = '<div class="details-hero" style="--card-bg:' + escapeHTML(business.color || "#e8eddc") + '"><button type="button" class="icon-button details-close" data-close-details aria-label="Close details">×</button><span class="category-chip">' + escapeHTML(business.category) + '</span><span class="details-emoji">' + escapeHTML(business.emoji || "🏪") + '</span></div><div class="details-main"><div class="eyebrow">LOCAL BUSINESS PROFILE</div><h2 id="details-title">' + escapeHTML(business.name) + '</h2><p class="details-location">⌖ ' + escapeHTML(business.location) + '</p><div class="details-rating">' + ratingMarkup(id) + '</div><p class="details-description">' + escapeHTML(business.description) + '</p><div class="details-facts"><div><span>Typical price</span><strong>' + escapeHTML(formatPrice(business.price)) + '</strong></div><div><span>Category</span><strong>' + escapeHTML(business.category) + '</strong></div></div>' + (contact ? '<a class="button button-dark details-contact" href="' + contact + '" target="_blank" rel="noopener noreferrer">Contact on WhatsApp ↗</a>' : '<p class="no-rating">No contact number provided.</p>') + '<section class="reviews-section"><div class="reviews-heading"><div><div class="eyebrow">COMMUNITY FEEDBACK</div><h3>Ratings & reviews</h3></div><span class="review-total">' + summary.count + ' reviews</span></div>' + (list.length ? list.slice().reverse().map(review => '<article class="review-item"><div class="review-top"><strong>' + escapeHTML(review.name || "Neighbour") + '</strong><span class="rating-stars">' + stars(Number(review.rating)) + '</span></div><p>' + escapeHTML(review.text) + '</p><span class="review-date">' + escapeHTML(review.date || "Community review") + '</span></article>').join("") : '<p class="no-reviews">No reviews yet. Be the first to share helpful feedback.</p>') + '<form id="review-form" class="review-form" data-review-business="' + escapeHTML(id) + '"><h4>Share your experience</h4><label>Your name<input name="reviewer" maxlength="45" required placeholder="e.g. A neighbour"></label><label>Rating<select name="rating" required><option value="">Choose a rating</option><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Very good</option><option value="3">★★★ — Good</option><option value="2">★★ — Fair</option><option value="1">★ — Poor</option></select></label><label>Your review<textarea name="review" rows="3" maxlength="400" required placeholder="What should other neighbours know?"></textarea></label><p class="review-note">Demo only: reviews are saved in this browser, not shared or verified.</p><button class="button button-dark" type="submit">Submit review ↗</button></form></section></div>';
  if (!detailsDialog.open) detailsDialog.showModal();
}
detailsContent.addEventListener("click", event => { if (event.target.closest("[data-close-details]")) detailsDialog.close(); });
detailsDialog.addEventListener("click", event => { if (event.target === detailsDialog) detailsDialog.close(); });
detailsContent.addEventListener("submit", event => {
  if (!event.target.matches("#review-form")) return;
  event.preventDefault(); const form = event.target, data = new FormData(form), id = form.dataset.reviewBusiness;
  const name = String(data.get("reviewer") || "").trim(), text = String(data.get("review") || "").trim(), rating = Number(data.get("rating"));
  if (!name || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) { showToast("Please enter your name, a rating, and a review."); return; }
  if (!Array.isArray(reviews[id])) reviews[id] = [];
  reviews[id].push({id:"review-" + Date.now(), name, rating, text, date:new Date().toLocaleDateString("en-KE", {year:"numeric",month:"short",day:"numeric"})});
  saveReviews(); renderBusinesses(); renderDetails(id); showToast("Thanks! Your demo review has been saved.");
});

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
  locationFilter.value = "";
  sortFilter.value = "featured";
  ratingFilter.value = "0";
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
locationFilter.addEventListener("input", renderBusinesses);
ratingFilter.addEventListener("change", renderBusinesses);
categoryFilter.addEventListener("change", renderBusinesses);
sortFilter.addEventListener("change", renderBusinesses);
grid.addEventListener("click", event => { const button = event.target.closest("[data-details]"); if (button) renderDetails(button.dataset.details); });
favoritesToggle.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  renderBusinesses();
});
document.querySelector("#reset-filters").addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "all";
  locationFilter.value = "";
  sortFilter.value = "featured";
  ratingFilter.value = "0";
  showFavoritesOnly = false;
  renderBusinesses();
});
document.addEventListener("keydown", event => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) && !dialog.open && !detailsDialog.open) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderBusinesses();
