import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Eye, EyeOff, Loader2, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { showToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const Login: React.FC = () => {
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [cafeName, setCafeName] = useState('كافيه الأصالة');

  // جلب اسم الكافيه من الإعدادات
  useEffect(() => {
    const loadCafeSettings = async () => {
      try {
        const response = await window.electronAPI.settings.get(['cafe_name']);
        if (response.success && response.data?.cafe_name) {
          setCafeName(response.data.cafe_name);
        }
      } catch (error) {
        console.error('Error loading cafe settings:', error);
      }
    };

    loadCafeSettings();
  }, []);

  // تحديث التاريخ والوقت كل ثانية
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const cairoTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}));
      
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
      
      const date = cairoTime.toLocaleDateString('en-US', dateOptions);
      const time = cairoTime.toLocaleTimeString('en-US', timeOptions);
      
      setCurrentDateTime(`${date} - ${time}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // إعادة توجيه إذا تم تسجيل الدخول بالفعل
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      showToast.error(t('error'), 'يرجى ملء جميع الحقول');
      return;
    }

    const success = await login(formData.username, formData.password);
    
    if (success) {
      showToast.success(t('login'), 'مرحباً بك في نظام نقطة البيع');
    } else {
      showToast.error(t('loginError'), error || t('invalidCredentials'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cafe-50 to-cafe-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* شعار التطبيق */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cafe-500 rounded-full mb-4 shadow-lg">
            <Coffee className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {cafeName}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            نظام نقطة البيع الاحترافي
          </p>
          
          {/* التاريخ والوقت */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{currentDateTime}</span>
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* نموذج تسجيل الدخول */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('login')}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              أدخل بيانات الدخول للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* حقل اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-right">
                  {t('username')}
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder={t('username')}
                  className="text-right"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* حقل كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-right">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t('password')}
                    className="text-right pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* رسالة الخطأ */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* زر تسجيل الدخول */}
              <Button
                type="submit"
                className="w-full bg-cafe-500 hover:bg-cafe-600 text-white font-semibold py-3 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('loading')}
                  </>
                ) : (
                  t('login')
                )}
              </Button>
            </form>

            {/* آية قرآنية */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-center">
                <p className="text-green-800 dark:text-green-400 text-lg font-semibold leading-relaxed mb-2" style={{fontFamily: 'Traditional Arabic, Amiri, serif'}}>
                  ﴿ وَقُل رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا ﴾
                </p>
                <p className="text-green-600 dark:text-green-300 text-sm">
                  الإسراء: 80
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>جميع الحقوق محفوظة للمهندس عبدالله احمد نار بتاريخ 2025</p>
          <p className="mt-1">الإصدار 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
