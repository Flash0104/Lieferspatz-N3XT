import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderId, rating, comment } = await request.json()

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data' },
        { status: 400 }
      )
    }

    // Verify the order exists and belongs to the customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: parseInt(session.user.id),
        status: 'DELIVERED'
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not delivered' },
        { status: 404 }
      )
    }

    // Check if rating already exists
    const existingRating = await prisma.rating.findUnique({
      where: { orderId: orderId }
    })

    if (existingRating) {
      return NextResponse.json(
        { error: 'Order already rated' },
        { status: 400 }
      )
    }

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        userId: parseInt(session.user.id),
        restaurantId: order.restaurantId,
        orderId: orderId,
        rating: parseFloat(rating),
        comment: comment || null
      }
    })

    // Update restaurant's average rating
    const restaurantRatings = await prisma.rating.findMany({
      where: { restaurantId: order.restaurantId }
    })

    const averageRating = restaurantRatings.reduce((sum, r) => sum + r.rating, 0) / restaurantRatings.length

    await prisma.restaurant.update({
      where: { id: order.restaurantId },
      data: { rating: averageRating }
    })

    return NextResponse.json({
      success: true,
      rating: newRating
    })

  } catch (error) {
    console.error('Error creating rating:', error)
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    )
  }
} 