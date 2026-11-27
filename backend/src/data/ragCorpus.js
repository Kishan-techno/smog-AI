/**
 * Trusted environmental & public-health guidance corpus for Grounded RAG.
 * Sources: CPCB NAQI India, WHO Global Air Quality Guidelines (2021),
 * MoHFW / NPCCHH India Health Advisories, and ICMR Indoor Air Guidance.
 */
export const RAG_CORPUS = [
  {
    id: 'CPCB-NAQI-2014',
    title: 'CPCB National Air Quality Index (NAQI) Health Bands',
    organization: 'Central Pollution Control Board (CPCB), India',
    url: 'https://cpcb.nic.in/National-Air-Quality-Index/',
    keywords: [
      'aqi',
      'moderate',
      'poor',
      'very poor',
      'severe',
      'satisfactory',
      'good',
      'category',
      'scale',
      'index',
      'cpcb',
    ],
    snippet:
      'CPCB defines six bands: Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400), and Severe (401–500). Moderate air may cause discomfort for people with asthma, children, and older adults; Poor air affects most people on prolonged exertion.',
    guidance: {
      en: 'Under CPCB bands, AQI 101–200 (Moderate) calls for pacing vigorous outdoor exertion for children and elders, while AQI >200 (Poor+) warrants moving heavy exercise indoors and wearing particulate masks outdoors.',
      hi: 'CPCB मानकों के अनुसार AQI 101–200 (मध्यम) में बच्चों और बुजुर्गों को भारी बाहरी व्यायाम कम करना चाहिए, और AQI 200 से ऊपर होने पर बाहर जाने के लिए मास्क व घर के अंदर गतिविधियाँ बेहतर होती हैं।',
      hinglish:
        'CPCB scale ke hisaab se AQI 101–200 (Moderate) mein bachchon aur buzurgo ko heavy outdoor exertion kam rakhna chahiye, aur AQI 200+ (Poor) par indoor exercise aur N95 mask better rehta hai.',
    },
  },
  {
    id: 'WHO-AQG-2021',
    title: 'WHO Global Air Quality Guidelines (PM2.5 & NO2)',
    organization: 'World Health Organization (WHO)',
    url: 'https://www.who.int/publications/i/item/9789240034228',
    keywords: [
      'pm25',
      'pm2.5',
      'pm10',
      'no2',
      'o3',
      'ozone',
      'who',
      'fine particles',
      'threshold',
      'limit',
      'safe',
    ],
    snippet:
      'WHO 2021 guidelines set 24-hour guideline levels of 15 µg/m³ for PM2.5, 45 µg/m³ for PM10, and 25 µg/m³ for NO2. Reducing exposure time in high-concentration microenvironments lowers cumulative particulate burden.',
    guidance: {
      en: 'WHO 2021 benchmarks (15 µg/m³ 24h PM2.5) highlight that even moderate Indian urban readings carry cumulative PM2.5 load, so trimming roadside dwell time helps.',
      hi: 'WHO 2021 दिशानिर्देश (PM2.5 24-घंटे 15 µg/m³) के अनुसार भीड़भाड़ वाली सड़कों पर कम समय बिताने से सूक्ष्म कणों (PM2.5) का कुल असर घटता है।',
      hinglish:
        'WHO 2021 guideline (PM2.5 15 µg/m³) batati hai ki traffic corridors par rukne ka time kam karne se cumulative PM2.5 exposure kaafi ghat sakta hai.',
    },
  },
  {
    id: 'MOHFW-SCHOOL-KIDS',
    title: 'NPCCHH Advisory on School Children & Outdoor Exercise',
    organization: 'Ministry of Health & Family Welfare (MoHFW), India',
    url: 'https://ncdc.mohfw.gov.in/',
    keywords: [
      'school',
      'child',
      'children',
      'kids',
      'play',
      'playground',
      'exercise',
      'walk',
      'morning',
      'jog',
      'sports',
      'bacche',
      'बच्चे',
      'स्कूल',
      'खेल',
    ],
    snippet:
      'Children breathe faster per kg body weight than adults and inhale more air closer to exhaust height. MoHFW/NPCCHH advises shifting morning assemblies or vigorous sports indoors when AQI exceeds 200, and choosing low-traffic midday windows when AQI is 101–200.',
    guidance: {
      en: 'Because vigorous play raises breathing volume 3–6x, shift intense sports indoors above AQI 200 and prefer lower-traffic afternoon hours during Moderate AQI.',
      hi: 'तेज खेल या दौड़ के समय सांस की गति 3–6 गुना बढ़ जाती है। AQI 200 से ऊपर होने पर बच्चों की खेल गतिविधियाँ घर या हॉल के अंदर रखें और सुबह के धुंधले समय से बचें।',
      hinglish:
        'Vigorous play mein breathing rate 3–6x badh jaati hai. Isliye AQI 200+ par outdoor sports indoor shift karein, aur 101–200 par low-traffic afternoon window prefer karein.',
    },
  },
  {
    id: 'ICMR-MASK-COMMUTE',
    title: 'Particulate Respirators (N95/KF94) & Roadside Commute Guidance',
    organization: 'ICMR / Environmental Health Advisory',
    url: 'https://www.icmr.gov.in/',
    keywords: [
      'mask',
      'n95',
      'kf94',
      'cloth',
      'commute',
      'bike',
      'scooter',
      'two wheeler',
      'car',
      'carpool',
      'bus',
      'traffic',
      'मास्क',
      'सफर',
    ],
    snippet:
      'Surgical and cloth masks let fine PM2.5 particles bypass around gaps. A properly fitted N95/KN95/KF94 mask without exhalation gap filters >90% of test aerosols; vehicle AC recirculation cuts cabin NO2/PM2.5 spikes.',
    guidance: {
      en: 'Cloth or loose surgical masks do not seal against PM2.5. Use a snug N95/KF94 mask on two-wheelers, or switch to closed-window carpool/transit with AC set to recirculate.',
      hi: 'कपड़े या ढीले सर्जिकल मास्क PM2.5 कणों को नहीं रोक पाते। दोपहिया वाहन पर अच्छी फिटिंग वाला N95/KF94 मास्क पहनें या बंद खिड़की और रीसर्क्युलेशन AC वाली कारपूल/बस चुनें।',
      hinglish:
        'Cloth ya loose surgical mask PM2.5 nahi rok pate. Two-wheeler par snug N95/KF94 mask lagayein, ya closed-window AC recirculation wale carpool/bus use karein.',
    },
  },
  {
    id: 'ICMR-INDOOR-SMOKE',
    title: 'Indoor Air Quality, Ventilation & Clean Cooking Practices',
    organization: 'ICMR & MoHFW Clean Household Guidance',
    url: 'https://www.icmr.gov.in/',
    keywords: [
      'indoor',
      'home',
      'house',
      'window',
      'ventilation',
      'cooking',
      'kitchen',
      'incense',
      'agarbatti',
      'coil',
      'mop',
      'purifier',
      'घर',
      'खिड़की',
      'रसोई',
    ],
    snippet:
      'Indoor PM2.5 surges during frying, biomass cooking, incense/agarbatti burning, and dry sweeping. Use kitchen exhaust, wet-mop floors, and time brief window cross-ventilation during windy midday hours rather than calm evenings.',
    guidance: {
      en: 'Ventilate briefly during windier midday hours (when ambient haze dips), keep windows shut during evening inversion, run kitchen exhaust while cooking, and wet-mop instead of dry sweeping.',
      hi: 'दोपहर में हवा तेज होने पर 20–30 मिनट खिड़कियाँ खोलें, शाम को बंद रखें, खाना बनाते समय एग्जॉस्ट फैन चलाएँ और झाड़ू की जगह गीला पोंछा लगाएँ।',
      hinglish:
        'Afternoon mein jab hawa tez ho tab 20–30 min cross-ventilation karein, shaam ko windows close rakhein, cooking ke time exhaust fan chalayein aur dry sweeping ke bajay wet-mop karein.',
    },
  },
  {
    id: 'BHOPAL-DISPERSION',
    title: 'Central India / Bhopal Diurnal Smog & Lake Breeze Dynamics',
    organization: 'MPPCB / Regional Urban Meteorology Notes',
    url: 'https://mppcb.mp.gov.in/',
    keywords: [
      'bhopal',
      'wind',
      'morning',
      'evening',
      'night',
      'winter',
      'inversion',
      'lake',
      'tt nagar',
      'arera',
      'govindpura',
      'kolar',
      'भोपाल',
      'सुबह',
      'शाम',
    ],
    snippet:
      'In Bhopal and central Indian cities, calm early mornings and post-sunset cooling create shallow boundary layers that trap vehicle and dust emissions near ground level, while 13:00–16:30 thermal mixing typically improves dispersion.',
    guidance: {
      en: 'In Bhopal, calm early mornings and post-sunset hours often trap surface emissions, whereas 1:00–4:30 PM convective breeze usually disperses haze faster—especially near open areas away from Govindpura or main arterial corridors.',
      hi: 'भोपाल में शांत सुबह और सूर्यास्त के बाद हवा की परत नीचे होने से धुंध जमीन के पास रुकती है, जबकि दोपहर 1 से 4:30 बजे के बीच हवा चलने से प्रदूषण अपेक्षाकृत कम होता है।',
      hinglish:
        'Bhopal mein subah aur sunset ke baad low wind ki wajah se pollution ground ke paas trap hota hai, jabki 1:00–4:30 PM ke beech breeze dispersion better hota hai.',
    },
  },
];
