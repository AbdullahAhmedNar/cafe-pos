@echo off
echo ========================================
echo    إعادة تشغيل نظام كاشير الكافيه
echo ========================================
echo.

echo إيقاف التطبيق الحالي...
taskkill /f /im "Cafe POS.exe" 2>nul
taskkill /f /im "electron.exe" 2>nul
timeout /t 2 /nobreak >nul

echo حذف الملفات المؤقتة...
if exist "dist" rmdir /s /q "dist"
if exist "build" rmdir /s /q "build"
timeout /t 1 /nobreak >nul

echo إعادة بناء التطبيق...
call npm run build
if %errorlevel% neq 0 (
    echo خطأ في البناء!
    pause
    exit /b 1
)

echo تشغيل التطبيق...
call npm start

echo.
echo تم تشغيل التطبيق بنجاح!
echo يجب أن يفتح التطبيق بملء الشاشة مع قائمة مبسطة.
echo.
pause
