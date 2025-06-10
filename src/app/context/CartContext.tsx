'use client';

import { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  restaurant_id: string;
  restaurant_name: string;
  description?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'HYDRATE'; payload: CartState };

const initialState: CartState = {
  items: [],
  isOpen: false,
  total: 0,
  itemCount: 0,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
      
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      
      let newItems: CartItem[];
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return { ...state, items: newItems, total, itemCount };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return { ...state, items: newItems, total, itemCount };
    }
    
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return { ...state, items: newItems, total, itemCount };
    }
    
    case 'CLEAR_CART':
      return { ...state, items: [], total: 0, itemCount: 0 };
    
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  isHydrated: boolean;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        if (typeof window === 'undefined') {
          console.log('🚫 Server-side rendering, skipping localStorage');
          setIsHydrated(true);
          return;
        }

        const savedCart = localStorage.getItem('lieferspatz-cart');
        console.log('🗄️ Loading cart from localStorage:', savedCart);
        
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('📦 Parsed cart:', parsedCart);
          
          // Validate the parsed cart structure
          if (parsedCart && typeof parsedCart === 'object' && Array.isArray(parsedCart.items)) {
            dispatch({ type: 'HYDRATE', payload: parsedCart });
            console.log('✅ Cart hydrated successfully with', parsedCart.items.length, 'items');
          } else {
            console.log('⚠️ Invalid cart data, starting with empty cart');
          }
        } else {
          console.log('📭 No saved cart found, starting with empty cart');
        }
      } catch (error) {
        console.error('❌ Error loading cart from localStorage:', error);
        // Clear corrupted data
        try {
          localStorage.removeItem('lieferspatz-cart');
        } catch (e) {
          console.error('Failed to clear corrupted cart data:', e);
        }
      } finally {
        setIsHydrated(true);
        console.log('✅ Cart hydration complete, isHydrated set to true');
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(loadCart, 50);
  }, []);

  // Save cart to localStorage whenever state changes (but not during hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        console.log('💾 Saving cart to localStorage:', state);
        localStorage.setItem('lieferspatz-cart', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [state, isHydrated]);

  const addItem = (item: MenuItem) => {
    console.log('➕ Adding item to cart:', item);
    dispatch({ type: 'ADD_ITEM', payload: item });
  };
  const removeItem = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQuantity = (id: string, quantity: number) => 
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = () => dispatch({ type: 'TOGGLE_CART' });
  const openCart = () => dispatch({ type: 'OPEN_CART' });
  const closeCart = () => dispatch({ type: 'CLOSE_CART' });

  return (
    <CartContext.Provider
      value={{
        state,
        isHydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 