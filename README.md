# INTERIOLANCE — interior design studio website template

A responsive, editable static website for INTERIOLANCE, designed around the supplied brand logo and warm interior photography.

## Pages
- `index.html` — homepage and studio overview
- `services.html` — editable interior design services and process
- `projects.html` — image-led inspiration gallery (sample stock imagery, not represented as completed client projects)
- `about.html` — studio philosophy and design principles
- `faqs.html` — accessible FAQ accordions
- `contact.html` — discovery-call shortcuts and project enquiry form
- `styles.css` — responsive design system and layouts
- `script.js` — mobile navigation, scroll effects, FAQ accordions, demo form status and footer year
- `assets/interiolance-logo.png` — cropped, transparent-background horizontal lockup made from the latest supplied logo artwork
- `assets/interiolance-mark.png` — original multicolour standalone mark, retained as the browser favicon
- `assets/hero-interior.jpg` — supplied warm interior background image

## Run locally
No build step or dependencies are required. In this folder run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Direct contact links
- **Book a Call:** https://forms.gle/v94qBWnh7hxAthor6
- **WhatsApp:** https://wa.me/917980314340
- **Call:** +91 79803 14340
- **Instagram:** https://www.instagram.com/interiolance/
- **Email:** interiolance@gmail.com

These direct links are based on the contact details in the original website files previously supplied. Please verify them before publishing.

## Before launch
1. **Logo:** The header and footer now use `assets/interiolance-logo.png`, the full lockup cropped from the most recently supplied logo image. The original standalone icon remains the favicon.
2. **Images:** The hero background is local. Most secondary sample photos load from the Unsplash CDN and require an internet connection. These are illustrative references; replace them with owned or appropriately licensed photography before public launch, especially for the project gallery.
3. **Booking and contact:** “Book a Call” opens the studio's existing Google Form in a new tab. WhatsApp, Instagram, Call and Email links are integrated in the utility bar, contact page, footer and/or mobile quick-action dock. Confirm the details are still correct.
4. **Project enquiry form:** The local form currently shows a demo confirmation only; it does not transmit or store submissions. Connect it to an inbox, CRM or form endpoint and add a privacy notice before collecting customer data.
5. **Business details:** Add verified service locations, fees, timelines, studio/founder details, credentials and real case studies. Service descriptions and budget selectors are editable examples.
6. **Honest conversion:** Calls to action make the discovery process easy to find and explain what to expect without fake scarcity, fabricated reviews or misleading claims.

## Design details
- Warm taupe, sand and cream palette coordinated with the supplied hero image
- Exact supplied brand artwork used as a full logo lockup in the header and footer
- Book a Call, WhatsApp, Instagram and Call shortcuts in the utility bar and mobile contact dock
- Responsive navigation, accessible focus states, reduced-motion support and keyboard-friendly FAQ controls


- `landing-page/index.html` — quick links page. Public route: `/landing-page` (clean URL; no need to append `index.html`).

## Latest-project carousel and uploads

The homepage, `projects.html`, and `landing-page/index.html` share the latest-project carousel. The portfolio manager is available at `admin.html`. To enable live uploads (so the client does not need to edit code for each project), follow [`PORTFOLIO-SETUP.md`](PORTFOLIO-SETUP.md) to connect a Supabase project once, then sign in to `admin.html` and upload project photos from the browser. Until the connection is configured and verified project photos are uploaded, clearly labelled sample inspiration images are displayed.


### Edit existing projects in the browser

Open `admin.html` and sign in with the administrator account. In **Published projects**, choose **Edit** to update a project's title, category, description, image accessibility text, or optionally replace its photo. Choose **Save changes** to update the live portfolio; no code edit or Git commit is needed for routine content changes.
