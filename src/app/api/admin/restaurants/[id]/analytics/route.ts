import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const restaurantId = parseInt(resolvedParams.id)

    // Get restaurant details with owner info
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            balance: true
          }
        },
        menuItems: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            orderItems: {
              select: {
                quantity: true,
                order: {
                  select: {
                    createdAt: true,
                    status: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get all orders for this restaurant with detailed info
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate analytics
    const totalOrders = orders.length
    const totalRevenue = restaurant.balance
    const completedOrders = orders.filter(order => order.status === 'DELIVERED').length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get revenue over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= thirtyDaysAgo
    )

    // Group orders by date for chart data
    const revenueByDate = new Map<string, number>()
    const ordersByDate = new Map<string, number>()

    recentOrders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      const orderValue = order.totalPrice * 0.85 // Restaurant gets 85% (100% - 15% service fee)
      
      revenueByDate.set(date, (revenueByDate.get(date) || 0) + orderValue)
      ordersByDate.set(date, (ordersByDate.get(date) || 0) + 1)
    })

    // Convert to chart data format
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      chartData.push({
        date: dateStr,
        revenue: revenueByDate.get(dateStr) || 0,
        orders: ordersByDate.get(dateStr) || 0,
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }

    // Top selling items
    const itemSales = new Map<string, { name: string, quantity: number, revenue: number }>()
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.menuItem.name
        const existing = itemSales.get(key) || { name: key, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.quantity * item.menuItem.price
        itemSales.set(key, existing)
      })
    })

    const topItems = Array.from(itemSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Customer distribution
    const customerOrders = new Map<string, number>()
    orders.forEach(order => {
      const customerName = `${order.customer.user.firstName} ${order.customer.user.lastName}`
      customerOrders.set(customerName, (customerOrders.get(customerName) || 0) + 1)
    })

    const topCustomers = Array.from(customerOrders.entries())
      .map(([name, orderCount]) => ({ name, orders: orderCount }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5)

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        ownerName: `${restaurant.user.firstName} ${restaurant.user.lastName}`,
        ownerEmail: restaurant.user.email,
        memberSince: restaurant.user.createdAt,
        currentBalance: restaurant.user.balance
      },
      analytics: {
        totalOrders,
        totalRevenue,
        completedOrders,
        averageOrderValue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      },
      chartData,
      topItems,
      topCustomers,
      recentOrders: orders.slice(0, 10), // Last 10 orders
      menuItemsCount: restaurant.menuItems.length
    })

  } catch (error) {
    console.error('Error fetching restaurant analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
} 