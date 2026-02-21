"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppMenu = createAppMenu;
const electron_1 = require("electron");
function createAppMenu() {
    const template = [
        {
            label: 'ملف',
            submenu: [
                {
                    label: 'إعدادات',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        // إرسال حدث للواجهة للانتقال إلى الإعدادات
                        // يمكن تنفيذ هذا لاحقاً
                    }
                },
                { type: 'separator' },
                {
                    label: 'خروج',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    }
                }
            ]
        },
        {
            label: 'عرض',
            submenu: [
                { role: 'reload', label: 'إعادة تحميل' },
                { role: 'forceReload', label: 'إعادة تحميل قسري' },
                { role: 'toggleDevTools', label: 'أدوات المطور' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'إعادة تعيين التكبير' },
                { role: 'zoomIn', label: 'تكبير' },
                { role: 'zoomOut', label: 'تصغير' },
                { type: 'separator' },
                {
                    label: 'ملء الشاشة',
                    click: () => {
                        const mainWindow = electron_1.BrowserWindow.getFocusedWindow();
                        if (mainWindow) {
                            if (mainWindow.isFullScreen()) {
                                mainWindow.setFullScreen(false);
                            }
                            else {
                                mainWindow.setFullScreen(true);
                            }
                        }
                    }
                }
            ]
        },
        {
            label: 'نافذة',
            submenu: [
                { role: 'minimize', label: 'تصغير' },
                { role: 'close', label: 'إغلاق' }
            ]
        }
    ];
    // تخصيص القائمة لنظام macOS
    if (process.platform === 'darwin') {
        template.unshift({
            label: electron_1.app.getName(),
            submenu: [
                { role: 'about', label: 'حول التطبيق' },
                { type: 'separator' },
                { role: 'services', label: 'الخدمات', submenu: [] },
                { type: 'separator' },
                { role: 'hide', label: 'إخفاء' },
                { role: 'hideOthers', label: 'إخفاء الآخرين' },
                { role: 'unhide', label: 'إظهار الكل' },
                { type: 'separator' },
                { role: 'quit', label: 'خروج' }
            ]
        });
        // تعديل قائمة النافذة لـ macOS
        template[3].submenu = [
            { role: 'close', label: 'إغلاق' },
            { role: 'minimize', label: 'تصغير' },
            { role: 'zoom', label: 'تكبير' },
            { type: 'separator' },
            { role: 'front', label: 'إحضار الكل للمقدمة' }
        ];
    }
    return electron_1.Menu.buildFromTemplate(template);
}
