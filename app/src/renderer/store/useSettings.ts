import { create } from 'zustand';
import { showToast } from '@/hooks/use-toast';

interface SettingsData {
  cafe_name: string;
  cafe_address: string;
  cafe_phone: string;
  currency: string;
  currency_symbol: string;
  tax_rate: string;
  receipt_header: string;
  receipt_footer: string;
  paper_size: string;
  theme: string;
  language: string;
  printer_name: string;
  auto_print: string;
  sound_enabled: string;
}

interface SettingsStore {
  settings: SettingsData;
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (newSettings: Partial<SettingsData>) => Promise<void>;
  updateSettings: (updates: Partial<SettingsData>) => void;
  resetSettings: () => Promise<void>;
  applySettings: (settings: SettingsData) => void;
  
  // Getters
  getTaxRate: () => number;
  getCurrencySymbol: () => string;
  getCafeName: () => string;
  isAutoPrintEnabled: () => boolean;
  isSoundEnabled: () => boolean;
}

const defaultSettings: SettingsData = {
  cafe_name: 'Abdullah_Nar Ninja',
  cafe_address: 'دكرنس المنصوره الدقهليه',
  cafe_phone: '01066209693',
  currency: 'جنيه مصري',
  currency_symbol: 'ج.م',
  tax_rate: '15',
  receipt_header: 'أهلاً وسهلاً بكم في Abdullah_Nar Ninja',
  receipt_footer: 'شكراً لتعاملكم معنا ☕',
  paper_size: '80mm',
  theme: 'light',
  language: 'ar',
  printer_name: '',
  auto_print: '0',
  sound_enabled: '1'
};

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  isSaving: false,

  loadSettings: async () => {
    try {
      set({ isLoading: true });
      const response = await window.electronAPI.settings.get();
      
      if (response.success) {
        set({ 
          settings: { ...defaultSettings, ...response.data }
        });
      } else {
        showToast.error('خطأ', 'فشل في تحميل الإعدادات');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast.error('خطأ', 'حدث خطأ في تحميل الإعدادات');
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async (newSettings: Partial<SettingsData>) => {
    try {
      set({ isSaving: true });
      
      // تحديث الإعدادات المحلية أولاً
      const updatedSettings = { ...get().settings, ...newSettings };
      set({ settings: updatedSettings });
      
      // حفظ في قاعدة البيانات
      const response = await window.electronAPI.settings.set(updatedSettings);
      
      if (response.success) {
        showToast.success('تم الحفظ', 'تم حفظ الإعدادات بنجاح');
        
        // تطبيق الإعدادات فوراً
        get().applySettings(updatedSettings);
        
        // رسالة خاصة عند تغيير اللغة
        if (newSettings.language && newSettings.language !== get().settings.language) {
          showToast.info('تغيير اللغة', 'سيتم إعادة تحميل الصفحة لتطبيق التغييرات');
        }
      } else {
        showToast.error('خطأ', response.error || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error('خطأ', 'حدث خطأ في حفظ الإعدادات');
    } finally {
      set({ isSaving: false });
    }
  },

  updateSettings: (updates: Partial<SettingsData>) => {
    set(state => ({
      settings: { ...state.settings, ...updates }
    }));
  },

  resetSettings: async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات للقيم الافتراضية؟')) {
      return;
    }

    try {
      const response = await window.electronAPI.settings.reset();
      
      if (response.success) {
        set({ settings: defaultSettings });
        showToast.success('تم الإعادة', 'تم إعادة تعيين الإعدادات بنجاح');
        get().applySettings(defaultSettings);
      } else {
        showToast.error('خطأ', 'فشل في إعادة تعيين الإعدادات');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast.error('خطأ', 'حدث خطأ في إعادة تعيين الإعدادات');
    }
  },

  // Helper function to apply settings
  applySettings: (settings: SettingsData) => {
    // تطبيق المظهر
    if (settings.theme) {
      document.documentElement.classList.remove('light', 'dark');
      if (settings.theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(isDark ? 'dark' : 'light');
      } else {
        document.documentElement.classList.add(settings.theme);
      }
    }

    // تطبيق اللغة
    if (settings.language) {
      document.documentElement.lang = settings.language;
      document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
      
      // إعادة تحميل الصفحة عند تغيير اللغة لتطبيق التغييرات على جميع المكونات
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }

    // تطبيق الأصوات
    if (settings.sound_enabled === '0') {
      // إيقاف الأصوات
      console.log('Sounds disabled');
    }
  },

  // Getters
  getTaxRate: () => {
    const rate = parseFloat(get().settings.tax_rate);
    return isNaN(rate) ? 15 : rate;
  },

  getCurrencySymbol: () => {
    return get().settings.currency_symbol || 'ج.م';
  },

  getCafeName: () => {
    return get().settings.cafe_name || 'abdullahnar_ninja11';
  },

  isAutoPrintEnabled: () => {
    return get().settings.auto_print === '1';
  },

  isSoundEnabled: () => {
    return get().settings.sound_enabled === '1';
  }
}));
