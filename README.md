# Tech & Code Academy Projects

A learning portfolio of thirteen practical projects, from beginner exercises to intermediate web apps.

1. [Advanced Calculator](01-advanced-calculator/) — HTML, CSS, JavaScript
2. [Task Management App](02-task-management-app/) — HTML, CSS, JavaScript
3. [Student Management System](03-student-management-system/) — Python
4. [Personal Budget Tracker](04-personal-budget-tracker/) — Python
5. [Online Bookstore](05-online-bookstore/) — HTML, CSS, JavaScript
6. [Weather Forecast App](06-weather-forecast-app/) — HTML, CSS, JavaScript; requires your own OpenWeather API key
7. [Inventory Management System](07-inventory-management-system/) — Python
8. [Online Learning Platform](08-online-learning-platform/) — HTML, CSS, JavaScript
9. [Local Business Marketplace](09-local-business-marketplace/) — responsive HTML, CSS, JavaScript marketplace demo
10. [Jirani Delivery](10-jirani-delivery/) — Flask, SQLite, HTML, CSS, JavaScript food-ordering demo
11. [Smart School Management](11-smart-school-management/) — student register, attendance and grades
12. [M-Pesa Expense & Savings Tracker](12-mpesa-expense-savings-tracker/) — manual KSh transactions and savings goals
13. [Kenya Jobs & Attachment Portal](13-kenya-jobs-attachment-portal/) — sample job search, saved listings and demo applications

## Running browser-based projects

Open the relevant project's `index.html` file in a modern browser. Projects 9 and 11–13 need no build tools or API keys. Read each folder's README for features and limitations.

## Running Project 10

Project 10 is a Flask application. From the repository root, run `cd 10-jirani-delivery`, create and activate a Python virtual environment, install `requirements.txt`, then run `python app.py`. Open http://127.0.0.1:5000. See [the Project 10 README](10-jirani-delivery/README.md) for setup and tests.

## Educational demo and privacy notes

These projects are learning examples, not production-ready services. Browser-based projects store demo data in localStorage, in the current browser only. Project 9 listings and favorites are not shared between users. Project 10 uses a local SQLite database and does not process real payments or deliveries. Project 11 should only use fictional student data. Project 12 is a manual finance tracker and does not connect to M-Pesa or a bank. Project 13 uses fictional job listings and does not send real applications. Never commit passwords, API keys or other secrets.

Python projects require Python 3.10+. See each project folder for specific instructions.

License: MIT.
