import React, { useState } from 'react';
import { X, Download, Calendar, Filter, ShoppingBag, Cake, Package, CheckCircle2 } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useApp } from '../../context/AppContext';

const SalesExportModal = ({ isOpen, onClose }) => {
  const { orders } = useOrders();
  const { showToast } = useApp();

  const [timeframe, setTimeframe] = useState('daily'); // 'daily', 'weekly', 'monthly', 'yearly', 'all'
  const [storeFilter, setStoreFilter] = useState('all'); // 'all', 'bakery', 'supplies'

  if (!isOpen) return null;

  const now = new Date();

  // Helper to parse order date
  const getOrderDate = (order) => {
    if (order.isoDate) return new Date(order.isoDate);
    if (order.date) return new Date(order.date);
    return new Date();
  };

  // Filter orders based on timeframe
  const filteredOrders = orders.filter(order => {
    // Store filter
    if (storeFilter !== 'all' && order.store !== storeFilter) {
      return false;
    }

    const orderDate = getOrderDate(order);
    const diffMs = now - orderDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeframe === 'daily') {
      return (
        orderDate.getDate() === now.getDate() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      ) || diffDays <= 1; // Fallback for today/recent 24h
    }

    if (timeframe === 'weekly') {
      return diffDays <= 7;
    }

    if (timeframe === 'monthly') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      ) || diffDays <= 30;
    }

    if (timeframe === 'yearly') {
      return orderDate.getFullYear() === now.getFullYear() || diffDays <= 365;
    }

    return true; // 'all'
  });

  // Extract individual sold product items
  const itemsSold = [];
  filteredOrders.forEach(order => {
    const storeLabel = order.store === 'bakery' ? 'Bakery' : 'Supplies';
    const items = order.items && order.items.length > 0
      ? order.items
      : [{ name: 'Custom Order', category: storeLabel, quantity: 1, unitPrice: order.total || 0 }];

    items.forEach(item => {
      itemsSold.push({
        date: order.date || now.toLocaleDateString(),
        time: order.time || '12:00 PM',
        orderId: order.id,
        store: storeLabel,
        productName: item.name || 'Unnamed Product',
        category: item.category || storeLabel,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        lineTotal: (item.unitPrice || 0) * (item.quantity || 1),
        orderTotal: order.total || 0,
        customerName: order.customerName || 'Valued Customer',
        customerEmail: order.customerEmail || '',
        customerPhone: order.customerPhone || '',
        lga: order.lga || 'Abeokuta South',
        paymentMethod: order.paymentMethod || 'Online Payment',
        paymentStatus: order.paymentStatus || 'Paid',
        orderStatus: order.status || 'Confirmed'
      });
    });
  });

  const totalQuantitySold = itemsSold.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRevenueExport = itemsSold.reduce((acc, curr) => acc + curr.lineTotal, 0);

  const handleDownloadCSV = () => {
    const headers = [
      'Date',
      'Time',
      'Order ID',
      'Store Category',
      'Product Name',
      'Item Category',
      'Quantity Sold',
      'Unit Price (NGN)',
      'Line Total (NGN)',
      'Order Grand Total (NGN)',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Delivery LGA',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status'
    ];

    const rows = itemsSold.map(item => [
      `"${item.date}"`,
      `"${item.time}"`,
      `"${item.orderId}"`,
      `"${item.store}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.quantity,
      item.unitPrice,
      item.lineTotal,
      item.orderTotal,
      `"${item.customerName.replace(/"/g, '""')}"`,
      `"${item.customerEmail.replace(/"/g, '""')}"`,
      `"${item.customerPhone.replace(/"/g, '""')}"`,
      `"${item.lga.replace(/"/g, '""')}"`,
      `"${item.paymentMethod.replace(/"/g, '""')}"`,
      `"${item.paymentStatus}"`,
      `"${item.orderStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Alizson_Products_Sold_${timeframe.toUpperCase()}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${itemsSold.length} product records (${timeframe.toUpperCase()}) to CSV! 📊`, 'success');
    onClose();
  };

  const handleDownloadExcel = () => {
    const headers = [
      'Date', 'Time', 'Order ID', 'Store Category', 'Product Name', 'Item Category',
      'Quantity Sold', 'Unit Price (NGN)', 'Line Total (NGN)', 'Order Grand Total (NGN)',
      'Customer Name', 'Customer Email', 'Customer Phone', 'Delivery LGA',
      'Payment Method', 'Payment Status', 'Fulfillment Status'
    ];

    const tableRows = itemsSold.map(item => `
      <tr>
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.orderId}</td>
        <td>${item.store}</td>
        <td>${item.productName}</td>
        <td>${item.category}</td>
        <td style="text-align:right;">${item.quantity}</td>
        <td style="text-align:right;">${item.unitPrice}</td>
        <td style="text-align:right;font-weight:bold;">${item.lineTotal}</td>
        <td style="text-align:right;">${item.orderTotal}</td>
        <td>${item.customerName}</td>
        <td>${item.customerEmail}</td>
        <td>${item.customerPhone}</td>
        <td>${item.lga}</td>
        <td>${item.paymentMethod}</td>
        <td>${item.paymentStatus}</td>
        <td>${item.orderStatus}</td>
      </tr>
    `).join('');

    const xmlTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"/><style>table{border-collapse:collapse;font-family:sans-serif;} th{background-color:#E58A13;color:#ffffff;font-weight:bold;border:1px solid #dddddd;padding:8px;} td{border:1px solid #dddddd;padding:6px;}</style></head>
<body><table>
<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${tableRows}</tbody>
</table></body></html>`;

    const blob = new Blob([xmlTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Alizson_Products_Sold_${timeframe.toUpperCase()}_${dateStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${itemsSold.length} product records (${timeframe.toUpperCase()}) to Excel (.XLS)! 📊`, 'success');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(26,23,21,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, var(--gold-600), var(--gold-700))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Download size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'white', margin: 0 }}>
                Download Sales & Products Sold Spreadsheet
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', margin: '0.1rem 0 0' }}>
                Export product item records per day, week, month, or year in CSV format.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {/* Timeframe selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.6rem' }}>
              1. Select Timeframe Period:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
              {[
                { id: 'daily', label: '📅 Daily', desc: 'Today / 24h' },
                { id: 'weekly', label: '🗓️ Weekly', desc: 'Last 7 days' },
                { id: 'monthly', label: '📊 Monthly', desc: 'This month' },
                { id: 'yearly', label: '📈 Yearly', desc: 'This year' },
                { id: 'all', label: '🌐 All Time', desc: 'Full history' }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${timeframe === tf.id ? 'var(--gold-500)' : 'var(--cream-300)'}`,
                    background: timeframe === tf.id ? 'var(--gold-50)' : 'white',
                    color: timeframe === tf.id ? 'var(--gold-800)' : 'var(--charcoal-800)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.825rem' }}>{tf.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{tf.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Store Filter */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal-800)', marginBottom: '0.6rem' }}>
              2. Filter by Store Channel:
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStoreFilter('all')}
                className={`btn ${storeFilter === 'all' ? 'btn-dark' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
              >
                All Stores
              </button>
              <button
                onClick={() => setStoreFilter('bakery')}
                className={`btn ${storeFilter === 'bakery' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
              >
                🍰 Bakery Store Only
              </button>
              <button
                onClick={() => setStoreFilter('supplies')}
                className={`btn ${storeFilter === 'supplies' ? 'btn-burgundy' : 'btn-secondary'}`}
                style={{ fontSize: '0.825rem', padding: '0.5rem 0.85rem' }}
              >
                🧁 Baking Supplies Only
              </button>
            </div>
          </div>

          {/* Export Summary Card */}
          <div style={{ padding: '1.25rem', background: 'var(--cream-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--cream-200)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--charcoal-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={16} color="var(--status-success)" />
              Export Preview Breakdown:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Orders Found</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal-900)', marginTop: '0.2rem' }}>
                  {filteredOrders.length}
                </div>
              </div>

              <div style={{ background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Items Sold</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-700)', marginTop: '0.2rem' }}>
                  {totalQuantitySold}
                </div>
              </div>

              <div style={{ background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--cream-300)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Revenue Subtotal</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.2rem' }}>
                  ₦{totalRevenueExport.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.85rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              📄 Spreadsheet includes columns: <strong>Date, Time, Order ID, Store, Product Name, Quantity, Unit Price, Line Total, Customer Contact, Delivery LGA, Payment Status</strong>.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', background: 'var(--cream-100)', borderTop: '1px solid var(--cream-200)', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-outline" onClick={handleDownloadCSV} disabled={itemsSold.length === 0} style={{ fontWeight: 700 }}>
            <Download size={15} /> Export as CSV
          </button>
          <button className="btn btn-primary" onClick={handleDownloadExcel} disabled={itemsSold.length === 0} style={{ fontWeight: 800 }}>
            <Download size={16} /> Export to Excel (.XLSX)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesExportModal;
