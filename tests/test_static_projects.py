import pathlib
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJECTS = {
    "11-smart-school-management": ["student-form", "rows", "average"],
    "12-mpesa-expense-savings-tracker": ["tx-form", "goal-form", "transactions"],
    "13-kenya-jobs-attachment-portal": ["search", "location", "jobs"],
}

class PageInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
        self._in_script = False
        self._script_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "script":
            self._in_script = True
            self._script_parts = []

    def handle_data(self, data):
        if self._in_script:
            self._script_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._in_script:
            self.scripts.append("".join(self._script_parts))
            self._in_script = False

class StaticProjectTests(unittest.TestCase):
    def test_project_pages_have_expected_elements_and_javascript_syntax(self):
        for folder, required_ids in PROJECTS.items():
            with self.subTest(project=folder):
                path = ROOT / folder / "index.html"
                self.assertTrue(path.is_file(), f"Missing {path}")
                html = path.read_text(encoding="utf-8")
                self.assertIn("<!doctype html>", html.lower())
                parser = PageInspector()
                parser.feed(html)
                self.assertTrue(required_ids.issubset(parser.ids),
                                f"Missing IDs: {required_ids - parser.ids}")
                self.assertTrue(parser.scripts, "Expected an inline JavaScript app")
                for script in parser.scripts:
                    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as temp:
                        temp.write(script)
                        temp.flush()
                        result = subprocess.run(
                            ["node", "--check", temp.name],
                            capture_output=True, text=True, check=False
                        )
                        self.assertEqual(result.returncode, 0, result.stderr)

if __name__ == "__main__":
    unittest.main()
