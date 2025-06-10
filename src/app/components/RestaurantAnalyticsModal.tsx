'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface RestaurantAnalytics {
  restaurant: {
    id: number
    name: string
    address: string
    ownerName: string
    ownerEmail: string
    memberSince: string
    currentBalance: number
    isOpen: boolean
    rating: number
  }
  analytics: {
    totalOrders: number
    totalRevenue: number
    completedOrders: number
    averageOrderValue: number
    completionRate: number
  }
  chartData: {
    date: string
    revenue: number
    orders: number
    formattedDate: string
  }[]
  topItems: {
    name: string
    quantity: number
    revenue: number
  }[]
  topCustomers: {
    name: string
    orders: number
  }[]
  recentOrders: any[]
  menuItemsCount: number
}

interface Props {
  restaurantId: number
  isOpen: boolean
  onClose: () => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function RestaurantAnalyticsModal({ restaurantId, isOpen, onClose }: Props) {
  const [analytics, setAnalytics] = useState<RestaurantAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchAnalytics()
    }
  }, [isOpen, restaurantId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">{analytics?.restaurant.name || 'Restaurant Analytics'}</h2>
              <p className="text-teal-100">Detailed performance insights and analytics</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-teal-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'charts', label: 'Charts', icon: '📈' },
                { id: 'orders', label: 'Orders', icon: '🛒' },
                { id: 'items', label: 'Top Items', icon: '🍕' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-300 border-t-teal-600"></div>
              </div>
            ) : analytics ? (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Restaurant Info */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Restaurant Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Owner</p>
                          <p className="font-medium">{analytics.restaurant.ownerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{analytics.restaurant.ownerEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{analytics.restaurant.address}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium">
                            {new Date(analytics.restaurant.memberSince).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current Balance</p>
                          <p className="font-medium text-green-600">€{analytics.restaurant.currentBalance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            analytics.restaurant.isOpen 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {analytics.restaurant.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.analytics.totalOrders}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">€{analytics.analytics.totalRevenue.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.analytics.completionRate.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                            <p className="text-2xl font-bold text-gray-900">€{analytics.analytics.averageOrderValue.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && (
                  <div className="space-y-8">
                    {/* Revenue Chart */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="formattedDate" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: number, name: string) => [
                                name === 'revenue' ? `€${value.toFixed(2)}` : value,
                                name === 'revenue' ? 'Revenue' : 'Orders'
                              ]}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Orders Chart */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Order Volume (Last 30 Days)</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="formattedDate" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Recent Orders</h3>
                    <div className="space-y-4">
                      {analytics.recentOrders.map((order) => (
                        <div key={order.id} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">
                                {order.customer.user.firstName} {order.customer.user.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">€{order.totalPrice.toFixed(2)}</p>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            {order.items.map((item: any, index: number) => (
                              <span key={index}>
                                {item.quantity}x {item.menuItem.name}
                                {index < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Items Tab */}
                {activeTab === 'items' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Selling Items */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
                        <div className="space-y-3">
                          {analytics.topItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.quantity} sold</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">€{item.revenue.toFixed(2)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Customers */}
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
                        <div className="space-y-3">
                          {analytics.topCustomers.map((customer, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{customer.name}</p>
                              </div>
                              <div>
                                <p className="font-bold">{customer.orders} orders</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load analytics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 