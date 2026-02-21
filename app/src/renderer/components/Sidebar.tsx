import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Coffee,
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/useAuth';
import { useSettings } from '@/store/useSettings';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings, loadSettings } = useSettings();

  // تحميل الإعدادات عند تحميل المكون
  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const menuItems = [
    {
      title: 'لوحة التحكم',
      icon: LayoutDashboard,
      path: '/',
      roles: ['admin', 'cashier']
    },
    {
      title: 'إدارة المنتجات',
      icon: Package,
      path: '/products',
      roles: ['admin', 'cashier']
    },
    {
      title: 'نقطة البيع',
      icon: ShoppingCart,
      path: '/orders',
      roles: ['admin', 'cashier']
    },
    {
      title: 'إدارة المستخدمين',
      icon: Users,
      path: '/users',
      roles: ['admin']
    },
    {
      title: 'التقارير',
      icon: BarChart3,
      path: '/reports',
      roles: ['admin', 'cashier']
    },
    {
      title: 'الإعدادات',
      icon: Settings,
      path: '/settings',
      roles: ['admin', 'cashier']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'cashier')
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* خلفية مظلمة للموبايل */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* الشريط الجانبي */}
      <div className={cn(
        "sidebar-fixed bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* رأس الشريط الجانبي */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-cafe-500 rounded-lg">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {settings.cafe_name || 'كافيه بوز'}
              </h1>
            </div>
          </div>
          
          {/* زر الإغلاق للموبايل */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggle}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* معلومات المستخدم */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-cafe-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? 'مدير النظام' : 'كاشير'}
              </p>
            </div>
          </div>
        </div>

        {/* قائمة التنقل */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg transition-colors duration-200",
                      isActive 
                        ? "bg-cafe-500 text-white shadow-md" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
