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
  Sparkles,
} from 'lucide-react';
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
              Add your local MP4 videos, manage anime playlists, or transcode master reels.
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
          <span>Catalog & Local Videos ({titles.length})</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Add Your Local Videos & Movies</span>
                <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                  MP4 Supported
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Drop any `.mp4` file from your computer. The system automatically creates thumbnails and makes it streamable.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all hover:scale-105 flex-shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>+ Upload Local MP4 Video</span>
            </button>
          </div>

          {/* Titles Table */}
          {titles.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
              <FileVideo className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-300 mb-1">No Videos in SQLite Database Yet</h3>
              <p className="text-xs text-gray-500 mb-4">Click below to upload your first local MP4 video or anime episode.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg"
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
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {titles.map((t) => {
                    const episodeCount = t.seasons?.reduce((acc, s) => acc + s.episodes.length, 0) || 0;
                    const isLocal = t.videoUrl?.startsWith('/uploads/') || t.seasons?.some(s => s.episodes.some(e => e.videoUrl?.startsWith('/uploads/')));
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
                              </div>
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
                            <span className="font-mono text-[11px] text-gray-400">
                              {t.videoUrl?.includes('.mp4') ? 'Local MP4' : 'HLS Stream'}
                            </span>
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

          {/* Super Simple Local MP4 Video Upload Modal */}
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

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [uploadedThumbUrl, setUploadedThumbUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);

  // Content form
  const [format, setFormat] = useState<'movie' | 'anime'>('movie');
  const [title, setTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('Episode 1');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('Action');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle local file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg('');

    // Pre-fill clean title from file name
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    setTitle(rawName);
    setEpisodeTitle(`Episode 1: ${rawName}`);

    // Auto-upload the local video
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
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await res.json();
      setUploadedVideoUrl(data.videoUrl);
      setUploadedThumbUrl(data.thumbnailUrl);
      setVideoDuration(data.duration || 1200);
      setUploadProgress(100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedVideoUrl) {
      setErrorMsg('Please select and upload a local MP4 video file first.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please give your video a title.');
      return;
    }

    try {
      const fallbackBackdrop =
        uploadedThumbUrl ||
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';

      const payload = {
        title,
        type: format,
        synopsis: synopsis || `Stream ${title} on StreamHub.`,
        genres: [genre],
        posterUrl: fallbackBackdrop,
        backdropUrl: fallbackBackdrop,
        videoUrl: format === 'movie' ? uploadedVideoUrl : undefined,
        episodes:
          format === 'anime'
            ? [
                {
                  title: episodeTitle || 'Episode 1',
                  videoUrl: uploadedVideoUrl,
                  thumbnailUrl: fallbackBackdrop,
                  duration: videoDuration,
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
        throw new Error('Failed to register video in database');
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
          <UploadCloud className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-black">Upload Local Video (.mp4)</h2>
        </div>
        <p className="text-xs text-gray-400 mb-5">
          Select a video from your computer. It will be copied into your app and added to your database automatically.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {/* Step 1: Drop Zone / File Picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              uploadedVideoUrl
                ? 'border-emerald-500/50 bg-emerald-950/10'
                : 'border-zinc-800 hover:border-red-500/60 bg-zinc-900/50 hover:bg-zinc-900'
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
                <RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-200">Uploading {selectedFile?.name}...</p>
                <div className="w-48 bg-zinc-800 h-1.5 rounded-full mx-auto overflow-hidden">
                  <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : uploadedVideoUrl ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400 py-2">
                <CheckCircle2 className="w-7 h-7" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white truncate max-w-xs">{selectedFile?.name}</p>
                  <p className="text-[11px] text-emerald-400/80">Uploaded to StreamHub • Click to change file</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-3">
                <FileVideo className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-xs font-bold text-white">Click to choose a video file (.mp4)</p>
                <p className="text-[11px] text-gray-500">or drag and drop your movie or episode here</p>
              </div>
            )}
          </div>

          {/* Step 2: Choose Format (Movie vs Anime) */}
          <div>
            <label className="text-xs font-bold text-gray-300 mb-1.5 block">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('movie')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  format === 'movie'
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-zinc-900 text-gray-400 border-zinc-800 hover:text-white'
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
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-zinc-900 text-gray-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                Anime Series Episode
              </button>
            </div>
          </div>

          {/* Step 3: Title & Genre */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Title *</label>
              <input
                type="text"
                placeholder="e.g. My Favorite Movie or Anime Name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none"
              >
                <option value="Action">Action</option>
                <option value="Anime">Anime</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Personal">Personal / Vlog</option>
                <option value="Comedy">Comedy</option>
                <option value="Drama">Drama</option>
              </select>
            </div>
          </div>

          {/* Episode Title if Anime */}
          {format === 'anime' && (
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1 block">Episode Name</label>
              <input
                type="text"
                placeholder="e.g. Episode 1: Pilot"
                value={episodeTitle}
                onChange={(e) => setEpisodeTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none"
              />
            </div>
          )}

          {/* Synopsis */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-1 block">Short Description (Optional)</label>
            <input
              type="text"
              placeholder="A brief sentence about this video..."
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading || !uploadedVideoUrl}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-xl disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish to StreamHub</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
