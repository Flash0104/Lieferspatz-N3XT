'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Header from '../components/Header';

interface ColorTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  primary: string;
  primaryHover: string;
  accent: string;
  card: string;
  preview: {
    bg: string;
    text: string;
    button: string;
    buttonHover: string;
  };
}

const predefinedThemes: ColorTheme[] = [
  {
    id: 'default',
    name: 'Dark Ocean (Default)',
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#14b8a6',
    primaryHover: '#0f766e',
    accent: '#f97316',
    card: '#1e293b',
    preview: {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      text: '#f1f5f9',
      button: '#14b8a6',
      buttonHover: '#0f766e'
    }
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    background: '#0c1426',
    foreground: '#e2e8f0',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    accent: '#f59e0b',
    card: '#1e293b',
    preview: {
      bg: 'linear-gradient(135deg, #0c1426 0%, #1e293b 100%)',
      text: '#e2e8f0',
      button: '#3b82f6',
      buttonHover: '#2563eb'
    }
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    background: '#1a0b2e',
    foreground: '#f8fafc',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    accent: '#f59e0b',
    card: '#2d1b54',
    preview: {
      bg: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b54 100%)',
      text: '#f8fafc',
      button: '#8b5cf6',
      buttonHover: '#7c3aed'
    }
  },
  {
    id: 'green',
    name: 'Forest Green',
    background: '#0f1a0f',
    foreground: '#f0fdf4',
    primary: '#22c55e',
    primaryHover: '#16a34a',
    accent: '#f97316',
    card: '#1a2e1a',
    preview: {
      bg: 'linear-gradient(135deg, #0f1a0f 0%, #1a2e1a 100%)',
      text: '#f0fdf4',
      button: '#22c55e',
      buttonHover: '#16a34a'
    }
  },
  {
    id: 'red',
    name: 'Crimson Red',
    background: '#1a0f0f',
    foreground: '#fef2f2',
    primary: '#ef4444',
    primaryHover: '#dc2626',
    accent: '#f59e0b',
    card: '#2e1a1a',
    preview: {
      bg: 'linear-gradient(135deg, #1a0f0f 0%, #2e1a1a 100%)',
      text: '#fef2f2',
      button: '#ef4444',
      buttonHover: '#dc2626'
    }
  },
  {
    id: 'orange',
    name: 'Sunset Orange',
    background: '#1a0f06',
    foreground: '#fffbeb',
    primary: '#f97316',
    primaryHover: '#ea580c',
    accent: '#14b8a6',
    card: '#2e1a0f',
    preview: {
      bg: 'linear-gradient(135deg, #1a0f06 0%, #2e1a0f 100%)',
      text: '#fffbeb',
      button: '#f97316',
      buttonHover: '#ea580c'
    }
  }
];

