import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { applyStoredTheme } from '@/lib/utils';
import { useAuth } from '@/store/useAuth';
import { useSettings } from '@/store/useSettings';
import { useTranslation } from '@/hooks/useTranslation';

// Components
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

// Pages
import Login from '@/routes/Login';
import Dashboard from '@/routes/Dashboard';
import Products from '@/routes/Products';
import Orders from '@/routes/Orders';
import Users from '@/routes/Users';
import Reports from '@/routes/Reports';
import Settings from '@/routes/Settings';

// تعريف نوع الواجهة الإلكترونية
declare global {
  interface Window {
    electronAPI: any;
  }
}

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { settings, loadSettings } = useSettings();
  const { t, isRTL } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // تطبيق الثيم المحفوظ
    applyStoredTheme();
    // تحميل الإعدادات
    loadSettings();
  }, [loadSettings]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // إذا لم يتم تسجيل الدخول، اعرض صفحة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <Router>
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL() ? 'rtl' : 'ltr'}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex ${isRTL() ? 'rtl' : 'ltr'}`}>
        {/* الشريط الجانبي */}
        <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
        
        {/* المحتوى الرئيسي */}
        <div className="flex-1 flex flex-col lg:mr-64">
          {/* الهيدر */}
          <Header onMenuToggle={handleSidebarToggle} />
          
          {/* محتوى الصفحة */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              {/* صفحة إدارة المستخدمين للمدير فقط */}
              {user?.role === 'admin' && (
                <Route path="/users" element={<Users />} />
              )}
              
              {/* صفحات متاحة للجميع */}
              <Route path="/products" element={<Products />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/orders" element={<Orders />} />
              
              {/* إعادة توجيه للصفحة الرئيسية */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        
        {/* مكون الإشعارات */}
        <Toaster />
      </div>
    </Router>
  );
};

export default App;
