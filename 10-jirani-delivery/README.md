# Project 10: Jirani Delivery

A responsive online food-ordering demo built with **Python, Flask, SQLite, HTML, CSS and JavaScript**. It uses Kenyan shilling (KSh) prices and sample local menu items.

## Features

- Responsive food menu with search and category filters.
- Add items to a basket, adjust quantities, and see subtotal, delivery fee and total.
- Checkout form that saves orders and line items to SQLite.
- Order tracking by order number and the phone number used at checkout.
- Order status API with an admin-key check, ready for a trusted admin interface or API client.
- Server-side validation and price calculation; the server ignores prices sent by the browser.
- Automated tests for menu, checkout totals, invalid carts, order tracking and admin configuration.

## Requirements

- Python 3.10 or newer
- pip

## Run locally

From the repository root:

```bash
cd 10-jirani-delivery
python -m venv .venv
```

Activate the environment:

- Windows PowerShell: `.venv\Scripts\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies and run:

```bash
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000.

SQLite database is created automatically at `instance/jirani_delivery.db`. Set `JIRANI_DB_PATH` to change the database location.

## Run tests

Install dependencies, then from this folder run:

```bash
python -m unittest discover -s tests -v
```

## Admin status endpoint

For a local API demonstration, set a long random key in your environment before starting the server:

- Windows PowerShell: `$env:JIRANI_ADMIN_KEY = "replace-with-a-long-random-secret"`
- macOS/Linux: `export JIRANI_ADMIN_KEY="replace-with-a-long-random-secret"`

Then send a `PATCH /api/orders/ORDER_ID/status` request with JSON such as `{"status":"Preparing"}` and header `X-Admin-Key: your-key`. Valid statuses are Pending, Confirmed, Preparing, Out for delivery, Delivered and Cancelled.

**Security note:** this endpoint is a learning example, not a production admin system. Do not expose a secret key in frontend JavaScript. A production app needs authenticated admin accounts, HTTPS, CSRF/rate-limit controls as appropriate, phone verification or stronger order access, payment-provider integration, privacy controls and operational delivery workflows.

## API overview

- `GET /api/health` — service health.
- `GET /api/menu?q=pilau&category=Meals` — search/filter menu.
- `POST /api/orders` — create an order; JSON fields: `customer_name`, `phone`, `address`, optional `notes`, and `items: [{"id": 1, "quantity": 2}]`.
- `GET /api/orders/ORDER_ID?phone=PHONE` — track an order.
- `PATCH /api/orders/ORDER_ID/status` — update status with the admin key header.

## Learning notes

- Flask handles HTTP routes and validates incoming data.
- SQLite persists orders and individual order items.
- The browser manages menu rendering and basket interactions.
- The browser never decides the authoritative item prices or final order total.

All menu items and orders are sample educational data. No real payments or deliveries are processed. This is a development demo, not a production-ready food delivery service.
