import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Moon, Sun, Bell, Calendar, Clock, BarChart3, Package, ShoppingCart, Users, Settings, Home } from 'lucide-react';
import { isDarkMode, toggleDarkMode } from '@/lib/utils';
import { useAuth } from '@/store/useAuth';
import { useLocation } from 'react-router-dom';
import { useSettings } from '@/store/useSettings';
import { useNotifications } from '@/store/useNotifications';
import NotificationsPanel from './NotificationsPanel';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [darkMode, setDarkMode] = React.useState(isDarkMode());
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [showNotifications, setShowNotifications] = React.useState(false);
  
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll, 
    getUnreadCount 
  } = useNotifications();

  const handleThemeToggle = () => {
    toggleDarkMode();
    setDarkMode(isDarkMode());
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationAction = (notificationId: string, path?: string) => {
    markAsRead(notificationId);
    if (path) {
      // سيتم إضافة التنقل هنا
      setShowNotifications(false);
    }
  };



  // تحديث الوقت كل ثانية
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تحديد أيقونة القسم حسب المسار
  const getSectionIcon = () => {
    switch (location.pathname) {
      case '/':
        return <Home className="h-6 w-6 text-cafe-500" />;
      case '/products':
        return <Package className="h-6 w-6 text-cafe-500" />;
      case '/orders':
        return <ShoppingCart className="h-6 w-6 text-cafe-500" />;
      case '/reports':
        return <BarChart3 className="h-6 w-6 text-cafe-500" />;
      case '/users':
        return <Users className="h-6 w-6 text-cafe-500" />;
      case '/settings':
        return <Settings className="h-6 w-6 text-cafe-500" />;
      default:
        return <Home className="h-6 w-6 text-cafe-500" />;
    }
  };

  return (
    <header className="header-fixed bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* الجانب الأيمن */}
      <div className="flex items-center space-x-4 space-x-reverse">
        {/* زر القائمة للموبايل */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* أيقونة القسم */}
        <div className="w-10 h-10 bg-cafe-100 dark:bg-cafe-900 rounded-lg flex items-center justify-center">
          {getSectionIcon()}
        </div>
      </div>

      {/* الجانب الأوسط - التاريخ والوقت */}
      <div className="hidden md:flex items-center justify-center flex-1">
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* التاريخ */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Calendar className="h-5 w-5 text-cafe-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>

          {/* خط فاصل */}
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* الوقت */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <Clock className="h-5 w-5 text-cafe-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentTime.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* الجانب الأيسر */}
      <div className="flex items-center space-x-2 space-x-reverse">


        {/* زر الإشعارات */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={handleNotificationClick}
        >
          <Bell className="h-5 w-5" />
          {/* نقطة الإشعارات */}
          {getUnreadCount() > 0 && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">
                {getUnreadCount() > 9 ? '9+' : getUnreadCount()}
              </span>
            </span>
          )}
        </Button>

        {/* زر تبديل الثيم */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
        >
          {darkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* معلومات المستخدم */}
        <div className="hidden sm:flex items-center space-x-3 space-x-reverse border-r border-gray-200 dark:border-gray-700 pr-4 mr-2">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role === 'admin' ? 'مدير النظام' : 'كاشير'}
            </p>
          </div>
          <div className="w-8 h-8 bg-cafe-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* لوحة الإشعارات */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        onClearAll={clearAll}
      />
    </header>
  );
};

export default Header;
