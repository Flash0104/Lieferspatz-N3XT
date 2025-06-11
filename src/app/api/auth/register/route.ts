import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      city,
      streetName,
      blockNumber,
      postalCode,
      userType
    } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !city || !streetName || !blockNumber || !userType) {
      return NextResponse.json(
        { error: 'All fields except postal code are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create full address string for backward compatibility
    const fullAddress = `${streetName} ${blockNumber}, ${city}${postalCode ? `, ${postalCode}` : ''}`

    // Create user with transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create base user with detailed address fields
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          city,
          streetName,
          blockNumber,
          postalCode: postalCode || null,
          location: fullAddress, // Keep for backward compatibility
          userType: userType.toUpperCase(),
          balance: 1000.0 // Default starting balance
        }
      })

      // Create specific user type record
      if (userType.toUpperCase() === 'CUSTOMER') {
        await tx.customer.create({
          data: {
            userId: user.id,
            address: fullAddress
          }
        })
      } else if (userType.toUpperCase() === 'RESTAURANT') {
        await tx.restaurant.create({
          data: {
            userId: user.id,
            name: `${firstName} ${lastName}`,
            address: fullAddress,
            city,
            streetName,
            blockNumber,
            postalCode: postalCode || null,
            imageUrl: '/images/default-restaurant.png',
            isOpen: false
          }
        })
      } else if (userType.toUpperCase() === 'ADMIN') {
        await tx.admin.create({
          data: {
            userId: user.id,
            totalEarnings: 0.0
          }
        })
      }

      return user
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        city: result.city,
        streetName: result.streetName,
        blockNumber: result.blockNumber,
        postalCode: result.postalCode,
        userType: result.userType
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 