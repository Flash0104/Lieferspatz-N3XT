'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const predefinedThemes = [
  {
    id: 'default',
    name: 'Dark Ocean (Default)',
    background: '#0f172a',
    foreground: '#f1f5f9',
    primary: '#14b8a6',
    primaryHover: '#0f766e',
    accent: '#f97316',
    card: '#1e293b',
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
  }
];

export default function ThemeInitializer() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const applyTheme = () => {
      if (status === 'loading') return; // Wait for session to load

      let savedTheme = null;
      let savedCustomColors = null;

      if (session?.user?.id) {
        // User is logged in - get their specific theme
        const userThemeKey = `lieferspatz-theme-${session.user.id}`;
        const userCustomColorsKey = `lieferspatz-custom-colors-${session.user.id}`;
        
        savedTheme = localStorage.getItem(userThemeKey);
        savedCustomColors = localStorage.getItem(userCustomColorsKey);
        
        console.log(`Loading theme for user ${session.user.id}:`, savedTheme);
      } else {
        // User is not logged in - always use default theme
        console.log('No user session - applying default theme');
        applyDefaultTheme();
        return;
      }
      
      if (savedTheme === 'custom' && savedCustomColors) {
        try {
          const customColors = JSON.parse(savedCustomColors);
          applyCustomTheme(customColors);
          console.log('Applied custom theme for user:', session.user.id);
        } catch (error) {
          console.error('Error applying custom theme:', error);
          applyDefaultTheme();
        }
      } else if (savedTheme) {
        const theme = predefinedThemes.find(t => t.id === savedTheme);
        if (theme) {
          applyPredefinedTheme(theme);
          console.log(`Applied ${theme.name} theme for user:`, session.user.id);
        } else {
          applyDefaultTheme();
        }
      } else {
        // New user or no saved theme - use default
        console.log('No saved theme - applying default for user:', session.user.id);
        applyDefaultTheme();
      }
    };

    // Apply theme when session changes
    applyTheme();

    // Listen for storage changes (settings updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (session?.user?.id && (
        e.key === `lieferspatz-theme-${session.user.id}` || 
        e.key === `lieferspatz-custom-colors-${session.user.id}`
      )) {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [session, status]);

  // Clean up old global theme keys and apply default when user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      // User logged out - clean up and apply default theme
      console.log('User logged out - resetting to default theme');
      
      // Remove old global theme keys if they exist
      localStorage.removeItem('lieferspatz-theme');
      localStorage.removeItem('lieferspatz-custom-colors');
      
      applyDefaultTheme();
    }
  }, [status]);

  const applyPredefinedTheme = (theme: any) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-hover', theme.primaryHover);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card', theme.card);
    
    // Update body background with gradient
    document.body.style.background = `linear-gradient(135deg, ${theme.background} 0%, ${theme.card} 100%)`;
    document.body.style.color = theme.foreground;
    
    // Force a style recalculation
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
  };

  const applyCustomTheme = (colors: any) => {
    const root = document.documentElement;
    
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-hover', colors.primaryHover);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--card', colors.card);
    
    document.body.style.background = `linear-gradient(135deg, ${colors.background} 0%, ${colors.card} 100%)`;
    document.body.style.color = colors.foreground;
    document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
  };

  const applyDefaultTheme = () => {
    const defaultTheme = predefinedThemes[0]; // Dark Ocean
    applyPredefinedTheme(defaultTheme);
    console.log('Applied default theme (Dark Ocean)');
  };

  return null; // This component doesn't render anything
} 