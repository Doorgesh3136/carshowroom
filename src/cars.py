# Stock list for Your Dream Motors. Builds window.YDM_CARS for the page.
import json, os, random
D = os.path.dirname(os.path.abspath(__file__))

# key (matches photo search name), make, model, variant, year, price, km, fuel, trans, body, engine, power, drive, seats, doors, tier
SPEC = [
 ('Toyota Yaris','Toyota','Vios','1.5 G CVT',2022,1120000,21400,'Petrol','Automatic','Sedan','1.5L I4','106 hp','Front-wheel drive',5,4,'eco'),
 ('Toyota Corolla','Toyota','Corolla','1.8 Hybrid GLi',2021,1750000,38200,'Hybrid','Automatic','Sedan','1.8L I4 + electric','121 hp','Front-wheel drive',5,4,'mid'),
 ('Toyota RAV4','Toyota','RAV4','2.5 Hybrid VX',2022,2890000,26700,'Hybrid','Automatic','SUV','2.5L I4 + electric','219 hp','All-wheel drive',5,5,'prem'),
 ('Toyota Hilux','Toyota','Hilux','2.8 GD-6 Legend Double Cab',2021,2590000,61200,'Diesel','Automatic','Pickup','2.8L turbo diesel I4','201 hp','4x4',5,4,'pick'),
 ('Toyota Land Cruiser Prado','Toyota','Land Cruiser','4.5 V8 VX',2019,5150000,74500,'Diesel','Automatic','SUV','4.5L twin-turbo diesel V8','268 hp','4x4',7,5,'lux'),
 ('Honda Civic','Honda','Civic','1.5 VTEC Turbo RS',2022,1890000,19800,'Petrol','Automatic','Sedan','1.5L turbo I4','180 hp','Front-wheel drive',5,4,'mid'),
 ('Honda CR-V','Honda','CR-V','1.5T EX AWD',2021,2490000,40300,'Petrol','Automatic','SUV','1.5L turbo I4','190 hp','All-wheel drive',5,5,'mid'),
 ('Honda Jazz (Fit)','Honda','Fit','1.3 Home',2020,1040000,46800,'Petrol','Automatic','Hatchback','1.3L I4','98 hp','Front-wheel drive',5,5,'eco'),
 ('Hyundai Tucson','Hyundai','Tucson','1.6 T-GDi N Line',2023,2250000,12900,'Petrol','Automatic','SUV','1.6L turbo I4','180 hp','Front-wheel drive',5,5,'mid'),
 ('Hyundai Creta','Hyundai','Creta','1.5 Premium',2023,1490000,9700,'Petrol','Automatic','SUV','1.5L I4','113 hp','Front-wheel drive',5,5,'mid'),
 ('Hyundai i10','Hyundai','Grand i10','1.2 Fluid',2022,790000,22100,'Petrol','Manual','Hatchback','1.2L I4','83 hp','Front-wheel drive',5,5,'eco'),
 ('Kia Seltos','Kia','Seltos','1.6 EX+',2022,1590000,24800,'Petrol','Automatic','SUV','1.6L I4','121 hp','Front-wheel drive',5,5,'mid'),
 ('Nissan X-Trail','Nissan','X-Trail','2.5 Tekna 4WD',2021,2290000,47300,'Petrol','Automatic','SUV','2.5L I4','171 hp','All-wheel drive',7,5,'mid'),
 ('Nissan Navara','Nissan','Navara','2.3 dCi PRO-4X',2022,2150000,33600,'Diesel','Automatic','Pickup','2.3L twin-turbo diesel','188 hp','4x4',5,4,'pick'),
 ('Mazda CX-5','Mazda','CX-5','2.5 Akera AWD',2021,2190000,36900,'Petrol','Automatic','SUV','2.5L I4','194 hp','All-wheel drive',5,5,'prem'),
 ('Mazda 3','Mazda','3','2.0 Astina Hatch',2020,1450000,52100,'Petrol','Automatic','Hatchback','2.0L I4','165 hp','Front-wheel drive',5,5,'mid'),
 ('Volkswagen Polo','Volkswagen','Polo','1.0 TSI Life',2022,1190000,18300,'Petrol','Automatic','Hatchback','1.0L turbo I3','95 hp','Front-wheel drive',5,5,'eco'),
 ('Volkswagen Golf GTI','Volkswagen','Golf GTI','2.0 TSI Mk8',2022,2490000,17600,'Petrol','Automatic','Hatchback','2.0L turbo I4','245 hp','Front-wheel drive',5,5,'prem'),
 ('Volkswagen Tiguan','Volkswagen','Tiguan','2.0 TSI R-Line 4Motion',2021,2390000,39400,'Petrol','Automatic','SUV','2.0L turbo I4','220 hp','All-wheel drive',5,5,'prem'),
 ('Suzuki Jimny','Suzuki','Jimny','1.5 GLX AllGrip',2023,1880000,6400,'Petrol','Manual','SUV','1.5L I4','101 hp','4x4',4,3,'pick'),
 ('Peugeot 3008','Peugeot','3008','1.6 THP GT',2021,1980000,34800,'Petrol','Automatic','SUV','1.6L turbo I4','165 hp','Front-wheel drive',5,5,'prem'),
 ('Ford Ranger','Ford','Ranger','2.0 BiTurbo Wildtrak',2023,2690000,15800,'Diesel','Automatic','Pickup','2.0L twin-turbo diesel','210 hp','4x4',5,4,'pick'),
 ('Mitsubishi L200','Mitsubishi','L200','2.4 DI-D Double Cab',2020,1790000,68900,'Diesel','Manual','Pickup','2.4L turbo diesel I4','181 hp','4x4',5,4,'pick'),
 ('Mercedes-Benz G-Class','Mercedes-AMG','G 63','Night Package',2021,16500000,18000,'Petrol','Automatic','SUV','4.0L twin-turbo V8','585 hp','4x4',5,5,'lux'),
 ('BMW 3 Series','BMW','320i','M Sport',2022,2990000,23400,'Petrol','Automatic','Sedan','2.0L turbo I4','184 hp','Rear-wheel drive',5,4,'prem'),
 ('BMW X5','BMW','X5','xDrive40i M Sport',2021,5890000,42800,'Petrol','Automatic','SUV','3.0L turbo I6','340 hp','All-wheel drive',5,5,'lux'),
 ('BMW M4','BMW','M4','Competition',2022,6790000,9800,'Petrol','Automatic','Coupé','3.0L twin-turbo I6','510 hp','Rear-wheel drive',4,2,'lux'),
 ('Audi Q5','Audi','Q5','45 TFSI quattro S line',2021,3690000,33100,'Petrol','Automatic','SUV','2.0L turbo I4','265 hp','All-wheel drive',5,5,'prem'),
 ('Audi A3','Audi','A3','Sportback 35 TFSI',2022,2090000,20500,'Petrol','Automatic','Hatchback','1.5L turbo I4','150 hp','Front-wheel drive',5,5,'prem'),
 ('Audi Q8','Audi','Q8','55 TFSI quattro',2020,7190000,51600,'Petrol','Automatic','SUV','3.0L turbo V6','340 hp','All-wheel drive',5,5,'lux'),
 ('Range Rover Evoque','Land Rover','Range Rover Evoque','P200 R-Dynamic SE',2021,3790000,30400,'Petrol','Automatic','SUV','2.0L turbo I4','200 hp','All-wheel drive',5,5,'prem'),
 ('Range Rover Sport','Land Rover','Range Rover Sport','P400 HSE Dynamic',2022,9390000,21900,'Petrol','Automatic','SUV','3.0L turbo I6 MHEV','400 hp','All-wheel drive',5,5,'lux'),
 ('Land Rover Defender','Land Rover','Defender 110','D250 SE',2022,7890000,27300,'Diesel','Automatic','SUV','3.0L turbo diesel I6','249 hp','4x4',5,5,'lux'),
 ('Porsche Macan','Porsche','Macan','S',2021,5890000,29600,'Petrol','Automatic','SUV','2.9L twin-turbo V6','380 hp','All-wheel drive',5,5,'lux'),
 ('Porsche Cayenne','Porsche','Cayenne','E-Hybrid',2020,8590000,44100,'Hybrid','Automatic','SUV','3.0L turbo V6 + electric','462 hp','All-wheel drive',5,5,'lux'),
 ('Porsche 911','Porsche','911','Carrera S (992)',2021,10490000,14200,'Petrol','Automatic','Coupé','3.0L twin-turbo flat-6','450 hp','Rear-wheel drive',4,2,'lux'),
 ('Tesla Model 3','Tesla','Model 3','Long Range AWD',2022,2890000,24600,'Electric','Automatic','Sedan','Dual electric motors','498 hp','All-wheel drive',5,4,'ev'),
 ('Tesla Model Y','Tesla','Model Y','Long Range AWD',2023,3390000,13100,'Electric','Automatic','SUV','Dual electric motors','514 hp','All-wheel drive',5,5,'ev'),
 ('BYD Atto 3','BYD','Atto 3','Extended Range',2024,2090000,4300,'Electric','Automatic','SUV','Single electric motor','201 hp','Front-wheel drive',5,5,'ev'),
 ('MG ZS','MG','ZS','1.5 Comfort',2023,1090000,11200,'Petrol','Automatic','SUV','1.5L I4','112 hp','Front-wheel drive',5,5,'eco'),
 ('Ford Mustang','Ford','Mustang','5.0 V8 GT Fastback',2020,4290000,26800,'Petrol','Automatic','Coupé','5.0L V8','450 hp','Rear-wheel drive',4,2,'prem'),
 ('Jeep Wrangler','Jeep','Wrangler','2.0 Rubicon Unlimited',2021,4590000,31700,'Petrol','Automatic','SUV','2.0L turbo I4','272 hp','4x4',5,5,'pick'),
 ('Lexus RX','Lexus','RX 450h','F Sport',2020,5290000,48600,'Hybrid','Automatic','SUV','3.5L V6 + electric','308 hp','All-wheel drive',5,5,'lux'),
 ('Volvo XC60','Volvo','XC60','B5 Inscription AWD',2021,3890000,37200,'Petrol','Automatic','SUV','2.0L turbo I4 MHEV','250 hp','All-wheel drive',5,5,'prem'),
]

