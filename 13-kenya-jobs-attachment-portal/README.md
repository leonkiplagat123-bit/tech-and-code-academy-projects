# Project 13: Kenya Jobs & Attachment Portal

A responsive, front-end learning prototype for exploring fictional entry-level jobs, internships and industrial attachments across Kenya.

## Features

- Modern responsive layout with summary cards and accessible controls.
- Search by job title, company, location, type, level, description and skills.
- Filter by county/city location and opportunity type.
- Sort opportunities by title or company.
- Save and unsave opportunities, with a saved-only filter.
- Open a details dialog with responsibilities, sample requirements and skills.
- Record a clearly labelled demo application and track the count.
- Persist saved opportunities and demo application IDs in browser localStorage.
- Empty-state messaging, filter reset, keyboard-friendly dialogs and safe text escaping.

## Run locally

1. Open `index.html` in a modern browser.
2. Search for a role or skill and try the location and opportunity-type filters.
3. Save a role, enable “Show saved opportunities only”, and test the details and demo-application actions.

No build tools, API keys or server are required.

## Testing

The repository's GitHub Actions workflow runs the static project test suite for Projects 11–13. It checks required page elements and parses embedded JavaScript with Node.js. This is not a full browser end-to-end test; manually test the interface at desktop and mobile widths as well.

## Important limitations and privacy

- All companies, vacancies, salaries and descriptions are fictional sample data.
- “Apply” is a demonstration only. It stores the sample opportunity ID in this browser and does not contact an employer or submit a CV.
- Saved items and demo applications are local to the current browser and device. They are not synced between users.
- Do not enter real personal information into this learning demo.
- A production recruitment platform would need verified employers and vacancies, secure server-side storage, authentication, privacy and retention controls, moderation, and secure application submission.

## Learning goals

Responsive interface design, accessible HTML, filtering and sorting arrays, event delegation, modal interactions, safe DOM rendering, localStorage persistence and progressive enhancement.
