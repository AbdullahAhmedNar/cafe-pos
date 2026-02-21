@echo off
chcp 65001 >nul
title Tesla Cafe POS - تشغيل التطبيق

echo.
echo ========================================
echo    Tesla Cafe POS - نظام كاشير الكافيه
echo ========================================
echo.

cd /d "%~dp0.."

echo جاري تشغيل التطبيق...
echo.
echo ملاحظة: أدوات المطور لن تفتح تلقائياً
echo إذا أردت فتح أدوات المطور، اضغط F12
echo.

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo تحذير: لم يتم العثور على node_modules
    echo جاري تثبيت المكتبات...
    npm install
    if errorlevel 1 (
        echo خطأ: فشل في تثبيت المكتبات
        pause
        exit /b 1
    )
)

REM تشغيل التطبيق
echo جاري تشغيل Tesla Cafe POS...
npm run dev

if errorlevel 1 (
    echo.
    echo خطأ: فشل في تشغيل التطبيق
    echo.
    pause
    exit /b 1
)

echo.
echo تم إغلاق التطبيق
pause
