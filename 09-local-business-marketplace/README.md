# Project 9: Local Business Marketplace

A responsive directory where people can discover local businesses and services in Kenya.

## Features

- Search by business name, category, or location
- Filter by category and sort listings
- Add a business listing through a form
- Save and remove favorite businesses
- Quick contact links for phone and WhatsApp when a listing includes a number
- Responsive layout for mobile, tablet, and desktop
- Browser persistence using `localStorage`

## Tech stack

- HTML5 for structure
- CSS3 for responsive styling
- Vanilla JavaScript for rendering, searching, filtering, forms, favorites, and storage

## Run locally

1. Download or clone this repository.
2. Open `09-local-business-marketplace/index.html` in a modern browser.
3. Try searching for a business, changing the category filter, saving a favorite, or adding a listing.

No build tools or API keys are required for this demo.

## How it works

- `index.html` defines the page and listing form.
- `styles.css` contains the responsive visual design.
- `app.js` contains sample listings and all browser-side interactions.
- Listing changes and favorites are saved to the current browser's local storage. They are not shared between users or devices.

## Learning challenges

1. Add a rating field and sort by rating.
2. Add a business details page.
3. Replace local storage with a backend API and database.
4. Add authentication and moderation before allowing public submissions.
5. Add map links for business locations.

## Important limitations

This is an educational frontend prototype. Sample businesses are fictional, and listings are not verified. Do not enter sensitive information. A production marketplace needs server-side validation, spam protection, privacy controls, authentication, and a shared database.

## License

MIT (repository license).
