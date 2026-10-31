# Your Dream Motors website

- `index.html`: the website (built from the files in this folder)
- `admin.html`: the stock admin. Sign in with a GitHub fine-grained token that has **Contents: Read and write** on this repository.
- `data/cars.json`: the stock list. The admin edits this file; the website loads it on every visit (with a built-in copy as a fallback).
- `images/cars/`: photos uploaded from the admin.

## Source
- `index.tpl.html`, `style.css`, `app.js`: the website
- `admin.tpl.html`: the admin panel
- `build.py`: builds `../index.html` and `../admin.html`. It embeds `../data/cars.json` as the fallback copy.
- `cars.py`, `photos_*.json`: only used to create the very first stock list.

Rebuild: `cd src && python3 build.py`
