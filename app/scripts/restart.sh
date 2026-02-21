#!/bin/bash

echo "========================================"
echo "   إعادة تشغيل نظام كاشير الكافيه"
echo "========================================"
echo

echo "إيقاف التطبيق الحالي..."
pkill -f "Cafe POS" 2>/dev/null
pkill -f "electron" 2>/dev/null
sleep 2

echo "حذف الملفات المؤقتة..."
rm -rf dist 2>/dev/null
rm -rf build 2>/dev/null
sleep 1

echo "إعادة بناء التطبيق..."
npm run build
if [ $? -ne 0 ]; then
    echo "خطأ في البناء!"
    read -p "اضغط Enter للمتابعة..."
    exit 1
fi

echo "تشغيل التطبيق..."
npm start

echo
echo "تم تشغيل التطبيق بنجاح!"
echo "يجب أن يفتح التطبيق بملء الشاشة مع قائمة مبسطة."
echo
read -p "اضغط Enter للمتابعة..."
