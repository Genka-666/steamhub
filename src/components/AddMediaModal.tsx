'use client';

import React, { useState } from 'react';
import { X, Film, Tv, Plus, Trash2, CheckCircle2, Sparkles, Video } from 'lucide-react';
import { useWatch } from '@/context/WatchContext';

interface EpisodeFormItem {
  title: string;
  videoUrl: string;
  duration: number;
  introStart: number;
  introEnd: number;
}

export default function AddMediaModal() {
  const { showAddModal, setShowAddModal, refreshTitles } = useWatch();

  const [type, setType] = useState<'movie' | 'anime' | 'series'>('anime');
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [rating, setRating] = useState('16+');
  const [qualityBadge, setQualityBadge] = useState('4K Ultra HD');
  const [genres, setGenres] = useState<string[]>(['Anime', 'Action']);
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [introStart, setIntroStart] = useState('0');
  const [introEnd, setIntroEnd] = useState('0');

  // Episodes playlist for anime/series
  const [episodes, setEpisodes] = useState<EpisodeFormItem[]>([
    {
      title: 'Episode 1: The Beginning',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      duration: 1440,
      introStart: 10,
      introEnd: 25,
    },
    {
      title: 'Episode 2: The Rising Storm',
      videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      duration: 1380,
      introStart: 8,
      introEnd: 22,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!showAddModal) return null;

  const handleAddEpisode = () => {
    setEpisodes((prev) => [
      ...prev,
      {
        title: `Episode ${prev.length + 1}`,
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        duration: 1400,
        introStart: 0,
        introEnd: 0,
      },
    ]);
  };

  const handleRemoveEpisode = (index: number) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEpisodeChange = (index: number, field: keyof EpisodeFormItem, value: any) => {
    setEpisodes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUsePreset = (preset: 'anime' | 'movie' | 'scifi') => {
    if (preset === 'anime') {
      setTitle('Chainsaw Devil: Blood Contract');
      setType('anime');
      setSynopsis('A young demon hunter merges with his pet chainsaw devil to survive in a metropolis teeming with fiends.');
      setGenres(['Anime', 'Dark Fantasy', 'Action', 'Supernatural']);
      setPosterUrl('https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80');
      setBackdropUrl('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1920&q=80');
    } else if (preset === 'movie') {
      setTitle('Solaris: Deep Orbital');
      setType('movie');
      setSynopsis('A space exploration crew encounters a sentient oceanic planet that manifests their deepest unconscious memories.');
      setGenres(['Sci-Fi', 'Space', 'Drama']);
      setPosterUrl('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80');
      setBackdropUrl('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80');
      setVideoUrl('https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        title,
        type,
        synopsis,
        releaseYear: Number(releaseYear),
        rating,
        qualityBadge,
        genres,
        posterUrl: posterUrl.trim() || undefined,
        backdropUrl: backdropUrl.trim() || undefined,
        videoUrl: type === 'movie' ? videoUrl : undefined,
        introStart: Number(introStart),
        introEnd: Number(introEnd),
        episodes: (type === 'anime' || type === 'series') ? episodes : [],
      };

      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save to database');
      }

      await refreshTitles();
      setShowAddModal(false);
      // Reset form
      setTitle('');
      setSynopsis('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating title');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 my-auto animate-in zoom-in-95 duration-200 text-white font-sans">
        {/* Close Button */}
        <button
          onClick={() => setShowAddModal(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white border border-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded bg-red-600/20 text-red-500 border border-red-500/30">
              <Plus className="w-4 h-4" />
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">Add Custom Video or Anime Playlist</h2>
          </div>
          <p className="text-xs text-gray-400">
            Saves directly to your real SQLite database via the <code className="text-red-400">POST /api/titles</code> backend API.
          </p>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[11px] text-gray-500 font-semibold">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleUsePreset('anime')}
              className="text-[11px] bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Anime Series Preset
            </button>
            <button
              type="button"
              onClick={() => handleUsePreset('movie')}
              className="text-[11px] bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors"
            >
              <Film className="w-3 h-3" />
              Sci-Fi Movie Preset
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Media Type Selector */}
          <div>
            <label className="text-xs font-bold text-gray-300 mb-2 block">Content Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('anime')}
                className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  type === 'anime' || type === 'series'
                    ? 'bg-red-600 text-white border-red-500 shadow-lg'
                    : 'bg-zinc-900 text-gray-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                Anime Series / Video Playlist
              </button>

              <button
                type="button"
                onClick={() => setType('movie')}
                className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  type === 'movie'
                    ? 'bg-red-600 text-white border-red-500 shadow-lg'
                    : 'bg-zinc-900 text-gray-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                Single Movie / Video
              </button>
            </div>
          </div>

          {/* Title & Release Year */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Demon Slayer, Interstellar, My Vlog"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Synopsis / Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the movie, anime storyline, or video series..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
            />
          </div>

          {/* Image URLs (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Poster URL (Optional)</label>
              <input
                type="url"
                placeholder="https://... (Leave blank for auto)"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Backdrop Banner URL (Optional)</label>
              <input
                type="url"
                placeholder="https://... (Leave blank for auto)"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Single Movie Video Stream */}
          {type === 'movie' && (
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                <Video className="w-4 h-4 text-red-500" />
                <span>Video Stream Source (.m3u8 or .mp4)</span>
              </div>
              <input
                type="text"
                placeholder="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white outline-none font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Skip Intro Start (seconds)</label>
                  <input
                    type="number"
                    value={introStart}
                    onChange={(e) => setIntroStart(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Skip Intro End (seconds)</label>
                  <input
                    type="number"
                    value={introEnd}
                    onChange={(e) => setIntroEnd(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Anime Series Playlist Builder */}
          {(type === 'anime' || type === 'series') && (
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>Episode Playlist ({episodes.length} episodes)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddEpisode}
                  className="text-xs bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Episode
                </button>
              </div>

              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {episodes.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400">Episode {idx + 1}</span>
                      {episodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEpisode(idx)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Remove episode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Episode Title"
                        value={ep.title}
                        onChange={(e) => handleEpisodeChange(idx, 'title', e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Video Stream URL (.m3u8 or .mp4)"
                        value={ep.videoUrl}
                        onChange={(e) => handleEpisodeChange(idx, 'videoUrl', e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Writing to SQLite Database...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save to Database & Stream
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

