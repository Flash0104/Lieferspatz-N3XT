'use client';

import React, { useEffect, useRef, useState } from 'react';

// Define types for Leaflet objects
interface LatLng {
  lat: number;
  lng: number;
}

interface MapInstance {
  setView: (center: number[], zoom: number) => MapInstance;
  on: (event: string, handler: (e: any) => void) => void;
  invalidateSize: () => void;
  remove: () => void;
}

interface TileLayer {
  addTo: (map: MapInstance) => TileLayer;
}

interface Marker {
  addTo: (map: MapInstance) => Marker;
  setLatLng: (latlng: LatLng) => Marker;
  remove: () => void;
}

interface LeafletStatic {
  map: (element: HTMLElement, options?: any) => MapInstance;
  tileLayer: (url: string, options?: any) => TileLayer;
  marker: (latlng: LatLng, options?: any) => Marker;
  icon: (options: any) => any;
}

declare global {
  interface Window {
    L?: LeafletStatic;
  }
}

interface LocationPickerMapProps {
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  height?: string;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLocation,
  onLocationSelect,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use Duisburg as default if no initial location provided
  const defaultLocation = { lat: 51.4323509, lng: 6.7705702 };
  const safeInitialLocation = initialLocation || defaultLocation;
  const [selectedLocation, setSelectedLocation] = useState<LatLng>(safeInitialLocation);
  const [interpretedAddress, setInterpretedAddress] = useState<string>('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Reverse geocoding function with improved error handling
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Lieferspatz App'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract and format address components in the exact format requested
        const address = data.address || {};
        let interpretedText = '';
        
        // Build address in format: "Street Name House Number, City, Postal Code"
        const streetName = address.road || address.pedestrian || address.path;
        const houseNumber = address.house_number;
        const city = address.city || address.town || address.village || address.municipality;
        const postcode = address.postcode;
        
        if (streetName) {
          // Start with street name
          interpretedText = streetName;
          
          // Add house number if available
          if (houseNumber) {
            interpretedText += ` ${houseNumber}`;
          }
          
          // Add city if available
          if (city) {
            interpretedText += `, ${city}`;
          }
          
          // Add postal code if available
          if (postcode) {
            interpretedText += `, ${postcode}`;
          }
        } else if (city) {
          // If no street, at least show city
          interpretedText = city;
          if (postcode) {
            interpretedText += `, ${postcode}`;
          }
        } else {
          // Fallback to a simplified version of display_name
          const parts = data.display_name.split(',');
          if (parts.length >= 2) {
            interpretedText = parts.slice(0, 3).join(',').trim();
          } else {
            interpretedText = data.display_name;
          }
        }
        
        setInterpretedAddress(interpretedText);
        return interpretedText;
      } else {
        const fallbackAddress = `📍 Location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        setInterpretedAddress(fallbackAddress);
        return null;
      }
    } catch (error) {
      // Silently handle errors - just show coordinates
      const fallbackAddress = `Location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      setInterpretedAddress(fallbackAddress);
      console.log('Reverse geocoding unavailable, using coordinates');
      return null;
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Load Leaflet dynamically with faster loading
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined' && !window.L) {
        // Check if already loading
        if (document.querySelector('script[src*="leaflet"]')) {
          // Script is already loading, wait for it
          const checkLeaflet = setInterval(() => {
            if (window.L) {
              clearInterval(checkLeaflet);
              setIsLoading(false);
            }
          }, 100);
          return;
        }

        // Load CSS and JS in parallel for faster loading
        const loadPromises = [];

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        const scriptPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        loadPromises.push(scriptPromise);

        try {
          await Promise.all(loadPromises);
          setIsLoading(false);
        } catch (error) {
          console.error('Failed to load Leaflet:', error);
          setIsLoading(false);
        }
      } else if (window.L) {
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (isLoading || !mapRef.current || mapInstanceRef.current || !window.L) return;

    const L = window.L;

    // Initialize map with higher default zoom for better street-level detail
    const map = L.map(mapRef.current, {
      center: [safeInitialLocation.lat, safeInitialLocation.lng],
      zoom: 18, // Increased from 15 to 18 for street-level view
      minZoom: 3,
      maxZoom: 25,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true
    });
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 25
    }).addTo(map);

    // Create custom marker icon
    const customIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjMTBCOTgxIi8+Cjwvc3ZnPgo=',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Add initial marker
    const marker = L.marker(selectedLocation, { 
      icon: customIcon,
      draggable: true 
    }).addTo(map);
    markerRef.current = marker;

    // Handle map clicks - no zoom changes
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      const newLocation = { lat, lng };
      
      setSelectedLocation(newLocation);
      marker.setLatLng(newLocation);
      
      // Reverse geocode the location
      const address = await reverseGeocode(lat, lng);
      
      // Notify parent component
      onLocationSelect({
        lat,
        lng,
        address: address || undefined
      });
    });

    // Handle marker drag - no zoom changes
    marker.on('dragend', async (e: any) => {
      const { lat, lng } = e.target.getLatLng();
      const newLocation = { lat, lng };
      
      setSelectedLocation(newLocation);
      
      // Reverse geocoding during drag
      const address = await reverseGeocode(lat, lng);
      
      // Notify parent component
      onLocationSelect({
        lat,
        lng,
        address: address || undefined
      });
    });

    // Fix map rendering
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

    // Initial reverse geocoding
    reverseGeocode(safeInitialLocation.lat, safeInitialLocation.lng);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [isLoading, safeInitialLocation, onLocationSelect]);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border-2 border-dashed"
        style={{ 
          height,
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--primary)' }}></div>
          <p style={{ color: 'var(--foreground)' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full rounded-lg border"
          style={{ 
            height,
            borderColor: 'var(--border)'
          }}
        />
        
        {/* Coordinates Display */}
        <div 
          className="absolute top-4 right-4 px-3 py-2 rounded-lg shadow-lg text-sm font-mono"
          style={{
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>
      </div>

      {/* Location Interpretation */}
      <div 
        className="p-4 rounded-lg"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)'
        }}
      >
        <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          📍 System Interpretation
        </h3>
        
        {isReverseGeocoding ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
            <span style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Interpreting location...
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                System Understanding:
              </p>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                {interpretedAddress}
              </p>
            </div>
            
            <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                Technical Details:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                <div>
                  <strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}°
                </div>
                <div>
                  <strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}°
                </div>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                📍 This location will be used for distance calculations and delivery routing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div 
        className="p-3 rounded-lg text-sm"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-foreground)'
        }}
      >
        <p className="font-medium mb-1">🗺️ How to use:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>Click</strong> anywhere on the map to set your location</li>
          <li>• <strong>Drag</strong> the green marker to fine-tune position</li>
          <li>• <strong>Zoom</strong> in/out for better precision</li>
          <li>• The system will automatically interpret your selected location</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationPickerMap;
