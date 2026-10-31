import json, os, re
from cars import build
D = os.path.dirname(os.path.abspath(__file__))
photos = {}
for f in ('photos_A.json','photos_B.json','photos_C.json'):
    for p in json.load(open(os.path.join(D,f))): photos[p['model']] = p
# de-duplicate photos across models (a photo should only belong to one car)
seen = set()
for k,p in photos.items():
    p['photos'] = [x for x in p['photos'] if not (x in seen or seen.add(x))]
DATA = os.path.join(D,'..','data','cars.json')
if os.path.exists(DATA):            # the admin panel's copy is the master list
    cars = json.load(open(DATA,encoding='utf-8'))
else:
    cars = build(photos)
live = [c for c in cars if c.get('status') != 'sold']
print(len(live), 'cars on sale')
tpl = open(os.path.join(D,'index.tpl.html'),encoding='utf-8').read()
ld = {"@context":"https://schema.org","@type":"AutoDealer","name":"V8 Motors","url":"https://v8motors.mu/",
 "slogan":"Drive smarter","image":"https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
 "telephone":"+230 5259 0327","email":"veightmotorsv8@gmail.com",
 "address":{"@type":"PostalAddress","streetAddress":"59B Royal Road","addressLocality":"Coromandel","addressCountry":"MU"},
 "contactPoint":[{"@type":"ContactPoint","telephone":"+230 5259 0327","contactType":"sales","areaServed":"MU"},{"@type":"ContactPoint","telephone":"+230 5750 7912","contactType":"sales","areaServed":"MU"},{"@type":"ContactPoint","telephone":"+230 5500 9527","contactType":"sales","areaServed":"MU"},{"@type":"ContactPoint","telephone":"+230 5532 9727","contactType":"sales","areaServed":"MU"}],
 "makesOffer":[{"@type":"Offer","name":"Car leasing through Rogers Capital"},{"@type":"Offer","name":"Vehicle exchange and trade-in"}]}
def scss():
    """Compile scss/main.scss. Uses a real Sass binary when one is installed, else the bundled compiler."""
    import shutil, subprocess
    src = os.path.join(D, 'scss', 'main.scss')
    for exe, args in (('sass', ['--no-source-map', '--style=expanded', '--silence-deprecation=import']), ('sassc', ['-t', 'expanded'])):
        if shutil.which(exe):
            r = subprocess.run([exe, *args, src], capture_output=True, text=True)
            if r.returncode == 0:
                print('css compiled with', exe); return r.stdout
            print(exe, 'failed, using the bundled compiler:', r.stderr[:300])
    from scss_build import compile_file
    print('css compiled with scss_build.py')
    return compile_file(src)
css = scss()
js = open(os.path.join(D,'app.js'),encoding='utf-8').read().replace('/*@@MOTION@@*/', open(os.path.join(D,'motion.js'),encoding='utf-8').read())
# light minify of css
css = re.sub(r'/\*.*?\*/','',css,flags=re.S); css = re.sub(r'\n\s*','\n',css)
out = (tpl.replace('{{CSS}}',css).replace('{{JS}}',js).replace('{{JSONLD}}',json.dumps(ld,ensure_ascii=False))
          .replace('{{DATA}}',json.dumps(cars,ensure_ascii=False,separators=(',',':'))).replace('{{COUNT}}',str(len(live))))
PAGES = [('index.html','https://v8motors.mu/',''),
         ('catalogue.html','https://v8motors.mu/catalogue.html','<script>window.V8_START="inventory";</script>')]
for fn, canon, extra in PAGES:
    o = out.replace('{{CANON}}', canon).replace('<body class="is-loading">', '<body class="is-loading">' + extra)
    if fn == 'catalogue.html':
        o = o.replace('<title>V8 Motors | Quality Used Cars in Coromandel, Mauritius</title>', '<title>Catalogue | Used Cars for Sale at V8 Motors, Coromandel</title>')
    assert '{{' not in o
    open(os.path.join(D,'..',fn),'w',encoding='utf-8').write(o)
print(len(out)//1024,'KB')
adm = open(os.path.join(D,'admin.tpl.html'),encoding='utf-8').read().replace('{{REPO}}','Doorgesh3136/carshowroom')
open(os.path.join(D,'..','admin.html'),'w',encoding='utf-8').write(adm)
print('admin.html written')
for ch in ['—','–']:
    for m in re.finditer(ch, out): print('DASH:', out[max(0,m.start()-50):m.start()+30].replace('\n',' '))
