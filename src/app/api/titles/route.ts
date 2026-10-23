import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const tokenHeader = request.headers.get('x-admin-token');
  
  // Accept Bearer admin123 or x-admin-token: admin123
  if (tokenHeader === ADMIN_SECRET) return true;
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === ADMIN_SECRET) return true;
  return false;
}

// GET /api/titles - Public: Anyone (viewers & guests) can fetch catalog titles
export async function GET() {
  try {
    let titles = await prisma.title.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed if database is empty (e.g. freshly initialized on Vercel)
    if (titles.length === 0) {
      try {
        const op = await prisma.title.create({
          data: {
            title: 'One Piece',
            slug: 'one-piece',
            type: 'anime',
            synopsis:
              'In this premiere, a young pirate named Monkey D. Luffy emerges from a barrel on a ship under attack and befriends a timid captive named Koby. Luffy uses his rubber powers to defeat the cruel pirate captain Alvida, freeing Koby and officially launching his grand journey to find the legendary One Piece treasure.',
            releaseYear: 2024,
            rating: '16+',
            qualityBadge: '4K Ultra HD',
            audioBadge: '5.1 Surround',
            matchScore: 99,
            genres: JSON.stringify(['Anime', 'Action', 'Adventure']),
            cast: JSON.stringify(['Monkey D. Luffy', 'Roronoa Zoro', 'Nami']),
            director: 'Toei Animation',
            posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
            clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            introStart: 0,
            introEnd: 15,
          },
        });

        const opSeason = await prisma.season.create({
          data: {
            seasonNumber: 1,
            title: 'Season 1: East Blue',
            titleId: op.id,
          },
        });

        await prisma.episode.createMany({
          data: [
            {
              titleId: op.id,
              seasonId: opSeason.id,
              seasonNumber: 1,
              episodeNumber: 1,
              title: "I'm Luffy! The Man Who Will Become the Pirate King!",
              synopsis: 'Luffy meets Koby and takes on the pirate Iron Mace Alvida.',
              duration: 1420,
              thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
              videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            },
            {
              titleId: op.id,
              seasonId: opSeason.id,
              seasonNumber: 1,
              episodeNumber: 2,
              title: 'Enter the Great Swordsman! Pirate Hunter Roronoa Zoro!',
              synopsis: 'Luffy and Koby arrive at Shells Town to recruit the legendary Zoro.',
              duration: 1380,
              thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
              videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
            },
          ],
        });

        const movie = await prisma.title.create({
          data: {
            title: 'Cyberpunk: Neon City',
            slug: 'cyberpunk-neon-city',
            type: 'movie',
            synopsis:
              'In a rain-drenched megalopolis run by rogue syndicates, a rogue memory-hunter uncovers a synthetic consciousness capable of resetting the entire global power grid.',
            releaseYear: 2024,
            rating: '18+',
            qualityBadge: '4K Ultra HD',
            audioBadge: 'Dolby Atmos',
            matchScore: 98,
            duration: '2h 18m',
            genres: JSON.stringify(['Sci-Fi', 'Cyberpunk', 'Action']),
            cast: JSON.stringify(['Elena Rostova', 'Kenji Sato', 'Marcus Vance']),
            director: 'StreamHub Watcher Originals',
            posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
            backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            clipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            introStart: 5,
            introEnd: 15,
          },
        });

        titles = await prisma.title.findMany({
          include: {
            seasons: { include: { episodes: { orderBy: { episodeNumber: 'asc' } } }, orderBy: { seasonNumber: 'asc' } },
            episodes: { orderBy: { episodeNumber: 'asc' } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (seedErr) {
        console.error('Auto-seed fallback error:', seedErr);
      }
    }

    const formatted = titles.map((t) => ({
      ...t,
      genres: JSON.parse(t.genres || '[]'),
      cast: JSON.parse(t.cast || '[]'),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to fetch titles:', error);
    return NextResponse.json({ error: 'Failed to fetch titles' }, { status: 500 });
  }
}

// POST /api/titles - RESTRICTED: Only Admin can create movies or anime
export async function POST(request: Request) {
  // Security Gate: Reject unauthorized viewers
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Forbidden: Admin authorization required to add titles.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      type = 'movie', // 'movie' | 'series' | 'anime'
      synopsis,
      releaseYear = 2024,
      rating = '16+',
      qualityBadge = '4K Ultra HD',
      audioBadge = '5.1 Surround',
      genres = ['Action'],
      cast = ['Cast Member'],
      director = 'Director',
      posterUrl,
      backdropUrl,
      videoUrl,
      clipUrl,
      introStart = 0,
      introEnd = 0,
      episodes = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const fallbackPoster =
      posterUrl ||
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80';
    const fallbackBackdrop =
      backdropUrl ||
      posterUrl ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';

    const newTitle = await prisma.title.create({
      data: {
        title,
        slug,
        type,
        synopsis: synopsis || `Experience ${title} streaming in high definition.`,
        releaseYear: Number(releaseYear) || 2024,
        rating,
        qualityBadge,
        audioBadge,
        genres: JSON.stringify(Array.isArray(genres) ? genres : [genres]),
        cast: JSON.stringify(Array.isArray(cast) ? cast : [cast]),
        director,
        posterUrl: fallbackPoster,
        backdropUrl: fallbackBackdrop,
        videoUrl: videoUrl || null,
        clipUrl: clipUrl || null,
        introStart: Number(introStart) || 0,
        introEnd: Number(introEnd) || 0,
      },
    });

    if ((type === 'series' || type === 'anime') && episodes.length > 0) {
      const season = await prisma.season.create({
        data: {
          seasonNumber: 1,
          title: 'Season 1',
          titleId: newTitle.id,
        },
      });

      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        await prisma.episode.create({
          data: {
            titleId: newTitle.id,
            seasonId: season.id,
            seasonNumber: 1,
            episodeNumber: i + 1,
            title: ep.title || `Episode ${i + 1}`,
            synopsis: ep.synopsis || `Episode ${i + 1} of ${title}`,
            duration: Number(ep.duration) || 1200,
            thumbnailUrl: ep.thumbnailUrl || fallbackBackdrop,
            videoUrl: ep.videoUrl || videoUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            introStart: Number(ep.introStart) || 0,
            introEnd: Number(ep.introEnd) || 0,
          },
        });
      }
    }

    return NextResponse.json(newTitle, { status: 201 });
  } catch (error) {
    console.error('Failed to create title:', error);
    return NextResponse.json({ error: 'Failed to create title' }, { status: 500 });
  }
}
