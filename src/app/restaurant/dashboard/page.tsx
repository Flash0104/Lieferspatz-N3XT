'use client';

import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  isOpen: boolean;
  balance: number;
  rating: number;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    price: number;
  };
}

interface Order {
  id: number;
  totalPrice: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    location: string;
  };
  customer: {
    address: string;
  };
  items: OrderItem[];
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

export default function RestaurantDashboardPage() {
  return (
    <ErrorBoundary>
      <RestaurantDashboard />
    </ErrorBoundary>
  );
}

function RestaurantDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [orderLoading, setOrderLoading] = useState<{[key: number]: boolean}>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.userType !== 'RESTAURANT') {
      console.log('No valid restaurant session, redirecting to login');
      router.push('/auth/login');
      return;
    }

    // Add a small delay to ensure session is fully initialized
    const timer = setTimeout(() => {
      fetchRestaurantData();
    }, 100);

    return () => clearTimeout(timer);
  }, [session, status, router]);

  const fetchRestaurantData = async () => {
    try {
      const response = await fetch('/api/user/restaurant');
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        fetchOrders(data.restaurant.id);
        fetchMenuItems(data.restaurant.id);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        console.log('Unauthorized access, redirecting to login');
        router.push('/auth/login');
        return;
      } else {
        console.error('Failed to fetch restaurant data:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      // On fetch error, try redirecting to login after a delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (restaurantId: number) => {
    try {
      const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else if (response.status === 401) {
        console.log('Unauthorized access to orders');
        // Don't redirect here, let the main auth check handle it
      } else {
        console.error('Failed to fetch orders:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchMenuItems = async (restaurantId: number) => {
    try {
      const response = await fetch(`/api/menu?restaurantId=${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menuItems);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId: number, newStatus: string) => {
    if (!restaurant) return;

    setOrderLoading(prev => ({...prev, [orderId]: true}));
    
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          restaurantId: restaurant.id
        })
      });

      if (response.ok) {
        // Refresh orders after update
        fetchOrders(restaurant.id);
        setNotification({
          message: `Order #${orderId} ${newStatus.toLowerCase()} successfully!`,
          type: 'success'
        });
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          message: 'Failed to update order status',
          type: 'error'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({
        message: 'Failed to update order status',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setOrderLoading(prev => ({...prev, [orderId]: false}));
    }
  };

  const toggleRestaurantStatus = async () => {
    if (!restaurant || updating) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/user/restaurant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: restaurant.name,
          address: restaurant.address,
          city: restaurant.city,
          isOpen: !restaurant.isOpen,
          averagePrepTime: 20
        })
      });

      if (response.ok) {
        setRestaurant({
          ...restaurant,
          isOpen: !restaurant.isOpen
        });
      } else {
        alert('Failed to update restaurant status');
      }
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      alert('Failed to update restaurant status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'ACCEPTED':
        return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'PREPARING':
        return 'border-purple-500 bg-purple-50 text-purple-700';
      case 'READY':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'DELIVERED':
        return 'border-green-600 bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'border-red-500 bg-red-50 text-red-700';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (!restaurant) return;
    
    // Auto-refresh orders every 30 seconds
    const interval = setInterval(() => {
      fetchOrders(restaurant.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [restaurant]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading restaurant dashboard...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Authentication required</div>
          <button 
            onClick={() => router.push('/auth/login')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (session.user.userType !== 'RESTAURANT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Access denied - Restaurant account required</div>
          <button 
            onClick={() => router.push('/auth/register?type=restaurant')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
          >
            Register as Restaurant
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Restaurant profile not found</div>
          <div className="text-gray-600 mb-4">Your restaurant profile may not be set up yet.</div>
          <button 
            onClick={() => router.push('/profile/restaurant')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
          >
            Set Up Restaurant Profile
          </button>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(order => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status));
  const completedOrders = orders.filter(order => ['DELIVERED', 'CANCELLED'].includes(order.status));

  return (
    <div className="min-h-screen bg-gray-100 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Restaurant Dashboard</h1>
        
        {/* Restaurant Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{restaurant.name}</h2>
              <p className="text-gray-600">{restaurant.address}, {restaurant.city}</p>
              <div className="flex items-center mt-2">
                <span className="text-yellow-500">★</span>
                <span className="ml-1 text-gray-700">{restaurant.rating.toFixed(1)} rating</span>
              </div>
              <div className="mt-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  restaurant.isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {restaurant.isOpen ? '● Open' : '● Closed'}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-gray-100 px-4 py-2 rounded-lg mb-4">
                <div className="text-sm text-gray-600">Restaurant Balance</div>
                <div className="text-2xl font-bold text-green-600">€{restaurant.balance.toFixed(2)}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={toggleRestaurantStatus}
                  disabled={updating}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    restaurant.isOpen
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  } disabled:opacity-50`}
                >
                  {updating ? 'Updating...' : restaurant.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
                </button>
                <button 
                  onClick={() => router.push('/profile/restaurant')}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Manage Restaurant
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status Alert */}
        {!restaurant.isOpen && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Your restaurant is currently closed</h3>
                <p className="text-yellow-700 text-sm">Customers cannot place orders. Click "Open Restaurant" to start accepting orders.</p>
              </div>
              <button 
                onClick={toggleRestaurantStatus}
                disabled={updating}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 ml-4"
              >
                {updating ? 'Opening...' : 'Open Now'}
              </button>
            </div>
          </div>
        )}

        {/* Menu Items Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Menu Items ({menuItems.length})</h3>
            <button 
              onClick={() => router.push('/profile/restaurant')}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
            >
              Manage Menu
            </button>
          </div>
          
          {menuItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No menu items yet</p>
              <button 
                onClick={() => router.push('/profile/restaurant')}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
              >
                Add Your First Menu Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.slice(0, 6).map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <img 
                    src={item.imageUrl || '/images/default-food.png'}
                    alt={item.name} 
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                  <h4 className="font-semibold">{item.name}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                  <p className="text-teal-600 font-bold">€{item.price.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">Category: {item.category}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'PENDING').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">👨‍🍳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.status)).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'DELIVERED').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">€{orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Orders */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Active Orders ({pendingOrders.length})</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active orders</p>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className={`border-l-4 pl-4 py-3 rounded-r-lg ${getStatusColor(order.status)}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">Order #{order.id}</h4>
                        <p className="text-sm text-gray-600">
                          {order.user.firstName} {order.user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{order.user.location}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">€{order.totalPrice.toFixed(2)}</div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1">Items:</p>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.menuItem.name}</span>
                          <span>€{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id, 'ACCEPTED')}
                            disabled={orderLoading[order.id]}
                            className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {orderLoading[order.id] ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                            disabled={orderLoading[order.id]}
                            className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {orderLoading[order.id] ? '...' : 'Cancel'}
                          </button>
                        </>
                      )}
                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'PREPARING')}
                          disabled={orderLoading[order.id]}
                          className="bg-purple-500 text-white text-xs px-3 py-1 rounded hover:bg-purple-600 disabled:opacity-50"
                        >
                          {orderLoading[order.id] ? '...' : 'Start Preparing'}
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'READY')}
                          disabled={orderLoading[order.id]}
                          className="bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {orderLoading[order.id] ? '...' : 'Mark Ready'}
                        </button>
                      )}
                      {order.status === 'READY' && (
                        <button
                          onClick={() => handleOrderStatusUpdate(order.id, 'DELIVERED')}
                          disabled={orderLoading[order.id]}
                          className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                          {orderLoading[order.id] ? '...' : 'Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Completed Orders</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {completedOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed orders yet</p>
              ) : (
                completedOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className={`border-l-4 pl-4 py-2 ${getStatusColor(order.status)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">Order #{order.id}</h4>
                        <p className="text-sm text-gray-600">
                          {order.user.firstName} {order.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                        <p className="text-sm">Status: <span className="font-medium">{order.status.toLowerCase()}</span></p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">€{order.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Items:</p>
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center mt-1">
                          <span className="text-sm">{item.quantity}x {item.menuItem.name}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-gray-500 mt-1">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {notification && (
          <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
} 