/**
 * Distance, Road Routing, ETA, Off-Route Evaluator & Geofencing Utilities for Alizson Delivery Tracking
 */

/**
 * Calculate straight-line Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Public OSRM routing endpoints for redundancy
const OSRM_ENDPOINTS = [
  'https://router.project-osrm.org/route/v1/driving',
  'https://routing.openstreetmap.de/routed-car/route/v1/driving'
];

/**
 * Fetch real driving road route, distance (km), and ETA duration (minutes) via OSRM Routing API.
 * Uses connected road networks strictly. NO straight-line fallbacks.
 * If routing fails, returns an explicit error state.
 */
export async function fetchOSRMRoute(originLat, originLng, destLat, destLng) {
  if (!originLat || !originLng || !destLat || !destLng) {
    return {
      isError: true,
      error: 'Invalid coordinates provided for route calculation.',
      routeCoordinates: []
    };
  }

  for (const endpoint of OSRM_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `${endpoint}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&annotations=true`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Number((route.distance / 1000).toFixed(2));
          const durationMinutes = Math.max(1, Math.round(route.duration / 60));
          
          // Coordinates in Leaflet format [lat, lng]
          const geometryCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

          // Snapped Road Access Points from OSRM waypoints
          let snappedOrigin = [originLat, originLng];
          let snappedDestination = [destLat, destLng];
          let isDestinationOffRoad = false;

          if (data.waypoints && data.waypoints.length >= 2) {
            const w0 = data.waypoints[0].location; // [lng, lat]
            const w1 = data.waypoints[1].location; // [lng, lat]
            snappedOrigin = [w0[1], w0[0]];
            snappedDestination = [w1[1], w1[0]];

            // Check if customer destination is set back from the nearest routable road (> 12 meters)
            const offRoadDistMeters = calculateHaversineDistance(snappedDestination[0], snappedDestination[1], destLat, destLng) * 1000;
            if (offRoadDistMeters > 12) {
              isDestinationOffRoad = true;
            }
          }

          return {
            isError: false,
            distanceKm,
            durationMinutes,
            routeCoordinates: geometryCoordinates,
            snappedOrigin,
            snappedDestination, // Nearest accessible road entrance node
            isDestinationOffRoad,
            source: 'OSRM Driving Engine'
          };
        }
      }
    } catch (err) {
      console.warn(`Routing endpoint ${endpoint} failed, trying secondary mirror...`, err);
    }
  }

  // If routing services fail or cannot find a connected road network route:
  // DO NOT RETURN A STRAIGHT LINE. Return explicit error state.
  return {
    isError: true,
    error: 'Unable to calculate a road route for this location.',
    routeCoordinates: [],
    distanceKm: calculateHaversineDistance(originLat, originLng, destLat, destLng),
    durationMinutes: Math.round((calculateHaversineDistance(originLat, originLng, destLat, destLng) / 35) * 60)
  };
}

/**
 * Calculates perpendicular / minimum distance in meters from a point (pLat, pLng)
 * to a segment defined by (aLat, aLng) -> (bLat, bLng).
 */
function pointToSegmentDistanceMeters(pLat, pLng, aLat, aLng, bLat, bLng) {
  const R = 6371000; // Earth radius in meters
  const cosLat = Math.cos(pLat * Math.PI / 180);
  const px = pLng * cosLat * (Math.PI / 180) * R;
  const py = pLat * (Math.PI / 180) * R;
  const ax = aLng * cosLat * (Math.PI / 180) * R;
  const ay = aLat * (Math.PI / 180) * R;
  const bx = bLng * cosLat * (Math.PI / 180) * R;
  const by = bLat * (Math.PI / 180) * R;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const distSq = (px - ax) * (px - ax) + (py - ay) * (py - ay);
    return Math.sqrt(distSq);
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;

  const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
  return Math.sqrt(distSq);
}

/**
 * Calculates the minimum distance in meters from a location to any segment of a route polyline.
 */
export function minDistanceToPolyline(pLat, pLng, polylineCoordinates) {
  if (!polylineCoordinates || polylineCoordinates.length < 2) return 0;
  let minDistance = Infinity;

  for (let i = 0; i < polylineCoordinates.length - 1; i++) {
    const segDist = pointToSegmentDistanceMeters(
      pLat, pLng,
      polylineCoordinates[i][0], polylineCoordinates[i][1],
      polylineCoordinates[i + 1][0], polylineCoordinates[i + 1][1]
    );
    if (segDist < minDistance) {
      minDistance = segDist;
    }
  }

  return minDistance;
}

/**
 * Off-route evaluator: Returns true if rider has moved > thresholdMeters (default 80m)
 * away from current calculated route polyline.
 */
export function isRiderOffRoute(riderLat, riderLng, routeCoordinates, thresholdMeters = 80) {
  if (!routeCoordinates || routeCoordinates.length < 2) return true;
  const distance = minDistanceToPolyline(riderLat, riderLng, routeCoordinates);
  return distance > thresholdMeters;
}

/**
 * Format timestamp into human-readable relative time string ("12 seconds ago", "4 minutes ago")
 */
export function formatLocationAge(timestamp) {
  if (!timestamp) return 'No GPS fix yet';
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (ageMs < 0) return 'Just now';

  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 15) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

/**
 * Evaluates whether location update is stale (e.g. older than 5 minutes)
 */
export function isLocationStale(timestamp, thresholdMinutes = 5) {
  if (!timestamp) return true;
  const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60);
  return ageMinutes >= thresholdMinutes;
}

/**
 * Geofencing evaluator to determine milestone transitions
 */
export function checkGeofenceStatus(riderLat, riderLng, destLat, destLng, currentStatus) {
  if (!riderLat || !riderLng || !destLat || !destLng) return null;

  const distanceKm = calculateHaversineDistance(riderLat, riderLng, destLat, destLng);

  if (distanceKm <= 0.2) {
    return 'Arrived at Destination';
  } else if (distanceKm <= 1.5 && (currentStatus === 'Out for Delivery' || currentStatus === 'Picked Up')) {
    return 'Nearby';
  }

  return null;
}
