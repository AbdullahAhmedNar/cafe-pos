#!/bin/bash

# تعيين الترميز للعربية
export LANG=ar_SA.UTF-8

echo ""
echo "========================================"
echo "   Tesla Cafe POS - نظام كاشير الكافيه"
echo "========================================"
echo ""

# الانتقال إلى مجلد المشروع
cd "$(dirname "$0")/.."

echo "جاري تشغيل التطبيق..."
echo ""

# التحقق من وجود node_modules
if [ ! -d "node_modules" ]; then
    echo "تحذير: لم يتم العثور على node_modules"
    echo "جاري تثبيت المكتبات..."
    npm install
    if [ $? -ne 0 ]; then
        echo "خطأ: فشل في تثبيت المكتبات"
        read -p "اضغط Enter للخروج..."
        exit 1
    fi
fi

# تشغيل التطبيق
echo "جاري تشغيل Tesla Cafe POS..."
npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "خطأ: فشل في تشغيل التطبيق"
    echo ""
    read -p "اضغط Enter للخروج..."
    exit 1
fi

echo ""
echo "تم إغلاق التطبيق"
read -p "اضغط Enter للخروج..."
