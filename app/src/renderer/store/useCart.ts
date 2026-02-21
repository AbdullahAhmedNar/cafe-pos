import { create } from 'zustand';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  discount: number;
  tax: number;
  
  // Computed values
  subtotal: number;
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (product: any, quantity?: number) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  
  // Helpers
  getItem: (productId: number) => CartItem | undefined;
  calculateTotals: () => void;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  tax: 0,
  subtotal: 0,
  total: 0,
  itemCount: 0,

  addItem: (product: any, quantity: number = 1) => {
    const state = get();
    const existingItem = state.items.find(item => item.product_id === product.id);

    if (existingItem) {
      // زيادة الكمية للمنتج الموجود
      set({
        items: state.items.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      });
    } else {
      // إضافة منتج جديد
      const newItem: CartItem = {
        id: Date.now(), // ID مؤقت
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        sku: product.sku,
        image: product.image
      };

      set({
        items: [...state.items, newItem]
      });
    }

    get().calculateTotals();
  },

  removeItem: (itemId: number) => {
    const state = get();
    set({
      items: state.items.filter(item => item.id !== itemId)
    });
    get().calculateTotals();
  },

  updateQuantity: (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const state = get();
    set({
      items: state.items.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      )
    });
    get().calculateTotals();
  },

  clearCart: () => {
    set({
      items: [],
      discount: 0,
      tax: 0,
      subtotal: 0,
      total: 0,
      itemCount: 0
    });
  },

  setDiscount: (discount: number) => {
    set({ discount });
    get().calculateTotals();
  },

  setTax: (tax: number) => {
    set({ tax });
    get().calculateTotals();
  },

  getItem: (productId: number) => {
    const state = get();
    return state.items.find(item => item.product_id === productId);
  },

  calculateTotals: () => {
    const state = get();
    
    // حساب المجموع الفرعي
    const subtotal = state.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // حساب عدد الأصناف
    const itemCount = state.items.reduce((sum, item) => 
      sum + item.quantity, 0
    );

    // حساب الإجمالي النهائي (بدون الضريبة أولاً)
    const totalBeforeTax = subtotal - state.discount;
    
    // حساب الإجمالي النهائي مع الضريبة
    const total = totalBeforeTax + state.tax;

    set({
      subtotal,
      total: Math.max(0, total), // تأكد من عدم كون الإجمالي سالباً
      itemCount
    });
  }
}));

// تهيئة حساب الإجماليات عند بدء التطبيق
useCart.getState().calculateTotals();
