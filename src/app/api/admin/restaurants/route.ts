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

    const restaurants = await prisma.restaurant.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            balance: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Transform data to match the expected format
    const transformedRestaurants = restaurants.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      isOpen: restaurant.isOpen,
      displayOrder: restaurant.displayOrder,
      balance: restaurant.balance,
      orderCount: restaurant._count.orders
    }));

    return NextResponse.json({
      restaurants: transformedRestaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(id);

    // Delete restaurant and associated user in transaction
    await prisma.$transaction(async (tx) => {
      // Get restaurant to find associated user
      const restaurant = await tx.restaurant.findUnique({
        where: { id: restaurantId },
        include: { user: true }
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }

      // Delete restaurant (will cascade delete menu items, etc.)
      await tx.restaurant.delete({
        where: { id: restaurantId }
      });

      // Delete the associated user
      await tx.user.delete({
        where: { id: restaurant.userId }
      });
    });

    return NextResponse.json({
      message: 'Restaurant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
} 