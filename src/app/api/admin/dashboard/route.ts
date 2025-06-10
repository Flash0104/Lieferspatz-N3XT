import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all data in parallel for maximum speed
    const [
      totalRestaurants,
      totalCustomers,
      totalOrders,
      totalEarningsResult,
      restaurants,
      users
    ] = await Promise.all([
      // Stats queries - simple counts
      prisma.restaurant.count(),
      prisma.user.count({ where: { userType: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      
      // Restaurant data - optimized query
      prisma.restaurant.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          isOpen: true,
          displayOrder: true,
          balance: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { displayOrder: 'asc' }
      }),
      
      // User data - simplified query
      prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
          balance: true,
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to 50 users for performance
      })
    ]);

    const stats = {
      totalRestaurants,
      totalCustomers,
      totalOrders,
      totalEarnings: totalEarningsResult._sum.totalPrice || 0
    };

    const transformedRestaurants = restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      isOpen: restaurant.isOpen,
      displayOrder: restaurant.displayOrder,
      balance: restaurant.balance,
      orderCount: restaurant._count.orders
    }));

    const transformedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      balance: user.balance,
      orderCount: user._count?.orders || 0
    }));

    return NextResponse.json({
      stats,
      restaurants: transformedRestaurants,
      users: transformedUsers
    }, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 