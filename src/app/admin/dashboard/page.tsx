'use client';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import RestaurantAnalyticsModal from '../../components/RestaurantAnalyticsModal';

interface Stats {
  totalRestaurants: number;
  totalCustomers: number;
  totalOrders: number;
  totalEarnings: number;
}

interface Restaurant {
  id: number;
  name: string;
  address: string;
  isOpen: boolean;
  displayOrder: number;
  balance: number;
  orderCount: number;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  balance: number;
  orderCount?: number;
}

// Sortable Restaurant Item Component
function SortableRestaurant({ restaurant, onView, onDelete }: { 
  restaurant: Restaurant
  onView: (id: number) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: restaurant.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-700 hover:bg-gray-700 transition-colors ${
        isDragging ? 'bg-gray-700' : ''
      }`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move mr-3 p-1 hover:bg-gray-600 rounded"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {restaurant.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <div className="font-medium text-white">{restaurant.name}</div>
              <div className="text-sm text-gray-400">{restaurant.address}</div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          restaurant.isOpen 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </span>
      </td>
      <td className="px-6 py-4 text-white">{restaurant.orderCount}</td>
      <td className="px-6 py-4 text-white">€{restaurant.balance.toFixed(2)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(restaurant.id)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            View Analytics
          </button>
          <button
            onClick={() => onDelete(restaurant.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ totalRestaurants: 0, totalCustomers: 0, totalOrders: 0, totalEarnings: 0 });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRestaurant, setShowCreateRestaurant] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAddBalance, setShowAddBalance] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [dragOrderChanged, setDragOrderChanged] = useState(false);
  const [addBalanceData, setAddBalanceData] = useState({
    amount: '',
    reason: ''
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    address: '',
    city: '',
    description: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerFirstName: '',
    ownerLastName: '',
    location: '',
    postalCode: ''
  });

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    location: '',
    postalCode: '',
    userType: 'CUSTOMER'
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.userType !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Try the new optimized API first
      let response = await fetch('/api/admin/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRestaurants(data.restaurants || []);
        setUsers(data.users || []);
      } else if (response.status === 404) {
        // Fallback to old API endpoints if new one doesn't exist
        console.log('Using fallback API endpoints...');
        const [statsRes, restaurantsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/restaurants'),
          fetch('/api/admin/users')
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (restaurantsRes.ok) {
          const restaurantsData = await restaurantsRes.json();
          if (restaurantsData.restaurants && Array.isArray(restaurantsData.restaurants)) {
            setRestaurants(restaurantsData.restaurants);
          }
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.users && Array.isArray(usersData.users)) {
            setUsers(usersData.users);
          } else if (Array.isArray(usersData)) {
            setUsers(usersData);
          }
        }
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
        // Set empty defaults on error
        setStats({ totalRestaurants: 0, totalCustomers: 0, totalOrders: 0, totalEarnings: 0 });
        setRestaurants([]);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Ensure arrays are always initialized even on error
      setRestaurants([]);
      setUsers([]);
      setStats({ totalRestaurants: 0, totalCustomers: 0, totalOrders: 0, totalEarnings: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && restaurants && Array.isArray(restaurants)) {
      const oldIndex = restaurants.findIndex((restaurant) => restaurant.id.toString() === active.id);
      const newIndex = restaurants.findIndex((restaurant) => restaurant.id.toString() === over?.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error('Could not find restaurant indices for drag and drop');
        return;
      }
      
      const newRestaurants = arrayMove(restaurants, oldIndex, newIndex);
      setRestaurants(newRestaurants);
      setDragOrderChanged(true);

      // Update display orders
      const restaurantOrders = newRestaurants.map((restaurant, index) => ({
        id: restaurant.id,
        displayOrder: index
      }));

      try {
        const response = await fetch('/api/admin/restaurants/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ restaurantOrders }),
        });

        if (response.ok) {
          console.log('Restaurant order updated successfully');
          setDragOrderChanged(false);
        } else {
          console.error('Failed to update restaurant order');
          // Revert the change if API call failed
          fetchData();
        }
      } catch (error) {
        console.error('Error updating restaurant order:', error);
        fetchData();
      }
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/create-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRestaurant),
      });

      if (response.ok) {
        setShowCreateRestaurant(false);
        setNewRestaurant({
          name: '',
          address: '',
          city: '',
          description: '',
          ownerEmail: '',
          ownerPassword: '',
          ownerFirstName: '',
          ownerLastName: '',
          location: '',
          postalCode: ''
        });
        // Only refetch data instead of full page reload
        fetchData();
      } else {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      alert('Failed to create restaurant');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setShowCreateUser(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          location: '',
          postalCode: '',
          userType: 'CUSTOMER'
        });
        // Only refetch data instead of full page reload
        fetchData();
      } else {
        const errorData = await response.json();
        alert('Error: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeleteRestaurant = async (id: number) => {
    if (confirm('Are you sure you want to delete this restaurant?')) {
      try {
        const response = await fetch('/api/admin/restaurants', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          // Optimistically remove from UI then refetch
          setRestaurants(prev => prev.filter(r => r.id !== id));
          fetchData();
        } else {
          alert('Failed to delete restaurant');
        }
      } catch (error) {
        console.error('Error deleting restaurant:', error);
        alert('Failed to delete restaurant');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          // Optimistically remove from UI then refetch
          setUsers(prev => prev.filter(u => u.id !== id));
          fetchData();
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleViewAnalytics = (restaurantId: number) => {
    setSelectedRestaurantId(restaurantId);
    setShowAnalytics(true);
  };

  const handleAddBalance = (userId: number) => {
    setSelectedUserId(userId);
    setShowAddBalance(true);
  };

  const handleSubmitAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !addBalanceData.amount) return;

    try {
      const response = await fetch('/api/admin/add-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          amount: parseFloat(addBalanceData.amount),
          reason: addBalanceData.reason
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Successfully added €${data.user.amountAdded} to ${data.user.firstName} ${data.user.lastName}'s account!`);
        setShowAddBalance(false);
        setAddBalanceData({ amount: '', reason: '' });
        setSelectedUserId(null);
        fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      alert('Failed to add balance. Please try again.');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Header />
        
        <div className="pt-20 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="h-8 bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-6 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Skeletons */}
            <div className="space-y-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                  <div className="p-6 border-b border-gray-700">
                    <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
                  </div>
                  <div className="p-6 space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-12 bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your food delivery platform</p>
            {dragOrderChanged && (
              <div className="mt-2 text-yellow-400 text-sm">
                ⚡ Restaurant order is being updated...
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Restaurants</p>
                  <p className="text-2xl font-bold text-white">{stats.totalRestaurants}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">€{stats.totalEarnings.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Management */}
          <div className="bg-gray-800 rounded-xl shadow-lg mb-8 border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Restaurant Management</h2>
                <button
                  onClick={() => setShowCreateRestaurant(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Restaurant
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">Drag and drop to reorder restaurants</p>
            </div>

            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <table className="min-w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Restaurant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <SortableContext items={(restaurants || []).map(r => r.id.toString())} strategy={verticalListSortingStrategy}>
                    <tbody>
                      {(restaurants || []).map((restaurant) => (
                        <SortableRestaurant
                          key={restaurant.id}
                          restaurant={restaurant}
                          onView={handleViewAnalytics}
                          onDelete={handleDeleteRestaurant}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">User Management</h2>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(users || []).map((user) => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.userType === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.userType === 'RESTAURANT' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{user.orderCount || 0}</td>
                      <td className="px-6 py-4 text-white">€{user.balance.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddBalance(user.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Add Money
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Analytics Modal */}
      {showAnalytics && selectedRestaurantId && (
        <RestaurantAnalyticsModal
          restaurantId={selectedRestaurantId}
          isOpen={showAnalytics}
          onClose={() => {
            setShowAnalytics(false);
            setSelectedRestaurantId(null);
          }}
        />
      )}

      {/* Create Restaurant Modal */}
      {showCreateRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Add New Restaurant</h3>
              <button
                onClick={() => setShowCreateRestaurant(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({...newRestaurant, name: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({...newRestaurant, address: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={newRestaurant.city}
                  onChange={(e) => setNewRestaurant({...newRestaurant, city: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({...newRestaurant, description: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <hr className="border-gray-600" />
              <p className="text-sm text-gray-400">Owner Information</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newRestaurant.ownerFirstName}
                    onChange={(e) => setNewRestaurant({...newRestaurant, ownerFirstName: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newRestaurant.ownerLastName}
                    onChange={(e) => setNewRestaurant({...newRestaurant, ownerLastName: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newRestaurant.ownerEmail}
                  onChange={(e) => setNewRestaurant({...newRestaurant, ownerEmail: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newRestaurant.ownerPassword}
                  onChange={(e) => setNewRestaurant({...newRestaurant, ownerPassword: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newRestaurant.location}
                    onChange={(e) => setNewRestaurant({...newRestaurant, location: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newRestaurant.postalCode}
                    onChange={(e) => setNewRestaurant({...newRestaurant, postalCode: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 font-medium transition-colors"
                >
                  Create Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRestaurant(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Add New User</h3>
              <button
                onClick={() => setShowCreateUser(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">User Type</label>
                <select
                  value={newUser.userType}
                  onChange={(e) => setNewUser({...newUser, userType: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newUser.location}
                    onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newUser.postalCode}
                    onChange={(e) => setNewUser({...newUser, postalCode: e.target.value})}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 font-medium transition-colors"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      {showAddBalance && selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Add Balance</h3>
              <button
                onClick={() => {
                  setShowAddBalance(false);
                  setSelectedUserId(null);
                  setAddBalanceData({ amount: '', reason: '' });
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitAddBalance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Amount (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={addBalanceData.amount}
                  onChange={(e) => setAddBalanceData({...addBalanceData, amount: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter amount to add"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason (Optional)</label>
                <textarea
                  value={addBalanceData.reason}
                  onChange={(e) => setAddBalanceData({...addBalanceData, reason: e.target.value})}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-700 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for balance adjustment"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBalance(false);
                    setSelectedUserId(null);
                    setAddBalanceData({ amount: '', reason: '' });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 