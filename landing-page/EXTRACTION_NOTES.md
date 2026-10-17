# Extraction and rebuild notes

## Sources used

- Public landing page reference: `https://interiolance.in/landing-page`
- Browser-saved page snapshot: `source/Interiolance Landing Page.html`
- User-supplied interior photograph: `assets/original/hero.jpg` (1800 × 1285)
- User-supplied logo: `assets/original/logo.png` (380 × 425, RGBA)

## What the saved snapshot establishes

The exported HTML contains one Canva landing-page composition. Its recovered content includes the brand name `INTERIOLANCE`, tagline `Design to make it Divine`, the interior photograph, and the following destinations: book a call, Way to OFFICE, WhatsApp, Facebook, Instagram, YouTube, mail us, and CALL US. It sets the Canva page background to `#fff7ef`, and the pill-button background to `rgb(91, 79, 67)` with warm-white text.

The current `index.html` recreates this composition as editable HTML/CSS/JS. It does not add separate site sections or a navigation header that were not present in the exported snapshot. The supplied photograph and logo are stored locally, so the reconstructed page does not depend on temporary browser `blob:` URLs for these two key images.

## Missing source resources

The saved HTML points to a companion folder named `Interiolance Landing Page_files`, but that complete folder was not supplied. Several image nodes reference temporary `blob:https://interiolance.in/...` URLs; those URLs do not contain recoverable binary data once the original browser session is gone. The referenced Canva CSS/runtime files and original font binaries are also missing. The public site could not be fetched from this execution environment because the hostname did not resolve, so a live screenshot comparison was not possible.

## Accuracy status

This is a close editable reconstruction grounded in the actual saved HTML and supplied image assets, not a claim of pixel-perfect source recovery. Desktop and mobile layouts are responsive, but the exact Canva renderer output may differ because the original CSS, font files, and temporary media resources are unavailable.
