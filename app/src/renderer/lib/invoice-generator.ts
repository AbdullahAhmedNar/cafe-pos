export interface InvoiceData {
  orderNo: string;
  date: string;
  cashier: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  change: number;
  cafeName: string;
  cafeAddress: string;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
}

export function generateHTMLInvoice(data: InvoiceData): string {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td class="product-name">${item.name}</td>
      <td class="quantity">${item.quantity}</td>
      <td class="unit-price">${item.unitPrice.toFixed(2)} ${data.currencySymbol}</td>
      <td class="subtotal">${item.subtotal.toFixed(2)} ${data.currencySymbol}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة - ${data.orderNo}</title>
    <style>
                 @media print {
             body { 
                 margin: 0; 
                 padding: 5mm; 
                 background: white !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
                 font-size: 12px !important;
             }
             .no-print { display: none !important; }
             .invoice-container { 
                 box-shadow: none !important;
                 margin: 0 !important;
                 max-width: none !important;
                 border: none !important;
             }
             .header {
                 background: #D4894A !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
                 padding: 15px 20px !important;
             }
             .items-table th {
                 background: #D4894A !important;
                 color: white !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
             }
             .final-total {
                 color: #D4894A !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
             }
             .receipt-header {
                 background: #f8f9fa !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
             }
             .footer {
                 background: #f8f9fa !important;
                 -webkit-print-color-adjust: exact;
                 color-adjust: exact;
             }
         }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            color: #333;
        }
        
                 .invoice-container {
             max-width: 80mm;
             margin: 20px auto;
             background: white;
             box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
             border-radius: 12px;
             overflow: hidden;
             border: 1px solid #e9ecef;
         }
        
                 .header {
             background: linear-gradient(135deg, #D4894A 0%, #B87333 100%);
             color: white;
             padding: 25px 20px;
             text-align: center;
             position: relative;
             border-radius: 8px 8px 0 0;
         }
         
         .logo {
             width: 60px;
             height: 60px;
             margin: 0 auto 15px;
             display: block;
             background: white;
             border-radius: 50%;
             padding: 10px;
             box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
         }
        
                 .cafe-name {
             font-size: 20px;
             font-weight: bold;
             margin-bottom: 8px;
             text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
         }
         
         .cafe-address {
             font-size: 13px;
             opacity: 0.95;
             line-height: 1.4;
         }
        
                 .receipt-header {
             background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
             padding: 18px 15px;
             text-align: center;
             border-bottom: 2px solid #D4894A;
             font-size: 15px;
             color: #495057;
             font-weight: 600;
         }
        
        .order-info {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        
        .info-value {
            color: #6c757d;
        }
        
        .items-section {
            padding: 15px;
        }
        
                 .items-title {
             font-size: 16px;
             font-weight: bold;
             margin-bottom: 12px;
             color: #D4894A;
             border-bottom: 3px solid #D4894A;
             padding-bottom: 8px;
             text-align: center;
         }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
                 .items-table th {
             background: linear-gradient(135deg, #D4894A 0%, #B87333 100%);
             color: white;
             padding: 10px 6px;
             text-align: center;
             font-weight: 600;
             font-size: 13px;
             border-bottom: 2px solid #B87333;
         }
        
                 .items-table td {
             padding: 8px 6px;
             text-align: center;
             border-bottom: 1px solid #f1f3f4;
             font-size: 12px;
         }
        
        .product-name {
            text-align: right;
            font-weight: 500;
        }
        
        .totals-section {
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        
        .total-label {
            font-weight: 600;
            color: #495057;
        }
        
        .total-value {
            font-weight: 600;
            color: #495057;
        }
        
                 .final-total {
             border-top: 3px solid #D4894A;
             padding-top: 12px;
             margin-top: 12px;
             font-size: 18px;
             font-weight: bold;
             color: #D4894A;
         }
        
                 .footer {
             padding: 20px 15px;
             text-align: center;
             background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
             border-top: 2px solid #D4894A;
             border-radius: 0 0 8px 8px;
         }
        
        .receipt-footer {
            font-size: 13px;
            color: #6c757d;
            margin-bottom: 10px;
        }
        
                 .thank-you {
             font-size: 15px;
             font-weight: 600;
             color: #D4894A;
             margin-top: 10px;
         }
        
        .no-print {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .print-btn {
            background: #D4894A;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }
        
        .print-btn:hover {
            background: #B87333;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">طباعة</button>
    </div>
    
    <div class="invoice-container">
        <div class="header">
            <svg class="logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="white"/>
                <path d="M16 20H48C49.1046 20 50 20.8954 50 22V26C50 27.1046 49.1046 28 48 28H46V38C46 41.3137 43.3137 44 40 44H24C20.6863 44 18 41.3137 18 38V28H16C14.8954 28 14 27.1046 14 26V22C14 20.8954 14.8954 20 16 20Z" fill="#D4894A"/>
                <path d="M22 32V36C22 37.1046 22.8954 38 24 38H40C41.1046 38 42 37.1046 42 36V32" stroke="#D4894A" stroke-width="2" stroke-linecap="round"/>
                <circle cx="32" cy="16" r="2" fill="#D4894A"/>
                <path d="M28 14C28 14 30 12 32 12C34 12 36 14 36 14" stroke="#D4894A" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="cafe-name">${data.cafeName}</div>
            <div class="cafe-address">${data.cafeAddress}</div>
        </div>
        
        <div class="receipt-header">
            ${data.receiptHeader}
        </div>
        
        <div class="order-info">
            <div class="info-row">
                <span class="info-label">رقم الطلب:</span>
                <span class="info-value">${data.orderNo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">التاريخ:</span>
                <span class="info-value">${data.date}</span>
            </div>
            <div class="info-row">
                <span class="info-label">الكاشير:</span>
                <span class="info-value">${data.cashier}</span>
            </div>
        </div>
        
        <div class="items-section">
            <div class="items-title">المنتجات</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>المجموع</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <div class="totals-section">
            <div class="total-row">
                <span class="total-label">المجموع الفرعي:</span>
                <span class="total-value">${data.subtotal.toFixed(2)} ${data.currencySymbol}</span>
            </div>
            <div class="total-row">
                <span class="total-label">الخصم:</span>
                <span class="total-value">${data.discount.toFixed(2)} ${data.currencySymbol}</span>
            </div>
            <div class="total-row">
                <span class="total-label">الضريبة:</span>
                <span class="total-value">${data.tax.toFixed(2)} ${data.currencySymbol}</span>
            </div>
            <div class="total-row final-total">
                <span class="total-label">الإجمالي:</span>
                <span class="total-value">${data.total.toFixed(2)} ${data.currencySymbol}</span>
            </div>
            <div class="total-row">
                <span class="total-label">المدفوع:</span>
                <span class="total-value">${data.paid.toFixed(2)} ${data.currencySymbol}</span>
            </div>
            <div class="total-row">
                <span class="total-label">الباقي:</span>
                <span class="total-value">${data.change.toFixed(2)} ${data.currencySymbol}</span>
            </div>
        </div>
        
        <div class="footer">
            <div class="receipt-footer">${data.receiptFooter}</div>
            <div class="thank-you">نتمنى لكم يوماً سعيداً ☕</div>
        </div>
    </div>
</body>
</html>`;
}

export function generateTextInvoice(data: InvoiceData): string {
  const itemsText = data.items.map(item => 
    `  ${item.name.padEnd(25)} ${item.quantity} × ${item.unitPrice.toFixed(2)} ${data.currencySymbol} = ${item.subtotal.toFixed(2).padStart(10)} ${data.currencySymbol}`
  ).join('\n');

  const addressLine = data.cafeAddress ? `  العنوان: ${data.cafeAddress}` : '';

  return `
╔══════════════════════════════════════════════════════════════╗
║                    ☕ ${data.cafeName} ☕                    ║
║                                                              ║
║  ${data.receiptHeader}  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  رقم الطلب: ${data.orderNo.padEnd(30)} ║
║  التاريخ: ${data.date.padEnd(32)} ║
║  الكاشير: ${data.cashier.padEnd(33)} ║
${addressLine ? `${addressLine.padEnd(58)} ║` : ''}
╠══════════════════════════════════════════════════════════════╣
║  المنتجات:                                                   ║
╠══════════════════════════════════════════════════════════════╣
${itemsText}
╠══════════════════════════════════════════════════════════════╣
║  المجموع الفرعي: ${data.subtotal.toFixed(2).padStart(10)} ${data.currencySymbol.padEnd(25)} ║
║  الخصم: ${data.discount.toFixed(2).padStart(15)} ${data.currencySymbol.padEnd(30)} ║
║  الضريبة: ${data.tax.toFixed(2).padStart(14)} ${data.currencySymbol.padEnd(30)} ║
╠══════════════════════════════════════════════════════════════╣
║  الإجمالي: ${data.total.toFixed(2).padStart(13)} ${data.currencySymbol.padEnd(27)} ║
║  المدفوع: ${data.paid.toFixed(2).padStart(13)} ${data.currencySymbol.padEnd(27)} ║
║  الباقي: ${data.change.toFixed(2).padStart(15)} ${data.currencySymbol.padEnd(30)} ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ${data.receiptFooter}  ║
║  نتمنى لكم يوماً سعيداً ☕  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝`;
}
