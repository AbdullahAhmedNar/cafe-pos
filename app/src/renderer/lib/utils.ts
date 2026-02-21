import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * تنسيق العملة
 */
export function formatCurrency(amount: number, currency: string = 'ج.م'): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/**
 * تنسيق التاريخ
 */
export function formatDate(date: string | Date, locale: string = 'ar-SA'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * تنسيق التاريخ بالميلادي مع الساعة
 */
export function formatDateGregorian(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const cairoTime = new Date(dateObj.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  const dateStr = cairoTime.toLocaleDateString('en-US', dateOptions);
  const timeStr = cairoTime.toLocaleTimeString('en-US', timeOptions);
  
  return `${dateStr} - ${timeStr}`;
}

/**
 * تنسيق التاريخ والوقت
 */
export function formatDateTime(date: string | Date, locale: string = 'ar-SA'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * تنسيق الوقت فقط
 */
export function formatTime(date: string | Date, locale: string = 'ar-SA'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * تحويل الأرقام إلى العربية
 */
export function toArabicNumbers(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (digit) => arabicNumbers[parseInt(digit)]);
}

/**
 * تحويل الأرقام إلى الإنجليزية
 */
export function toEnglishNumbers(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (digit) => arabicNumbers.indexOf(digit).toString());
}

/**
 * تحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * تحقق من صحة رقم الهاتف السعودي
 */
export function isValidSaudiPhone(phone: string): boolean {
  const phoneRegex = /^(\+966|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone);
}

/**
 * توليد رقم عشوائي
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * تأخير التنفيذ
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تحويل الحجم إلى نص قابل للقراءة
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * نسخ النص إلى الحافظة
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('فشل في نسخ النص:', err);
    return false;
  }
}

/**
 * تحقق من وجود خاصية في الكائن
 */
export function hasProperty<T extends object>(obj: T, prop: string | number | symbol): prop is keyof T {
  return prop in obj;
}

/**
 * إزالة الخصائص الفارغة من الكائن
 */
export function removeEmptyProperties(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => 
      value !== null && value !== undefined && value !== ''
    )
  );
}

/**
 * ترقيم الصفحات
 */
export function paginate<T>(array: T[], page: number, limit: number): T[] {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
}

/**
 * حساب عدد الصفحات
 */
export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * تحويل البيانات إلى CSV
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

/**
 * تنزيل ملف
 */
export function downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
  // إضافة BOM للعربية لضمان عرض النص بشكل صحيح
  const BOM = '\uFEFF';
  const contentWithBOM = BOM + content;
  
  const blob = new Blob([contentWithBOM], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * تحقق من كون الجهاز محمول
 */
export function isMobile(): boolean {
  return window.innerWidth < 768;
}

/**
 * تحقق من كون الجهاز تابلت
 */
export function isTablet(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * تحقق من كون الجهاز سطح المكتب
 */
export function isDesktop(): boolean {
  return window.innerWidth >= 1024;
}

/**
 * تحقق من الوضع المظلم
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

/**
 * تبديل الوضع المظلم
 */
export function toggleDarkMode(): void {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDarkMode() ? 'dark' : 'light');
}

/**
 * تطبيق الثيم المحفوظ
 */
export function applyStoredTheme(): void {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
