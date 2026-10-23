export type MediaType = 'movie' | 'series' | 'anime';

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  synopsis: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  videoUrl: string; // .m3u8 manifest URL
  introStart?: number; // seconds
  introEnd?: number; // seconds
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface Title {
  id: string;
  slug: string;
  title: string;
  type: MediaType;
  synopsis: string;
  releaseYear: number;
  rating: string; // e.g. "TV-MA", "PG-13", "16+"
  qualityBadge: string; // e.g. "4K Ultra HD", "HD"
  audioBadge: string; // e.g. "5.1", "Dolby Atmos"
  matchScore: number; // e.g. 98 for "98% Match"
  duration?: string; // For movies e.g. "2h 14m"
  genres: string[];
  cast: string[];
  director: string;
  posterUrl: string;
  backdropUrl: string;
  trailerVideoUrl: string; // .m3u8 or mp4
  videoUrl?: string; // For movie .m3u8
  introStart?: number;
  introEnd?: number;
  seasons?: Season[];
}

export interface WatchProgress {
  titleId: string;
  episodeId?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastWatchedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export interface VideoQualityLevel {
  height: number;
  bitrate: number;
  index: number;
  label: string;
}

