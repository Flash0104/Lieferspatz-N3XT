'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useBalance } from '../context/BalanceContext';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { state, toggleCart } = useCart();
  const { data: session, status } = useSession();
  const { balance } = useBalance();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-gradient-to-r from-teal-400 to-teal-600 text-white py-3 px-4 lg:px-8 shadow-md fixed top-0 left-0 right-0 z-50">
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
                <div className="absolute top-12 left-0 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 min-w-[250px] z-50 overflow-hidden">
                  {session ? (
                    <div className="py-2">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{session.user.firstName} {session.user.lastName}</div>
                            <div className="text-xs text-gray-500">{session.user.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1">
                        <Link 
                          href="/"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                          Home
                        </Link>
                        
                        <Link 
                          href={getDashboardUrl()}
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                          {session.user.userType === 'ADMIN' ? 'Admin Panel' : 
                           session.user.userType === 'RESTAURANT' ? 'Dashboard' : 'My Profile'}
                        </Link>

                        {/* Balance for customers and restaurants */}
                        {(session.user.userType === 'CUSTOMER' || session.user.userType === 'RESTAURANT') && (
                          <div className="flex items-center px-4 py-3 text-sm border-t border-gray-100">
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                            <span className="text-gray-600">Balance: </span>
                            <span className="font-semibold text-green-600 ml-1">€{(balance ?? session.user.balance ?? 0).toFixed(2)}</span>
                          </div>
                        )}

                        {/* Settings */}
                        <Link 
                          href="/settings"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          Settings
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={() => {
                            closeMenu();
                            handleSignOut();
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      {/* Guest Menu */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="text-sm font-semibold text-gray-600">Welcome to Lieferspatz</div>
                        <div className="text-xs text-gray-500">Sign in to access your profile</div>
                      </div>
                      
                      <div className="py-1">
                        <Link 
                          href="/"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                          </svg>
                          Home
                        </Link>
                        
                        <Link 
                          href="/auth/login"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                          </svg>
                          Sign In
                        </Link>
                        
                        <Link 
                          href="/auth/register"
                          onClick={closeMenu}
                          className="flex items-center px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            🍕 Lieferspatz
          </Link>
        </div>

        {/* Center - Search Bar */}
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex rounded-lg bg-white overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Enter your address or restaurant..."
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
              <span className="text-sm hidden lg:block">
                Welcome, {session.user.firstName}!
              </span>
              
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
      <div className="md:hidden mt-3">
        <form onSubmit={handleSearch}>
          <div className="flex rounded-lg bg-white overflow-hidden shadow-sm">
            <input
              type="text"
              placeholder="Enter your address or restaurant..."
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