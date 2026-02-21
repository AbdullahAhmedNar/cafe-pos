import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  // Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/hooks/use-toast';
import { createSalesNotification, useNotifications } from '@/store/useNotifications';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  totalProducts: number;
  lowStockCount: number;
  weekSales: number;
  monthSales: number;
  salesGrowth: number;
  ordersGrowth: number;
  avgOrderValue: number;
  totalDiscount: number;
  totalProductsSold: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    lowStockCount: 0,
    weekSales: 0,
    monthSales: 0,
    salesGrowth: 0,
    ordersGrowth: 0,
    avgOrderValue: 0,
    totalDiscount: 0,
    totalProductsSold: 0
  });
  
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // دالة تحديث البيانات مع إعادة المحاولة
  const loadDashboardData = useCallback(async (retryCount = 0) => {
    try {
      if (retryCount === 0) {
        setIsLoading(true);
      } else {
        setIsUpdating(true);
      }
      console.log('Loading dashboard data...');
      
      // جلب ملخص اليوم مع الإحصائيات التفصيلية
      console.log('Fetching daily summary...');
      try {
        const dailySummaryResponse = await window.electronAPI.reports.dailySummary();
        console.log('Daily summary response:', dailySummaryResponse);
        
        if (dailySummaryResponse.success && dailySummaryResponse.data) {
          const { summary } = dailySummaryResponse.data;
          console.log('Summary data:', summary);
          
          // حساب متوسط قيمة الطلب
          const avgOrderValue = summary.orders_count > 0 ? summary.total_sales / summary.orders_count : 0;
          
          setStats(prev => ({
            ...prev,
            todaySales: summary.total_sales || 0,
            todayOrders: summary.orders_count || 0,
            avgOrderValue: avgOrderValue,
            totalDiscount: summary.total_discount || 0,
            totalProductsSold: summary.total_items_sold || 0,
            salesGrowth: Math.random() * 20 - 10, // مؤقت - يجب حساب النمو الفعلي
            ordersGrowth: Math.random() * 15 - 5
          }));
          
          // إضافة إشعار للمبيعات اليومية إذا كانت هناك مبيعات
          if (summary.total_sales > 0 && summary.orders_count > 0) {
            createSalesNotification(summary.total_sales, summary.orders_count);
          }
        } else {
          console.error('Daily summary failed:', dailySummaryResponse.error);
        }
      } catch (error) {
        console.error('Daily summary error:', error);
      }

      // جلب بيانات المنتجات
      console.log('Fetching products data...');
      try {
        const productsResponse = await window.electronAPI.products.list();
        console.log('Products response:', productsResponse);
        
        if (productsResponse.success) {
          const products = productsResponse.data || [];
          const lowStockProducts = products.filter((p: any) => p.stock <= 10);
          
          setStats(prev => ({
            ...prev,
            totalProducts: products.length,
            lowStockCount: lowStockProducts.length
          }));
        } else {
          console.error('Products fetch failed:', productsResponse.error);
        }
      } catch (error) {
        console.error('Products fetch error:', error);
      }

      // جلب أكثر المنتجات مبيعاً
      console.log('Fetching top products...');
      try {
        const topProductsResponse = await window.electronAPI.reports.topProducts(5);
        console.log('Top products response:', topProductsResponse);
        
        if (topProductsResponse.success) {
          const topProductsData = topProductsResponse.data || [];
          setTopProducts(topProductsData.map((product: any) => ({
            name: product.name,
            quantity: product.total_sold,
            revenue: product.total_revenue
          })));
        } else {
          console.error('Top products fetch failed:', topProductsResponse.error);
        }
      } catch (error) {
        console.error('Top products fetch error:', error);
      }

      // جلب إحصائيات الأسبوع والشهر
      try {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weekSalesResponse = await window.electronAPI.reports.sales({
          from: weekAgo.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
          groupBy: 'day'
        });
        
        const monthSalesResponse = await window.electronAPI.reports.sales({
          from: monthAgo.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
          groupBy: 'day'
        });
        
        if (weekSalesResponse.success && weekSalesResponse.data) {
          const weekTotal = weekSalesResponse.data.reduce((sum: number, day: any) => sum + day.total_sales, 0);
          setStats(prev => ({ ...prev, weekSales: weekTotal }));
        }
        
        if (monthSalesResponse.success && monthSalesResponse.data) {
          const monthTotal = monthSalesResponse.data.reduce((sum: number, day: any) => sum + day.total_sales, 0);
          setStats(prev => ({ ...prev, monthSales: monthTotal }));
        }
      } catch (error) {
        console.error('Weekly/Monthly sales error:', error);
      }
      
      setLastUpdate(new Date());
      console.log('Dashboard loaded with comprehensive data');

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (retryCount < 3) {
        setTimeout(() => loadDashboardData(retryCount + 1), 1000);
        return;
      }
      showToast.error('خطأ', 'فشل في تحميل بيانات لوحة التحكم');
    } finally {
      console.log('Dashboard loading completed');
      setIsLoading(false);
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // مستمع لتحديث الداشبورد عند إنشاء طلب جديد
    const handleOrderCreated = () => {
      console.log('🔄 Order created event received, updating dashboard...');
      // تأخير قصير للتأكد من تحديث قاعدة البيانات
      setTimeout(() => {
        loadDashboardData();
      }, 500);
    };
    
    // مستمع لتحديث الداشبورد عند تحديث المنتجات
    const handleProductUpdated = () => {
      console.log('🔄 Product updated event received, updating dashboard...');
      setTimeout(() => {
        loadDashboardData();
      }, 500);
    };
    
    // مستمع لتحديث الداشبورد عند تحديث المخزون
    const handleStockUpdated = () => {
      console.log('🔄 Stock updated event received, updating dashboard...');
      setTimeout(() => {
        loadDashboardData();
      }, 500);
    };
    
    // إضافة مستمعات الأحداث
    window.addEventListener('orderCreated', handleOrderCreated);
    window.addEventListener('productUpdated', handleProductUpdated);
    window.addEventListener('stockUpdated', handleStockUpdated);
    
    // تحديث تلقائي كل 30 ثانية
    const autoUpdateInterval = setInterval(() => {
      console.log('🔄 Auto-updating dashboard...');
      loadDashboardData();
    }, 30000);
    
    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated);
      window.removeEventListener('productUpdated', handleProductUpdated);
      window.removeEventListener('stockUpdated', handleStockUpdated);
      clearInterval(autoUpdateInterval);
    };
  }, [loadDashboardData]);

  const navigateToPage = (path: string) => {
    navigate(path);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    changeType, 
    color = 'blue',
    onClick,
    subtitle
  }: {
    title: string;
    value: string | number;
    icon: any;
    change?: number;
    changeType?: 'increase' | 'decrease';
    color?: string;
    onClick?: () => void;
    subtitle?: string;
  }) => (
    <Card 
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer hover:scale-105 transform transition-transform"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}% من الأمس
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${
            color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
            color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
            color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
            color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
            color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
            'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            <Icon className={`h-6 w-6 ${
              color === 'green' ? 'text-green-600 dark:text-green-400' :
              color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
              color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
              color === 'red' ? 'text-red-600 dark:text-red-400' :
              color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ترحيب مع آخر تحديث */}
      <div className="bg-gradient-to-r from-cafe-500 to-cafe-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              أهلاً وسهلاً بك في لوحة التحكم
            </h1>
            <p className="opacity-90">
              تاريخ اليوم: {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} | الوقت: {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm opacity-90">
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              آخر تحديث: {lastUpdate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
              {isUpdating && (
                <span className="ml-2 text-yellow-300">جاري التحديث...</span>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadDashboardData()}
              disabled={isUpdating}
              className="mt-2 text-white border-white hover:bg-white hover:text-cafe-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'جاري التحديث...' : 'تحديث'}
            </Button>
          </div>
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="مبيعات اليوم"
          value={formatCurrency(stats.todaySales)}
          icon={DollarSign}
          change={stats.salesGrowth}
          changeType={stats.salesGrowth >= 0 ? 'increase' : 'decrease'}
          color="green"
          onClick={() => navigateToPage('/reports')}
          subtitle={`${stats.todayOrders} طلب`}
        />
        
        <StatCard
          title="طلبات اليوم"
          value={stats.todayOrders}
          icon={ShoppingCart}
          change={stats.ordersGrowth}
          changeType={stats.ordersGrowth >= 0 ? 'increase' : 'decrease'}
          color="blue"
          onClick={() => navigateToPage('/orders')}
          subtitle={`متوسط: ${formatCurrency(stats.avgOrderValue)}`}
        />
        
        <StatCard
          title="المنتجات المباعة"
          value={stats.totalProductsSold}
          icon={Package}
          color="purple"
          onClick={() => navigateToPage('/reports')}
          subtitle={`${stats.totalProducts} منتج متاح`}
        />
        
        <StatCard
          title="إجمالي الخصم"
          value={formatCurrency(stats.totalDiscount)}
          icon={Award}
          color="orange"
          onClick={() => navigateToPage('/reports')}
          subtitle={`${stats.todayOrders} طلب`}
        />
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="مبيعات الأسبوع"
          value={formatCurrency(stats.weekSales)}
          icon={TrendingUp}
          color="green"
          onClick={() => navigateToPage('/reports')}
        />
        
        <StatCard
          title="مبيعات الشهر"
          value={formatCurrency(stats.monthSales)}
          icon={Target}
          color="blue"
          onClick={() => navigateToPage('/reports')}
        />
        
        <StatCard
          title="منتجات منخفضة المخزون"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color={stats.lowStockCount > 0 ? "red" : "green"}
          onClick={() => navigateToPage('/products')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* أكثر المنتجات مبيعاً */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => navigateToPage('/reports')}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-cafe-500" />
                أكثر المنتجات مبيعاً
              </span>
              <Activity className="h-4 w-4 text-cafe-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-cafe-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {product.quantity} قطعة مباعة
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-cafe-600">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد بيانات مبيعات حتى الآن</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* الإجراءات السريعة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-cafe-500" />
              الإجراءات السريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-cafe-50 hover:border-cafe-300 transition-all duration-200 hover:scale-105"
                onClick={() => navigateToPage('/orders')}
              >
                <ShoppingCart className="h-6 w-6 text-cafe-500" />
                <span>طلب جديد</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-cafe-50 hover:border-cafe-300 transition-all duration-200 hover:scale-105"
                onClick={() => navigateToPage('/products')}
              >
                <Package className="h-6 w-6 text-cafe-500" />
                <span>إدارة المنتجات</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-cafe-50 hover:border-cafe-300 transition-all duration-200 hover:scale-105"
                onClick={() => navigateToPage('/reports')}
              >
                <TrendingUp className="h-6 w-6 text-cafe-500" />
                <span>التقارير</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-cafe-50 hover:border-cafe-300 transition-all duration-200 hover:scale-105"
                onClick={() => navigateToPage('/settings')}
              >
                <Users className="h-6 w-6 text-cafe-500" />
                <span>الإعدادات</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تنبيهات المخزون */}
      {stats.lowStockCount > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-orange-500 mr-3" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-400">
                  تنبيه: منتجات منخفضة المخزون
                </h3>
                <p className="text-orange-700 dark:text-orange-300 mt-1">
                  يوجد {stats.lowStockCount} منتج بمخزون منخفض. يرجى إعادة التموين.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mr-auto border-orange-300 text-orange-700 hover:bg-orange-100 transition-all duration-200 hover:scale-105"
                onClick={() => navigateToPage('/products')}
              >
                عرض المنتجات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
