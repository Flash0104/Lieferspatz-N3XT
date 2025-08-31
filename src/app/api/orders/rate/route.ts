import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, rating, comment } = await request.json();

    // Validate input
    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Invalid input. Order ID and rating (1-5) are required.' 
      }, { status: 400 });
    }

    // Verify that the order belongs to the current user
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: parseInt(session.user.id)
      },
      include: {
        restaurant: true
      }
    });

    if (!order) {
      return NextResponse.json({ 
        error: 'Order not found or access denied' 
      }, { status: 404 });
    }

    // Check if order is delivered (only allow rating after delivery)
    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ 
        error: 'Can only rate delivered orders' 
      }, { status: 400 });
    }

    // Check if rating already exists for this order
    const existingRating = await prisma.rating.findFirst({
      where: {
        orderId: parseInt(orderId),
        userId: parseInt(session.user.id)
      }
    });

    if (existingRating) {
      return NextResponse.json({ 
        error: 'Rating already exists for this order' 
      }, { status: 400 });
    }

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        orderId: parseInt(orderId),
        userId: parseInt(session.user.id),
        restaurantId: order.restaurantId
      }
    });

    // Update restaurant's average rating
    const ratings = await prisma.rating.findMany({
      where: {
        restaurantId: order.restaurantId
      },
      select: {
        rating: true
      }
    });

    const totalRatings = ratings.length;
    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    await prisma.restaurant.update({
      where: {
        id: order.restaurantId
      },
      data: {
        rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
      }
    });

    console.log(`✅ Rating saved: ${rating}/5 for order ${orderId}, restaurant ${order.restaurant.name}`);
    console.log(`📊 Restaurant ${order.restaurant.name} new average: ${averageRating.toFixed(1)} (${totalRatings} ratings)`);

    return NextResponse.json({ 
      success: true,
      rating: newRating,
      restaurantAverageRating: Math.round(averageRating * 10) / 10
    });

  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ 
      error: 'Failed to save rating' 
    }, { status: 500 });
  }
}