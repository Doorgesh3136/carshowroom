# V8 Motors website

- `index.html`, `catalogue.html`: the website (built from the files in this folder)
- `admin.html`: the stock admin. Sign in with a GitHub fine-grained token that has **Contents: Read and write** on this repository.
- `data/cars.json`: the stock list. The admin edits this file; the website loads it on every visit (with a built-in copy as a fallback).
- `images/cars/`: photos uploaded from the admin.
- `vendor/gsap/`: GSAP 3.15 and ScrollTrigger, self-hosted.
- `vendor/three/`: three.js r170 (MIT), self-hosted: the core module plus GLTFLoader, BufferGeometryUtils and the meshopt decoder. Mapped by the import map in the page head.
- `assets/showroom.js`: the 3D showroom in the home hero (plain ES module, no build step). A car on a turntable in a forest-green studio: it turns slowly, you can drag it round, the wheels roll and the body squats with your scroll speed, and it "starts" (studio lights, headlamps, hazards) when the loader hits the redline. Colours are at the top of the file.
- `assets/showroom-car.glb`: the car (2.3 MB). See `assets/CREDITS.txt`.

## When the 3D car shows
Only on the home page, and only with WebGL2, no reduced-motion setting, no Data Saver and at least 4 GB of device memory. Everyone else gets the original photo slideshow, which also stays underneath as the fallback if the model fails to load or the graphics context is lost. Landing on the catalogue (or any other page) downloads nothing 3D until you go home.
The loader's percentage counts the real model download on the home page and waits for it (at most 9 seconds; after that the photos show and the car swaps in when it arrives).
Where the car sits is set in CSS, not JS: `.stage-mark` in `scss/_showroom.scss` is an invisible box the turntable is fitted into (right of the headline on wide screens, in its own band above the headline on phones).

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