ORIG_PHOTOS = {
 1:['1677517859847-0e750bfd13a9','1680298255666-6071fc905870','1676409430179-4b33940b00c5'],
 2:['1619466548431-54ffb2fe2674','1732347700505-e1231e0f7c94','1684239725236-5f3b6e9f02c3'],
 3:['1618213221550-c32da08997db','1763567061050-e9b7cb51eda6','1740098159737-73673d741ebb'],
 4:['1655284764117-9711c428199b','1542282088-72c9c27ed0cd','1673098299153-2572a427e017'],
 5:['1649921777129-a28a26031a03','1665736721212-711a6e52933b','1647501581530-053b42684b8d','1731474633990-790a0fb02006'],
 6:['1743970844803-c3455db7b19d','1758620316764-dca1a0a1d9ca','1602449732857-3608d7718c59'],
 7:['1601362840469-51e4d8d58785','1523983388277-336a66bf9bcd'],
 8:['1550277773-c66239646bd9','1693314515348-ce21281e8520'],
 9:['1699862335489-36f7dec55c0e','1641430141849-cdc9073fd3d7'],
 10:['1587141165905-c4e3c0c5e5d4','1748569748174-33f4ba3ddcdf','1485291571150-772bcfc10da5'],
 11:['1551817280-6d59c77ce1b8','1715253875481-57874ea24c73'],
 12:['1533903179229-783a50d25dd7','1676409430179-4b33940b00c5'],
}
ORIG_COLOR = {1:'Alpine White',2:'Iridium Silver',3:'GT Silver Metallic',4:'Glacier White',5:'Black Pearl',6:'British Racing Green',
              7:'Bernina Grey',8:'Flame Red',9:'Speedy Blue',10:'Iridium Silver',11:'Titanium Grey',12:'Misano Red'}
