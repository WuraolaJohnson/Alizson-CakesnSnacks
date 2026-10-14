import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Compass, MapPin, Navigation, RefreshCw, Filter, Layers, CheckCircle2, AlertTriangle, User 
} from 'lucide-react';
import { useOrders, ORDER_STATUS_STEPS, AVAILABLE_RIDERS } from '../../context/OrderContext';
import { OGUN_STATE_BOUNDARY, OGUN_STATE_CENTER } from '../../utils/ogunGeoValidation';
import { formatLocationAge, isLocationStale, fetchOSRMRoute } from '../../utils/trackingRouting';

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

export default function AdminFleetMap() {
  const { orders, updateOrderStatus, assignRiderToOrder } = useOrders();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [mapType, setMapType] = useState('roadmap');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const activeDeliveries = orders.filter(o => {
    if (statusFilter === 'Active') return o.status !== 'Delivered';
    if (statusFilter !== 'All') return o.status === statusFilter;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [OGUN_STATE_CENTER.lat, OGUN_STATE_CENTER.lng],
      zoom: 10,
      zoomControl: false
    });

    L.tileLayer(TILE_LAYERS[mapType].url, { maxZoom: 19 }).addTo(map);

    // Ogun Boundary Polygon Overlay
    L.polygon(OGUN_STATE_BOUNDARY, {
      color: '#E58A13',
      weight: 2,
      fillColor: '#E58A13',
      fillOpacity: 0.08,
      dashArray: '5, 5'
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Recalculate tile sizes when flexbox finishes layout
    const timer1 = setTimeout(() => { if (map) map.invalidateSize(); }, 150);
    const timer2 = setTimeout(() => { if (map) map.invalidateSize(); }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on Map when orders or filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    activeDeliveries.forEach(order => {
      const dLat = order.latitude || 7.1557;
      const dLng = order.longitude || 3.3458;
      const riderLoc = order.riderLocation || { lat: dLat - 0.015, lng: dLng - 0.015, timestamp: new Date().toISOString() };
      const rider = order.assignedRider || AVAILABLE_RIDERS[0];
      const isStale = isLocationStale(riderLoc.timestamp, 5);

      // Customer Pin
      const custIcon = L.divIcon({
        className: 'admin-cust-pin',
        html: `
          <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg, #AD6208, #8F4F06);
            border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center; color: white; font-size: 15px;
          ">
            🏠
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const custMarker = L.marker([dLat, dLng], { icon: custIcon })
        .bindPopup(`<b>Order #${order.id}</b><br/>Customer: ${order.customerName}<br/>Address: ${order.deliveryAddress}`)
        .addTo(markersGroupRef.current);

      custMarker.on('click', () => setSelectedOrder(order));

      // Rider Pin (if active delivery)
      if (order.status !== 'Delivered') {
        const riderIcon = L.divIcon({
          className: 'admin-rider-pin',
          html: `
            <div style="
              width: 38px; height: 38px; border-radius: 50%;
              background: ${isStale ? '#F59E0B' : '#10B981'};
              border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;
            ">
              🛵
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38]
        });

        const rMarker = L.marker([riderLoc.lat, riderLoc.lng], { icon: riderIcon })
          .bindPopup(`<b>${rider.name}</b><br/>Order #${order.id}<br/>Status: ${order.status}<br/>${formatLocationAge(riderLoc.timestamp)}`)
          .addTo(markersGroupRef.current);

        rMarker.on('click', () => setSelectedOrder(order));

        // Route Line via Road Network Engine
        fetchOSRMRoute(riderLoc.lat, riderLoc.lng, dLat, dLng).then(route => {
          if (!markersGroupRef.current || !route) return;

          if (!route.isError && route.routeCoordinates && route.routeCoordinates.length > 0) {
            // Main Drivable Road Route
            L.polyline(route.routeCoordinates, {
              color: isStale ? 'var(--status-warning)' : 'var(--status-success)',
              weight: 4,
              opacity: 0.85
            }).addTo(markersGroupRef.current);

            // If customer property is off-road, render property access connector
            if (route.isDestinationOffRoad && route.snappedDestination) {
              L.polyline([route.snappedDestination, [dLat, dLng]], {
                color: '#6B7280',
                weight: 2,
                dashArray: '3, 4',
                opacity: 0.8
              }).addTo(markersGroupRef.current);
            }
          }
        });
      }
    });

  }, [orders, statusFilter]);

  // Switch Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    L.tileLayer(TILE_LAYERS[mapType].url, { maxZoom: 19 }).addTo(mapInstanceRef.current);
  }, [mapType]);

  return (
    <div style={{ padding: '1.5rem', background: 'var(--cream-50)', minHeight: '85vh' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ background: 'var(--gold-action)', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
              Live Fleet Management
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ogun State Real-Time Map</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: 0 }}>
            Active Delivery Fleet & Route Monitor
          </h1>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem', width: 'auto', fontWeight: 600 }}
          >
            <option value="All">All Statuses ({orders.length})</option>
            <option value="Active">Active In-Flight Deliveries</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Nearby">Nearby</option>
            <option value="Delivered">Delivered</option>
          </select>

          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button
              className={`btn ${mapType === 'roadmap' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              onClick={() => setMapType('roadmap')}
            >
              Road Map
            </button>
            <button
              className={`btn ${mapType === 'satellite' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
              onClick={() => setMapType('satellite')}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Map Canvas */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', flex: 1, minHeight: 520 }} />
        </div>

        {/* Deliveries Sidebar & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--charcoal-900)' }}>
              Active Orders & Fleet Status ({activeDeliveries.length})
            </h3>

            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeDeliveries.map(ord => {
                const isStale = isLocationStale(ord.riderLocation?.timestamp, 5);
                const ageText = formatLocationAge(ord.riderLocation?.timestamp);

                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrder(ord);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([ord.latitude || 7.1557, ord.longitude || 3.3458], 13);
                      }
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: selectedOrder?.id === ord.id ? 'var(--gold-50)' : 'var(--cream-50)',
                      border: `1.5px solid ${selectedOrder?.id === ord.id ? 'var(--gold-500)' : 'var(--cream-200)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-gold)', fontFamily: 'var(--font-sans)' }}>{ord.id}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: ord.status === 'Delivered' ? 'var(--status-success)' : 'var(--text-gold)' }}>{ord.status}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--charcoal-900)', fontWeight: 600 }}>{ord.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {ord.deliveryAddress}</div>

                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--cream-200)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>🛵 {ord.assignedRider?.name || 'Unassigned'}</span>
                      <span style={{ color: isStale ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 700 }}>{ageText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Order Detailed Card */}
          {selectedOrder && (
            <div className="card" style={{ padding: '1.25rem', border: '2px solid var(--gold-500)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Fleet Dispatch Detail — Order #{selectedOrder.id}
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--charcoal-800)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})</div>
                <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
                <div><strong>LGA:</strong> {selectedOrder.lga || 'Abeokuta South'}, Ogun State</div>
                {selectedOrder.latitude && selectedOrder.longitude && (
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-gold)', fontSize: '0.78rem' }}>
                    GPS: [{selectedOrder.latitude}, {selectedOrder.longitude}]
                  </div>
                )}
                <div><strong>Rider:</strong> {selectedOrder.assignedRider?.name || 'None'} ({selectedOrder.assignedRider?.phone})</div>
                <div><strong>Rider GPS Status:</strong> {formatLocationAge(selectedOrder.riderLocation?.timestamp)}</div>
              </div>

              {/* Rider Re-assignment */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--cream-200)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Re-assign Rider:</label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                  value={selectedOrder.assignedRider?.id || ''}
                  onChange={(e) => assignRiderToOrder(selectedOrder.id, e.target.value)}
                >
                  {AVAILABLE_RIDERS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.vehicle})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
