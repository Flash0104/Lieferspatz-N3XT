'use client';

import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Header from '../components/Header';

// Dynamically import LocationPickerMap to avoid SSR issues
const LocationPickerMap = dynamic(() => import('../components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-700/30 rounded-lg border border-slate-600/50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  )
});

export default function Settings() {
  const { data: session } = useSession();
  
  // Theme states
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [themeSaved, setThemeSaved] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [showLocationSaved, setShowLocationSaved] = useState(false);
  
  // Load saved theme and location on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('lieferspatz_theme') || 'dark';
      const savedPrimary = localStorage.getItem('lieferspatz_primary') || '#3b82f6';
      const savedAccent = localStorage.getItem('lieferspatz_accent') || '#10b981';
      const savedLocation = localStorage.getItem('lieferspatz_location');
      const savedAddress = localStorage.getItem('lieferspatz_address');
      
      setSelectedTheme(savedTheme);
      setPrimaryColor(savedPrimary);
      setAccentColor(savedAccent);
      
      if (savedLocation) {
        setCurrentLocation(JSON.parse(savedLocation));
      }
      if (savedAddress) {
        setLocationAddress(savedAddress);
      }
    }
  }, []);
  
  // Apply theme changes
  const applyTheme = (theme: string, primary: string, accent: string) => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--background', '#0f172a');
      root.style.setProperty('--foreground', '#f1f5f9');
      root.style.setProperty('--card', '#1e293b');
    } else if (theme === 'blue') {
      root.style.setProperty('--background', '#1e3a8a');
      root.style.setProperty('--foreground', '#dbeafe');
      root.style.setProperty('--card', '#1e40af');
    } else if (theme === 'purple') {
      root.style.setProperty('--background', '#581c87');
      root.style.setProperty('--foreground', '#f3e8ff');
      root.style.setProperty('--card', '#7c3aed');
    } else if (theme === 'green') {
      root.style.setProperty('--background', '#14532d');
      root.style.setProperty('--foreground', '#dcfce7');
      root.style.setProperty('--card', '#166534');
    }
    
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--accent', accent);
  };
  
  const saveTheme = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lieferspatz_theme', selectedTheme);
      localStorage.setItem('lieferspatz_primary', primaryColor);
      localStorage.setItem('lieferspatz_accent', accentColor);
      
      applyTheme(selectedTheme, primaryColor, accentColor);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    }
  };
  
  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    
    // Reverse geocoding to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`)
      .then(response => response.json())
      .then(data => {
        const address = data.display_name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        setLocationAddress(address);
      })
      .catch(() => {
        setLocationAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      });
  };
  
  const saveLocation = async () => {
    if (currentLocation && typeof window !== 'undefined') {
      try {
        // Parse the address to extract components for German format
        const cleanAddress = locationAddress.replace('📍 ', '');
        const addressParts = cleanAddress.split(', ');
        let street = '';
        let city = '';
        let postal = '';
        
        console.log('Parsing address:', cleanAddress, 'Parts:', addressParts);
        
        // For German addresses from Nominatim, find the relevant parts
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          
          // Find postal code (5 digits)
          if (/^\d{5}$/.test(part) && !postal) {
            postal = part;
          }
          
          // Find city (look for "Duisburg" or similar main city names)
          if ((part === 'Duisburg' || part.includes('Duisburg')) && !city) {
            city = 'Duisburg';
          }
        }
        
        // Find street name - improved logic for German addresses
        for (let i = 0; i < addressParts.length; i++) {
          const part = addressParts[i].trim();
          
          // Skip if it's just a number, postal code, or city
          if (/^\d+$/.test(part) || part === 'Duisburg' || part.includes('Duisburg')) {
            continue;
          }
          
          // Look for street names that contain letters and might have numbers
          if (/[a-zA-ZäöüÄÖÜß]/.test(part)) {
            // Skip neighborhood/district names
            if (part.includes('Altstadt') || part.includes('Duisburg-Mitte') || part.includes('Kuzey Ren-Vestfalya') || part.includes('Almanya')) {
              continue;
            }
            
            // Check if this part contains a number (like "Sonnenwall 54")
            if (/\d+/.test(part)) {
              street = part; // This is "Sonnenwall 54"
              break;
            } else if (!street && part.length > 2) {
              // This might be just the street name, store it temporarily
              street = part;
            }
          }
        }
        
        // If we found a street name but no number, try to combine with the next numeric part
        if (street && !/\d+/.test(street)) {
          for (let i = 0; i < addressParts.length; i++) {
            const part = addressParts[i].trim();
            if (/^\d+$/.test(part) && part !== postal) {
              street = `${street} ${part}`; // Combine "Sonnenwall" + "54"
              break;
            }
          }
        }
        
        // Fallback: if we couldn't parse properly, use a simplified approach
        if (!street || !city || !postal) {
          // Try to find patterns in the full address
          const fullAddress = cleanAddress;
          
          // Look for postal code
          const postalMatch = fullAddress.match(/\b(\d{5})\b/);
          if (postalMatch && !postal) postal = postalMatch[1];
          
          // Look for Duisburg
          if (fullAddress.includes('Duisburg') && !city) city = 'Duisburg';
          
          // Look for street with number at the beginning
          if (!street && addressParts.length > 0) {
            for (const part of addressParts.slice(0, 2)) {
              if (/[a-zA-ZäöüÄÖÜß]+\s+\d+/.test(part)) {
                street = part;
                break;
              }
            }
          }
        }
        
        console.log('Parsed components:', { street, city, postal });
        console.log('Address parts analysis:', addressParts.map((part, i) => ({
          index: i,
          part: part.trim(),
          isNumeric: /^\d+$/.test(part.trim()),
          isPostalCode: /^\d{5}$/.test(part.trim()),
          containsLetters: /[a-zA-ZäöüÄÖÜß]/.test(part.trim()),
          containsNumbers: /\d+/.test(part.trim()),
          isStreetCandidate: !part.includes('Altstadt') && !part.includes('Duisburg-Mitte') && !part.includes('Kuzey Ren-Vestfalya') && !part.includes('Almanya')
        })));
        console.log('Final street detection:', { 
          foundStreet: street, 
          foundCity: city, 
          foundPostal: postal,
          willSaveToDB: { street, city, postal }
        });
        
        // Save to database via API
        const response = await fetch('/api/user/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            location: street,
            city: city,
            postal_code: postal,
            full_address: locationAddress.replace('📍 ', '')
          }),
        });
        
        if (response.ok) {
          // Also save to localStorage for immediate UI updates
          localStorage.setItem('lieferspatz_location', JSON.stringify(currentLocation));
          localStorage.setItem('lieferspatz_address', locationAddress);
          setShowLocationSaved(true);
          setTimeout(() => setShowLocationSaved(false), 2000);
        } else {
          console.error('Failed to save location to database');
          alert('Failed to save location. Please try again.');
        }
      } catch (error) {
        console.error('Error saving location:', error);
        alert('Error saving location. Please try again.');
      }
    }
  };
  
  const getCurrentPosition = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationSelect(location);
        },
        (error) => {
          console.error('Error getting current position:', error);
          alert('Unable to get your current location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please log in to access settings</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background, #0f172a)' }}>
      <Header />
      
      <div className="container mx-auto px-4 pt-28 pb-8 max-w-4xl">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-300 mb-8">Customize your Lieferspatz experience</p>

          <div className="space-y-8">
            {/* Account Information */}
          <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-3">👤</span>
              Account Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-300">Email:</span>
                <span className="text-white">{session.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">User Type:</span>
                <span className="text-white capitalize">{session.user?.userType}</span>
              </div>
              </div>
            </div>

            {/* Theme Customization */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3">🎨</span>
                Theme Customization
              </h2>
              
              {/* Theme Presets */}
              <div className="mb-6">
                <label className="block text-slate-300 mb-3">Choose Theme Preset:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'dark', name: 'Dark Ocean', bg: 'from-slate-900 to-slate-800' },
                    { value: 'blue', name: 'Blue Night', bg: 'from-blue-900 to-blue-800' },
                    { value: 'purple', name: 'Purple Galaxy', bg: 'from-purple-900 to-purple-800' },
                    { value: 'green', name: 'Forest Green', bg: 'from-green-900 to-green-800' }
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => setSelectedTheme(theme.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedTheme === theme.value
                          ? 'border-blue-400 bg-blue-900/30'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className={`h-8 w-full rounded bg-gradient-to-r ${theme.bg} mb-2`}></div>
                      <p className="text-white text-sm font-medium">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-slate-300 mb-2">Primary Color:</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-slate-600 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 mb-2">Accent Color:</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border-2 border-slate-600 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 bg-slate-600/50 border border-slate-500 rounded-lg px-3 py-2 text-white"
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>

              {/* Save Theme Button */}
              <button
                onClick={saveTheme}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {themeSaved ? '✅ Theme Saved!' : 'Save Theme'}
              </button>
            </div>

            {/* Location Settings */}
            <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-3">📍</span>
                Location Settings
              </h2>
              
              {/* Current Location Display */}
              {currentLocation && (
                <div className="mb-4 p-4 bg-slate-600/30 rounded-lg border border-slate-500/50">
                  <p className="text-slate-300 text-sm mb-2">Current Location:</p>
                  <p className="text-white font-medium">{locationAddress || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`}</p>
                </div>
              )}

              {/* Location Controls */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={getCurrentPosition}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                  >
                    <span className="mr-2">📱</span>
                    Use Current Location
                  </button>
                  {currentLocation && (
                    <button
                      onClick={saveLocation}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {showLocationSaved ? '✅ Location Saved!' : 'Save Location'}
                    </button>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm mb-4">
                  Click on the map below to set your location manually, or use the "Use Current Location" button.
                </p>
              </div>

              {/* Interactive Map */}
              <div className="mb-4">
                <LocationPickerMap
                  onLocationSelect={handleLocationSelect}
                  initialLocation={currentLocation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 