ORIG_FIX = {2:[('offers the best of both worlds — silent electric motoring','gives you silent electric driving')],
            3:[('A stunning Taycan 4S','A Taycan 4S'),('Finished in the highly desirable Frozen Blue Metallic.','Finished in GT Silver Metallic.')],
            4:[('with the desirable Daytona Grey paintwork','in crisp Glacier White')],
            5:[('offers class-leading interior space and a striking design','has one of the biggest cabins and boots in its class')],
            8:[('the Magnite is a fantastic city SUV','the Magnite is an easy city SUV with a high seat')],
            10:[('beautifully presented in Selenite Grey.','beautifully presented in Iridium Silver.')],
            11:[('A smart, well-equipped compact SUV with an unbeatable warranty package. The Tiggo 4 Pro Luxury trim comes loaded with tech and safety features.','A compact SUV with a long factory warranty. The Luxury trim adds a 10.25-inch screen, 360-degree camera and six airbags.')],
            12:[('with the distinctive Storm Bay metallic paintwork','in Misano Red')]}
HFIX = {'Very economical — 5.1L/100km average':'About 5.1L/100km on average','MOT valid until 2027':'Road tax paid until 2027'}

FEAT = {
 'eco':['Air conditioning','Bluetooth audio','Apple CarPlay and Android Auto','Reversing camera','Rear parking sensors','ABS with brake assist','Dual front airbags','Electric windows','Steering wheel controls','USB charging','Central locking','Electric mirrors'],
 'mid':['Keyless entry and start','Adaptive cruise control','LED headlights','Climate control','Lane keep assist','Reversing camera','Apple CarPlay and Android Auto','Alloy wheels','Auto headlights','Rain-sensing wipers','Front and rear parking sensors','Six airbags'],
 'prem':['Leather seats','Digital instrument cluster','Panoramic sunroof','360-degree camera','Adaptive cruise control','Wireless phone charging','Premium sound system','Power tailgate','Heated front seats','Blind spot monitoring','Ambient lighting','Electric memory seats'],
 'lux':['Nappa leather','Ventilated and massage seats','Air suspension','Head-up display','Soft-close doors','Four-zone climate control','High-end surround sound','Matrix LED headlights','Adaptive dampers','360-degree camera','Panoramic glass roof','Night-time ambient lighting'],
 'pick':['Four-wheel drive with low range','Rear differential lock','Hill descent control','Tow bar','Load bed liner','Side steps','Roof rails','Reversing camera','Apple CarPlay and Android Auto','Cruise control','LED headlights','Off-road drive modes'],
 'ev':['DC fast charging','Home charging cable','Heat pump','One-pedal driving','Over-the-air updates','Glass roof','Adaptive cruise control','Lane centring','Premium sound system','Heated front seats','Phone-as-key','Large central touchscreen'],
}
HIGH = ['Full service history','Two keys supplied','Registered and ready to drive','Passed our 150-point inspection','Non-smoker vehicle','One owner from new','Balance of manufacturer warranty','Fresh service before handover','New tyres fitted']
BODY_LINE = {
 'SUV':'High driving position, a big boot and enough ground clearance for the rougher roads up north.',
 'Hatchback':'Easy to park in Port Louis and light on fuel for the daily commute.',
 'Sedan':'Quiet at motorway speed, with a proper boot for family trips and airport runs.',
 'Pickup':'Full-size load bed and rated to tow, so it works as hard on the weekend as during the week.',
 'Coupé':'Built to be driven, and it shows on the coast road from Grand Baie to Le Morne.',
}
EV_LINE = 'Charges at home overnight and costs a fraction of petrol to run day to day.'


