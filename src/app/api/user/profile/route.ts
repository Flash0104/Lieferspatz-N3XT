import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, location, postalCode, address, userId } = body;
    
    console.log('Profile update request:', { userId, firstName, lastName, email, location, postalCode });
    
    if (!userId) {
      console.log('No userId provided in request body');
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(userId)
      },
      data: {
        firstName,
        lastName,
        email,
        location,
        postalCode
      },
      include: {
        customer: true
      }
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        location: updatedUser.location,
        postalCode: updatedUser.postalCode
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
