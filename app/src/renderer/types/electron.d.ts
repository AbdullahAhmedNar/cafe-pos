// تعريف أنواع الواجهة الإلكترونية
export interface ElectronAPI {
  // Users API
  users: {
    login: (credentials: { username: string; password: string }) => Promise<APIResponse<{ user: User; token: string }>>;
    create: (userData: any) => Promise<APIResponse<User>>;
    update: (id: number, userData: any) => Promise<APIResponse<null>>;
    delete: (id: number) => Promise<APIResponse<null>>;
    list: () => Promise<APIResponse<User[]>>;
  };

  // Products API
  products: {
    list: (filters?: { search?: string; category?: string; active?: boolean }) => Promise<APIResponse<Product[]>>;
    create: (product: ProductInput) => Promise<APIResponse<Product>>;
    update: (id: number, product: Partial<ProductInput>) => Promise<APIResponse<null>>;
    delete: (id: number) => Promise<APIResponse<null>>;
    updateStock: (id: number, quantity: number) => Promise<APIResponse<{ newStock: number }>>;
    getByBarcode: (sku: string) => Promise<APIResponse<Product>>;
    getCategories: () => Promise<APIResponse<string[]>>;
    getLowStock: (threshold?: number) => Promise<APIResponse<Product[]>>;
  };

  // Orders API
  orders: {
    create: (order: OrderInput) => Promise<APIResponse<{ orderId: number; orderNo: string; total: number; change: number }>>;
    list: (filters?: { from?: string; to?: string; limit?: number }) => Promise<APIResponse<Order[]>>;
    getById: (id: number) => Promise<APIResponse<OrderWithItems>>;
    print: (orderId: number) => Promise<APIResponse<any>>;
    generateOrderNumber: () => Promise<APIResponse<{ orderNo: string }>>;
  };

  // Reports API
  reports: {
    sales: (query: { from?: string; to?: string; groupBy?: 'day' | 'month' }) => Promise<APIResponse<SalesData[]>>;
    topProducts: (limit?: number) => Promise<APIResponse<TopProduct[]>>;
    dailySummary: (date?: string) => Promise<APIResponse<DailySummary>>;
    overview: (dateRange?: { from?: string; to?: string }) => Promise<APIResponse<OverviewData>>;
    exportToPDF: (data: any, type: string) => Promise<APIResponse<{ filename: string; path: string }>>;
    exportToCSV: (data: any, filename: string) => Promise<APIResponse<{ filename: string; path: string }>>;
    inventory: () => Promise<APIResponse<{ inventory: InventoryItem[]; summary: InventorySummary }>>;
    cashiers: (filters?: { from?: string; to?: string }) => Promise<APIResponse<CashierReport[]>>;
  };

  // Settings API
  settings: {
    get: (keys?: string[]) => Promise<APIResponse<Record<string, string>>>;
    set: (settings: Record<string, string>) => Promise<APIResponse<null>>;
    reset: () => Promise<APIResponse<null>>;
    getPrintSettings: () => Promise<APIResponse<Record<string, string>>>;
    setPrintSettings: (settings: Record<string, string>) => Promise<APIResponse<null>>;
    getTaxSettings: () => Promise<APIResponse<{ tax_rate: number }>>;
    setTaxRate: (rate: number) => Promise<APIResponse<null>>;
    getCurrencySettings: () => Promise<APIResponse<{ currency: string; currency_symbol: string }>>;
  };

  // Printer API
  printer: {
    getPrinters: () => Promise<APIResponse<PrinterInfo[]>>;
    printReceipt: (receiptData: any) => Promise<APIResponse<null>>;
    testPrint: (printerName: string) => Promise<APIResponse<null>>;
    createPrintWindow: (htmlContent: string) => Promise<APIResponse<null>>;
  };

  // File System API
  fs: {
    saveImage: (imageData: string, filename: string) => Promise<APIResponse<{ filename: string; path: string; size: number }>>;
    deleteImage: (filename: string) => Promise<APIResponse<null>>;
    getImagePath: (filename: string) => Promise<APIResponse<{ path: string | null; url: string | null; exists: boolean }>>;
    listImages: () => Promise<APIResponse<ImageFile[]>>;
    backupDatabase: () => Promise<APIResponse<{ filename: string; path: string; size: number }>>;
    listBackups: () => Promise<APIResponse<BackupFile[]>>;
    deleteBackup: (filename: string) => Promise<APIResponse<null>>;
    exportData: (data: any, filename: string) => Promise<APIResponse<{ filename: string; path: string; size: number }>>;
  };

