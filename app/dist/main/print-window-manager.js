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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintWindowManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
class PrintWindowManager {
    constructor() {
        this.printWindows = new Map();
    }
    static getInstance() {
        if (!PrintWindowManager.instance) {
            PrintWindowManager.instance = new PrintWindowManager();
        }
        return PrintWindowManager.instance;
    }
    async createPrintWindow(htmlContent) {
        try {
            const windowId = `print-${Date.now()}`;
            // إنشاء نافذة طباعة آمنة
            const printWindow = new electron_1.BrowserWindow({
                width: 800,
                height: 600,
                show: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    sandbox: false,
                    webSecurity: false,
                    allowRunningInsecureContent: true
                },
                fullscreen: false,
                kiosk: false,
                alwaysOnTop: false,
                skipTaskbar: false,
                resizable: true,
                minimizable: true,
                maximizable: true,
                center: true,
                title: 'فاتورة الطلب - Tesla Cafe',
                icon: path.join(__dirname, '../../assets/icon.png'),
                autoHideMenuBar: false,
                titleBarStyle: 'default',
                closable: true,
                focusable: true
            });
            // إضافة الحماية من ملء الشاشة
            const htmlWithProtection = this.addFullscreenProtection(htmlContent);
            // تحميل المحتوى
            await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlWithProtection)}`);
            // إعداد معالجات الأحداث
            this.setupWindowEventHandlers(printWindow, windowId);
            // إظهار النافذة
            printWindow.once('ready-to-show', () => {
                setTimeout(() => {
                    if (printWindow && !printWindow.isDestroyed()) {
                        if (printWindow.isFullScreen()) {
                            printWindow.setFullScreen(false);
                        }
                        if (printWindow.isKiosk()) {
                            printWindow.setKiosk(false);
                        }
                        printWindow.setSize(800, 600);
                        printWindow.center();
                        printWindow.show();
                        printWindow.focus();
                    }
                }, 100);
            });
            // حفظ النافذة في الخريطة
            this.printWindows.set(windowId, printWindow);
            return {
                success: true,
                data: {
                    message: 'تم إنشاء نافذة الطباعة',
                    windowId
                }
            };
        }
        catch (error) {
            console.error('Error creating print window:', error);
            return {
                success: false,
                error: 'حدث خطأ في إنشاء نافذة الطباعة'
            };
        }
    }
    addFullscreenProtection(htmlContent) {
        return htmlContent.replace('</head>', `
      <script>
        // منع ملء الشاشة من خلال JavaScript
        document.addEventListener('DOMContentLoaded', function() {
          // منع F11
          document.addEventListener('keydown', function(e) {
            if (e.key === 'F11') {
              e.preventDefault();
              return false;
            }
          });
          
          // منع طلب ملء الشاشة
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen = function() {
              console.log('تم منع طلب ملء الشاشة');
              return Promise.reject('تم منع ملء الشاشة');
            };
          }
          
          // منع webkitRequestFullscreen
          if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen = function() {
              console.log('تم منع طلب ملء الشاشة (webkit)');
              return Promise.reject('تم منع ملء الشاشة');
            };
          }
          
          // منع mozRequestFullScreen
          if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen = function() {
              console.log('تم منع طلب ملء الشاشة (moz)');
              return Promise.reject('تم منع ملء الشاشة');
            };
          }
          
          // منع msRequestFullscreen
          if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen = function() {
              console.log('تم منع طلب ملء الشاشة (ms)');
              return Promise.reject('تم منع ملء الشاشة');
            };
          }
        });
      </script>
      </head>
      `);
    }
    setupWindowEventHandlers(printWindow, windowId) {
        // منع ملء الشاشة
        printWindow.on('enter-full-screen', () => {
            setTimeout(() => {
                if (printWindow && !printWindow.isDestroyed()) {
                    printWindow.setFullScreen(false);
                    printWindow.setSize(800, 600);
                    printWindow.center();
                }
            }, 50);
        });
        printWindow.on('enter-html-full-screen', () => {
            setTimeout(() => {
                if (printWindow && !printWindow.isDestroyed()) {
                    printWindow.setFullScreen(false);
                    printWindow.setSize(800, 600);
                    printWindow.center();
                }
            }, 50);
        });
        // منع تغيير الحجم
        printWindow.on('resize', () => {
            const [width, height] = printWindow.getSize();
            if (width > 1000 || height > 800) {
                setTimeout(() => {
                    if (printWindow && !printWindow.isDestroyed()) {
                        printWindow.setSize(800, 600);
                        printWindow.center();
                    }
                }, 50);
            }
        });
        // منع التكبير
        printWindow.on('maximize', () => {
            setTimeout(() => {
                if (printWindow && !printWindow.isDestroyed()) {
                    printWindow.unmaximize();
                    printWindow.setSize(800, 600);
                    printWindow.center();
                }
            }, 50);
        });
        // إغلاق النافذة
        printWindow.on('closed', () => {
            this.printWindows.delete(windowId);
        });
        // معالجة الأخطاء
        printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Print window failed to load:', errorCode, errorDescription);
        });
        printWindow.webContents.on('crashed', () => {
            console.error('Print window webContents crashed');
            this.printWindows.delete(windowId);
        });
    }
    closeAllWindows() {
        this.printWindows.forEach((window, id) => {
            if (window && !window.isDestroyed()) {
                window.close();
            }
        });
        this.printWindows.clear();
    }
    getWindowCount() {
        return this.printWindows.size;
    }
}
exports.PrintWindowManager = PrintWindowManager;
