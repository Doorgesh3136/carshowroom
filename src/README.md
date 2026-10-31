# V8 Motors website

- `index.html`, `catalogue.html`: the website (built from the files in this folder)
- `admin.html`: the stock admin. Sign in with a GitHub fine-grained token that has **Contents: Read and write** on this repository.
- `data/cars.json`: the stock list. The admin edits this file; the website loads it on every visit (with a built-in copy as a fallback).
- `images/cars/`: photos uploaded from the admin.
- `vendor/gsap/`: GSAP 3.15 and ScrollTrigger, self-hosted.
- `assets/showroom.bundle.js`: the 3D showroom (three.js r170, MIT, plus `src/3d/showroom.js`) as one plain script.
- `assets/showroom-car.glb`: the car (2.3 MB). `assets/showroom-car.js` is the same model packed in a script, used only when the site is opened straight from disk (browsers block downloads on file://). See `assets/CREDITS.txt`.

## Opening it
Double-click `index.html` and it works, 3D included, no server needed (the car photos and fonts still need an internet connection). Online it is the same site.

## The 3D
- Home hero: a car on a turntable in a forest-green studio. It turns slowly, drag it round, the wheels roll and the body squats with your scroll speed, and it "starts" (studio lights, headlamps, hazards) when the loader hits the redline.
- The V8 check (`#journey`, under the quick search): scroll and the camera walks round the car: side profile, tyres, brakes, the front clamshell lifting, the door opening into the cabin, with labels pinned to the parts. At the end it drives off the turntable.
- Page changes: the page swings away into depth and the next one swings in.
- Catalogue: cards flip up out of depth as they arrive, and the grid leans back with your scroll speed. Body types curve round like a carousel.
- When it runs: home page only, with WebGL2, no reduced-motion setting, no Data Saver and at least 4 GB of memory. Everyone else gets the photo slideshow and the chapters as a plain dark band. Landing on another page downloads nothing 3D until you go home.
- Where the car sits on screen is set in CSS: `.stage-mark` (hero) and `.stage-mark-j` (journey) in `scss/_showroom.scss` are invisible boxes the camera frames the car into. Shots, colours and label positions are at the top of `src/3d/showroom.js` and in the `.pin` elements of the template.
- Changing the 3D code: edit `src/3d/showroom.js`, then `cd src/3d && npm install && npm run build` (Node 18+). This rewrites the two `assets/showroom*.js` files. Then run `build.py` as usual.

## Source
- `index.tpl.html`: page template
- `scss/`: the styles
  - `main.scss` imports everything in order
  - `_tokens.scss` colours, easings, `:root` variables and mixins (`bp`, `above`, `fine`, `slant`, `riser`, `diamond`, `outline-text`)
  - `_legacy.scss` the original plain CSS (copied through as-is)
  - `_palette.scss`, `_sections.scss`, `_motion.scss`, `_loader.scss`, `_forest.scss` (dark theme), `_responsive.scss`
- `app.js`: all site code. `motion.js` (smooth scroll, ScrollTrigger scenes, page transition, parallax, magnetic buttons) is inserted into it at `/*@@MOTION@@*/`.
- `admin.tpl.html`: the admin panel
- `build.py`: builds `../index.html`, `../catalogue.html` and `../admin.html`, embedding `../data/cars.json` as the fallback copy.
- `scss_build.py`: a small SCSS compiler used when no `sass` or `sassc` is installed. If either is on your PATH, build.py uses it instead.
- `cars.py`, `photos_*.json`: only used to create the very first stock list.

Rebuild: `cd src && python3 build.py`
