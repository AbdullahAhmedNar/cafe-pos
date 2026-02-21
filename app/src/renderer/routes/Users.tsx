import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users as UsersIcon, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  User,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDateGregorian } from '@/lib/utils';
import { showToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'cashier';
  created_at: string;
}

interface UserFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'cashier';
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'cashier'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI.users.list();
      
      if (response.success) {
        setUsers(response.data);
      } else {
        showToast.error('خطأ', 'فشل في تحميل المستخدمين');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast.error('خطأ', 'حدث خطأ في تحميل المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cashier'
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cashier'
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      showToast.error('خطأ', 'يرجى إدخال اسم المستخدم');
      return false;
    }

    if (!isEditing && !formData.password.trim()) {
      showToast.error('خطأ', 'يرجى إدخال كلمة المرور');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      showToast.error('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast.error('خطأ', 'كلمة المرور غير متطابقة');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      let response;
      
      if (isEditing && editingUserId) {
        // تحديث المستخدم
        const updateData: any = {
          username: formData.username,
          role: formData.role
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        response = await window.electronAPI.users.update(editingUserId, updateData);
      } else {
        // إضافة مستخدم جديد
        response = await window.electronAPI.users.create({
          username: formData.username,
          password: formData.password,
          role: formData.role
        });
      }
      
      if (response.success) {
        showToast.success(
          isEditing ? 'تم التحديث' : 'تم الإضافة',
          isEditing ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح'
        );
        closeModal();
        loadUsers();
      } else {
        showToast.error('خطأ', response.error || 'فشل في العملية');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast.error('خطأ', 'حدث خطأ في العملية');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟`)) {
      return;
    }

    try {
      const response = await window.electronAPI.users.delete(id);
      
      if (response.success) {
        showToast.success('تم الحذف', 'تم حذف المستخدم بنجاح');
        loadUsers();
      } else {
        showToast.error('خطأ', response.error || 'فشل في حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast.error('خطأ', 'حدث خطأ في حذف المستخدم');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 space-x-reverse">
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة المستخدمين
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إجمالي المستخدمين: {users.length}
          </p>
        </div>
        
        <Button 
          className="bg-cafe-500 hover:bg-cafe-600 flex items-center gap-2"
          onClick={openAddModal}
        >
          <Plus className="h-4 w-4" />
          مستخدم جديد
        </Button>
      </div>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-cafe-500" />
            قائمة المستخدمين
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                لا يوجد مستخدمون
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                لم يتم إضافة أي مستخدمين بعد
              </p>
              <Button 
                className="bg-cafe-500 hover:bg-cafe-600"
                onClick={openAddModal}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة مستخدم جديد
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="h-6 w-6" />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user.username}
                      </h3>
                      <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {user.role === 'admin' ? 'مدير النظام' : 'كاشير'}
                        </span>
                        <span>
                          تاريخ الإنشاء: {formatDateGregorian(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => openEditModal(user)}
                    >
                      <Edit className="h-4 w-4" />
                      تعديل
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal إضافة/تعديل المستخدم */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* اسم المستخدم */}
              <div>
                <Label htmlFor="username" className="block text-sm font-medium mb-2">
                  اسم المستخدم *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full"
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <Label htmlFor="password" className="block text-sm font-medium mb-2">
                  كلمة المرور {!isEditing && '*'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={isEditing ? 'اتركها فارغة إذا لم ترد تغييرها' : 'أدخل كلمة المرور'}
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* تأكيد كلمة المرور */}
              {formData.password && (
                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    تأكيد كلمة المرور *
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="أعد إدخال كلمة المرور"
                      className="w-full pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* الدور */}
              <div>
                <Label htmlFor="role" className="block text-sm font-medium mb-2">
                  الدور *
                </Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'cashier')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="cashier">كاشير</option>
                  <option value="admin">مدير النظام</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse mt-6">
              <Button variant="outline" onClick={closeModal}>
                إلغاء
              </Button>
              <Button 
                className="bg-cafe-500 hover:bg-cafe-600"
                onClick={handleSubmit}
              >
                {isEditing ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
