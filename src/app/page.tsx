'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from './components/Header';
import { CartProvider } from './context/CartContext';

interface Restaurant {
  id: number;
  name: string;
  address: string;
  city: string;
  imageUrl: string | null;
  description: string | null;
  rating: number;
  isOpen: boolean;
  displayOrder: number;
  averagePrepTime: number;
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link 
      href={`/restaurant/${restaurant.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow restaurant-card"
    >
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img 
          src={restaurant.imageUrl || `https://placehold.co/400x200/e5e7eb/6b7280?text=${encodeURIComponent(restaurant.name)}`}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
          <div className="flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="ml-1 text-sm text-gray-600">{restaurant.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {restaurant.description || 'Delicious food awaits you!'}
        </p>
        
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{restaurant.address}, {restaurant.city}</span>
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              restaurant.isOpen ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span>{restaurant.isOpen ? 'Open' : 'Closed'}</span>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          <span>⏱ {restaurant.averagePrepTime} min</span>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants');
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      setRestaurants(data.restaurants || []);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartProvider>
      <Header />
      
      <main className="min-h-screen pt-20 bg-gray-100">
        
        {/* Hero Section */}
        <div className="pt-20 pb-8 bg-gradient-to-r from-teal-400 to-teal-600 text-white">
          <div className="max-w-6xl mx-auto px-6 py-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              🍕 Lieferspatz
            </h1>
            <p className="text-xl md:text-2xl mb-4">
              Order delicious food from your favorite restaurants
            </p>
            <p className="text-lg text-teal-100">
              Use the search bar above to find restaurants in your area
            </p>
          </div>
        </div>

        {/* Restaurants Section */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Available Restaurants
            </h2>
            <p className="text-gray-600">
              Discover amazing food from local restaurants
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button 
                onClick={fetchRestaurants}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Try Again
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No restaurants available yet
              </h3>
              <p className="text-gray-500 mb-6">
                Be the first to register your restaurant and start serving customers!
              </p>
              <Link 
                href="/auth/register"
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 font-medium"
              >
                Register as Restaurant
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Why Choose Lieferspatz?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">Get your food delivered quickly and fresh to your doorstep</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Food</h3>
                <p className="text-gray-600">Partner restaurants serve only the highest quality meals</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
                <p className="text-gray-600">Competitive prices with no hidden fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p>&copy; 2024 Lieferspatz. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </CartProvider>
  );
}
