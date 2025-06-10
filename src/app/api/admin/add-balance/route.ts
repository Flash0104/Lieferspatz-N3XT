import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, amount, reason } = body;

    if (!userId || !amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'User ID and valid amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    // Also update restaurant balance if user is a restaurant
    if (user.userType === 'RESTAURANT') {
      await prisma.restaurant.updateMany({
        where: { userId: parseInt(userId) },
        data: {
          balance: {
            increment: amount
          }
        }
      });
    }

    return NextResponse.json({
      message: 'Balance added successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        previousBalance: user.balance,
        newBalance: updatedUser.balance,
        amountAdded: amount,
        reason: reason || 'Admin balance adjustment'
      }
    });

  } catch (error) {
    console.error('Error adding balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 