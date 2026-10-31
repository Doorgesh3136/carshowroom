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
cars = build(photos)
print(len(cars), 'cars')
tpl = open(os.path.join(D,'index.tpl.html'),encoding='utf-8').read()
ld = {"@context":"https://schema.org","@type":"AutoDealer","name":"Your Dream Motors","url":"https://yourdreammotors.mu/",
 "logo":"https://yourdreammotors.mu/favicon.svg","image":"https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80",
 "telephone":"+230 433 8026","email":"info@yourdreammotors.mu","priceRange":"Rs 790,000 to Rs 16,500,000",
 "address":{"@type":"PostalAddress","streetAddress":"Royal Road","addressLocality":"Moka","addressCountry":"MU"},
 "geo":{"@type":"GeoCoordinates","latitude":-20.2194,"longitude":57.4961},
 "openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"09:00","closes":"17:00"},
   {"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"09:00","closes":"12:00"}],
 "sameAs":["https://facebook.com/Yourdreammotors","https://www.instagram.com/yourdreammotors.ltd/","https://www.tiktok.com/@yourdreammotors"],
 "contactPoint":[{"@type":"ContactPoint","telephone":"+230 433 8026","contactType":"sales","areaServed":"MU","availableLanguage":["English","French"]}]}
css = open(os.path.join(D,'style.css'),encoding='utf-8').read()
js = open(os.path.join(D,'app.js'),encoding='utf-8').read()
# light minify of css
css = re.sub(r'/\*.*?\*/','',css,flags=re.S); css = re.sub(r'\n\s*','\n',css)
out = (tpl.replace('{{CSS}}',css).replace('{{JS}}',js).replace('{{JSONLD}}',json.dumps(ld,ensure_ascii=False))
          .replace('{{DATA}}',json.dumps(cars,ensure_ascii=False,separators=(',',':'))).replace('{{COUNT}}',str(len(cars))))
assert '{{' not in out
open(os.path.join(D,'your-dream-motors.html'),'w',encoding='utf-8').write(out)
print(len(out)//1024,'KB')
for ch in ['—','–']:
    for m in re.finditer(ch, out): print('DASH:', out[max(0,m.start()-50):m.start()+30].replace('\n',' '))
