'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function CartSidebar() {
  const { state, closeCart, removeItem, updateQuantity } = useCart();
  const router = useRouter();

  // Close cart when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };

    if (state.isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [state.isOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="cart-overlay"
        onClick={closeCart}
      />
      
      {/* Sidebar - slides in from RIGHT */}
      <div className={`cart-sidebar ${state.isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{
          borderColor: 'rgba(148, 163, 184, 0.2)',
          backgroundColor: 'var(--card)'
        }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Your Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-white transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--background)' }}>
          {state.items.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto mb-6" style={{ color: 'var(--foreground)', opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13h10m-4 7a1 1 0 11-2 0 1 1 0 012 0zm5 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>Your cart is empty</p>
              <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 rounded-xl transition-all hover:shadow-lg" style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  {/* Item Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--foreground)' }}>
                      {item.name}
                    </h3>
                    <p className="text-xl font-bold mb-1" style={{ color: 'var(--primary)' }}>
                      €{item.price.toFixed(2)}
                    </p>
                    <p className="text-base truncate" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                      {item.restaurant_name}
                    </p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:scale-105 shadow-md"
                      style={{
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid rgba(148, 163, 184, 0.3)'
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="text-xl font-bold w-10 text-center" style={{ color: 'var(--foreground)' }}>
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:scale-105 shadow-md"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:scale-105 shadow-md ml-1"
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white'
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total and Checkout - Always at bottom */}
        {state.items.length > 0 && (
          <div className="border-t p-6" style={{
            borderColor: 'rgba(148, 163, 184, 0.2)',
            backgroundColor: 'var(--card)'
          }}>
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Subtotal (Restaurant):</span>
                  <span className="font-bold text-xl" style={{ color: 'var(--foreground)' }}>€{state.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Service Fee (15%):</span>
                  <span className="font-bold text-xl" style={{ color: 'var(--foreground)' }}>€{(state.total * 0.15).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Delivery Fee:</span>
                  <span className="font-bold text-xl" style={{ color: '#10b981' }}>FREE</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-2xl font-bold pt-5 border-t" style={{
                borderColor: 'rgba(148, 163, 184, 0.3)',
                color: 'var(--foreground)'
              }}>
                <span>Total to Pay:</span>
                <span style={{ color: 'var(--primary)' }}>€{(state.total * 1.15).toFixed(2)}</span>
              </div>
              
              <button 
                onClick={handleCheckout}
                className="w-full py-5 rounded-xl font-bold text-xl transition-all hover:scale-105 hover:shadow-lg shadow-md"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white'
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 