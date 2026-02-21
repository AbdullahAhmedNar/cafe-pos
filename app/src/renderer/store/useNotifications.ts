import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/components/NotificationsPanel';

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notificationData) => {
        const newNotification: Notification = {
          ...notificationData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // حفظ آخر 50 إشعار فقط
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          ),
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        }));
      },
      
      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      getUnreadCount: () => {
        return get().notifications.filter((notification) => !notification.read).length;
      },
    }),
    {
      name: 'notifications-storage',
    }
  )
);

// دالة مساعدة لإنشاء إشعارات تلقائية
export const createSystemNotification = (
  type: Notification['type'],
  title: string,
  message: string,
  action?: Notification['action']
) => {
  const { addNotification } = useNotifications.getState();
  addNotification({
    type,
    title,
    message,
    action,
  });
};

// إشعارات تلقائية للنظام
export const createLowStockNotification = (productName: string, currentStock: number) => {
  createSystemNotification(
    'warning',
    'منتج منخفض المخزون',
    `المنتج "${productName}" يحتوي على ${currentStock} قطعة فقط في المخزون`,
    {
      label: 'عرض المنتجات',
      path: '/products',
    }
  );
};

export const createOrderNotification = (orderNumber: string, total: number) => {
  createSystemNotification(
    'success',
    'طلب جديد',
    `تم إنشاء طلب جديد برقم ${orderNumber} بقيمة ${total} ج.م`,
    {
      label: 'عرض الطلبات',
      path: '/orders',
    }
  );
};

export const createSalesNotification = (todaySales: number, ordersCount: number) => {
  createSystemNotification(
    'info',
    'تقرير المبيعات اليومية',
    `تم إنجاز ${ordersCount} طلب بمبيعات إجمالية ${todaySales} ج.م اليوم`,
    {
      label: 'عرض التقارير',
      path: '/reports',
    }
  );
};
