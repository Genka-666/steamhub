'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, Play, Plus, Check, ChevronDown, Volume2, VolumeX, Sparkles, Star, Clock } from 'lucide-react';
import { useWatch } from '@/context/WatchContext';

export default function TitleDetailModal() {
  const {
    activeModalTitle,
    setActiveModalTitle,
    isInWatchlist,
    toggleWatchlist,
    titles,
    setSelectedHeroTitle,
  } = useWatch();
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const clipSource = activeModalTitle?.clipUrl || (activeModalTitle?.type === 'movie' ? activeModalTitle.videoUrl : undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalTitle(null);
      }
    };
    if (activeModalTitle) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalTitle, setActiveModalTitle]);

  useEffect(() => {
    setVideoLoaded(false);
  }, [activeModalTitle?.id, clipSource]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
      if (!next) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  if (!activeModalTitle) return null;

  const inList = isInWatchlist(activeModalTitle.id);
  const currentSeasonData = activeModalTitle.seasons?.find((s) => s.seasonNumber === selectedSeason) || activeModalTitle.seasons?.[0];

  const similarTitles = titles.filter(
    (t) => t.id !== activeModalTitle.id && t.genres.some((g) => activeModalTitle.genres.includes(g))
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-200 backdrop-blur-xl">
        {/* Close Button */}
        <button
          onClick={() => setActiveModalTitle(null)}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl backdrop-blur-md"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Preview with Short Video Clip */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-zinc-900 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeModalTitle.backdropUrl || activeModalTitle.posterUrl}
            alt={activeModalTitle.title}
            className="w-full h-full object-cover"
          />

          {clipSource && (
            <video
              ref={videoRef}
              key={clipSource}
              src={clipSource}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onCanPlay={() => setVideoLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                videoLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent z-10 pointer-events-none" />

          {/* Sound Toggle */}
          {clipSource && (
            <button
              onClick={toggleSound}
              className="absolute top-4 left-4 z-30 p-2.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 text-white border border-zinc-800 transition-all backdrop-blur-md hover:scale-105 shadow-xl"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          {/* Quick Action Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link
                href={
                  (activeModalTitle.type === 'series' || activeModalTitle.type === 'anime') && currentSeasonData?.episodes[0]
                    ? `/watch?titleId=${activeModalTitle.id}&episodeId=${currentSeasonData.episodes[0].id}`
                    : `/watch?titleId=${activeModalTitle.id}`
                }
                onClick={() => setActiveModalTitle(null)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 md:px-7 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{activeModalTitle.type === 'series' || activeModalTitle.type === 'anime' ? 'Play S1:E1' : 'Play Movie'}</span>
              </Link>

              <button
                onClick={() => toggleWatchlist(activeModalTitle.id)}
                className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white border border-zinc-800 transition-all hover:scale-105 active:scale-95"
                title={inList ? 'Remove from My List' : 'Add to My List'}
              >
                {inList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedHeroTitle(activeModalTitle);
                setActiveModalTitle(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Feature on Main Billboard Display"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Feature on Hero</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                  {activeModalTitle.matchScore}% Match
                </span>
                <span className="text-zinc-400 text-xs font-medium">{activeModalTitle.releaseYear}</span>
                <span className="text-xs px-2 py-0.5 border border-zinc-800 rounded font-semibold text-zinc-300">
                  {activeModalTitle.rating}
                </span>
                <span className="text-xs px-2 py-0.5 border border-zinc-800 rounded font-semibold text-zinc-300">
                  {activeModalTitle.qualityBadge || '4K Ultra HD'}
                </span>
                {activeModalTitle.duration && (
                  <span className="text-zinc-400 text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activeModalTitle.duration}
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white">{activeModalTitle.title}</h2>
              <p className="text-zinc-300 text-sm leading-relaxed">{activeModalTitle.synopsis}</p>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-400 border-l border-zinc-800 pl-5">
              <div>
                <span className="text-zinc-500 font-semibold block text-[11px] uppercase tracking-wider">Director</span>
                <span className="text-zinc-300">{activeModalTitle.director || 'StreamHub Studio'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-semibold block text-[11px] uppercase tracking-wider">Cast</span>
                <span className="text-zinc-300">{activeModalTitle.cast?.length ? activeModalTitle.cast.join(', ') : 'Original Cast'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-semibold block text-[11px] uppercase tracking-wider">Genres</span>
                <span className="text-zinc-300">{activeModalTitle.genres?.join(', ')}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-semibold block text-[11px] uppercase tracking-wider">Format</span>
                <span className="text-emerald-400 uppercase font-bold">{activeModalTitle.type}</span>
              </div>
            </div>
          </div>

          {/* Episodes List (For Series / Anime) */}
          {(activeModalTitle.type === 'series' || activeModalTitle.type === 'anime') && activeModalTitle.seasons && (
            <div className="border-t border-zinc-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Episodes & Playlists</span>
                  <span className="text-xs font-normal text-zinc-500">
                    ({currentSeasonData?.episodes?.length || 0} Available)
                  </span>
                </h3>

                {activeModalTitle.seasons.length > 1 && (
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none cursor-pointer pr-8 appearance-none"
                    >
                      {activeModalTitle.seasons.map((s) => (
                        <option key={s.seasonNumber} value={s.seasonNumber}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {currentSeasonData?.episodes.map((ep) => (
                  <Link
                    key={ep.id}
                    href={`/watch?titleId=${activeModalTitle.id}&episodeId=${ep.id}`}
                    onClick={() => setActiveModalTitle(null)}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/30 transition-all group/ep cursor-pointer shadow-sm"
                  >
                    <span className="text-base font-bold text-zinc-500 group-hover/ep:text-emerald-400 w-6 text-center">
                      {ep.episodeNumber}
                    </span>

                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black border border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 group-hover/ep:bg-black/10 flex items-center justify-center transition-colors">
                        <Play className="w-6 h-6 text-white fill-current opacity-80 group-hover/ep:text-emerald-400 group-hover/ep:opacity-100 group-hover/ep:scale-110 transition-transform" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white truncate group-hover/ep:text-emerald-400 transition-colors">
                          {ep.title}
                        </h4>
                        <span className="text-xs text-zinc-400 font-mono ml-2">
                          {Math.round(ep.duration / 60)}m
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{ep.synopsis || `Watch ${ep.title} on StreamHub.`}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* More Like This Recommendations */}
          {similarTitles.length > 0 && (
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-base font-bold text-white mb-4">More Like This</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {similarTitles.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveModalTitle(item)}
                    className="bg-zinc-900/60 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all hover:scale-105 shadow-md group"
                  >
                    <div className="aspect-video w-full bg-zinc-800 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.backdropUrl || item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white font-bold backdrop-blur">
                        {item.qualityBadge || '4K'}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{item.synopsis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
