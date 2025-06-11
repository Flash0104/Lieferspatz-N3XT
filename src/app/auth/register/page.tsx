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
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-5xl w-full flex flex-col md:flex-row">
          
          {/* Form Section */}
          <div className="w-full md:w-1/2 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Register</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📍 Address Details</h3>
                
                {/* City and Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">City *</label>
                  <input
                    type="text"
                      name="city"
                      value={formData.city}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      placeholder="e.g., Duisburg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      placeholder="e.g., 47057"
                    />
                  </div>
                </div>

                {/* Street Name and Block Number */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Street Name *</label>
                    <input
                      type="text"
                      name="streetName"
                      value={formData.streetName}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      placeholder="e.g., Sonnenwall"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">House Number *</label>
                    <input
                      type="text"
                      name="blockNumber"
                      value={formData.blockNumber}
                      onChange={handleInputChange}
                      className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                      placeholder="e.g., 56"
                    required
                  />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  * Required fields. We use this information to calculate distances to nearby restaurants and provide accurate delivery estimates.
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
                  placeholder="Enter email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-3 w-full rounded-lg focus:ring-2 focus:ring-teal-400 focus:outline-none"
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
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Register as a customer'}
                </button>

                {/* Restaurant Registration */}
                <button
                  onClick={() => handleRegister('restaurant')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-white border border-gray-300 p-3 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-100 transition-all disabled:opacity-50"
                >
                  <span className="text-gray-700 font-medium">Register as a restaurant</span>
                </button>

                {/* Admin Registration */}
                <button
                  onClick={() => handleRegister('admin')}
                  disabled={isLoading}
                  className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition duration-300 disabled:opacity-50"
                >
                  {isLoading ? 'Registering...' : 'Register as admin'}
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="text-teal-600 hover:underline font-medium">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Image Section */}
          <div className="w-full md:w-1/2 md:block">
            <img 
              src="https://placehold.co/500x600/e5e7eb/6b7280?text=Join+Lieferspatz"
              alt="Welcome Image" 
              className="w-full h-full object-cover rounded-lg shadow"
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