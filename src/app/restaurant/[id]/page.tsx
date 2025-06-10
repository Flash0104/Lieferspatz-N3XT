'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import CartSidebar from '../../components/CartSidebar';
import Header from '../../components/Header';
import { CartProvider, useCart } from '../../context/CartContext';

interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  description?: string;
  rating: number;
  isOpen: boolean;
  averagePrepTime: number;
  imageUrl?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  restaurantId: number;
}

function RestaurantMenuContent({ restaurantId }: { restaurantId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantData();
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (!response.ok) {
        throw new Error('Restaurant not found');
      }
      const data = await response.json();
      setRestaurant(data.restaurant);
      setMenuItems(data.restaurant.menuItems || []);
    } catch (err) {
      console.error('Error fetching restaurant:', err);
      setError('Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    // Check if user is authenticated and is a customer
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    if (session.user.userType !== 'CUSTOMER') {
      alert('Only customers can add items to cart. Please log in with a customer account.');
      return;
    }

    addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      image_url: item.imageUrl || `https://placehold.co/300x200/e5e7eb/6b7280?text=${encodeURIComponent(item.name)}`,
      restaurant_id: item.restaurantId.toString(),
      restaurant_name: restaurant?.name || '',
      description: item.description
    });
    
    // Show feedback
    setAddedItems(prev => new Set(prev).add(item.id.toString()));
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id.toString());
        return newSet;
      });
    }, 1500);

    // Open cart after adding item
    setTimeout(() => {
      openCart();
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen pt-20 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {error || 'Restaurant not found'}
          </h2>
          <p className="text-gray-500 mb-6">
            This restaurant may not exist or may be temporarily unavailable.
          </p>
          <a 
            href="/"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 font-medium"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-100">
      {/* Restaurant Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              <p className="text-gray-600 mb-2">{restaurant.address}, {restaurant.city}</p>
              {restaurant.description && (
                <p className="text-gray-500 mb-2">{restaurant.description}</p>
              )}
              <div className="flex items-center">
                <span className="text-lg font-semibold">{restaurant.rating.toFixed(1)}</span>
                <span className="text-lg text-yellow-500 mx-1">★</span>
                <span className="text-sm text-gray-600">rating</span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                restaurant.isOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurant.isOpen ? '● Open' : '● Closed'}
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                €0 Delivery Fee
              </span>
              <span className="text-sm text-gray-500">
                Delivery: {restaurant.averagePrepTime} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Menu</h2>
        
        {!restaurant.isOpen && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <h3 className="font-medium text-yellow-800">Restaurant is currently closed</h3>
                <p className="text-yellow-700 text-sm">You can still browse the menu, but orders may not be processed immediately.</p>
              </div>
            </div>
          </div>
        )}
        
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No menu items available
            </h3>
            <p className="text-gray-500">
              This restaurant hasn't added any menu items yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow menu-item"
              >
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={item.imageUrl || `https://placehold.co/300x200/e5e7eb/6b7280?text=${encodeURIComponent(item.name)}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {item.category}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">
                      €{item.price.toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!restaurant.isOpen}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        !restaurant.isOpen 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : addedItems.has(item.id.toString())
                            ? 'bg-green-500 text-white'
                            : !session 
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : session.user.userType !== 'CUSTOMER'
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      {!restaurant.isOpen ? (
                        'Closed'
                      ) : addedItems.has(item.id.toString()) ? (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Added!
                        </div>
                      ) : !session ? (
                        'Login to Order'
                      ) : session.user.userType !== 'CUSTOMER' ? (
                        'Customer Only'
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestaurantMenu({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <CartProvider>
      <Header />
      <RestaurantMenuContent restaurantId={resolvedParams.id} />
      <CartSidebar />
    </CartProvider>
  );
} 