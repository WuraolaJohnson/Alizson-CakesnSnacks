import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, Phone, MapPin, CheckCircle2, ShieldCheck, 
  AlertCircle, Play, Pause, RefreshCw, Key, ArrowRight, UserCheck, 
  ShieldAlert, User, Bike, DollarSign, Calendar, Clock, X, Check, Edit2, AlertTriangle,
  Ruler, Lock, Compass, Map as MapIcon, Layers, Package, ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import { useOrders, AVAILABLE_RIDERS } from '../context/OrderContext';
import { useApp } from '../context/AppContext';
import { calculateHaversineDistance, fetchOSRMRoute, formatLocationAge, isLocationStale, isRiderOffRoute } from '../utils/trackingRouting';
import { OGUN_DELIVERY_LOCATIONS } from '../data/ogunLocations';

/**
 * Service Area Validator for Ogun State Hub System
 */
function isServiceableLocation(order) {
  if (!order) return { serviceable: true };
  const addressLower = (order.deliveryAddress || '').toLowerCase();
  const stateLower = (order.state || '').toLowerCase();

  // If state is Lagos or address explicitly states Lagos State, flag as out of service area for Ogun riders
  if (stateLower.includes('lagos') || (addressLower.includes('lagos') && !addressLower.includes('ogun'))) {
    return {
      serviceable: false,
      reason: 'Destination is in Lagos State. Ogun State riders cannot accept out-of-service area deliveries.'
    };
  }
  return { serviceable: true };
}