export default function Settings() {
  const { data: session } = useSession();
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [customColors, setCustomColors] = useState({
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#14b8a6',
    primaryHover: '#0f766e',
    accent: '#f97316',
    card: '#1e293b'
  });
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage using user-specific keys
    if (session?.user?.id) {
      const userThemeKey = `lieferspatz-theme-${session.user.id}`;
      const userCustomColorsKey = `lieferspatz-custom-colors-${session.user.id}`;
      
      const savedTheme = localStorage.getItem(userThemeKey);
      const savedCustomColors = localStorage.getItem(userCustomColorsKey);
      
      if (savedTheme) {
        setSelectedTheme(savedTheme);
        if (savedTheme === 'custom' && savedCustomColors) {
          setIsCustomMode(true);
          setCustomColors(JSON.parse(savedCustomColors));
        }
      } else {
        // New user - set to default theme
        setSelectedTheme('default');
        setIsCustomMode(false);
      }
    }
  }, [session]);

  const applyTheme = (theme: ColorTheme | null) => {
    const root = document.documentElement;
    
    if (theme) {
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--foreground', theme.foreground);
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--primary-hover', theme.primaryHover);
      root.style.setProperty('--accent', theme.accent);
      root.style.setProperty('--card', theme.card);
      
      // Update body background with gradient
      document.body.style.background = `linear-gradient(135deg, ${theme.background} 0%, ${theme.card} 100%)`;
      document.body.style.color = theme.foreground;
      
      console.log('Applied theme in settings:', theme.name);
    } else if (isCustomMode) {
      root.style.setProperty('--background', customColors.background);
      root.style.setProperty('--foreground', customColors.foreground);
      root.style.setProperty('--primary', customColors.primary);
      root.style.setProperty('--primary-hover', customColors.primaryHover);
      root.style.setProperty('--accent', customColors.accent);
      root.style.setProperty('--card', customColors.card);
      
      document.body.style.background = `linear-gradient(135deg, ${customColors.background} 0%, ${customColors.card} 100%)`;
      document.body.style.color = customColors.foreground;
    }
    
    // Force a style recalculation
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme: theme ? theme.id : 'custom' } 
    }));
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setIsCustomMode(themeId === 'custom');
    
    if (themeId !== 'custom') {
      const theme = predefinedThemes.find(t => t.id === themeId);
      if (theme) {
        applyTheme(theme);
        // Immediately save the theme with user-specific key
        if (session?.user?.id) {
          const userThemeKey = `lieferspatz-theme-${session.user.id}`;
          localStorage.setItem(userThemeKey, themeId);
        }
      }
    }
  };

  const handleCustomColorChange = (colorKey: string, value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    
    if (isCustomMode) {
      applyTheme(null);
    }
  };

  const saveTheme = () => {
    if (!session?.user?.id) {
      console.error('No user session - cannot save theme');
      return;
    }

    const userThemeKey = `lieferspatz-theme-${session.user.id}`;
    const userCustomColorsKey = `lieferspatz-custom-colors-${session.user.id}`;
    
    localStorage.setItem(userThemeKey, selectedTheme);
    
    if (isCustomMode) {
      localStorage.setItem(userCustomColorsKey, JSON.stringify(customColors));
    }
    
    // Re-apply the theme to ensure it's active
    if (selectedTheme !== 'custom') {
      const theme = predefinedThemes.find(t => t.id === selectedTheme);
      if (theme) {
        applyTheme(theme);
      }
    } else {
      applyTheme(null);
    }
    
    console.log(`Theme saved for user ${session.user.id}:`, selectedTheme);
    
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  // Apply theme on component mount and when selectedTheme changes
  useEffect(() => {
    if (selectedTheme !== 'custom') {
      const theme = predefinedThemes.find(t => t.id === selectedTheme);
      if (theme) {
        applyTheme(theme);
      }
    } else if (isCustomMode) {
      applyTheme(null);
    }
  }, [selectedTheme, isCustomMode, customColors]);

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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-300 mb-8">Customize your Lieferspatz experience</p>

          {/* Theme Customization Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-3">🎨</span>
              Color Theme
            </h2>
            <p className="text-slate-300 mb-6">Choose a color theme that matches your style</p>

            {/* Predefined Themes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {predefinedThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                    selectedTheme === theme.id && !isCustomMode
                      ? 'border-teal-400 ring-2 ring-teal-400/30'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: theme.preview.bg }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: theme.preview.text }}>
                      {theme.name}
                    </h3>
                    <div className="flex space-x-2 mb-3">
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.background }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                    <button
                      className="px-3 py-1 rounded text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: theme.preview.button,
                        color: theme.preview.text
                      }}
                    >
                      Preview Button
                    </button>
                  </div>
                </div>
              ))}

              {/* Custom Theme Option */}
              <div
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                  isCustomMode
                    ? 'border-teal-400 ring-2 ring-teal-400/30'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onClick={() => handleThemeSelect('custom')}
              >
                <div
                  className="p-4 rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${customColors.background} 0%, ${customColors.card} 100%)`
                  }}
                >
                  <h3 className="font-semibold mb-2" style={{ color: customColors.foreground }}>
                    Custom Theme
                  </h3>
                  <div className="flex space-x-2 mb-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: customColors.background }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: customColors.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: customColors.accent }}
                    />
                  </div>
                  <button
                    className="px-3 py-1 rounded text-sm font-medium"
                    style={{
                      backgroundColor: customColors.primary,
                      color: customColors.foreground
                    }}
                  >
                    Custom Button
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Color Picker */}
            {isCustomMode && (
              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600/50">
                <h3 className="text-xl font-semibold text-white mb-4">Custom Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(customColors).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-3">
                      <label className="text-slate-300 min-w-0 flex-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </label>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => handleCustomColorChange(key, e.target.value)}
                        className="w-12 h-8 rounded border border-slate-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleCustomColorChange(key, e.target.value)}
                        className="bg-slate-600 text-white px-2 py-1 rounded text-sm font-mono w-20"
                        placeholder="#000000"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={saveTheme}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save Theme
              </button>
              
              {showSaved && (
                <div className="text-green-400 flex items-center">
                  <span className="mr-2">✓</span>
                  Theme saved successfully!
                </div>
              )}
            </div>
          </div>

          {/* User Info Section */}
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
              <div className="flex justify-between">
                <span className="text-slate-300">Theme:</span>
                <span className="text-white">
                  {isCustomMode ? 'Custom' : predefinedThemes.find(t => t.id === selectedTheme)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 