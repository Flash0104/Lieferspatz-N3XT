'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBalance } from '../context/BalanceContext';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  restaurantImageUrl?: string;
}

export default function Header({ restaurantImageUrl }: HeaderProps) {
  const { state, toggleCart } = useCart();
  const { data: session, status } = useSession();
  const { balance } = useBalance();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantProfilePhoto, setRestaurantProfilePhoto] = useState<string | undefined>(restaurantImageUrl);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const getDashboardUrl = () => {
    if (!session?.user) return '/';
    
    switch (session.user.userType) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RESTAURANT':
        return '/restaurant/dashboard';
      default:
        return '/profile';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fetch restaurant profile photo when user is a restaurant
  useEffect(() => {
    const fetchRestaurantPhoto = async () => {
      if (session?.user?.userType === 'RESTAURANT' && !restaurantProfilePhoto) {
        try {
          const response = await fetch('/api/user/restaurant');
          if (response.ok) {
            const data = await response.json();
            if (data.restaurant?.imageUrl) {
              setRestaurantProfilePhoto(data.restaurant.imageUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching restaurant photo:', error);
        }
      }
    };

    if (session?.user?.userType === 'RESTAURANT') {
      fetchRestaurantPhoto();
    }
  }, [session, restaurantProfilePhoto]);

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-4 px-4 lg:px-8 shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="flex justify-between items-center">
        {/* Left side - Menu + Logo */}
        <div className="flex items-center min-w-0">
          {/* Hamburger Menu */}
          <div className="relative mr-4">
            <button
              onClick={toggleMenu}
              className="flex flex-col justify-center items-center w-8 h-8 hover:bg-white/20 rounded-lg transition-colors p-1"
              aria-label="Menu"
            >
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={closeMenu}
                ></div>
                
                {/* Menu Content */}
                <div className="absolute top-12 left-0 rounded-lg shadow-xl border min-w-[250px] z-50 overflow-hidden" style={{
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  borderColor: 'rgba(148, 163, 184, 0.2)'
                }}>
                  {session ? (
                    <div className="py-2">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b" style={{
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        backgroundColor: 'var(--background)'
                      }}>
                        <div className="flex items-center">
                          <div className="w-14 h-14 rounded-full overflow-hidden mr-3 border-2" style={{
                            borderColor: 'var(--primary)'
                          }}>
                            <img 
                              src={restaurantProfilePhoto || restaurantImageUrl || session.user.profilePicture || '/images/default-profile.png'} 
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                              {session.user.firstName} {session.user.lastName}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                              {session.user.email}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <Link 
                          href="/"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                          Home
                        </Link>
                        
                        <Link 
                          href={getDashboardUrl()}
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          {session.user.userType === 'ADMIN' ? 'Admin Panel' : 
                           session.user.userType === 'RESTAURANT' ? 'Dashboard' : 'My Profile'}
                        </Link>

                        {/* Balance for customers and restaurants */}
                        {(session.user.userType === 'CUSTOMER' || session.user.userType === 'RESTAURANT') && (
                          <div className="flex items-center px-4 py-3 text-sm border-t" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                            <span style={{ color: 'var(--foreground)', opacity: 0.8 }}>Balance: </span>
                            <span className="font-semibold ml-1" style={{ color: '#22c55e' }}>€{(balance ?? session.user.balance ?? 0).toFixed(2)}</span>
                          </div>
                        )}

                        {/* Settings */}
                        <a 
                          href="/settings"
                          onClick={closeMenu}
                          target="_self"
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          Settings
                        </a>
                      </div>

                      {/* Logout */}
                      <div className="border-t py-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                        <button
                          onClick={() => {
                            closeMenu();
                            handleSignOut();
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm transition-colors"
                          style={{ color: '#ef4444' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Guest Menu */}
                      <div className="px-4 py-3 border-b" style={{
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        backgroundColor: 'var(--background)'
                      }}>
                        <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Welcome to Lieferspatz</div>
                        <div className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Sign in to access your profile</div>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          href="/"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                          Home
                        </Link>
                        
                        <Link 
                          href="/auth/login"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                          </svg>
                          Sign In
                        </Link>
                        
                        <Link 
                          href="/auth/register"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                          </svg>
                          Create Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

                      <Link href="/" className="text-xl lg:text-2xl font-bold hover:text-gray-200 transition flex items-center">
              <img src="/favicon.ico" alt="Lieferspatz Logo" className="w-12 h-12 mr-2" />
              Lieferspatz
            </Link>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex rounded-lg bg-white overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Search restaurants, cities, or food (burger, pizza, döner)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              <button 
                type="submit"
                className="bg-teal-700 text-white px-4 py-2 hover:bg-teal-800 transition-colors flex items-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
        
        {/* Right side - User Controls */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {status === 'loading' ? (
            <span className="text-sm">Loading...</span>
          ) : session ? (
            <>
              {/* User Info - Hidden on mobile, shown on larger screens */}
              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                  <img 
                    src={restaurantProfilePhoto || restaurantImageUrl || session.user.profilePicture || '/images/default-profile.png'} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm">
                  Welcome, {session.user.firstName}!
                </span>
              </div>
              
              {/* Balance (for customers and restaurants) - Hidden on mobile */}
              {(session.user.userType === 'CUSTOMER' || session.user.userType === 'RESTAURANT') && (
                <Link 
                  href="/profile" 
                  className="bg-white text-teal-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition hidden lg:block text-sm font-medium"
                >
                  €{(balance ?? session.user.balance ?? 0).toFixed(2)}
                </Link>
              )}
              
              {/* Dashboard/Profile Link - Hidden on mobile */}
              <Link 
                href={getDashboardUrl()}
                className="bg-white text-teal-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition hidden lg:block text-sm font-medium"
              >
                {session.user.userType === 'ADMIN' ? 'Admin Panel' : 
                 session.user.userType === 'RESTAURANT' ? 'Dashboard' : 'Profile'}
              </Link>
              
              {/* Logout - Hidden on mobile */}
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition hidden lg:block text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login & Register for non-authenticated users - Hidden on mobile */}
              <Link href="/auth/login" className="bg-white text-teal-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition hidden lg:block text-sm font-medium">
                Login
              </Link>
              <Link href="/auth/register" className="bg-teal-700 text-white px-3 py-2 rounded-lg hover:bg-teal-800 transition hidden lg:block text-sm font-medium">
                Register
              </Link>
            </>
          )}

          {/* Cart Button - Only show for authenticated customers */}
          {session && session.user.userType === 'CUSTOMER' && (
            <div className="relative">
              <button 
                onClick={toggleCart}
                className="bg-white text-teal-600 px-3 py-2 rounded-lg flex items-center hover:bg-gray-100 transition text-sm font-medium"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  className="mr-1 lg:mr-2"
                >
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd"
                    d="M5.5 18H21l2-12.5H6.5l-.5-3H.9v3h2.5L5.5 18Zm14-9.5-1 6.5H8L7 8.5h12.5ZM7.5 23a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="hidden sm:inline">Cart</span>
              </button>
              
              {state.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {state.itemCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden mt-4">
        <form onSubmit={handleSearch}>
          <div className="flex rounded-lg bg-white overflow-hidden shadow-sm">
            <input
              type="text"
              placeholder="Search restaurants, cities, or food (burger, pizza, döner)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <button 
              type="submit"
              className="bg-teal-700 text-white px-4 py-2 hover:bg-teal-800 transition-colors flex items-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </header>
  );
} 