  // App API
  app: {
    getVersion: () => Promise<APIResponse<AppInfo>>;
    quit: () => void;
    minimize: () => void;
    maximize: () => void;
    restart: () => void;
    getUserDataPath: () => Promise<APIResponse<{ userDataPath: string; documentsPath: string; desktopPath: string; downloadsPath: string }>>;
    getSystemInfo: () => Promise<APIResponse<SystemInfo>>;
    openDataFolder: () => Promise<APIResponse<null>>;
    openLogsFolder: () => Promise<APIResponse<null>>;
    cleanTempFiles: () => Promise<APIResponse<{ deletedCount: number }>>;
    getWindowState: () => Promise<APIResponse<WindowState>>;
    setWindowState: (state: WindowState) => Promise<APIResponse<null>>;
    checkForUpdates: () => Promise<APIResponse<UpdateInfo>>;
  };

  // File operations
  openFile: (filePath: string) => Promise<APIResponse<null>>;
  printReport: (filePath: string) => Promise<APIResponse<{ message: string }>>;

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
}

// أنواع البيانات الأساسية
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  is_active: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  price: number;
  category: string;
  sku: string;
  stock?: number;
  is_active?: number;
  image?: string;
}

export interface Order {
  id: number;
  order_no: string;
  date: string;
  total: number;
  discount: number;
  tax: number;
  paid: number;
  payment_method: 'cash' | 'card' | 'wallet';
  user_id: number;
  cashier_name?: string;
  items_count?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  qty: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
  sku?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderInput {
  items: {
    product_id: number;
    qty: number;
    unit_price: number;
  }[];
  discount?: number;
  tax?: number;
  paid: number;
  payment_method: 'cash' | 'card' | 'wallet';
}

export interface SalesData {
  period: string;
  orders_count: number;
  total_sales: number;
  total_discount: number;
  total_tax: number;
  avg_order_value: number;
}

export interface TopProduct {
  name: string;
  sku: string;
  category: string;
  total_sold: number;
  total_revenue: number;
  orders_count: number;
}

export interface DailySummary {
  date: string;
  summary: {
    orders_count: number;
    total_sales: number;
    total_discount: number;
    total_tax: number;
    avg_order_value: number;
    min_order: number;
    max_order: number;
    total_items_sold: number;
  };
  paymentMethods: {
    payment_method: string;
    count: number;
    total: number;
  }[];
  hourlySales: {
    hour: string;
    orders_count: number;
    total_sales: number;
  }[];
  topProducts: {
    name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}

export interface InventoryItem {
  name: string;
  sku: string;
  category: string;
  stock: number;
  price: number;
  stock_value: number;
  is_active: number;
}

export interface InventorySummary {
  total_products: number;
  total_items: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface CashierReport {
  username: string;
  role: string;
  orders_count: number;
  total_sales: number;
  avg_order_value: number;
  first_order: string | null;
  last_order: string | null;
}

export interface PrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  status?: string;
  isDefault?: boolean;
  options?: any;
}

export interface ImageFile {
  filename: string;
  path: string;
  url: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface BackupFile {
  filename: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
}

export interface AppInfo {
  version: string;
  name: string;
  platform: string;
  arch: string;
  electronVersion: string;
  nodeVersion: string;
  chromeVersion: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  osType: string;
  osRelease: string;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
  hostname: string;
  uptime: number;
}

export interface WindowState {
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isMaximized?: boolean;
  isMinimized?: boolean;
  isFullScreen?: boolean;
}

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
}

export interface OverviewData {
  dateRange: {
    from: string;
    to: string;
  };
  salesOverview: {
    total_orders: number;
    total_sales: number;
    avg_order_value: number;
    total_discount: number;
    total_tax: number;
    unique_customers: number;
  };
  productsOverview: {
    total_products: number;
    total_categories: number;
    total_items_sold: number;
    total_revenue: number;
  };
  paymentOverview: Array<{
    payment_method: string;
    count: number;
    total_amount: number;
    percentage: number;
  }>;
  categoriesOverview: Array<{
    category: string;
    products_count: number;
    items_sold: number;
    revenue: number;
  }>;
}

// تعريف عام للنافذة
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
