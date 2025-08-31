'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import ImageUpload from '../../components/ImageUpload'
import RatingModal from '../../components/RatingModal'

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  restaurant: {
    name: string
  }
  orderItems: {
    quantity: number
    menuItem: {
      name: string
      price: number
    }
  }[]
  rating?: {
    id: number
    rating: number
    comment: string | null
    createdAt: string
  }
}

export default function CustomerProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    completedOrders: 0
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    postalCode: '',
    address: ''
  })
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean
    orderId: number
    restaurantName: string
  }>({
    isOpen: false,
    orderId: 0,
    restaurantName: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.userType !== 'CUSTOMER') {
      router.push('/auth/login')
      return
    }

    // Fetch latest profile data from database
    fetchProfileData()

    // Fetch real orders from API
    fetchOrders()
  }, [session, status, router])

  const fetchProfileData = async () => {
    if (!session?.user?.id) return
    
    try {
      console.log('Fetching latest profile data from database...')
      const response = await fetch(`/api/user/profile-data?userId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched profile data:', data.user)
        
        // Update profile data with the latest from database
        setProfileData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          location: data.user.location || '',
          postalCode: data.user.postalCode || '',
          address: data.user.address || ''
        })
      } else {
        console.error('Failed to fetch profile data')
        // Fallback to session data if API fails
        setProfileData({
          firstName: session.user.firstName || '',
          lastName: session.user.lastName || '',
          email: session.user.email || '',
          location: session.user.location || '',
          postalCode: session.user.postalCode || '',
          address: session.user.address || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Fallback to session data if API fails
      setProfileData({
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || '',
        location: session.user.location || '',
        postalCode: session.user.postalCode || '',
        address: session.user.address || ''
      })
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders/customer')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setOrderStats({
          totalOrders: data.totalOrders,
          totalSpent: data.totalSpent,
          completedOrders: data.completedOrders
        })
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profileData,
          userId: session?.user?.id // Include user ID from frontend session
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Profile updated successfully:', result)
        
        alert('Profile updated successfully!')
        
        // Refetch the latest profile data from database
        await fetchProfileData()
      } else {
        const error = await response.json()
        console.error('Failed to update profile:', error)
        alert(error.error || 'Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
    
    setIsEditing(false)
  }

  const handleProfileImageUpload = (url: string) => {
    // The image upload already updates the database, but we could refresh the session here
    console.log('Profile image uploaded:', url)
  }

  const handleRateOrder = (orderId: number, restaurantName: string) => {
    setRatingModal({
      isOpen: true,
      orderId,
      restaurantName
    })
  }

  const handleSubmitRating = async (rating: number, comment: string) => {
    try {
      const response = await fetch('/api/orders/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: ratingModal.orderId,
          rating,
          comment
        })
      })

      if (response.ok) {
        // Refresh orders to show the new rating
        await fetchOrders()
        setRatingModal({ isOpen: false, orderId: 0, restaurantName: '' })
      } else {
        const error = await response.json()
        console.error('Failed to submit rating:', error)
        alert('Failed to submit rating. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      alert('Failed to submit rating. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' }
      case 'PENDING': return { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }
      case 'PREPARING': return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' }
      case 'CANCELLED': return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }
      default: return { backgroundColor: 'rgba(148, 163, 184, 0.1)', color: 'var(--foreground)', borderColor: 'rgba(148, 163, 184, 0.3)' }
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ 
        background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)'
      }}>
        <div className="animate-spin rounded-full h-16 w-16 border-4" style={{
          borderColor: 'rgba(20, 184, 166, 0.3)',
          borderTopColor: 'var(--primary)'
        }}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)'
    }}>
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="rounded-2xl shadow-xl p-8" style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              color: 'var(--foreground)'
            }}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, {session?.user.firstName}! 👋
                  </h1>
                  <p className="text-lg" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                    Ready to order something delicious today?
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="rounded-xl p-4 text-center" style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <div className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Your Balance</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                      €{session?.user.balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Total Orders</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{orderStats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Total Spent</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    €{orderStats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl shadow-lg p-6 border hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Completed</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {orderStats.completedOrders}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <div className="rounded-xl shadow-lg p-6 border" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              color: 'var(--foreground)'
            }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Profile</h2>
                  <div className="p-2 rounded-full bg-teal-100">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                </div>

                {/* Profile Picture Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <ImageUpload
                      currentImage={session?.user.profilePicture}
                      uploadType="profile"
                      onUploadSuccess={handleProfileImageUpload}
                      size="large"
                      className="mx-auto"
                    />
                    <p className="text-sm mt-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                      Upload your profile picture
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
className="rounded-lg px-3 py-2 transition" style={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: 'var(--foreground)'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
className="rounded-lg px-3 py-2 transition" style={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full rounded-lg px-3 py-2 transition" style={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        color: 'var(--foreground)'
                      }}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
placeholder="Full Address (e.g., Kuhstraße 33, Geilenkirchen)"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
className="rounded-lg px-3 py-2 transition" style={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: 'var(--foreground)'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={profileData.postalCode}
                        onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
className="rounded-lg px-3 py-2 transition" style={{
                          backgroundColor: 'var(--background)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          color: 'var(--foreground)'
                        }}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleProfileUpdate}
className="flex-1 py-2 px-4 rounded-lg transition-colors font-medium" style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--foreground)'
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                        <div className="text-sm w-20" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Name:</div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{profileData.firstName} {profileData.lastName}</div>
                      </div>
                      <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                        <div className="text-sm w-20" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Email:</div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{profileData.email}</div>
                      </div>
                      <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                        <div className="text-sm w-20" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Location:</div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{profileData.location}</div>
                      </div>
                      <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
                        <div className="text-sm w-20" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Postal:</div>
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>{profileData.postalCode}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full py-2 px-4 rounded-lg transition-colors font-medium" style={{
                        backgroundColor: 'var(--primary)',
                        color: 'var(--foreground)'
                      }}
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="lg:col-span-2">
              <div className="rounded-xl shadow-lg p-6 border" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              color: 'var(--foreground)'
            }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Order History</h2>
                  <div className="p-2 rounded-full bg-orange-100">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-300 border-t-teal-600 mx-auto mb-4"></div>
                    <p style={{ color: 'var(--foreground)', opacity: 0.7 }}>Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 p-3 bg-gray-100 rounded-full">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>No orders yet</h3>
                    <p className="mb-6" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Start exploring restaurants and place your first order!</p>
                    <button
                      onClick={() => router.push('/')}
                      className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      Browse Restaurants
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-teal-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{order.restaurant.name}</h3>
                            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>Order #{order.id}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </div>
                            <div className="text-xl font-bold  mt-2">€{order.totalPrice.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Items:</h4>
                          <div className="space-y-1 mb-3">
                            {order.orderItems.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="">{item.quantity}x {item.menuItem.name}</span>
                                <span className="font-medium ">€{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* View Order Status Button */}
                          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                            <div className="border-t border-gray-100 pt-3">
                              <button
                                onClick={() => router.push(`/order/${order.id}`)}
                                className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                              >
                                View Order Status
                              </button>
                            </div>
                          )}
                          
                          {/* Rating Section */}
                          {order.status === 'DELIVERED' && (
                            <div className="border-t border-gray-100 pt-3">
                              {order.rating ? (
                                <div className="bg-yellow-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= order.rating!.rating
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300'
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                            fill={star <= order.rating!.rating ? 'currentColor' : 'none'}
                                          />
                                        </svg>
                                      ))}
                                      <span className="ml-1 text-sm font-medium ">
                                        {order.rating.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {order.rating.comment && (
                                    <p className="text-sm  italic">
                                      "{order.rating.comment}"
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    Rated on {new Date(order.rating.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleRateOrder(order.id, order.restaurant.name)}
                                  className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                  </svg>
                                  Rate this order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, orderId: 0, restaurantName: '' })}
        onSubmit={handleSubmitRating}
        restaurantName={ratingModal.restaurantName}
        orderId={ratingModal.orderId}
      />
    </div>
  )
} 