# ───────── real stock, taken from yourdreammotors.mu/showcase (31 Oct 2026) ─────────
# make, model, variant, year, price, was, km (None = not listed), fuel, body, engine, power, drive, seats, doors, tier, photos
REAL = [
 ('Porsche','Panamera 4','E-Hybrid',2021,5498000,None,54916,'Hybrid','Sedan','2.9L twin-turbo V6 + electric','462 hp','All-wheel drive',4,5,'lux','@Porsche Panamera'),
 ('Porsche','Taycan 4S','Electric',2021,4998000,None,10000,'Electric','Sedan','Dual electric motors, 320 kW','530 hp with overboost','All-wheel drive',4,4,'ev',3),
 ('Mercedes-Benz','CLS 53','AMG 4MATIC+',2019,3998000,None,None,'Hybrid','Coupé','3.0L turbo I6 + EQ Boost','435 hp','All-wheel drive',4,4,'lux',10),
 ('Mercedes-Benz','E 200','2.0 petrol, EQ Boost',2023,2698000,2798000,13775,'Hybrid','Sedan','2.0L turbo I4 mild hybrid','204 hp','Rear-wheel drive',5,4,'lux','@Mercedes-Benz E-Class'),
 ('BMW','iX1','xDrive30 electric',2023,2698000,2798000,None,'Electric','SUV','Dual electric motors, 230 kW','313 hp','All-wheel drive',5,5,'ev',['1680298255666-6071fc905870']),
 ('Mercedes-Benz','GLC 300e','Plug-in hybrid',2022,2398000,None,74064,'Hybrid','SUV','2.0L turbo I4 + electric','320 hp','All-wheel drive',5,5,'prem',2),
 ('BMW','X2','25e plug-in hybrid',2024,2098000,None,55997,'Hybrid','SUV','1.5L turbo I3 + electric','220 hp','All-wheel drive',5,5,'prem',12),
 ('Kia','Sportage','GT Line 1.6 T-GDi',2025,1825000,None,18406,'Petrol','SUV','1.6L turbo I4','180 hp','Front-wheel drive',5,5,'mid',5),
 ('BMW','X1','1.5 petrol',2022,1698000,None,80979,'Petrol','SUV','1.5L turbo I3','136 hp','Front-wheel drive',5,5,'prem',['1677517859847-0e750bfd13a9']),
 ('BMW','730i','2.0 petrol',2016,1598000,None,104196,'Petrol','Sedan','2.0L turbo I4','258 hp','Rear-wheel drive',5,4,'lux',['1601362840469-51e4d8d58785']),
 ('Audi','A5','1.4 TFSI',2019,1398000,None,86336,'Petrol','Coupé','1.4L turbo I4','150 hp','Front-wheel drive',5,5,'prem',4),
 ('Nissan','Qashqai','1.3 DIG-T',2023,1325000,None,50539,'Petrol','SUV','1.3L turbo I4 mild hybrid','158 hp','Front-wheel drive',5,5,'mid','@Nissan Qashqai'),
 ('BMW','530e','Plug-in hybrid',2018,1198000,None,93000,'Hybrid','Sedan','2.0L turbo I4 + electric','252 hp','Rear-wheel drive',5,4,'prem','@BMW 5 Series'),
 ('BMW','740i','3.0 petrol',2014,1100000,1575000,132912,'Petrol','Sedan','3.0L turbo I6','320 hp','Rear-wheel drive',5,4,'lux',['1523983388277-336a66bf9bcd']),
 ('BMW','218i','1.5 petrol',2016,1100000,None,88459,'Petrol','@218','1.5L turbo I3','136 hp','Front-wheel drive',5,5,'mid','@BMW 2 Series'),
 ('MINI','Cooper SE','Electric',2021,1098000,None,78963,'Electric','Hatchback','Electric motor, 135 kW','184 hp','Front-wheel drive',4,3,'ev',6),
 ('Chery','Tiggo 4 Pro','1.5 turbo',2024,1098000,None,36213,'Petrol','SUV','1.5L turbo I4','145 hp','Front-wheel drive',5,5,'mid',11),
 ('Nissan','Magnite','1.0 turbo',2025,998000,None,14104,'Petrol','SUV','1.0L turbo I3','99 hp','Front-wheel drive',5,5,'eco',8),
 ('Mercedes-Benz','C 180','1.6 petrol',2019,975000,1050000,126186,'Petrol','Sedan','1.6L turbo I4','156 hp','Rear-wheel drive',5,4,'mid','@Mercedes-Benz C-Class'),
 ('Kia','Cerato','1.5 petrol',2022,875000,None,65174,'Petrol','Sedan','1.5L I4','113 hp','Front-wheel drive',5,4,'eco','@Kia Cerato'),
 ('Suzuki','Swift','GLX 1.2',2024,815000,None,26581,'Petrol','Hatchback','1.2L I4','82 hp','Front-wheel drive',5,5,'eco',9),
 ('Nissan','Magnite','1.0 turbo',2023,725000,None,50091,'Petrol','SUV','1.0L turbo I3','99 hp','Front-wheel drive',5,5,'eco',8),
 ('Mercedes-Benz','A 180','1.6 petrol',2013,525000,None,174412,'Petrol','Hatchback','1.6L turbo I4','122 hp','Front-wheel drive',5,5,'mid','@Mercedes-Benz A-Class'),
]
REAL_HIGH = ['Inspected before sale','Registered and ready to drive','Delivered anywhere in Mauritius','Trade-ins welcome']

