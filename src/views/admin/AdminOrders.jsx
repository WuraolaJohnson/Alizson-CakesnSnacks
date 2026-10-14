import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Search, Filter, Eye, Printer, CheckCircle2,
  Clock, MapPin, Phone, Mail, X, Cake, Package, Download, Truck, Building2
} from 'lucide-react';
import { useOrders, ORDER_STATUS_STEPS, VALID_TRANSITIONS } from '../../context/OrderContext';
import { StatusBadge } from '../../components/Common/StatusBadge';
import DeliveryPricesModal from '../../components/Admin/DeliveryPricesModal';
import SalesExportModal from '../../components/Admin/SalesExportModal';
import StoreBankSettingsModal from '../../components/Admin/StoreBankSettingsModal';

const AdminOrders = ({ setActiveTab, initialStoreFilter = 'all' }) => {
  const { orders, updateOrderStatus, assignRiderToOrder, riders, confirmBankTransferPayment } = useOrders();

  const [storeFilter, setStoreFilter] = useState(initialStoreFilter); // 'all', 'bakery', 'supplies'

  useEffect(() => {
    setStoreFilter(initialStoreFilter);
  }, [initialStoreFilter]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isSalesExportModalOpen, setIsSalesExportModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesStore = storeFilter === 'all' || order.store === storeFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter || (statusFilter === 'Ready for Dispatch' && (order.status === 'Ready' || order.statusStep === 2));
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStore && matchesStatus && matchesSearch;
  });

  const exportSalesSpreadsheet = () => {
    const headers = [
      'Order Date',
      'Time',
      'Order ID',
      'Store Category',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Delivery LGA',
      'Item Name',
      'Item Category',
      'Quantity',
      'Unit Price (NGN)',
      'Line Total (NGN)',
      'Order Total (NGN)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status'
    ];

    const rows = [];
    filteredOrders.forEach(order => {
      const storeType = order.store === 'bakery' ? 'Bakery & Confectionery' : 'Baking Supplies';
      const items = order.items && order.items.length > 0 ? order.items : [{ name: 'Custom Order', category: 'General', quantity: 1, unitPrice: order.total || 0 }];
      
      items.forEach(item => {
        const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
        rows.push([
          `"${order.date || ''}"`,
          `"${order.time || ''}"`,
          `"${order.id}"`,
          `"${storeType}"`,
          `"${(order.customerName || '').replace(/"/g, '""')}"`,
          `"${(order.customerEmail || '').replace(/"/g, '""')}"`,
          `"${(order.customerPhone || '').replace(/"/g, '""')}"`,
          `"${(order.lga || 'Abeokuta South').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.category || storeType).replace(/"/g, '""')}"`,
          item.quantity || 1,
          item.unitPrice || 0,
          lineTotal,
          order.total || 0,
          `"${order.paymentMethod || 'Online Payment'}"`,
          `"${order.paymentStatus || 'Paid'}"`,
          `"${order.status}"`
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Alizson_Sales_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0 }}>
            Orders & Fulfillment Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Process cake baking workflows, dispatch supplies, and update customer order states.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setIsDeliveryModalOpen(true)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <Truck size={16} /> Manage Delivery Prices
          </button>
          <button
            onClick={() => setIsSalesExportModalOpen(true)}
            className="btn btn-gold"
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
          >
            <Download size={16} /> Download Sales Spreadsheet (CSV)
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--charcoal-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by Order ID (ALZ-BAK-...), customer name, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem 0.6rem 2.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--charcoal-500)" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--cream-300)',
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="Order Confirmed">Order Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready for Dispatch">Ready for Dispatch</option>
            <option value="Picked Up">Picked Up</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Nearby">Nearby</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--cream-100)', borderBottom: '1px solid var(--cream-200)', color: 'var(--charcoal-700)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Order ID & Date</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Customer</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Store & Items</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Amount</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Assigned Rider</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Quick Update</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--cream-100)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--charcoal-900)' }}>{order.id}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.date} · {order.time}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--charcoal-900)' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.customerPhone}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span className={`badge ${order.store === 'bakery' ? 'badge-gold' : 'badge-burgundy'}`} style={{ fontSize: '0.68rem' }}>
                          {order.store === 'bakery' ? '🍰 Bakery' : '🧁 Supplies'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--charcoal-600)' }}>
                          {order.items?.length || 1} item(s)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--charcoal-700)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.items?.map(i => i.name).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-gold)' }}>
                        ₦{(order.total || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: order.paymentStatus === 'Paid' ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.15rem' }}>
                        <span>
                          {order.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Awaiting Transfer'}
                        </span>
                        {order.paymentStatus !== 'Paid' && (
                          <button
                            onClick={() => confirmBankTransferPayment(order.id, 'Admin Finance')}
                            style={{
                              background: 'var(--status-warning-bg)',
                              border: '1px solid #F59E0B',
                              color: 'var(--status-warning)',
                              borderRadius: '4px',
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              width: 'fit-content'
                            }}
                            title="Click to mark bank transfer as verified & paid"
                          >
                            <CheckCircle2 size={11} /> Verify Payment
                          </button>
                        )}
                        {order.paymentStatus === 'Paid' && order.bankTransferVerifiedBy && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            By: {order.bankTransferVerifiedBy}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {order.assignedRider ? (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--charcoal-900)' }}>{order.assignedRider.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{order.assignedRider.id} · {order.assignedRider.phone}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {(() => {
                        const validNext = VALID_TRANSITIONS[order.status] || [];
                        const canChange = validNext.length > 0;
                        return (
                          <select
                            value={order.status}
                            disabled={!canChange}
                            onChange={e => updateOrderStatus(order.id, e.target.value, 'Admin')}
                            style={{
                              padding: '0.4rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--cream-300)',
                              fontSize: '0.8rem',
                              fontFamily: 'var(--font-sans)',
                              background: canChange ? 'var(--bg-surface)' : 'var(--cream-100)',
                              cursor: canChange ? 'pointer' : 'not-allowed',
                              opacity: canChange ? 1 : 0.7
                            }}
                          >
                            <option value={order.status}>{order.status}</option>
                            {validNext.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          background: 'var(--cream-100)',
                          border: '1px solid var(--cream-300)',
                          borderRadius: '6px',
                          padding: '0.4rem 0.65rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: 'var(--charcoal-700)'
                        }}
                      >
                        <Eye size={14} /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
            background: 'rgba(26,23,21,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
              maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
              padding: '2rem', boxShadow: 'var(--shadow-2xl)', animation: 'scaleUp 0.25s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--cream-200)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--charcoal-900)', margin: 0 }}>
                    Order {selectedOrder.id}
                  </h3>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Placed on {selectedOrder.date} at {selectedOrder.time} · {selectedOrder.storeName || 'Alizson Store'}
                </div>
              </div>

              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--charcoal-400)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Stepper */}
            <div style={{ marginBottom: '1.5rem', background: 'var(--cream-50)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--charcoal-700)', marginBottom: '0.5rem' }}>
                Update Order Status:
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {ORDER_STATUS_STEPS.map(step => (
                  <button
                    key={step.key}
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, step.key, 'Admin', true);
                      setSelectedOrder(prev => ({ ...prev, status: step.key, statusStep: step.step }));
                    }}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: selectedOrder.status === step.key ? 'var(--gold-action)' : 'var(--bg-surface)',
                      color: selectedOrder.status === step.key ? 'white' : 'var(--charcoal-700)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--charcoal-900)' }}>
                Order Items ({selectedOrder.items?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)' }}>
                    <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: '6px', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal-900)' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} {item.size ? `· ${item.size}` : ''} {item.flavour ? `· ${item.flavour}` : ''}
                      </div>
                      {item.customMessage && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', fontStyle: 'italic' }}>
                          Message: "{item.customMessage}"
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-gold)' }}>
                      ₦{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer & Delivery Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--cream-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--charcoal-900)' }}>Customer Contact</div>
                <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
                <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</div>
                <div style={{ marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <strong>Payment Status:</strong>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: selectedOrder.paymentStatus === 'Paid' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                    color: selectedOrder.paymentStatus === 'Paid' ? 'var(--status-success)' : 'var(--status-warning)',
                    border: `1px solid ${selectedOrder.paymentStatus === 'Paid' ? '#10B981' : '#F59E0B'}`
                  }}>
                    {selectedOrder.paymentStatus === 'Paid' ? '✅ Paid & Verified' : '⏳ Awaiting Verification'}
                  </span>
                </div>
                {selectedOrder.bankTransferVerifiedBy && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Verified by {selectedOrder.bankTransferVerifiedBy} {selectedOrder.paymentConfirmedAt ? `at ${selectedOrder.paymentConfirmedAt}` : ''}
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--cream-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--charcoal-900)' }}>Delivery Address & Coordinates</div>
                <div>{selectedOrder.deliveryAddress}</div>
                {selectedOrder.latitude && selectedOrder.longitude && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-gold)', background: 'var(--bg-surface)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-300)', fontFamily: 'monospace' }}>
                    📍 GPS Pin: [{selectedOrder.latitude}, {selectedOrder.longitude}] ({selectedOrder.lga || 'Ogun LGA'})
                  </div>
                )}
                <div style={{ marginTop: '0.3rem', color: 'var(--text-muted)' }}><strong>Slot:</strong> {selectedOrder.deliverySlot}</div>
              </div>
            </div>

            {selectedOrder.specialInstructions && (
              <div style={{ marginBottom: '1.5rem', background: 'var(--cream-100)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold-500)', fontSize: '0.85rem' }}>
                <strong>Special Instructions:</strong> <em>"{selectedOrder.specialInstructions}"</em>
              </div>
            )}

            {/* Assigned Rider Info */}
            <div style={{ marginBottom: '1.5rem', background: 'var(--cream-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--charcoal-900)' }}>Assigned Rider</div>
              {selectedOrder.assignedRider ? (
                <div style={{ fontSize: '0.85rem' }}>
                  <div><strong>Name:</strong> {selectedOrder.assignedRider.name}</div>
                  <div><strong>ID:</strong> {selectedOrder.assignedRider.id}</div>
                  <div><strong>Phone:</strong> {selectedOrder.assignedRider.phone}</div>
                  <div><strong>Vehicle:</strong> {selectedOrder.assignedRider.vehicle}</div>
                  <div><strong>Hub:</strong> {selectedOrder.assignedRider.hub}</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No rider assigned yet</div>
              )}
            </div>

            {/* Status / Tracking History */}
            {selectedOrder.trackingHistory && selectedOrder.trackingHistory.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--charcoal-900)' }}>
                  Order Status History ({selectedOrder.trackingHistory.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto', padding: '0.5rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)' }}>
                  {[...selectedOrder.trackingHistory].reverse().map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.82rem', padding: '0.5rem 0.6rem', background: idx === 0 ? 'rgba(229,138,19,0.08)' : 'white', borderRadius: 'var(--radius-sm)', border: '1px solid var(--cream-200)' }}>
                      <div style={{ minWidth: '70px', fontWeight: 700, color: 'var(--text-gold)', fontSize: '0.75rem' }}>{entry.timestamp}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--charcoal-900)' }}>{entry.event}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>by {entry.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Breakdown */}
            <div style={{ padding: '1rem 0', borderTop: '1px solid var(--cream-200)', borderBottom: '1px solid var(--cream-200)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₦{(selectedOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span>
                <span>{selectedOrder.fulfillmentType === 'pickup' || selectedOrder.deliveryFee === 0 ? 'FREE' : `₦${(selectedOrder.deliveryFee ?? 1500).toLocaleString()}`}</span>
              </div>
              {selectedOrder.giftFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#7E152B', fontWeight: 600 }}>
                  <span>🎁 Gift Package Fee</span>
                  <span>₦{selectedOrder.giftFee.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--cream-200)' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total Amount</span>
                <span style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-gold)' }}>
                  ₦{(selectedOrder.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {selectedOrder.paymentStatus !== 'Paid' && (
                <button
                  className="btn"
                  style={{
                    background: '#047857',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    padding: '0.55rem 1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    confirmBankTransferPayment(selectedOrder.id, 'Admin Finance');
                    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setSelectedOrder(prev => ({
                      ...prev,
                      paymentStatus: 'Paid',
                      bankTransferVerifiedBy: 'Admin Finance',
                      paymentConfirmedAt: nowStr,
                      trackingHistory: [...(prev.trackingHistory || []), {
                        event: '🏦 Direct Bank Transfer Verified & Confirmed by Admin Finance',
                        timestamp: nowStr,
                        actor: 'Admin Finance'
                      }]
                    }));
                  }}
                >
                  <CheckCircle2 size={16} /> Confirm Bank Transfer Received
                </button>
              )}
              <button className="btn btn-outline" onClick={() => window.print()}>
                <Printer size={15} /> Print Packing Slip
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modals */}
      <DeliveryPricesModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />

      <SalesExportModal
        isOpen={isSalesExportModalOpen}
        onClose={() => setIsSalesExportModalOpen(false)}
      />
    </div>
  );
};

export default AdminOrders;
