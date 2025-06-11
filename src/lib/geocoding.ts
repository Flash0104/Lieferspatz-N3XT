interface Address {
  city: string;
  streetName: string;
  blockNumber: string;
  postalCode?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Get coordinates from address using OpenStreetMap Nominatim API
 */
export async function geocodeAddress(address: Address): Promise<Coordinates | null> {
  try {
    // Format address for geocoding
    const addressQuery = `${address.blockNumber} ${address.streetName}, ${address.city}${
      address.postalCode ? `, ${address.postalCode}` : ''
    }, Germany`;

    const encodedAddress = encodeURIComponent(addressQuery);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=de`;

    console.log('Geocoding address:', addressQuery);
    console.log('Geocoding URL:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Lieferspatz-Food-Delivery-App/1.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data: GeocodingResult[] = await response.json();
    console.log('Geocoding results for', addressQuery, ':', data.length, 'results');
    
    if (data.length === 0) {
      console.log('No results found for address:', addressQuery);
      // Try alternative formatting
      const altQuery = `${address.streetName} ${address.blockNumber}, ${address.city}, Germany`;
      const altUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(altQuery)}&limit=1&countrycodes=de`;
      
      console.log('Trying alternative format:', altQuery);
      
      const altController = new AbortController();
      const altTimeoutId = setTimeout(() => altController.abort(), 10000);
      
      const altResponse = await fetch(altUrl, {
        headers: {
          'User-Agent': 'Lieferspatz-Food-Delivery-App/1.0'
        },
        signal: altController.signal
      });
      
      clearTimeout(altTimeoutId);

      if (altResponse.ok) {
        const altData: GeocodingResult[] = await altResponse.json();
        console.log('Alternative geocoding results:', altData.length, 'results');
        
        if (altData.length > 0) {
          return {
            latitude: parseFloat(altData[0].lat),
            longitude: parseFloat(altData[0].lon)
          };
        }
      }
      
      return null;
    }

    const result = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
    
    console.log('Geocoding successful for', addressQuery, ':', result);
    
    return result;
  } catch (error) {
    console.error('Geocoding error for address', address, ':', error);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = (coords1.latitude * Math.PI) / 180;
  const lat2Rad = (coords2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

/**
 * Get distance between customer and restaurant
 */
export async function getDistanceBetweenAddresses(
  customerAddress: Address,
  restaurantAddress: Address
): Promise<number | null> {
  try {
    console.log('Calculating distance between:', customerAddress, 'and', restaurantAddress);
    
    const [customerCoords, restaurantCoords] = await Promise.all([
      geocodeAddress(customerAddress),
      geocodeAddress(restaurantAddress)
    ]);

    if (!customerCoords || !restaurantCoords) {
      console.log('Failed to get coordinates:', { customerCoords, restaurantCoords });
      return null;
    }

    const distance = calculateDistance(customerCoords, restaurantCoords);
    console.log('Calculated distance:', distance, 'km');
    
    return distance;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
}

/**
 * Validate if an address exists using geocoding
 */
export async function validateAddress(address: Address): Promise<boolean> {
  const coords = await geocodeAddress(address);
  return coords !== null;
} 