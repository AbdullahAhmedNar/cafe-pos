"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullscreenProtection = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
class FullscreenProtection {
    constructor() {
        this.protectedWindows = new Set();
    }
    static getInstance() {
        if (!FullscreenProtection.instance) {
            FullscreenProtection.instance = new FullscreenProtection();
        }
        return FullscreenProtection.instance;
    }
    protectWindow(window) {
        if (this.protectedWindows.has(window)) {
            return; // النافذة محمية بالفعل
        }
        this.protectedWindows.add(window);
        // إعداد الحماية الأساسية
        this.setupBasicProtection(window);
        // إعداد الحماية المتقدمة
        this.setupAdvancedProtection(window);
        // إعداد الحماية المستمرة
        this.setupContinuousProtection(window);
        electron_log_1.default.info('تم حماية النافذة من ملء الشاشة');
    }
    setupBasicProtection(window) {
        // منع الدخول إلى ملء الشاشة
        window.on('enter-full-screen', () => {
            electron_log_1.default.info('محاولة دخول ملء الشاشة - تم منعها');
            this.forceNormalMode(window);
        });
        window.on('enter-html-full-screen', () => {
            electron_log_1.default.info('محاولة دخول HTML ملء الشاشة - تم منعها');
            this.forceNormalMode(window);
        });
        // منع التكبير
        window.on('maximize', () => {
            electron_log_1.default.info('محاولة تكبير النافذة - تم منعها');
            this.forceNormalMode(window);
        });
        // منع التكبير من خلال القائمة
        window.on('restore', () => {
            electron_log_1.default.info('محاولة استعادة النافذة - تم منعها');
            this.forceNormalMode(window);
        });
    }
    setupAdvancedProtection(window) {
        // منع تغيير الحجم
        window.on('resize', () => {
            const [width, height] = window.getSize();
            if (width > 1000 || height > 800) {
                electron_log_1.default.info('محاولة تغيير حجم النافذة - تم منعها');
                this.forceNormalMode(window);
            }
        });
        // منع تغيير الموضع
        window.on('move', () => {
            setTimeout(() => {
                window.center();
            }, 50);
        });
        // منع إخفاء شريط العنوان
        window.on('show', () => {
            this.forceNormalMode(window);
        });
        // منع التغييرات عند التركيز
        window.on('focus', () => {
            this.forceNormalMode(window);
        });
    }
    setupContinuousProtection(window) {
        // فحص مستمر كل ثانية
        const protectionInterval = setInterval(() => {
            if (window.isDestroyed()) {
                clearInterval(protectionInterval);
                this.protectedWindows.delete(window);
                return;
            }
            if (window.isFullScreen() || window.isKiosk()) {
                electron_log_1.default.info('اكتشاف ملء الشاشة - تم إصلاحه');
                this.forceNormalMode(window);
            }
            const [width, height] = window.getSize();
            if (width > 1000 || height > 800) {
                electron_log_1.default.info('اكتشاف حجم كبير - تم إصلاحه');
                this.forceNormalMode(window);
            }
        }, 1000);
        // تنظيف عند إغلاق النافذة
        window.on('closed', () => {
            clearInterval(protectionInterval);
            this.protectedWindows.delete(window);
        });
    }
    forceNormalMode(window) {
        if (window.isDestroyed()) {
            return;
        }
        try {
            // إجبار الخروج من ملء الشاشة
            if (window.isFullScreen()) {
                window.setFullScreen(false);
            }
            if (window.isKiosk()) {
                window.setKiosk(false);
            }
            // إجبار إلغاء التكبير
            if (window.isMaximized()) {
                window.unmaximize();
            }
            // إعادة تعيين الحجم
            window.setSize(800, 600);
            // توسيط النافذة
            window.center();
            // إعادة التركيز
            window.focus();
            electron_log_1.default.info('تم إجبار النافذة على الوضع العادي');
        }
        catch (error) {
            electron_log_1.default.error('خطأ في إجبار الوضع العادي:', error);
        }
    }
    removeProtection(window) {
        this.protectedWindows.delete(window);
        electron_log_1.default.info('تم إزالة الحماية من النافذة');
    }
    getProtectedWindowsCount() {
        return this.protectedWindows.size;
    }
}
exports.FullscreenProtection = FullscreenProtection;
