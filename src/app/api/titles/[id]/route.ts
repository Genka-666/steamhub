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

// PUT /api/titles/[id] - RESTRICTED: Admin can edit details and add/modify episodes
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin authorization required to edit titles.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      type,
      synopsis,
      releaseYear,
      rating,
      qualityBadge,
      genres,
      posterUrl,
      backdropUrl,
      videoUrl,
      clipUrl,
      episodes = [], // Array of { id?, title, videoUrl, duration, episodeNumber }
    } = body;

    // 1. Update Title Metadata
    const updatedTitle = await prisma.title.update({
      where: { id },
      data: {
        title: title || undefined,
        type: type || undefined,
        synopsis: synopsis !== undefined ? synopsis : undefined,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        rating: rating || undefined,
        qualityBadge: qualityBadge || undefined,
        genres: genres ? JSON.stringify(Array.isArray(genres) ? genres : [genres]) : undefined,
        posterUrl: posterUrl || undefined,
        backdropUrl: backdropUrl || undefined,
        videoUrl: videoUrl !== undefined ? videoUrl : undefined,
        clipUrl: clipUrl !== undefined ? clipUrl : undefined,
      },
    });

    // 2. If Series or Anime, update/create episodes
    if (episodes && Array.isArray(episodes)) {
      // Find or create Season 1
      let season = await prisma.season.findFirst({
        where: { titleId: id },
      });

      if (!season) {
        season = await prisma.season.create({
          data: {
            titleId: id,
            seasonNumber: 1,
            title: 'Season 1',
          },
        });
      }

      // Existing episode IDs in DB
      const existingDbEpisodes = await prisma.episode.findMany({
        where: { titleId: id },
        select: { id: true },
      });
      const incomingIds = episodes.filter((ep: any) => ep.id).map((ep: any) => ep.id);

      // Remove episodes that were deleted by admin
      const toDelete = existingDbEpisodes.filter((ep) => !incomingIds.includes(ep.id));
      if (toDelete.length > 0) {
        await prisma.episode.deleteMany({
          where: { id: { in: toDelete.map((e) => e.id) } },
        });
      }

      // Upsert/Create each episode
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const epNumber = i + 1;
        const epTitle = ep.title || `Episode ${epNumber}`;
        const epVideoUrl = ep.videoUrl || '';
        const epDuration = Number(ep.duration) || 1200;
        const epThumb = ep.thumbnailUrl || backdropUrl || posterUrl || '';

        if (ep.id) {
          // Update existing episode
          await prisma.episode.update({
            where: { id: ep.id },
            data: {
              title: epTitle,
              episodeNumber: epNumber,
              videoUrl: epVideoUrl,
              duration: epDuration,
              thumbnailUrl: epThumb,
            },
          });
        } else {
          // Create new episode
          await prisma.episode.create({
            data: {
              titleId: id,
              seasonId: season.id,
              seasonNumber: 1,
              episodeNumber: epNumber,
              title: epTitle,
              synopsis: ep.synopsis || `Episode ${epNumber} of ${title || updatedTitle.title}`,
              videoUrl: epVideoUrl,
              duration: epDuration,
              thumbnailUrl: epThumb,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Title and episodes updated successfully',
      title: updatedTitle,
    });
  } catch (error: any) {
    console.error('Failed to update title:', error);
    return NextResponse.json({ error: error.message || 'Failed to update title' }, { status: 500 });
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
