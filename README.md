# Interiolance Landing Page — editable HTML/CSS/JS rebuild

This is a self-contained rebuild based on the supplied browser-saved HTML for `https://interiolance.in/landing-page` and the two images supplied in this conversation. It recreates the original page's full-bleed interior photograph, centered Interiolance logo and title, tagline, and eight pill-shaped link buttons.

## Run locally

No build tools or package installation are needed. Open `index.html` in a browser, or run a local server in this directory:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project contents

```text
index.html                         Main page markup
styles.css                         Responsive styling and layout
script.js                          Small pointer/tap interaction
assets/original/hero.jpg           Supplied interior photograph (1800 × 1285)
assets/original/logo.png           Supplied transparent logo image (380 × 425)
source/Interiolance Landing Page.html  Browser-saved source snapshot
 data/canva-bootstrap.json         Canva page metadata embedded in the snapshot
 data/assets-manifest.json         Media/font manifest extracted from the snapshot
 data/site-content.json            Recovered page text and links
 data/saved-html-resources.json    Referenced resources from the saved page
 tools/download_original_assets.py Optional public-asset retrieval attempt
```

## Page links

The page preserves the links discovered in the saved source: Book a call, Way to Office, WhatsApp, Facebook, Instagram, YouTube, email, and telephone.

## Accuracy note

The layout and copy are grounded in the supplied saved HTML, and the photo/logo files are the images supplied for this rebuild. I could not fetch and compare a fresh screenshot of the live host during this build because DNS/network access to `interiolance.in` was unavailable in the execution environment. The original Canva CSS/font/runtime bundles and some temporary `blob:` images were not included in the saved HTML export, so this is a close editable reconstruction—not a guarantee of pixel-for-pixel identity with every desktop/mobile rendering of the live site.

To achieve an exact match, provide a full browser “Save page, complete” export (HTML plus its `Interiolance Landing Page_files` folder) or a fresh full-page screenshot from both desktop and mobile.

## Attribution

Please confirm you have permission to reuse the branding, photography, and any fonts before republishing the site.
