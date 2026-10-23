import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const tokenHeader = request.headers.get('x-admin-token');
  
  if (tokenHeader === ADMIN_SECRET) return true;
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === ADMIN_SECRET) return true;
  return false;
}

// GET /api/titles/[id] - Public: Anyone can fetch a specific movie or episode
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const title = await prisma.title.findUnique({
      where: { id },
      include: {
        seasons: {
          include: {
            episodes: {
              orderBy: { episodeNumber: 'asc' },
            },
          },
          orderBy: { seasonNumber: 'asc' },
        },
        episodes: {
          orderBy: { episodeNumber: 'asc' },
        },
      },
    });

    if (!title) {
      return NextResponse.json({ error: 'Title not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...title,
      genres: JSON.parse(title.genres || '[]'),
      cast: JSON.parse(title.cast || '[]'),
    });
  } catch (error) {
    console.error('Failed to get title:', error);
    return NextResponse.json({ error: 'Failed to get title' }, { status: 500 });
  }
}

// DELETE /api/titles/[id] - RESTRICTED: Only Admin can delete titles
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin authorization required to delete titles.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    await prisma.title.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Title deleted successfully' });
  } catch (error) {
    console.error('Failed to delete title:', error);
    return NextResponse.json({ error: 'Failed to delete title' }, { status: 500 });
  }
}
