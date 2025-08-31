import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Check if this order has already been rated
    const existingRating = await prisma.rating.findFirst({
      where: {
        orderId: orderId,
        userId: parseInt(session.user.id)
      }
    });

    return NextResponse.json({
      hasRated: !!existingRating,
      rating: existingRating ? {
        id: existingRating.id,
        rating: existingRating.rating,
        comment: existingRating.comment,
        createdAt: existingRating.createdAt
      } : null
    });

  } catch (error) {
    console.error('Error checking rating:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
