import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Bike, MapPin, Navigation, User, Clock, Phone, Shield, 
  CheckCircle2, AlertTriangle, Search, Filter, Calendar, 
  DollarSign, Package, ExternalLink, X, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { 
  fetchOSRMRoute, 
  formatLocationAge, 
  isLocationStale, 
  calculateHaversineDistance 
} from '../../utils/trackingRouting';

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

export default function AdminRiders() {
  const { riders, orders, updateRiderAvailability } = useOrders();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [hubFilter, setHubFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [historyTimeframe, setHistoryTimeframe] = useState('all'); // 'today', 'yesterday', 'week', 'month', 'all'
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all'); // 'all', 'active', 'completed'
  const [mapType, setMapType] = useState('roadmap');
  const [selectedRiderRoute, setSelectedRiderRoute] = useState(null);

  // Selected Rider object
  const selectedRider = useMemo(() => {
    return riders.find(r => r.id === selectedRiderId) || null;
  }, [riders, selectedRiderId]);

  // Orders assigned to selected rider (Single source of truth from OrderContext orders)
  const selectedRiderOrders = useMemo(() => {
    if (!selectedRider) return [];
    return orders.filter(o => 
      o.acceptedByRiderId === selectedRider.id || 
      o.assignedRider?.id === selectedRider.id
    );
  }, [orders, selectedRider]);

  // Active delivery for selected rider
  const selectedRiderActiveOrder = useMemo(() => {
    return selectedRiderOrders.find(o => 
      o.status !== 'Delivered' && 
      o.status !== 'Failed Delivery' && 
      o.status !== 'Cancelled'
    ) || null;
  }, [selectedRiderOrders]);

  // Filtered delivery history for selected rider
  const filteredRiderHistory = useMemo(() => {
    if (!selectedRiderOrders) return [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    return selectedRiderOrders.filter(o => {
      const orderDateIso = o.isoDate ? o.isoDate.split('T')[0] : todayStr;
      
      // Status Filter
      if (historyStatusFilter === 'active' && (o.status === 'Delivered' || o.status === 'Cancelled')) return false;
      if (historyStatusFilter === 'completed' && o.status !== 'Delivered') return false;

      // Timeframe Filter
      if (historyTimeframe === 'today' && orderDateIso !== todayStr) return false;
      if (historyTimeframe === 'yesterday' && orderDateIso !== yesterdayStr) return false;
      if (historyTimeframe === 'week' && new Date(orderDateIso) < startOfWeek) return false;
      
      return true;
    });
  }, [selectedRiderOrders, historyTimeframe, historyStatusFilter]);

  // Filtered Riders List
  const filteredRiders = useMemo(() => {
    return riders.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesHub = hubFilter === 'All' || r.hub === hubFilter;
      const matchesStatus = statusFilter === 'All' || r.availabilityStatus === statusFilter;

      return matchesSearch && matchesHub && matchesStatus;
    });
  }, [riders, searchQuery, hubFilter, statusFilter]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [7.1557, 3.3458], // Abeokuta, Ogun State
      zoom: 11,
      zoomControl: false
    });

    L.tileLayer(TILE_LAYERS[mapType].url, { maxZoom: 19 }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    const t1 = setTimeout(() => { if (map) map.invalidateSize(); }, 200);
    const t2 = setTimeout(() => { if (map) map.invalidateSize(); }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Rider Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const bounds = L.latLngBounds();

    filteredRiders.forEach(rdr => {
      const loc = rdr.currentLocation || rdr.initialLocation || { lat: 7.1450, lng: 3.3280 };
      const isStale = isLocationStale(loc.timestamp, 5);
      const isSelected = rdr.id === selectedRiderId;

      // Color code based on availability and stale status
      let badgeColor = '#10B981'; // Green (Online / Available)
      if (rdr.availabilityStatus === 'Busy') badgeColor = '#E58A13'; // Gold (Busy Delivering)
      if (rdr.availabilityStatus === 'Offline' || isStale) badgeColor = '#6B7280'; // Gray (Offline / Stale)

      const riderIcon = L.divIcon({
        className: 'admin-rider-map-pin',
        html: `
          <div style="
            position: relative;
            display: flex; align-items: center; justify-content: center;
            width: ${isSelected ? '44px' : '38px'};
            height: ${isSelected ? '44px' : '38px'};
            border-radius: 50%;
            background: ${badgeColor};
            border: ${isSelected ? '3px solid #E58A13' : '2px solid white'};
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            color: white; font-size: ${isSelected ? '20px' : '17px'};
            transition: all 0.2s;
          ">
            🛵
            ${isSelected ? `
              <div style="
                position: absolute; top: -6px; right: -6px;
                width: 14px; height: 14px; border-radius: 50%;
                background: #AD6208; border: 2px solid white;
              "></div>
            ` : ''}
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44]
      });

      const marker = L.marker([loc.lat, loc.lng], { icon: riderIcon })
        .bindPopup(`
          <div style="font-family: var(--font-sans); padding: 4px;">
            <strong style="font-size: 14px; color: #111827;">${rdr.name}</strong><br/>
            <span style="font-size: 11px; color: #6B7280;">ID: ${rdr.id} · ${rdr.vehicleType}</span><br/>
            <div style="margin-top: 4px; font-size: 12px; font-weight: 700; color: ${badgeColor};">
              ${rdr.availabilityStatus} · ${formatLocationAge(loc.timestamp)}
            </div>
          </div>
        `)
        .addTo(markersGroupRef.current);

      marker.on('click', () => {
        setSelectedRiderId(rdr.id);
      });

      bounds.extend([loc.lat, loc.lng]);
    });

    if (filteredRiders.length > 0 && mapInstanceRef.current && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [filteredRiders, selectedRiderId]);

  // 3. Render Active Delivery Route for Selected Rider
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedRiderActiveOrder || !selectedRider) {
      setSelectedRiderRoute(null);
      return;
    }

    const rLoc = selectedRider.currentLocation || selectedRider.initialLocation || { lat: 7.1450, lng: 3.3280 };
    const dLat = selectedRiderActiveOrder.latitude || 7.1557;
    const dLng = selectedRiderActiveOrder.longitude || 3.3458;

    fetchOSRMRoute(rLoc.lat, rLoc.lng, dLat, dLng).then(route => {
      if (!mapInstanceRef.current || !route) return;
      setSelectedRiderRoute(route);

      if (!route.isError && route.routeCoordinates && route.routeCoordinates.length > 0) {
        L.polyline(route.routeCoordinates, {
          color: '#E58A13',
          weight: 4,
          opacity: 0.9
        }).addTo(markersGroupRef.current);

        if (route.isDestinationOffRoad && route.snappedDestination) {
          L.polyline([route.snappedDestination, [dLat, dLng]], {
            color: '#6B7280',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.8
          }).addTo(markersGroupRef.current);
        }
      }
    });
  }, [selectedRiderActiveOrder, selectedRider]);

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

  const activeDeliveriesCount = orders.filter(o => o.acceptedByRiderId && o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  const onlineRidersCount = riders.filter(r => r.availabilityStatus !== 'Offline').length;
  const totalCompletedToday = riders.reduce((acc, r) => acc + (r.completedCount || 0), 0);

  return (
    <div style={{ padding: '1.5rem', background: 'var(--cream-50)', minHeight: '85vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bike size={26} color="var(--gold-600)" /> Rider Fleet & GPS Live Monitoring
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Real device GPS tracking, duty status management, active route inspection, and unified rider order history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${mapType === 'roadmap' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            onClick={() => setMapType('roadmap')}
          >
            Road Map
          </button>
          <button
            className={`btn ${mapType === 'satellite' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            onClick={() => setMapType('satellite')}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(229,138,19,0.12)', color: 'var(--text-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bike size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Registered Fleet</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>{riders.length} Riders</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.12)', color: 'var(--status-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Navigation size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Online / Active GPS</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-success)' }}>{onlineRidersCount} Online</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(59,130,246,0.12)', color: 'var(--status-info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>In-Flight Deliveries</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-info)' }}>{activeDeliveriesCount} Active</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(245,158,11,0.12)', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Completed</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>{totalCompletedToday} Completed</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Map + Rider Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Map Container */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: 460, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--gold-600)" /> Ogun State Rider Fleet Tracking Map
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Showing {filteredRiders.length} rider(s)</span>
          </div>

          <div style={{ flex: 1, position: 'relative', minHeight: 400 }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
          </div>
        </div>

        {/* Rider Directory & List */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', margin: 0, color: 'var(--charcoal-900)' }}>Rider Directory</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0.75rem' }}>Select a rider to inspect live GPS, active route, and order history.</p>

            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by name, ID, phone, vehicle..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.6rem 0.45rem 2.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--cream-300)',
                    fontSize: '0.82rem',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={hubFilter}
                  onChange={e => setHubFilter(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontSize: '0.78rem', background: 'var(--bg-surface)' }}
                >
                  <option value="All">All Hubs</option>
                  <option value="Abeokuta Central Hub">Abeokuta Central Hub</option>
                  <option value="Ado-Odo/Ota Logistics Hub">Ado-Odo/Ota Hub</option>
                  <option value="Ijebu-Ode Depot">Ijebu-Ode Depot</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontSize: '0.78rem', background: 'var(--bg-surface)' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Busy">Busy (On Delivery)</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rider List Items */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 360, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filteredRiders.map(rdr => {
              const isSelected = rdr.id === selectedRiderId;
              const rLoc = rdr.currentLocation || rdr.initialLocation || {};
              const isStale = isLocationStale(rLoc.timestamp, 5);

              // Find active order for this rider
              const activeOrd = orders.find(o => 
                (o.acceptedByRiderId === rdr.id || o.assignedRider?.id === rdr.id) &&
                o.status !== 'Delivered' && o.status !== 'Cancelled'
              );

              return (
                <div
                  key={rdr.id}
                  onClick={() => setSelectedRiderId(rdr.id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(229,138,19,0.06)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={rdr.avatar}
                      alt={rdr.name}
                      style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-400)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--charcoal-900)' }}>
                        {rdr.name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>({rdr.id})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        🛵 {rdr.vehicleType} · {rdr.hub}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isStale ? 'var(--status-warning)' : 'var(--status-success)', fontWeight: 700, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isStale ? '#F59E0B' : '#10B981' }} />
                        {isStale ? `Signal Paused (${formatLocationAge(rLoc.timestamp)})` : `Live GPS · ${formatLocationAge(rLoc.timestamp)}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: rdr.availabilityStatus === 'Available' ? 'rgba(16,185,129,0.12)' : rdr.availabilityStatus === 'Busy' ? 'rgba(229,138,19,0.12)' : 'rgba(107,114,128,0.12)',
                        color: rdr.availabilityStatus === 'Available' ? 'var(--status-success)' : rdr.availabilityStatus === 'Busy' ? 'var(--text-gold)' : 'var(--text-muted)'
                      }}
                    >
                      {rdr.availabilityStatus}
                    </span>
                    {activeOrd && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-gold)', marginTop: '0.4rem' }}>
                        Order #{activeOrd.id}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Rider Detail View & Unified Delivery History Modal/Section */}
      {selectedRider && (
        <div className="card" style={{ padding: '1.5rem', animation: 'fadeIn 0.25s ease-out' }}>
          
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={selectedRider.avatar}
                alt={selectedRider.name}
                style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold-500)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--charcoal-900)' }}>
                    {selectedRider.name}
                  </h2>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--gold-100)', color: 'var(--text-gold)' }}>
                    {selectedRider.id}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>📞 {selectedRider.phone}</span>
                  <span>📧 {selectedRider.email}</span>
                  <span>🛵 {selectedRider.vehicle}</span>
                  <span>🏢 {selectedRider.hub}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={selectedRider.availabilityStatus}
                onChange={e => updateRiderAvailability(selectedRider.id, e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-400)', fontWeight: 700, fontSize: '0.82rem', background: 'var(--bg-surface)', cursor: 'pointer' }}
              >
                <option value="Available">Set Duty: Available</option>
                <option value="Busy">Set Duty: Busy (On Delivery)</option>
                <option value="Offline">Set Duty: Offline</option>
                <option value="Break">Set Duty: On Break</option>
              </select>

              <button
                className="btn btn-outline"
                onClick={() => setSelectedRiderId(null)}
                style={{ padding: '0.45rem' }}
                title="Close Rider Inspection"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Rider Deep Information Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            
            {/* Live Device GPS Telemetry */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Navigation size={14} /> Device GPS Telemetry
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Latitude:</strong> {selectedRider.currentLocation?.lat || '7.1450'}° N</div>
                <div><strong>Longitude:</strong> {selectedRider.currentLocation?.lng || '3.3280'}° E</div>
                <div><strong>GPS Accuracy:</strong> ±{selectedRider.currentLocation?.accuracy || 8} meters</div>
                <div><strong>Heading / Speed:</strong> {selectedRider.currentLocation?.heading || 0}° / {selectedRider.currentLocation?.speed ? `${(selectedRider.currentLocation.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}</div>
                <div><strong>Last Update:</strong> {formatLocationAge(selectedRider.currentLocation?.timestamp)}</div>
              </div>
            </div>

            {/* Account & Emergency Contact */}
            <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={14} /> Verification & Emergency Contact
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div><strong>Driver License:</strong> {selectedRider.licenseNo}</div>
                <div><strong>Joined Date:</strong> {selectedRider.dateJoined}</div>
                <div><strong>Rating:</strong> ⭐ {selectedRider.rating} / 5.0</div>
                <div><strong>Emergency Contact:</strong> {selectedRider.emergencyContactName} ({selectedRider.emergencyContactPhone})</div>
                <div><strong>Account Status:</strong> <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{selectedRider.accountStatus}</span></div>
              </div>
            </div>

            {/* Active Delivery Summary */}
            <div style={{ padding: '1rem', background: selectedRiderActiveOrder ? 'rgba(229,138,19,0.08)' : 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: selectedRiderActiveOrder ? '1px solid var(--gold-400)' : '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-gold)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={14} /> Active Delivery Assignment
              </div>
              {selectedRiderActiveOrder ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div><strong>Order ID:</strong> #{selectedRiderActiveOrder.id}</div>
                  <div><strong>Customer:</strong> {selectedRiderActiveOrder.customerName}</div>
                  <div><strong>Address:</strong> {selectedRiderActiveOrder.deliveryAddress}</div>
                  <div><strong>Current Status:</strong> <span style={{ fontWeight: 800, color: 'var(--text-gold)' }}>{selectedRiderActiveOrder.status}</span></div>
                  {selectedRiderRoute && !selectedRiderRoute.isError && (
                    <div><strong>Road Distance:</strong> {selectedRiderRoute.distanceKm} km (~{selectedRiderRoute.durationMinutes} mins)</div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: '0.5rem' }}>
                  No active in-flight delivery assigned currently. Rider is available for dispatch.
                </div>
              )}
            </div>
          </div>

          {/* Unified Order History Section for Selected Rider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, color: 'var(--charcoal-900)' }}>
                  Delivery History & Activity Log for {selectedRider.name}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                  Sourced from unified order records (`#ORD-XXXX`). Shows all active and completed deliveries.
                </p>
              </div>

              {/* History Filters */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={historyStatusFilter}
                  onChange={e => setHistoryStatusFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontSize: '0.78rem', background: 'var(--bg-surface)' }}
                >
                  <option value="all">All Statuses ({selectedRiderOrders.length})</option>
                  <option value="active">Active In-Flight</option>
                  <option value="completed">Completed Deliveries</option>
                </select>

                <select
                  value={historyTimeframe}
                  onChange={e => setHistoryTimeframe(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontSize: '0.78rem', background: 'var(--bg-surface)' }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            {filteredRiderHistory.length > 0 ? (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--cream-100)', color: 'var(--charcoal-900)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Order ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Delivery Address</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Items</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Delivery Status</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiderHistory.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>
                          #{ord.id}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 700 }}>{ord.customerName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.customerPhone}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', maxWidth: 220 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ord.deliveryAddress}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LGA: {ord.lga || 'Abeokuta South'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {ord.items?.length || 0} item(s)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          {ord.date} at {ord.time}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: ord.paymentStatus === 'Paid' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: ord.paymentStatus === 'Paid' ? 'var(--status-success)' : 'var(--status-danger)' }}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: ord.status === 'Delivered' ? 'var(--status-success)' : 'var(--text-gold)' }}>
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-gold)' }}>
                          ₦{(ord.total || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <Package size={36} color="var(--cream-400)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No orders found for this filter criteria</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>Adjust the status or timeframe filter to view history.</div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
