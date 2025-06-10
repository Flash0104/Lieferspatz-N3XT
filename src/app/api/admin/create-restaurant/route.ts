import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcryptjs from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, password, restaurantName, location, postalCode, description } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !restaurantName || !location || !postalCode) {
      return NextResponse.json(
        { error: 'All fields except description are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user and restaurant in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          userType: 'RESTAURANT',
          location,
          postalCode,
          balance: 1000.0 // Standard starting balance for all users
        }
      });

      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          address: location,
          city: location, // Use location as city for now
          description: description || '',
          isOpen: true,
          balance: 0.0,
          userId: user.id
        }
      });

      return { user, restaurant };
    });

    return NextResponse.json({
      message: 'Restaurant created successfully',
      restaurant: result.restaurant,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName
      }
    });

  } catch (error) {
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 