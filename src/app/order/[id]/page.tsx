'use client';

import { calculateDistance, geocodeAddress } from '@/lib/geocoding';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import Header from '../../components/Header';
import RatingModal from '../../components/RatingModal';

// Dynamically import map component to avoid SSR issues
const OrderTrackingMap = dynamic(() => import('@/app/components/OrderTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }}></div>
});

interface OrderStatus {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  timestamp: string;
  message: string;
}

interface Order {
  id: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  estimatedDeliveryTime: string;
  deliveryInstructions?: string;
  restaurant: {
    id: number;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    courierType: 'CYCLE' | 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'WALKING';
  };
  user: {
    firstName: string;
    lastName: string;
    location: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  orderItems: Array<{
    id: number;
    quantity: number;
    menuItem: {
      name: string;
      price: number;
      imageUrl?: string;
    };
  }>;
}

function OrderTrackingContent({ orderId }: { orderId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerCoords, setCustomerCoords] = useState<{lat: number, lng: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [distance, setDistance] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Function to handle rating submission
  const handleRatingSubmit = async (rating: number, comment: string) => {
    try {
      const response = await fetch('/api/orders/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          rating: rating,
          comment: comment
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      const result = await response.json();
      console.log('✅ Rating submitted successfully:', result);
      
      setHasRated(true);
      setShowRatingModal(false);
      
      // Show success message briefly
      alert('Thank you for your rating!');

    } catch (error) {
      console.error('❌ Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  // Function to geocode customer address if coordinates are missing
  const geocodeCustomerAddress = async (order: Order) => {


    if (order.user.latitude && order.user.longitude) {
      // Coordinates already exist
      setCustomerCoords({ lat: order.user.latitude, lng: order.user.longitude });
      
              // Calculate distance to restaurant
        if (order.restaurant.latitude && order.restaurant.longitude) {
          const dist = calculateDistance(
            { latitude: order.user.latitude, longitude: order.user.longitude },
            { latitude: order.restaurant.latitude, longitude: order.restaurant.longitude }
          );
          setDistance(dist);
          console.log('📏 Distance calculated (existing coords):', dist, 'km');
        }
      return;
    }

    try {
      // Parse the address from the location string
      const locationParts = order.user.location?.split(',') || [];
      const addressData = {
        streetName: locationParts[0]?.trim() || '',
        blockNumber: '', // Not stored separately in location field
        city: order.user.location?.includes('Duisburg') ? 'Duisburg' : locationParts[1]?.trim() || '',
        postalCode: order.user.postalCode || ''
      };

      console.log('🏠 Geocoding customer address:', addressData);
      const coords = await geocodeAddress(addressData);
      
      if (coords) {
        setCustomerCoords({ lat: coords.latitude, lng: coords.longitude });
        console.log('✅ Customer geocoding successful:', coords);
        
        // Calculate distance to restaurant
        if (order.restaurant.latitude && order.restaurant.longitude) {
                      const dist = calculateDistance(
              { latitude: coords.latitude, longitude: coords.longitude },
              { latitude: order.restaurant.latitude, longitude: order.restaurant.longitude }
            );
          setDistance(dist);
          console.log('📏 Distance calculated:', dist, 'km');
        }
      } else {
        console.warn('❌ Customer geocoding failed, using default coords');
        setCustomerCoords({ lat: 51.4318054, lng: 6.7602219 }); // Default to Duisburg
        
        // Calculate distance with default coords
        if (order.restaurant.latitude && order.restaurant.longitude) {
                  const dist = calculateDistance(
          { latitude: 51.4318054, longitude: 6.7602219 },
          { latitude: order.restaurant.latitude, longitude: order.restaurant.longitude }
        );
          setDistance(dist);
        }
      }
    } catch (error) {
      console.error('❌ Error geocoding customer address:', error);
      setCustomerCoords({ lat: 51.4318054, lng: 6.7602219 }); // Default to Duisburg
      
      // Set fallback distance if no data available
      setDistance(0.72); // Default distance for demo
    }

    // Fallback when no location data is available at all
    if (!order.user.location && !order.user.postalCode) {
      console.warn('⚠️ No location data available, using fallback coordinates and distance');
      setCustomerCoords({ lat: 51.4318054, lng: 6.7602219 }); // Default customer location in Duisburg
      
      // Calculate distance using fallback coordinates
      const restaurantLat = order.restaurant.latitude || 51.4323509;
      const restaurantLng = order.restaurant.longitude || 6.7705702;
      const fallbackDistance = calculateDistance(
        { latitude: 51.4318054, longitude: 6.7602219 }, // Default customer coordinates
        { latitude: restaurantLat, longitude: restaurantLng }
      );
      setDistance(fallbackDistance);
      console.log('📏 Fallback distance calculated:', fallbackDistance, 'km');
    }
  };

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    fetchOrder();
    
    // Update current time every 30 seconds for more accurate countdown
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    // Poll for order updates every 5 seconds for fast dynamic status changes
    const orderTimer = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => {
      clearInterval(timeTimer);
      clearInterval(orderTimer);
    };
  }, [orderId, session]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const data = await response.json();
      
      // Check if order has been rated
      try {
        const ratingResponse = await fetch(`/api/orders/${orderId}/rating`);
        if (ratingResponse.ok) {
          const ratingData = await ratingResponse.json();
          setHasRated(ratingData.hasRating || false);
        }
      } catch (ratingError) {
        console.log('No rating found for this order yet');
      }
      
      // Auto-show rating modal if order is just delivered and not rated yet
      const wasDelivered = order?.status !== 'DELIVERED' && data.order.status === 'DELIVERED';
      if (wasDelivered && !hasRated) {
        setTimeout(() => {
          setShowRatingModal(true);
        }, 2000); // Show modal 2 seconds after delivery status update
      }
      
      setOrder(data.order);
      
      // Geocode customer address if needed  
      if (data.order) {
        await geocodeCustomerAddress(data.order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (): OrderStatus[] => {
    if (!order) return [];
    
    const orderTime = new Date(order.createdAt);
    const currentStatus = order.status;
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    const baseSteps: OrderStatus[] = [
      {
        id: 'pending',
        status: 'PENDING',
        timestamp: order.createdAt,
        message: 'Order placed successfully'
      },
      {
        id: 'confirmed',
        status: 'CONFIRMED',
        timestamp: currentIndex >= 1 ? new Date(orderTime.getTime() + 2 * 60000).toISOString() : '',
        message: 'Restaurant confirmed your order'
      },
      {
        id: 'preparing',
        status: 'PREPARING',
        timestamp: currentIndex >= 2 ? new Date(orderTime.getTime() + 5 * 60000).toISOString() : '',
        message: 'Restaurant is preparing your food'
      },
      {
        id: 'ready',
        status: 'READY',
        timestamp: currentIndex >= 3 ? new Date(orderTime.getTime() + 18 * 60000).toISOString() : '',
        message: 'Food is ready for pickup'
      },
      {
        id: 'out_for_delivery',
        status: 'OUT_FOR_DELIVERY',
        timestamp: currentIndex >= 4 ? new Date(orderTime.getTime() + 20 * 60000).toISOString() : '',
        message: 'Courier is on the way'
      },
      {
        id: 'delivered',
        status: 'DELIVERED',
        timestamp: currentIndex >= 5 ? new Date(orderTime.getTime() + (20 + (distance ? (distance / 15) * 60 : 10)) * 60000).toISOString() : '',
        message: 'Order delivered successfully'
      }
    ];

    return baseSteps;
  };

  const getCurrentStatusIndex = (): number => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    return statusOrder.indexOf(order?.status || 'PENDING');
  };

  const calculateDeliveryTime = (): string => {
    if (!order || distance === null) return '';
    
    const courierSpeeds = {
      WALKING: 5, // km/h
      CYCLE: 15, // km/h
      BICYCLE: 15, // km/h
      MOTORCYCLE: 30, // km/h
      CAR: 25 // km/h (accounting for traffic)
    };
    
    const preparationTime = 20; // minutes
    const actualDistance = distance; // Use the real calculated distance
    const speed = courierSpeeds[order.restaurant.courierType];
    const deliveryTime = (actualDistance / speed) * 60; // minutes
    
    console.log('Delivery calculation:', {
      preparationTime,
      actualDistance,
      speed,
      deliveryTime: Math.round(deliveryTime),
      totalTime: Math.round(preparationTime + deliveryTime)
    });
    
    const totalTime = preparationTime + deliveryTime;
    const deliveryDate = new Date(order.createdAt);
    deliveryDate.setMinutes(deliveryDate.getMinutes() + totalTime);
    
    return deliveryDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDeliveryBreakdown = (): string => {
    if (!order || distance === null) return '';
    
    const courierSpeeds = {
      WALKING: 5, // km/h
      CYCLE: 15, // km/h
      BICYCLE: 15, // km/h
      MOTORCYCLE: 30, // km/h
      CAR: 25 // km/h (accounting for traffic)
    };
    
    const preparationTime = 20; // minutes
    const actualDistance = distance; // Use the real calculated distance
    const speed = courierSpeeds[order.restaurant.courierType];
    const deliveryTime = (actualDistance / speed) * 60; // minutes
    
    return `${preparationTime} min prep + ${Math.round(deliveryTime)} min delivery (${actualDistance.toFixed(2)} km)`;
  };

  const getEstimatedTimeRemaining = (): string => {
    if (!order || distance === null) return '';
    
    const courierSpeeds = {
      WALKING: 5, // km/h
      CYCLE: 15, // km/h
      BICYCLE: 15, // km/h
      MOTORCYCLE: 30, // km/h
      CAR: 25 // km/h (accounting for traffic)
    };
    
    const orderTime = new Date(order.createdAt);
    const currentStatus = order.status;
    const actualDistance = distance;
    const speed = courierSpeeds[order.restaurant.courierType];
    const now = new Date();
    
    let estimatedDelivery: Date;
    
    // Dynamic estimation based on current status
    switch (currentStatus) {
      case 'PENDING':
      case 'CONFIRMED':
        // Full preparation + delivery time from order time
        const totalTime = 20 + (actualDistance / speed) * 60;
        estimatedDelivery = new Date(orderTime.getTime() + totalTime * 60 * 1000);
        break;
      case 'PREPARING':
        // Assume 18 minutes prep total, calculate remaining prep + delivery
        const prepStartTime = new Date(orderTime.getTime() + 2 * 60 * 1000); // Started 2 min after order
        const remainingPrepTime = Math.max(0, 18 - (now.getTime() - prepStartTime.getTime()) / (60 * 1000));
        const prepAndDeliveryTime = remainingPrepTime + (actualDistance / speed) * 60;
        estimatedDelivery = new Date(now.getTime() + prepAndDeliveryTime * 60 * 1000);
        break;
      case 'READY':
      case 'OUT_FOR_DELIVERY':
        // Only delivery time remaining from now
        const deliveryTime = (actualDistance / speed) * 60;
        estimatedDelivery = new Date(now.getTime() + deliveryTime * 60 * 1000);
        break;
      case 'DELIVERED':
        return 'Delivered! 🎉';
      default:
        const defaultTime = 20 + (actualDistance / speed) * 60;
        estimatedDelivery = new Date(orderTime.getTime() + defaultTime * 60 * 1000);
    }
    
    const remainingMs = estimatedDelivery.getTime() - now.getTime();
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / (1000 * 60)));
    
    if (remainingMinutes === 0) {
      return 'Arriving now! 🚚';
    } else if (remainingMinutes < 60) {
      return `${remainingMinutes} min`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getCourierIcon = (courierType: string): string => {
    switch (courierType) {
      case 'CYCLE':
      case 'BICYCLE': return '🚲';
      case 'MOTORCYCLE': return '🏍️';
      case 'CAR': return '🚗';
      case 'WALKING': return '🚶‍♂️';
      default: return '🚲';
    }
  };

  if (loading || !customerCoords) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
        color: 'var(--foreground)'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--primary)' }}></div>
          <div className="text-lg">
            {!order ? 'Loading order...' : 'Loading map...'}
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ 
        background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
        color: 'var(--foreground)'
      }}>
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold mb-4">{error || 'Order not found'}</h2>
          <button 
            onClick={() => router.push('/profile/customer')}
            className="px-6 py-3 rounded-lg font-medium transition"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--foreground)'
            }}
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const currentStatusIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)',
      color: 'var(--foreground)'
    }}>
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Order Tracking
          </h1>
          <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
            Order #{order.id} • {order.restaurant.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="rounded-lg overflow-hidden" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <OrderTrackingMap 
                restaurantLocation={{
                  lat: order.restaurant.latitude || 51.4323509,
                  lng: order.restaurant.longitude || 6.7705702,
                  name: order.restaurant.name || "N'eighbour's Kfc Heaven from Africa",
                  address: order.restaurant.address || "Königstraße 56, Duisburg, 47051"
                }}
                customerLocation={{
                  lat: customerCoords?.lat || order.user.latitude || 51.4318054,
                  lng: customerCoords?.lng || order.user.longitude || 6.7602219,
                  name: `${order.user.firstName || 'Aiden'} ${order.user.lastName || 'Sucuk'}`,
                  address: `${order.user.location || 'Pater-Bruns-Weg 85, Gellenkirchen'}, ${order.user.postalCode || '52511'}`
                }}
                courierType={order.restaurant.courierType}
                orderStatus={order.status}
              />
            </div>

            {/* Order Status Timeline */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  Order Progress
                </h3>
                <div className="text-sm" style={{ color: 'var(--primary)' }}>
                  Status: <span className="font-semibold capitalize">{order.status.toLowerCase().replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {statusSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4`} style={{
                      backgroundColor: index <= currentStatusIndex ? '#22c55e' : 'rgba(148, 163, 184, 0.3)',
                      color: index <= currentStatusIndex ? '#ffffff' : 'var(--foreground)'
                    }}>
                      {index <= currentStatusIndex ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{
                        color: index <= currentStatusIndex ? '#22c55e' : 'rgba(148, 163, 184, 0.7)'
                      }}>
                        {step.message}
                      </p>
                      {step.timestamp && (
                        <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                          {new Date(step.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Order Items
              </h3>
              
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{
                      backgroundColor: 'rgba(148, 163, 184, 0.1)'
                    }}>
                      <img 
                        src={item.menuItem.imageUrl || `https://placehold.co/64x64/e5e7eb/6b7280?text=${encodeURIComponent(item.menuItem.name)}`}
                        alt={item.menuItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>
                        {item.menuItem.name}
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: '#22c55e' }}>
                        €{(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Info */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                  Delivery Info
                </h3>
                <div className="flex items-center text-xs" style={{ color: 'var(--primary)' }}>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live updates
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {getCourierIcon(order.restaurant.courierType)}
                  </div>
                  <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                    {order.restaurant.courierType === 'CYCLE' ? 'bicycle' : order.restaurant.courierType.toLowerCase()}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    Estimated arrival
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    {getEstimatedTimeRemaining()}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    by {calculateDeliveryTime()}
                  </p>
                </div>

                {/* Distance and Delivery Breakdown */}
                <div className="text-center border-t pt-4" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    Distance
                  </p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {distance !== null ? `${distance.toFixed(2)} km` : 'Loading...'}
                  </p>
                  {distance !== null && (
                    <p className="text-xs mt-2" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                      {getDeliveryBreakdown()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Restaurant
              </h3>
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {order.restaurant.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {order.restaurant.address}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Delivery Address
              </h3>
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {order.user.firstName} {order.user.lastName}
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {order.user.location}
                </p>
                <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                  {order.user.postalCode}
                </p>
              </div>
              
              {order.deliveryInstructions && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Delivery Instructions:
                  </p>
                  <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                    {order.deliveryInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-lg p-6" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
                Order Summary
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--foreground)', opacity: 0.8 }}>Total Paid:</span>
                  <span className="font-bold" style={{ color: '#22c55e' }}>
                    €{order.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--foreground)', opacity: 0.8 }}>Order Time:</span>
                  <span style={{ color: 'var(--foreground)' }}>
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Rating Button for Delivered Orders */}
              {order.status === 'DELIVERED' && !hasRated && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="w-full py-3 px-4 rounded-lg transition-colors font-medium"
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: 'white'
                    }}
                  >
                    ⭐ Rate This Order
                  </button>
                </div>
              )}
              
              {/* Already Rated Message */}
              {order.status === 'DELIVERED' && hasRated && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                  <div className="text-center py-2" style={{ color: 'var(--primary)' }}>
                    ✅ Thank you for rating this order!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        restaurantName={order.restaurant.name}
        orderId={order.id}
      />
    </div>
  );
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <>
      <Header />
      <OrderTrackingContent orderId={resolvedParams.id} />
    </>
  );
}
