import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'RESTAURANT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: parseInt(session.user.id) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            balance: true
          }
        },
        menuItems: {
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        },
        _count: {
          select: {
            orders: true,
            ratings: true
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

    console.log('API returning restaurant data:', {
      id: restaurant.id,
      name: restaurant.name,
      imageUrl: restaurant.imageUrl,
      hasImageUrl: !!restaurant.imageUrl
    })

    return NextResponse.json({
      success: true,
      restaurant
    })

  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.userType !== 'RESTAURANT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      address,
      city,
      description,
      isOpen,
      averagePrepTime
    } = body

    const restaurant = await prisma.restaurant.update({
      where: { userId: parseInt(session.user.id) },
      data: {
        name,
        address,
        city,
        description,
        isOpen,
        averagePrepTime
      }
    })

    return NextResponse.json({
      success: true,
      restaurant
    })

  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
} 