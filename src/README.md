# Source for index.html

`index.html` in the repo root is generated from these files.

- `index.tpl.html`: page structure
- `style.css`: styles
- `app.js`: router, transitions, loader, inventory filters, 3D viewer, forms
- `cars.py`: the stock list (add or edit cars here); `photos_*.json` hold the Unsplash photo IDs

Real stock lives in `REAL` in cars.py (from yourdreammotors.mu/showcase). Rebuild: `cd src && python3 build.py && cp your-dream-motors.html ../index.html`
