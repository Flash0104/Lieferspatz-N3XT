'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBalance } from '../context/BalanceContext';
import { useCart } from '../context/CartContext';

interface Restaurant {
  id: number;
  name: string;
  address: string;
}

export default function CheckoutPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { state, isHydrated, clearCart } = useCart();
  const { balance, updateBalance } = useBalance();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 Checkout useEffect - Status:', status, 'Hydrated:', isHydrated, 'Items:', state.items.length, 'Session:', !!session);
    console.log('🔍 Session user type:', session?.user?.userType);
    console.log('🔍 Cart state:', state);
    
    // Don't redirect during loading states
    if (status === 'loading') {
      console.log('⏳ Session still loading, waiting...');
      return;
    }
    
    // Don't redirect if cart hasn't hydrated yet
    if (!isHydrated) {
      console.log('⏳ Cart not hydrated yet, waiting...');
      return;
    }
    
    // Authentication checks
    if (!session) {
      console.log('🚫 No session, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    if (session.user.userType !== 'CUSTOMER') {
      console.log('🚫 Not customer user type, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Only check cart after both session and cart are ready
    if (state.items.length === 0) {
      console.log('🛒 Cart appears empty after hydration');
      
      // Double-check localStorage directly to ensure cart is really empty
      try {
        const savedCart = localStorage.getItem('lieferspatz-cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          console.log('🔍 localStorage cart:', parsedCart);
          if (parsedCart?.items?.length > 0) {
            console.log('🔄 Found items in localStorage but not in state, waiting for re-hydration...');
            return; // Don't redirect, cart is actually not empty
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
      
      console.log('✅ Cart is confirmed empty, will redirect to home after delay');
      // Add a delay to prevent premature redirects during hydration race conditions
      setTimeout(() => {
        if (state.items.length === 0) {
          console.log('🔄 Redirecting to home page - cart still empty');
          router.push('/');
        }
      }, 2000); // Increased delay to 2 seconds
      return;
    }

    console.log('✅ All checks passed, fetching restaurant info');
    // Get restaurant info from cart items
    fetchRestaurantInfo();
  }, [session, status, state.items, router, isHydrated]);

  const fetchRestaurantInfo = async () => {
    if (state.items.length === 0) return;
    
    const restaurantId = state.items[0].restaurant_id;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
      }
    } catch (error) {
      console.error('Error fetching restaurant info:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!restaurant || state.items.length === 0) return;

    setLoading(true);
    try {
      const orderItems = state.items.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity
      }));

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          items: orderItems
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Order creation successful:', data);
        console.log('📦 Order details:', data.order);
        setOrderDetails(data.order);
        setOrderPlaced(true);
        clearCart();
        console.log('🎉 State updated - orderPlaced:', true);
        
        // Update balance immediately
        if (session?.user.balance) {
          const newBalance = session.user.balance - data.order.totalPrice;
          updateBalance(newBalance);
        }
        
        // Fetch actual balance from database
        try {
          const balanceResponse = await fetch('/api/user/balance');
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            updateBalance(balanceData.balance);
            console.log('💰 Updated balance from database:', balanceData.balance);
          }
        } catch (error) {
          console.error('Error fetching updated balance:', error);
        }
        
        // Refresh session to update balance
        await update();
        console.log('🔄 Session refreshed');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to place order';
        
        // Show a user-friendly alert with the error
        if (errorMessage.includes('Insufficient balance')) {
          alert('💳 ' + errorMessage + '\n\nPlease top up your account to continue.');
        } else {
          alert('❌ Order failed: ' + errorMessage);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !isHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">
            {status === 'loading' ? 'Loading your session...' : 'Loading your cart...'}
          </div>
        </div>
      </div>
    );
  }

  // Show loading if we have session and cart is hydrated but empty (likely during navigation)
  if (session && isHydrated && state.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600 mb-4">Your cart appears to be empty!</div>
          <div className="text-gray-500 mb-6">
            You need to add items to your cart before checking out.
          </div>
          <button 
            onClick={() => router.push('/')}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition font-medium"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  if (orderPlaced && orderDetails) {
    console.log('🎯 Rendering success page with:', { orderPlaced, orderDetails });
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-theme-card rounded-lg shadow-lg p-8 text-center" style={{ color: 'var(--foreground, #f1f5f9)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--primary, #14b8a6)', opacity: 0.2 }}>
                              <svg className="w-8 h-8" style={{ color: 'var(--primary, #14b8a6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground, #f1f5f9)' }}>Order Placed Successfully!</h1>
            <p className="mb-6" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>Your order has been sent to the restaurant and they will start preparing it soon.</p>
            
            <div className="bg-slate-700 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-lg mb-4">Order Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-medium">#{orderDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant:</span>
                  <span className="font-medium">{orderDetails.restaurant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-medium">€{orderDetails.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => router.push('/profile/customer')}
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition font-medium"
              >
                View Order Status
              </button>
              <button 
                onClick={() => router.push('/')}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug current state
  console.log('🔍 Current state:', { orderPlaced, orderDetails: !!orderDetails, itemsLength: state.items.length });

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-theme-card rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>
              
              {restaurant && (
                <div className="bg-slate-700 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-white">{restaurant.name}</h3>
                  <p className="text-slate-300 text-sm">{restaurant.address}</p>
                </div>
              )}

              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-gray-600">€{item.price.toFixed(2)} each</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      <p className="text-lg font-bold text-gray-900">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-theme-card rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4">Delivery Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{session?.user.firstName} {session?.user.lastName}</p>
                    <p className="text-gray-600">{session?.user.location}</p>
                    <p className="text-gray-600">{session?.user.postalCode}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea 
                    placeholder="e.g., Ring the doorbell, Leave at the door..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-theme-card rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-6">Payment Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal (Restaurant):</span>
                  <span>€{state.total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Service Fee (15%):</span>
                  <span>€{(state.total * 0.15).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="text-green-600">FREE</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total to Pay:</span>
                    <span>€{(state.total * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Payment Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="payment" defaultChecked className="form-radio" />
                    <span>Cash on Delivery</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer opacity-50">
                    <input type="radio" name="payment" disabled className="form-radio" />
                    <span>Credit Card (Coming Soon)</span>
                  </label>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={loading || state.items.length === 0}
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  `Place Order - €${(state.total * 1.15).toFixed(2)}`
                )}
              </button>

              {/* Current Balance */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Your Balance:</span>
                  <span className="font-medium text-green-600">
                    €{(balance ?? session?.user.balance ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 