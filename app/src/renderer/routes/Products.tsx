import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  AlertTriangle,
  Filter,
  X,
  Image,
  Upload as UploadIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { createLowStockNotification } from '@/store/useNotifications';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  is_active: number;
  image?: string;
  created_at: string;
  updated_at: string;
}

const Products: React.FC = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [predefinedCategories] = useState<string[]>([
    t('categories.hotDrinks'),
    t('categories.coldDrinks'),
    t('categories.food'),
    t('categories.other')
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    sku: '',
    stock: '',
    image: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI.products.list();
      
      if (response.success) {
        setProducts(response.data);
        
        // استخدام التصنيفات المحددة مسبقاً فقط
        setCategories(predefinedCategories);
      } else {
        showToast.error('خطأ', 'فشل في تحميل المنتجات');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showToast.error('خطأ', 'حدث خطأ في تحميل المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // عرض المنتجات النشطة فقط
    filtered = filtered.filter(p => p.is_active === 1);

    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة حسب التصنيف
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    console.log('Filtering products:', {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.is_active === 1).length,
      filteredCount: filtered.length
    });

    setFilteredProducts(filtered);
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) {
      return;
    }

    try {
      const response = await window.electronAPI.products.delete(id);
      
      if (response.success) {
        showToast.success('تم الحذف', 'تم حذف المنتج بنجاح');
        loadProducts();
      } else {
        showToast.error('خطأ', response.error || 'فشل في حذف المنتج');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast.error('خطأ', 'حدث خطأ في حذف المنتج');
    }
  };



  const handleAddProduct = async () => {
    // التحقق من البيانات
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.sku) {
      showToast.error('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sku: newProduct.sku,
        stock: parseInt(newProduct.stock) || 0,
        image: newProduct.image || null
      };

      const response = await window.electronAPI.products.create(productData);
      
      if (response.success) {
        showToast.success('تم الإضافة', 'تم إضافة المنتج بنجاح');
        
        // إضافة إشعار للمخزون المنخفض
        const newStock = parseInt(newProduct.stock) || 0;
        if (newStock <= 10) {
          createLowStockNotification(newProduct.name, newStock);
        }
        
        setShowAddModal(false);
        setNewProduct({
          name: '',
          price: '',
          category: '',
          sku: '',
          stock: '',
          image: ''
        });
        loadProducts();
      } else {
        showToast.error('خطأ', response.error || 'فشل في إضافة المنتج');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showToast.error('خطأ', 'حدث خطأ في إضافة المنتج');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = async () => {
    try {
      // استخدام API اختيار الملفات
      const result = await window.electronAPI.fs.selectImage();
      
      if (result.success && result.data) {
        setNewProduct(prev => ({
          ...prev,
          image: result.data
        }));
        showToast.success('تم اختيار الصورة', 'تم اختيار الصورة بنجاح');
      } else if (result.error) {
        showToast.error('خطأ', result.error);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      showToast.error('خطأ', 'حدث خطأ في اختيار الصورة');
    }
  };

  const handleRemoveImage = () => {
    setNewProduct(prev => ({
      ...prev,
      image: ''
    }));
  };

  const handleGenerateSKU = async () => {
    try {
      const response = await window.electronAPI.products.generateSKU();
      if (response.success) {
        setNewProduct(prev => ({
          ...prev,
          sku: response.data
        }));
        showToast.success('تم إنشاء الرمز', 'تم إنشاء رمز المنتج تلقائياً');
      } else {
        showToast.error('خطأ', response.error || 'فشل في إنشاء الرمز');
      }
    } catch (error) {
      console.error('Error generating SKU:', error);
      showToast.error('خطأ', 'حدث خطأ في إنشاء الرمز');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      sku: product.sku,
      stock: product.stock.toString(),
      image: product.image || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    // التحقق من البيانات
    if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.sku) {
      showToast.error('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sku: newProduct.sku,
        stock: parseInt(newProduct.stock) || 0,
        image: newProduct.image || null,
        is_active: editingProduct.is_active
      };

      const response = await window.electronAPI.products.update(editingProduct.id, productData);
      
      if (response.success) {
        showToast.success('تم التحديث', 'تم تحديث المنتج بنجاح');
        
        // إضافة إشعار للمخزون المنخفض
        const newStock = parseInt(newProduct.stock) || 0;
        if (newStock <= 10) {
          createLowStockNotification(newProduct.name, newStock);
        }
        
        setShowEditModal(false);
        setEditingProduct(null);
        setNewProduct({
          name: '',
          price: '',
          category: '',
          sku: '',
          stock: '',
          image: ''
        });
        loadProducts();
      } else {
        showToast.error('خطأ', response.error || 'فشل في تحديث المنتج');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showToast.error('خطأ', 'حدث خطأ في تحديث المنتج');
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      price: '',
      category: '',
      sku: '',
      stock: '',
      image: ''
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            إدارة المنتجات
          </h1>
                     <p className="text-gray-600 dark:text-gray-400 mt-1">
             إجمالي المنتجات: {products.filter(p => p.is_active === 1).length}
             {filteredProducts.length !== products.length && (
               <span className="text-cafe-600 font-medium"> | النتائج المفلترة: {filteredProducts.length}</span>
             )}
           </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="bg-cafe-500 hover:bg-cafe-600 flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            منتج جديد
          </Button>
        </div>
      </div>

      {/* شريط الفلاتر */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

                         {/* التصنيف */}
             <select
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
               className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
             >
               <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">جميع التصنيفات</option>
               {categories.map(category => (
                 <option key={category} value={category} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                   {category}
                 </option>
               ))}
             </select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المنتجات */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {products.length === 0 
                ? 'لم يتم إضافة أي منتجات بعد'
                : 'لا توجد منتجات تطابق معايير البحث'
              }
            </p>
            {products.length === 0 && (
              <Button 
                className="bg-cafe-500 hover:bg-cafe-600"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addProduct')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
              {/* صورة المنتج */}
              <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <Package className="h-16 w-16 text-gray-400" />
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {product.name}
                  </h3>
                  {product.stock <= 10 && (
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('productPrice')}:</span>
                                    <span className="font-semibold text-cafe-600">
                  {formatCurrency(product.price)}
                </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('productStock')}:</span>
                    <span className={`font-semibold ${
                      product.stock <= 10 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('productCategory')}:</span>
                    <span className="text-gray-900 dark:text-white">
                      {product.category}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('productSKU')}:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {product.sku}
                    </span>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 hover:bg-cafe-50 hover:border-cafe-300 transition-all duration-200"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 text-red-600 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                    onClick={() => handleDeleteProduct(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* تنبيه المخزون */}
                {product.stock <= 10 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-center">
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                        <AlertTriangle className="h-3 w-3 inline ml-1" />
                        مخزون منخفض ({product.stock} قطعة)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* النافذة المنبثقة لإضافة منتج جديد */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('addProduct')}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="name" className="text-right block mb-2">
                  {t('productName')} *
                </Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('productName')}
                  className="text-right"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-right block mb-2">
                  {t('productPrice')} *
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    className="text-right pr-12"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    ج.م
                  </div>
                </div>
              </div>

                             <div>
                 <Label htmlFor="category" className="text-right block mb-2">
                   {t('productCategory')} *
                 </Label>
                                   <select
                    id="category"
                    value={newProduct.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 focus:border-transparent text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">اختر التصنيف</option>
                    <option value={t('categories.hotDrinks')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('categories.hotDrinks')}</option>
                    <option value={t('categories.coldDrinks')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('categories.coldDrinks')}</option>
                    <option value={t('categories.food')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('categories.food')}</option>
                    <option value={t('categories.other')} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{t('categories.other')}</option>
                  </select>
               </div>

                             <div>
                 <Label htmlFor="sku" className="text-right block mb-2">
                   رمز المنتج (SKU) *
                 </Label>
                 <div className="flex gap-2">
                   <Input
                     id="sku"
                     value={newProduct.sku}
                     onChange={(e) => handleInputChange('sku', e.target.value)}
                     placeholder="أدخل رمز المنتج"
                     className="text-right flex-1"
                   />
                   <Button
                     type="button"
                     variant="outline"
                     onClick={handleGenerateSKU}
                     className="px-3"
                   >
                     إنشاء تلقائي
                   </Button>
                 </div>
               </div>

              <div>
                <Label htmlFor="stock" className="text-right block mb-2">
                  المخزون
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                  className="text-right"
                />
              </div>

                             <div>
                 <Label className="text-right block mb-2">
                   صورة المنتج (اختياري)
                 </Label>
                 <div className="space-y-2">
                   {newProduct.image ? (
                     <div className="relative">
                       <img 
                         src={newProduct.image} 
                         alt="صورة المنتج"
                         className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                       />
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={handleRemoveImage}
                         className="absolute top-2 right-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                   ) : (
                     <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-cafe-400 dark:hover:border-cafe-500 transition-colors">
                       <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                         لا توجد صورة مختارة
                       </p>
                     </div>
                   )}
                   
                   <Button
                     type="button"
                     variant="outline"
                     onClick={handleImageSelect}
                     className="w-full flex items-center justify-center gap-2"
                   >
                     <UploadIcon className="h-4 w-4" />
                     {newProduct.image ? 'تغيير الصورة' : 'اختيار صورة'}
                   </Button>
                 </div>
               </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddProduct}
                className="flex-1 bg-cafe-500 hover:bg-cafe-600"
              >
                إضافة المنتج
              </Button>
            </div>
                     </div>
         </div>
       )}

       {/* النافذة المنبثقة لتعديل المنتج */}
       {showEditModal && editingProduct && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
             <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                 تعديل المنتج
               </h2>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={handleCloseEditModal}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <X className="h-5 w-5" />
               </Button>
             </div>

             <div className="p-6 space-y-4">
               <div>
                 <Label htmlFor="edit-name" className="text-right block mb-2">
                   اسم المنتج *
                 </Label>
                 <Input
                   id="edit-name"
                   value={newProduct.name}
                   onChange={(e) => handleInputChange('name', e.target.value)}
                   placeholder="أدخل اسم المنتج"
                   className="text-right"
                 />
               </div>

               <div>
                 <Label htmlFor="edit-price" className="text-right block mb-2">
                   السعر *
                 </Label>
                 <div className="relative">
                   <Input
                     id="edit-price"
                     type="number"
                     step="0.01"
                     value={newProduct.price}
                     onChange={(e) => handleInputChange('price', e.target.value)}
                     placeholder="0.00"
                     className="text-right pr-12"
                   />
                   <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                     ج.م
                   </div>
                 </div>
               </div>

                               <div>
                  <Label htmlFor="edit-category" className="text-right block mb-2">
                    التصنيف *
                  </Label>
                                     <select
                     id="edit-category"
                     value={newProduct.category}
                     onChange={(e) => handleInputChange('category', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cafe-500 focus:border-transparent text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                   >
                     <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">اختر التصنيف</option>
                     <option value="مشروبات ساخنة" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">مشروبات ساخنة</option>
                     <option value="مشروبات باردة" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">مشروبات باردة</option>
                     <option value="طعام" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">طعام</option>
                     <option value="أخرى" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">أخرى</option>
                   </select>
                </div>

               <div>
                 <Label htmlFor="edit-sku" className="text-right block mb-2">
                   رمز المنتج (SKU) *
                 </Label>
                 <Input
                   id="edit-sku"
                   value={newProduct.sku}
                   onChange={(e) => handleInputChange('sku', e.target.value)}
                   placeholder="أدخل رمز المنتج"
                   className="text-right"
                 />
               </div>

               <div>
                 <Label htmlFor="edit-stock" className="text-right block mb-2">
                   المخزون
                 </Label>
                 <Input
                   id="edit-stock"
                   type="number"
                   value={newProduct.stock}
                   onChange={(e) => handleInputChange('stock', e.target.value)}
                   placeholder="0"
                   className="text-right"
                 />
               </div>

               <div>
                 <Label className="text-right block mb-2">
                   صورة المنتج (اختياري)
                 </Label>
                 <div className="space-y-2">
                   {newProduct.image ? (
                     <div className="relative">
                       <img 
                         src={newProduct.image} 
                         alt="صورة المنتج"
                         className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                       />
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={handleRemoveImage}
                         className="absolute top-2 right-2 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                       >
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                   ) : (
                     <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-cafe-400 dark:hover:border-cafe-500 transition-colors">
                       <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                       <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                         لا توجد صورة مختارة
                       </p>
                     </div>
                   )}
                   
                   <Button
                     type="button"
                     variant="outline"
                     onClick={handleImageSelect}
                     className="w-full flex items-center justify-center gap-2"
                   >
                     <UploadIcon className="h-4 w-4" />
                     {newProduct.image ? 'تغيير الصورة' : 'اختيار صورة'}
                   </Button>
                 </div>
               </div>
             </div>

             <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
               <Button
                 variant="outline"
                 onClick={handleCloseEditModal}
                 className="flex-1"
               >
                 إلغاء
               </Button>
               <Button
                 onClick={handleUpdateProduct}
                 className="flex-1 bg-cafe-500 hover:bg-cafe-600"
               >
                 تحديث المنتج
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default Products;
