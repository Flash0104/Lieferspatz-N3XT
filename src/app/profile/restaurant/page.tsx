'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import ImageUpload from '../../components/ImageUpload'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
}

interface Order {
  id: number
  totalPrice: number
  status: string
  createdAt: string
  customer: {
    firstName: string
    lastName: string
    location: string
  }
  orderItems: {
    quantity: number
    menuItem: {
      name: string
      price: number
    }
  }[]
}

interface Restaurant {
  id: number
  name: string
  address: string
  city: string
  description?: string
  isOpen: boolean
  averagePrepTime: number
  rating: number
  imageUrl?: string
  user?: {
    firstName: string
    lastName: string
    email: string
    balance: number
  }
}

export default function RestaurantProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined)
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main'
  })
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [showAddItem, setShowAddItem] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    city: '',
    description: '',
    isOpen: false,
    averagePrepTime: 20
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.userType !== 'RESTAURANT') {
      router.push('/auth/login')
      return
    }

    fetchRestaurantData()
  }, [session, status, router])

  // Debug: Log restaurant data changes
  useEffect(() => {
    if (restaurant) {
      console.log('Restaurant data updated:', {
        id: restaurant.id,
        name: restaurant.name,
        imageUrl: restaurant.imageUrl
      })
    }
  }, [restaurant])

  // Debug: Log currentImageUrl changes
  useEffect(() => {
    console.log('Current image URL changed:', currentImageUrl)
  }, [currentImageUrl])

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant data
      const restaurantResponse = await fetch('/api/user/restaurant')
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        console.log('Fetched restaurant data:', restaurantData.restaurant)
        console.log('Image URL from API:', restaurantData.restaurant.imageUrl)
        console.log('Setting currentImageUrl to:', restaurantData.restaurant.imageUrl)
        setRestaurant(restaurantData.restaurant)
        setCurrentImageUrl(restaurantData.restaurant.imageUrl)
        setRestaurantData({
          name: restaurantData.restaurant.name,
          address: restaurantData.restaurant.address,
          city: restaurantData.restaurant.city,
          description: restaurantData.restaurant.description || '',
          isOpen: restaurantData.restaurant.isOpen,
          averagePrepTime: restaurantData.restaurant.averagePrepTime
        })

        // Fetch menu items
        const menuResponse = await fetch(`/api/menu?restaurantId=${restaurantData.restaurant.id}`)
        if (menuResponse.ok) {
          const menuData = await menuResponse.json()
          setMenuItems(menuData.menuItems)
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMenuItem = async () => {
    if (!newMenuItem.name || !newMenuItem.price || !restaurant) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMenuItem.name,
          description: newMenuItem.description,
          price: parseFloat(newMenuItem.price),
          category: newMenuItem.category,
          restaurantId: restaurant.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMenuItems([...menuItems, data.menuItem])
        setNewMenuItem({ name: '', description: '', price: '', category: 'main' })
        setShowAddItem(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add menu item')
      }
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Failed to add menu item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMenuItem = async () => {
    if (!editingItem || !restaurant) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
          description: editingItem.description,
          price: editingItem.price,
          category: editingItem.category,
          restaurantId: restaurant.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? data.menuItem : item
        ))
        setEditingItem(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update menu item')
      }
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: itemId })
      })

      if (response.ok) {
        setMenuItems(menuItems.filter(item => item.id !== itemId))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete menu item')
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item')
    }
  }

  const handleRestaurantImageUpload = async (url: string) => {
    if (restaurant) {
      // Update local state immediately for instant feedback
      setRestaurant({ ...restaurant, imageUrl: url })
      setCurrentImageUrl(url) // Update the local image URL immediately
      
      // Also refresh the restaurant data from the server to ensure consistency
      try {
        const response = await fetch('/api/user/restaurant')
        if (response.ok) {
          const data = await response.json()
          setRestaurant(data.restaurant)
          setCurrentImageUrl(data.restaurant.imageUrl)
          console.log('Restaurant data refreshed after image upload:', data.restaurant)
        }
      } catch (error) {
        console.error('Error refreshing restaurant data:', error)
      }
    }
  }

  const handleMenuItemImageUpload = (url: string, itemId: number) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, imageUrl: url } : item
    ))
  }

  const handleOrderStatusUpdate = (orderId: number, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      case 'ACCEPTED': return 'text-blue-600 bg-blue-100'
      case 'PREPARING': return 'text-purple-600 bg-purple-100'
      case 'READY': return 'text-green-600 bg-green-100'
      case 'DELIVERED': return ' bg-gray-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      default: return ' bg-gray-100'
    }
  }

  const totalEarnings = orders
    .filter(order => order.status === 'DELIVERED')
    .reduce((sum, order) => sum + order.totalPrice, 0)

  const pendingOrders = orders.filter(order => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status))

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header restaurantImageUrl={currentImageUrl} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              No Restaurant Profile Found
            </h2>
            <p className=" mb-6">
              It looks like you haven't set up your restaurant yet. Please contact support to complete your restaurant setup.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, var(--background) 0%, var(--card) 100%)'
    }}>
      <Header restaurantImageUrl={currentImageUrl} />
      
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-8">
        {/* Header */}
        <div className="rounded-lg shadow-md p-6 mb-8" style={{
          backgroundColor: 'var(--card)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: 'var(--foreground)'
        }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* Restaurant Profile Picture */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-200 bg-gray-100">
                <img
                  key={currentImageUrl || 'default'}
                  src={currentImageUrl || '/images/default-restaurant.svg'}
                  alt={`${restaurant.name} profile`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-restaurant.svg';
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{restaurant.name}</h1>
                <p style={{ color: 'var(--foreground)', opacity: 0.8 }}>{restaurant.address}, {restaurant.city}</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1" style={{ color: 'var(--foreground)', opacity: 0.8 }}>{restaurant.rating.toFixed(1)} rating</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg ${restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                Balance: €{session?.user.balance?.toFixed(2) || '0.00'}
              </div>
              <button
                onClick={fetchRestaurantData}
                className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg hover:bg-orange-200"
              >
                🔄 Refresh
              </button>
              <div className="text-xs text-gray-500">
                Debug: {currentImageUrl || 'No image URL'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="rounded-lg shadow-md mb-8" style={{
          backgroundColor: 'var(--card)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: 'var(--foreground)'
        }}>
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'orders', label: 'Orders' },
                { id: 'menu', label: 'Menu Management' },
                { id: 'settings', label: 'Restaurant Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent  hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Restaurant Profile Picture Section */}
                <div className="border rounded-lg p-6" style={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  color: 'var(--foreground)'
                }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Restaurant Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    <ImageUpload
                      key={currentImageUrl || 'default'}
                      currentImage={currentImageUrl}
                      uploadType="restaurant"
                      entityId={restaurant.id.toString()}
                      onUploadSuccess={handleRestaurantImageUpload}
                      size="large"
                    />
                    <div>
                      <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>Upload your restaurant's profile picture</h4>
                      <p className="text-sm mb-2" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                        Choose a high-quality image that represents your restaurant. This will be shown to customers when they browse restaurants.
                      </p>
                      <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                        Recommended: Square image, minimum 400x400 pixels, maximum 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">€{totalEarnings.toFixed(2)}</div>
                    <div className="text-green-800">Total Earnings</div>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{orders.length}</div>
                    <div className="text-blue-800">Total Orders</div>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{pendingOrders.length}</div>
                    <div className="text-yellow-800">Pending Orders</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Restaurant Stats</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="">Menu Items:</span>
                      <span className="ml-2 font-semibold">{menuItems.length}</span>
                    </div>
                    <div>
                      <span className="">Average Prep Time:</span>
                      <span className="ml-2 font-semibold">{restaurant.averagePrepTime} min</span>
                    </div>
                    <div>
                      <span className="">Status:</span>
                      <span className={`ml-2 font-semibold ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                        {restaurant.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div>
                      <span className="">Rating:</span>
                      <span className="ml-2 font-semibold">{restaurant.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Active Orders</h3>
                {pendingOrders.length === 0 ? (
                  <p className=" text-center py-8">No active orders</p>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4" style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        color: 'var(--foreground)'
                      }}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">Order #{order.id}</h4>
                            <p className="">
                              {order.customer.firstName} {order.customer.lastName} - {order.customer.location}
                            </p>
                            <p className="text-sm ">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">€{order.totalPrice.toFixed(2)}</div>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                              {order.status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3 mb-4">
                          <h5 className="font-medium mb-2">Items:</h5>
                          {order.orderItems.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.menuItem.name}</span>
                              <span>€{(item.quantity * item.menuItem.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'ACCEPTED')}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'PREPARING')}
                              className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'READY')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Mark Ready
                            </button>
                          )}
                          {['PENDING', 'ACCEPTED'].includes(order.status) && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          )}
                          
                          {/* View Order Details Button */}
                          <button
                            onClick={() => router.push(`/order/${order.id}`)}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 ml-auto"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Menu Management Tab */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Menu Items ({menuItems.length})</h3>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Add New Item
                  </button>
                </div>

                {showAddItem && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Add New Menu Item</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={newMenuItem.name}
                        onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price (€)"
                        value={newMenuItem.price}
                        onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                        className="border rounded-lg px-3 py-2"
                      />
                    </div>
                    <textarea
                      placeholder="Description"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 mb-4"
                      rows={3}
                    />
                    <select
                      value={newMenuItem.category}
                      onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                      className="border rounded-lg px-3 py-2 mb-4 w-full"
                    >
                      <option value="main">Main Course</option>
                      <option value="pizza">Pizza</option>
                      <option value="salad">Salad</option>
                      <option value="appetizer">Appetizer</option>
                      <option value="dessert">Dessert</option>
                      <option value="drink">Drink</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddMenuItem}
                        disabled={isSubmitting}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Adding...' : 'Add Item'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddItem(false)
                          setNewMenuItem({ name: '', description: '', price: '', category: 'main' })
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No menu items yet
                    </h3>
                    <p className=" mb-6">
                      Start building your menu by adding your first item!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {menuItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4" style={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'rgba(148, 163, 184, 0.2)',
                        color: 'var(--foreground)'
                      }}>
                        {editingItem?.id === item.id ? (
                          /* Edit Mode */
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <ImageUpload
                                currentImage={item.imageUrl}
                                uploadType="menu"
                                entityId={item.id.toString()}
                                onUploadSuccess={(url) => handleMenuItemImageUpload(url, item.id)}
                                size="medium"
                              />
                              <div className="flex-1 space-y-3">
                                <input
                                  type="text"
                                  value={editingItem.name}
                                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                                  className="w-full border rounded-lg px-3 py-2 font-semibold"
                                  placeholder="Item name"
                                />
                                <textarea
                                  value={editingItem.description}
                                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                  className="w-full border rounded-lg px-3 py-2 text-sm"
                                  rows={2}
                                  placeholder="Description"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingItem.price}
                                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                                    className="border rounded-lg px-3 py-2"
                                    placeholder="Price"
                                  />
                                  <select
                                    value={editingItem.category}
                                    onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                                    className="border rounded-lg px-3 py-2"
                                  >
                                    <option value="main">Main Course</option>
                                    <option value="pizza">Pizza</option>
                                    <option value="salad">Salad</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="drink">Drink</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditMenuItem}
                                disabled={isSubmitting}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                              >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex items-start gap-4">
                            <img
                              src={item.imageUrl || '/images/default-food.png'}
                              alt={item.name}
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{item.name}</h4>
                              <p className=" text-sm mb-2">{item.description}</p>
                              <div className="flex items-center gap-4">
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {item.category}
                                </span>
                                <div className="text-lg font-bold text-green-600">€{item.price.toFixed(2)}</div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Restaurant Settings</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                    <input
                      type="text"
                      value={restaurantData.name}
                      onChange={(e) => setRestaurantData({...restaurantData, name: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      value={restaurantData.city}
                      onChange={(e) => setRestaurantData({...restaurantData, city: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={restaurantData.address}
                    onChange={(e) => setRestaurantData({...restaurantData, address: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={restaurantData.description}
                    onChange={(e) => setRestaurantData({...restaurantData, description: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Average Preparation Time (minutes)</label>
                    <input
                      type="number"
                      value={restaurantData.averagePrepTime}
                      onChange={(e) => setRestaurantData({...restaurantData, averagePrepTime: parseInt(e.target.value)})}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={restaurantData.isOpen}
                        onChange={(e) => setRestaurantData({...restaurantData, isOpen: e.target.checked})}
                        className="mr-2"
                      />
                      Restaurant is currently open
                    </label>
                  </div>
                </div>

                <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 