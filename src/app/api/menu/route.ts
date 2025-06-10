import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/menu?restaurantId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId')

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: parseInt(restaurantId)
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      menuItems
    })

  } catch (error) {
    console.error('Error fetching menu items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    )
  }
}

// POST /api/menu - Create new menu item
export async function POST(request: NextRequest) {
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
      description,
      price,
      category,
      imageUrl,
      restaurantId
    } = body

    // Validate required fields
    if (!name || !price || !category || !restaurantId) {
      return NextResponse.json(
        { error: 'Name, price, category, and restaurant ID are required' },
        { status: 400 }
      )
    }

    // Verify the restaurant belongs to the current user
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) }
    })

    if (!restaurant || restaurant.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Restaurant not found or unauthorized' },
        { status: 404 }
      )
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        restaurantId: parseInt(restaurantId)
      }
    })

    return NextResponse.json({
      success: true,
      menuItem
    })

  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

// PUT /api/menu - Update menu item
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.userType !== 'RESTAURANT' && session.user.userType !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      price,
      category,
      imageUrl,
      restaurantId
    } = body

    // Validate required fields
    if (!id || !name || !price || !category) {
      return NextResponse.json(
        { error: 'ID, name, price, and category are required' },
        { status: 400 }
      )
    }

    // Get the menu item to verify ownership
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: { restaurant: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Verify ownership (restaurant owner or admin)
    if (session.user.userType === 'RESTAURANT' && 
        existingItem.restaurant.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        ...(imageUrl && { imageUrl })
      }
    })

    return NextResponse.json({
      success: true,
      menuItem
    })

  } catch (error) {
    console.error('Error updating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE /api/menu - Delete menu item
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.userType !== 'RESTAURANT' && session.user.userType !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    // Get the menu item to verify ownership
    const existingItem = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: { restaurant: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      )
    }

    // Verify ownership (restaurant owner or admin)
    if (session.user.userType === 'RESTAURANT' && 
        existingItem.restaurant.userId !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
} 