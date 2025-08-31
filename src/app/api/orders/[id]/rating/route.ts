import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Check if rating exists for this order
    const rating = await prisma.rating.findFirst({
      where: {
        orderId: orderId,
        userId: parseInt(session.user.id)
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      hasRating: !!rating,
      rating: rating
    });

  } catch (error) {
    console.error('Error checking rating:', error);
    return NextResponse.json({ 
      error: 'Failed to check rating' 
    }, { status: 500 });
  }
}
