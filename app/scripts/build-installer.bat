@echo off
chcp 65001 >nul
title Tesla Cafe POS - بناء الملف التنفيذي

echo.
echo ========================================
echo    Tesla Cafe POS - بناء الملف التنفيذي
echo ========================================
echo.

cd /d "%~dp0.."

echo جاري بناء التطبيق...
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

REM بناء التطبيق
echo جاري بناء Tesla Cafe POS...
npm run build

if errorlevel 1 (
    echo.
    echo خطأ: فشل في بناء التطبيق
    echo.
    pause
    exit /b 1
)

REM إنشاء الملف التنفيذي
echo جاري إنشاء الملف التنفيذي...
npm run make

if errorlevel 1 (
    echo.
    echo خطأ: فشل في إنشاء الملف التنفيذي
    echo.
    pause
    exit /b 1
)

echo.
echo تم بناء الملف التنفيذي بنجاح!
echo يمكنك العثور على الملف في مجلد dist-electron
echo.
pause
