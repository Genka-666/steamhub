'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  PlusCircle,
  Trash2,
  Play,
  Film,
  Tv,
  Cpu,
  CheckCircle2,
  Terminal,
  HardDrive,
  RefreshCw,
  Layers,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import AddMediaModal from '@/components/AddMediaModal';
import { useWatch } from '@/context/WatchContext';
import { Title } from '@/types';

export default function AdminPage() {
  const { titles, refreshTitles } = useWatch();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'content' | 'transcoder'>('content');

  // Deletion feedback
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Transcoder Simulator State
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(['1080p', '720p', '480p', '360p']);
  const [chunkDuration, setChunkDuration] = useState<number>(4);
  const [codec, setCodec] = useState<string>('libx264');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [transcodeFinished, setTranscodeFinished] = useState(false);

  // Local Add Media Modal state inside Admin
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('streamhub_admin_token');
    if (savedToken === 'admin123') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkeyInput === 'admin123') {
      sessionStorage.setItem('streamhub_admin_token', 'admin123');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Passkey. (Default: admin123)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('streamhub_admin_token');
    setIsAuthenticated(false);
    setPasskeyInput('');
  };

  const handleDeleteTitle = async (id: string, titleName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${titleName}" from SQLite?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/titles/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': 'admin123',
        },
      });

      if (!res.ok) {
        alert('Unauthorized: Failed to delete title.');
        return;
      }

      await refreshTitles();
    } catch (err) {
      console.error(err);
      alert('Error deleting title');
    } finally {
      setDeletingId(null);
    }
  };

  // Transcoder Simulation
  const handleSimulateTranscode = () => {
    setIsProcessing(true);
    setTranscodeFinished(false);
    setProgressPercent(0);
    setLogs([
      '🚀 [Ingest Worker] Ingestion job #TR-8942 received from S3 bucket: s3://streamhub-raw/cyberpunk-master.mov',
      '🔍 [FFprobe] Probing source file: 3840x2160, 24fps, ProRes 422 HQ, Linear PCM Audio (142GB)',
      '⚙️  [Pipeline] Configuring HLS multi-bitrate packaging...',
    ]);

    const steps = [
      { pct: 20, log: '✂️  [FFmpeg] Splitting raw frames into 4s independent segment windows (IDR keyframe every 96 frames)...' },
      { pct: 45, log: '🎞️  [Encoding] 1080p variant (4500 kbps, 1920x1080) rendered: 240 segments generated.' },
      { pct: 65, log: '🎞️  [Encoding] 720p variant (2500 kbps, 1280x720) rendered: 240 segments generated.' },
      { pct: 85, log: '🎞️  [Encoding] 480p & 360p mobile profiles rendered: AAC 128kbps stereo tracks mapped.' },
      { pct: 95, log: '📝 [Manifest] Generating master.m3u8 index with EXT-X-STREAM-INF variant ladders and audio groups...' },
      { pct: 100, log: '✅ [S3 Sync] Uploading HLS playlist & segments to CDN origin (Cloudflare R2): 0 egress fees enabled.' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        setProgressPercent(item.pct);
        setLogs((prev) => [...prev, item.log]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        setTranscodeFinished(true);
      }
    }, 900);
  };

  const generatedFFmpegCommand = `ffmpeg -i input_master.mov \\
  -filter_complex "[0:v]split=${selectedResolutions.length}${selectedResolutions.map((_, i) => `[v${i}]`).join('')}; \\
  ${selectedResolutions
    .map((res, i) => {
      const dimensions = res === '1080p' ? '1920:1080' : res === '720p' ? '1280:720' : res === '480p' ? '854:480' : '640:360';
      return `[v${i}]scale=${dimensions}[v${i}out]`;
    })
    .join('; ')}" \\
  ${selectedResolutions
    .map((res, i) => {
      const bitrate = res === '1080p' ? '4500k' : res === '720p' ? '2500k' : res === '480p' ? '1200k' : '600k';
      return `-map "[v${i}out]" -c:v:${i} ${codec} -b:v:${i} ${bitrate} -maxrate:${i} ${bitrate} -bufsize:${i} ${bitrate}`;
    })
    .join(' ')} \\
  -map a:0 -c:a aac -b:a 128k \\
  -f hls -hls_time ${chunkDuration} -hls_playlist_type vod \\
  -hls_flags independent_segments -master_pl_name master.m3u8 \\
  -var_stream_map "${selectedResolutions.map((_, i) => `v:${i},a:0`).join(' ')}" \\
  output_%v/stream.m3u8`;

  // 1. If not authenticated, render Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-8 backdrop-blur text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-1">Admin Portal Access</h1>
          <p className="text-xs text-gray-400 mb-6">
            Only the administrator can add movies, manage anime series, or delete catalog titles.
          </p>

          {authError && (
            <div className="mb-4 p-2.5 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Admin Passkey</label>
              <input
                type="password"
                placeholder="Enter passkey (default: admin123)"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500 font-mono tracking-wider"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-amber-500/20"
            >
              Authenticate as Admin
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Public Viewer Mode
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-4 md:p-10">
      {/* Top Navbar */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors border border-zinc-800"
            title="Go to Public Website"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">Admin Control Center</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Authorized
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage your personal database: add movies, anime playlists, or transcode master reels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs bg-zinc-900 hover:bg-zinc-800 text-gray-300 px-3.5 py-2 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors"
          >
            <span>Preview Public Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-800/50 px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center gap-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'content'
              ? 'border-red-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Catalog & Video Playlists ({titles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcoder')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transcoder'
              ? 'border-red-500 text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Transcoder Engine Simulator</span>
        </button>
      </div>

      {/* TAB 1: CONTENT & PLAYLIST MANAGER */}
      {activeTab === 'content' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <div>
              <h2 className="text-sm font-bold text-white">Database Content Management</h2>
              <p className="text-xs text-gray-400">
                Only you have permission to add or delete these titles. Regular viewers have read-only access.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Movie / Anime Playlist</span>
            </button>
          </div>

          {/* Titles Table */}
          {titles.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl">
              <Film className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-300 mb-1">Your SQLite Catalog is Empty</h3>
              <p className="text-xs text-gray-500 mb-4">Click below to add your first movie or anime series.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                + Add Content
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-gray-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Media</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Episodes / Duration</th>
                    <th className="p-4">Year / Rating</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {titles.map((t) => {
                    const episodeCount = t.seasons?.reduce((acc, s) => acc + s.episodes.length, 0) || 0;
                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 aspect-video rounded overflow-hidden bg-black flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={t.backdropUrl || t.posterUrl} alt={t.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{t.title}</p>
                              <p className="text-[11px] text-gray-500 line-clamp-1">{t.synopsis}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              t.type === 'anime'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : t.type === 'movie'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>

                        <td className="p-4 text-gray-300">
                          {t.type === 'movie' ? (
                            <span>{t.duration || 'Feature Film'}</span>
                          ) : (
                            <span className="font-semibold">{episodeCount} Episode{episodeCount !== 1 ? 's' : ''}</span>
                          )}
                        </td>

                        <td className="p-4 text-gray-400">
                          {t.releaseYear} • <span className="text-gray-300 font-medium">{t.rating}</span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/watch?titleId=${t.id}`}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition-colors"
                              title="Test Play Stream"
                            >
                              <Play className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => handleDeleteTitle(t.id, t.title)}
                              disabled={deletingId === t.id}
                              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-800/80 text-red-400 hover:text-white border border-red-800/40 transition-colors"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Media Modal (only accessible inside Admin) */}
          {showAddForm && (
            <AddMediaModalDirect
              onClose={() => setShowAddForm(false)}
              onSuccess={async () => {
                setShowAddForm(false);
                await refreshTitles();
              }}
            />
          )}
        </div>
      )}

      {/* TAB 2: TRANSCODER STUDIO */}
      {activeTab === 'transcoder' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <Cpu className="w-4 h-4" />
                <span>Encoding Ladder</span>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-2 block">
                  Target Bitrate Resolutions (ABR)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['1080p', '720p', '480p', '360p'].map((res) => {
                    const active = selectedResolutions.includes(res);
                    return (
                      <button
                        key={res}
                        onClick={() =>
                          setSelectedResolutions((prev) =>
                            prev.includes(res) ? prev.filter((r) => r !== res) : [...prev, res]
                          )
                        }
                        className={`text-xs py-2 px-3 rounded font-bold border transition-all ${
                          active
                            ? 'bg-red-600 text-white border-red-500 shadow-md'
                            : 'bg-zinc-800/80 text-gray-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {res} {active && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">
                  HLS Segment Duration ({chunkDuration}s)
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  value={chunkDuration}
                  onChange={(e) => setChunkDuration(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 font-semibold mb-1 block">Video Codec</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-xs text-white rounded p-2 outline-none"
                >
                  <option value="libx264">H.264 / AVC (Universal Compatibility)</option>
                  <option value="libx265">H.265 / HEVC (40% Better Compression)</option>
                  <option value="libsvtav1">AV1 (Next-Gen Open Codec)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateTranscode}
                disabled={isProcessing}
                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isProcessing
                    ? 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Transcoding Ingest Reel...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Run Pipeline Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-black/90 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-gray-300 font-bold">worker-ffmpeg-daemon.log</span>
                </div>
                <span className="font-mono text-xs text-gray-400">{progressPercent}%</span>
              </div>

              <div className="w-full bg-zinc-900 h-1">
                <div
                  className="bg-red-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto space-y-1.5 bg-black/60">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <Film className="w-8 h-8 mb-2 opacity-50" />
                    <p>Click &quot;Run Pipeline Simulation&quot; to inspect the live transcoding worker.</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <p key={index} className="leading-relaxed text-gray-200">
                      {log}
                    </p>
                  ))
                )}
              </div>

              {transcodeFinished && (
                <div className="p-3 bg-emerald-950/60 border-t border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Master HLS Playlist generated successfully!
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-200">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Production FFmpeg Command</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">Run in background job worker</span>
              </div>

              <pre className="bg-black/80 border border-zinc-800 p-4 rounded-lg font-mono text-[11px] text-amber-300/90 overflow-x-auto leading-relaxed">
                {generatedFFmpegCommand}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline modal with x-admin-token injection
function AddMediaModalDirect({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<'movie' | 'anime' | 'series'>('anime');
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [releaseYear, setReleaseYear] = useState('2024');
  const [rating, setRating] = useState('16+');
  const [genres, setGenres] = useState<string[]>(['Anime', 'Action']);
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [episodes, setEpisodes] = useState([
    {
      title: 'Episode 1: The Awakening',
      videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      duration: 1440,
    },
    {
      title: 'Episode 2: The Battle of Fire',
      videoUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
      duration: 1380,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddEpisode = () => {
    setEpisodes((prev) => [
      ...prev,
      {
        title: `Episode ${prev.length + 1}`,
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        duration: 1400,
      },
    ]);
  };

  const handleRemoveEpisode = (index: number) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
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
        genres,
        posterUrl: posterUrl.trim() || undefined,
        backdropUrl: backdropUrl.trim() || undefined,
        videoUrl: type === 'movie' ? videoUrl : undefined,
        episodes: (type === 'anime' || type === 'series') ? episodes : [],
      };

      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin123', // Secure token passed by Admin
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save title. Check admin authorization.');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 my-auto text-white font-sans">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-300 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-xl font-black mb-1">Add New Title as Admin</h2>
        <p className="text-xs text-gray-400 mb-4">
          This writes directly to your SQLite database with <code className="text-amber-400">x-admin-token</code> verification.
        </p>

        {errorMsg && (
          <div className="mb-4 p-2.5 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs font-bold text-gray-300 mb-1.5 block">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('anime')}
                className={`py-2 px-4 rounded-xl border text-xs font-bold ${
                  type === 'anime' ? 'bg-red-600 text-white border-red-500' : 'bg-zinc-900 text-gray-400 border-zinc-800'
                }`}
              >
                Anime / Series Playlist
              </button>
              <button
                type="button"
                onClick={() => setType('movie')}
                className={`py-2 px-4 rounded-xl border text-xs font-bold ${
                  type === 'movie' ? 'bg-red-600 text-white border-red-500' : 'bg-zinc-900 text-gray-400 border-zinc-800'
                }`}
              >
                Single Movie
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-400 font-semibold mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. Solo Leveling, Bleach, Dune"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">Year</label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1 block">Synopsis</label>
            <textarea
              rows={2}
              placeholder="Storyline synopsis..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none"
            />
          </div>

          {type === 'movie' ? (
            <div>
              <label className="text-xs text-gray-400 font-semibold mb-1 block">Video Stream URL (.m3u8 or .mp4)</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
              />
            </div>
          ) : (
            <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">Episodes Playlist ({episodes.length})</span>
                <button
                  type="button"
                  onClick={handleAddEpisode}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded font-bold"
                >
                  + Add Episode
                </button>
              </div>

              {episodes.map((ep, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-red-400">Episode {idx + 1}</span>
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(idx)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Episode Title"
                    value={ep.title}
                    onChange={(e) => {
                      const copy = [...episodes];
                      copy[idx].title = e.target.value;
                      setEpisodes(copy);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Stream URL (.m3u8 or .mp4)"
                    value={ep.videoUrl}
                    onChange={(e) => {
                      const copy = [...episodes];
                      copy[idx].videoUrl = e.target.value;
                      setEpisodes(copy);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-white font-mono"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? 'Writing to SQLite...' : 'Save to Database (Admin)'}
          </button>
        </form>
      </div>
    </div>
  );
}
