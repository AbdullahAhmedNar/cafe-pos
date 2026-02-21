import { useSettings } from '@/store/useSettings';

// ترجمات التطبيق
const translations = {
  ar: {
    // عام
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    reset: 'إعادة تعيين',
    confirm: 'تأكيد',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    info: 'معلومات',
    
    // تسجيل الدخول
    login: 'تسجيل الدخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    loginError: 'خطأ في تسجيل الدخول',
    invalidCredentials: 'بيانات غير صحيحة',
    
    // لوحة التحكم
    dashboard: 'لوحة التحكم',
    totalSales: 'إجمالي المبيعات',
    totalOrders: 'إجمالي الطلبات',
    totalProducts: 'إجمالي المنتجات',
    todaySales: 'مبيعات اليوم',
    todayOrders: 'طلبات اليوم',
    topProducts: 'أفضل المنتجات',
    recentOrders: 'آخر الطلبات',
    
    // المنتجات
    products: 'المنتجات',
    addProduct: 'إضافة منتج',
    editProduct: 'تعديل منتج',
    productName: 'اسم المنتج',
    productPrice: 'سعر المنتج',
    productCategory: 'تصنيف المنتج',
    productImage: 'صورة المنتج',
    productSKU: 'رمز المنتج',
    productStock: 'المخزون',
    productActive: 'نشط',
    productInactive: 'غير نشط',
    generateSKU: 'إنشاء رمز',
    selectImage: 'اختيار صورة',
    removeImage: 'إزالة الصورة',
    showInactiveProducts: 'عرض المنتجات غير النشطة',
    categories: {
      hotDrinks: 'مشروبات ساخنة',
      coldDrinks: 'مشروبات باردة',
      food: 'طعام',
      other: 'أخرى'
    },
    
    // الطلبات
    orders: 'الطلبات',
    newOrder: 'طلب جديد',
    orderNumber: 'رقم الطلب',
    orderDate: 'تاريخ الطلب',
    orderTotal: 'إجمالي الطلب',
    orderStatus: 'حالة الطلب',
    completeOrder: 'إتمام الطلب',
    printReceipt: 'طباعة الفاتورة',
    receipt: 'الفاتورة',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    total: 'الإجمالي',
    orderCashier: 'الكاشير',
    
    // المستخدمين
    users: 'المستخدمين',
    addUser: 'إضافة مستخدم',
    editUser: 'تعديل مستخدم',
    userName: 'اسم المستخدم',
    userRole: 'دور المستخدم',
    userPassword: 'كلمة المرور',
    admin: 'مدير',
    cashier: 'كاشير',
    
    // التقارير
    reports: 'التقارير',
    dailyReport: 'التقرير اليومي',
    salesReport: 'تقرير المبيعات',
    productsReport: 'تقرير المنتجات',
    ordersReport: 'تقرير الطلبات',
    
    // الإعدادات
    settings: 'الإعدادات',
    generalSettings: 'الإعدادات العامة',
    printSettings: 'إعدادات الطباعة',
    interfaceSettings: 'إعدادات الواجهة',
    language: 'اللغة',
    theme: 'المظهر',
    currency: 'العملة',
    taxRate: 'نسبة الضريبة',
    cafeName: 'اسم الكافيه',
    autoPrint: 'طباعة تلقائية',
    soundEnabled: 'تفعيل الصوت',
    darkMode: 'الوضع المظلم',
    lightMode: 'الوضع الفاتح',
    arabic: 'العربية',
    english: 'الإنجليزية',
    egyptianPound: 'جنيه مصري',
    dollar: 'دولار أمريكي',
    euro: 'يورو',
    
    // التنقل
    menu: 'القائمة',
    logout: 'تسجيل الخروج',
    
    // رسائل
    saveSuccess: 'تم الحفظ بنجاح',
    deleteSuccess: 'تم الحذف بنجاح',
    updateSuccess: 'تم التحديث بنجاح',
    confirmDelete: 'هل أنت متأكد من الحذف؟',
    confirmLogout: 'هل تريد تسجيل الخروج؟',
    noData: 'لا توجد بيانات',
    noProducts: 'لا توجد منتجات',
    noOrders: 'لا توجد طلبات',
    noUsers: 'لا يوجد مستخدمين',
    
    // أخطاء
    errorLoadingData: 'فشل في تحميل البيانات',
    errorSavingData: 'فشل في حفظ البيانات',
    errorDeletingData: 'فشل في حذف البيانات',
    errorCreatingOrder: 'حدث خطأ في إنشاء الطلب',
    errorPrintingReceipt: 'حدث خطأ في طباعة الفاتورة'
  },
  
  en: {
    // General
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    
    // Login
    login: 'Login',
    username: 'Username',
    password: 'Password',
    loginError: 'Login Error',
    invalidCredentials: 'Invalid credentials',
    
    // Dashboard
    dashboard: 'Dashboard',
    totalSales: 'Total Sales',
    totalOrders: 'Total Orders',
    totalProducts: 'Total Products',
    todaySales: 'Today Sales',
    todayOrders: 'Today Orders',
    topProducts: 'Top Products',
    recentOrders: 'Recent Orders',
    
    // Products
    products: 'Products',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    productPrice: 'Product Price',
    productCategory: 'Product Category',
    productImage: 'Product Image',
    productSKU: 'Product SKU',
    productStock: 'Stock',
    productActive: 'Active',
    productInactive: 'Inactive',
    generateSKU: 'Generate SKU',
    selectImage: 'Select Image',
    removeImage: 'Remove Image',
    showInactiveProducts: 'Show Inactive Products',
    categories: {
      hotDrinks: 'Hot Drinks',
      coldDrinks: 'Cold Drinks',
      food: 'Food',
      other: 'Other'
    },
    
    // Orders
    orders: 'Orders',
    newOrder: 'New Order',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    orderTotal: 'Order Total',
    orderStatus: 'Order Status',
    completeOrder: 'Complete Order',
    printReceipt: 'Print Receipt',
    receipt: 'Receipt',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    orderCashier: 'Cashier',
    
    // Users
    users: 'Users',
    addUser: 'Add User',
    editUser: 'Edit User',
    userName: 'User Name',
    userRole: 'User Role',
    userPassword: 'Password',
    admin: 'Admin',
    cashier: 'Cashier',
    
    // Reports
    reports: 'Reports',
    dailyReport: 'Daily Report',
    salesReport: 'Sales Report',
    productsReport: 'Products Report',
    ordersReport: 'Orders Report',
    
    // Settings
    settings: 'Settings',
    generalSettings: 'General Settings',
    printSettings: 'Print Settings',
    interfaceSettings: 'Interface Settings',
    language: 'Language',
    theme: 'Theme',
    currency: 'Currency',
    taxRate: 'Tax Rate',
    cafeName: 'Cafe Name',
    autoPrint: 'Auto Print',
    soundEnabled: 'Sound Enabled',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    arabic: 'Arabic',
    english: 'English',
    egyptianPound: 'Egyptian Pound',
    dollar: 'US Dollar',
    euro: 'Euro',
    
    // Navigation
    menu: 'Menu',
    logout: 'Logout',
    
    // Messages
    saveSuccess: 'Saved successfully',
    deleteSuccess: 'Deleted successfully',
    updateSuccess: 'Updated successfully',
    confirmDelete: 'Are you sure you want to delete?',
    confirmLogout: 'Do you want to logout?',
    noData: 'No data available',
    noProducts: 'No products available',
    noOrders: 'No orders available',
    noUsers: 'No users available',
    
    // Errors
    errorLoadingData: 'Failed to load data',
    errorSavingData: 'Failed to save data',
    errorDeletingData: 'Failed to delete data',
    errorCreatingOrder: 'Error creating order',
    errorPrintingReceipt: 'Error printing receipt'
  }
};

export const useTranslation = () => {
  const { settings } = useSettings();
  const currentLanguage = settings?.language || 'ar';

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage as keyof typeof translations];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Arabic if translation not found
        let fallbackValue: any = translations.ar;
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // Return key if translation not found
          }
        }
        value = fallbackValue;
        break;
      }
    }

    if (typeof value === 'string' && params) {
      return Object.entries(params).reduce((str, [key, val]) => {
        return str.replace(new RegExp(`{${key}}`, 'g'), String(val));
      }, value);
    }

    return value || key;
  };

  const isRTL = () => currentLanguage === 'ar';

  return { t, isRTL, currentLanguage };
};
