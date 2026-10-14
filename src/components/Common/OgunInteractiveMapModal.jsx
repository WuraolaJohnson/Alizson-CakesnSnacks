import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Search, Navigation, Check, X, ShieldAlert, 
  Layers, ZoomIn, ZoomOut, AlertCircle, Compass, RefreshCw, Map as MapIcon 
} from 'lucide-react';
import L from 'leaflet';
import { 
  OGUN_STATE_BOUNDARY, 
  OGUN_STATE_CENTER, 
  isPointInOgunState, 
  reverseGeocodeLocation, 
  searchOgunAddress 
} from '../../utils/ogunGeoValidation';
import { OGUN_DELIVERY_LOCATIONS } from '../../data/ogunLocations';

// Tile URLs
const TILE_LAYERS = {
  roadmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
  }
};

export default function OgunInteractiveMapModal({ selectedLocation, onSelectLocation, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const polygonRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' or 'satellite'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Current selected point & validation details
  const [locationDetails, setLocationDetails] = useState({
    isValid: true,
    lat: selectedLocation?.lat || OGUN_STATE_CENTER.lat,
    lng: selectedLocation?.lng || OGUN_STATE_CENTER.lng,
    road: selectedLocation?.road || 'Central Hub Area',
    town: selectedLocation?.city || 'Abeokuta',
    lga: selectedLocation?.lga || 'Abeokuta South',
    state: 'Ogun State',
    fullAddress: selectedLocation?.fullAddress || selectedLocation?.address || 'Abeokuta South, Ogun State',
    deliveryFee: selectedLocation?.deliveryFee || 1500,
    estimatedTime: selectedLocation?.estimatedTime || '24-48 hours'
  });

  const [errorMessage, setErrorMessage] = useState('');

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = locationDetails.lat;
    const initialLng = locationDetails.lng;

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: OGUN_STATE_CENTER.zoom,
      zoomControl: false // custom zoom buttons
    });

    // Add Tile Layer
    const layer = L.tileLayer(TILE_LAYERS[mapType].url, {
      attribution: TILE_LAYERS[mapType].attribution,
      maxZoom: 19
    }).addTo(map);
    tileLayerRef.current = layer;

    // Add Ogun State Boundary Polygon
    const boundaryPolygon = L.polygon(OGUN_STATE_BOUNDARY, {
      color: '#E58A13',
      weight: 3,
      fillColor: '#E58A13',
      fillOpacity: 0.12,
      dashArray: '6, 6'
    }).addTo(map);
    polygonRef.current = boundaryPolygon;

    // Custom DivIcon for Draggable Marker
    const isValid = isPointInOgunState(initialLat, initialLng);
    const customIcon = createMarkerIcon(isValid);

    // Add Draggable Marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);
    markerRef.current = marker;

    // Handle Marker Drag End
    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      handlePointSelected(pos.lat, pos.lng, map);
    });

    // Handle Map Click (to place pin anywhere clicked)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handlePointSelected(lat, lng, map);
    });

    mapInstanceRef.current = map;

    // Perform initial reverse geocode check
    handlePointSelected(initialLat, initialLng, map, false);

    const t1 = setTimeout(() => { if (map) map.invalidateSize(); }, 150);
    const t2 = setTimeout(() => { if (map) map.invalidateSize(); }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch Map Type (Roadmap vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILE_LAYERS[mapType].url, {
      attribution: TILE_LAYERS[mapType].attribution,
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
  }, [mapType]);

  // Create Marker Icon helper
  const createMarkerIcon = (isValid) => {
    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: ${isValid ? 'linear-gradient(135deg, #AD6208, #8F4F06)' : 'linear-gradient(135deg, #EF4444, #991B1B)'};
          color: white;
          box-shadow: 0 8px 20px ${isValid ? 'rgba(229,138,19,0.5)' : 'rgba(239,68,68,0.5)'};
          border: 3px solid white;
          transition: transform 0.2s ease, background 0.3s;
          cursor: grab;
        ">
          <span style="font-size: 22px; line-height: 1;">${isValid ? '📍' : '⚠️'}</span>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44]
    });
  };

  // 3. Central Handler when a Point (lat, lng) is selected on Map
  const handlePointSelected = async (lat, lng, mapObj = mapInstanceRef.current, panTo = true) => {
    setIsLoadingAddress(true);

    const initialValid = isPointInOgunState(lat, lng);

    // Update marker icon dynamically (preliminary — will update again after geocoding)
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(createMarkerIcon(initialValid));
    }

    if (panTo && mapObj) {
      mapObj.panTo([lat, lng]);
    }

    // Set preliminary error (may be cleared after reverse geocode)
    if (!initialValid) {
      setErrorMessage('Checking location...');
    } else {
      setErrorMessage('');
    }

    // Reverse Geocode — this does the final validation (polygon + text check)
    const geoData = await reverseGeocodeLocation(lat, lng);

    // Update with final validation result from geocoder
    if (geoData.isValid) {
      setErrorMessage('');
      if (markerRef.current) {
        markerRef.current.setIcon(createMarkerIcon(true));
      }
    } else {
      setErrorMessage('Sorry, delivery is currently available only within Ogun State, Nigeria. Please select a location within Ogun State.');
      if (markerRef.current) {
        markerRef.current.setIcon(createMarkerIcon(false));
      }
    }

    setLocationDetails(geoData);
    setIsLoadingAddress(false);
  };

  // 4. Handle Address Search
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await searchOgunAddress(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectSearchResult = (result) => {
    setSearchResults([]);
    setSearchQuery(result.display_name);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([result.lat, result.lng], 14);
      handlePointSelected(result.lat, result.lng, mapInstanceRef.current, false);
    }
  };

  // 5. Browser Geolocation Button ("Use My Current Location")
  const [geoError, setGeoError] = useState('');

  const handleUseCurrentLocation = () => {
    // Clear previous errors
    setGeoError('');
    setErrorMessage('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please search for your address or place the pin manually.');
      return;
    }

    // Check if we're on a secure context (HTTPS or localhost)
    if (window.isSecureContext === false) {
      setGeoError('Location access requires a secure connection (HTTPS). Please search for your address or drag the pin on the map instead.');
      return;
    }

    setIsLocating(true);

    // Check permission state first if the API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          setIsLocating(false);
          setGeoError('Location access was previously denied. Please enable location in your browser settings, or search for your address / drag the pin on the map.');
          return;
        }
        // Permission is 'granted' or 'prompt' — proceed to request
        requestGeolocation();
      }).catch(() => {
        // permissions.query not fully supported, just proceed
        requestGeolocation();
      });
    } else {
      // Fallback: just request directly
      requestGeolocation();
    }
  };

  const requestGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setGeoError('');
        const { latitude, longitude, accuracy } = position.coords;

        // Sanity check: coordinates should be in or near Nigeria (lat ~4-14, lng ~2.5-15)
        if (latitude < 3 || latitude > 15 || longitude < 2 || longitude > 16) {
          setGeoError(`Your detected GPS position (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) appears to be outside Nigeria. Please search for your address or drag the pin manually.`);
          return;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
          handlePointSelected(latitude, longitude, mapInstanceRef.current, false);
        }
      },
      (error) => {
        setIsLocating(false);
        let message = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission was denied. Please allow location access in your browser settings, or search for your address / drag the pin on the map.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Your location could not be determined. Please make sure GPS/Location is enabled on your device, then try again. Or search for your address instead.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please ensure you have a good GPS signal, then try again. Or search for your address instead.';
            break;
          default:
            message = 'Unable to retrieve your location. Please search for your address or drag the pin on the map.';
        }
        setGeoError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // 6. Quick LGA Hub Preset selector
  const handleSelectLgaPreset = (lgaHub) => {
    const coords = {
      'Abeokuta South': { lat: 7.1557, lng: 3.3458 },
      'Abeokuta North': { lat: 7.1820, lng: 3.3300 },
      'Ado-Odo/Ota': { lat: 6.6917, lng: 3.2355 },
      'Ifo': { lat: 6.8145, lng: 3.1952 },
      'Sagamu': { lat: 6.8322, lng: 3.6475 },
      'Ijebu Ode': { lat: 6.8206, lng: 3.9208 },
      'Obafemi Owode': { lat: 7.0800, lng: 3.5000 },
      'Ewekoro': { lat: 6.9333, lng: 3.2167 },
      'Ikenne': { lat: 6.8667, lng: 3.7167 },
      'Odeda': { lat: 7.2333, lng: 3.5333 }
    };

    const target = coords[lgaHub.lga] || { lat: OGUN_STATE_CENTER.lat, lng: OGUN_STATE_CENTER.lng };
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([target.lat, target.lng], 13);
      handlePointSelected(target.lat, target.lng, mapInstanceRef.current, false);
    }
  };

  // 7. Confirm Location & Close Modal
  const handleConfirmLocation = () => {
    if (!locationDetails.isValid) {
      setErrorMessage('Sorry, delivery is currently available only within Ogun State, Nigeria. Please select a location within Ogun State.');
      return;
    }

    const payload = {
      state: 'Ogun State',
      lga: locationDetails.lga,
      city: locationDetails.town,
      address: locationDetails.fullAddress,
      fullAddress: locationDetails.fullAddress,
      latitude: locationDetails.lat,
      longitude: locationDetails.lng,
      deliveryFee: locationDetails.deliveryFee,
      estimatedTime: locationDetails.estimatedTime,
      placeInfo: {
        road: locationDetails.road,
        town: locationDetails.town,
        lga: locationDetails.lga,
        state: 'Ogun State',
        country: 'Nigeria'
      }
    };

    onSelectLocation(payload);
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 12, 10, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '1080px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--cream-300)',
          animation: 'scaleUp 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E120B 0%, #3B2314 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--gold-500)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <span
                style={{
                  background: 'var(--gold-action)',
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Ogun State Belt Only
              </span>
              <span style={{ fontSize: '0.85rem', color: '#E8D8C0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Compass size={14} /> Interactive Pinpoint Map
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', margin: 0, color: 'white' }}>
              Select Exact Delivery Location on Map
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Close Map Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Map Body Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', position: 'relative' }}>
          
          {/* Left / Top Controls Sidebar */}
          <div
            style={{
              width: '340px',
              background: 'var(--cream-50)',
              borderRight: '1px solid var(--cream-200)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
              overflowY: 'auto'
            }}
          >
            {/* Search Bar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--cream-200)', background: 'var(--bg-surface)' }}>
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={17}
                      style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search street, area or town..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSearching}
                    style={{ padding: '0.5rem 0.85rem' }}
                  >
                    {isSearching ? <RefreshCw size={16} className="spin" /> : 'Search'}
                  </button>
                </div>
              </form>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--cream-300)',
                    boxShadow: 'var(--shadow-md)',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}
                >
                  {searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(res)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid var(--cream-100)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-50)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--charcoal-900)' }}>
                        {res.display_name.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {res.display_name}
                      </div>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: res.isValid ? 'var(--status-success)' : 'var(--status-danger)'
                        }}
                      >
                        {res.isValid ? '✓ Within Ogun State' : '⚠️ Outside Service Area'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map Mode & Geolocation Actions */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--cream-200)', background: 'var(--bg-surface)', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${mapType === 'roadmap' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                onClick={() => setMapType('roadmap')}
              >
                <MapIcon size={14} /> Road Map
              </button>
              <button
                type="button"
                className={`btn ${mapType === 'satellite' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                onClick={() => setMapType('satellite')}
              >
                <Layers size={14} /> Satellite
              </button>
            </div>

            {/* Geolocation Button */}
            <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--cream-200)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem', gap: '0.5rem' }}
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
              >
                <Navigation size={15} style={{ color: 'var(--text-gold)' }} />
                {isLocating ? 'Detecting My Location...' : 'Use My Current GPS Location'}
              </button>

              {/* Geolocation Error Display */}
              {geoError && (
                <div
                  style={{
                    marginTop: '0.6rem',
                    background: 'var(--status-warning-bg)',
                    border: '1px solid #F59E0B',
                    color: 'var(--status-warning)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.6rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    gap: '0.4rem',
                    alignItems: 'flex-start',
                    lineHeight: 1.4
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{geoError}</div>
                </div>
              )}
            </div>

            {/* Quick Hub Presets */}
            <div style={{ padding: '1rem', flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Quick Jump to Ogun Hubs
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {OGUN_DELIVERY_LOCATIONS.slice(0, 8).map((hub) => (
                  <button
                    key={hub.lga}
                    type="button"
                    style={{
                      background: locationDetails.lga === hub.lga ? 'var(--gold-action)' : 'var(--bg-surface)',
                      color: locationDetails.lga === hub.lga ? 'white' : 'var(--charcoal-800)',
                      border: '1px solid var(--cream-300)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onClick={() => handleSelectLgaPreset(hub)}
                  >
                    📍 {hub.lga}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Location Confirmation Card */}
            <div
              style={{
                padding: '1rem',
                borderTop: '1px solid var(--cream-200)',
                background: locationDetails.isValid ? 'var(--cream-100)' : 'var(--status-danger-bg)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Selected Delivery Location
              </div>

              {isLoadingAddress ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <RefreshCw size={16} className="spin" /> Updating location details...
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 800, color: 'var(--charcoal-900)', fontSize: '0.925rem', marginBottom: '0.2rem' }}>
                    {locationDetails.fullAddress}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                    <div><strong>LGA:</strong> {locationDetails.lga}</div>
                    <div><strong>State:</strong> {locationDetails.state}</div>
                    <div><strong>Coordinates:</strong> [{locationDetails.lat}, {locationDetails.lng}]</div>
                    <div><strong>Delivery Fee:</strong> ₦{locationDetails.deliveryFee.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Outside Ogun Warning Banner */}
              {errorMessage && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    background: 'var(--status-danger-bg)',
                    border: '1px solid #FCA5A5',
                    color: 'var(--status-danger)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start'
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Confirm Action Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '0.85rem',
                  opacity: locationDetails.isValid ? 1 : 0.5,
                  cursor: locationDetails.isValid ? 'pointer' : 'not-allowed'
                }}
                disabled={!locationDetails.isValid || isLoadingAddress}
                onClick={handleConfirmLocation}
              >
                <Check size={18} /> Confirm Delivery Location
              </button>
            </div>
          </div>

          {/* Right Map Canvas Area */}
          <div style={{ flex: 1, position: 'relative', background: '#e5e7eb' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Floating Instructional Banner */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                zIndex: 500,
                background: 'var(--bg-glass)',
                backdropFilter: 'blur(6px)',
                borderRadius: 'var(--radius-lg)',
                padding: '0.75rem 1.25rem',
                border: `1.5px solid ${locationDetails.isValid ? 'var(--gold-500)' : '#EF4444'}`,
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{locationDetails.isValid ? '📍' : '⚠️'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: locationDetails.isValid ? 'var(--text-gold)' : 'var(--status-danger)' }}>
                    {locationDetails.isValid ? 'Drag the pin or click anywhere on the map to set your exact address' : 'Location is outside Ogun State delivery belt'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Only locations within the highlighted Ogun State boundary polygon are eligible.
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: locationDetails.isValid ? 'var(--status-success)' : 'var(--status-danger)',
                  background: locationDetails.isValid ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {locationDetails.isValid ? '✓ Valid Ogun Location' : '❌ Delivery Unavailable'}
              </div>
            </div>

            {/* Custom Zoom Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 500,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <button
                type="button"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--cream-300)',
                  borderRadius: 'var(--radius-md)',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'pointer'
                }}
                onClick={() => mapInstanceRef.current?.zoomIn()}
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--cream-300)',
                  borderRadius: 'var(--radius-md)',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)',
                  cursor: 'pointer'
                }}
                onClick={() => mapInstanceRef.current?.zoomOut()}
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
