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

    // Get statistics from database
    const [
      totalRestaurants,
      totalCustomers, 
      totalOrders,
      totalEarningsResult
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.user.count({ where: { userType: 'CUSTOMER' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalPrice: true }
      })
    ]);

    const stats = {
      totalRestaurants,
      totalCustomers,
      totalOrders,
      totalEarnings: totalEarningsResult._sum.totalPrice || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 