def tidy(p):
    """Mauritian dealers price like 1,398,000: round demo prices to that style."""
    p *= .72
    return int(round(p/100000)*100000 - 2000) if p >= 1e6 else int(round(p/5000)*5000)

def build(photos):
    rnd = random.Random(7)
    cars = []
    nid = 1
    for (make,model,variant,year,price,was,km,fuel,body,engine,power,drive,seats,doors,tier,ph) in REAL:
        if isinstance(ph,int): pics = ORIG_PHOTOS[ph]
        elif isinstance(ph,list): pics = ph
        else:
            p = photos.get(ph[1:]); pics = p['photos'] if p else []
            if body == '@218': body = {'Coupé':'Coupé','Sedan':'Sedan'}.get((p or {}).get('body'),'Hatchback')
        if body == '@218': body = 'Hatchback'
        if not pics: continue
        line = EV_LINE if fuel == 'Electric' else BODY_LINE[body]
        kmtxt = f"has covered {km:,} km" if km else "comes with its mileage on request"
        desc = (f"{year} {make} {model} ({variant}) that {kmtxt}. {line} "
                f"Power comes from the {engine} with {power}. Like every car here it is inspected before sale, "
                f"registered for you and delivered anywhere on the island. Ask us for its full history and photos of this exact car.")
        cars.append(dict(id=nid, make=make, model=model, variant=variant, year=year, price=price, km=km, fuel=fuel, trans='Automatic', body=body,
            color=None, doors=doors, seats=seats, engine=engine, power=power, drive=drive, desc=desc, features=rnd.sample(FEAT[tier],10),
            highlights=REAL_HIGH, photos=pics[:4], real=True, **({'was':was} if was else {})))
        nid += 1
    used = {x for c in cars for x in c['photos']}
    for (key,make,model,variant,year,price,km,fuel,trans,body,engine,power,drive,seats,doors,tier) in SPEC:
        p = photos.get(key)
        if not p: continue
        pics = [x for x in p['photos'] if x not in used][:4]
        if not pics: continue
        used.update(pics)
        color = p.get('color','').strip().title() or None
        feats = rnd.sample(FEAT['ev' if fuel == 'Electric' else tier], 10)
        line = EV_LINE if fuel == 'Electric' else BODY_LINE[body]
        price = tidy(price)
        desc = (f"This {year} {make} {model} {variant} has covered {km:,} km. "
                f"{line} Under the bonnet is the {engine} with {power}, paired with a {trans.lower()} gearbox. "
                f"It has been through our workshop, comes with the paperwork done, and can be delivered anywhere on the island.")
        cars.append(dict(id=nid, make=make, model=model, variant=variant, year=year, price=price, km=km, fuel=fuel, trans=trans, body=body,
            color=color, doors=doors, seats=seats, engine=engine, power=power, drive=drive, desc=desc, features=feats, highlights=rnd.sample(HIGH,4), photos=pics))
        nid += 1
    for c in cars:
        c['added'] = rnd.choice([1,2,3,4,5,6,8,10,12,15,18,21,25,30,34,40])
    for c in cars[:23]:
        if c['make'] in ('Porsche','Kia') or c['model'] in ('E 200','iX1','Qashqai'): c['added'] = rnd.choice([1,2,3])
    return cars
