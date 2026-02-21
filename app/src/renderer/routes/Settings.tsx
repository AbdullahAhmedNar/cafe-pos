import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Store, 
  Printer, 
  Palette,
  Save,
  RotateCcw,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { useTranslation } from '@/hooks/useTranslation';

const Settings: React.FC = () => {
  const {
    settings,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings
  } = useSettings();
  
  const { t } = useTranslation();

  const [printers, setPrinters] = React.useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadPrinters();
  }, [loadSettings]);

  const loadPrinters = async () => {
    try {
      const response = await window.electronAPI.printer.getPrinters();
      if (response.success) {
        setPrinters(response.data);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
    }
  };

  const handleInputChange = (key: keyof typeof settings, value: string) => {
    updateSettings({ [key]: value });
  };

  const handleSaveSettings = async () => {
    await saveSettings(settings);
  };

  const handleResetSettings = async () => {
    await resetSettings();
  };

  const handleTestPrint = async () => {
    try {
      const response = await window.electronAPI.printer.testPrint(settings.printer_name);
      
      if (response.success) {
        // Toast will be handled by the store
      } else {
        console.error('Print test failed:', response.error);
      }
    } catch (error) {
      console.error('Error testing print:', error);
    }
  };

  const handleResetOrderCounter = async () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين عداد الطلبات؟ سيتم حذف جميع الطلبات السابقة.')) {
      try {
        const response = await window.electronAPI.orders.resetCounter();
        
        if (response.success) {
          alert('تم إعادة تعيين عداد الطلبات بنجاح');
        } else {
          alert('فشل في إعادة تعيين العداد: ' + response.error);
        }
      } catch (error) {
        console.error('Error resetting counter:', error);
        alert('حدث خطأ في إعادة تعيين العداد');
      }
    }
  };

  const handleCleanOldOrders = async () => {
    if (window.confirm('هل تريد تنظيف الطلبات القديمة التي تحتوي على أرقام غير صحيحة؟')) {
      try {
        const response = await window.electronAPI.orders.cleanOldOrders();
        
        if (response.success) {
          alert('تم تنظيف الطلبات القديمة بنجاح');
        } else {
          alert('فشل في تنظيف الطلبات: ' + response.error);
        }
      } catch (error) {
        console.error('Error cleaning old orders:', error);
        alert('حدث خطأ في تنظيف الطلبات');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j}>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('generalSettings')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('reset')}
          </Button>
          
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-cafe-500 hover:bg-cafe-600 flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? t('loading') : t('save')}
          </Button>
        </div>
      </div>

      {/* إعدادات الكافيه */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Store className="h-5 w-5 mr-2 text-cafe-500" />
            {t('cafeName')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cafe_name">{t('cafeName')}</Label>
              <Input
                id="cafe_name"
                value={settings.cafe_name}
                onChange={(e) => handleInputChange('cafe_name', e.target.value)}
                placeholder={t('cafeName')}
              />
            </div>
            
            <div>
              <Label htmlFor="cafe_phone">رقم الهاتف</Label>
              <Input
                id="cafe_phone"
                value={settings.cafe_phone}
                onChange={(e) => handleInputChange('cafe_phone', e.target.value)}
                placeholder="01066209693"
                dir="ltr"
                inputMode="tel"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="cafe_address">العنوان</Label>
            <Input
              id="cafe_address"
              value={settings.cafe_address}
              onChange={(e) => handleInputChange('cafe_address', e.target.value)}
              placeholder="عنوان الكافيه"
            />
          </div>
        </CardContent>
      </Card>

      {/* إعدادات العملة والضريبة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-cafe-500" />
            إعدادات العملة والضريبة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="currency">العملة</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="جنية مصري"
              />
            </div>
            
            <div>
              <Label htmlFor="currency_symbol">رمز العملة</Label>
              <Input
                id="currency_symbol"
                value={settings.currency_symbol}
                onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                placeholder="ج.م"
              />
            </div>
            
            <div>
              <Label htmlFor="tax_rate">معدل الضريبة (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                value={settings.tax_rate}
                onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                placeholder="14"
                min="0"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الطباعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2 text-cafe-500" />
            {t('printSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="printer_name">الطابعة الافتراضية</Label>
              <select
                id="printer_name"
                value={settings.printer_name}
                onChange={(e) => handleInputChange('printer_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">اختر الطابعة</option>
                {printers.map((printer, index) => (
                  <option key={index} value={printer.name} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    {printer.displayName || printer.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="paper_size">حجم الورق</Label>
              <select
                id="paper_size"
                value={settings.paper_size}
                onChange={(e) => handleInputChange('paper_size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="80mm" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">80mm</option>
                <option value="58mm" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">58mm</option>
                <option value="A4" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">A4</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="receipt_header">ترويسة الفاتورة</Label>
            <Input
              id="receipt_header"
              value={settings.receipt_header}
              onChange={(e) => handleInputChange('receipt_header', e.target.value)}
              placeholder="أهلاً وسهلاً بكم في abdullahnar_ninja11"
            />
          </div>
          
          <div>
            <Label htmlFor="receipt_footer">تذييل الفاتورة</Label>
            <Input
              id="receipt_footer"
              value={settings.receipt_footer}
              onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
              placeholder="شكراً لتعاملكم معنا ☕\nنتمنى لكم يوماً سعيداً"
            />
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={settings.auto_print === '1'}
                onChange={(e) => handleInputChange('auto_print', e.target.checked ? '1' : '0')}
                className="rounded border-gray-300 dark:border-gray-600 text-cafe-500 focus:ring-cafe-500 bg-white dark:bg-gray-800"
              />
              <span className="text-gray-900 dark:text-white">{t('autoPrint')}</span>
            </label>
            
            <Button variant="outline" onClick={handleTestPrint}>
              {t('testPrint')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات الواجهة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-cafe-500" />
            {t('interfaceSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme">{t('theme')}</Label>
              <select
                id="theme"
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="light" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('lightMode')}</option>
                <option value="dark" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('darkMode')}</option>
                <option value="system" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">تلقائي</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="language">{t('language')}</Label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ar" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('arabic')}</option>
                <option value="en" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('english')}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={settings.sound_enabled === '1'}
                onChange={(e) => handleInputChange('sound_enabled', e.target.checked ? '1' : '0')}
                className="rounded border-gray-300 dark:border-gray-600 text-cafe-500 focus:ring-cafe-500 bg-white dark:bg-gray-800"
              />
              <span className="text-gray-900 dark:text-white">{t('soundEnabled')}</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* إعدادات النظام */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-cafe-500" />
            {t('systemSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('createBackup')}
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('importBackup')}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              onClick={handleResetOrderCounter}
            >
              <RefreshCw className="h-4 w-4" />
              {t('resetOrderCounter')}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
              onClick={handleCleanOldOrders}
            >
              <RefreshCw className="h-4 w-4" />
              {t('cleanOldOrders')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
