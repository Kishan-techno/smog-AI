/**
 * Realistic Indian city & monitoring station metadata + seeded sample snapshots.
 * Seeded baselines are explicitly flagged with dataQuality: "sample" whenever live feeds are offline.
 */
export const CITIES = [
  {
    id: 'bhopal',
    name: 'Bhopal',
    state: 'Madhya Pradesh',
    lat: 23.2599,
    lon: 77.4126,
    timezone: 'Asia/Kolkata',
    populationHint: '2.4M',
    stations: [
      {
        id: 'bhopal-tt-nagar',
        name: 'TT Nagar (CPCB)',
        zone: 'Central Bhopal',
        lat: 23.2332,
        lon: 77.3991,
        samplePollutants: { pm25: 94, pm10: 158, no2: 42, so2: 14, co: 1.1, o3: 38 },
      },
      {
        id: 'bhopal-arera',
        name: 'Arera Colony E-4',
        zone: 'South-East Bhopal',
        lat: 23.2145,
        lon: 77.4344,
        samplePollutants: { pm25: 76, pm10: 132, no2: 31, so2: 11, co: 0.9, o3: 44 },
      },
      {
        id: 'bhopal-kolar',
        name: 'Kolar Road',
        zone: 'South Bhopal',
        lat: 23.1753,
        lon: 77.4192,
        samplePollutants: { pm25: 82, pm10: 146, no2: 28, so2: 10, co: 0.85, o3: 41 },
      },
      {
        id: 'bhopal-govindpura',
        name: 'Govindpura Industrial',
        zone: 'East Bhopal',
        lat: 23.2496,
        lon: 77.4566,
        samplePollutants: { pm25: 118, pm10: 196, no2: 56, so2: 22, co: 1.45, o3: 34 },
      },
      {
        id: 'bhopal-bairagarh',
        name: 'Sant Hirdaram Nagar',
        zone: 'West / Upper Lake',
        lat: 23.2719,
        lon: 77.3378,
        samplePollutants: { pm25: 68, pm10: 119, no2: 26, so2: 9, co: 0.78, o3: 47 },
      },
      {
        id: 'bhopal-kamlapati',
        name: 'Rani Kamalapati Hub',
        zone: 'MP Nagar Transit',
        lat: 23.2292,
        lon: 77.4394,
        samplePollutants: { pm25: 103, pm10: 171, no2: 49, so2: 15, co: 1.25, o3: 36 },
      },
    ],
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'NCT Delhi',
    lat: 28.6139,
    lon: 77.209,
    timezone: 'Asia/Kolkata',
    populationHint: '20M',
    stations: [
      {
        id: 'delhi-anand-vihar',
        name: 'Anand Vihar',
        zone: 'East Delhi',
        lat: 28.6469,
        lon: 77.316,
        samplePollutants: { pm25: 215, pm10: 342, no2: 78, so2: 19, co: 2.3, o3: 48 },
      },
      {
        id: 'delhi-rk-puram',
        name: 'R.K. Puram',
        zone: 'South Delhi',
        lat: 28.5633,
        lon: 77.1869,
        samplePollutants: { pm25: 168, pm10: 274, no2: 64, so2: 16, co: 1.8, o3: 52 },
      },
      {
        id: 'delhi-rohini',
        name: 'Rohini Sector 16',
        zone: 'North-West Delhi',
        lat: 28.7325,
        lon: 77.1199,
        samplePollutants: { pm25: 192, pm10: 305, no2: 69, so2: 17, co: 2.0, o3: 45 },
      },
      {
        id: 'delhi-lodhi',
        name: 'Lodhi Road (IMD)',
        zone: 'Central Delhi',
        lat: 28.5918,
        lon: 77.2273,
        samplePollutants: { pm25: 146, pm10: 238, no2: 53, so2: 14, co: 1.5, o3: 56 },
      },
    ],
  },
  {
    id: 'indore',
    name: 'Indore',
    state: 'Madhya Pradesh',
    lat: 22.7196,
    lon: 75.8577,
    timezone: 'Asia/Kolkata',
    populationHint: '3.2M',
    stations: [
      {
        id: 'indore-chhoti-gwaltoli',
        name: 'Chhoti Gwaltoli',
        zone: 'Central Indore',
        lat: 22.7177,
        lon: 75.8682,
        samplePollutants: { pm25: 78, pm10: 136, no2: 34, so2: 12, co: 0.92, o3: 43 },
      },
      {
        id: 'indore-vijay-nagar',
        name: 'Vijay Nagar',
        zone: 'North-East Indore',
        lat: 22.7533,
        lon: 75.8937,
        samplePollutants: { pm25: 69, pm10: 121, no2: 29, so2: 10, co: 0.81, o3: 45 },
      },
      {
        id: 'indore-rajwada',
        name: 'Rajwada Heritage',
        zone: 'Old Indore',
        lat: 22.7185,
        lon: 75.8548,
        samplePollutants: { pm25: 88, pm10: 152, no2: 39, so2: 13, co: 1.05, o3: 39 },
      },
    ],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.076,
    lon: 72.8777,
    timezone: 'Asia/Kolkata',
    populationHint: '21M',
    stations: [
      {
        id: 'mumbai-bandra',
        name: 'Bandra Kurla Complex',
        zone: 'Suburban Mumbai',
        lat: 19.0653,
        lon: 72.868,
        samplePollutants: { pm25: 71, pm10: 134, no2: 41, so2: 14, co: 1.1, o3: 37 },
      },
      {
        id: 'mumbai-colaba',
        name: 'Colaba Navy Nagar',
        zone: 'South Mumbai',
        lat: 18.9067,
        lon: 72.8147,
        samplePollutants: { pm25: 49, pm10: 96, no2: 27, so2: 11, co: 0.75, o3: 42 },
      },
      {
        id: 'mumbai-worli',
        name: 'Worli Seaface',
        zone: 'Central Coast',
        lat: 19.0168,
        lon: 72.8162,
        samplePollutants: { pm25: 58, pm10: 112, no2: 33, so2: 12, co: 0.88, o3: 40 },
      },
    ],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lon: 77.5946,
    timezone: 'Asia/Kolkata',
    populationHint: '13M',
    stations: [
      {
        id: 'blr-bapuji',
        name: 'Bapuji Nagar',
        zone: 'West Bengaluru',
        lat: 12.9569,
        lon: 77.5398,
        samplePollutants: { pm25: 42, pm10: 78, no2: 29, so2: 8, co: 0.72, o3: 36 },
      },
      {
        id: 'blr-silk-board',
        name: 'Silk Board Junction',
        zone: 'South-East Corridor',
        lat: 12.9177,
        lon: 77.6238,
        samplePollutants: { pm25: 61, pm10: 108, no2: 45, so2: 10, co: 1.05, o3: 34 },
      },
      {
        id: 'blr-hebbal',
        name: 'Hebbal Lake',
        zone: 'North Bengaluru',
        lat: 13.0358,
        lon: 77.597,
        samplePollutants: { pm25: 36, pm10: 69, no2: 24, so2: 7, co: 0.65, o3: 39 },
      },
    ],
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    lat: 26.8467,
    lon: 80.9462,
    timezone: 'Asia/Kolkata',
    populationHint: '3.9M',
    stations: [
      {
        id: 'lko-gomti',
        name: 'Gomti Nagar',
        zone: 'East Lucknow',
        lat: 26.85,
        lon: 81.0,
        samplePollutants: { pm25: 138, pm10: 214, no2: 48, so2: 15, co: 1.4, o3: 44 },
      },
      {
        id: 'lko-lalbagh',
        name: 'Lalbagh Central',
        zone: 'Central Lucknow',
        lat: 26.8469,
        lon: 80.9365,
        samplePollutants: { pm25: 164, pm10: 248, no2: 55, so2: 18, co: 1.7, o3: 40 },
      },
    ],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9124,
    lon: 75.7873,
    timezone: 'Asia/Kolkata',
    populationHint: '4.1M',
    stations: [
      {
        id: 'jpr-adarsh',
        name: 'Adarsh Nagar',
        zone: 'East Jaipur',
        lat: 26.8982,
        lon: 75.8333,
        samplePollutants: { pm25: 92, pm10: 178, no2: 37, so2: 13, co: 0.96, o3: 46 },
      },
      {
        id: 'jpr-shastri',
        name: 'Shastri Nagar',
        zone: 'North Jaipur',
        lat: 26.9472,
        lon: 75.7991,
        samplePollutants: { pm25: 84, pm10: 164, no2: 33, so2: 12, co: 0.89, o3: 48 },
      },
    ],
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lon: 73.8567,
    timezone: 'Asia/Kolkata',
    populationHint: '7.1M',
    stations: [
      {
        id: 'pnq-shivajinagar',
        name: 'Shivajinagar (IITM)',
        zone: 'Central Pune',
        lat: 18.5308,
        lon: 73.8475,
        samplePollutants: { pm25: 57, pm10: 102, no2: 34, so2: 11, co: 0.84, o3: 41 },
      },
      {
        id: 'pnq-kothrud',
        name: 'Kothrud',
        zone: 'West Pune',
        lat: 18.5074,
        lon: 73.8077,
        samplePollutants: { pm25: 46, pm10: 84, no2: 26, so2: 9, co: 0.72, o3: 44 },
      },
    ],
  },
];

export function findCityByIdOrName(query = 'bhopal') {
  const normalized = String(query).trim().toLowerCase();
  return (
    CITIES.find(
      (c) => c.id === normalized || c.name.toLowerCase() === normalized
    ) || null
  );
}

export function findNearestCity(lat, lon) {
  let best = CITIES[0];
  let bestDist = Infinity;
  for (const city of CITIES) {
    const d = haversineKm(lat, lon, city.lat, city.lon);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return { city: best, distanceKm: Math.round(bestDist * 10) / 10 };
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
