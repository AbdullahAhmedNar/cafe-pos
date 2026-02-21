import { contextBridge, ipcRenderer } from 'electron';

// واجهة API آمنة للتواصل مع Main Process
const electronAPI = {
  // Test API
  test: {
    ping: async () => {
      return ipcRenderer.invoke('test:ping');
    },
    db: async () => {
      return ipcRenderer.invoke('test:db');
    },
  },

  // Users API
  users: {
    login: async (credentials: any) => {
      return ipcRenderer.invoke('users:login', credentials);
    },
    create: async (userData: any) => {
      return ipcRenderer.invoke('users:create', userData);
    },
    update: async (id: number, userData: any) => {
      return ipcRenderer.invoke('users:update', id, userData);
    },
    delete: async (id: number) => {
      return ipcRenderer.invoke('users:delete', id);
    },
    list: async () => {
      return ipcRenderer.invoke('users:list');
    },
  },

  // Products API
  products: {
    list: async (filters?: { search?: string; category?: string; active?: boolean }) => {
      return ipcRenderer.invoke('products:list', filters || {});
    },
    create: async (product: any) => {
      return ipcRenderer.invoke('products:create', product);
    },
    update: async (id: number, product: any) => {
      return ipcRenderer.invoke('products:update', id, product);
    },
    delete: async (id: number) => {
      return ipcRenderer.invoke('products:delete', id);
    },
    updateStock: async (id: number, quantity: number) => {
      return ipcRenderer.invoke('products:updateStock', id, quantity);
    },
    getByBarcode: async (sku: string) => {
      return ipcRenderer.invoke('products:getByBarcode', sku);
    },
    generateSKU: async () => {
      return ipcRenderer.invoke('products:generateSKU');
    },
  },

  // Orders API
  orders: {
    create: async (order: any) => {
      return ipcRenderer.invoke('orders:create', order);
    },
    list: async (filters?: { from?: string; to?: string; limit?: number }) => {
      return ipcRenderer.invoke('orders:list', filters || {});
    },
    getById: async (id: number) => {
      return ipcRenderer.invoke('orders:getById', id);
    },
    print: async (orderId: number) => {
      return ipcRenderer.invoke('orders:print', orderId);
    },
    generateOrderNumber: async () => {
      return ipcRenderer.invoke('orders:generateOrderNumber');
    },
    resetCounter: async () => {
      return ipcRenderer.invoke('orders:resetCounter');
    },
    cleanOldOrders: async () => {
      return ipcRenderer.invoke('orders:cleanOldOrders');
    },
  },

  // Reports API
  reports: {
    sales: async (query: any) => {
      return ipcRenderer.invoke('reports:sales', query);
    },
    topProducts: async (limit: number = 10) => {
      return ipcRenderer.invoke('reports:topProducts', limit);
    },
    dailySummary: async (date?: string) => {
      return ipcRenderer.invoke('reports:dailySummary', date);
    },
    overview: async (dateRange?: any) => {
      return ipcRenderer.invoke('reports:overview', dateRange);
    },
    exportToPDF: async (data: any, type: string) => {
      return ipcRenderer.invoke('reports:exportToPDF', data, type);
    },
    exportToCSV: async (data: any, filename: string) => {
      return ipcRenderer.invoke('reports:exportToCSV', data, filename);
    },
  },

  // File operations
  openFile: async (filePath: string) => {
    return ipcRenderer.invoke('openFile', filePath);
  },
  printReport: async (filePath: string) => {
    return ipcRenderer.invoke('printReport', filePath);
  },

  // Settings API
  settings: {
    get: async (keys?: string[]) => {
      return ipcRenderer.invoke('settings:get', keys);
    },
    set: async (settings: Record<string, string>) => {
      return ipcRenderer.invoke('settings:set', settings);
    },
    reset: async () => {
      return ipcRenderer.invoke('settings:reset');
    }
  },

  // Printer API
  printer: {
    getPrinters: async () => {
      return ipcRenderer.invoke('printer:getPrinters');
    },
    printReceipt: async (receiptData: any) => {
      return ipcRenderer.invoke('printer:printReceipt', receiptData);
    },
    testPrint: async (printerName: string) => {
      return ipcRenderer.invoke('printer:testPrint', printerName);
    },
    createPrintWindow: async (htmlContent: string) => {
      return ipcRenderer.invoke('print:createWindow', htmlContent);
    },
  },

  // File System API
  fs: {
    selectImage: async () => {
      return ipcRenderer.invoke('fs:selectImage');
    },
    saveImage: async (imageData: string, filename: string) => {
      return ipcRenderer.invoke('fs:saveImage', imageData, filename);
    },
    deleteImage: async (filename: string) => {
      return ipcRenderer.invoke('fs:deleteImage', filename);
    },
    getImagePath: async (filename: string) => {
      return ipcRenderer.invoke('fs:getImagePath', filename);
    },
  },

  // App API
  app: {
    getVersion: async () => {
      return ipcRenderer.invoke('app:getVersion');
    },
    quit: () => {
      ipcRenderer.send('app:quit');
    },
    minimize: () => {
      ipcRenderer.send('app:minimize');
    },
    maximize: () => {
      ipcRenderer.send('app:maximize');
    },
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, callback);
  },
  
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

// تصدير API للواجهة
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// تصدير الأنواع للاستخدام في TypeScript
export type ElectronAPI = typeof electronAPI;
