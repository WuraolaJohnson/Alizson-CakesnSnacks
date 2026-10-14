import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, MapPin, Clock, ShieldCheck, Phone, CheckCircle2, 
  Layers, Map as MapIcon, AlertTriangle, RefreshCw, ChevronLeft, User, Package, Sparkles, Printer
} from 'lucide-react';
import L from 'leaflet';
import { useOrders, ORDER_STATUS_STEPS } from '../context/OrderContext';
import { useApp } from '../context/AppContext';
import { 
  fetchOSRMRoute, 
  formatLocationAge, 
  isLocationStale, 
  calculateHaversineDistance,
  isRiderOffRoute
} from '../utils/trackingRouting';
import { printOrderReceipt } from '../utils/receiptGenerator';

const TILE_LAYERS = {
  roadmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  }
};

export default function OrderTrackingPage({ orderId }) {
  const { orders } = useOrders();
  const { navigateTo } = useApp();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const offRoadConnectorRef = useRef(null);
  const roadAccessNodeRef = useRef(null);

  const [mapType, setMapType] = useState('roadmap');
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Match target order or pick most recent order
  const order = orders.find(o => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem', background: 'var(--cream-50)', minHeight: '80vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '1rem' }}>No Active Order Found</h2>
        <button className="btn btn-primary btn-lg" onClick={() => navigateTo('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (order.fulfillmentType === 'pickup') {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 1.5rem', background: 'var(--cream-50)', minHeight: '80vh' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏬</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Store Pick-Up Order #{order.id}</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 1.5rem' }}>
          Live map route tracking is available strictly for home delivery orders. This order is designated for customer pick-up at our store location.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigateTo('dashboard')}>Back to Customer Dashboard</button>
      </div>
    );
  }

  const destLat = order.latitude || 7.1557;
  const destLng = order.longitude || 3.3458;
  const riderLoc = order.riderLocation || { lat: destLat - 0.015, lng: destLng - 0.015, timestamp: new Date().toISOString() };
  const rider = order.assignedRider || { name: 'Dispatch Rider', phone: '+234 803 555 0192', vehicle: 'Express Delivery Bike', rating: 4.9 };

  const isStale = isLocationStale(riderLoc.timestamp, 5);
  const locationAgeText = formatLocationAge(riderLoc.timestamp);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      updateMapLayers();
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [destLat, destLng],
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer(TILE_LAYERS[mapType].url, { maxZoom: 19 }).addTo(map);

    // Customer Destination Pin (Gold Pin Icon)
    const destIcon = L.divIcon({
      className: 'dest-pin',
      html: `
        <div style="
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg, #E58A13, #B45309);
          border: 3px solid white; box-shadow: 0 6px 16px rgba(229,138,19,0.5);
          display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;
        ">
          🏠
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 42]
    });

    const destMarker = L.marker([destLat, destLng], { icon: destIcon })
      .bindPopup(`<b>Destination: ${order.customerName}</b><br/>${order.deliveryAddress}`)
      .addTo(map);
    destMarkerRef.current = destMarker;

    // Rider Location Pin (Motorcycle Icon)
    const riderIcon = createRiderIcon(isStale);
    const riderMarker = L.marker([riderLoc.lat, riderLoc.lng], { icon: riderIcon })
      .bindPopup(`<b>${rider.name}</b><br/>Status: ${order.status}<br/>${locationAgeText}`)
      .addTo(map);
    riderMarkerRef.current = riderMarker;

    mapInstanceRef.current = map;

    // Fit bounds to show both pins
    const bounds = L.latLngBounds([[destLat, destLng], [riderLoc.lat, riderLoc.lng]]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // Load OSRM Route
    loadRouteGeometry(riderLoc.lat, riderLoc.lng, destLat, destLng, map);

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
  }, [order.id]);

  // Update map when rider location updates
  useEffect(() => {
    if (!mapInstanceRef.current || !riderMarkerRef.current) return;

    riderMarkerRef.current.setLatLng([riderLoc.lat, riderLoc.lng]);
    riderMarkerRef.current.setIcon(createRiderIcon(isStale));
    riderMarkerRef.current.setPopupContent(`<b>${rider.name}</b><br/>Status: ${order.status}<br/>${locationAgeText}`);

    // Off-route evaluation: only recalculate full route if rider has deviated > 80m from route
    loadRouteGeometry(riderLoc.lat, riderLoc.lng, destLat, destLng, mapInstanceRef.current, false);
  }, [riderLoc.lat, riderLoc.lng, isStale, order.status]);

  // Switch tile layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    L.tileLayer(TILE_LAYERS[mapType].url, { maxZoom: 19 }).addTo(mapInstanceRef.current);
  }, [mapType]);

  const updateMapLayers = () => {};

  const createRiderIcon = (stale) => {
    return L.divIcon({
      className: 'rider-pin',
      html: `
        <div style="
          width: 46px; height: 46px; border-radius: 50%;
          background: ${stale ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #10B981, #047857)'};
          border: 3px solid white; box-shadow: 0 8px 20px ${stale ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'};
          display: flex; align-items: center; justify-content: center; color: white; font-size: 22px;
          animation: ${stale ? 'none' : 'pulse 2s infinite'};
        ">
          🛵
        </div>
      `,
      iconSize: [46, 46],
      iconAnchor: [23, 46]
    });
  };

  const loadRouteGeometry = async (rLat, rLng, dLat, dLng, mapObj, forceRecalculate = false) => {
    if (!mapObj) return;

    // Check off-route: if we already have valid route coordinates and not forced, only recalculate if off-route (>80m)
    if (!forceRecalculate && routeInfo && routeInfo.routeCoordinates && routeInfo.routeCoordinates.length > 1) {
      const offRoute = isRiderOffRoute(rLat, rLng, routeInfo.routeCoordinates, 80);
      if (!offRoute) {
        return; // Rider is on route; marker updated smoothly without API call
      }
    }

    const route = await fetchOSRMRoute(rLat, rLng, dLat, dLng);
    if (!route || !mapObj) return;

    setRouteInfo(route);

    if (polylineRef.current) {
      mapObj.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
    if (offRoadConnectorRef.current) {
      mapObj.removeLayer(offRoadConnectorRef.current);
      offRoadConnectorRef.current = null;
    }
    if (roadAccessNodeRef.current) {
      mapObj.removeLayer(roadAccessNodeRef.current);
      roadAccessNodeRef.current = null;
    }

    if (route.isError) {
      setRouteError(route.error || 'Unable to calculate a road route for this location.');
      return;
    }

    setRouteError(null);

    // Solid polyline for drivable road network
    const polyline = L.polyline(route.routeCoordinates, {
      color: '#E58A13',
      weight: 5,
      opacity: 0.95
    }).addTo(mapObj);
    polylineRef.current = polyline;

    // Dashed walkway connector from nearest road access node to off-road property
    if (route.isDestinationOffRoad && route.snappedDestination) {
      const connector = L.polyline([route.snappedDestination, [dLat, dLng]], {
        color: '#4B5563',
        weight: 3,
        dashArray: '4, 4',
        opacity: 0.8
      }).addTo(mapObj);
      offRoadConnectorRef.current = connector;

      const accessIcon = L.divIcon({
        className: 'road-access-node',
        html: `
          <div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: #E58A13; border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          " title="Nearest Accessible Road Entrance"></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      const accessMarker = L.marker(route.snappedDestination, { icon: accessIcon })
        .bindPopup('<b>Nearest Accessible Road Entrance</b>')
        .addTo(mapObj);
      roadAccessNodeRef.current = accessMarker;
    }
  };

  const currentStep = order.statusStep !== undefined ? order.statusStep : 1;

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '85vh', paddingBottom: '4rem' }}>
      {/* Top Header Navigation */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--charcoal-950), #1E1712)',
          color: 'white',
          padding: '1.25rem 0',
          borderBottom: '2px solid var(--gold-500)'
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              onClick={() => navigateTo('dashboard')}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.85)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}
            >
              <ChevronLeft size={16} /> Back to Customer Dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0, color: '#ffffff' }}>
                Tracking Order #{order.id}
              </h1>
              <span style={{ background: 'var(--gold-500)', color: '#ffffff', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem' }}>
                {order.storeName || 'Alizson Store'}
              </span>
            </div>
          </div>

          {/* Right Header Actions: Security Delivery PIN & Print Receipt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => printOrderReceipt(order)}
              className="btn"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <Printer size={16} /> Print Receipt
            </button>

            {order.deliveryPin && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(229, 138, 19, 0.5)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.65rem 1.25rem',
                  textAlign: 'right'
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🔑 Delivery Security PIN
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold-400)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                  {order.deliveryPin}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)' }}>Provide this PIN to rider upon arrival</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>
        
        {/* Payment Verification Banner */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: order.paymentStatus === 'Paid' ? '#ECFDF5' : '#FFFBEB',
          border: `2px solid ${order.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: order.paymentStatus === 'Paid' ? '#047857' : '#B45309', fontSize: '0.95rem' }}>
            {order.paymentStatus === 'Paid' ? (
              <>
                <span>✅ Bank Transfer Verified & Paid</span>
                {order.bankTransferVerifiedBy && (
                  <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    (Confirmed by {order.bankTransferVerifiedBy})
                  </span>
                )}
              </>
            ) : (
              <>
                <span>⏳ Awaiting Bank Transfer Verification</span>
                <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  — Our finance team is confirming your transfer
                </span>
              </>
            )}
          </div>
          {order.paymentConfirmedAt && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Confirmed at {order.paymentConfirmedAt}
            </span>
          )}
        </div>

        {/* Status Milestone Timeline Tracker */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Current Status</span>
              <h3 style={{ margin: '0.2rem 0 0', fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{ORDER_STATUS_STEPS[currentStep]?.icon || '📦'}</span> {order.status}
              </h3>
            </div>

            {routeInfo && (
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(229, 138, 19, 0.1)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(229, 138, 19, 0.25)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED ROAD ETA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-500)' }}>~{routeInfo.durationMinutes} mins</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(229, 138, 19, 0.25)', paddingLeft: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROAD DISTANCE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{routeInfo.distanceKm} km</div>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', padding: '1rem 0' }}>
            {ORDER_STATUS_STEPS.map((s, idx) => {
              const isDone = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 85, position: 'relative' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--gold-500)' : isDone ? 'var(--status-success)' : 'var(--bg-surface)',
                      border: isDone ? 'none' : '2px solid var(--border-subtle)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(229,138,19,0.3)' : 'none',
                      zIndex: 2,
                      transition: 'all 0.3s'
                    }}
                  >
                    {isDone ? (isCurrent ? s.icon : '✓') : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</span>}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                      color: isCurrent ? 'var(--gold-500)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                      marginTop: '0.5rem',
                      textAlign: 'center'
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Map & Rider Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
          
          {/* Map Column */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 420, display: 'flex', flexDirection: 'column' }}>
            
            {/* Map Top Bar */}
            <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: isStale ? '#F59E0B' : '#10B981',
                    boxShadow: isStale ? 'none' : '0 0 10px #10B981'
                  }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                  {isStale ? `🟡 ${locationAgeText}` : `🟢 Live GPS Active · ${locationAgeText}`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  className={`btn ${mapType === 'roadmap' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem' }}
                  onClick={() => setMapType('roadmap')}
                >
                  Road Map
                </button>
                <button
                  className={`btn ${mapType === 'satellite' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem' }}
                  onClick={() => setMapType('satellite')}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative', minHeight: 360 }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

              {/* Stale Location Alert Banner */}
              {isStale && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    right: 12,
                    zIndex: 500,
                    background: 'rgba(254, 243, 199, 0.95)',
                    border: '1px solid #F59E0B',
                    color: '#92400E',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <AlertTriangle size={16} />
                  <div>Rider GPS signal currently paused. {locationAgeText}. Showing last verified location.</div>
                </div>
              )}

              {/* Route Error Banner */}
              {routeError && (
                <div
                  style={{
                    position: 'absolute',
                    top: isStale ? 60 : 12,
                    left: 12,
                    right: 12,
                    zIndex: 500,
                    background: '#FEF2F2',
                    border: '1px solid #EF4444',
                    color: '#991B1B',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 1rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <div>{routeError}</div>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderColor: '#DC2626', color: '#DC2626' }}
                    onClick={() => loadRouteGeometry(riderLoc.lat, riderLoc.lng, destLat, destLng, mapInstanceRef.current, true)}
                  >
                    Retry Route
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rider & Delivery Information Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Assigned Rider Card */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Assigned Delivery Rider
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <img
                  src={rider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={rider.name}
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-500)' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{rider.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gold-500)', fontWeight: 700 }}>
                    {rider.vehicle} · {rider.rating} ★
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Hub: {rider.hub || 'Ogun Central Dispatch'}
                  </div>
                </div>
              </div>

              <a
                href={`tel:${rider.phone}`}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}
              >
                <Phone size={16} /> Call Delivery Rider ({rider.phone})
              </a>
            </div>

            {/* Destination Address Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Delivery Destination (Ogun State)
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <MapPin size={18} style={{ color: 'var(--gold-500)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {order.deliveryAddress}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <strong>LGA:</strong> {order.lga || 'Abeokuta South'} · <strong>State:</strong> Ogun State
                  </div>
                  {order.latitude && order.longitude && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold-500)', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                      GPS: [{order.latitude}, {order.longitude}]
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Order Items ({order.items?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {order.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.quantity}x {item.name} {item.size ? `(${item.size})` : ''}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                {(() => {
                  const itemsSubtotal = (order.items || []).reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);
                  const giftFee = order.giftFee || 0;
                  let deliveryFee = order.fulfillmentType === 'pickup' ? 0 : (order.deliveryFee !== undefined ? order.deliveryFee : 1500);

                  if (order.total && itemsSubtotal + deliveryFee + giftFee !== order.total) {
                    if (order.total > itemsSubtotal + giftFee) {
                      deliveryFee = order.total - itemsSubtotal - giftFee;
                    }
                  }
                  const displayTotal = itemsSubtotal + deliveryFee + giftFee;

                  return (
                    <>
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span>Items Subtotal</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₦{itemsSubtotal.toLocaleString()}</span>
                      </div>
                      {giftFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <span>Gift Packaging</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₦{giftFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <span>Delivery Fee</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.fulfillmentType === 'pickup' || deliveryFee === 0 ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
                        </span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--text-primary)' }}>Total Amount Paid</span>
                        <span style={{ color: 'var(--gold-500)' }}>₦{displayTotal.toLocaleString()}</span>
                      </div>
                    </>
                  );
                })()}
                <button
                  onClick={() => printOrderReceipt(order)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                >
                  <Printer size={15} /> Download / Print Official Receipt
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Tracking Timeline Audit Log */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Complete Order Tracking History & Audit Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {(order.trackingHistory || []).map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-500)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{log.event}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{log.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-500)' }}>
                    Triggered by: <strong>{log.actor || 'System'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
