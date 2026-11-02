# V8 Motors — showroom website

Website for V8 Motors, 59B Royal Road, Coromandel, Mauritius.

- **Pages:** Home, Cars (live catalogue), car details, Sell & Exchange, About, Contact
- **Live inventory:** loaded from the V8 Motors catalogue API, with a saved snapshot (`js/snapshot.js`) as fallback
- **Motion:** GSAP + ScrollTrigger, Lenis smooth scroll, section snapping on the homepage

## Editing styles

Styles are written in SCSS in `scss/` and compiled to `css/style.css`:

```bash
npm install
npm run build:css   # one-off build
npm run watch:css   # rebuild on save
```

No build step is needed to run the site — open `index.html` or serve the folder.
