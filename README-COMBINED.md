# INTERIOLANCE combined website

This package combines both supplied codebases while preserving the already-shared `/landing-page` URL.

## Routes
- `/landing-page` — the original quick-access link page, enhanced with **Explore our website** and an expandable **Get to know us** panel. The page normalizes `/landing-page/index.html` and `/landing-page/` to the clean `/landing-page` URL in the browser address bar, while keeping asset paths working on GitHub Pages project sites. The existing social, call, WhatsApp, directions and booking links remain.
- `/` — the full INTERIOLANCE studio website.
- `/services.html`, `/projects.html`, `/about.html`, `/faqs.html`, `/contact.html` — the main website's supporting pages.

## Run locally
From this folder run `python3 -m http.server 8000`, then open `http://localhost:8000/` and `http://localhost:8000/landing-page`.

## Deployment notes
Upload the **contents** of this folder to the website's document root. GitHub Pages serves `landing-page/index.html` for the `/landing-page` directory route (it may initially normalize the path to `/landing-page/`). A small inline script then updates the visible URL to `/landing-page` without reloading the document; it also normalizes direct visits to `/landing-page/index.html`. A dynamic `<base>` preserves asset loading and internal navigation for GitHub Pages project URLs such as `/interiolance-landing-page/landing-page`, as well as domain-root deployments.

The site is static HTML/CSS/JS and needs no build step or package installation.
