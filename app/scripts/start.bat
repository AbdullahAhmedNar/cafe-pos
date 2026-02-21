@echo off
echo ========================================
echo       نظام كاشير الكافيه
echo       Cafe POS System
echo ========================================
echo.

echo جاري التحقق من Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo خطأ: Node.js غير مثبت!
    echo يرجى تثبيت Node.js من https://nodejs.org
    pause
    exit /b 1
)

echo Node.js موجود ✓
echo.

echo جاري التحقق من التبعيات...
if not exist "node_modules" (
    echo تثبيت التبعيات...
    npm install
    if errorlevel 1 (
        echo خطأ في تثبيت التبعيات!
        pause
        exit /b 1
    )
)

echo التبعيات جاهزة ✓
echo.

echo جاري تشغيل النظام...
echo يرجى الانتظار...
echo.

npm run dev

pause
