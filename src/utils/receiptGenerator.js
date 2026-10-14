/**
 * Utility to generate and trigger browser print/PDF download for an order receipt.
 */
export function printOrderReceipt(order) {
  if (!order) return;

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups for this website to print/download your receipt.');
    return;
  }

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="font-weight: 600; color: #111827;">${item.name || 'Item'}</div>
        ${item.size ? `<div style="font-size: 12px; color: #6b7280;">Variant/Size: ${item.size}</div>` : ''}
        ${item.customMessage ? `<div style="font-size: 12px; color: #d97706; font-style: italic;">Note: "${item.customMessage}"</div>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: top; color: #374151;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; color: #374151;">
        ₦${(item.unitPrice || 0).toLocaleString()}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; font-weight: 600; color: #111827;">
        ₦${((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const subtotal = (order.items || []).reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);
  const giftFee = order.giftFee || 0;
  let deliveryFee = order.fulfillmentType === 'pickup' ? 0 : (order.deliveryFee !== undefined ? order.deliveryFee : 1500);

  if (order.total && subtotal + deliveryFee + giftFee !== order.total) {
    if (order.total > subtotal + giftFee) {
      deliveryFee = order.total - subtotal - giftFee;
    }
  }
  const grandTotal = subtotal + deliveryFee + giftFee;
  const formattedTotal = grandTotal.toLocaleString();

  const receiptContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Receipt_${order.id}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #1f2937;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          line-height: 1.5;
        }
        .container {
          max-width: 680px;
          margin: 0 auto;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .header-brand {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .brand-title {
          font-family: 'Georgia', serif;
          font-size: 24px;
          font-weight: bold;
          color: #b45309;
          margin: 0 0 4px 0;
        }
        .brand-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .receipt-title-badge {
          text-align: right;
        }
        .receipt-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .order-id {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin-top: 6px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
          background: #f9fafb;
          padding: 16px 20px;
          border-radius: 8px;
          border: 1px solid #f3f4f6;
        }
        .meta-block label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          color: #9ca3af;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }
        .meta-block div {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #f3f4f6;
          color: #374151;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
        }
        th.num { text-align: right; }
        th.center { text-align: center; }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 32px;
        }
        .totals-table {
          width: 280px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
          color: #4b5563;
        }
        .totals-row.grand-total {
          border-top: 2px solid #111827;
          margin-top: 8px;
          padding-top: 10px;
          font-size: 18px;
          font-weight: 800;
          color: #b45309;
        }
        .footer {
          border-top: 1px dashed #d1d5db;
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }
        .footer-thankyou {
          font-weight: 700;
          color: #111827;
          font-size: 14px;
          margin-bottom: 4px;
        }
        @media print {
          body { padding: 0; background: none; }
          .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-brand">
          <div>
            <h1 class="brand-title">Alizson Cakes & Supplies</h1>
            <p class="brand-subtitle">Fresh Cakes, Pastries & Premium Bakery Supplies · Ogun State</p>
            <p class="brand-subtitle" style="margin-top: 2px;">Email: alizsoncakes2@gmail.com | Phone: WhatsApp Support</p>
          </div>
          <div class="receipt-title-badge">
            <span class="receipt-badge">Official Receipt</span>
            <div class="order-id">${order.id}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-block">
            <label>Customer Details</label>
            <div><strong>${order.customerName || 'Valued Customer'}</strong></div>
            <div>${order.customerEmail || ''}</div>
            ${order.customerPhone ? `<div>Tel: ${order.customerPhone}</div>` : ''}
          </div>
          <div class="meta-block">
            <label>Order & Delivery Details</label>
            <div><strong>Date:</strong> ${order.date || 'N/A'} (${order.time || ''})</div>
            <div><strong>Fulfillment:</strong> ${order.fulfillmentType === 'pickup' ? 'Store Pick-up' : 'Home Delivery'}</div>
            <div><strong>Address:</strong> ${order.deliveryAddress || 'Store Pick-up'}</div>
            ${order.lga ? `<div><strong>LGA:</strong> ${order.lga}, Ogun State</div>` : ''}
            <div><strong>Status:</strong> ${order.status || 'Confirmed'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description / Item</th>
              <th class="center">Qty</th>
              <th class="num">Unit Price</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-table">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>₦${subtotal.toLocaleString()}</span>
            </div>
            ${giftFee > 0 ? `
            <div class="totals-row">
              <span>Gift Packaging Fee:</span>
              <span>₦${giftFee.toLocaleString()}</span>
            </div>
            ` : ''}
            ${deliveryFee > 0 ? `
            <div class="totals-row">
              <span>Delivery Fee:</span>
              <span>₦${deliveryFee.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span>Total Paid:</span>
              <span>₦${formattedTotal}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-thankyou">Thank you for ordering with Alizson! 🎂</div>
          <div>We appreciate your business. For support or custom orders, reach out via email or WhatsApp.</div>
          <div style="margin-top: 8px; font-size: 11px; color: #9ca3af;">Printed on ${new Date().toLocaleString()} · Alizson Bakery Platform</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(receiptContent);
  printWindow.document.close();
}
