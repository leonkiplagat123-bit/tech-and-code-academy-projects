import os
import tempfile
import unittest
from pathlib import Path

os.environ["JIRANI_DB_PATH"] = str(Path(tempfile.gettempdir()) / "jirani_delivery_tests.db")

from app import app, init_db  # noqa: E402


class JiraniDeliveryTests(unittest.TestCase):
    def setUp(self):
        self.db_path = Path(os.environ["JIRANI_DB_PATH"])
        if self.db_path.exists():
            self.db_path.unlink()
        init_db()
        self.client = app.test_client()

    def tearDown(self):
        if self.db_path.exists():
            self.db_path.unlink()

    def test_home_page_loads(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Jirani Delivery", response.data)

    def test_menu_returns_seed_items(self):
        response = self.client.get("/api/menu")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.get_json()["items"]), 5)

    def test_menu_search_and_category_filter(self):
        response = self.client.get("/api/menu?q=burger&category=Fast%20food")
        self.assertEqual(response.status_code, 200)
        items = response.get_json()["items"]
        self.assertEqual([item["name"] for item in items], ["Beef Burger"])

    def test_checkout_calculates_server_side_total(self):
        response = self.client.post("/api/orders", json={
            "customer_name": "Amina", "phone": "0712345678", "address": "Westlands",
            "items": [{"id": 2, "quantity": 2, "price": 1}]
        })
        self.assertEqual(response.status_code, 201)
        order = response.get_json()["order"]
        self.assertEqual(order["subtotal"], 1100)
        self.assertEqual(order["delivery_fee"], 150)
        self.assertEqual(order["total"], 1250)
        self.assertEqual(order["items"][0]["quantity"], 2)

    def test_checkout_rejects_empty_cart(self):
        response = self.client.post("/api/orders", json={
            "customer_name": "Amina", "phone": "0712345678", "address": "Westlands", "items": []
        })
        self.assertEqual(response.status_code, 400)

    def test_order_tracking_requires_matching_phone(self):
        created = self.client.post("/api/orders", json={
            "customer_name": "Amina", "phone": "0712345678", "address": "Westlands",
            "items": [{"id": 1, "quantity": 1}]
        }).get_json()["order"]
        self.assertEqual(self.client.get(f"/api/orders/{created['id']}?phone=0000").status_code, 403)
        tracked = self.client.get(f"/api/orders/{created['id']}?phone=0712345678")
        self.assertEqual(tracked.status_code, 200)
        self.assertEqual(tracked.get_json()["order"]["status"], "Pending")

    def test_unknown_order_is_not_found(self):
        response = self.client.get("/api/orders/999?phone=0712345678")
        self.assertEqual(response.status_code, 404)

    def test_admin_status_requires_configured_key(self):
        os.environ.pop("JIRANI_ADMIN_KEY", None)
        response = self.client.patch("/api/orders/1/status", json={"status": "Delivered"})
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
