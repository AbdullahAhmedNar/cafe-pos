import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  Filter,
  RefreshCw,
  FileText,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateGregorian } from '@/lib/utils';
import { showToast } from '@/hooks/use-toast';
import { OverviewData } from '@/types/electron';
import { useSettings } from '../store/useSettings';

interface SalesData {
  period: string;
  orders_count: number;
  total_sales: number;
  total_discount: number;
  total_tax: number;
  avg_order_value: number;
}

interface TopProduct {
  name: string;
  sku: string;
  category: string;
  total_sold: number;
  total_revenue: number;
  orders_count: number;
}

interface DailySummary {
  date: string;
  summary: {
    total_sales: number;
    orders_count: number;
    avg_order_value: number;
    total_discount: number;
    total_tax: number;
  };
  paymentMethods: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
  topProducts: Array<{
    name: string;
    sku: string;
    category: string;
    quantity_sold: number;
    total_revenue: number;
  }>;
  customers: {
    unique_customers: number;
    total_orders: number;
  };
}

const Reports: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'products' | 'daily'>('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    console.log('Reports component mounted');
    loadReportsData();
    
    // مستمع لتحديث التقارير عند إنشاء طلب جديد
    const handleOrderCreated = () => {
      console.log('🔄 Order created event received, updating reports...');
      // تأخير قصير للتأكد من تحديث قاعدة البيانات
      setTimeout(() => {
        loadReportsData();
      }, 500);
    };
    
    // مستمع لتحديث التقارير عند تحديث المنتجات
    const handleProductUpdated = () => {
      console.log('🔄 Product updated event received, updating reports...');
      setTimeout(() => {
        loadReportsData();
      }, 500);
    };
    
    // إضافة مستمعات الأحداث
    window.addEventListener('orderCreated', handleOrderCreated);
    window.addEventListener('productUpdated', handleProductUpdated);
    
    // تحديث تلقائي كل دقيقة
    const autoUpdateInterval = setInterval(() => {
      console.log('🔄 Auto-updating reports...');
      loadReportsData();
    }, 60000);
    
    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated);
      window.removeEventListener('productUpdated', handleProductUpdated);
      clearInterval(autoUpdateInterval);
    };
  }, []);

  useEffect(() => {
    console.log('Date range changed:', dateRange);
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading reports data...');
      
      // جلب الإحصائيات الشاملة
      const overviewResponse = await window.electronAPI.reports.overview(dateRange);
      console.log('Overview response:', overviewResponse);
      
      if (overviewResponse.success) {
        setOverviewData(overviewResponse.data);
      } else {
        console.error('Overview response error:', overviewResponse.error);
        setOverviewData(null);
      }
      
      // جلب بيانات المبيعات
      const salesResponse = await window.electronAPI.reports.sales({
        from: dateRange.from,
        to: dateRange.to,
        groupBy: 'day'
      });
      
      console.log('Sales response:', salesResponse);
      
      if (salesResponse.success) {
        setSalesData(salesResponse.data || []);
      } else {
        console.error('Sales response error:', salesResponse.error);
        setSalesData([]);
      }

      // جلب أكثر المنتجات مبيعاً
      const topProductsResponse = await window.electronAPI.reports.topProducts(10);
      console.log('Top products response:', topProductsResponse);
      
      if (topProductsResponse.success) {
        setTopProducts(topProductsResponse.data || []);
      } else {
        console.error('Top products response error:', topProductsResponse.error);
        setTopProducts([]);
      }

      // جلب ملخص اليوم
      const dailySummaryResponse = await window.electronAPI.reports.dailySummary();
      console.log('Daily summary response:', dailySummaryResponse);
      
      if (dailySummaryResponse.success) {
        setDailySummary(dailySummaryResponse.data);
      } else {
        console.error('Daily summary response error:', dailySummaryResponse.error);
        setDailySummary(null);
      }

    } catch (error) {
      console.error('Error loading reports data:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(errorMessage);
      showToast.error('خطأ', 'فشل في تحميل بيانات التقارير');
      setSalesData([]);
      setTopProducts([]);
      setDailySummary(null);
      setOverviewData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      showToast.info('جاري إنشاء التقرير...', 'يرجى الانتظار');
      
      // إنشاء HTML للتقرير
      const htmlContent = generateReportHTML();
      
      // استخدام نافذة Electron منفصلة للطباعة
      const response = await window.electronAPI.printer.createPrintWindow(htmlContent);
      
      if (response.success) {
        showToast.success('تم إنشاء التقرير', 'سيتم فتح نافذة الطباعة');
      } else {
        showToast.error('خطأ في إنشاء التقرير', response.error || 'فشل في إنشاء التقرير');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showToast.error('خطأ في إنشاء التقرير', 'حدث خطأ أثناء إنشاء التقرير');
    }
  };

  const generateReportHTML = () => {
    // جلب إعدادات الكافيه
    const { settings } = useSettings.getState();
    const cafeName = settings.cafe_name || 'Tesla Cafe POS';
    const cafeAddress = settings.cafe_address || 'نظام إدارة نقاط البيع';

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

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير المبيعات - ${cafeName}</title>
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
            <div class="cafe-name">${cafeName}</div>
            <div class="cafe-address">${cafeAddress}</div>
        </div>
        
        <div class="receipt-header">
            تقرير المبيعات الشامل
        </div>
        
        <div class="report-info">
            <div class="info-row">
                <span class="info-label">فترة التقرير:</span>
                <span class="info-value">من ${dateRange.from} إلى ${dateRange.to}</span>
            </div>
            <div class="info-row">
                <span class="info-label">تاريخ الإنشاء:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-US')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">وقت الإنشاء:</span>
                <span class="info-value">${new Date().toLocaleTimeString('en-US')}</span>
            </div>
        </div>
        
        <div class="stats-section">
            <div class="stats-title">الإحصائيات الرئيسية</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${overviewData?.salesOverview?.total_sales?.toFixed(2) || '0.00'}</div>
                    <div class="stat-label">إجمالي المبيعات (ج.م)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${overviewData?.salesOverview?.total_orders || '0'}</div>
                    <div class="stat-label">عدد الطلبات</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${overviewData?.salesOverview?.avg_order_value?.toFixed(2) || '0.00'}</div>
                    <div class="stat-label">متوسط قيمة الطلب (ج.م)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${overviewData?.salesOverview?.unique_customers || '0'}</div>
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
            <div class="thank-you">شكراً</div>
        </div>
    </div>
</body>
</html>`;
  };





  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'card': return 'بطاقة';
      case 'wallet': return 'محفظة';
      default: return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'card': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'wallet': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cafe-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">جاري تحميل التقارير...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              حدث خطأ في تحميل التقارير
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button 
              onClick={() => {
                setError(null);
                loadReportsData();
              }}
              className="bg-cafe-500 hover:bg-cafe-600"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            التقارير والإحصائيات
          </h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleExportPDF}
            className="bg-gradient-to-r from-cafe-500 to-cafe-600 hover:from-cafe-600 hover:to-cafe-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <FileText className="h-4 w-4 mr-2" />
            تحميل التقرير PDF
          </Button>
          

          
          <Button onClick={loadReportsData} className="bg-cafe-500 hover:bg-cafe-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* فلتر التاريخ */}
      <Card className="border-2 border-cafe-100 dark:border-cafe-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4 inline mr-1" />
                من تاريخ:
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Calendar className="h-4 w-4 inline mr-1" />
                إلى تاريخ:
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4 inline mr-1" />
                نطاق سريع:
              </label>
              <select
                onChange={(e) => {
                  const today = new Date();
                  let from = new Date();
                  
                  switch (e.target.value) {
                    case '7':
                      from.setDate(today.getDate() - 7);
                      break;
                    case '30':
                      from.setDate(today.getDate() - 30);
                      break;
                    case '90':
                      from.setDate(today.getDate() - 90);
                      break;
                    default:
                      from.setDate(today.getDate() - 30);
                  }
                  
                  setDateRange({
                    from: from.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="7">آخر 7 أيام</option>
                <option value="30" selected>آخر 30 يوم</option>
                <option value="90">آخر 90 يوم</option>
              </select>
            </div>

            <div>
              <Button onClick={loadReportsData} className="w-full bg-cafe-500 hover:bg-cafe-600">
                <Activity className="h-4 w-4 mr-2" />
                تحديث التقرير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تبويبات التقارير */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-700 text-cafe-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-white dark:bg-gray-700 text-cafe-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4 inline mr-2" />
          المبيعات
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-white dark:bg-gray-700 text-cafe-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          المنتجات
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-white dark:bg-gray-700 text-cafe-600 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          ملخص اليوم
        </button>
      </div>

      {/* محتوى التبويبات */}
      {activeTab === 'overview' && overviewData && (
        <div className="space-y-6">
      {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      إجمالي المبيعات
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(overviewData.salesOverview.total_sales)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {overviewData.salesOverview.total_orders} طلب
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      متوسط قيمة الطلب
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(overviewData.salesOverview.avg_order_value)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {overviewData.salesOverview.unique_customers} عميل
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      المنتجات المباعة
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {overviewData.productsOverview.total_items_sold}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {overviewData.productsOverview.total_products} منتج
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      إجمالي الخصم
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(overviewData.salesOverview.total_discount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(overviewData.salesOverview.total_tax)} ضريبة
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <Award className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* طرق الدفع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-cafe-500" />
                  طرق الدفع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overviewData.paymentOverview.length > 0 ? (
                  <div className="space-y-4">
                    {overviewData.paymentOverview.map((method, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            method.payment_method === 'cash' ? 'bg-green-500' :
                            method.payment_method === 'card' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {getPaymentMethodName(method.payment_method)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {method.count} طلب ({method.percentage}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-cafe-600">
                            {formatCurrency(method.total_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بيانات طرق دفع</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* فئات المنتجات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-cafe-500" />
                  فئات المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overviewData.categoriesOverview.length > 0 ? (
                  <div className="space-y-4">
                    {overviewData.categoriesOverview.slice(0, 8).map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-cafe-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {category.category}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {category.products_count} منتج | {category.items_sold} قطعة
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-cafe-600">
                            {formatCurrency(category.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بيانات فئات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* إحصائيات المبيعات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  إجمالي المبيعات
                </p>
                <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salesData.reduce((sum, day) => sum + day.total_sales, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  عدد الطلبات
                </p>
                <p className="text-2xl font-bold text-blue-600">
                      {salesData.reduce((sum, day) => sum + day.orders_count, 0)}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  متوسط قيمة الطلب
                </p>
                <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(salesData.reduce((sum, day) => sum + day.avg_order_value, 0) / Math.max(salesData.length, 1))}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* مبيعات آخر 7 أيام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-cafe-500" />
              المبيعات اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <div className="space-y-3">
                {salesData.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDateGregorian(day.period)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {day.orders_count} طلب
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-cafe-600">
                        {formatCurrency(day.total_sales)}
                      </p>
                      {day.total_discount > 0 && (
                        <p className="text-sm text-red-500">
                          خصم: {formatCurrency(day.total_discount)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بيانات مبيعات للفترة المحددة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* أكثر المنتجات مبيعاً */}
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-cafe-500" />
                أكثر المنتجات مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.slice(0, 10).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-cafe-500 text-white'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product.sku} | {product.category}
                          </p>
                          <p className="text-xs text-gray-400">
                            {product.total_sold} قطعة | {product.orders_count} طلب
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-cafe-600 text-lg">
                          {formatCurrency(product.total_revenue)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.total_sold} قطعة
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات مبيعات للفترة المحددة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'daily' && dailySummary && (
        <div className="space-y-6">
          {/* ملخص اليوم */}
          <Card className="border-2 border-cafe-200 dark:border-cafe-700">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-cafe-500" />
              ملخص اليوم - {formatDateGregorian(dailySummary.date)}
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* إحصائيات عامة */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                  الإحصائيات العامة
                </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-gray-600 dark:text-gray-400">المبيعات:</span>
                    <span className="font-semibold text-green-600">
                        {formatCurrency(dailySummary.summary.total_sales)}
                    </span>
                  </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-gray-600 dark:text-gray-400">الطلبات:</span>
                      <span className="font-semibold text-blue-600">
                        {dailySummary.summary.orders_count}
                    </span>
                  </div>
                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <span className="text-gray-600 dark:text-gray-400">متوسط الطلب:</span>
                      <span className="font-semibold text-purple-600">
                        {formatCurrency(dailySummary.summary.avg_order_value)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <span className="text-gray-600 dark:text-gray-400">العملاء:</span>
                      <span className="font-semibold text-orange-600">
                        {dailySummary.customers.total_orders}
                    </span>
                  </div>
                </div>
              </div>

              {/* طرق الدفع */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <PieChartIcon className="h-4 w-4 mr-2" />
                  طرق الدفع
                </h3>
                <div className="space-y-2">
                    {dailySummary.paymentMethods?.map((method, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">
                          {getPaymentMethodName(method.payment_method)}:
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(method.total)} ({method.count})
                      </span>
                    </div>
                  )) || <p className="text-gray-500">لا توجد بيانات</p>}
                </div>
              </div>

              {/* أكثر المنتجات مبيعاً اليوم */}
              <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                  أكثر المنتجات مبيعاً اليوم
                </h3>
                <div className="space-y-2">
                    {dailySummary.topProducts?.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <span className="text-gray-600 dark:text-gray-400 truncate">
                        {product.name}
                      </span>
                      <span className="font-semibold">
                        {product.quantity_sold}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">لا توجد بيانات</p>}
                </div>
              </div>

                {/* ملخص سريع */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    ملخص سريع
                  </h3>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-cafe-50 dark:bg-cafe-900/20 rounded">
                      <p className="text-2xl font-bold text-cafe-600">
                        {dailySummary.summary.orders_count}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">طلب اليوم</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(dailySummary.summary.total_sales)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">مبيعات اليوم</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="text-2xl font-bold text-blue-600">
                        {dailySummary.customers.unique_customers}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">عميل فريد (أكثر من 500 ج.م)</p>
                    </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* رسالة في حالة عدم وجود بيانات */}
      {(!overviewData || (overviewData.salesOverview.total_sales === 0 && overviewData.salesOverview.total_orders === 0)) && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد بيانات تقارير
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              لم يتم العثور على أي مبيعات أو طلبات للفترة المحددة. 
              تأكد من وجود طلبات في النظام أو جرب تغيير نطاق التاريخ.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setDateRange({
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0]
              })}>
                آخر 7 أيام
              </Button>
              <Button variant="outline" onClick={() => setDateRange({
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0]
              })}>
                آخر 30 يوم
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
