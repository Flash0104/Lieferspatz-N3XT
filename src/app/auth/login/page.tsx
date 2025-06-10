'use client';

import { getSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (userType: string) => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        userType,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email, password, or account type!');
      } else {
        // Get updated session to check user type for redirect
        const session = await getSession();
        
        if (session?.user) {
          // Redirect based on user type
          if (session.user.userType === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (session.user.userType === 'RESTAURANT') {
            router.push('/restaurant/dashboard');
          } else {
            router.push('/');
          }
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-400 to-teal-600 text-white py-4 px-8 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-gray-200 transition">
            🍕 Lieferspatz
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login" className="bg-white text-teal-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
              Login
            </Link>
            <Link href="/auth/register" className="bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center py-12 px-6 min-h-[calc(100vh-80px)]">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full flex flex-col md:flex-row">
          
          {/* Form Section */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Login Buttons */}
              <div className="space-y-3 mt-6">
                {/* Customer Login */}
                <button
                  onClick={() => handleLogin('customer')}
                  disabled={isLoading}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in...' : 'Login as a customer'}
                </button>

                {/* Restaurant Login */}
                <button
                  onClick={() => handleLogin('restaurant')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-white border border-gray-300 p-3 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  <span className="text-gray-700 font-medium">Login as a restaurant</span>
                </button>

                {/* Admin Login */}
                <button
                  onClick={() => handleLogin('admin')}
                  disabled={isLoading}
                  className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in...' : 'Login as admin'}
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-teal-600 hover:underline font-medium">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="w-full md:w-1/2 flex justify-center items-center">
            <img 
              src="https://placehold.co/500x400/e5e7eb/6b7280?text=Welcome+Back"
              alt="Welcome Image" 
              className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2024 Lieferspatz. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 