import { OGUN_DELIVERY_LOCATIONS } from '../data/ogunLocations';

/**
 * Geographic boundary polygon vertices for Ogun State, Nigeria (Lat, Lng)
 * Encloses all 20 LGAs: Abeokuta South, Abeokuta North, Ado-Odo/Ota, Ewekoro, Ifo,
 * Ijebu East, Ijebu North, Ijebu North-East, Ijebu Ode, Ikenne, Ipokia, Obafemi Owode,
 * Odogbolu, Odeda, Ogun Waterside, Remo North, Sagamu, Yewa North, Yewa South, Imeko Afon.
 */
export const OGUN_STATE_BOUNDARY = [
  // Southwest corner (Ipokia / border area)
  [6.38, 2.66],
  [6.50, 2.65],
  // Western border going north (Yewa South, Yewa North)
  [6.65, 2.63],
  [6.80, 2.64],
  [6.95, 2.65],
  [7.10, 2.66],
  [7.25, 2.68],
  // Northwest corner (Imeko Afon)
  [7.45, 2.70],
  [7.60, 2.73],
  [7.75, 2.78],
  [7.90, 2.85],
  [8.00, 2.92],
  // Northern border going east (Abeokuta North, Odeda)
  [8.00, 3.10],
  [7.95, 3.25],
  [7.85, 3.45],
  [7.75, 3.60],
  // Northeast (Obafemi Owode, Remo North)
  [7.60, 3.75],
  [7.45, 3.88],
  [7.30, 3.98],
  // East border (Ijebu North, Ijebu North-East)
  [7.15, 4.15],
  [7.00, 4.35],
  // Southeast (Ijebu East, Ogun Waterside)
  [6.82, 4.52],
  [6.65, 4.65],
  [6.45, 4.70],
  [6.30, 4.65],
  // Southern border going west (coast / Lagos border)
  [6.28, 4.45],
  [6.30, 4.20],
  [6.35, 3.95],
  [6.45, 3.75],
  [6.55, 3.55],
  [6.60, 3.35],
  [6.62, 3.15],
  [6.58, 2.95],
  [6.50, 2.78],
  [6.42, 2.70],
  // Close polygon back to start
  [6.38, 2.66]
];

/**
 * Center coordinates of Ogun State for initial map positioning
 */
export const OGUN_STATE_CENTER = {
  lat: 7.1557,
  lng: 3.3458,
  zoom: 10
};

/**
 * Ray-casting algorithm to determine if a (lat, lng) coordinate falls strictly inside Ogun State
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if inside Ogun State boundary
 */
export function isPointInOgunState(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return false;
  }
  
  const polygon = OGUN_STATE_BOUNDARY;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Find nearest Ogun LGA data hub from a given lat, lng
 */
export function getNearestOgunLGA(lat, lng) {
  let nearest = OGUN_DELIVERY_LOCATIONS[0];
  let minDistance = Infinity;

  // Approx lat/lng coords for Ogun LGA centers
  const lgaCoordinates = [
    { lga: 'Abeokuta South', lat: 7.1557, lng: 3.3458 },
    { lga: 'Abeokuta North', lat: 7.1820, lng: 3.3300 },
    { lga: 'Ado-Odo/Ota', lat: 6.6917, lng: 3.2355 },
    { lga: 'Ifo', lat: 6.8145, lng: 3.1952 },
    { lga: 'Sagamu', lat: 6.8322, lng: 3.6475 },
    { lga: 'Ijebu Ode', lat: 6.8206, lng: 3.9208 },
    { lga: 'Obafemi Owode', lat: 7.0800, lng: 3.5000 },
    { lga: 'Ewekoro', lat: 6.9333, lng: 3.2167 },
    { lga: 'Ikenne', lat: 6.8667, lng: 3.7167 },
    { lga: 'Remo North', lat: 6.9833, lng: 3.7167 },
    { lga: 'Odeda', lat: 7.2333, lng: 3.5333 },
    { lga: 'Odogbolu', lat: 6.8333, lng: 3.7667 },
    { lga: 'Ijebu North', lat: 6.9500, lng: 3.9167 },
    { lga: 'Ijebu East', lat: 6.7500, lng: 4.1333 },
    { lga: 'Ijebu North East', lat: 6.8500, lng: 3.9833 },
    { lga: 'Ogun Waterside', lat: 6.4500, lng: 4.4000 },
    { lga: 'Yewa South', lat: 6.8891, lng: 3.0142 },
    { lga: 'Yewa North', lat: 7.1500, lng: 3.0000 },
    { lga: 'Ipokia', lat: 6.5167, lng: 2.8500 },
    { lga: 'Imeko Afon', lat: 7.4500, lng: 2.8500 }
  ];

  lgaCoordinates.forEach(item => {
    const dist = Math.hypot(item.lat - lat, item.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      const matched = OGUN_DELIVERY_LOCATIONS.find(l => l.lga.toLowerCase() === item.lga.toLowerCase());
      if (matched) nearest = matched;
    }
  });

  return nearest;
}

/**
 * Reverse-geocode latitude and longitude into address details
 */
export async function reverseGeocodeLocation(lat, lng) {
  const isValidOgun = isPointInOgunState(lat, lng);
  const matchedLgaObj = getNearestOgunLGA(lat, lng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
      const town = addr.city || addr.town || addr.village || addr.suburb || addr.county || matchedLgaObj.towns[0];
      const state = addr.state || 'Ogun State';
      const lga = matchedLgaObj.lga;

      // Extract state name check from reverse geocode
      const returnedState = (addr.state || '').toLowerCase();
      const isOgunByText = returnedState.includes('ogun');

      const isFinalValid = isValidOgun || isOgunByText;

      const formattedAddress = [
        road,
        town,
        lga,
        'Ogun State'
      ].filter(Boolean).join(', ');

      return {
        isValid: isFinalValid,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        road: road || 'Selected Street / Location',
        town: town || matchedLgaObj.towns[0],
        lga: lga,
        state: 'Ogun State',
        country: 'Nigeria',
        fullAddress: formattedAddress || `${matchedLgaObj.towns[0]}, ${matchedLgaObj.lga}, Ogun State`,
        deliveryFee: matchedLgaObj.deliveryFee,
        estimatedTime: matchedLgaObj.estimatedTime,
        rawGeoData: data
      };
    }
  } catch (err) {
    console.warn('Geocoding API unavailable, using boundary solver fallback:', err);
  }

  // Fallback if network/geocoding API is slow or offline
  return {
    isValid: isValidOgun,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    road: 'Selected Delivery Pin',
    town: matchedLgaObj.towns[0],
    lga: matchedLgaObj.lga,
    state: 'Ogun State',
    country: 'Nigeria',
    fullAddress: `${matchedLgaObj.towns[0]}, ${matchedLgaObj.lga}, Ogun State`,
    deliveryFee: matchedLgaObj.deliveryFee,
    estimatedTime: matchedLgaObj.estimatedTime
  };
}

/**
 * Forward geocode address query into coordinates
 */
export async function searchOgunAddress(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const formattedQuery = `${query}, Ogun State, Nigeria`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedQuery)}&countrycodes=ng&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (response.ok) {
      const results = await response.json();
      return results.map(item => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const isValid = isPointInOgunState(lat, lng);

        return {
          display_name: item.display_name,
          lat,
          lng,
          isValid,
          address: item.address
        };
      });
    }
  } catch (err) {
    console.error('Search geocoding error:', err);
  }

  return [];
}
