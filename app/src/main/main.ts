import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import log from 'electron-log';
import { initializeDatabase } from './db';
import { setupIPC } from './ipc/index';
import { createAppMenu } from './app-menu';

// تكوين السجلات
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

class CafePOSApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    // التعامل مع إعدادات الأمان
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupApplicationMenu();
      this.initializeServices();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // إضافة معالج لضمان ملء الشاشة للنافذة الرئيسية فقط
    app.on('browser-window-created', (event, window) => {
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
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // منع إنشاء نوافذ متعددة
    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.focus();
      }
    });
  }

  private createMainWindow(): void {
    // إنشاء النافذة الرئيسية
    this.mainWindow = new BrowserWindow({
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
    if (isDev) {
      // في وضع التطوير، استخدم Vite dev server
      log.info('Development mode: Loading from Vite dev server');
      this.mainWindow.loadURL('http://localhost:5173');
      
      // إضافة معالج للأخطاء
      this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        log.error('Failed to load URL:', validatedURL, 'Error:', errorDescription, 'Code:', errorCode);
      });
      
      // إضافة معالج للتحميل الناجح
      this.mainWindow.webContents.on('did-finish-load', () => {
        log.info('Successfully loaded URL:', this.mainWindow?.webContents.getURL());
      });
      
      // إضافة معالج للأخطاء في التحميل
      this.mainWindow.webContents.on('did-fail-provisional-load', (event, errorCode, errorDescription, validatedURL) => {
        log.error('Failed provisional load:', validatedURL, 'Error:', errorDescription, 'Code:', errorCode);
      });
    } else {
      // في وضع الإنتاج، استخدم الملفات المبنية
      const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
      log.info('Production mode: Loading from file:', rendererPath);
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
        if (isDev) {
          log.info('Development mode: Application started in fullscreen');
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
      log.info('User left fullscreen mode');
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

  private setupApplicationMenu(): void {
    const menu = createAppMenu();
    Menu.setApplicationMenu(menu);
  }

  private async initializeServices(): Promise<void> {
    try {
      // تهيئة قاعدة البيانات
      await initializeDatabase();
      log.info('Database initialized successfully');

      // تهيئة IPC handlers
      setupIPC();
      log.info('IPC handlers setup successfully');

      // إضافة معالج للأخطاء غير المتوقعة
      process.on('uncaughtException', (error) => {
        log.error('Uncaught Exception:', error);
      });

      process.on('unhandledRejection', (reason, promise) => {
        log.error('Unhandled Rejection at:', promise, 'reason:', reason);
      });

    } catch (error) {
      log.error('Failed to initialize services:', error);
      app.quit();
    }
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// إنشاء التطبيق
const cafePOSApp = new CafePOSApp();

// تصدير مرجع التطبيق للاستخدام في الملفات الأخرى
export { cafePOSApp };

// التعامل مع إيقاف التطبيق
app.on('before-quit', () => {
  log.info('Application is shutting down...');
});

// معالجة الأخطاء العامة
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
