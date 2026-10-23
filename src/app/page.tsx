'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import ContentCard from '@/components/ContentCard';
import TitleDetailModal from '@/components/TitleDetailModal';
import { useWatch } from '@/context/WatchContext';
import { Search, Clapperboard, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { titles, loadingTitles, searchQuery, watchlist, watchProgress, currentProfile, selectedHeroTitle } = useWatch();

  // Featured Hero title (selected title or first movie/anime in database)
  const featuredTitle = selectedHeroTitle || titles[0];

  // Continue watching items
  const continueWatchingTitles = titles.filter((t) => {
    return Object.keys(watchProgress).some((k) => k.startsWith(t.id));
  });

  // Category filters
  const animeTitles = titles.filter(
    (t) => t.type === 'anime' || t.genres.some((g) => ['Anime', 'Animation'].includes(g))
  );

  const movieTitles = titles.filter((t) => t.type === 'movie');

  const seriesTitles = titles.filter((t) => t.type === 'series');

  const myWatchlistTitles = titles.filter((t) => watchlist.includes(t.id));

  // Search results
  const searchResults = searchQuery.trim()
    ? titles.filter((t) => {
        const query = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(query) ||
          t.genres.some((g) => g.toLowerCase().includes(query)) ||
          t.cast.some((c) => c.toLowerCase().includes(query)) ||
          t.synopsis.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      <Navbar />

      {loadingTitles && titles.length === 0 ? (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-gray-400 font-mono">Loading movies and anime...</p>
        </div>
      ) : titles.length === 0 ? (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-6 text-center">
          <Clapperboard className="w-16 h-16 text-zinc-700 mb-4" />
          <h2 className="text-2xl font-black mb-2">No Content Available Yet</h2>
          <p className="text-sm text-gray-400 max-w-md mb-6">
            The catalog is waiting for the administrator to add videos.
          </p>
          <Link
            href="/admin"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-xl transition-all"
          >
            Go to Admin Portal
          </Link>
        </div>
      ) : searchQuery.trim() ? (
        <main className="pt-24 px-4 md:px-12 min-h-[80vh]">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-red-500" />
            <h1 className="text-xl md:text-2xl font-bold">
              Results for &quot;<span className="text-red-400">{searchQuery}</span>&quot;
            </h1>
            <span className="text-xs text-gray-500 font-medium">({searchResults.length} found)</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center">
              <Clapperboard className="w-12 h-12 mb-3 stroke-1 text-zinc-700" />
              <p className="text-base font-semibold text-gray-300">No matching titles found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((item) => (
                <ContentCard key={item.id} title={item} />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main>
          {/* Billboard Banner */}
          {featuredTitle && <HeroBanner title={featuredTitle} />}

          {/* Row Carousels */}
          <div className="-mt-16 md:-mt-24 relative z-30 space-y-2">
            {/* Continue Watching Row */}
            {continueWatchingTitles.length > 0 && (
              <ContentRow
                id="continue"
                title={`Continue Watching for ${currentProfile.name}`}
                badge="In Progress"
                items={continueWatchingTitles}
                showProgress={true}
              />
            )}

            {/* Trending Now */}
            <ContentRow
              id="trending"
              title="Trending Now"
              badge="Top Picks"
              items={titles}
            />

            {/* Anime Epics */}
            {animeTitles.length > 0 && (
              <ContentRow
                id="anime"
                title="Anime & Video Playlists"
                badge="Episodes"
                items={animeTitles}
              />
            )}

            {/* Feature Movies */}
            {movieTitles.length > 0 && (
              <ContentRow
                id="movies"
                title="Blockbuster Movies"
                badge="Feature Films"
                items={movieTitles}
              />
            )}

            {/* TV Series */}
            {seriesTitles.length > 0 && (
              <ContentRow
                id="series"
                title="TV Series"
                badge="Seasons"
                items={seriesTitles}
              />
            )}

            {/* User Watchlist */}
            {myWatchlistTitles.length > 0 && (
              <ContentRow
                id="watchlist"
                title="My List"
                items={myWatchlistTitles}
              />
            )}
          </div>
        </main>
      )}

      {/* Title Details Modal */}
      <TitleDetailModal />

      {/* Sleek Footer */}
      <footer className="border-t border-zinc-900 mt-20 py-10 px-4 md:px-12 bg-zinc-950 text-gray-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tighter text-white">STREAMHUB</span>
            <span className="text-[10px] text-gray-400">Adaptive Bitrate Streaming</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span>4K Ultra HD</span>
            <span>Dolby 5.1</span>
            <span>Zero Egress CDN</span>
            <Link href="/admin" className="text-amber-400/80 hover:text-amber-300 transition-colors">
              Admin Portal
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Role-Based Access Control Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
