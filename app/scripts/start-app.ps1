# تعيين الترميز للعربية
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Tesla Cafe POS - نظام كاشير الكافيه" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# الانتقال إلى مجلد المشروع
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

Write-Host "جاري تشغيل التطبيق..." -ForegroundColor Yellow
Write-Host ""

# التحقق من وجود node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "تحذير: لم يتم العثور على node_modules" -ForegroundColor Yellow
    Write-Host "جاري تثبيت المكتبات..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "خطأ: فشل في تثبيت المكتبات" -ForegroundColor Red
        Read-Host "اضغط Enter للخروج"
        exit 1
    }
}

# تشغيل التطبيق
Write-Host "جاري تشغيل Tesla Cafe POS..." -ForegroundColor Green
npm run dev

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "خطأ: فشل في تشغيل التطبيق" -ForegroundColor Red
    Write-Host ""
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host ""
Write-Host "تم إغلاق التطبيق" -ForegroundColor Green
Read-Host "اضغط Enter للخروج"
