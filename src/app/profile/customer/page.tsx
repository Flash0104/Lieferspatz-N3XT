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
  items: {
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

    // Set initial profile data
    setProfileData({
      firstName: session.user.firstName || '',
      lastName: session.user.lastName || '',
      email: session.user.email || '',
      location: session.user.location || '',
      postalCode: session.user.postalCode || '',
      address: session.user.address || ''
    })

    // Fetch real orders from API
    fetchOrders()
  }, [session, status, router])

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
    // TODO: Implement profile update API call
    console.log('Updating profile:', profileData)
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
      case 'DELIVERED': return 'text-green-700 bg-green-100 border-green-200'
      case 'PENDING': return 'text-amber-700 bg-amber-100 border-amber-200'
      case 'PREPARING': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'CANCELLED': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-teal-50 to-teal-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-300 border-t-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Welcome back, {session?.user.firstName}! 👋
                  </h1>
                  <p className="text-teal-100 text-lg">
                    Ready to order something delicious today?
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-sm text-teal-100">Your Balance</div>
                    <div className="text-2xl font-bold">
                      €{session?.user.balance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{orderStats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
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
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Profile</h2>
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
                    <p className="text-sm text-gray-600 mt-2">
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
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Location"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={profileData.postalCode}
                        onChange={(e) => setProfileData({...profileData, postalCode: e.target.value})}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleProfileUpdate}
                        className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
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
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 w-20">Name:</div>
                        <div className="font-medium text-gray-900">{session?.user.firstName} {session?.user.lastName}</div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 w-20">Email:</div>
                        <div className="font-medium text-gray-900">{session?.user.email}</div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 w-20">Location:</div>
                        <div className="font-medium text-gray-900">{session?.user.location}</div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 w-20">Postal:</div>
                        <div className="font-medium text-gray-900">{session?.user.postalCode}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                  <div className="p-2 rounded-full bg-orange-100">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                </div>
                
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-300 border-t-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 p-3 bg-gray-100 rounded-full">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Start exploring restaurants and place your first order!</p>
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
                            <h3 className="font-semibold text-lg text-gray-900">{order.restaurant.name}</h3>
                            <p className="text-gray-500 text-sm">Order #{order.id}</p>
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
                            <div className="text-xl font-bold text-gray-900 mt-2">€{order.totalPrice.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-3">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Items:</h4>
                          <div className="space-y-1 mb-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.quantity}x {item.menuItem.name}</span>
                                <span className="font-medium text-gray-900">€{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
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
                                      <span className="ml-1 text-sm font-medium text-gray-600">
                                        {order.rating.rating.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {order.rating.comment && (
                                    <p className="text-sm text-gray-600 italic">
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