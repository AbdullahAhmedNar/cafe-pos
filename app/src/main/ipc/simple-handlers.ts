import { ipcMain, dialog, BrowserWindow, app, shell } from 'electron';
import log from 'electron-log';
import { getDatabase } from '../db';
import bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

export function setupSimpleIPC(): void {
  try {
    // معالج بسيط للاختبار
    ipcMain.handle('test:ping', async () => {
      return { success: true, message: 'pong' };
    });

    // معالج فتح الملفات
    ipcMain.handle('openFile', async (event, filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          await shell.openPath(filePath);
          return { success: true };
        } else {
          return { success: false, error: 'الملف غير موجود' };
        }
      } catch (error) {
        log.error('Error opening file:', error);
        return { success: false, error: 'حدث خطأ في فتح الملف' };
      }
    });

    // معالج طباعة التقارير مباشرة
    ipcMain.handle('printReport', async (event, filePath) => {
      try {
        if (fs.existsSync(filePath)) {
          // طباعة الملف مباشرة باستخدام النظام
          await shell.openPath(filePath);
          return { success: true, message: 'تم فتح التقرير للطباعة' };
        } else {
          return { success: false, error: 'الملف غير موجود' };
        }
      } catch (error) {
        log.error('Error printing file:', error);
        return { success: false, error: 'حدث خطأ في طباعة الملف' };
      }
    });

    // معالج اختبار قاعدة البيانات
    ipcMain.handle('test:db', async () => {
      try {
        const db = getDatabase();
        const result = await new Promise<any>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        return { success: true, data: result };
      } catch (error) {
        log.error('Database test error:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    // معالج تسجيل الدخول مع قاعدة البيانات
    ipcMain.handle('users:login', async (event, credentials) => {
      try {
        const { username, password } = credentials;
        
        if (!username || !password) {
          return {
            success: false,
            error: 'يرجى إدخال اسم المستخدم وكلمة المرور'
          };
        }

        const db = getDatabase();
        
        // البحث عن المستخدم في قاعدة البيانات
        const user = await new Promise<any>((resolve, reject) => {
          db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (!user) {
          return {
            success: false,
            error: 'اسم المستخدم غير موجود'
          };
        }

        // التحقق من كلمة المرور
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          return {
            success: false,
            error: 'كلمة المرور غير صحيحة'
          };
        }

        log.info(`User ${username} logged in successfully`);

        return {
          success: true,
          data: {
            user: { 
              id: user.id, 
              username: user.username, 
              role: user.role 
            },
            token: `token-${user.id}-${Date.now()}`
          }
        };
      } catch (error) {
        log.error('Login error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تسجيل الدخول'
        };
      }
    });

    // معالج المنتجات مع قاعدة البيانات
    ipcMain.handle('products:list', async (event, filters = {}) => {
      try {
        const db = getDatabase();
        let query = 'SELECT * FROM products WHERE is_active = 1';
        const params: any[] = [];

        if (filters.search) {
          query += ' AND (name LIKE ? OR sku LIKE ?)';
          params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.category) {
          query += ' AND category = ?';
          params.push(filters.category);
        }

        query += ' ORDER BY name';

        const products = await new Promise<any[]>((resolve, reject) => {
          db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        return {
          success: true,
          data: products
        };
      } catch (error) {
        log.error('Products list error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب المنتجات'
        };
      }
    });

    // معالج الإعدادات مع قاعدة البيانات
    ipcMain.handle('settings:get', async () => {
      try {
        const db = getDatabase();
        const settings = await new Promise<Array<{key: string, value: string}>>((resolve, reject) => {
          db.all('SELECT * FROM settings', (err, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });
        
        const settingsObj: Record<string, string> = {};
        settings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });

        return {
          success: true,
          data: settingsObj
        };
      } catch (error) {
        log.error('Settings get error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب الإعدادات'
        };
      }
    });

    // معالج ملخص اليوم
    ipcMain.handle('reports:dailySummary', async (event, date?: string) => {
      try {
        const db = getDatabase();
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        log.info('Fetching daily summary for date:', targetDate);
        
        // جلب مبيعات اليوم - استخدام DATE() للتعامل مع التاريخ
        const salesQuery = `
          SELECT 
            COALESCE(SUM(total), 0) as total_sales,
            COUNT(*) as orders_count,
            COALESCE(AVG(total), 0) as avg_order_value,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(tax), 0) as total_tax
          FROM orders 
          WHERE DATE(date) = ?
        `;
        
        // جلب إجمالي المنتجات المباعة اليوم
        const itemsSoldQuery = `
          SELECT COALESCE(SUM(oi.qty), 0) as total_items_sold
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE DATE(o.date) = ?
        `;
        
        const summary = await new Promise<any>((resolve, reject) => {
          db.get(salesQuery, [targetDate], (err, row) => {
            if (err) {
              log.error('Sales query error:', err);
              reject(err);
            } else {
              log.info('Sales summary result:', row);
              resolve(row || { total_sales: 0, orders_count: 0, avg_order_value: 0, total_discount: 0, total_tax: 0 });
            }
          });
        });

        // جلب إجمالي المنتجات المباعة
        const itemsSold = await new Promise<any>((resolve, reject) => {
          db.get(itemsSoldQuery, [targetDate], (err, row) => {
            if (err) {
              log.error('Items sold query error:', err);
              reject(err);
            } else {
              log.info('Items sold result:', row);
              resolve(row || { total_items_sold: 0 });
            }
          });
        });

        // جلب طرق الدفع
        const paymentMethodsQuery = `
          SELECT 
            payment_method,
            COUNT(*) as count,
            COALESCE(SUM(total), 0) as total
          FROM orders 
          WHERE DATE(date) = ?
          GROUP BY payment_method
          ORDER BY total DESC
        `;
        
        const paymentMethods = await new Promise<any[]>((resolve, reject) => {
          db.all(paymentMethodsQuery, [targetDate], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // جلب أكثر المنتجات مبيعاً اليوم
        const topProductsQuery = `
          SELECT 
            p.name,
            p.sku,
            p.category,
            COALESCE(SUM(oi.qty), 0) as quantity_sold,
            COALESCE(SUM(oi.subtotal), 0) as total_revenue
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE p.is_active = 1 AND DATE(o.date) = ?
          GROUP BY p.id, p.name, p.sku, p.category
          ORDER BY quantity_sold DESC
          LIMIT 10
        `;
        
        const topProducts = await new Promise<any[]>((resolve, reject) => {
          db.all(topProductsQuery, [targetDate], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // جلب إحصائيات العملاء
        const customersQuery = `
          SELECT 
            COUNT(CASE WHEN total > 500 THEN 1 END) as unique_customers,
            COUNT(*) as total_orders
          FROM orders 
          WHERE DATE(date) = ?
        `;
        
        const customers = await new Promise<any>((resolve, reject) => {
          db.get(customersQuery, [targetDate], (err, row) => {
            if (err) reject(err);
            else resolve(row || { unique_customers: 0, total_orders: 0 });
          });
        });

        return {
          success: true,
          data: { 
            date: targetDate,
            summary: {
              ...summary,
              total_items_sold: itemsSold.total_items_sold
            },
            paymentMethods,
            topProducts,
            customers
          }
        };
      } catch (error) {
        log.error('Daily summary error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب ملخص اليوم'
        };
      }
    });

    // معالج أكثر المنتجات مبيعاً
    ipcMain.handle('reports:topProducts', async (event, limit: number = 10) => {
      try {
        const db = getDatabase();
        
        const query = `
          SELECT 
            p.name,
            p.sku,
            p.category,
            COALESCE(SUM(oi.qty), 0) as total_sold,
            COALESCE(SUM(oi.subtotal), 0) as total_revenue,
            COUNT(DISTINCT o.id) as orders_count
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE p.is_active = 1
          GROUP BY p.id, p.name, p.sku, p.category
          ORDER BY total_sold DESC
          LIMIT ?
        `;
        
        const products = await new Promise<any[]>((resolve, reject) => {
          db.all(query, [limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        return {
          success: true,
          data: products
        };
      } catch (error) {
        log.error('Top products error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب أكثر المنتجات مبيعاً'
        };
      }
    });

    // معالج تقارير المبيعات
    ipcMain.handle('reports:sales', async (event, query) => {
      try {
        const db = getDatabase();
        const { from, to, groupBy = 'day' } = query;
        
        log.info('Sales report query:', { from, to, groupBy });
        
        let dateFormat, groupClause;
        if (groupBy === 'day') {
          dateFormat = '%Y-%m-%d';
          groupClause = 'DATE(date)';
        } else if (groupBy === 'month') {
          dateFormat = '%Y-%m';
          groupClause = 'strftime("%Y-%m", date)';
        } else if (groupBy === 'year') {
          dateFormat = '%Y';
          groupClause = 'strftime("%Y", date)';
        }

        const salesQuery = `
          SELECT 
            ${groupClause} as period,
            COUNT(*) as orders_count,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(tax), 0) as total_tax,
            COALESCE(AVG(total), 0) as avg_order_value
          FROM orders 
          WHERE DATE(date) BETWEEN ? AND ?
          GROUP BY ${groupClause}
          ORDER BY period DESC
        `;
        
        const sales = await new Promise<any[]>((resolve, reject) => {
          db.all(salesQuery, [from, to], (err, rows) => {
            if (err) {
              log.error('Sales query error:', err);
              reject(err);
            } else {
              log.info('Sales report result:', rows);
              resolve(rows || []);
            }
          });
        });

        return {
          success: true,
          data: sales
        };
      } catch (error) {
        log.error('Sales report error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب تقرير المبيعات'
        };
      }
    });

    // معالج تصدير PDF
    ipcMain.handle('reports:exportToPDF', async (event, data, type) => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        // إنشاء مجلد التقارير إذا لم يكن موجوداً
        const reportsDir = path.join(app.getPath('documents'), 'Tesla Cafe POS', 'Reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }

        // جلب البيانات من قاعدة البيانات
        const db = getDatabase();
        const { dateRange, title = 'تقرير شامل - Tesla Cafe POS' } = data;
        const { from, to } = dateRange || {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };

        // جلب الإحصائيات الشاملة
        const salesOverviewQuery = `
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(AVG(total), 0) as avg_order_value,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(tax), 0) as total_tax,
            COUNT(*) as unique_customers
          FROM orders 
          WHERE DATE(date) BETWEEN ? AND ?
        `;
        
        const salesOverview = await new Promise<any>((resolve, reject) => {
          db.get(salesOverviewQuery, [from, to], (err, row) => {
            if (err) reject(err);
            else resolve(row || { total_orders: 0, total_sales: 0, avg_order_value: 0, total_discount: 0, total_tax: 0, unique_customers: 0 });
          });
        });

        // جلب بيانات المبيعات اليومية
        const salesDataQuery = `
          SELECT 
            DATE(date) as period,
            COUNT(*) as orders_count,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(tax), 0) as total_tax,
            COALESCE(AVG(total), 0) as avg_order_value
          FROM orders 
          WHERE DATE(date) BETWEEN ? AND ?
          GROUP BY DATE(date)
          ORDER BY date DESC
        `;
        
        const salesData = await new Promise<any[]>((resolve, reject) => {
          db.all(salesDataQuery, [from, to], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // جلب أكثر المنتجات مبيعاً
        const topProductsQuery = `
          SELECT 
            p.name,
            p.sku,
            p.category,
            COALESCE(SUM(oi.qty), 0) as total_sold,
            COALESCE(SUM(oi.subtotal), 0) as total_revenue,
            COUNT(DISTINCT o.id) as orders_count
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE p.is_active = 1 AND o.date BETWEEN ? AND ?
          GROUP BY p.id
          ORDER BY total_sold DESC
          LIMIT 10
        `;
        
        const topProducts = await new Promise<any[]>((resolve, reject) => {
          db.all(topProductsQuery, [from, to], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // إنشاء HTML للتقرير بنفس تنسيق الفواتير
        const salesDataHTML = salesData.slice(0, 7).map(day => `
          <tr>
            <td>${day.period}</td>
            <td>${day.orders_count}</td>
            <td>${day.total_sales.toFixed(2)} ج.م</td>
            <td>${day.total_discount.toFixed(2)} ج.م</td>
            <td>${day.avg_order_value.toFixed(2)} ج.م</td>
          </tr>
        `).join('');

        const topProductsHTML = topProducts.slice(0, 10).map(product => `
          <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.total_sold}</td>
            <td>${product.total_revenue.toFixed(2)} ج.م</td>
            <td>${product.orders_count}</td>
          </tr>
        `).join('');

        const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير المبيعات - Tesla Cafe POS</title>
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
            .report-container { 
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
            .data-table th {
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
        
        .report-container {
            max-width: 210mm;
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
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .cafe-address {
            font-size: 14px;
            opacity: 0.95;
            line-height: 1.4;
        }
        
        .receipt-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 18px 15px;
            text-align: center;
            border-bottom: 2px solid #D4894A;
            font-size: 18px;
            color: #495057;
            font-weight: 600;
        }
        
        .report-info {
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        
        .info-value {
            color: #6c757d;
        }
        
        .stats-section {
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .stats-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #D4894A;
            border-bottom: 3px solid #D4894A;
            padding-bottom: 8px;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #D4894A;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #D4894A;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            color: #6c757d;
        }
        
        .data-section {
            padding: 20px;
        }
        
        .data-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #D4894A;
            border-bottom: 2px solid #D4894A;
            padding-bottom: 8px;
            text-align: center;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 20px;
        }
        
        .data-table th {
            background: linear-gradient(135deg, #D4894A 0%, #B87333 100%);
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 2px solid #B87333;
        }
        
        .data-table td {
            padding: 10px 8px;
            text-align: center;
            border-bottom: 1px solid #f1f3f4;
            font-size: 12px;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .footer {
            padding: 20px;
            text-align: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-top: 2px solid #D4894A;
            border-radius: 0 0 8px 8px;
        }
        
        .report-footer {
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
        <button class="print-btn" onclick="window.print()">طباعة التقرير</button>
    </div>
    
    <div class="report-container">
        <div class="header">
            <svg class="logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="white"/>
                <path d="M16 20H48C49.1046 20 50 20.8954 50 22V26C50 27.1046 49.1046 28 48 28H46V38C46 41.3137 43.3137 44 40 44H24C20.6863 44 18 41.3137 18 38V28H16C14.8954 28 14 27.1046 14 26V22C14 20.8954 14.8954 20 16 20Z" fill="#D4894A"/>
                <path d="M22 32V36C22 37.1046 22.8954 38 24 38H40C41.1046 38 42 37.1046 42 36V32" stroke="#D4894A" stroke-width="2" stroke-linecap="round"/>
                <circle cx="32" cy="16" r="2" fill="#D4894A"/>
                <path d="M28 14C28 14 30 12 32 12C34 12 36 14 36 14" stroke="#D4894A" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="cafe-name">Tesla Cafe POS</div>
            <div class="cafe-address">نظام إدارة نقاط البيع</div>
        </div>
        
        <div class="receipt-header">
            تقرير المبيعات الشامل
        </div>
        
        <div class="report-info">
            <div class="info-row">
                <span class="info-label">فترة التقرير:</span>
                <span class="info-value">من ${from} إلى ${to}</span>
            </div>
            <div class="info-row">
                <span class="info-label">تاريخ الإنشاء:</span>
                <span class="info-value">${new Date().toLocaleDateString('ar-SA')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">وقت الإنشاء:</span>
                <span class="info-value">${new Date().toLocaleTimeString('ar-SA')}</span>
            </div>
        </div>
        
        <div class="stats-section">
            <div class="stats-title">الإحصائيات الرئيسية</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${salesOverview.total_sales.toFixed(2)}</div>
                    <div class="stat-label">إجمالي المبيعات (ج.م)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${salesOverview.total_orders}</div>
                    <div class="stat-label">عدد الطلبات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${salesOverview.avg_order_value.toFixed(2)}</div>
                    <div class="stat-label">متوسط قيمة الطلب (ج.م)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${salesOverview.unique_customers}</div>
                    <div class="stat-label">العملاء المميزون</div>
                </div>
            </div>
        </div>
        
        <div class="data-section">
            <div class="data-title">المبيعات اليومية</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>عدد الطلبات</th>
                        <th>إجمالي المبيعات</th>
                        <th>الخصم</th>
                        <th>متوسط الطلب</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesDataHTML}
                </tbody>
            </table>
            
            <div class="data-title">أكثر المنتجات مبيعاً</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>اسم المنتج</th>
                        <th>الفئة</th>
                        <th>الكمية المباعة</th>
                        <th>الإيرادات</th>
                        <th>عدد الطلبات</th>
                    </tr>
                </thead>
                <tbody>
                    ${topProductsHTML}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <div class="report-footer">تم إنشاء هذا التقرير تلقائياً بواسطة نظام Tesla Cafe POS</div>
            <div class="thank-you">شكراً لاستخدام نظامنا ☕</div>
        </div>
    </div>
</body>
</html>`;

        // حفظ ملف HTML
        const filename = `Tesla_Cafe_Report_${from}_${to}.html`;
        const filePath = path.join(reportsDir, filename);
        fs.writeFileSync(filePath, htmlContent, 'utf8');

        log.info('HTML report generated successfully:', filePath);
        return {
          success: true,
          data: {
            filename,
            path: filePath,
            message: 'تم إنشاء التقرير بنجاح'
          }
        };

      } catch (error) {
        log.error('Report export error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء التقرير'
        };
      }
    });

    // معالج الإحصائيات الشاملة
    ipcMain.handle('reports:overview', async (event, dateRange) => {
      try {
        const db = getDatabase();
        const { from, to } = dateRange || {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0]
        };

        // إحصائيات المبيعات العامة
        const salesOverviewQuery = `
          SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total), 0) as total_sales,
            COALESCE(AVG(total), 0) as avg_order_value,
            COALESCE(SUM(discount), 0) as total_discount,
            COALESCE(SUM(tax), 0) as total_tax,
            COUNT(*) as unique_customers
          FROM orders 
          WHERE DATE(date) BETWEEN ? AND ?
        `;
        
        const salesOverview = await new Promise<any>((resolve, reject) => {
          db.get(salesOverviewQuery, [from, to], (err, row) => {
            if (err) {
              log.error('Sales overview query error:', err);
              reject(err);
            } else {
              log.info('Sales overview result:', row);
              resolve(row || { total_orders: 0, total_sales: 0, avg_order_value: 0, total_discount: 0, total_tax: 0, unique_customers: 0 });
            }
          });
        });

        // إحصائيات المنتجات
        const productsOverviewQuery = `
          SELECT 
            COUNT(DISTINCT p.id) as total_products,
            COUNT(DISTINCT p.category) as total_categories,
            COALESCE(SUM(oi.qty), 0) as total_items_sold,
            COALESCE(SUM(oi.subtotal), 0) as total_revenue
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE p.is_active = 1 AND (o.date BETWEEN ? AND ? OR o.date IS NULL)
        `;
        
        const productsOverview = await new Promise<any>((resolve, reject) => {
          db.get(productsOverviewQuery, [from, to], (err, row) => {
            if (err) reject(err);
            else resolve(row || { total_products: 0, total_categories: 0, total_items_sold: 0, total_revenue: 0 });
          });
        });

        // إحصائيات طرق الدفع
        const paymentOverviewQuery = `
          SELECT 
            payment_method,
            COUNT(*) as count,
            COALESCE(SUM(total), 0) as total_amount,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders WHERE date BETWEEN ? AND ?), 2) as percentage
          FROM orders 
          WHERE date BETWEEN ? AND ?
          GROUP BY payment_method
          ORDER BY total_amount DESC
        `;
        
        const paymentOverview = await new Promise<any[]>((resolve, reject) => {
          db.all(paymentOverviewQuery, [from, to, from, to], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // إحصائيات الفئات
        const categoriesOverviewQuery = `
          SELECT 
            p.category,
            COUNT(DISTINCT p.id) as products_count,
            COALESCE(SUM(oi.qty), 0) as items_sold,
            COALESCE(SUM(oi.subtotal), 0) as revenue
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id
          WHERE p.is_active = 1 AND (o.date BETWEEN ? AND ? OR o.date IS NULL)
          GROUP BY p.category
          ORDER BY revenue DESC
        `;
        
        const categoriesOverview = await new Promise<any[]>((resolve, reject) => {
          db.all(categoriesOverviewQuery, [from, to], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        return {
          success: true,
          data: {
            dateRange: { from, to },
            salesOverview,
            productsOverview,
            paymentOverview,
            categoriesOverview
          }
        };
      } catch (error) {
        log.error('Overview report error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب الإحصائيات الشاملة'
        };
      }
    });

    // معالج تصدير CSV
    ipcMain.handle('reports:exportToCSV', async (event, data, filename) => {
      try {
        // هنا يمكن إضافة منطق تصدير CSV
        // حالياً نعيد نجاح بدون تصدير فعلي
        return {
          success: true,
          data: { message: 'تم تصدير التقرير بنجاح' }
        };
      } catch (error) {
        log.error('CSV export error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تصدير CSV'
        };
      }
    });

    // معالج قائمة المستخدمين
    ipcMain.handle('users:list', async () => {
      try {
        const db = getDatabase();
        
        const users = await new Promise<any[]>((resolve, reject) => {
          db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC', (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        return {
          success: true,
          data: users
        };
      } catch (error) {
        log.error('Users list error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب قائمة المستخدمين'
        };
      }
    });

    // معالج إنشاء المستخدمين
    ipcMain.handle('users:create', async (event, userData) => {
      try {
        const { username, password, role = 'cashier' } = userData;
        
        if (!username || !password) {
          return {
            success: false,
            error: 'يرجى إدخال اسم المستخدم وكلمة المرور'
          };
        }

        const db = getDatabase();
        
        // التحقق من عدم وجود اسم المستخدم مسبقاً
        const existingUser = await new Promise<any>((resolve, reject) => {
          db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existingUser) {
          return {
            success: false,
            error: 'اسم المستخدم موجود مسبقاً'
          };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await new Promise<any>((resolve, reject) => {
          db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role],
            function(err) {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            }
          );
        });

        return {
          success: true,
          data: { id: result.id }
        };
      } catch (error) {
        log.error('Create user error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء المستخدم'
        };
      }
    });



    // معالج تحديث المستخدمين
    ipcMain.handle('users:update', async (event, userId, userData) => {
      try {
        const { username, password, role } = userData;
        
        if (!username) {
          return {
            success: false,
            error: 'يرجى إدخال اسم المستخدم'
          };
        }

        const db = getDatabase();
        
        // التحقق من عدم وجود اسم المستخدم مسبقاً (باستثناء المستخدم الحالي)
        const existingUser = await new Promise<any>((resolve, reject) => {
          db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existingUser) {
          return {
            success: false,
            error: 'اسم المستخدم موجود مسبقاً'
          };
        }

        let query = 'UPDATE users SET username = ?, role = ?';
        let params = [username, role];

        // إضافة كلمة المرور إذا تم توفيرها
        if (password && password.trim()) {
          const hashedPassword = await bcrypt.hash(password, 10);
          query += ', password_hash = ?';
          params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await new Promise<void>((resolve, reject) => {
          db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve();
          });
        });

        log.info(`User ${userId} updated successfully`);

        return {
          success: true,
          data: { id: userId, username, role }
        };
      } catch (error) {
        log.error('User update error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تحديث المستخدم'
        };
      }
    });

    // معالج حذف المستخدمين
    ipcMain.handle('users:delete', async (event, userId) => {
      try {
        const db = getDatabase();
        
        // التحقق من عدم حذف المستخدم الوحيد
        const userCount = await new Promise<number>((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
            if (err) reject(err);
            else resolve(row.count);
          });
        });

        if (userCount <= 1) {
          return {
            success: false,
            error: 'لا يمكن حذف المستخدم الوحيد في النظام'
          };
        }

        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) reject(err);
            else resolve();
          });
        });

        log.info(`User ${userId} deleted successfully`);

        return {
          success: true,
          data: { id: userId }
        };
      } catch (error) {
        log.error('User deletion error:', error);
        return {
          success: false,
          error: 'حدث خطأ في حذف المستخدم'
        };
      }
    });

    // معالج إنشاء المنتجات
    ipcMain.handle('products:create', async (event, product) => {
      try {
        const { name, price, category, sku, stock = 0, image } = product;
        
        if (!name || !price || !category || !sku) {
          return {
            success: false,
            error: 'يرجى إدخال جميع البيانات المطلوبة'
          };
        }

        const db = getDatabase();
        
        const result = await new Promise<any>((resolve, reject) => {
          db.run(
            'INSERT INTO products (name, price, category, sku, stock, image) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price, category, sku, stock, image],
            function(err) {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            }
          );
        });

        return {
          success: true,
          data: { id: result.id }
        };
      } catch (error) {
        log.error('Create product error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء المنتج'
        };
      }
    });

    // معالج تحديث المنتجات
    ipcMain.handle('products:update', async (event, id, product) => {
      try {
        const db = getDatabase();
        
        // إذا كان التحديث يحتوي على is_active فقط (تفعيل/إلغاء تفعيل)
        if (Object.keys(product).length === 1 && 'is_active' in product) {
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [product.is_active, id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        } else {
          // تحديث كامل للمنتج
          const { name, price, category, sku, stock, image, is_active } = product;
          
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE products SET name = ?, price = ?, category = ?, sku = ?, stock = ?, image = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [name, price, category, sku, stock, image, is_active, id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        return {
          success: true
        };
      } catch (error) {
        log.error('Update product error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تحديث المنتج'
        };
      }
    });

    // معالج حذف المنتجات
    ipcMain.handle('products:delete', async (event, id) => {
      try {
        const db = getDatabase();
        
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        return {
          success: true
        };
      } catch (error) {
        log.error('Delete product error:', error);
        return {
          success: false,
          error: 'حدث خطأ في حذف المنتج'
        };
      }
    });

    // معالج تحديث المخزون
    ipcMain.handle('products:updateStock', async (event, id, quantity) => {
      try {
        const db = getDatabase();
        
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [quantity, id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        return {
          success: true
        };
      } catch (error) {
        log.error('Update stock error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تحديث المخزون'
        };
      }
    });

    // معالج البحث عن المنتج بالباركود
    ipcMain.handle('products:getByBarcode', async (event, sku) => {
      try {
        const db = getDatabase();
        
        const product = await new Promise<any>((resolve, reject) => {
          db.get('SELECT * FROM products WHERE sku = ? AND is_active = 1', [sku], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        return {
          success: true,
          data: product
        };
      } catch (error) {
        log.error('Get product by barcode error:', error);
        return {
          success: false,
          error: 'حدث خطأ في البحث عن المنتج'
        };
      }
    });

    // معالج إنشاء الطلبات
    ipcMain.handle('orders:create', async (event, order) => {
      try {
        log.info('Received order data:', JSON.stringify(order, null, 2));
        
        const { items, total, discount = 0, tax = 0, paid, payment_method, user_id } = order;
        
        if (!items || items.length === 0) {
          return {
            success: false,
            error: 'يجب أن يحتوي الطلب على منتج واحد على الأقل'
          };
        }

        const db = getDatabase();
        log.info('Database connection established');
        
        // التأكد من أن total موجود وصحيح
        if (total === null || total === undefined || isNaN(total) || total < 0) {
          log.error('Invalid total received:', { total, items });
          return {
            success: false,
            error: 'خطأ في إجمالي الطلب'
          };
        }
        
        // التأكد من أن جميع القيم رقمية
        const numericTotal = Number(total);
        const numericDiscount = Number(discount);
        const numericTax = Number(tax);
        const numericPaid = Number(paid);
        
        if (isNaN(numericTotal) || isNaN(numericDiscount) || isNaN(numericTax) || isNaN(numericPaid)) {
          log.error('Non-numeric values detected:', { total, discount, tax, paid });
          return {
            success: false,
            error: 'قيم غير صحيحة في الطلب'
          };
        }
        
        log.info('Order data validated:', { 
          total: numericTotal, 
          discount: numericDiscount, 
          tax: numericTax, 
          paid: numericPaid, 
          items 
        });
        
        // إنشاء رقم الطلب
        // جلب آخر رقم طلب من قاعدة البيانات
        const lastOrder = await new Promise<any>((resolve, reject) => {
          db.get('SELECT order_no FROM orders ORDER BY id DESC LIMIT 1', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        let nextNumber = 1;
        
        if (lastOrder && lastOrder.order_no) {
          // استخراج الرقم من آخر طلب
          const match = lastOrder.order_no.match(/ORD-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        const orderNumber = `ORD-${nextNumber.toString().padStart(6, '0')}`;
        
        // إنشاء الطلب
        const finalUserId = user_id || 1;
        log.info('Creating order with params:', { 
          orderNumber, 
          total: numericTotal, 
          discount: numericDiscount, 
          tax: numericTax, 
          paid: numericPaid, 
          payment_method, 
          user_id: finalUserId 
        });
        
        // إنشاء التاريخ بتنسيق YYYY-MM-DD للتوافق مع استعلامات التقارير
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const orderResult = await new Promise<any>((resolve, reject) => {
          db.run(
            'INSERT INTO orders (order_no, date, total, discount, tax, paid, payment_method, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [orderNumber, dateString, numericTotal, numericDiscount, numericTax, numericPaid, payment_method, finalUserId],
            function(err) {
              if (err) {
                log.error('Database insert error:', err);
                reject(err);
              } else {
                log.info('Order created successfully with ID:', this.lastID);
                resolve({ id: this.lastID });
              }
            }
          );
        });

        // التحقق من المخزون لجميع المنتجات قبل إنشاء الطلب
        const insufficientStockItems: string[] = [];
        
        for (const item of items) {
          // جلب معلومات المنتج والمخزون
          const productInfo = await new Promise<any>((resolve, reject) => {
            db.get('SELECT name, stock FROM products WHERE id = ?', [item.product_id], (err, row: any) => {
              if (err) reject(err);
              else resolve(row);
            });
          });

          if (!productInfo) {
            return {
              success: false,
              error: `المنتج غير موجود`
            };
          }

          if (productInfo.stock < item.qty) {
            insufficientStockItems.push(`${productInfo.name} (المتوفر: ${productInfo.stock}, المطلوب: ${item.qty})`);
          }
        }

        // إذا كان هناك منتجات غير متوفرة، إرجاع رسالة خطأ
        if (insufficientStockItems.length > 0) {
          return {
            success: false,
            error: `المنتجات التالية غير متوفرة في المخزون:\n${insufficientStockItems.join('\n')}`
          };
        }

        // إضافة عناصر الطلب
        for (const item of items) {
          const subtotal = item.qty * item.unit_price;
          await new Promise<void>((resolve, reject) => {
            db.run(
              'INSERT INTO order_items (order_id, product_id, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
              [orderResult.id, item.product_id, item.qty, item.unit_price, subtotal],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          // تحديث المخزون
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [item.qty, item.product_id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }

        return {
          success: true,
          data: { 
            orderId: orderResult.id, 
            orderNo: orderNumber,
            change: numericPaid - numericTotal
          }
        };
      } catch (error) {
        log.error('Create order error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء الطلب'
        };
      }
    });

    // معالج طباعة الفاتورة
    ipcMain.handle('orders:print', async (event, orderId: number) => {
      try {
        log.info('orders:print handler called with orderId:', orderId);
        const db = getDatabase();
        
        // جلب بيانات الطلب
        const orderQuery = `
          SELECT 
            o.*,
            u.username as user_name
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE o.id = ?
        `;
        
        const order = await new Promise<any>((resolve, reject) => {
          db.get(orderQuery, [orderId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (!order) {
          return {
            success: false,
            error: 'الطلب غير موجود'
          };
        }

        // جلب عناصر الطلب
        const itemsQuery = `
          SELECT 
            oi.*,
            p.name as product_name,
            p.sku
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `;
        
        const items = await new Promise<any[]>((resolve, reject) => {
          db.all(itemsQuery, [orderId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        // جلب إعدادات الكافيه
        const settingsQuery = 'SELECT * FROM settings WHERE key IN (?, ?, ?, ?, ?)';
        const settings = await new Promise<Array<{key: string, value: string}>>((resolve, reject) => {
          db.all(settingsQuery, ['cafe_name', 'currency_symbol', 'receipt_header', 'receipt_footer', 'cafe_address'], (err, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        const settingsObj: Record<string, string> = {};
        settings.forEach(setting => {
          settingsObj[setting.key] = setting.value;
        });

        const cafeName = settingsObj.cafe_name || 'كافيه الأصالة';
        const currencySymbol = settingsObj.currency_symbol || 'ج.م';
        const receiptHeader = settingsObj.receipt_header || `أهلاً وسهلاً بكم في ${cafeName}`;
        const receiptFooter = settingsObj.receipt_footer || 'شكراً لتعاملكم معنا ☕';
        const cafeAddress = settingsObj.cafe_address || '';

        // حساب المجموع الفرعي الصحيح
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const change = order.paid - order.total;

                // إنشاء محتوى الفاتورة المحسن
        const receiptContent = `
          ╔══════════════════════════════════════════════════════════════╗
          ║                    ☕ ${cafeName} ☕                    ║
          ║                                                              ║
          ║  ${receiptHeader}  ║
          ║                                                              ║
          ╠══════════════════════════════════════════════════════════════╣
          ║  رقم الطلب: ${order.order_no.padEnd(30)} ║
          ║  التاريخ: ${new Date(order.date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Africa/Cairo'
          }).padEnd(32)} ║
          ║  الكاشير: ${(order.user_name || 'غير محدد').padEnd(33)} ║
║  ${cafeAddress ? `العنوان: ${cafeAddress}` : ''}  ║
╠══════════════════════════════════════════════════════════════╣
║  المنتجات:                                                   ║
╠══════════════════════════════════════════════════════════════╣
${items.map(item => {
  const productName = item.product_name.padEnd(25);
  const itemLine = `${item.qty} × ${item.unit_price.toFixed(2)} ${currencySymbol}`;
  const subtotalStr = `${item.subtotal.toFixed(2)} ${currencySymbol}`;
  return `║  ${productName} ${itemLine.padStart(15)} = ${subtotalStr.padStart(10)} ║`;
}).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║  المجموع الفرعي: ${subtotal.toFixed(2).padStart(10)} ${currencySymbol.padEnd(25)} ║
║  الخصم: ${order.discount.toFixed(2).padStart(15)} ${currencySymbol.padEnd(30)} ║
║  الضريبة: ${order.tax.toFixed(2).padStart(14)} ${currencySymbol.padEnd(30)} ║
╠══════════════════════════════════════════════════════════════╣
║  الإجمالي: ${order.total.toFixed(2).padStart(13)} ${currencySymbol.padEnd(27)} ║
║  المدفوع: ${order.paid.toFixed(2).padStart(13)} ${currencySymbol.padEnd(27)} ║
║  الباقي: ${change.toFixed(2).padStart(15)} ${currencySymbol.padEnd(30)} ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ${receiptFooter}  ║
║  نتمنى لكم يوماً سعيداً ☕  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `;

        // هنا يمكن إضافة منطق الطباعة الفعلي
        // حالياً نطبع في console للاختبار
        console.log('=== فاتورة ===');
        console.log(receiptContent);
        console.log('=== نهاية الفاتورة ===');

        return {
          success: true,
          data: {
            message: 'تم إنشاء الفاتورة بنجاح',
            receipt: receiptContent,
            // بيانات منظمة للفاتورة
            invoiceData: {
              orderNo: order.order_no,
              date: new Date(order.date).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Africa/Cairo'
              }),
              cashier: order.user_name || 'غير محدد',
              items: items.map(item => ({
                name: item.product_name,
                quantity: item.qty,
                unitPrice: item.unit_price,
                subtotal: item.subtotal
              })),
              subtotal: subtotal,
              discount: order.discount,
              tax: order.tax,
              total: order.total,
              paid: order.paid,
              change: change,
              cafeName: cafeName,
              cafeAddress: cafeAddress,
              currencySymbol: currencySymbol,
              receiptHeader: receiptHeader,
              receiptFooter: receiptFooter
            }
          }
        };
      } catch (error) {
        log.error('Print receipt error:', error);
        return {
          success: false,
          error: 'حدث خطأ في طباعة الفاتورة'
        };
      }
    });

    // معالج قائمة الطلبات
    ipcMain.handle('orders:list', async (event, filters = {}) => {
      try {
        const db = getDatabase();
        let query = `
          SELECT 
            o.*,
            u.username as user_name
          FROM orders o
          LEFT JOIN users u ON o.user_id = u.id
          WHERE 1=1
        `;
        const params: any[] = [];

        if (filters.from) {
          query += ' AND DATE(o.date) >= ?';
          params.push(filters.from);
        }

        if (filters.to) {
          query += ' AND DATE(o.date) <= ?';
          params.push(filters.to);
        }

        query += ' ORDER BY o.date DESC';

        if (filters.limit) {
          query += ' LIMIT ?';
          params.push(filters.limit);
        }

        const orders = await new Promise<any[]>((resolve, reject) => {
          db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        });

        return {
          success: true,
          data: orders
        };
      } catch (error) {
        log.error('Orders list error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب قائمة الطلبات'
        };
      }
    });

    // معالج تفاصيل الطلب
    ipcMain.handle('orders:getById', async (event, id) => {
      try {
        const db = getDatabase();
        
        // جلب الطلب
        const order = await new Promise<any>((resolve, reject) => {
          db.get(
            'SELECT o.*, u.username as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?',
            [id],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!order) {
          return {
            success: false,
            error: 'الطلب غير موجود'
          };
        }

        // جلب عناصر الطلب
        const items = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT oi.*, p.name as product_name FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
            [id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        return {
          success: true,
          data: { order, items }
        };
      } catch (error) {
        log.error('Get order error:', error);
        return {
          success: false,
          error: 'حدث خطأ في جلب تفاصيل الطلب'
        };
      }
    });

    // معالج إنشاء رقم الطلب
    ipcMain.handle('orders:generateOrderNumber', async () => {
      try {
        const db = getDatabase();
        
        // جلب آخر رقم طلب من قاعدة البيانات
        const lastOrder = await new Promise<any>((resolve, reject) => {
          db.get('SELECT order_no FROM orders ORDER BY id DESC LIMIT 1', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        let nextNumber = 1;
        
        if (lastOrder && lastOrder.order_no) {
          // استخراج الرقم من آخر طلب
          const match = lastOrder.order_no.match(/ORD-(\d+)/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        const orderNumber = `ORD-${nextNumber.toString().padStart(6, '0')}`;
        
        return {
          success: true,
          data: { orderNo: orderNumber }
        };
      } catch (error) {
        log.error('Generate order number error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء رقم الطلب'
        };
      }
    });

    // معالج إعادة تعيين عداد الطلبات
    ipcMain.handle('orders:resetCounter', async () => {
      try {
        const db = getDatabase();
        
        // حذف جميع الطلبات من قاعدة البيانات
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM order_items', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM orders', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // إعادة تعيين auto-increment
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM sqlite_sequence WHERE name = "orders"', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM sqlite_sequence WHERE name = "order_items"', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        log.info('Order counter reset successfully');
        
        return {
          success: true,
          data: { message: 'تم إعادة تعيين عداد الطلبات بنجاح' }
        };
      } catch (error) {
        log.error('Reset counter error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إعادة تعيين العداد'
        };
      }
    });

    // معالج تنظيف الطلبات القديمة (التي تحتوي على أرقام غير صحيحة)
    ipcMain.handle('orders:cleanOldOrders', async () => {
      try {
        const db = getDatabase();
        
        // حذف الطلبات التي تحتوي على أرقام غير صحيحة (مثل الأرقام الطويلة)
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_no LIKE "ORD-%" AND LENGTH(order_no) > 15)', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM orders WHERE order_no LIKE "ORD-%" AND LENGTH(order_no) > 15', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        log.info('Old orders cleaned successfully');
        
        return {
          success: true,
          data: { message: 'تم تنظيف الطلبات القديمة بنجاح' }
        };
      } catch (error) {
        log.error('Clean old orders error:', error);
        return {
          success: false,
          error: 'حدث خطأ في تنظيف الطلبات القديمة'
        };
      }
    });

    // معالج إنشاء رمز المنتج تلقائياً
    ipcMain.handle('products:generateSKU', async () => {
      try {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sku = `PRD-${timestamp}-${random}`;
        return {
          success: true,
          data: sku
        };
      } catch (error) {
        log.error('Generate SKU error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء رمز المنتج'
        };
      }
    });

    // معالج تحديث الإعدادات
    ipcMain.handle('settings:set', async (event, settings) => {
      try {
        const db = getDatabase();
        
        for (const [key, value] of Object.entries(settings)) {
          await new Promise<void>((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        return {
          success: true
        };
      } catch (error) {
        log.error('Settings set error:', error);
        return {
          success: false,
          error: 'حدث خطأ في حفظ الإعدادات'
        };
      }
    });

    // معالج إعادة تعيين الإعدادات
    ipcMain.handle('settings:reset', async () => {
      try {
        const db = getDatabase();
        
        // حذف جميع الإعدادات الحالية
        await new Promise<void>((resolve, reject) => {
          db.run('DELETE FROM settings', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // إعادة إنشاء الإعدادات الافتراضية
        const defaultSettings = {
          cafe_name: 'Abdullah_Nar Ninja',
          cafe_address: 'دكرنس المنصوره الدقهليه',
          cafe_phone: '01066209693',
          currency: 'جنيه مصري',
          currency_symbol: 'ج.م',
          tax_rate: '15',
          receipt_header: 'أهلاً وسهلاً بكم في Abdullah_Nar Ninja',
          receipt_footer: 'شكراً لتعاملكم معنا ☕',
          paper_size: '80mm',
          theme: 'light',
          language: 'ar',
          printer_name: '',
          auto_print: '0',
          sound_enabled: '1'
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
          await new Promise<void>((resolve, reject) => {
            db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }

        return {
          success: true
        };
      } catch (error) {
        log.error('Settings reset error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إعادة تعيين الإعدادات'
        };
      }
    });

    // معالج اختيار الصورة
    ipcMain.handle('fs:selectImage', async (event) => {
      try {
        const result = await dialog.showOpenDialog({
          title: 'اختر صورة المنتج',
          buttonLabel: 'اختيار',
          filters: [
            { name: 'الصور', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
            { name: 'جميع الملفات', extensions: ['*'] }
          ],
          properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const filePath = result.filePaths[0];
          
          // قراءة الملف وتحويله إلى base64
          const imageBuffer = fs.readFileSync(filePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = getMimeType(filePath);
          
          const dataUrl = `data:${mimeType};base64,${base64Image}`;
          
          return {
            success: true,
            data: dataUrl
          };
        } else {
          return {
            success: false,
            error: 'لم يتم اختيار أي ملف'
          };
        }
      } catch (error) {
        log.error('Select image error:', error);
        return {
          success: false,
          error: 'حدث خطأ في اختيار الصورة'
        };
      }
    });

    // دالة مساعدة لتحديد نوع MIME
    function getMimeType(filePath: string): string {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      return mimeTypes[ext] || 'image/jpeg';
    }

    // معالج إنشاء نافذة طباعة منفصلة
    ipcMain.handle('print:createWindow', async (event, htmlContent: string) => {
      try {
        // إنشاء نافذة طباعة منفصلة بحجم ثابت وعادي
        const printWindow = new BrowserWindow({
          width: 800,
          height: 600,
          minWidth: 600,
          minHeight: 400,
          maxWidth: 1200,
          maxHeight: 900,
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: true
          },
          fullscreen: false, // تأكد من أنها ليست ملء الشاشة
          kiosk: false, // تأكد من أنها ليست في وضع الكيوسك
          alwaysOnTop: false, // لا تكون دائماً في المقدمة
          skipTaskbar: false, // تظهر في شريط المهام
          resizable: true,
          minimizable: true,
          maximizable: true,
          center: true, // توسيط النافذة على الشاشة
          title: 'فاتورة الطلب - Tesla Cafe',
          icon: path.join(__dirname, '../../assets/icon.png'),
          autoHideMenuBar: true, // إخفاء شريط القوائم
          titleBarStyle: 'default'
        });

        // تحميل المحتوى
        printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
        
        // إظهار النافذة عند الانتهاء من التحميل
        printWindow.once('ready-to-show', () => {
          // تأكد من أن النافذة ليست ملء الشاشة
          if (printWindow.isFullScreen()) {
            printWindow.setFullScreen(false);
          }
          
          // تأكد من أن النافذة ليست في وضع الكيوسك
          if (printWindow.isKiosk()) {
            printWindow.setKiosk(false);
          }
          
          // تعيين الحجم النهائي
          printWindow.setSize(800, 600);
          printWindow.center();
          printWindow.show();
          printWindow.focus();
        });

        // إضافة معالج لضمان عدم تغيير حالة النافذة
        printWindow.on('enter-full-screen', () => {
          printWindow.setFullScreen(false);
        });

        printWindow.on('enter-html-full-screen', () => {
          printWindow.setFullScreen(false);
        });

        // إضافة معالج لضمان عدم تغيير حجم النافذة بشكل كبير
        printWindow.on('resize', () => {
          const [width, height] = printWindow.getSize();
          if (width > 1200 || height > 900) {
            printWindow.setSize(800, 600);
            printWindow.center();
          }
        });

        // إضافة معالج لضمان عدم تغيير موضع النافذة بشكل كبير
        printWindow.on('move', () => {
          // لا نعيد التوسيط هنا لتجنب التداخل مع المستخدم
        });

        // إضافة معالج لضمان عدم تغيير حالة النافذة عند التركيز
        printWindow.on('focus', () => {
          if (printWindow.isFullScreen()) {
            printWindow.setFullScreen(false);
          }
        });

        // إضافة معالج لضمان عدم تغيير حالة النافذة عند الإظهار
        printWindow.on('show', () => {
          if (printWindow.isFullScreen()) {
            printWindow.setFullScreen(false);
          }
        });

        // إضافة معالج لضمان عدم تغيير حالة النافذة عند التحميل
        printWindow.webContents.on('dom-ready', () => {
          if (printWindow.isFullScreen()) {
            printWindow.setFullScreen(false);
          }
          printWindow.setSize(800, 600);
          printWindow.center();
        });

        // إضافة معالج لضمان عدم تغيير حالة النافذة عند التحميل الكامل
        printWindow.webContents.on('did-finish-load', () => {
          if (printWindow.isFullScreen()) {
            printWindow.setFullScreen(false);
          }
          printWindow.setSize(800, 600);
          printWindow.center();
        });

        return {
          success: true,
          data: {
            message: 'تم إنشاء نافذة الطباعة'
          }
        };
      } catch (error) {
        log.error('Create print window error:', error);
        return {
          success: false,
          error: 'حدث خطأ في إنشاء نافذة الطباعة'
        };
      }
    });



    log.info('Simple IPC handlers setup successfully');
  } catch (error) {
    log.error('Failed to setup simple IPC handlers:', error);
    throw error;
  }
}
