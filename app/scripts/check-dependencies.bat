@echo off
chcp 65001 >nul
title Tesla Cafe POS - فحص التبعيات

echo.
echo ========================================
echo    Tesla Cafe POS - فحص التبعيات
echo ========================================
echo.

cd /d "%~dp0.."

echo جاري فحص جميع التبعيات والملفات المطلوبة...
echo.

REM فحص Node.js
echo [1/8] فحص Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js غير مثبت
    pause
    exit /b 1
)

echo.

REM فحص npm
echo [2/8] فحص npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i
) else (
    echo ❌ npm غير مثبت
    pause
    exit /b 1
)

echo.

REM فحص node_modules
echo [3/8] فحص node_modules...
if exist "node_modules" (
    echo ✅ node_modules موجود
    dir node_modules | find "File(s)" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ node_modules يحتوي على ملفات
    ) else (
        echo ❌ node_modules فارغ
    )
) else (
    echo ❌ node_modules غير موجود
    echo جاري تثبيت التبعيات...
    npm install
)

echo.

REM فحص ملفات البناء
echo [4/8] فحص ملفات البناء...
if exist "dist" (
    echo ✅ مجلد dist موجود
    if exist "dist\renderer\index.html" (
        echo ✅ index.html موجود
    ) else (
        echo ❌ index.html غير موجود
    )
) else (
    echo ❌ مجلد dist غير موجود
)

echo.

REM فحص ملفات Electron
echo [5/8] فحص ملفات Electron...
if exist "dist-electron" (
    echo ✅ مجلد dist-electron موجود
) else (
    echo ❌ مجلد dist-electron غير موجود
)

echo.

REM فحص Vite dev server
echo [6/8] فحص Vite dev server...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Vite dev server يعمل على المنفذ 5173
) else (
    echo ❌ Vite dev server لا يعمل
)

echo.

REM فحص الملفات الأساسية
echo [7/8] فحص الملفات الأساسية...
if exist "src\renderer\App.tsx" (
    echo ✅ App.tsx موجود
) else (
    echo ❌ App.tsx غير موجود
)

if exist "src\renderer\main.tsx" (
    echo ✅ main.tsx موجود
) else (
    echo ❌ main.tsx غير موجود
)

if exist "src\renderer\index.html" (
    echo ✅ index.html موجود
) else (
    echo ❌ index.html غير موجود
)

if exist "src\main\main.ts" (
    echo ✅ main.ts موجود
) else (
    echo ❌ main.ts غير موجود
)

echo.

REM فحص قاعدة البيانات
echo [8/8] فحص قاعدة البيانات...
if exist "database\pos.sqlite" (
    echo ✅ قاعدة البيانات موجودة
) else (
    echo ❌ قاعدة البيانات غير موجودة
    echo جاري إنشاء قاعدة البيانات...
    npm run db:setup
)

echo.

echo ========================================
echo    فحص التبعيات مكتمل
echo ========================================
echo.

echo إذا كانت جميع العناصر تظهر بـ ✅، فالمشروع جاهز للتشغيل
echo إذا كان هناك أي عنصر بـ ❌، يرجى إصلاحه أولاً
echo.

pause
