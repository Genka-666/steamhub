import { Title, UserProfile } from '@/types';

export const USER_PROFILES: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Alex (Main)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    isKids: false,
  },
  {
    id: 'user-2',
    name: 'Anime Hub',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    isKids: false,
  },
  {
    id: 'user-3',
    name: 'Kids Zone',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80',
    isKids: true,
  },
];

export const MOCK_TITLES: Title[] = [
  {
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
    genres: ['Sci-Fi', 'Cyberpunk', 'Action', 'Thriller'],
    cast: ['Elena Rostova', 'Kenji Sato', 'Marcus Vance', 'Aria Chen'],
    director: 'Denis Villeneuve-inspired Studio',
    posterUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    // High-speed CDN HLS stream (Big Buck Bunny Remastered Multi-bitrate ABR)
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    trailerVideoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    introStart: 5,
    introEnd: 15,
  },
  {
    id: 'series-blade-destiny',
    slug: 'blade-of-destiny',
    title: 'Blade of Destiny: Shinigami Chronicles',
    type: 'series',
    synopsis:
      'After an eclipse shatters the spiritual barrier, an outcast swordsman inherits the cursed spirit of a dragon sovereign to defend the last human sanctuary.',
    releaseYear: 2024,
    rating: '16+',
    qualityBadge: '1080p HD',
    audioBadge: '5.1 Surround',
    matchScore: 97,
    genres: ['Anime', 'Action', 'Dark Fantasy', 'Supernatural'],
    cast: ['Hiroshi Kamiya (Voice)', 'Rie Takahashi (Voice)', 'Yuki Kaji (Voice)'],
    director: 'Makoto Shinkai Stylized Works',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80',
    trailerVideoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: The Blood Moon Awakening',
        episodes: [
          {
            id: 'blade-s1-e1',
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1: The Shattered Eclipse',
            synopsis:
              'When the lunar alignment cracks the ancient barrier, Ren discovers a forbidden blade embedded inside the hollow cavern.',
            duration: 1420,
            thumbnailUrl:
              'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=480&q=80',
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            introStart: 10,
            introEnd: 25,
          },
          {
            id: 'blade-s1-e2',
            episodeNumber: 2,
            seasonNumber: 1,
            title: 'Episode 2: Path of the Dragon Flame',
            synopsis:
              'Pursued by demonic hunters across the neon-lit forest, Ren unleashes the first forbidden stance of the flaming dragon.',
            duration: 1380,
            thumbnailUrl:
              'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=80',
            videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
            introStart: 8,
            introEnd: 22,
          },
          {
            id: 'blade-s1-e3',
            episodeNumber: 3,
            seasonNumber: 1,
            title: 'Episode 3: The Sanctuary of Whispers',
            synopsis:
              'In the ancient archives, the council debates executing Ren before the sword consumes his humanity.',
            duration: 1450,
            thumbnailUrl:
              'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=480&q=80',
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            introStart: 12,
            introEnd: 28,
          },
        ],
      },
    ],
  },
  {
    id: 'movie-interstellar-abyss',
    slug: 'interstellar-abyss',
    title: 'Interstellar Abyss: Singularity',
    type: 'movie',
    synopsis:
      'A deep space exploration vessel enters the event horizon of a primordial black hole, discovering that time and memory have folded into a sentient labyrinth.',
    releaseYear: 2023,
    rating: 'PG-13',
    qualityBadge: '4K Ultra HD',
    audioBadge: 'Dolby Atmos',
    matchScore: 95,
    duration: '2h 35m',
    genres: ['Sci-Fi', 'Space', 'Drama', 'Mystery'],
    cast: ['Matthew McConaughey tribute', 'Jessica Chastain', 'David Oyelowo'],
    director: 'Christopher Nolan Style',
    posterUrl:
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    trailerVideoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    introStart: 0,
    introEnd: 0,
  },
  {
    id: 'series-shadow-protocol',
    slug: 'shadow-protocol',
    title: 'Shadow Protocol: Blackout',
    type: 'series',
    synopsis:
      'When an unknown hacker cuts off communication across Eastern Europe, an elite tactical unit must infiltrate a subterranean bunker to prevent nuclear launch codes from leaking.',
    releaseYear: 2024,
    rating: '18+',
    qualityBadge: '4K Ultra HD',
    audioBadge: '5.1 Audio',
    matchScore: 92,
    genres: ['Action', 'Thriller', 'Military', 'Espionage'],
    cast: ['Carl Jenkins', 'Sarah Lindqvist', 'Boris Volkov'],
    director: 'Chad Stahelski Style',
    posterUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    trailerVideoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1: Zero Dark',
        episodes: [
          {
            id: 'shadow-s1-e1',
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1: Grid Failure',
            synopsis: 'A sudden total blackout leaves the central grid vulnerable to stealth breach.',
            duration: 3100,
            thumbnailUrl:
              'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=480&q=80',
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            introStart: 5,
            introEnd: 20,
          },
        ],
      },
    ],
  },
  {
    id: 'movie-sintel-saga',
    slug: 'sintel-chronicles',
    title: 'Sintel: The Dragon Quest',
    type: 'movie',
    synopsis:
      'A lonely young wanderer nurses an injured baby dragon back to health, forging an unbreakable bond that leads her on an epic cross-continental search when it is stolen.',
    releaseYear: 2023,
    rating: 'PG',
    qualityBadge: '4K HDR',
    audioBadge: 'Dolby 5.1',
    matchScore: 96,
    duration: '1h 48m',
    genres: ['Animation', 'Fantasy', 'Adventure', 'Emotional'],
    cast: ['Halina Reijn', 'Thom Hoffman'],
    director: 'Colin Levy (Blender Studio)',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    trailerVideoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    introStart: 0,
    introEnd: 0,
  },
  {
    id: 'series-tokyo-ghoul-spirit',
    slug: 'tokyo-night-stalkers',
    title: 'Tokyo Night Stalkers: Rebirth',
    type: 'series',
    synopsis:
      'In the neon alleys of Shinjuku, underground investigator Renji navigates a shadow war between cybernetically modified yakuza and ancient Yokai.',
    releaseYear: 2024,
    rating: '18+',
    qualityBadge: '4K Ultra HD',
    audioBadge: 'Stereo',
    matchScore: 98,
    genres: ['Anime', 'Supernatural', 'Crime', 'Cyberpunk'],
    cast: ['Kenjiro Tsuda', 'Mamoru Miyano', 'Kana Hanazawa'],
    director: 'MAPPA Style Animation',
    posterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1920&q=80',
    trailerVideoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    seasons: [
      {
        seasonNumber: 1,
        title: 'Season 1',
        episodes: [
          {
            id: 'tokyo-s1-e1',
            episodeNumber: 1,
            seasonNumber: 1,
            title: 'Episode 1: Blood in the Rain',
            synopsis: 'A routine cybernetics heist goes haywire when phantom claws rip through steel armor.',
            duration: 1500,
            thumbnailUrl:
              'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=480&q=80',
            videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
            introStart: 15,
            introEnd: 35,
          },
        ],
      },
    ],
  },
];

