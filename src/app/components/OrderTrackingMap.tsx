'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

interface OrderTrackingMapProps {
  restaurantLocation: Location;
  customerLocation: Location;
  courierType: 'CYCLE' | 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'WALKING';
  orderStatus: string;
}

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OrderTrackingMap({
  restaurantLocation,
  customerLocation,
  courierType,
  orderStatus
}: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const controlsRef = useRef<L.Control[]>([]);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with zoom controls
    const map = L.map(mapRef.current, {
      center: [51.4323509, 6.7705702],
      zoom: 13,
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
      maxZoom: 25,
      zIndex: 1
    }).addTo(map);

    // Fix map rendering issues
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

    return () => {
      // Clean up
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once

  // Update markers when location data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and controls
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    controlsRef.current.forEach(control => map.removeControl(control));
    controlsRef.current = [];

    // Custom icons
    const restaurantIcon = L.divIcon({
      html: `
        <div style="
          background: #f97316; 
          color: white; 
          border-radius: 50%; 
          width: 40px; 
          height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">🏪</div>
      `,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const customerIcon = L.divIcon({
      html: `
        <div style="
          background: #14b8a6; 
          color: white; 
          border-radius: 50%; 
          width: 40px; 
          height: 40px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">🏠</div>
      `,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Add markers
    const restaurantMarker = L.marker([restaurantLocation.lat, restaurantLocation.lng], {
      icon: restaurantIcon
    }).addTo(map);
    markersRef.current.push(restaurantMarker);
    
    restaurantMarker.bindPopup(`
      <div style="padding: 8px;">
        <strong style="color: #f97316;">${restaurantLocation.name}</strong><br/>
        <small style="color: #666;">${restaurantLocation.address}</small>
      </div>
    `);

    const customerMarker = L.marker([customerLocation.lat, customerLocation.lng], {
      icon: customerIcon
    }).addTo(map);
    markersRef.current.push(customerMarker);
    
    customerMarker.bindPopup(`
      <div style="padding: 8px;">
        <strong style="color: #14b8a6;">Delivery Address</strong><br/>
        <small style="color: #666;">${customerLocation.name}</small><br/>
        <small style="color: #666;">${customerLocation.address}</small>
      </div>
    `);

    // Add courier marker if order is out for delivery
    if (orderStatus === 'OUT_FOR_DELIVERY') {
      const courierIcons = {
        CYCLE: '🚲',
        BICYCLE: '🚲',
        MOTORCYCLE: '🏍️',
        CAR: '🚗',
        WALKING: '🚶‍♂️'
      };

      // Simulate courier position (in real app, this would come from GPS tracking)
      const midLat = (restaurantLocation.lat + customerLocation.lat) / 2;
      const midLng = (restaurantLocation.lng + customerLocation.lng) / 2;
      // Add slight random offset to make it look like courier is moving
      const courierLat = midLat + (Math.random() - 0.5) * 0.005;
      const courierLng = midLng + (Math.random() - 0.5) * 0.005;

      const courierIcon = L.divIcon({
        html: `
          <div style="
            background: #22c55e; 
            color: white; 
            border-radius: 50%; 
            width: 45px; 
            height: 45px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 22px;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
            animation: pulse 2s infinite;
          ">${courierIcons[courierType]}</div>
          <style>
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
          </style>
        `,
        className: 'custom-div-icon',
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5]
      });

      const courierMarker = L.marker([courierLat, courierLng], {
        icon: courierIcon
      }).addTo(map);
      markersRef.current.push(courierMarker);
      
      courierMarker.bindPopup(`
        <div style="padding: 8px;">
          <strong style="color: #22c55e;">Your Courier</strong><br/>
          <small style="color: #666;">On the way with ${courierType.toLowerCase()}</small>
        </div>
      `);
    }

    // Draw route line
    const routeLine = L.polyline([
      [restaurantLocation.lat, restaurantLocation.lng],
      [customerLocation.lat, customerLocation.lng]
    ], {
      color: '#14b8a6',
      weight: 4,
      opacity: 0.7,
      dashArray: orderStatus === 'OUT_FOR_DELIVERY' ? '0' : '10, 10'
    }).addTo(map);
    markersRef.current.push(routeLine as any); // Polylines can be treated like markers for removal

    // Fit map to show both locations
    const group = L.featureGroup([restaurantMarker, customerMarker]);
    map.fitBounds(group.getBounds().pad(0.1));

    // Force map to recalculate size after adding markers
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 200);

    // Add scale control
    L.control.scale().addTo(map);

    // Add custom control with order info
    const orderInfoControl = new L.Control({ position: 'topright' });
    orderInfoControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'order-info-control');
      div.innerHTML = `
        <div style="
          background: white; 
          padding: 12px; 
          border-radius: 8px; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-family: system-ui, -apple-system, sans-serif;
          min-width: 200px;
        ">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; margin-right: 8px;">
              ${courierType === 'CYCLE' || courierType === 'BICYCLE' ? '🚲' : 
                courierType === 'MOTORCYCLE' ? '🏍️' :
                courierType === 'CAR' ? '🚗' : '🚶‍♂️'}
            </span>
            <strong style="color: #374151;">Delivery by ${courierType === 'CYCLE' ? 'bicycle' : courierType.toLowerCase()}</strong>
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            Status: <strong style="color: #22c55e;">${orderStatus.replace('_', ' ').toLowerCase()}</strong>
          </div>
        </div>
      `;
      return div;
    };
    orderInfoControl.addTo(map);
    controlsRef.current.push(orderInfoControl);
  }, [restaurantLocation, customerLocation, courierType, orderStatus]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg"
        style={{ 
          minHeight: '400px',
          position: 'relative',
          zIndex: 1
        }}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-3 rounded-lg shadow-lg" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)'
      }}>
        <div className="text-sm font-medium mb-2" style={{ color: '#374151' }}>Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#f97316' }}></div>
            <span style={{ color: '#6b7280' }}>Restaurant</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#14b8a6' }}></div>
            <span style={{ color: '#6b7280' }}>Your Location</span>
          </div>
          {orderStatus === 'OUT_FOR_DELIVERY' && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#22c55e' }}></div>
              <span style={{ color: '#6b7280' }}>Courier</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
