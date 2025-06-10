'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '../../components/Header'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  userType: string
  balance: number
  createdAt: string
  isActive: boolean
}

interface Restaurant {
  id: number
  name: string
  address: string
  city: string
  rating: number
  totalOrders: number
  totalEarnings: number
  isOpen: boolean
  owner: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
  }
  restaurant: {
    name: string
  }
}

interface PlatformStats {
  totalUsers: number
  totalRestaurants: number
  totalOrders: number
  totalRevenue: number
  platformFees: number
  activeUsers: number
  averageOrderValue: number
}

export default function AdminProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    platformFees: 0,
    activeUsers: 0,
    averageOrderValue: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.userType !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    // Mock platform statistics
    setStats({
      totalUsers: 1245,
      totalRestaurants: 89,
      totalOrders: 3421,
      totalRevenue: 89456.75,
      platformFees: 8945.68,
      activeUsers: 892,
      averageOrderValue: 26.15
    })

    // Mock users data
    setUsers([
      {
        id: 1,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'CUSTOMER',
        balance: 150.00,
        createdAt: '2024-01-10T10:30:00Z',
        isActive: true
      },
      {
        id: 2,
        email: 'pizza@palace.com',
        firstName: 'Mario',
        lastName: 'Rossi',
        userType: 'RESTAURANT',
        balance: 2450.75,
        createdAt: '2024-01-05T14:20:00Z',
        isActive: true
      },
      {
        id: 3,
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'CUSTOMER',
        balance: 75.50,
        createdAt: '2024-01-12T09:15:00Z',
        isActive: false
      }
    ])

    // Mock restaurants data
    setRestaurants([
      {
        id: 1,
        name: 'Pizza Palace',
        address: '123 Main St',
        city: 'Berlin',
        rating: 4.5,
        totalOrders: 234,
        totalEarnings: 5670.50,
        isOpen: true,
        owner: {
          firstName: 'Mario',
          lastName: 'Rossi',
          email: 'pizza@palace.com'
        }
      },
      {
        id: 2,
        name: 'Burger House',
        address: '456 Oak Ave',
        city: 'Munich',
        rating: 4.2,
        totalOrders: 189,
        totalEarnings: 3890.25,
        isOpen: false,
        owner: {
          firstName: 'Hans',
          lastName: 'Mueller',
          email: 'burger@house.com'
        }
      }
    ])

    // Mock orders data
    setOrders([
      {
        id: 1,
        totalPrice: 24.50,
        status: 'DELIVERED',
        createdAt: '2024-01-16T14:30:00Z',
        customer: { firstName: 'John', lastName: 'Doe' },
        restaurant: { name: 'Pizza Palace' }
      },
      {
        id: 2,
        totalPrice: 18.75,
        status: 'PENDING',
        createdAt: '2024-01-16T15:15:00Z',
        customer: { firstName: 'Jane', lastName: 'Smith' },
        restaurant: { name: 'Burger House' }
      }
    ])
  }, [session, status, router])

  const handleUserStatusToggle = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ))
  }

  const handleRestaurantStatusToggle = (restaurantId: number) => {
    setRestaurants(restaurants.map(restaurant => 
      restaurant.id === restaurantId ? { ...restaurant, isOpen: !restaurant.isOpen } : restaurant
    ))
  }

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'CUSTOMER': return 'bg-blue-100 text-blue-800'
      case 'RESTAURANT': return 'bg-green-100 text-green-800'
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-600 bg-green-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'PREPARING': return 'text-blue-600 bg-blue-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">Platform Management & Analytics</p>
            </div>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
              Admin Panel
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'users', label: 'User Management' },
                { id: 'restaurants', label: 'Restaurant Management' },
                { id: 'orders', label: 'Order Management' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'settings', label: 'Platform Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-blue-800">Total Users</div>
                    <div className="text-sm text-blue-600 mt-1">{stats.activeUsers} active</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{stats.totalRestaurants}</div>
                    <div className="text-green-800">Restaurants</div>
                    <div className="text-sm text-green-600 mt-1">{restaurants.filter(r => r.isOpen).length} open</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{stats.totalOrders.toLocaleString()}</div>
                    <div className="text-purple-800">Total Orders</div>
                    <div className="text-sm text-purple-600 mt-1">€{stats.averageOrderValue.toFixed(2)} avg</div>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">€{stats.platformFees.toLocaleString()}</div>
                    <div className="text-orange-800">Platform Fees</div>
                    <div className="text-sm text-orange-600 mt-1">10% commission</div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">#{order.id}</span>
                            <span className="text-gray-600 ml-2">
                              {order.customer.firstName} → {order.restaurant.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="font-medium">€{order.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Top Restaurants</h3>
                    <div className="space-y-3">
                      {restaurants.slice(0, 5).map((restaurant) => (
                        <div key={restaurant.id} className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{restaurant.name}</span>
                            <div className="text-sm text-gray-600">
                              ⭐ {restaurant.rating} • {restaurant.totalOrders} orders
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">€{restaurant.totalEarnings.toLocaleString()}</div>
                            <div className={`text-xs ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                              {restaurant.isOpen ? 'Open' : 'Closed'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="border rounded-lg px-3 py-2"
                    />
                    <select className="border rounded-lg px-3 py-2">
                      <option value="">All Types</option>
                      <option value="CUSTOMER">Customers</option>
                      <option value="RESTAURANT">Restaurants</option>
                      <option value="ADMIN">Admins</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4">User</th>
                        <th className="text-left p-4">Type</th>
                        <th className="text-left p-4">Balance</th>
                        <th className="text-left p-4">Joined</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getUserTypeColor(user.userType)}`}>
                              {user.userType}
                            </span>
                          </td>
                          <td className="p-4">€{user.balance.toFixed(2)}</td>
                          <td className="p-4">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUserStatusToggle(user.id)}
                                className={`px-3 py-1 rounded text-xs ${
                                  user.isActive 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Restaurant Management Tab */}
            {activeTab === 'restaurants' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Restaurant Management</h3>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    Add Restaurant
                  </button>
                </div>

                <div className="grid gap-6">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="bg-white border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold">{restaurant.name}</h4>
                          <p className="text-gray-600">{restaurant.address}, {restaurant.city}</p>
                          <p className="text-sm text-gray-500">
                            Owner: {restaurant.owner.firstName} {restaurant.owner.lastName} ({restaurant.owner.email})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                            restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {restaurant.isOpen ? 'Open' : 'Closed'}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-2xl font-bold text-gray-700">⭐ {restaurant.rating}</div>
                          <div className="text-sm text-gray-600">Rating</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-2xl font-bold text-gray-700">{restaurant.totalOrders}</div>
                          <div className="text-sm text-gray-600">Orders</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="text-2xl font-bold text-gray-700">€{restaurant.totalEarnings.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">Earnings</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestaurantStatusToggle(restaurant.id)}
                          className={`px-4 py-2 rounded text-sm ${
                            restaurant.isOpen
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {restaurant.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
                        </button>
                        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                          Edit Details
                        </button>
                        <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
                          View Menu
                        </button>
                        <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200">
                          View Orders
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Management Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Order Management</h3>
                  <div className="flex gap-2">
                    <select className="border rounded-lg px-3 py-2">
                      <option value="">All Status</option>
                      <option value="PENDING">Pending</option>
                      <option value="PREPARING">Preparing</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <input
                      type="date"
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4">Order ID</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Restaurant</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Date</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-t">
                          <td className="p-4">#{order.id}</td>
                          <td className="p-4">{order.customer.firstName} {order.customer.lastName}</td>
                          <td className="p-4">{order.restaurant.name}</td>
                          <td className="p-4">€{order.totalPrice.toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold">Platform Analytics</h3>
                
                {/* Revenue Analytics */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Revenue Breakdown</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Platform Revenue</span>
                        <span className="font-bold">€{stats.totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fees (10%)</span>
                        <span className="font-bold text-green-600">€{stats.platformFees.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Restaurant Earnings (90%)</span>
                        <span className="font-bold">€{(stats.totalRevenue - stats.platformFees).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">User Growth</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Users</span>
                        <span className="font-bold">{stats.totalUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users</span>
                        <span className="font-bold text-green-600">{stats.activeUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Retention</span>
                        <span className="font-bold">78.5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">24.5 min</div>
                      <div className="text-sm text-gray-600">Avg Delivery Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">96.2%</div>
                      <div className="text-sm text-gray-600">Order Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">4.3</div>
                      <div className="text-sm text-gray-600">Avg Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">2.1</div>
                      <div className="text-sm text-gray-600">Orders per User</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Platform Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold">Platform Settings</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Commission Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Commission Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Platform Commission (%)</label>
                        <input
                          type="number"
                          defaultValue="10"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Delivery Fee (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue="2.50"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Service Fee (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue="1.50"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platform Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">General Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Platform Name</label>
                        <input
                          type="text"
                          defaultValue="Lieferspatz"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Support Email</label>
                        <input
                          type="email"
                          defaultValue="support@lieferspatz.com"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Delivery Radius (km)</label>
                        <input
                          type="number"
                          defaultValue="15"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Notification Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Email notifications for new orders
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        SMS notifications for urgent issues
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Weekly analytics reports
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        New restaurant applications
                      </label>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold mb-4">Security Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Require 2FA for admin accounts
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Log all admin actions
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        Auto-lock accounts after failed attempts
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Session timeout (30 minutes)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                    Save All Settings
                  </button>
                  <button className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
                    Reset to Defaults
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 