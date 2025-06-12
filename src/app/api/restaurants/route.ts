import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Attempting to fetch restaurants at:', new Date().toISOString())
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL)
    console.log('Cache buster: v2.0 - ' + Date.now())
    
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') // 'admin', 'rating', 'distance', 'price'
    const sortOrder = searchParams.get('sortOrder') // 'asc', 'desc'
    const cityFilter = searchParams.get('cityFilter') // 'same', 'all'
    
    // Get user session to determine their city
    const session = await getServerSession(authOptions)
    let userCity = null
    
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { city: true }
      })
      userCity = user?.city
    }
    
    // Build where clause
    let whereClause: any = {
      city: { not: null },
      streetName: { not: null },
      blockNumber: { not: null }
    }
    
    // Apply city filter (default: same city only)
    if (cityFilter !== 'all' && userCity) {
      whereClause.city = userCity
    }
    
    // Build order by clause
    let orderBy: any[] = [{ isOpen: 'desc' }] // Always show open restaurants first
    
    switch (sortBy) {
      case 'rating':
        orderBy.push({ rating: sortOrder === 'asc' ? 'asc' : 'desc' })
        break
      case 'price':
        // For price sorting, we'll need to calculate average menu item price
        // For now, we'll use a placeholder and handle this in the frontend
        orderBy.push({ displayOrder: 'asc' })
        break
      case 'distance':
        // Distance sorting will be handled in frontend with coordinates
        orderBy.push({ displayOrder: 'asc' })
        break
      case 'admin':
      default:
        // Default admin sorting
        orderBy.push({ displayOrder: 'asc' })
        orderBy.push({ rating: 'desc' })
        break
    }
    
    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        city: true,
        streetName: true,
        blockNumber: true,
        postalCode: true,
        address: true,
        description: true,
        rating: true,
        isOpen: true,
        averagePrepTime: true,
        imageUrl: true,
        displayOrder: true,
        latitude: true,
        longitude: true,
        menuItems: {
          select: {
            price: true
          }
        }
      },
      orderBy
    })

    // Calculate average price for each restaurant
    let restaurantsWithPrice = restaurants.map(restaurant => {
      const avgPrice = restaurant.menuItems.length > 0 
        ? restaurant.menuItems.reduce((sum, item) => sum + item.price, 0) / restaurant.menuItems.length
        : 0
      
      return {
        ...restaurant,
        averagePrice: avgPrice,
        menuItems: undefined // Remove menuItems from response
      }
    })

    // Apply price sorting if needed (frontend sorting for price)
    if (sortBy === 'price') {
      restaurantsWithPrice.sort((a, b) => {
        const aPrice = a.averagePrice || 0;
        const bPrice = b.averagePrice || 0;
        return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    }

    console.log(`Successfully fetched ${restaurantsWithPrice.length} restaurants`)
    return NextResponse.json({
      restaurants: restaurantsWithPrice,
      userCity,
      filters: {
        sortBy: sortBy || 'admin',
        sortOrder: sortOrder || 'asc',
        cityFilter: cityFilter || 'same'
      }
    })

  } catch (error) {
    console.error('Error fetching restaurants:', error)
    console.error('Error details:', {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    })
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