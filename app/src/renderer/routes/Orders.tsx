import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Calculator
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { showToast } from '@/hooks/use-toast';
import { useCart } from '@/store/useCart';
import { useSettings } from '@/store/useSettings';
import InvoiceModal from '@/components/InvoiceModal';
import { createOrderNotification } from '@/store/useNotifications';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  stock: number;
  is_active: number;
  image?: string;
}

const Orders: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');

  const {
    items,
    subtotal,
    discount,
    tax,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDiscount,
    setTax
  } = useCart();

  const { getTaxRate, getCurrencySymbol } = useSettings();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchTerm]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await window.electronAPI.products.list({ active: true });
      
      if (response.success && response.data) {
        setProducts(response.data);
        
        // استخراج التصنيفات
        const uniqueCategories = [...new Set(response.data.map((p: Product) => p.category))] as string[];
        setCategories(uniqueCategories);
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



  // دالة تنسيق العملة باستخدام الإعدادات
  const formatCurrencyWithSettings = (amount: number) => {
    return formatCurrency(amount, getCurrencySymbol());
  };

  // تحديث الضريبة عند تغيير المجموع الفرعي أو الخصم أو نسبة الضريبة
  useEffect(() => {
    const taxRate = getTaxRate();
    const taxableAmount = Math.max(0, subtotal - discount); // تأكد من عدم كون المبلغ سالباً
    const calculatedTax = (taxableAmount * taxRate) / 100;
    setTax(calculatedTax);
  }, [subtotal, discount, getTaxRate, setTax]);

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast.error('غير متوفر', 'هذا المنتج غير متوفر في المخزون');
      return;
    }

    // التحقق من المخزون القليل (أقل من أو يساوي 5)
    if (product.stock <= 5) {
      showToast.warning('مخزون قليل', `مخزون ${product.name} قليل (${product.stock} وحدة متبقية)`);
    }

    addItem(product);
    showToast.success('تمت الإضافة', `تم إضافة ${product.name} إلى السلة`);
  };

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleDiscountChange = (value: string) => {
    const discountValue = parseFloat(value) || 0;
    setDiscount(discountValue);
  };



  const handleCompleteOrder = async () => {
    if (items.length === 0) {
      showToast.error('خطأ', 'لا توجد منتجات في السلة');
      return;
    }

    const paidAmountNum = parseFloat(paidAmount) || 0;
    if (paidAmountNum < total) {
      showToast.error('خطأ', 'المبلغ المدفوع أقل من الإجمالي');
      return;
    }

    try {
      console.log('Cart state before sending:', { items, total, discount, tax, paidAmountNum, paymentMethod });
      
      const orderData = {
        items: items.map(item => ({
          product_id: item.product_id,
          qty: item.quantity,
          unit_price: item.price
        })),
        total,
        discount,
        tax,
        paid: paidAmountNum,
        payment_method: paymentMethod
      };

      console.log('Sending order data:', orderData);
      const response = await window.electronAPI.orders.create(orderData);
      console.log('Response received:', response);

      if (response.success && response.data) {
        const { orderNo, change, orderId } = response.data;
        
        console.log('Order created successfully:', { orderNo, change, orderId });
        showToast.success('تم الطلب', `تم إنشاء الطلب رقم ${orderNo} بنجاح`);
        
        // إضافة إشعار للطلب الجديد
        createOrderNotification(orderNo, total);
        
        // تحديث الداشبورد والتقارير - إرسال الأحداث مع بيانات إضافية
        console.log('🔄 Dispatching orderCreated event...');
        window.dispatchEvent(new CustomEvent('orderCreated', {
          detail: {
            orderId,
            orderNo,
            total,
            itemsCount: items.length,
            timestamp: new Date().toISOString()
          }
        }));
        
        // إرسال إشعار بتحديث البيانات
        showToast.success('تحديث', 'تم تحديث الإحصائيات تلقائياً');
        
        // طباعة الفاتورة
        console.log('Calling handlePrintReceipt with orderId:', orderId);
        await handlePrintReceipt(orderId);
        
        // تنظيف السلة
        clearCart();
        setPaidAmount('');
        
        if (change > 0) {
          showToast.info('الباقي', `المبلغ المتبقي: ${formatCurrencyWithSettings(change)}`);
        }
      } else {
        // معالجة رسالة الخطأ لعرض تفاصيل المنتجات غير المتوفرة
        const errorMessage = response.error || 'فشل في إنشاء الطلب';
        if (errorMessage.includes('المنتجات التالية غير متوفرة')) {
          showToast.error('مخزون غير متوفر', errorMessage);
        } else {
          showToast.error('خطأ', errorMessage);
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showToast.error('خطأ', 'حدث خطأ في إنشاء الطلب');
    }
  };

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handlePrintReceipt = async (orderId: number) => {
    try {
      console.log('handlePrintReceipt called with orderId:', orderId);
      const response = await window.electronAPI.orders.print(orderId);
      console.log('Print response:', response);
      
      if (response.success) {
        console.log('Setting receipt data:', response.data);
        // تحديث الفاتورة بإعدادات الكافيه
        const updatedReceipt = updateReceiptWithSettings(response.data.receipt);
        setReceiptData({ 
          ...response.data, 
          receipt: updatedReceipt,
          invoiceData: response.data.invoiceData 
        });
        setShowReceipt(true);
        showToast.success('طباعة', 'تم إنشاء الفاتورة بنجاح');
      } else {
        console.error('Print failed:', response.error);
        showToast.error('خطأ', response.error || 'فشل في إنشاء الفاتورة');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      showToast.error('خطأ', 'فشل في إنشاء الفاتورة');
    }
  };

  // تحديث الفاتورة لتستخدم إعدادات الكافيه
  const updateReceiptWithSettings = (receiptContent: string) => {
    const { settings } = useSettings.getState();
    return receiptContent
      .replace(/كافيه الأصالة/g, settings.cafe_name || 'كافيه الأصالة')
      .replace(/ر\.س/g, settings.currency_symbol || 'ج.م')
      .replace(/ج\.م/g, settings.currency_symbol || 'ج.م');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* قسم المنتجات */}
      <div className="lg:col-span-2 space-y-6">
        {/* فلاتر البحث */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
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

        {/* شبكة المنتجات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-cafe-500" />
              المنتجات ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد منتجات متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-cafe-300"
                    onClick={() => handleAddToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-cafe-600 font-bold">
                          {formatCurrencyWithSettings(product.price)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800' 
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* سلة التسوق */}
      <div className="space-y-6">
        {/* عناصر السلة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-cafe-500" />
                السلة ({itemCount})
              </span>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">السلة فارغة</p>
                <p className="text-sm text-gray-400 mt-1">
                  اضغط على المنتجات لإضافتها
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatCurrencyWithSettings(item.price)} × {item.quantity}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 h-8 w-8"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="text-sm font-semibold w-8 text-center">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="p-1 h-8 w-8"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* الحسابات */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-cafe-500" />
                الحسابات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* المجموع الفرعي */}
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold">{formatCurrencyWithSettings(subtotal)}</span>
              </div>

              {/* الخصم */}
              <div className="flex justify-between items-center">
                <span>الخصم:</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-24 text-left"
                  min="0"
                  max={subtotal}
                />
              </div>

              {/* الضريبة */}
              <div className="flex justify-between">
                <span>الضريبة ({getTaxRate()}%):</span>
                <span className="font-semibold">{formatCurrencyWithSettings(tax)}</span>
              </div>

              {/* الإجمالي */}
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>الإجمالي:</span>
                <span className="text-cafe-600">{formatCurrencyWithSettings(total)}</span>
              </div>

              {/* طريقة الدفع */}
              <div className="space-y-3">
                <label className="text-sm font-medium">طريقة الدفع:</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('cash')}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <Banknote className="h-5 w-5 mb-1" />
                    <span className="text-xs">نقدي</span>
                  </Button>
                  
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('card')}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    <span className="text-xs">بطاقة</span>
                  </Button>
                  
                  <Button
                    variant={paymentMethod === 'wallet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('wallet')}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <Smartphone className="h-5 w-5 mb-1" />
                    <span className="text-xs">محفظة</span>
                  </Button>
                </div>
              </div>

              {/* المبلغ المدفوع */}
              <div className="space-y-2">
                <label className="text-sm font-medium">المبلغ المدفوع:</label>
                <Input
                  type="number"
                  placeholder={formatCurrencyWithSettings(total)}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="text-left"
                  min={total}
                />
                {parseFloat(paidAmount) > total && (
                  <p className="text-sm text-green-600">
                    الباقي: {formatCurrencyWithSettings(parseFloat(paidAmount) - total)}
                  </p>
                )}
              </div>

              {/* زر إتمام الطلب */}
              <Button
                onClick={handleCompleteOrder}
                className="w-full bg-cafe-500 hover:bg-cafe-600 text-white font-semibold py-3"
                disabled={items.length === 0 || parseFloat(paidAmount) < total}
              >
                <Printer className="h-4 w-4 mr-2" />
                إتمام الطلب وطباعة الفاتورة
              </Button>
              
              {/* زر اختبار الفاتورة */}
              <Button
                onClick={() => {
                  if (items.length === 0) {
                    showToast.error('خطأ', 'لا توجد منتجات في السلة لعرض الفاتورة');
                    return;
                  }

                  const { settings } = useSettings.getState();
                  const currencySymbol = settings.currency_symbol || 'ج.م';
                  const cafeName = settings.cafe_name || 'كافيه الأصالة';
                  const cafeAddress = settings.cafe_address || 'شارع النيل، القاهرة، جمهورية مصر العربية';
                  const receiptHeader = settings.receipt_header || `أهلاً وسهلاً بكم في ${cafeName}`;
                  const receiptFooter = settings.receipt_footer || 'شكراً لتعاملكم معنا ☕';
                  
                  // إنشاء فاتورة ديناميكية بناءً على محتويات السلة
                  const itemsText = items.map(item => 
                    `║  ${item.name.padEnd(25)} ${item.quantity} × ${item.price.toFixed(2)} ${currencySymbol} = ${(item.quantity * item.price).toFixed(2).padStart(10)} ${currencySymbol} ║`
                  ).join('\n');

                  // حساب المجموع الفرعي (مجموع أسعار المنتجات فقط)
                  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                  const taxAmount = tax;
                  const discountAmount = discount;
                  const finalTotal = subtotal + taxAmount - discountAmount;
                  const paidAmountNum = parseFloat(paidAmount) || finalTotal;
                  const change = paidAmountNum - finalTotal;

                  setReceiptData({
                    receipt: `
╔══════════════════════════════════════════════════════════════╗
║                    ☕ ${cafeName} ☕                    ║
║                                                              ║
║  ${receiptHeader}  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  رقم الطلب: ORD-TEST-${Date.now().toString().slice(-6)}                    ║
║  التاريخ: ${new Date().toLocaleString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'Africa/Cairo'
})}  ║
║  الكاشير: admin                               ║
║  العنوان: ${cafeAddress}  ║
╠══════════════════════════════════════════════════════════════╣
║  المنتجات:                                                   ║
╠══════════════════════════════════════════════════════════════╣
${itemsText}
╠══════════════════════════════════════════════════════════════╣
║  المجموع الفرعي: ${subtotal.toFixed(2).padStart(10)} ${currencySymbol}                    ║
║  الخصم: ${discountAmount.toFixed(2).padStart(15)} ${currencySymbol}                          ║
║  الضريبة: ${taxAmount.toFixed(2).padStart(14)} ${currencySymbol}                         ║
╠══════════════════════════════════════════════════════════════╣
║  الإجمالي: ${finalTotal.toFixed(2).padStart(13)} ${currencySymbol}                         ║
║  المدفوع: ${paidAmountNum.toFixed(2).padStart(13)} ${currencySymbol}                         ║
║  الباقي: ${change.toFixed(2).padStart(15)} ${currencySymbol}                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ${receiptFooter}  ║
║  نتمنى لكم يوماً سعيداً ☕  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
                    `,
                    invoiceData: {
                      orderNo: `ORD-TEST-${Date.now().toString().slice(-6)}`,
                      date: new Date().toLocaleString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                        timeZone: 'Africa/Cairo'
                      }),
                      cashier: 'admin',
                      items: items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: item.quantity * item.price
                      })),
                      subtotal: subtotal,
                      discount: discountAmount,
                      tax: taxAmount,
                      total: finalTotal,
                      paid: paidAmountNum,
                      change: change,
                      cafeName: cafeName,
                      cafeAddress: cafeAddress,
                      currencySymbol: currencySymbol,
                      receiptHeader: receiptHeader,
                      receiptFooter: receiptFooter
                    }
                  });
                  setShowReceipt(true);
                }}
                variant="outline"
                className="w-full mt-2"
              >
                اختبار عرض الفاتورة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* نافذة الفاتورة المحسنة */}
        <InvoiceModal
          isOpen={showReceipt}
          onClose={() => setShowReceipt(false)}
          receiptData={receiptData}
        />
      </div>
    </div>
  );
};

export default Orders;
