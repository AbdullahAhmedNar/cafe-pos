"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// واجهة API آمنة للتواصل مع Main Process
const electronAPI = {
    // Test API
    test: {
        ping: async () => {
            return electron_1.ipcRenderer.invoke('test:ping');
        },
        db: async () => {
            return electron_1.ipcRenderer.invoke('test:db');
        },
    },
    // Users API
    users: {
        login: async (credentials) => {
            return electron_1.ipcRenderer.invoke('users:login', credentials);
        },
        create: async (userData) => {
            return electron_1.ipcRenderer.invoke('users:create', userData);
        },
        update: async (id, userData) => {
            return electron_1.ipcRenderer.invoke('users:update', id, userData);
        },
        delete: async (id) => {
            return electron_1.ipcRenderer.invoke('users:delete', id);
        },
        list: async () => {
            return electron_1.ipcRenderer.invoke('users:list');
        },
    },
    // Products API
    products: {
        list: async (filters) => {
            return electron_1.ipcRenderer.invoke('products:list', filters || {});
        },
        create: async (product) => {
            return electron_1.ipcRenderer.invoke('products:create', product);
        },
        update: async (id, product) => {
            return electron_1.ipcRenderer.invoke('products:update', id, product);
        },
        delete: async (id) => {
            return electron_1.ipcRenderer.invoke('products:delete', id);
        },
        updateStock: async (id, quantity) => {
            return electron_1.ipcRenderer.invoke('products:updateStock', id, quantity);
        },
        getByBarcode: async (sku) => {
            return electron_1.ipcRenderer.invoke('products:getByBarcode', sku);
        },
        generateSKU: async () => {
            return electron_1.ipcRenderer.invoke('products:generateSKU');
        },
    },
    // Orders API
    orders: {
        create: async (order) => {
            return electron_1.ipcRenderer.invoke('orders:create', order);
        },
        list: async (filters) => {
            return electron_1.ipcRenderer.invoke('orders:list', filters || {});
        },
        getById: async (id) => {
            return electron_1.ipcRenderer.invoke('orders:getById', id);
        },
        print: async (orderId) => {
            return electron_1.ipcRenderer.invoke('orders:print', orderId);
        },
        generateOrderNumber: async () => {
            return electron_1.ipcRenderer.invoke('orders:generateOrderNumber');
        },
        resetCounter: async () => {
            return electron_1.ipcRenderer.invoke('orders:resetCounter');
        },
        cleanOldOrders: async () => {
            return electron_1.ipcRenderer.invoke('orders:cleanOldOrders');
        },
    },
    // Reports API
    reports: {
        sales: async (query) => {
            return electron_1.ipcRenderer.invoke('reports:sales', query);
        },
        topProducts: async (limit = 10) => {
            return electron_1.ipcRenderer.invoke('reports:topProducts', limit);
        },
        dailySummary: async (date) => {
            return electron_1.ipcRenderer.invoke('reports:dailySummary', date);
        },
        overview: async (dateRange) => {
            return electron_1.ipcRenderer.invoke('reports:overview', dateRange);
        },
        exportToPDF: async (data, type) => {
            return electron_1.ipcRenderer.invoke('reports:exportToPDF', data, type);
        },
        exportToCSV: async (data, filename) => {
            return electron_1.ipcRenderer.invoke('reports:exportToCSV', data, filename);
        },
    },
    // File operations
    openFile: async (filePath) => {
        return electron_1.ipcRenderer.invoke('openFile', filePath);
    },
    printReport: async (filePath) => {
        return electron_1.ipcRenderer.invoke('printReport', filePath);
    },
    // Settings API
    settings: {
        get: async (keys) => {
            return electron_1.ipcRenderer.invoke('settings:get', keys);
        },
        set: async (settings) => {
            return electron_1.ipcRenderer.invoke('settings:set', settings);
        },
        reset: async () => {
            return electron_1.ipcRenderer.invoke('settings:reset');
        }
    },
    // Printer API
    printer: {
        getPrinters: async () => {
            return electron_1.ipcRenderer.invoke('printer:getPrinters');
        },
        printReceipt: async (receiptData) => {
            return electron_1.ipcRenderer.invoke('printer:printReceipt', receiptData);
        },
        testPrint: async (printerName) => {
            return electron_1.ipcRenderer.invoke('printer:testPrint', printerName);
        },
        createPrintWindow: async (htmlContent) => {
            return electron_1.ipcRenderer.invoke('print:createWindow', htmlContent);
        },
    },
    // File System API
    fs: {
        selectImage: async () => {
            return electron_1.ipcRenderer.invoke('fs:selectImage');
        },
        saveImage: async (imageData, filename) => {
            return electron_1.ipcRenderer.invoke('fs:saveImage', imageData, filename);
        },
        deleteImage: async (filename) => {
            return electron_1.ipcRenderer.invoke('fs:deleteImage', filename);
        },
        getImagePath: async (filename) => {
            return electron_1.ipcRenderer.invoke('fs:getImagePath', filename);
        },
    },
    // App API
    app: {
        getVersion: async () => {
            return electron_1.ipcRenderer.invoke('app:getVersion');
        },
        quit: () => {
            electron_1.ipcRenderer.send('app:quit');
        },
        minimize: () => {
            electron_1.ipcRenderer.send('app:minimize');
        },
        maximize: () => {
            electron_1.ipcRenderer.send('app:maximize');
        },
    },
    // Event listeners
    on: (channel, callback) => {
        electron_1.ipcRenderer.on(channel, callback);
    },
    off: (channel, callback) => {
        electron_1.ipcRenderer.removeListener(channel, callback);
    },
};
// تصدير API للواجهة
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
