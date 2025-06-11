import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        description: true,
        imageUrl: true,
        isOpen: true,
        rating: true,
        balance: true,
        displayOrder: true,
        averagePrepTime: true,
        _count: {
          select: {
            orders: true,
            ratings: true
          }
        }
      },
      orderBy: [
        { isOpen: 'desc' }, // Open restaurants first
        { displayOrder: 'asc' },
        { rating: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      restaurants
    })

  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      address,
      city,
      description,
      imageUrl,
      userId
    } = body

    // Validate required fields
    if (!name || !address || !city || !userId) {
      return NextResponse.json(
        { error: 'Name, address, city, and userId are required' },
        { status: 400 }
      )
    }

    // Check if user exists and is a restaurant
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.userType !== 'RESTAURANT') {
      return NextResponse.json(
        { error: 'User not found or not a restaurant' },
        { status: 400 }
      )
    }

    // Check if restaurant already exists for this user
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { userId }
    })

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant already exists for this user' },
        { status: 400 }
      )
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        userId,
        name,
        address,
        city,
        description,
        imageUrl,
        isOpen: false,
        rating: 0.0,
        balance: 0.0
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      restaurant
    })

  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    )
  }
} 