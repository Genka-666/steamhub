const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding initial streaming database...');

  // Clean existing
  await prisma.watchProgress.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.title.deleteMany();

  // 1. Cyberpunk Movie
  await prisma.title.create({
    data: {
      id: 'movie-cyberpunk-2099',
      slug: 'cyberpunk-neon-city',
      title: 'Cyberpunk: Neon City',
      type: 'movie',
      synopsis:
        'In a rain-drenched megalopolis run by rogue syndicates, a rogue memory-hunter uncovers a synthetic consciousness capable of resetting the entire global power grid.',
      releaseYear: 2024,
      rating: '18+',
      qualityBadge: '4K Ultra HD',
      audioBadge: 'Dolby Atmos',
      matchScore: 99,
      duration: '2h 18m',
      genres: JSON.stringify(['Sci-Fi', 'Cyberpunk', 'Action', 'Thriller']),
      cast: JSON.stringify(['Elena Rostova', 'Kenji Sato', 'Marcus Vance']),
      director: 'Denis Villeneuve-inspired',
      posterUrl:
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      introStart: 5,
      introEnd: 15,
    },
  });

  // 2. Anime Series with Playlist of Episodes
  const animeTitle = await prisma.title.create({
    data: {
      id: 'series-blade-destiny',
      slug: 'blade-of-destiny',
      title: 'Blade of Destiny: Shinigami Chronicles',
      type: 'anime',
      synopsis:
        'After an eclipse shatters the spiritual barrier, an outcast swordsman inherits the cursed spirit of a dragon sovereign to defend the last human sanctuary.',
      releaseYear: 2024,
      rating: '16+',
      qualityBadge: '1080p HD',
      audioBadge: '5.1 Surround',
      matchScore: 97,
      genres: JSON.stringify(['Anime', 'Action', 'Dark Fantasy', 'Supernatural']),
      cast: JSON.stringify(['Hiroshi Kamiya', 'Rie Takahashi', 'Yuki Kaji']),
      director: 'Makoto Shinkai Stylized Works',
      posterUrl:
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
      backdropUrl:
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    },
  });

  const animeSeason = await prisma.season.create({
    data: {
      seasonNumber: 1,
      title: 'Season 1: Blood Moon Awakening',
      titleId: animeTitle.id,
    },
  });

  await prisma.episode.createMany({
    data: [
      {
        id: 'blade-s1-e1',
        titleId: animeTitle.id,
        seasonId: animeSeason.id,
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Episode 1: The Shattered Eclipse',
        synopsis: 'Ren discovers a forbidden blade embedded inside the hollow cavern.',
        duration: 1420,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=480&q=80',
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        introStart: 10,
        introEnd: 25,
      },
      {
        id: 'blade-s1-e2',
        titleId: animeTitle.id,
        seasonId: animeSeason.id,
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'Episode 2: Path of the Dragon Flame',
        synopsis: 'Pursued by demonic hunters, Ren unleashes the flame stance.',
        duration: 1380,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=80',
        videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        introStart: 8,
        introEnd: 22,
      },
    ],
  });

  console.log('✅ SQLite database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

