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
    <div className="flex items-center justify-center min-h-screen px-4 py-8 pt-24">
      <div className="p-8 rounded-lg shadow-lg max-w-4xl w-full flex flex-col md:flex-row" style={{
        backgroundColor: 'var(--card, #1e293b)',
        color: 'var(--foreground, #f1f5f9)'
      }}>
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--foreground, #f1f5f9)' }}>
            Login
          </h2>
          
          {error && (
            <div className="border px-4 py-3 rounded mb-4" style={{
              backgroundColor: '#fecaca',
              borderColor: '#f87171',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                style={{
                  backgroundColor: 'var(--background, #0f172a)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                style={{
                  backgroundColor: 'var(--background, #0f172a)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
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
                className="w-full py-3 rounded-lg transition duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--primary, #14b8a6)',
                  color: 'var(--primary-foreground, #ffffff)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover, #0f766e)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary, #14b8a6)'}
              >
                {isLoading ? 'Logging in...' : 'Login as a customer'}
              </button>

              {/* Restaurant Login */}
              <button
                onClick={() => handleLogin('restaurant')}
                disabled={isLoading}
                className="w-full flex items-center justify-center p-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--card, #1e293b)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background, #0f172a)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card, #1e293b)'}
              >
                <span className="font-medium">Login as a restaurant</span>
              </button>

              {/* Admin Login */}
              <button
                onClick={() => handleLogin('admin')}
                disabled={isLoading}
                className="w-full py-3 rounded-lg transition duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent, #ef4444)',
                  color: 'var(--accent-foreground, #ffffff)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent, #ef4444)'}
              >
                {isLoading ? 'Logging in...' : 'Login as admin'}
              </button>
            </div>

            <div className="text-center mt-6">
              <p style={{ color: 'var(--muted-foreground, #94a3b8)' }}>
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="hover:underline font-medium"
                  style={{ color: 'var(--primary, #14b8a6)' }}
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <img
            src="https://placehold.co/500x400/1e293b/f1f5f9?text=Welcome+Back"
            alt="Welcome Image"
            className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow"
          />
        </div>
      </div>
    </div>
  );
} 