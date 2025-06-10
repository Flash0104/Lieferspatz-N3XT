import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const type: string | null = data.get('type') as string; // 'profile', 'restaurant', 'menu'
    const entityId: string | null = data.get('entityId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    if (!type || !['profile', 'restaurant', 'menu'].includes(type)) {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${type}_${session.user.id}_${timestamp}.${fileExtension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    const filePath = join(uploadDir, fileName);

    // Create directory if it doesn't exist
    await writeFile(filePath, buffer).catch(async (error) => {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist, create it
        const { mkdir } = await import('fs/promises');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
      } else {
        throw error;
      }
    });

    const publicUrl = `/uploads/${type}/${fileName}`;

    // Update database based on type
    let updateResult;
    if (type === 'profile') {
      updateResult = await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: { profilePicture: publicUrl }
      });
    } else if (type === 'restaurant' && entityId) {
      // Verify user owns this restaurant
      const restaurant = await prisma.restaurant.findFirst({
        where: { 
          id: parseInt(entityId),
          userId: parseInt(session.user.id)
        }
      });
      
      if (!restaurant && session.user.userType !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      updateResult = await prisma.restaurant.update({
        where: { id: parseInt(entityId) },
        data: { imageUrl: publicUrl }
      });
    } else if (type === 'menu' && entityId) {
      // Verify user owns the restaurant that owns this menu item
      const menuItem = await prisma.menuItem.findFirst({
        where: { id: parseInt(entityId) },
        include: { restaurant: true }
      });
      
      if (!menuItem || (menuItem.restaurant.userId !== parseInt(session.user.id) && session.user.userType !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      updateResult = await prisma.menuItem.update({
        where: { id: parseInt(entityId) },
        data: { imageUrl: publicUrl }
      });
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: publicUrl,
      type,
      entityId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 