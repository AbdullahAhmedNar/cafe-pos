import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Package, 
  ShoppingCart,
  TrendingUp,
  Clock,
  Trash2
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date | string;
  read: boolean;
  action?: {
    label: string;
    path: string;
  };
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll
}) => {
  const navigate = useNavigate();
  
  // التأكد من أن notifications مصفوفة صالحة
  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => n && !n.read).length;
  
  console.log('NotificationsPanel render:', {
    isOpen,
    notificationsCount: safeNotifications.length,
    unreadCount,
    notifications: safeNotifications
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    try {
      const now = new Date();
      const targetDate = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(targetDate.getTime())) {
        return 'الآن';
      }
      
      const diffInMinutes = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'الآن';
      if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
      if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
      return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'الآن';
    }
  };

  if (!isOpen) return null;

  try {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <Card className="w-96 max-h-[80vh] overflow-hidden shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cafe-500" />
              الإشعارات
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {safeNotifications.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                تحديد الكل كمقروء
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-700"
              >
                مسح الكل
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {safeNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                لا توجد إشعارات جديدة
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {safeNotifications.map((notification) => {
                // التأكد من أن الإشعار له البيانات المطلوبة
                if (!notification || !notification.id) {
                  return null;
                }
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                                             {notification.action && (
                         <Button
                           variant="outline"
                           size="sm"
                           className="mt-2 text-xs"
                           onClick={() => {
                             onMarkAsRead(notification.id);
                             navigate(notification.action.path);
                             onClose();
                           }}
                         >
                           {notification.action.label}
                         </Button>
                       )}
                    </div>
                  </div>
                </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    console.error('Error rendering NotificationsPanel:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <Card className="w-96 p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              خطأ في تحميل الإشعارات
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              حدث خطأ أثناء عرض الإشعارات
            </p>
            <Button onClick={onClose} variant="outline">
              إغلاق
            </Button>
          </div>
        </Card>
      </div>
    );
  }
};

export default NotificationsPanel;
