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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userLocation = searchParams.get('userLocation');
    const userPostalCode = searchParams.get('userPostalCode');
    
    let customerCoords: { latitude: number; longitude: number } | null = null;
    let customerCacheKey: string;
    
    if (userLocation && userPostalCode) {
      // Parse user location (e.g., "Sonnenwall 56 / 47051, Duisburg, 47051" or "Kuhstraße, Geilenkirchen")
      console.log('Parsing user location:', userLocation);
      
      let streetName, city, blockNumber;
      
      if (userLocation.includes('/')) {
        // Handle format like "Sonnenwall 56 / 47051, Duisburg, 47051"
        const parts = userLocation.split(',').map(s => s.trim());
        city = parts[1] || 'Duisburg';
        
        const streetPart = parts[0] || '';
        const streetMatch = streetPart.match(/^([^0-9]+)\s*(\d+)/);
        if (streetMatch) {
          streetName = streetMatch[1].trim();
          blockNumber = streetMatch[2];
        } else {
          streetName = streetPart.split('/')[0].trim();
          blockNumber = '1';
        }
      } else {
        // Handle format like "Kuhstraße, Geilenkirchen"
        const parts = userLocation.split(',').map(s => s.trim());
        streetName = parts[0] || 'Kuhstraße';
        city = parts[1] || 'Geilenkirchen';
        blockNumber = '33';
      }
      
      const customerAddress = {
        city: city,
        streetName: streetName,
        blockNumber: blockNumber,
        postalCode: userPostalCode
      };
      
      console.log('Parsed customer address:', customerAddress);
      
      customerCacheKey = `${customerAddress.city}-${customerAddress.streetName}-${customerAddress.blockNumber}-${customerAddress.postalCode}`;
      
      // Get customer coordinates (with caching)
      customerCoords = customerCoordinatesCache.get(customerCacheKey);
      if (customerCoords === undefined) {
        console.log('Geocoding user address:', customerAddress);
        customerCoords = await geocodeAddress(customerAddress);
        
        // If specific address fails, try city center
        if (!customerCoords && customerAddress.city) {
          console.log(`Specific address failed, trying city center for: ${customerAddress.city}`);
          const cityOnlyAddress = {
            city: customerAddress.city,
            streetName: 'Markt', // Common city center street name
            blockNumber: '1',
            postalCode: customerAddress.postalCode
          };
          customerCoords = await geocodeAddress(cityOnlyAddress);
          
          // If still fails, use known coordinates for common cities
          if (!customerCoords) {
            console.log(`City geocoding failed, using known coordinates for: ${customerAddress.city}`);
            const knownCityCoords = {
              'Geilenkirchen': { latitude: 50.9642, longitude: 6.1194 },
              'Duisburg': { latitude: 51.4344, longitude: 6.7623 },
              'Düsseldorf': { latitude: 51.2277, longitude: 6.7735 },
              'Köln': { latitude: 50.9375, longitude: 6.9603 },
              'Essen': { latitude: 51.4556, longitude: 7.0116 }
            };
            
            customerCoords = knownCityCoords[customerAddress.city] || knownCityCoords['Duisburg'];
            console.log(`Using known coordinates for ${customerAddress.city}:`, customerCoords);
          }
        }
        
        customerCoordinatesCache.set(customerCacheKey, customerCoords);
      }
    } else {
      // Intelligent fallback: Try multiple user locations based on app usage patterns
      console.log('No user location provided, using intelligent fallback...');
      
      // Get the most common user locations from database for better fallback
      try {
        const commonLocations = await prisma.user.groupBy({
          by: ['city', 'postalCode'],
          where: {
            city: { not: null },
            postalCode: { not: null }
          },
          _count: {
            city: true
          },
          orderBy: {
            _count: {
              city: 'desc'
            }
          },
          take: 1
        });

        let defaultCustomerAddress;
        
        if (commonLocations.length > 0) {
          const mostCommon = commonLocations[0];
          console.log('Using most common user location:', mostCommon.city);
          defaultCustomerAddress = {
            city: mostCommon.city!,
            streetName: 'Hauptstraße', // Generic street name
            blockNumber: '1',
            postalCode: mostCommon.postalCode!
          };
          customerCacheKey = `common-${mostCommon.city}-${mostCommon.postalCode}`;
        } else {
          // Ultimate fallback to Duisburg (where restaurants are)
          console.log('No user data found, using Duisburg as fallback');
          defaultCustomerAddress = {
            city: 'Duisburg',
            streetName: 'Sonnenwall',
            blockNumber: '56',
            postalCode: '47051'
          };
          customerCacheKey = 'fallback-duisburg-47051';
        }

        // Get customer coordinates (with caching)
        customerCoords = customerCoordinatesCache.get(customerCacheKey);
        if (customerCoords === undefined) {
          console.log('Geocoding fallback address:', defaultCustomerAddress);
          customerCoords = await geocodeAddress(defaultCustomerAddress);
          
          // If geocoding fails, use restaurant location for minimal distance
          if (!customerCoords) {
            console.log('Geocoding failed, using Duisburg restaurant area coordinates');
            customerCoords = { latitude: 51.4344, longitude: 6.7623 }; // Duisburg center
          }
          
          customerCoordinatesCache.set(customerCacheKey, customerCoords);
        }
      } catch (error) {
        console.error('Error getting common locations:', error);
        // Final fallback
        customerCoords = { latitude: 51.4344, longitude: 6.7623 }; // Duisburg
      }
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