export default function RiderPortal({ authRider }) {
  const { 
    orders, 
    riders, 
    updateRiderAvailability, 
    updateRiderProfile, 
    acceptRiderAssignment, 
    confirmCashPayment,
    rejectRiderAssignment, 
    reportDeliveryFailure, 
    updateOrderStatus, 
    updateRiderLocation, 
    verifyAndDeliverOrder
  } = useOrders();
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'active' | 'history' | 'profile' | 'earnings'
  
  // RIDER AUTHENTICATION & ISOLATION: Represents strictly ONE authenticated rider
  // authRider comes from the login (riders row linked to the account). Prefer
  // the live copy in the riders list when present so status changes show up.
  const activeRider = (riders || AVAILABLE_RIDERS).find(r => r.id === authRider.id) || authRider;

  const [activeDeliveryId, setActiveDeliveryId] = useState(null);
  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [watchId, setWatchId] = useState(null);

  // Modals
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueReason, setIssueReason] = useState('Customer Unreachable');
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [mapModalOrder, setMapModalOrder] = useState(null);

  // 1. Available Orders: Unaccepted orders ready for dispatch in service area
  const availableOrders = orders.filter(o => 
    (o.status === 'Ready for Dispatch' || o.status === 'Ready') &&
    !o.acceptedByRiderId &&
    o.assignmentState !== 'Accepted'
  );

  // 2. Active Orders: Orders ACCEPTED or in-progress strictly for the currently authenticated rider
  const activeOrders = orders.filter(o =>
    (o.acceptedByRiderId === activeRider.id || (o.assignedRider?.id === activeRider.id && o.assignmentState === 'Accepted')) &&
    o.status !== 'Delivered' && 
    o.status !== 'Failed Delivery' && 
    o.status !== 'Cancelled'
  );

  // 3. Delivery History: Completed, failed, or cancelled deliveries strictly for the authenticated rider
  const historyOrders = orders.filter(o => 
    (o.acceptedByRiderId === activeRider.id || o.assignedRider?.id === activeRider.id) &&
    (o.status === 'Delivered' || o.status === 'Failed Delivery' || o.status === 'Cancelled')
  );

  // Pending incoming assignments assigned to this rider waiting for rider response
  const pendingOrders = orders.filter(o =>
    o.assignedRider?.id === activeRider.id &&
    o.assignmentState !== 'Accepted' &&
    o.assignmentState !== 'Declined' &&
    o.status !== 'Delivered' &&
    o.status !== 'Failed Delivery' &&
    o.status !== 'Cancelled'
  );

  const activeOrder = orders.find(o => o.id === activeDeliveryId) || activeOrders[0] || null;

  // Single Active Delivery Enforcement Check
  const currentActiveDelivery = activeOrders.find(o => 
    o.status === 'Out for Delivery' || 
    o.status === 'Nearby' || 
    o.status === 'Picked Up'
  );

  // Geolocation Cleanup
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation?.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Auto Duty Status Management
  useEffect(() => {
    if (!activeRider) return;
    const hasActiveDelivery = isTrackingGps || activeOrders.some(o => o.status === 'Out for Delivery' || o.status === 'Nearby' || o.status === 'Picked Up');

    if (hasActiveDelivery) {
      if (activeRider.availabilityStatus !== 'Busy') {
        updateRiderAvailability(activeRider.id, 'Busy');
      }
    } else {
      if (activeRider.availabilityStatus === 'Busy') {
        updateRiderAvailability(activeRider.id, 'Available');
      }
    }
  }, [isTrackingGps, activeOrders, activeRider?.id, activeRider?.availabilityStatus]);

  // Accept Order Handler with Service Area & Active Delivery Limit Validation
  const handleAcceptOrder = (orderToAccept) => {
    // Duty Status Check
    if (activeRider.availabilityStatus === 'Offline' || activeRider.availabilityStatus === 'Break') {
      showToast(`You are currently ${activeRider.availabilityStatus}. Change duty status to Available to accept orders.`, 'warning');
      return;
    }

    // Service Area Validation
    const validation = isServiceableLocation(orderToAccept);
    if (!validation.serviceable) {
      showToast(`⚠️ Cannot accept order: ${validation.reason}`, 'error');
      return;
    }

    // Strict Single Active Order Limit Check
    if (activeOrders.length > 0) {
      const activeOrd = activeOrders[0];
      showToast(`⚠️ Single Active Order Policy: You already have active Order #${activeOrd.id}. Complete or deliver your current order before accepting another delivery.`, 'warning');
      return;
    }

    const success = acceptRiderAssignment(orderToAccept.id, activeRider.name, activeRider.id);
    if (success) {
      setActiveDeliveryId(orderToAccept.id);
      setActiveTab('active');
    }
  };

  // Start Delivery & Live Device GPS Lifecycle
  const handleStartDelivery = (targetOrder) => {
    if (!targetOrder) return;
    setActiveDeliveryId(targetOrder.id);
    setIsTrackingGps(true);
    setGpsError(null);

    if (targetOrder.status !== 'Out for Delivery' && targetOrder.status !== 'Nearby') {
      updateOrderStatus(targetOrder.id, 'Out for Delivery', activeRider.name);
    }

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          const timestamp = new Date(pos.timestamp || Date.now()).toISOString();
          
          setGpsError(null);
          updateRiderLocation(targetOrder.id, latitude, longitude, activeRider.name, activeRider.id, {
            accuracy: Math.round(accuracy || 0),
            heading: heading || 0,
            speed: speed || 0,
            timestamp
          });
        },
        (err) => {
          console.warn('Rider Geolocation Watch Warning:', err.message);
          let errorMsg = 'Waiting for a new GPS location...';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Location permission is required to provide live delivery tracking.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Please enable location services to continue live delivery tracking.';
          }
          setGpsError(errorMsg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
      setWatchId(id);
    } else {
      setGpsError('Please enable location services to continue live delivery tracking.');
    }

    showToast(`Started live GPS delivery tracking for Order #${targetOrder.id} 🛵`, 'success');
  };

  // Automatic GPS Termination
  const stopGpsTracking = () => {
    if (watchId !== null) {
      navigator.geolocation?.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTrackingGps(false);
  };

  // Confirm Delivery Handler
  const handleConfirmDelivery = (e) => {
    if (e) e.preventDefault();
    if (!activeOrder) return;

    const isPaid = activeOrder.paymentStatus === 'Paid' || activeOrder.adminPaymentOverride || activeOrder.cashPaymentConfirmedByRider;
    if (!isPaid) {
      showToast('⚠️ Delivery locked! Customer must complete payment or rider must confirm cash receipt.', 'error');
      return;
    }

    if (!enteredPin.trim()) {
      showToast('Please enter the 4-digit Customer Delivery PIN', 'warning');
      return;
    }

    const success = verifyAndDeliverOrder(activeOrder.id, enteredPin.trim(), activeRider.name);
    if (success) {
      stopGpsTracking(); // GPS tracking stops automatically on delivery completion
      setEnteredPin('');
      setActiveDeliveryId(null);
      showToast(`Order #${activeOrder.id} successfully delivered! GPS stream stopped.`, 'success');
    }
  };

  // Report Failure Handler
  const handleReportFailureSubmit = (e) => {
    e.preventDefault();
    if (!activeOrder) return;
    reportDeliveryFailure(activeOrder.id, activeRider.name, issueReason);
    setIssueModalOpen(false);
    stopGpsTracking(); // GPS tracking stops automatically on failed delivery
    setActiveDeliveryId(null);
  };

  return (
    <div style={{ background: 'var(--cream-50)', minHeight: '85vh', paddingBottom: '4rem' }}>
      
      {/* Rider Header Bar: Displays ONLY the currently authenticated rider */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E120B 0%, #2A1F18 100%)',
          color: 'white',
          padding: '1.25rem 0',
          borderBottom: '2px solid var(--gold-500)'
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Authenticated Rider Profile Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={activeRider.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={activeRider.name}
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-500)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>{activeRider.name}</span>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Rider ID: {activeRider.id}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--cream-300)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span>🏢 Hub: {activeRider.hub}</span>
                <span>🛵 {activeRider.vehicle}</span>
              </div>
            </div>
          </div>

          {/* Duty Status Selector for Authenticated Rider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid rgba(229,138,19,0.3)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--cream-300)', fontWeight: 600 }}>Duty Availability:</span>
              <select
                value={activeRider.availabilityStatus || 'Available'}
                disabled={activeOrders.length > 0} // Locked to BUSY if active delivery is in progress
                onChange={e => updateRiderAvailability(activeRider.id, e.target.value)}
                style={{
                  background: activeRider.availabilityStatus === 'Available' ? '#10B981' : activeRider.availabilityStatus === 'Busy' ? '#F59E0B' : '#EF4444',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  outline: 'none',
                  cursor: activeOrders.length > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="Available" style={{ background: '#111827', color: 'white' }}>🟢 Available</option>
                <option value="Busy" style={{ background: '#111827', color: 'white' }}>🟡 Busy (On Delivery)</option>
                <option value="Offline" style={{ background: '#111827', color: 'white' }}>🔴 Offline</option>
                <option value="Break" style={{ background: '#111827', color: 'white' }}>☕ On Break</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="container" style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('available')}
              style={{
                background: activeTab === 'available' ? 'var(--gold-500)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Package size={15} /> Available Orders ({availableOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              style={{
                background: activeTab === 'active' ? 'var(--gold-500)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Navigation size={15} /> Active Deliveries ({activeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? 'var(--gold-500)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Clock size={15} /> Delivery History ({historyOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                background: activeTab === 'profile' ? 'var(--gold-500)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <User size={15} /> Rider Profile & Vehicle
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              style={{
                background: activeTab === 'earnings' ? 'var(--gold-500)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1.1rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <DollarSign size={15} /> Performance & Earnings
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '1.75rem' }}>
        
        {/* TAB 1: AVAILABLE ORDERS */}
        {activeTab === 'available' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            {/* Available Orders List */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Available Ogun &amp; Hub Deliveries ({availableOrders.length})
              </h3>

              {activeOrders.length > 0 && (
                <div style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-300)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--gold-800)', fontSize: '0.825rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lock size={18} style={{ color: 'var(--gold-600)', flexShrink: 0 }} />
                  <span>
                    <strong>Single Active Order Enforced:</strong> You currently have an active delivery in progress (<strong>Order #{activeOrders[0].id}</strong>). You must deliver or resolve Order #{activeOrders[0].id} before accepting another assignment.
                  </span>
                </div>
              )}

              {availableOrders.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No Available Orders Right Now</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    New orders ready for dispatch from your hub will appear here automatically.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {availableOrders.map(ord => {
                    const isSelected = activeOrder?.id === ord.id;
                    const validation = isServiceableLocation(ord);
                    const hasActiveOrder = activeOrders.length > 0;
                    
                    const riderLat = activeRider.initialLocation?.lat || 7.1450;
                    const riderLng = activeRider.initialLocation?.lng || 3.3280;
                    const destLat = ord.latitude || 7.1557;
                    const destLng = ord.longitude || 3.3458;
                    const hubDistKm = calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
                    const estMins = Math.max(5, Math.round((hubDistKm * 1.3 / 30) * 60));

                    return (
                      <div
                        key={ord.id}
                        className="card"
                        style={{
                          padding: '1.25rem',
                          border: isSelected ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveDeliveryId(ord.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gold-500)', fontFamily: 'var(--font-sans)' }}>
                              Order #{ord.id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {ord.customerName} · {ord.customerPhone}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                            <span className="badge badge-gold" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                              Ready for Acceptance
                            </span>
                            {!validation.serviceable && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                                ⚠️ Out of Service Area
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer Address & Derived Location Validation */}
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <MapPin size={16} style={{ color: 'var(--gold-500)', flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div>{ord.deliveryAddress}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                              LGA: <strong>{ord.lga || 'Abeokuta South'}</strong> · State: <strong>{ord.state || 'Ogun State'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Distance from Hub vs Route Distance */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Ruler size={14} style={{ color: 'var(--gold-500)' }} />
                            <span>Distance from hub: {hubDistKm} km</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>From hub ETA: ~{estMins} mins</div>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', height: 'auto', gap: '0.25rem', borderColor: 'var(--gold-500)', color: 'var(--gold-500)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapModalOrder(ord);
                            }}
                          >
                            <MapIcon size={12} /> View Map
                          </button>
                        </div>

                        {/* Service Area Warning Callout if Invalid */}
                        {!validation.serviceable && (
                          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: '0.78rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                            <span>{validation.reason}</span>
                          </div>
                        )}

                        {/* Accept Delivery Action */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!validation.serviceable || hasActiveOrder}
                            style={{ flex: 1, justifyContent: 'center', opacity: (!validation.serviceable || hasActiveOrder) ? 0.6 : 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptOrder(ord);
                            }}
                          >
                            <Check size={14} /> {hasActiveOrder ? `🔒 Finish Order #${activeOrders[0].id} First` : (validation.serviceable ? 'Accept Delivery Assignment' : '⚠️ Cannot Accept (Out of Area)')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Order Route & Details Terminal Preview */}
            <div>
              {activeOrder ? (
                (() => {
                  const validation = isServiceableLocation(activeOrder);
                  const riderLat = activeRider.initialLocation?.lat || 7.1450;
                  const riderLng = activeRider.initialLocation?.lng || 3.3280;
                  const destLat = activeOrder.latitude || 7.1557;
                  const destLng = activeOrder.longitude || 3.3458;
                  const hubDistKm = calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
                  const estMins = Math.max(5, Math.round((hubDistKm * 1.3 / 30) * 60));

                  const isPaid = activeOrder.paymentStatus === 'Paid';

                  return (
                    <div className="card" style={{ padding: '1.75rem', border: '2px solid var(--gold-500)', background: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--gold-500)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Order Route & Destination Preview
                          </span>
                          <h3 style={{ margin: '0.2rem 0 0', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                            Order #{activeOrder.id}
                          </h3>
                        </div>
                        <span className={`badge ${isPaid ? 'badge-gold' : 'badge-danger'}`} style={{ fontSize: '0.78rem' }}>
                          {isPaid ? '🟢 Paid (Prepaid)' : '🟡 Pay on Delivery'}
                        </span>
                      </div>

                      {/* Embedded Interactive Distance Map */}
                      <EmbeddedRouteMap
                        activeRider={activeRider}
                        order={activeOrder}
                        onExpand={() => setMapModalOrder(activeOrder)}
                      />

                      {/* Route & Distance Metrics */}
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Compass size={16} style={{ color: 'var(--gold-500)' }} /> Hub & Destination Location Breakdown
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}>
                          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>HUB DISTANCE</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-500)', marginTop: '0.2rem' }}>
                              {hubDistKm} km
                            </div>
                          </div>
                          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>HUB ETA</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                              ~{estMins}m
                            </div>
                          </div>
                          <div style={{ background: 'var(--bg-card)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>TRIP FEE</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.2rem' }}>
                              ₦{(activeOrder.deliveryFee || 1500).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><strong>Assigned Hub Origin:</strong> {activeRider.hub}</div>
                          <div><strong>Customer Address:</strong> {activeOrder.deliveryAddress}</div>
                          <div><strong>Customer LGA / State:</strong> {activeOrder.lga || 'Abeokuta South'}, {activeOrder.state || 'Ogun State'}</div>
                        </div>
                      </div>

                      {/* Customer Details Box */}
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                          👤 Customer: {activeOrder.customerName} ({activeOrder.customerPhone})
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          Order Total: <strong>₦{(activeOrder.total || 0).toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Accept Action */}
                      <button
                        className="btn btn-primary btn-lg"
                        style={{ width: '100%', justifyContent: 'center', opacity: (!validation.serviceable || activeOrders.length > 0) ? 0.6 : 1 }}
                        disabled={!validation.serviceable || activeOrders.length > 0}
                        onClick={() => handleAcceptOrder(activeOrder)}
                      >
                        <Check size={18} /> {activeOrders.length > 0 ? `🔒 Finish Order #${activeOrders[0].id} First` : (validation.serviceable ? 'Accept Order & Open Terminal' : '⚠️ Cannot Accept (Out of Service Area)')}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Select an available delivery to inspect route and details</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERIES */}
        {activeTab === 'active' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>

            {/* Left Column: In-Progress Deliveries List */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Active In-Progress Deliveries ({activeOrders.length})
              </h3>

              {activeOrders.length === 0 ? (
                <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛵</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No Active Deliveries In Progress</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Accept an order from the Available Orders tab to begin an active delivery.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeOrders.map(ord => {
                    const isSelected = activeOrder?.id === ord.id;
                    const riderLat = ord.riderLocation?.lat || activeRider.initialLocation?.lat || 7.1450;
                    const riderLng = ord.riderLocation?.lng || activeRider.initialLocation?.lng || 3.3280;
                    const destLat = ord.latitude || 7.1557;
                    const destLng = ord.longitude || 3.3458;
                    const routeDistKm = calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
                    const routeEstMins = Math.max(2, Math.round((routeDistKm * 1.3 / 30) * 60));

                    const statusColor = ord.status === 'Out for Delivery' ? '#3B82F6'
                      : ord.status === 'Nearby' ? '#10B981'
                      : ord.status === 'Picked Up' ? '#F59E0B'
                      : 'var(--gold-500)';

                    return (
                      <div
                        key={ord.id}
                        className="card"
                        style={{
                          padding: '1.25rem',
                          border: isSelected ? '2px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                          background: isSelected ? 'var(--bg-surface)' : 'var(--bg-card)',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveDeliveryId(ord.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gold-500)', fontFamily: 'var(--font-sans)' }}>
                              Order #{ord.id}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {ord.customerName} · {ord.customerPhone}
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800,
                            padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)',
                            background: `${statusColor}18`, color: statusColor
                          }}>
                            {ord.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <MapPin size={16} style={{ color: 'var(--gold-500)', flexShrink: 0, marginTop: 2 }} />
                          <span>{ord.deliveryAddress}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <Ruler size={14} style={{ color: 'var(--gold-500)' }} />
                            <span>Current route distance: {routeDistKm} km</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>Current ETA: ~{routeEstMins} mins</div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); setActiveDeliveryId(ord.id); }}
                        >
                          Open Active Terminal
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Active Delivery Control Terminal */}
            <div>
              {activeOrder && activeOrders.some(o => o.id === activeOrder.id) ? (
                (() => {
                  const riderLat = activeOrder.riderLocation?.lat || activeRider.initialLocation?.lat || 7.1450;
                  const riderLng = activeOrder.riderLocation?.lng || activeRider.initialLocation?.lng || 3.3280;
                  const destLat = activeOrder.latitude || 7.1557;
                  const destLng = activeOrder.longitude || 3.3458;
                  
                  const hubDistKm = calculateHaversineDistance(activeRider.initialLocation?.lat || 7.1450, activeRider.initialLocation?.lng || 3.3280, destLat, destLng);
                  const routeDistKm = calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
                  const currentEtaMins = Math.max(2, Math.round((routeDistKm * 1.3 / 30) * 60));

                  const isPaid = activeOrder.paymentStatus === 'Paid' || activeOrder.adminPaymentOverride || activeOrder.cashPaymentConfirmedByRider;
                  const paymentBadge = isPaid ? (
                    <span className="badge" style={{ background: '#10B981', color: 'white', fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.6rem' }}>
                      🟢 Paid
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ fontSize: '0.78rem', fontWeight: 800, padding: '0.2rem 0.6rem' }}>
                      🟡 Unpaid (Pay on Delivery: Collect ₦{(activeOrder.total || 0).toLocaleString()})
                    </span>
                  );

                  return (
                    <div className="card" style={{ padding: '1.75rem', border: '2px solid var(--gold-500)' }}>
                      
                      {/* Terminal Header & GPS Status Indicator */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Active Delivery Terminal</span>
                          <h3 style={{ margin: '0.2rem 0 0', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                            Order #{activeOrder.id}
                          </h3>
                        </div>

                        {/* Automatic GPS Status Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                          <div
                            style={{
                              background: isTrackingGps ? 'var(--status-success-bg)' : 'var(--bg-surface)',
                              color: isTrackingGps ? 'var(--status-success)' : 'var(--text-muted)',
                              padding: '0.4rem 0.85rem',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isTrackingGps ? '#10B981' : '#6B7280' }} />
                            {isTrackingGps ? 'GPS Broadcast Active' : 'GPS Standing By'}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isTrackingGps ? `Last updated: ${formatLocationAge(activeOrder.riderLocation?.timestamp)}` : 'GPS will start on dispatch'}
                          </span>
                        </div>
                      </div>

                      {/* GPS Error Alert */}
                      {gpsError && (
                        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: '#991B1B', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span>{gpsError}</span>
                          </div>
                          <button className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleStartDelivery(activeOrder)}>
                            Retry GPS
                          </button>
                        </div>
                      )}

                      {/* Live Interactive Navigation Map */}
                      <EmbeddedRouteMap
                        activeRider={activeRider}
                        order={activeOrder}
                        onExpand={() => setMapModalOrder(activeOrder)}
                      />

                      {/* Route & Distance Metrics Card */}
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>DISTANCE TO CUSTOMER</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold-500)', marginTop: '0.2rem' }}>
                              {routeDistKm} km
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>(Distance from hub: {hubDistKm} km)</div>
                          </div>

                          <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED ETA</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                              ~{currentEtaMins} mins
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>(Prioritized to customer)</div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '1.15rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>👤 Customer: {activeOrder.customerName}</span>
                          {paymentBadge}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div><strong>Phone Contact:</strong> {activeOrder.customerPhone}</div>
                          <div><strong>Delivery Address:</strong> {activeOrder.deliveryAddress}</div>
                          <div><strong>LGA / District:</strong> {activeOrder.lga || 'Abeokuta South'}, Ogun State</div>
                          {activeOrder.specialInstructions && (
                            <div style={{ fontStyle: 'italic', color: 'var(--gold-500)', marginTop: '0.2rem' }}>
                              "Notes: {activeOrder.specialInstructions}"
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          <a
                            href={`tel:${activeOrder.customerPhone}`}
                            className="btn btn-secondary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: '0.825rem' }}
                          >
                            <Phone size={15} /> Call Customer
                          </a>
                          <button
                            className="btn btn-ghost"
                            style={{ color: 'var(--status-danger)', fontSize: '0.78rem' }}
                            onClick={() => setIssueModalOpen(true)}
                          >
                            <AlertTriangle size={14} /> Report Delivery Issue
                          </button>
                        </div>
                      </div>

                      {/* Step-by-Step Delivery Lifecycle Controls */}
                      <div style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <RefreshCw size={14} style={{ color: 'var(--gold-500)' }} /> Step-by-step Delivery Progress
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {activeOrder.status === 'Picked Up' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-lg"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => handleStartDelivery(activeOrder)}
                            >
                              <Play size={18} /> Start Delivery &amp; Enable GPS Tracking
                            </button>
                          )}

                          {activeOrder.status === 'Out for Delivery' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-lg"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => updateOrderStatus(activeOrder.id, 'Nearby', activeRider.name)}
                            >
                              📍 I've Arrived at Customer Destination
                            </button>
                          )}

                          {activeOrder.status === 'Nearby' && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>
                              📍 Arrived at Customer Location! Complete payment &amp; PIN handover below.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pay on Delivery Handling & Cash Collection */}
                      {isPaid ? (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem 1rem',
                          marginBottom: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontWeight: 700, fontSize: '0.875rem' }}>
                            <CheckCircle2 size={18} />
                            <span>Paid — Collect Customer PIN Below For Handover</span>
                          </div>
                          <span style={{
                            background: '#10B981',
                            color: '#fff',
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em'
                          }}>
                            PAID
                          </span>
                        </div>
                      ) : (
                        <div style={{ background: 'var(--bg-surface)', border: '2px dashed #F59E0B', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AlertTriangle size={18} />
                              AWAITING PAYMENT / CASH COLLECTION
                            </div>
                            {paymentBadge}
                          </div>

                          <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                              Collect <strong>₦{(activeOrder.total || 0).toLocaleString()}</strong> in cash from customer or show payment link to complete via phone.
                            </p>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, justifyContent: 'center', fontWeight: 800 }}
                                onClick={() => confirmCashPayment(activeOrder.id, activeRider.name)}
                              >
                                💵 Confirm Cash Payment Received
                              </button>

                              <button
                                type="button"
                                className="btn btn-gold btn-sm"
                                style={{ justifyContent: 'center', fontWeight: 800 }}
                                onClick={() => {
                                  const payUrl = `${window.location.origin}${window.location.pathname}?view=pay-order&orderId=${activeOrder.id}`;
                                  navigator.clipboard.writeText(payUrl);
                                  showToast('Customer Payment Link copied! 📋', 'success');
                                  window.open(payUrl, '_blank');
                                }}
                              >
                                <ExternalLink size={14} /> Open Link
                              </button>

                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delivery Verification PIN Form */}
                      <form onSubmit={handleConfirmDelivery} style={{ background: 'var(--bg-surface)', border: `2px dashed ${isPaid ? 'var(--gold-500)' : 'var(--cream-300)'}`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', opacity: isPaid ? 1 : 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: isPaid ? 'var(--gold-500)' : 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          <Key size={18} /> Confirm Delivery Handover with Customer PIN
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                          {isPaid 
                            ? 'Ask customer for their 4-digit Security PIN shown on their order tracking screen to finalize delivery.'
                            : '⚠️ Handover Locked: Complete payment or cash confirmation above before entering PIN.'
                          }
                        </p>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <input
                            type="text"
                            maxLength={4}
                            className="form-input"
                            placeholder={isPaid ? "Enter 4-Digit Customer PIN" : "Awaiting Payment..."}
                            disabled={!isPaid}
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                            style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em', fontWeight: 800 }}
                          />
                        </div>

                        <button
                          type="submit"
                          className={`btn ${isPaid ? 'btn-primary' : 'btn-outline'} btn-lg`}
                          style={{ width: '100%', justifyContent: 'center' }}
                          disabled={!isPaid}
                        >
                          <CheckCircle2 size={18} /> {isPaid ? 'Verify PIN & Complete Delivery' : '🔒 Locked (Awaiting Payment)'}
                        </button>

                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => setEnteredPin(activeOrder.deliveryPin || '1234')}
                            style={{ background: 'none', border: 'none', color: 'var(--gold-500)', fontSize: '0.72rem', cursor: 'pointer', marginTop: '0.5rem', width: '100%', textDecoration: 'underline' }}
                          >
                            (Demo Shortcut: Autofill Customer PIN: {activeOrder.deliveryPin})
                          </button>
                        )}
                      </form>

                    </div>
                  );
                })()
              ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚀</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                    {activeOrders.length > 0 ? 'Click an active delivery on the left to open its terminal' : 'No active deliveries in progress right now'}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: RIDER PROFILE & VEHICLE */}
        {activeTab === 'profile' && (
          <RiderProfileTab
            rider={activeRider}
            onOpenEdit={() => setEditProfileModalOpen(true)}
            onUpdateAvailability={(val) => updateRiderAvailability(activeRider.id, val)}
          />
        )}

        {/* TAB 4: PERFORMANCE & EARNINGS */}
        {activeTab === 'earnings' && (
          <RiderEarningsTab
            rider={activeRider}
            assignedOrders={activeOrders}
            completedOrders={historyOrders.filter(o => o.status === 'Delivered')}
          />
        )}

        {/* TAB 5: DELIVERY HISTORY */}
        {activeTab === 'history' && (
          <RiderHistoryTab
            historyOrders={historyOrders}
            rider={activeRider}
          />
        )}
      </div>

      {/* Report Issue / Failed Delivery Modal */}
      {issueModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setIssueModalOpen(false)}
        >
          <div
            className="card"
            style={{ padding: '2rem', width: '100%', maxWidth: 440, background: 'var(--bg-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
                ⚠️ Report Delivery Exception
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIssueModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportFailureSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Reason for Exception / Failure *
                </label>
                <select
                  className="form-select"
                  value={issueReason}
                  onChange={e => setIssueReason(e.target.value)}
                >
                  <option value="Customer Unreachable">Customer Unreachable / Phone Off</option>
                  <option value="Incorrect Delivery Address">Incorrect Delivery Address</option>
                  <option value="Customer Cancelled / Refused Handover">Customer Cancelled / Refused Handover</option>
                  <option value="Refused Cash Payment">Refused Pay-on-Delivery Payment</option>
                  <option value="Severe Weather / Flooding">Severe Weather / Flooding</option>
                  <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                  <option value="GPS Signal Failure">GPS / Signal Failure</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIssueModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}>
                  Submit Failure Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfileModalOpen && (
        <EditRiderProfileModal
          rider={activeRider}
          isOpen={editProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          onSave={(updated) => updateRiderProfile(activeRider.id, updated)}
        />
      )}

      {/* Interactive Distance & Route Map Modal */}
      {mapModalOrder && (
        <RiderRouteMapModal
          order={mapModalOrder}
          activeRider={activeRider}
          onClose={() => setMapModalOrder(null)}
        />
      )}
    </div>
  );
}

const RiderProfileTab = ({ rider, onOpenEdit, onUpdateAvailability }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
          Authenticated Rider Profile Details 🪪
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Official logistics dispatch identity, vehicle registration, and emergency contacts.
        </p>
      </div>
      <button className="btn btn-outline" onClick={onOpenEdit}>
        <Edit2 size={16} /> Edit Profile Info
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
      
      {/* Personal Info Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} style={{ color: 'var(--gold-500)' }} /> Personal &amp; Account Information
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div><strong>Full Name:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{rider.name}</span></div>
          <div><strong>Rider ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--gold-500)', fontWeight: 800 }}>{rider.id}</span></div>
          <div><strong>Email Address:</strong> {rider.email || 'rider@alizson.com'}</div>
          <div><strong>Phone Number:</strong> {rider.phone}</div>
          <div><strong>Date Joined:</strong> {rider.dateJoined || 'January 15, 2025'}</div>
          <div>
            <strong>Account Status:</strong>{' '}
            <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
              {rider.accountStatus || 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicle & Logistics Card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bike size={18} style={{ color: 'var(--gold-500)' }} /> Dispatch Vehicle &amp; Emergency
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <div><strong>Vehicle Description:</strong> {rider.vehicle}</div>
          <div><strong>Vehicle Type:</strong> {rider.vehicleType || 'Motorcycle'}</div>
          <div><strong>License Registration:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{rider.licenseNo || 'OG-DRV-882091'}</span></div>
          <div><strong>Assigned Dispatch Hub:</strong> {rider.hub}</div>
          <div><strong>Emergency Contact:</strong> {rider.emergencyContactName || 'Family Member'}</div>
          <div><strong>Emergency Phone:</strong> {rider.emergencyContactPhone || rider.phone}</div>
        </div>
      </div>

    </div>
  </div>
);

const RiderEarningsTab = ({ rider, assignedOrders, completedOrders }) => {
  const totalEarned = (completedOrders.length * 1500) + (rider.todayEarnings || 7500);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
          Rider Performance &amp; Allowances 💰
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Track completed deliveries, customer ratings, and dispatch allowances for {rider.name}.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>🛵</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold-500)' }}>{completedOrders.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Deliveries</div>
        </div>

        <div className="card" style={{ padding: '1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>⭐</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold-500)' }}>{rider.rating || 4.9}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customer Rating Score</div>
        </div>

        <div className="card" style={{ padding: '1.35rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>💵</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--status-success)' }}>₦{totalEarned.toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Allowance &amp; Earnings</div>
        </div>
      </div>
    </div>
  );
};

const EditRiderProfileModal = ({ rider, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: rider.name || '',
    phone: rider.phone || '',
    vehicle: rider.vehicle || '',
    licenseNo: rider.licenseNo || '',
    emergencyContactName: rider.emergencyContactName || '',
    emergencyContactPhone: rider.emergencyContactPhone || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: '2rem', width: '100%', maxWidth: 460, background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
            ✏️ Edit Rider Profile &amp; Vehicle
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Full Name *
            </label>
            <input
              className="form-input"
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Phone Contact *
            </label>
            <input
              className="form-input"
              required
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Vehicle Description *
            </label>
            <input
              className="form-input"
              required
              value={form.vehicle}
              onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Driver License No.
            </label>
            <input
              className="form-input"
              value={form.licenseNo}
              onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Emergency Contact Name
              </label>
              <input
                className="form-input"
                value={form.emergencyContactName}
                onChange={e => setForm(p => ({ ...p, emergencyContactName: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Emergency Phone
              </label>
              <input
                className="form-input"
                value={form.emergencyContactPhone}
                onChange={e => setForm(p => ({ ...p, emergencyContactPhone: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmbeddedRouteMap = ({ activeRider, order, onExpand }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const riderLat = activeRider.currentLocation?.lat || activeRider.initialLocation?.lat || 7.1450;
  const riderLng = activeRider.currentLocation?.lng || activeRider.initialLocation?.lng || 3.3280;
  const destLat = order.latitude || 7.1557;
  const destLng = order.longitude || 3.3458;
  const distKm = routeInfo?.distanceKm || calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
  const estMins = routeInfo?.durationMinutes || Math.max(2, Math.round((distKm * 1.3 / 30) * 60));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [(riderLat + destLat) / 2, (riderLng + destLng) / 2],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const riderMarkerIcon = L.divIcon({
      className: 'rider-marker-pill',
      html: `
        <div style="
          background: #111827; color: #10B981; border: 2px solid #10B981;
          border-radius: 20px; padding: 2px 7px; font-weight: 800; font-size: 11px;
          white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex; align-items: center; gap: 4px;
        ">
          🛵 YOU / RIDER
        </div>
      `,
      iconSize: [100, 24],
      iconAnchor: [50, 12]
    });

    const destIcon = L.divIcon({
      className: 'dest-marker-pill',
      html: `
        <div style="
          background: #E58A13; color: white; border: 2px solid white;
          border-radius: 20px; padding: 2px 7px; font-weight: 800; font-size: 11px;
          white-space: nowrap; box-shadow: 0 4px 12px rgba(229,138,19,0.5);
          display: flex; align-items: center; gap: 4px;
        ">
          📍 CUSTOMER
        </div>
      `,
      iconSize: [90, 24],
      iconAnchor: [45, 12]
    });

    L.marker([riderLat, riderLng], { icon: riderMarkerIcon }).addTo(map);
    L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

    const bounds = L.latLngBounds([[riderLat, riderLng], [destLat, destLng]]);
    map.fitBounds(bounds, { padding: [35, 35] });

    mapInstanceRef.current = map;

    // Fetch real driving route from OSRM engine
    fetchOSRMRoute(riderLat, riderLng, destLat, destLng).then(route => {
      if (!mapInstanceRef.current || !route) return;
      
      if (route.isError) {
        setRouteError(route.error || 'Unable to calculate a road route for this location.');
        return;
      }

      setRouteError(null);
      setRouteInfo(route);

      // Solid polyline following connected road network
      L.polyline(route.routeCoordinates, {
        color: '#E58A13',
        weight: 4,
        opacity: 0.95
      }).addTo(mapInstanceRef.current);

      // Property access walkway connector if off-road
      if (route.isDestinationOffRoad && route.snappedDestination) {
        L.polyline([route.snappedDestination, [destLat, destLng]], {
          color: '#6B7280',
          weight: 2.5,
          dashArray: '3, 4',
          opacity: 0.85
        }).addTo(mapInstanceRef.current);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [riderLat, riderLng, destLat, destLng, order.id]);

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: 210, zIndex: 1 }} />
      
      {/* Map Overlay Badge */}
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 500,
        background: 'rgba(30, 18, 11, 0.9)', backdropFilter: 'blur(4px)',
        color: 'white', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)',
        fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(229,138,19,0.4)',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        {routeError ? (
          <span style={{ color: '#EF4444' }}>⚠️ {routeError}</span>
        ) : (
          <>
            <span>📏 Route to Customer: <strong style={{ color: 'var(--gold-500)' }}>{distKm} km</strong></span>
            <span>⏱️ <strong>~{estMins}m</strong></span>
          </>
        )}
      </div>

      {/* Expand Button */}
      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          style={{
            position: 'absolute', bottom: 10, right: 10, zIndex: 500,
            background: 'var(--gold-500)', color: 'white', border: 'none',
            padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem'
          }}
        >
          <MapIcon size={13} /> View Full Map
        </button>
      )}
    </div>
  );
};

const RiderRouteMapModal = ({ order, activeRider, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapType, setMapType] = useState('roadmap');
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const riderLat = activeRider.currentLocation?.lat || activeRider.initialLocation?.lat || 7.1450;
  const riderLng = activeRider.currentLocation?.lng || activeRider.initialLocation?.lng || 3.3280;
  const destLat = order.latitude || 7.1557;
  const destLng = order.longitude || 3.3458;
  const distKm = routeInfo?.distanceKm || calculateHaversineDistance(riderLat, riderLng, destLat, destLng);
  const estMins = routeInfo?.durationMinutes || Math.max(2, Math.round((distKm * 1.3 / 30) * 60));

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [(riderLat + destLat) / 2, (riderLng + destLng) / 2],
      zoom: 13,
      zoomControl: true
    });

    const tileUrl = mapType === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    const riderIcon = L.divIcon({
      className: 'rider-marker-lg',
      html: `
        <div style="
          background: #111827; color: #10B981; border: 3px solid #10B981;
          border-radius: 20px; padding: 5px 12px; font-weight: 800; font-size: 12px;
          white-space: nowrap; box-shadow: 0 6px 16px rgba(0,0,0,0.4);
          display: flex; align-items: center; gap: 5px;
        ">
          🛵 RIDER LOCATION (${activeRider.name})
        </div>
      `,
      iconSize: [210, 30],
      iconAnchor: [105, 15]
    });

    const destIcon = L.divIcon({
      className: 'dest-marker-lg',
      html: `
        <div style="
          background: #E58A13; color: white; border: 3px solid white;
          border-radius: 20px; padding: 5px 12px; font-weight: 800; font-size: 12px;
          white-space: nowrap; box-shadow: 0 6px 16px rgba(229,138,19,0.5);
          display: flex; align-items: center; gap: 5px;
        ">
          📍 DESTINATION: ${order.customerName}
        </div>
      `,
      iconSize: [200, 30],
      iconAnchor: [100, 15]
    });

    L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
    L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

    const bounds = L.latLngBounds([[riderLat, riderLng], [destLat, destLng]]);
    map.fitBounds(bounds, { padding: [50, 50] });

    mapInstanceRef.current = map;

    // Fetch OSRM Road Route
    fetchOSRMRoute(riderLat, riderLng, destLat, destLng).then(route => {
      if (!mapInstanceRef.current || !route) return;

      if (route.isError) {
        setRouteError(route.error || 'Unable to calculate a road route for this location.');
        return;
      }

      setRouteError(null);
      setRouteInfo(route);

      const coords = route.routeCoordinates;
      L.polyline(coords, {
        color: '#E58A13',
        weight: 5,
        opacity: 0.95
      }).addTo(mapInstanceRef.current);

      if (route.isDestinationOffRoad && route.snappedDestination) {
        L.polyline([route.snappedDestination, [destLat, destLng]], {
          color: '#6B7280',
          weight: 2.5,
          dashArray: '4, 4',
          opacity: 0.85
        }).addTo(mapInstanceRef.current);
      }

      if (coords && coords.length > 1) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [riderLat, riderLng, destLat, destLng, mapType, order.id]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ padding: '1.75rem', width: '100%', maxWidth: 820, background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Full Interactive Navigation Map
            </div>
            <h3 style={{ margin: '0.1rem 0 0', fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              Order #{order.id} Route Navigation
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setMapType(m => m === 'roadmap' ? 'satellite' : 'roadmap')}
            >
              <Layers size={14} /> {mapType === 'roadmap' ? 'Satellite View' : 'Roadmap View'}
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose}>
              <X size={22} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem' }}>📏 Current Route Distance: <strong style={{ color: 'var(--gold-500)', fontSize: '1.1rem' }}>{distKm} km</strong></div>
          <div style={{ fontSize: '0.9rem' }}>⏱️ Est. Driving ETA: <strong>~{estMins} mins</strong></div>
          <div style={{ fontSize: '0.9rem' }}>💵 Delivery Allowance: <strong style={{ color: 'var(--status-success)', fontSize: '1.05rem' }}>₦{(order.deliveryFee || 1500).toLocaleString()}</strong></div>
        </div>

        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: 440, zIndex: 1 }} />
          {routeError && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                right: 12,
                zIndex: 500,
                background: '#FEF2F2',
                border: '1px solid #EF4444',
                color: '#991B1B',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                backdropFilter: 'blur(4px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#DC2626" />
                <div>{routeError}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>🏢 <strong>Assigned Hub Origin:</strong> {activeRider.hub}</div>
          <div>📍 <strong>Delivery Address:</strong> {order.deliveryAddress} (LGA: {order.lga || 'Abeokuta South'})</div>
        </div>
      </div>
    </div>
  );
};

const RiderHistoryTab = ({ historyOrders, rider }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuditOrder, setSelectedAuditOrder] = useState(null);

  const filteredHistory = historyOrders.filter(ord => {
    const matchesStatus = filterStatus === 'all' || ord.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      ord.id.toLowerCase().includes(searchLower) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(searchLower)) ||
      (ord.deliveryAddress && ord.deliveryAddress.toLowerCase().includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  const totalDelivered = historyOrders.filter(o => o.status === 'Delivered').length;
  const totalEarned = historyOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.deliveryFee || 1500), 0);
  const totalFailed = historyOrders.filter(o => o.status === 'Failed Delivery' || o.status === 'Cancelled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>
            Rider Delivery History &amp; Audit Trail 📜
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Complete historical log of fulfilled deliveries and dispatch history for {rider.name}.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '1.8rem' }}>🎉</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>{totalDelivered}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Deliveries</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', borderLeft: '4px solid var(--gold-500)' }}>
          <div style={{ fontSize: '1.8rem' }}>💰</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-500)', margin: '0.2rem 0' }}>₦{totalEarned.toLocaleString()}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trip Allowances Earned</div>
        </div>

        <div className="card" style={{ padding: '1.25rem', textAlign: 'center', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '1.8rem' }}>⚠️</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0' }}>{totalFailed}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Failed / Exception Trips</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="input"
            placeholder="Search history by Order ID, customer, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'Delivered', 'Failed Delivery'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`btn btn-sm ${filterStatus === status ? 'btn-gold' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              {status === 'all' ? 'All History' : status}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📂</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>No Delivery History Found</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {searchTerm || filterStatus !== 'all' ? 'No orders match your filter criteria.' : 'Completed and fulfilled orders for this rider will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredHistory.map(ord => {
            const isDelivered = ord.status === 'Delivered';
            return (
              <div key={ord.id} className="card" style={{ padding: '1.25rem', borderLeft: `5px solid ${isDelivered ? '#10B981' : '#EF4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Order #{ord.id}</span>
                      <span className={`badge ${isDelivered ? 'badge-gold' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {isDelivered ? '🎉 Delivered & PIN Verified' : '⚠️ Failed Delivery'}
                      </span>
                      <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                        {ord.store === 'bakery' ? '🧁 Bakery' : '📦 Supplies'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div>👤 <strong>Customer:</strong> {ord.customerName} ({ord.customerPhone})</div>
                      <div>📍 <strong>Destination:</strong> {ord.deliveryAddress}</div>
                      {ord.deliveryPin && (
                        <div>🔐 <strong>Customer Delivery PIN:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10B981' }}>{ord.deliveryPin}</span></div>
                      )}
                      {ord.failureReason && (
                        <div style={{ color: '#EF4444' }}>⚠️ <strong>Failure Note:</strong> {ord.failureReason}</div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-500)' }}>
                      +₦{(ord.deliveryFee || 1500).toLocaleString()}
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => setSelectedAuditOrder(ord)}
                    >
                      📜 View Audit Log
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Log Modal */}
      {selectedAuditOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                Delivery Audit Trail #{selectedAuditOrder.id}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAuditOrder(null)}>✕</button>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <div><strong>Customer:</strong> {selectedAuditOrder.customerName}</div>
              <div><strong>Delivery Fee:</strong> ₦{(selectedAuditOrder.deliveryFee || 1500).toLocaleString()}</div>
              <div><strong>Assigned Hub:</strong> {rider.hub}</div>
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Audit Timeline Events:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(selectedAuditOrder.trackingHistory || []).map((ev, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold-500)', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ev.event}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    🕒 {ev.timestamp} | Actor: {ev.actor || 'System'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedAuditOrder(null)}>Close Audit Log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
