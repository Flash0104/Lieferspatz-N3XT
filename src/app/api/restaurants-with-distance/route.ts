import { calculateDistance, geocodeAddress } from '@/lib/geocoding';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Cache for customer coordinates to avoid repeated geocoding
const customerCoordinatesCache = new Map<string, { latitude: number; longitude: number } | null>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, streetName, blockNumber, postalCode } = body;

    if (!city || !streetName || !blockNumber) {
      return NextResponse.json(
        { error: 'City, street name, and block number are required' },
        { status: 400 }
      );
    }

    const customerAddress = {
      city,
      streetName,
      blockNumber,
      postalCode
    };

    // Create cache key for customer address
    const customerCacheKey = `${customerAddress.city}-${customerAddress.streetName}-${customerAddress.blockNumber}-${customerAddress.postalCode || 'no-postal'}`;
    
    // Get customer coordinates (with caching)
    let customerCoords = customerCoordinatesCache.get(customerCacheKey);
    if (customerCoords === undefined) {
      console.log('Geocoding customer address:', customerAddress);
      customerCoords = await geocodeAddress(customerAddress);
      customerCoordinatesCache.set(customerCacheKey, customerCoords);
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        AND: [
          { city: { not: null } },
          { streetName: { not: null } },
          { blockNumber: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        streetName: true,
        blockNumber: true,
        postalCode: true,
        address: true,
        description: true,
        rating: true,
        isOpen: true,
        averagePrepTime: true,
        imageUrl: true,
        latitude: true,
        longitude: true
      }
    });

    const restaurantsWithDistance = await Promise.all(
      restaurants.map(async (restaurant) => {
        try {
          let distance: number | null = null;

          if (customerCoords) {
            // Check if restaurant has stored coordinates
            if (restaurant.latitude && restaurant.longitude) {
              // Use stored coordinates - instant calculation
              distance = calculateDistance(
                customerCoords,
                { latitude: restaurant.latitude, longitude: restaurant.longitude }
              );
              console.log(`Using stored coordinates for ${restaurant.name}: ${distance?.toFixed(2)} km`);
            } else {
              // Geocode restaurant address only if no stored coordinates
              console.log(`Geocoding restaurant ${restaurant.name}`);
              const restaurantAddress = {
                city: restaurant.city!,
                streetName: restaurant.streetName!,
                blockNumber: restaurant.blockNumber!,
                postalCode: restaurant.postalCode || undefined
              };
              
              const restaurantCoords = await geocodeAddress(restaurantAddress);
              if (restaurantCoords) {
                distance = calculateDistance(customerCoords, restaurantCoords);
                
                // Update restaurant with geocoded coordinates for future use
                await prisma.restaurant.update({
                  where: { id: restaurant.id },
                  data: {
                    latitude: restaurantCoords.latitude,
                    longitude: restaurantCoords.longitude
                  }
                });
                console.log(`Geocoded and stored coordinates for ${restaurant.name}: ${distance?.toFixed(2)} km`);
              }
            }
          }

          return {
            ...restaurant,
            distance: distance ? parseFloat(distance.toFixed(2)) : null,
            distanceText: distance 
              ? `${distance.toFixed(1)} km` 
              : 'Distance unavailable'
          };
        } catch (error) {
          console.error(`Error calculating distance for ${restaurant.name}:`, error);
          return {
            ...restaurant,
            distance: null,
            distanceText: 'Distance unavailable'
          };
        }
      })
    );

    const sortedRestaurants = restaurantsWithDistance.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return NextResponse.json(sortedRestaurants);
  } catch (error) {
    console.error('Error fetching restaurants with distance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants with distance' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Default customer address (cached for repeated calls)
    const defaultCustomerAddress = {
      city: 'Duisburg',
      streetName: 'Sonnenwall',
      blockNumber: '56',
      postalCode: '47057'
    };

    const customerCacheKey = 'default-duisburg-sonnenwall-56-47057';
    
    // Get customer coordinates (with caching)
    let customerCoords = customerCoordinatesCache.get(customerCacheKey);
    if (customerCoords === undefined) {
      console.log('Geocoding default customer address');
      customerCoords = await geocodeAddress(defaultCustomerAddress);
      customerCoordinatesCache.set(customerCacheKey, customerCoords);
    }

    const restaurants = await prisma.restaurant.findMany({
      where: {
        AND: [
          { city: { not: null } },
          { streetName: { not: null } },
          { blockNumber: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        streetName: true,
        blockNumber: true,
        postalCode: true,
        address: true,
        description: true,
        rating: true,
        isOpen: true,
        averagePrepTime: true,
        imageUrl: true,
        latitude: true,
        longitude: true
      }
    });

    const restaurantsWithDistance = await Promise.all(
      restaurants.map(async (restaurant) => {
        try {
          let distance: number | null = null;

          if (customerCoords) {
            // Check if restaurant has stored coordinates
            if (restaurant.latitude && restaurant.longitude) {
              // Use stored coordinates - instant calculation
              distance = calculateDistance(
                customerCoords,
                { latitude: restaurant.latitude, longitude: restaurant.longitude }
              );
            } else {
              // Geocode restaurant address only if no stored coordinates
              console.log(`[GET] Geocoding restaurant ${restaurant.name}`);
              const restaurantAddress = {
                city: restaurant.city!,
                streetName: restaurant.streetName!,
                blockNumber: restaurant.blockNumber!,
                postalCode: restaurant.postalCode || undefined
              };
              
              const restaurantCoords = await geocodeAddress(restaurantAddress);
              if (restaurantCoords) {
                distance = calculateDistance(customerCoords, restaurantCoords);
                
                // Update restaurant with geocoded coordinates for future use
                await prisma.restaurant.update({
                  where: { id: restaurant.id },
                  data: {
                    latitude: restaurantCoords.latitude,
                    longitude: restaurantCoords.longitude
                  }
                });
              }
            }
          }

          return {
            ...restaurant,
            distance: distance ? parseFloat(distance.toFixed(2)) : null,
            distanceText: distance 
              ? `${distance.toFixed(1)} km` 
              : 'Distance unavailable'
          };
        } catch (error) {
          console.error(`[GET] Error calculating distance for ${restaurant.name}:`, error);
          return {
            ...restaurant,
            distance: null,
            distanceText: 'Distance unavailable'
          };
        }
      })
    );

    const sortedRestaurants = restaurantsWithDistance.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return NextResponse.json(sortedRestaurants);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
} 