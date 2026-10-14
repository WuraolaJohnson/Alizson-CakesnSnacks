import React, { useState } from 'react';
import {
  FileText, TrendingUp, Download, Printer, DollarSign,
  Calendar, Cake, Package, Award, ArrowUpRight, Truck
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { useApp } from '../../context/AppContext';
import SalesExportModal from '../../components/Admin/SalesExportModal';
import DeliveryPricesModal from '../../components/Admin/DeliveryPricesModal';

const AdminRecords = () => {
  const { orders } = useOrders();
  const { bakeryProducts, supplyProducts } = useProducts();
  const { showToast } = useApp();
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'year'
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const bakerySales = orders.filter(o => o.store === 'bakery').reduce((sum, o) => sum + (o.total || 0), 0);
  const suppliesSales = orders.filter(o => o.store === 'supplies').reduce((sum, o) => sum + (o.total || 0), 0);

  const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
  const inProgressOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled').length;

  const topBakery = bakeryProducts.slice(0, 4);
  const topSupplies = supplyProducts.slice(0, 4);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--charcoal-900)', margin: 0 }}>
            Financial Records & Analytics
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Comprehensive sales performance, store comparisons, and ledger records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setIsDeliveryModalOpen(true)}>
            <Truck size={16} /> Delivery Prices
          </button>
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={() => setIsExportModalOpen(true)}>
            <Download size={16} /> Export Sales Spreadsheet (CSV)
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--charcoal-900) 0%, #2A1F18 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--gold-400)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Total Marketplace Volume
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>
            ₦{totalSales.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--charcoal-300)', marginTop: '0.5rem' }}>
            Across {orders.length} lifetime orders
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--gold-700)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            🍰 Bakery Revenue Share
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>
            ₦{bakerySales.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {totalSales > 0 ? ((bakerySales / totalSales) * 100).toFixed(1) : 0}% of gross platform revenue
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--burgundy-700)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            🧁 Supplies Revenue Share
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--charcoal-900)' }}>
            ₦{suppliesSales.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {totalSales > 0 ? ((suppliesSales / totalSales) * 100).toFixed(1) : 0}% of gross platform revenue
          </div>
        </div>
      </div>

      {/* Revenue Breakdown & Fulfillment Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Store Comparison Progress Bar */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--charcoal-900)', marginBottom: '1.25rem' }}>
            Store Channel Performance
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>🍰 Bakery Store ({totalSales > 0 ? ((bakerySales / totalSales) * 100).toFixed(1) : 0}%)</span>
              <span>₦{bakerySales.toLocaleString()}</span>
            </div>
            <div style={{ height: 12, background: 'var(--cream-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${totalSales > 0 ? (bakerySales / totalSales) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--gold-400), var(--gold-600))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>🧁 Baking Supplies Store ({totalSales > 0 ? ((suppliesSales / totalSales) * 100).toFixed(1) : 0}%)</span>
              <span>₦{suppliesSales.toLocaleString()}</span>
            </div>
            <div style={{ height: 12, background: 'var(--cream-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${totalSales > 0 ? (suppliesSales / totalSales) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--burgundy-700), var(--burgundy-900))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Fulfillment Health */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--charcoal-900)', marginBottom: '1.25rem' }}>
            Fulfillment Health
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-800)', fontWeight: 600 }}>Completed Orders</span>
              <span style={{ fontWeight: 800, color: 'var(--status-success)', fontSize: '1rem' }}>{completedOrders}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-800)', fontWeight: 600 }}>In Preparation / Transit</span>
              <span style={{ fontWeight: 800, color: 'var(--gold-600)', fontSize: '1rem' }}>{inProgressOrders}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--charcoal-800)', fontWeight: 600 }}>Fulfillment Rate</span>
              <span style={{ fontWeight: 800, color: 'var(--charcoal-900)', fontSize: '1rem' }}>
                {orders.length > 0 ? (((completedOrders + inProgressOrders) / orders.length) * 100).toFixed(0) : 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top Bakery Items */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={18} color="var(--gold-600)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--charcoal-900)', margin: 0 }}>
              Top Selling Bakery Cakes
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topBakery.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--cream-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--cream-200)', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </span>
                  <img src={item.image} alt={item.name} style={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--gold-700)', fontSize: '0.85rem' }}>
                  ₦{(item.price || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Supplies Items */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={18} color="var(--burgundy-700)" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--charcoal-900)', margin: 0 }}>
              Top Selling Baking Supplies
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topSupplies.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--cream-100)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--cream-200)', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </span>
                  <img src={item.image} alt={item.name} style={{ width: 36, height: 36, borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-900)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.brand || item.category}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--burgundy-700)', fontSize: '0.85rem' }}>
                  ₦{(item.price || item.basePrice || 0).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Historical Purchase Audit Ledger */}
      <div className="card" style={{ padding: '1.75rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--charcoal-900)', margin: 0 }}>
              Master Purchase Audit Ledger ({orders.length} Historical Transactions)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Permanent record of all customer orders, timestamps, store types, and payment totals.
            </p>
          </div>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => setIsExportModalOpen(true)}>
            <Download size={14} /> Export Sales Spreadsheet (CSV)
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--cream-100)', color: 'var(--charcoal-900)', borderBottom: '2px solid var(--cream-300)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Order ID</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Customer Name</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Store</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Date & Time</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Items Count</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Payment Method</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Total Paid</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord, i) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--cream-100)', background: i % 2 === 0 ? 'white' : 'var(--cream-50)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--gold-700)', fontFamily: 'var(--font-sans)' }}>{ord.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{ord.customerName}<br/><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ord.customerEmail}</span></td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: ord.store === 'bakery' ? 'var(--gold-100)' : 'var(--burgundy-100)', color: ord.store === 'bakery' ? 'var(--gold-900)' : 'var(--burgundy-900)' }}>
                      {ord.storeName || (ord.store === 'bakery' ? 'Bakery' : 'Supplies')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ord.date}<br/>{ord.time}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>{ord.items?.length || 1}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>{ord.paymentMethod}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--gold-700)' }}>₦{(ord.total || 0).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', background: ord.status === 'Delivered' || ord.status === 'Completed' ? 'var(--status-success-bg)' : 'var(--cream-200)', color: ord.status === 'Delivered' || ord.status === 'Completed' ? 'var(--status-success)' : 'var(--charcoal-900)' }}>
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SalesExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <DeliveryPricesModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
    </div>
  );
};

export default AdminRecords;
