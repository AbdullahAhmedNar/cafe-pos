#!/bin/bash

echo "========================================"
echo "       نظام كاشير الكافيه"
echo "       Cafe POS System"
echo "========================================"
echo

echo "جاري التحقق من Node.js..."
if ! command -v node &> /dev/null; then
    echo "خطأ: Node.js غير مثبت!"
    echo "يرجى تثبيت Node.js من https://nodejs.org"
    exit 1
fi

echo "Node.js موجود ✓"
echo

echo "جاري التحقق من التبعيات..."
if [ ! -d "node_modules" ]; then
    echo "تثبيت التبعيات..."
    npm install
    if [ $? -ne 0 ]; then
        echo "خطأ في تثبيت التبعيات!"
        exit 1
    fi
fi

echo "التبعيات جاهزة ✓"
echo

echo "جاري تشغيل النظام..."
echo "يرجى الانتظار..."
echo

npm run dev
