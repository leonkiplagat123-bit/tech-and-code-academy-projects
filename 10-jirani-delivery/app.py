import os
import sqlite3
from pathlib import Path
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("JIRANI_DB_PATH", BASE_DIR / "instance" / "jirani_delivery.db"))
app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

MENU = [
    {"id": 1, "name": "Chicken Pilau", "category": "Meals", "description": "Fragrant Swahili rice with tender chicken.", "price": 450, "emoji": "🍗", "popular": True},
    {"id": 2, "name": "Beef Burger", "category": "Fast food", "description": "Grilled beef, fresh lettuce and house sauce.", "price": 550, "emoji": "🍔", "popular": True},
    {"id": 3, "name": "Chapati & Beans", "category": "Meals", "description": "Soft chapati served with rich bean stew.", "price": 220, "emoji": "🫓", "popular": False},
    {"id": 4, "name": "Veggie Pizza", "category": "Fast food", "description": "Cheesy pizza topped with colourful vegetables.", "price": 650, "emoji": "🍕", "popular": True},
    {"id": 5, "name": "Fresh Passion Juice", "category": "Drinks", "description": "Chilled passion fruit juice, made fresh.", "price": 150, "emoji": "🥤", "popular": False},
    {"id": 6, "name": "Mandazi (2)", "category": "Snacks", "description": "Two golden, lightly sweet Kenyan mandazi.", "price": 100, "emoji": "🍩", "popular": False},
    {"id": 7, "name": "Beef Samosa (2)", "category": "Snacks", "description": "Crispy samosas with savoury beef filling.", "price": 180, "emoji": "🥟", "popular": False},
    {"id": 8, "name": "Iced Coffee", "category": "Drinks", "description": "Smooth coffee served over ice.", "price": 250, "emoji": "🧋", "popular": False},
]
STATUSES = ["Pending", "Confirmed", "Preparing", "Out for delivery", "Delivered", "Cancelled"]


def connect_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    with connect_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                notes TEXT NOT NULL DEFAULT '',
                subtotal INTEGER NOT NULL,
                delivery_fee INTEGER NOT NULL,
                total INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                menu_item_id INTEGER NOT NULL,
                item_name TEXT NOT NULL,
                unit_price INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                line_total INTEGER NOT NULL
            );
        """)


def error(message, status=400):
    return jsonify({"error": message}), status


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/menu")
def get_menu():
    category = request.args.get("category", "").strip().casefold()
    search = request.args.get("q", "").strip().casefold()
    items = MENU
    if category and category != "all":
        items = [item for item in items if item["category"].casefold() == category]
    if search:
        items = [item for item in items if search in item["name"].casefold() or search in item["description"].casefold()]
    return jsonify({"items": items, "categories": sorted({item["category"] for item in MENU})})


@app.post("/api/orders")
def create_order():
    data = request.get_json(silent=True) or {}
    name = str(data.get("customer_name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    notes = str(data.get("notes", "")).strip()[:500]
    raw_items = data.get("items")
    if not name or len(name) > 100:
        return error("Enter your name (up to 100 characters).")
    if not phone or len(phone) > 30:
        return error("Enter a valid phone number.")
    if not address or len(address) > 300:
        return error("Enter a delivery address (up to 300 characters).")
    if not isinstance(raw_items, list) or not raw_items or len(raw_items) > 30:
        return error("Your cart must contain between 1 and 30 item types.")

    by_id = {item["id"]: item for item in MENU}
    validated = []
    for row in raw_items:
        if not isinstance(row, dict):
            return error("Invalid cart item.")
        try:
            item_id, quantity = int(row.get("id")), int(row.get("quantity"))
        except (TypeError, ValueError):
            return error("Each item needs a valid ID and quantity.")
        if item_id not in by_id or quantity < 1 or quantity > 20:
            return error("An item or quantity is invalid.")
        item = by_id[item_id]
        validated.append((item, quantity))

    # Prices are read from the server-side menu; client-submitted prices are ignored.
    subtotal = sum(item["price"] * quantity for item, quantity in validated)
    delivery_fee = 150
    with connect_db() as db:
        cursor = db.execute(
            """INSERT INTO orders (customer_name, phone, address, notes, subtotal, delivery_fee, total)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (name, phone, address, notes, subtotal, delivery_fee, subtotal + delivery_fee),
        )
        order_id = cursor.lastrowid
        db.executemany(
            """INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, line_total)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [(order_id, item["id"], item["name"], item["price"], qty, item["price"] * qty) for item, qty in validated],
        )
    return jsonify({"message": "Order received.", "order": get_order_data(order_id)}), 201


def get_order_data(order_id):
    with connect_db() as db:
        order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
        if order is None:
            return None
        items = db.execute(
            "SELECT menu_item_id AS id, item_name AS name, unit_price, quantity, line_total FROM order_items WHERE order_id = ?",
            (order_id,),
        ).fetchall()
    result = dict(order)
    result["items"] = [dict(item) for item in items]
    return result


@app.get("/api/orders/<int:order_id>")
def track_order(order_id):
    order = get_order_data(order_id)
    if order is None:
        return error("Order not found. Check the order number and try again.", 404)
    # A phone-number match avoids exposing order details using sequential IDs alone.
    supplied_phone = request.args.get("phone", "").strip()
    if not supplied_phone or supplied_phone != order["phone"]:
        return error("Enter the phone number used for this order.", 403)
    return jsonify({"order": order, "statuses": STATUSES})


@app.patch("/api/orders/<int:order_id>/status")
def update_order_status(order_id):
    # Set JIRANI_ADMIN_KEY in the environment before using the admin endpoint.
    admin_key = os.environ.get("JIRANI_ADMIN_KEY")
    if not admin_key:
        return error("Admin updates are disabled until JIRANI_ADMIN_KEY is configured.", 503)
    if request.headers.get("X-Admin-Key", "") != admin_key:
        return error("Admin key is missing or incorrect.", 401)
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in STATUSES:
        return error("Choose a valid order status.")
    with connect_db() as db:
        cursor = db.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
        if cursor.rowcount == 0:
            return error("Order not found.", 404)
    return jsonify({"message": "Order status updated.", "order": get_order_data(order_id)})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


init_db()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
