# INTERIOLANCE combined website

This package combines both supplied codebases while preserving the already-shared `/landing-page` URL.

## Routes
- `/landing-page` (or `/landing-page/`) — the original quick-access link page, enhanced with **Explore our website** and an expandable **Get to know us** panel. The existing social, call, WhatsApp, directions and booking links remain.
- `/` — the full INTERIOLANCE studio website.
- `/services.html`, `/projects.html`, `/about.html`, `/faqs.html`, `/contact.html` — the main website's supporting pages.

## Run locally
From this folder run `python3 -m http.server 8000`, then open `http://localhost:8000/` and `http://localhost:8000/landing-page/`.

## Deployment notes
Upload the **contents** of this folder to the website's document root. Configure the host to serve `index.html` for `/` and `landing-page/index.html` for `/landing-page` (including the no-trailing-slash form). If the host does not automatically resolve extensionless directory routes, add a rewrite/redirect for `/landing-page` to `/landing-page/` internally or serve the landing HTML at that path. The landing-page links use absolute site-root paths (`/services.html`, `/about.html`, etc.), so deploy this package at the domain root, not under a subdirectory.

The site is static HTML/CSS/JS and needs no build step or package installation.
