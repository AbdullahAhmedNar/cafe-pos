@echo off
chcp 65001 >nul
title Tesla Cafe POS - تشغيل بدون أدوات المطور

echo.
echo ========================================
echo    Tesla Cafe POS - تشغيل بدون أدوات المطور
echo ========================================
echo.

cd /d "%~dp0.."

echo جاري تشغيل التطبيق بدون أدوات المطور...
echo.

REM فحص Vite dev server
echo جاري فحص Vite dev server...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Vite dev server يعمل على المنفذ 5173
) else (
    echo ❌ Vite dev server لا يعمل
    echo جاري تشغيل Vite dev server...
    start "Vite Dev Server" cmd /c "npm run dev:vite"
    timeout /t 5 /nobreak >nul
)

echo.

echo ========================================
echo    جاري تشغيل التطبيق
echo ========================================
echo.

REM تشغيل التطبيق
npm run dev

if errorlevel 1 (
    echo.
    echo ❌ فشل في تشغيل التطبيق
    echo.
    pause
    exit /b 1
)

echo.
echo تم إغلاق التطبيق
pause
