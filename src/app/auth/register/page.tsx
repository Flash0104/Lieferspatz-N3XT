'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    city: '',
    streetName: '',
    blockNumber: '',
    postalCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async (userType: string) => {
    // Validate required fields
    const { firstName, lastName, email, password, city, streetName, blockNumber, postalCode } = formData;
    
    if (!firstName || !lastName || !email || !password || !city || !streetName || !blockNumber) {
      setError('All fields except postal code are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          userType
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please login to continue.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 pt-24">
      <div className="p-8 rounded-lg shadow-lg max-w-5xl w-full flex flex-col md:flex-row" style={{
        backgroundColor: 'var(--card, #1e293b)',
        color: 'var(--foreground, #f1f5f9)'
      }}>
        
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-6">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--foreground, #f1f5f9)' }}>Register</h2>
          
          {error && (
            <div className="border px-4 py-3 rounded mb-4" style={{
              backgroundColor: '#fecaca',
              borderColor: '#f87171',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div className="border px-4 py-3 rounded mb-4" style={{
              backgroundColor: '#dcfce7',
              borderColor: '#16a34a',
              color: '#15803d'
            }}>
              {success}
            </div>
          )}

          <div className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                  style={{
                    backgroundColor: 'var(--background, #0f172a)',
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                    color: 'var(--foreground, #f1f5f9)'
                  }}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                  style={{
                    backgroundColor: 'var(--background, #0f172a)',
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                    color: 'var(--foreground, #f1f5f9)'
                  }}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4 p-4 rounded-lg" style={{
              backgroundColor: 'var(--background, #0f172a)',
              borderColor: 'rgba(148, 163, 184, 0.2)'
            }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground, #f1f5f9)' }}>📍 Address Details</h3>
              
              {/* City and Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                    style={{
                      backgroundColor: 'var(--card, #1e293b)',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: 'var(--foreground, #f1f5f9)'
                    }}
                    placeholder="e.g., Duisburg"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                    style={{
                      backgroundColor: 'var(--card, #1e293b)',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: 'var(--foreground, #f1f5f9)'
                    }}
                    placeholder="e.g., 47057"
                  />
                </div>
              </div>

              {/* Street Name and Block Number */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>Street Name *</label>
                  <input
                    type="text"
                    name="streetName"
                    value={formData.streetName}
                    onChange={handleInputChange}
                    className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                    style={{
                      backgroundColor: 'var(--card, #1e293b)',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: 'var(--foreground, #f1f5f9)'
                    }}
                    placeholder="e.g., Sonnenwall"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>House Number *</label>
                  <input
                    type="text"
                    name="blockNumber"
                    value={formData.blockNumber}
                    onChange={handleInputChange}
                    className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                    style={{
                      backgroundColor: 'var(--card, #1e293b)',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      color: 'var(--foreground, #f1f5f9)'
                    }}
                    placeholder="e.g., 56"
                    required
                  />
                </div>
              </div>

              <div className="text-sm" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.7 }}>
                * Required fields. We use this information to calculate distances to nearby restaurants and provide accurate delivery estimates.
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                style={{
                  backgroundColor: 'var(--background, #0f172a)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
                placeholder="Enter email"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="border p-3 w-full rounded-lg focus:ring-2 focus:outline-none input-theme"
                style={{
                  backgroundColor: 'var(--background, #0f172a)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
                placeholder="Enter password"
                required
              />
            </div>

            {/* Registration Buttons */}
            <div className="space-y-3 mt-6">
              {/* Customer Registration */}
              <button
                onClick={() => handleRegister('customer')}
                disabled={isLoading}
                className="w-full py-3 rounded-lg transition duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--primary, #14b8a6)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover, #0f766e)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary, #14b8a6)'}
              >
                {isLoading ? 'Registering...' : 'Register as a customer'}
              </button>

              {/* Restaurant Registration */}
              <button
                onClick={() => handleRegister('restaurant')}
                disabled={isLoading}
                className="w-full flex items-center justify-center border p-3 rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--background, #0f172a)',
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
              >
                <span className="font-medium">Register as a restaurant</span>
              </button>

              {/* Admin Registration */}
              <button
                onClick={() => handleRegister('admin')}
                disabled={isLoading}
                className="w-full py-3 rounded-lg transition duration-300 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent, #f97316)',
                  color: 'var(--foreground, #f1f5f9)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
              >
                {isLoading ? 'Registering...' : 'Register as admin'}
              </button>
            </div>

            <div className="text-center mt-6">
              <p style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>
                Already have an account?{' '}
                <Link href="/auth/login" className="hover:underline font-medium" style={{ 
                  color: 'var(--primary, #14b8a6)' 
                }}>
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 flex justify-center items-center">
          <div className="w-full h-auto max-h-[500px] rounded-lg shadow flex items-center justify-center" style={{
            backgroundColor: 'var(--background, #0f172a)',
            color: 'var(--foreground, #f1f5f9)',
            height: '400px'
          }}>
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <div className="text-2xl font-semibold">Join Lieferspatz</div>
              <div className="text-lg opacity-70 mt-2">Create your account today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 