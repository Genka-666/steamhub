'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Layers,
  LogOut,
  ExternalLink,
  UploadCloud,
  FileVideo,
  Check,
  AlertCircle,
  Edit3,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Video,
} from 'lucide-react';
import { useWatch } from '@/context/WatchContext';
import { Title, Episode } from '@/types';

export default function AdminPage() {
  const { titles, refreshTitles } = useWatch();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'content' | 'transcoder'>('content');

  // Deletion feedback
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit Title State
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);

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
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 backdrop-blur text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black tracking-tight mb-1">Admin Portal Access</h1>
          <p className="text-xs text-zinc-400 mb-6">
            Only the administrator can add movies, manage anime series, or delete catalog titles.
          </p>

          {authError && (
            <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-semibold text-zinc-400 mb-1 block">Admin Passkey</label>
              <input
                type="password"
                placeholder="Enter passkey (default: admin123)"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500 font-mono tracking-wider"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20"
            >
              Authenticate as Admin
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors">
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
              <h1 className="text-2xl font-black tracking-tight">StreamHub Watcher Admin</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Authorized
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage streaming catalog, add anime series episodes, movies, and custom artwork.
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
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Film className="w-4 h-4 text-emerald-400" />
          <span>Catalog & Anime Series ({titles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcoder')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transcoder'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Cpu className="w-4 h-4 text-zinc-400" />
          <span>Transcoder Engine Simulator</span>
        </button>
      </div>

      {/* TAB 1: CONTENT & PLAYLIST MANAGER */}
      {activeTab === 'content' && (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Manage Anime Series & Movies</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-bold">
                  Editing Enabled
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Upload new videos, or click <strong>Edit</strong> on any existing anime to add Episode 2, 3, etc. or change details.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex-shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Add New Title</span>
            </button>
          </div>

          {/* Titles Table */}
          {titles.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
              <FileVideo className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-zinc-300 mb-1">No Videos in Database Yet</h3>
              <p className="text-xs text-zinc-500 mb-4">Click below to upload your first local MP4 video or anime episode.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
              >
                Upload First Video
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/90 text-gray-400 font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Media</th>
                    <th className="p-4">Format</th>
                    <th className="p-4">Source / Episodes</th>
                    <th className="p-4">Year / Rating</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {titles.map((t) => {
                    const seasonEps = t.seasons?.flatMap((s) => s.episodes || []) || [];
                    const directEps = (t as any).episodes || [];
                    const allEps = [...seasonEps, ...directEps].filter(
                      (ep, idx, self) => idx === self.findIndex((e) => e.id === ep.id)
                    );
                    const episodeCount = allEps.length;
                    const isLocal = t.videoUrl?.startsWith('/uploads/') || allEps.some(e => e.videoUrl?.startsWith('/uploads/'));
                    return (
                      <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0 border border-zinc-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={t.backdropUrl || t.posterUrl} alt={t.title} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-white text-sm">{t.title}</p>
                                {isLocal && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                                    Local File
                                  </span>
                                )}
                                {t.clipUrl && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1" title="Short background clip attached">
                                    <Sparkles className="w-2.5 h-2.5" /> Clip
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 line-clamp-1">{t.synopsis}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-zinc-900 text-zinc-300 border-zinc-800"
                          >
                            {t.type}
                          </span>
                        </td>

                        <td className="p-4 text-zinc-300">
                          {t.type === 'movie' ? (
                            <span className="font-mono text-[11px] text-zinc-400">
                              {t.videoUrl?.includes('.mp4') ? 'Local MP4' : 'HLS Stream'}
                            </span>
                          ) : (
                            <span className="font-semibold">{episodeCount} Episode{episodeCount !== 1 ? 's' : ''}</span>
                          )}
                        </td>

                        <td className="p-4 text-zinc-400">
                          {t.releaseYear} • <span className="text-zinc-300 font-medium">{t.rating}</span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit / Add Episodes Button */}
                            <button
                              onClick={() => setEditingTitle(t)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-700/80 transition-all flex items-center gap-1 text-xs font-semibold"
                              title="Edit Series & Add Episodes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit / Add Episodes</span>
                            </button>

                            {/* Play Test */}
                            <Link
                              href={`/watch?titleId=${t.id}`}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              title="Test Play Stream"
                            >
                              <Play className="w-4 h-4" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTitle(t.id, t.title)}
                              disabled={deletingId === t.id}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors"
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

          {/* Upload New Video Modal */}
          {showAddForm && (
            <SimpleVideoUploadModal
              existingTitles={titles}
              onClose={() => setShowAddForm(false)}
              onSuccess={async () => {
                setShowAddForm(false);
                await refreshTitles();
              }}
            />
          )}

          {/* Edit Existing Series & Add Episodes Modal */}
          {editingTitle && (
            <EditSeriesModal
              titleData={editingTitle}
              onClose={() => setEditingTitle(null)}
              onSuccess={async () => {
                setEditingTitle(null);
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
                        className={`text-xs py-2 px-3 rounded-lg font-bold border transition-all ${
                          active
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {res} {active && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold mb-1 block">
                  HLS Segment Duration ({chunkDuration}s)
                </label>
                <input
                  type="range"
                  min={2}
                  max={10}
                  step={1}
                  value={chunkDuration}
                  onChange={(e) => setChunkDuration(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold mb-1 block">Video Codec</label>
                <select
                  value={codec}
                  onChange={(e) => setCodec(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-xs text-white rounded-lg p-2 outline-none focus:border-emerald-500"
                >
                  <option value="libx264">H.264 / AVC (Universal Compatibility)</option>
                  <option value="libx265">H.265 / HEVC (40% Better Compression)</option>
                  <option value="libsvtav1">AV1 (Next-Gen Open Codec)</option>
                </select>
              </div>

              <button
                onClick={handleSimulateTranscode}
                disabled={isProcessing}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isProcessing
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
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
              <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-zinc-300 font-bold">worker-ffmpeg-daemon.log</span>
                </div>
                <span className="font-mono text-xs text-zinc-400">{progressPercent}%</span>
              </div>

              <div className="w-full bg-zinc-900 h-1">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
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

// ----------------------------------------------------------------------
// CLIENT-SIDE ASSET PROCESSING (Zero-latency & 100% Serverless / Vercel compatible)
// ----------------------------------------------------------------------
const readLocalImageAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width / height > MAX_WIDTH / MAX_HEIGHT) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readLocalFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ----------------------------------------------------------------------
// EDIT EXISTING ANIME / SERIES & ADD EPISODES MODAL
// ----------------------------------------------------------------------
interface EditableEpisode {
  id?: string;
  title: string;
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
}

function EditSeriesModal({
  titleData,
  onClose,
  onSuccess,
}: {
  titleData: Title;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(titleData.title);
  const [type, setType] = useState(titleData.type);
  const [synopsis, setSynopsis] = useState(titleData.synopsis);
  const [releaseYear, setReleaseYear] = useState(String(titleData.releaseYear || 2024));
  const [rating, setRating] = useState(titleData.rating || '16+');
  const [posterUrl, setPosterUrl] = useState(titleData.posterUrl || '');
  const [backdropUrl, setBackdropUrl] = useState(titleData.backdropUrl || '');
  const [clipUrl, setClipUrl] = useState(titleData.clipUrl || '');
  const [movieVideoUrl, setMovieVideoUrl] = useState(titleData.videoUrl || '');
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingClip, setIsUploadingClip] = useState(false);

  // Flatten all existing episodes
  const initialEpisodes: EditableEpisode[] = (
    titleData.seasons?.flatMap((s) => s.episodes || []) ||
    (titleData as any).episodes ||
    []
  ).map((ep: any, idx: number) => ({
    id: ep.id,
    title: ep.title || `Episode ${idx + 1}`,
    videoUrl: ep.videoUrl || '',
    duration: ep.duration || 1200,
    thumbnailUrl: ep.thumbnailUrl,
  }));

  const [episodes, setEpisodes] = useState<EditableEpisode[]>(initialEpisodes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle uploading a local MP4 specifically for a given episode index
  const handleUploadEpisodeFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndex(index);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-admin-token': 'admin123' },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload video file');
      const data = await res.json();

      setEpisodes((prev) => {
        const copy = [...prev];
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        copy[index] = {
          ...copy[index],
          title: copy[index].title || `Episode ${index + 1}: ${cleanName}`,
          videoUrl: data.videoUrl,
          duration: data.duration || 1200,
          thumbnailUrl: data.thumbnailUrl,
        };
        return copy;
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading episode');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddNewEpisode = () => {
    setEpisodes((prev) => [
      ...prev,
      {
        title: `Episode ${prev.length + 1}`,
        videoUrl: '',
        duration: 1200,
      },
    ]);
  };

  const handleRemoveEpisode = (index: number) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPoster(true);
    setErrorMsg('');
    try {
      // Instant client-side compression (0ms, 100% serverless/Vercel compatible)
      const dataUrl = await readLocalImageAsDataUrl(file);
      setPosterUrl(dataUrl);
      setBackdropUrl(dataUrl);

      // Silently try server disk upload (for local server)
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-admin-token': 'admin123' },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url && !data.url.startsWith('data:')) {
            setPosterUrl(data.url);
            setBackdropUrl(data.url);
          }
        }
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing poster');
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleUploadClip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Clip file is too large (>25MB). Please enter a direct video URL.');
      return;
    }

    setIsUploadingClip(true);
    setErrorMsg('');
    try {
      const dataUrl = await readLocalFileAsDataUrl(file);
      setClipUrl(dataUrl);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'video');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-admin-token': 'admin123' },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url && !data.url.startsWith('data:')) {
            setClipUrl(data.url);
          }
        }
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing clip');
    } finally {
      setIsUploadingClip(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Title cannot be empty');
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
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        clipUrl: clipUrl || null,
        videoUrl: type === 'movie' ? movieVideoUrl : undefined,
        episodes: (type === 'anime' || type === 'series') ? episodes : [],
      };

      const res = await fetch(`/api/titles/${titleData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin123',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update series');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating series');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white font-sans my-auto animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Edit3 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-black">Edit Series & Add Episodes</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Modify &quot;{titleData.title}&quot; or attach more episodes to its playlist.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Series Details */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">1. Series Metadata</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-zinc-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Year</label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Synopsis</label>
              <textarea
                rows={2}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Custom Poster Artwork & Background Video Clip */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              2. Custom Artwork & Short Video Clip
            </h3>

            {/* Poster / Backdrop */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Custom Poster Artwork
                </span>
                {isUploadingPoster && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Uploading image...
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                {posterUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={posterUrl}
                    alt="Poster Preview"
                    className="w-10 h-10 object-cover rounded border border-zinc-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 text-zinc-600">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Poster Image URL (/uploads/posters/... or https://...)"
                  value={posterUrl}
                  onChange={(e) => {
                    setPosterUrl(e.target.value);
                    setBackdropUrl(e.target.value);
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none font-mono focus:border-emerald-500"
                />

                <label className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer border border-zinc-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0" title="Upload local image from computer">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Poster</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPoster}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Short Background Video Clip */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Short Background Video Clip (.mp4)
                </span>
                {isUploadingClip && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Uploading clip...
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Short clip URL (/uploads/videos/... or https://...)"
                  value={clipUrl}
                  onChange={(e) => setClipUrl(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none font-mono focus:border-emerald-500"
                />

                <label className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer border border-zinc-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0" title="Upload local short clip from computer">
                  <Video className="w-4 h-4" />
                  <span>Upload Clip</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleUploadClip}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-zinc-500">
                Auto-plays silently on the background display when this movie or anime is selected.
              </p>
            </div>
          </div>

          {/* Section 3: Episode Playlist Management */}
          {(type === 'anime' || type === 'series') ? (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    3. Episodes Playlist ({episodes.length})
                  </h3>
                  <p className="text-[11px] text-zinc-500">Add Episode 2, Episode 3, or edit existing files.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddNewEpisode}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Episode</span>
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {episodes.map((ep, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">Episode {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEpisode(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete this episode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Episode Title (e.g. Episode 2: The Battle)"
                        value={ep.title}
                        onChange={(e) => {
                          const copy = [...episodes];
                          copy[idx].title = e.target.value;
                          setEpisodes(copy);
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white outline-none focus:border-emerald-500"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Video URL (.mp4 or .m3u8)"
                          value={ep.videoUrl}
                          onChange={(e) => {
                            const copy = [...episodes];
                            copy[idx].videoUrl = e.target.value;
                            setEpisodes(copy);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                        />

                        {/* Local File Picker for this specific episode */}
                        <label className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded cursor-pointer border border-zinc-700 flex-shrink-0" title="Upload local MP4 for this episode">
                          <UploadCloud className="w-4 h-4" />
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={(e) => handleUploadEpisodeFile(idx, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {uploadingIndex === idx && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Uploading local video for Episode {idx + 1}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <label className="text-xs text-zinc-400 font-bold block">Movie Video Source (.mp4 or .m3u8)</label>
              <input
                type="text"
                value={movieVideoUrl}
                onChange={(e) => setMovieVideoUrl(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Updates to Database...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes & Update Catalog
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUPER SIMPLE LOCAL MP4 VIDEO UPLOADER COMPONENT
// ----------------------------------------------------------------------
function SimpleVideoUploadModal({
  existingTitles,
  onClose,
  onSuccess,
}: {
  existingTitles: Title[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video Source Mode: 'url' (instant, cloud & Vercel ready) or 'file' (local upload)
  const [sourceMode, setSourceMode] = useState<'url' | 'file'>('url');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);

  // Custom poster & short background clip state
  const [customPosterUrl, setCustomPosterUrl] = useState('');
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [customClipUrl, setCustomClipUrl] = useState('');
  const [isUploadingClip, setIsUploadingClip] = useState(false);

  // Content form
  const [format, setFormat] = useState<'movie' | 'anime'>('anime');
  const [title, setTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('Episode 1');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('Anime');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg('');

    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    if (!title) {
      setTitle(rawName);
      setEpisodeTitle(`Episode 1: ${rawName}`);
    }

    await uploadLocalVideo(file);
  };

  const uploadLocalVideo = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('video', file);

      setUploadProgress(40);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'x-admin-token': 'admin123',
        },
        body: formData,
      });

      setUploadProgress(85);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed. On Vercel, use Direct Stream URL instead.');
      }

      const data = await res.json();
      setUploadedVideoUrl(data.videoUrl);
      setUploadedThumbUrl(data.thumbnailUrl);
      setVideoDuration(data.duration || 1200);
      setUploadProgress(100);
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('413') || err.message?.includes('Upload failed')
          ? 'Notice: Vercel serverless has a 4.5MB request limit. Please switch to the "Direct Stream URL" tab to link your cloud video (S3, Cloudinary, HLS .m3u8, or public MP4).'
          : err.message || 'Failed to upload video'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPoster(true);
    setErrorMsg('');
    try {
      // 1. Instant client-side compression (0ms, 100% serverless/Vercel compatible)
      const dataUrl = await readLocalImageAsDataUrl(file);
      setCustomPosterUrl(dataUrl);

      // 2. Silently attempt server upload if on local disk storage
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-admin-token': 'admin123' },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url && !data.url.startsWith('data:')) {
            setCustomPosterUrl(data.url);
          }
        }
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing poster image');
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleUploadClip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Clip file is too large (>25MB). Please enter a direct video URL.');
      return;
    }

    setIsUploadingClip(true);
    setErrorMsg('');
    try {
      const dataUrl = await readLocalFileAsDataUrl(file);
      setCustomClipUrl(dataUrl);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'video');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'x-admin-token': 'admin123' },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url && !data.url.startsWith('data:')) {
            setCustomClipUrl(data.url);
          }
        }
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing background clip');
    } finally {
      setIsUploadingClip(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedVideoUrl) {
      setErrorMsg('Please provide a video URL or select a video file.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please give your video a title.');
      return;
    }

    try {
      const fallbackBackdrop =
        customPosterUrl ||
        uploadedThumbUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';

      const payload = {
        title,
        type: format,
        synopsis: synopsis || `Stream ${title} on StreamHub Watcher.`,
        genres: [genre],
        posterUrl: fallbackBackdrop,
        backdropUrl: fallbackBackdrop,
        clipUrl: customClipUrl || undefined,
        videoUrl: format === 'movie' ? uploadedVideoUrl : undefined,
        episodes:
          format === 'anime'
            ? [
                {
                  title: episodeTitle || 'Episode 1',
                  videoUrl: uploadedVideoUrl,
                  thumbnailUrl: fallbackBackdrop,
                  duration: videoDuration || 1200,
                },
              ]
            : [],
      };

      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin123',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to register video in database');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving video to database');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 md:p-8 text-white font-sans my-auto animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <UploadCloud className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-black">Add Media to StreamHub Watcher</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Add an anime series episode or single movie using a direct stream URL or upload a local video.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Source Mode Switcher */}
        <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 mb-4">
          <button
            type="button"
            onClick={() => setSourceMode('url')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              sourceMode === 'url'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Direct Video / Stream URL</span>
            <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-mono">Cloud / Vercel</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('file')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              sourceMode === 'file'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileVideo className="w-3.5 h-3.5" />
            <span>Upload Local .mp4</span>
            <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded font-mono">Local Dev</span>
          </button>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {sourceMode === 'url' ? (
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  Video / Stream URL (.mp4 or .m3u8)
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">HLS / MP4</span>
              </div>

              <input
                type="text"
                placeholder="e.g. https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8 or https://.../video.mp4"
                value={uploadedVideoUrl}
                onChange={(e) => {
                  setUploadedVideoUrl(e.target.value);
                  if (!title) {
                    setTitle('One Piece');
                    setEpisodeTitle("Episode 1: I'm Luffy! The Man Who Will Become the Pirate King!");
                  }
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none font-mono focus:border-emerald-500"
              />

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] text-zinc-500">Quick Test Streams:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideoUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                    if (!title) setTitle('Mux Big Buck Bunny (4K HLS)');
                  }}
                  className="text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 rounded text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  Mux HLS 4K
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideoUrl('https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8');
                    if (!title) setTitle('Tears of Steel (4K HLS)');
                  }}
                  className="text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 rounded text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  Tears of Steel HLS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                    if (!title) setTitle('Big Buck Bunny (MP4)');
                  }}
                  className="text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 px-2 py-1 rounded text-zinc-300 hover:text-emerald-400 transition-colors"
                >
                  Google Sample MP4
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                uploadedVideoUrl
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-zinc-800 hover:border-emerald-500/60 bg-zinc-900/50 hover:bg-zinc-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/mkv,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploading ? (
                <div className="space-y-3 py-2">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-zinc-200">Uploading {selectedFile?.name}...</p>
                  <div className="w-48 bg-zinc-800 h-1.5 rounded-full mx-auto overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : uploadedVideoUrl ? (
                <div className="flex items-center justify-center gap-3 text-emerald-400 py-2">
                  <CheckCircle2 className="w-7 h-7" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white truncate max-w-xs">{selectedFile?.name || uploadedVideoUrl}</p>
                    <p className="text-[11px] text-emerald-400/80">Ready for StreamHub Watcher • Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <FileVideo className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">Click to choose a video file (.mp4)</p>
                  <p className="text-[11px] text-zinc-500">or drag and drop your movie or episode here</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-300 mb-1.5 block">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('movie')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  format === 'movie'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                Single Movie / Video
              </button>

              <button
                type="button"
                onClick={() => setFormat('anime')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  format === 'anime'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                Anime Series Episode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-400 mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. One Piece"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1 block">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Anime">Anime</option>
                <option value="Action">Action</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Drama">Drama</option>
                <option value="Comedy">Comedy</option>
              </select>
            </div>
          </div>

          {format === 'anime' && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 mb-1 block">Episode Name</label>
              <input
                type="text"
                placeholder="e.g. I'm Luffy! The Man Who Will Become the Pirate King!"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-400 mb-1 block">Short Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief summary of what happens in this episode or movie..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          {/* Custom Artwork & Background Clip Enhancement */}
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Custom Poster Artwork & Short Background Clip
              </span>
              <span className="text-[10px] text-zinc-500 font-medium">Optional Enhancements</span>
            </div>

            {/* Custom Poster Artwork */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Custom Poster Artwork
                </label>
                {isUploadingPoster && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Processing image...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {customPosterUrl || uploadedThumbUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={customPosterUrl || uploadedThumbUrl}
                    alt="Poster Preview"
                    className="w-10 h-10 object-cover rounded border border-zinc-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center flex-shrink-0 text-zinc-600">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Image URL or upload from your device"
                  value={customPosterUrl}
                  onChange={(e) => setCustomPosterUrl(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none font-mono focus:border-emerald-500"
                />

                <label
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer border border-zinc-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
                  title="Upload local poster image"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Poster</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPoster}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Short Background Video Clip */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  Short Background Video Clip / Trailer (.mp4)
                </label>
                {isUploadingClip && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Processing clip...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Video clip URL or upload short .mp4"
                  value={customClipUrl}
                  onChange={(e) => setCustomClipUrl(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none font-mono focus:border-emerald-500"
                />

                <label
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer border border-zinc-700 flex items-center gap-1.5 text-xs font-medium flex-shrink-0"
                  title="Upload short video clip (.mp4)"
                >
                  <Video className="w-4 h-4" />
                  <span>Upload Clip</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleUploadClip}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-zinc-500">
                ✨ When viewers select this movie or anime, this short clip will automatically play on the background display!
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading || !uploadedVideoUrl}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish to StreamHub Watcher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
