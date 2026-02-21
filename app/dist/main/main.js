"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cafePOSApp = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_log_1 = __importDefault(require("electron-log"));
const db_1 = require("./db");
const index_1 = require("./ipc/index");
const app_menu_1 = require("./app-menu");
// تكوين السجلات
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.transports.console.level = 'debug';
class CafePOSApp {
    constructor() {
        this.mainWindow = null;
        this.setupApp();
    }
    setupApp() {
        // التعامل مع إعدادات الأمان
        electron_1.app.whenReady().then(() => {
            this.createMainWindow();
            this.setupApplicationMenu();
            this.initializeServices();
            electron_1.app.on('activate', () => {
                if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow();
                }
            });
        });
        // إضافة معالج لضمان ملء الشاشة للنافذة الرئيسية فقط
        electron_1.app.on('browser-window-created', (event, window) => {
            // تطبيق ملء الشاشة على النافذة الرئيسية فقط
            if (window && window === this.mainWindow && !window.isFullScreen()) {
                setTimeout(() => {
                    window.setFullScreen(true);
                }, 500);
            }
            // ضمان أن النوافذ الأخرى (مثل نافذة الطباعة) لا تتأثر
            if (window && window !== this.mainWindow) {
                // منع تطبيق ملء الشاشة على النوافذ الأخرى
                window.on('enter-full-screen', () => {
                    if (window.getTitle().includes('فاتورة') || window.getTitle().includes('Tesla Cafe')) {
                        window.setFullScreen(false);
                    }
                });
            }
        });
        // إغلاق التطبيق عند إغلاق جميع النوافذ (ما عدا macOS)
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
        // منع إنشاء نوافذ متعددة
        electron_1.app.on('second-instance', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized())
                    this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });
    }
    createMainWindow() {
        // إنشاء النافذة الرئيسية
        this.mainWindow = new electron_1.BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 1200,
            minHeight: 700,
            show: false,
            icon: path.join(__dirname, '../../assets/icon.png'),
            webPreferences: {
                nodeIntegration: false, // تعطيل node integration للأمان
                contextIsolation: true, // تفعيل context isolation
                // enableRemoteModule: false, // deprecated in newer Electron versions
                preload: path.join(__dirname, 'preload.js'),
                sandbox: false, // نحتاج false لاستخدام better-sqlite3
                webSecurity: true,
            },
            titleBarStyle: 'default',
            autoHideMenuBar: false,
            fullscreen: true, // فتح التطبيق بملء الشاشة
            kiosk: false, // لا نريد وضع الكيوسك
            alwaysOnTop: false, // لا نريد أن يكون دائماً في المقدمة
            skipTaskbar: false, // نريد أن يظهر في شريط المهام
            resizable: true, // السماح بتغيير الحجم
            maximizable: true, // السماح بالتكبير
            minimizable: true, // السماح بالتصغير
        });
        // تحميل التطبيق
        if (electron_is_dev_1.default) {
            // في وضع التطوير، استخدم Vite dev server
            electron_log_1.default.info('Development mode: Loading from Vite dev server');
            this.mainWindow.loadURL('http://localhost:5173');
            // إضافة معالج للأخطاء
            this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
                electron_log_1.default.error('Failed to load URL:', validatedURL, 'Error:', errorDescription, 'Code:', errorCode);
            });
            // إضافة معالج للتحميل الناجح
            this.mainWindow.webContents.on('did-finish-load', () => {
                electron_log_1.default.info('Successfully loaded URL:', this.mainWindow?.webContents.getURL());
            });
            // إضافة معالج للأخطاء في التحميل
            this.mainWindow.webContents.on('did-fail-provisional-load', (event, errorCode, errorDescription, validatedURL) => {
                electron_log_1.default.error('Failed provisional load:', validatedURL, 'Error:', errorDescription, 'Code:', errorCode);
            });
        }
        else {
            // في وضع الإنتاج، استخدم الملفات المبنية
            const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
            electron_log_1.default.info('Production mode: Loading from file:', rendererPath);
            this.mainWindow.loadFile(rendererPath);
        }
        // إظهار النافذة عند الانتهاء من التحميل
        this.mainWindow.once('ready-to-show', () => {
            if (this.mainWindow) {
                // ضمان فتح التطبيق بملء الشاشة أولاً
                this.mainWindow.setFullScreen(true);
                // إظهار النافذة
                this.mainWindow.show();
                // تركيز النافذة
                this.mainWindow.focus();
                // تأكيد ملء الشاشة مرة أخرى
                setTimeout(() => {
                    if (this.mainWindow && !this.mainWindow.isFullScreen()) {
                        this.mainWindow.setFullScreen(true);
                    }
                }, 100);
                // في وضع التطوير، يمكن إضافة خيارات إضافية
                if (electron_is_dev_1.default) {
                    electron_log_1.default.info('Development mode: Application started in fullscreen');
                    // لا نفتح أدوات المطور تلقائياً
                    // this.mainWindow.webContents.openDevTools();
                }
            }
        });
        // تنظيف المرجع عند إغلاق النافذة
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        // منع الخروج من وضع ملء الشاشة بالخطأ
        this.mainWindow.on('leave-full-screen', () => {
            // يمكن إضافة منطق هنا إذا أردنا منع الخروج من ملء الشاشة
            electron_log_1.default.info('User left fullscreen mode');
        });
        // إضافة معالج لضمان ملء الشاشة عند التركيز
        this.mainWindow.on('focus', () => {
            if (this.mainWindow && !this.mainWindow.isFullScreen()) {
                this.mainWindow.setFullScreen(true);
            }
        });
        // منع التنقل إلى مواقع خارجية
        this.mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.origin !== 'http://localhost:5173' && parsedUrl.origin !== 'file://') {
                event.preventDefault();
            }
        });
    }
    setupApplicationMenu() {
        const menu = (0, app_menu_1.createAppMenu)();
        electron_1.Menu.setApplicationMenu(menu);
    }
    async initializeServices() {
        try {
            // تهيئة قاعدة البيانات
            await (0, db_1.initializeDatabase)();
            electron_log_1.default.info('Database initialized successfully');
            // تهيئة IPC handlers
            (0, index_1.setupIPC)();
            electron_log_1.default.info('IPC handlers setup successfully');
            // إضافة معالج للأخطاء غير المتوقعة
            process.on('uncaughtException', (error) => {
                electron_log_1.default.error('Uncaught Exception:', error);
            });
            process.on('unhandledRejection', (reason, promise) => {
                electron_log_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
            });
        }
        catch (error) {
            electron_log_1.default.error('Failed to initialize services:', error);
            electron_1.app.quit();
        }
    }
    getMainWindow() {
        return this.mainWindow;
    }
}
// إنشاء التطبيق
const cafePOSApp = new CafePOSApp();
exports.cafePOSApp = cafePOSApp;
// التعامل مع إيقاف التطبيق
electron_1.app.on('before-quit', () => {
    electron_log_1.default.info('Application is shutting down...');
});
// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
    electron_log_1.default.error('Uncaught Exception:', error);
    electron_1.app.quit();
});
process.on('unhandledRejection', (reason, promise) => {
    electron_log_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
