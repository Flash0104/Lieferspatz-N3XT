'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import Header from '../../components/Header';
import { useCart } from '../../context/CartContext';

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
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
        color: 'var(--foreground)'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
        color: 'var(--foreground)'
      }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            {error || 'Restaurant not found'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            This restaurant may not exist or may be temporarily unavailable.
          </p>
          <a 
            href="/"
            className="px-6 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--foreground)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24" style={{ 
      background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
      color: 'var(--foreground)'
    }}>
      {/* Restaurant Header */}
      <div className="shadow-sm border-b" style={{
        backgroundColor: 'var(--card)',
        borderColor: 'rgba(148, 163, 184, 0.2)'
      }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {restaurant.name}
              </h1>
              <p className="mb-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                {restaurant.address}, {restaurant.city}
              </p>
              {restaurant.description && (
                <p className="mb-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {restaurant.description}
                </p>
              )}
              <div className="flex items-center">
                <span className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {restaurant.rating.toFixed(1)}
                </span>
                <span className="text-lg text-yellow-500 mx-1">★</span>
                <span className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                  rating
                </span>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-end gap-2">
              <div className="px-3 py-1 rounded-full text-sm font-medium" style={{
                backgroundColor: restaurant.isOpen ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: restaurant.isOpen ? '#22c55e' : '#ef4444'
              }}>
                {restaurant.isOpen ? '● Open' : '● Closed'}
              </div>
              <span className="px-3 py-1 rounded-full text-sm font-medium" style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#22c55e'
              }}>
                €0 Delivery Fee
              </span>
              <span className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                Delivery: {restaurant.averagePrepTime} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: 'var(--foreground)' }}>Menu</h2>
        
        {!restaurant.isOpen && (
          <div className="border rounded-lg p-4 mb-8" style={{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(251, 191, 36, 0.3)'
          }}>
            <div className="flex items-center">
              <div className="mr-3" style={{ color: '#eab308' }}>⚠️</div>
              <div>
                <h3 className="font-medium" style={{ color: '#eab308' }}>Restaurant is currently closed</h3>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                  You can still browse the menu, but orders may not be processed immediately.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              No menu items available
            </h3>
            <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              This restaurant hasn't added any menu items yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div 
                key={item.id} 
                className="rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow menu-item"
                style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'rgba(148, 163, 184, 0.2)'
                }}
              >
                <div className="h-48 overflow-hidden" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                  <img 
                    src={item.imageUrl || `https://placehold.co/300x200/e5e7eb/6b7280?text=${encodeURIComponent(item.name)}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                      {item.name}
                    </h3>
                    <span className="px-2 py-1 rounded text-xs" style={{
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      color: 'var(--foreground)'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm mb-3 line-clamp-2" style={{ 
                      color: 'var(--foreground)', 
                      opacity: 0.8 
                    }}>
                      {item.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold" style={{ color: '#22c55e' }}>
                      €{item.price.toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!restaurant.isOpen}
                      className="px-4 py-2 rounded-lg font-medium transition-all"
                      style={{
                        backgroundColor: !restaurant.isOpen 
                          ? 'rgba(148, 163, 184, 0.3)'
                          : addedItems.has(item.id.toString())
                            ? '#22c55e'
                            : !session 
                              ? '#3b82f6'
                              : session.user.userType !== 'CUSTOMER'
                                ? 'var(--accent)'
                                : 'var(--primary)',
                        color: !restaurant.isOpen 
                          ? 'rgba(148, 163, 184, 0.7)'
                          : 'var(--foreground)',
                        cursor: !restaurant.isOpen ? 'not-allowed' : 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (restaurant.isOpen) {
                          e.currentTarget.style.filter = 'brightness(0.9)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (restaurant.isOpen) {
                          e.currentTarget.style.filter = 'brightness(1)'
                        }
                      }}
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
    <>
      <Header />
      <RestaurantMenuContent restaurantId={resolvedParams.id} />
    </>
  );
} 