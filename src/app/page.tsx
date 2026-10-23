'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import ContentCard from '@/components/ContentCard';
import TitleDetailModal from '@/components/TitleDetailModal';
import { useWatch } from '@/context/WatchContext';
import { Search, Clapperboard, Sparkles, Tv, Film, ListPlus, Flame, Layers } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { titles, loadingTitles, searchQuery, setSearchQuery, watchlist, watchProgress, currentProfile, selectedHeroTitle } = useWatch();
  const [activeFilter, setActiveFilter] = useState<'all' | 'anime' | 'movies' | 'series' | 'watchlist'>('all');

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
    <div className="relative min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-red-600 selection:text-white">
      <Navbar />

      {loadingTitles && titles.length === 0 ? (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-xs text-zinc-400 font-mono tracking-wider">Streaming catalog loading...</p>
        </div>
      ) : titles.length === 0 ? (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5 shadow-2xl">
            <Clapperboard className="w-10 h-10 text-zinc-500" />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">Your Cinema is Ready</h2>
          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            The catalog is waiting for the administrator to upload movies, anime, or video files.
          </p>
          <Link
            href="/admin"
            className="bg-red-600 hover:bg-red-500 text-white font-bold px-7 py-3 rounded-xl text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Open Admin Control Center
          </Link>
        </div>
      ) : searchQuery.trim() ? (
        <main className="pt-24 px-4 md:px-12 min-h-[85vh]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-red-500" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Search Results for &quot;<span className="text-red-400">{searchQuery}</span>&quot;
              </h1>
              <span className="text-xs text-zinc-500 font-medium font-mono">({searchResults.length} found)</span>
            </div>

            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center">
              <Clapperboard className="w-12 h-12 mb-3 stroke-1 text-zinc-700" />
              <p className="text-base font-semibold text-zinc-300">No matching titles or anime found</p>
              <p className="text-xs text-zinc-500 mt-1">Try searching by title name, genre, or director.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
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

          {/* Category Filter Pills Bar */}
          <div className="px-4 md:px-12 -mt-8 md:-mt-12 relative z-30 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                activeFilter === 'all'
                  ? 'bg-white text-black scale-105'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Titles</span>
            </button>

            <button
              onClick={() => setActiveFilter('anime')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                activeFilter === 'anime'
                  ? 'bg-rose-600 text-white scale-105 shadow-rose-600/30'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Anime & Series</span>
              <span className="text-[10px] opacity-70">({animeTitles.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('movies')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                activeFilter === 'movies'
                  ? 'bg-cyan-600 text-white scale-105 shadow-cyan-600/30'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
              <span className="text-[10px] opacity-70">({movieTitles.length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('watchlist')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                activeFilter === 'watchlist'
                  ? 'bg-emerald-600 text-white scale-105 shadow-emerald-600/30'
                  : 'bg-zinc-950/70 text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-900'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>My List</span>
              <span className="text-[10px] opacity-70">({myWatchlistTitles.length})</span>
            </button>
          </div>

          {/* Row Carousels */}
          <div className="relative z-30 space-y-2">
            {/* Continue Watching Row (Always shown if progress exists) */}
            {continueWatchingTitles.length > 0 && activeFilter === 'all' && (
              <ContentRow
                id="continue"
                title={`Continue Watching for ${currentProfile.name}`}
                badge="In Progress"
                items={continueWatchingTitles}
                showProgress={true}
              />
            )}

            {/* Trending Now */}
            {(activeFilter === 'all' || activeFilter === 'movies') && (
              <ContentRow
                id="trending"
                title="Trending & Recommended"
                badge="Top Picks"
                items={titles}
              />
            )}

            {/* Anime Epics */}
            {(activeFilter === 'all' || activeFilter === 'anime') && animeTitles.length > 0 && (
              <ContentRow
                id="anime"
                title="Anime & Video Playlists"
                badge="Episodes"
                items={animeTitles}
              />
            )}

            {/* Feature Movies */}
            {(activeFilter === 'all' || activeFilter === 'movies') && movieTitles.length > 0 && (
              <ContentRow
                id="movies"
                title="Blockbuster Movies"
                badge="Feature Films"
                items={movieTitles}
              />
            )}

            {/* TV Series */}
            {(activeFilter === 'all' || activeFilter === 'anime' || activeFilter === 'series') && seriesTitles.length > 0 && (
              <ContentRow
                id="series"
                title="TV Series & Dramas"
                badge="Seasons"
                items={seriesTitles}
              />
            )}

            {/* User Watchlist */}
            {(activeFilter === 'all' || activeFilter === 'watchlist') && myWatchlistTitles.length > 0 && (
              <ContentRow
                id="watchlist"
                title="My List"
                badge="Saved"
                items={myWatchlistTitles}
              />
            )}
          </div>
        </main>
      )}

      {/* Title Details Modal */}
      <TitleDetailModal />

      {/* Modern Industry Standard Streaming Footer */}
      <footer className="border-t border-white/[0.08] mt-24 py-12 px-4 md:px-12 bg-zinc-950 text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center font-black text-white text-xs">
              S
            </div>
            <span className="text-base font-black tracking-tight text-white">STREAMHUB</span>
            <span className="text-[11px] text-zinc-500">Ultra-Low Latency Streaming</span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-zinc-400 flex-wrap justify-center">
            <span className="hover:text-zinc-200 transition-colors">4K Ultra HD</span>
            <span className="hover:text-zinc-200 transition-colors">Dolby Atmos</span>
            <span className="hover:text-zinc-200 transition-colors">HLS Adaptive Streaming</span>
            <span className="hover:text-zinc-200 transition-colors">Local MP4 Zero-Transcode</span>
            <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
              Admin Portal
            </Link>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>SQLite Powered RBAC Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
