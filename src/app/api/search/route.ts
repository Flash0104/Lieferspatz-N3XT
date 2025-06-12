import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        restaurants: [],
        message: 'Please enter at least 2 characters to search'
      })
    }

    // Get user session to determine their city for relevance scoring
    const session = await getServerSession(authOptions)
    let userCity = null
    
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        select: { city: true }
      })
      userCity = user?.city
    }

    // Create search terms for different types of searches
    const searchTerm = `%${query.toLowerCase()}%`
    
    // Search across multiple fields with relevance scoring
    const restaurants = await prisma.restaurant.findMany({
      where: {
        AND: [
          { city: { not: null } },
          { streetName: { not: null } },
          { blockNumber: { not: null } },
          {
            OR: [
              // Direct restaurant name match
              { name: { contains: query, mode: 'insensitive' } },
              // City match
              { city: { contains: query, mode: 'insensitive' } },
              // Description match
              { description: { contains: query, mode: 'insensitive' } },
              // Menu items match (food names or categories)
              {
                menuItems: {
                  some: {
                    OR: [
                      { name: { contains: query, mode: 'insensitive' } },
                      { category: { contains: query, mode: 'insensitive' } },
                      { description: { contains: query, mode: 'insensitive' } }
                    ]
                  }
                }
              }
            ]
          }
        ]
      },
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
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            description: true
          }
        }
      }
    })

    // Calculate relevance score and add matched items info
    const restaurantsWithRelevance = restaurants.map(restaurant => {
      let relevanceScore = 0
      let matchedItems: any[] = []
      let matchType = ''

      // Restaurant name match (highest priority)
      if (restaurant.name.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 100
        matchType = 'restaurant'
      }

      // City match (high priority)
      if (restaurant.city?.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 80
        if (!matchType) matchType = 'city'
      }

      // Same city as user (bonus points)
      if (userCity && restaurant.city === userCity) {
        relevanceScore += 20
      }

      // Description match
      if (restaurant.description?.toLowerCase().includes(query.toLowerCase())) {
        relevanceScore += 30
        if (!matchType) matchType = 'description'
      }

      // Menu items match
      if (restaurant.menuItems.length > 0) {
        relevanceScore += restaurant.menuItems.length * 10
        matchedItems = restaurant.menuItems
        if (!matchType) matchType = 'menu'
      }

      // Open restaurants get bonus
      if (restaurant.isOpen) {
        relevanceScore += 10
      }

      // Higher rated restaurants get bonus
      relevanceScore += restaurant.rating * 2

      // Calculate average price for matched items
      const avgPrice = restaurant.menuItems.length > 0 
        ? restaurant.menuItems.reduce((sum, item) => sum + item.price, 0) / restaurant.menuItems.length
        : 0

      return {
        ...restaurant,
        relevanceScore,
        matchType,
        matchedItems,
        averagePrice: avgPrice,
        menuItems: undefined // Remove from response to keep it clean
      }
    })

    // Sort by relevance score (highest first)
    restaurantsWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Group results by match type for better presentation
    const groupedResults = {
      restaurants: restaurantsWithRelevance.filter(r => r.matchType === 'restaurant'),
      cities: restaurantsWithRelevance.filter(r => r.matchType === 'city'),
      food: restaurantsWithRelevance.filter(r => r.matchType === 'menu'),
      other: restaurantsWithRelevance.filter(r => !['restaurant', 'city', 'menu'].includes(r.matchType))
    }

    // Flatten results maintaining relevance order
    const finalResults = [
      ...groupedResults.restaurants,
      ...groupedResults.cities,
      ...groupedResults.food,
      ...groupedResults.other
    ]

    return NextResponse.json({
      restaurants: finalResults,
      query,
      totalResults: finalResults.length,
      userCity,
      groups: {
        restaurants: groupedResults.restaurants.length,
        cities: groupedResults.cities.length,
        food: groupedResults.food.length,
        other: groupedResults.other.length
      }
    })

  } catch (error) {
    console.error('Error in search:', error)
    return NextResponse.json(
      { error: 'Search failed', restaurants: [] },
      { status: 500 }
    )
  }
} 