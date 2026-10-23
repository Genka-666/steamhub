'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  ArrowLeft,
  FastForward,
  Check,
  ChevronRight,
  PictureInPicture,
  AlertTriangle,
} from 'lucide-react';
import { useWatch } from '@/context/WatchContext';
import { VideoQualityLevel } from '@/types';

// Suppress harmless browser media AbortErrors in React/Next.js
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.name === 'AbortError' ||
      event.reason?.message?.includes('aborted by the user agent')
    ) {
      event.preventDefault();
    }
  });
}

interface VideoPlayerProps {
  src: string;
  title: string;
  subTitle?: string;
  titleId: string;
  episodeId?: string;
  introStart?: number;
  introEnd?: number;
  onBack: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export default function VideoPlayer({
  src,
  title,
  subTitle,
  titleId,
  episodeId,
  introStart = 0,
  introEnd = 0,
  onBack,
  onNextEpisode,
  hasNextEpisode = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { updateWatchProgress, getProgress } = useWatch();

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quality settings
  const [qualityLevels, setQualityLevels] = useState<VideoQualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [activeQualityLabel, setActiveQualityLabel] = useState<string>('Auto');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'main' | 'quality' | 'speed'>('main');

  // Next episode countdown
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);

  // Formatting helpers
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe play helper to prevent unhandled AbortErrors
  const safePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      await video.play();
      setIsPlaying(true);
      setIsBuffering(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Normal when switching media or paused by user
        return;
      }
      if (err.name === 'NotAllowedError') {
        // Autoplay blocked by browser policy: show Big Play Button
        setIsPlaying(false);
        setIsBuffering(false);
        return;
      }
      console.warn('Video play prevented:', err);
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, []);

  // 1. Initialize HLS or Native MP4 Video Stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let isMounted = true;
    let hls: Hls | null = null;
    setIsBuffering(true);
    setHasError(false);
    setErrorMessage('');

    const savedProgress = getProgress(titleId, episodeId);
    const initialSeek =
      savedProgress && savedProgress.currentTime < savedProgress.duration - 20
        ? savedProgress.currentTime
        : 0;

    const isHls = src.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
        startLevel: -1,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        if (!isMounted) return;
        setIsBuffering(false);
        const levels: VideoQualityLevel[] = data.levels.map((lvl, idx) => ({
          height: lvl.height,
          bitrate: lvl.bitrate,
          index: idx,
          label: lvl.height ? `${lvl.height}p` : `${Math.round(lvl.bitrate / 1000)}k`,
        }));
        setQualityLevels(levels);

        if (initialSeek > 0) {
          video.currentTime = initialSeek;
        }

        safePlay();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (!isMounted) return;
        const lvl = hls?.levels[data.level];
        if (lvl) {
          setActiveQualityLabel(hls?.autoLevelEnabled ? `Auto (${lvl.height}p)` : `${lvl.height}p`);
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!isMounted) return;
        if (data.fatal) {
          setIsBuffering(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError();
              break;
            default:
              setHasError(true);
              setErrorMessage('Failed to decode streaming manifest.');
              hls?.destroy();
              break;
          }
        }
      });
    } else {
      // Direct Local / Remote MP4 Video Playback
      video.src = src;
      setActiveQualityLabel('Direct MP4');
      setQualityLevels([{ height: 1080, bitrate: 4500000, index: 0, label: 'Original Quality' }]);

      const handleCanPlay = () => {
        if (!isMounted) return;
        setIsBuffering(false);
        if (initialSeek > 0 && Math.abs(video.currentTime - initialSeek) > 2) {
          try {
            video.currentTime = initialSeek;
          } catch {}
        }
        safePlay();
      };

      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.addEventListener('loadeddata', () => {
        if (isMounted) setIsBuffering(false);
      }, { once: true });

      // Explicitly load the media source
      try {
        video.load();
      } catch {}

      // Fallback timer: if browser doesn't fire canplay within 1s, remove spinner
      const timer = setTimeout(() => {
        if (isMounted) setIsBuffering(false);
      }, 1200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        video.removeEventListener('canplay', handleCanPlay);
        if (hls) {
          hls.destroy();
        }
        try {
          video.pause();
        } catch {}
      };
    }

    return () => {
      isMounted = false;
      if (hls) {
        hls.destroy();
      }
      try {
        video.pause();
      } catch {}
    };
  }, [src, titleId, episodeId, safePlay, getProgress]);

  // 2. Heartbeat progress updater
  useEffect(() => {
    if (!isPlaying || !duration || duration <= 0) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        updateWatchProgress(titleId, videoRef.current.currentTime, duration, episodeId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, duration, titleId, episodeId, updateWatchProgress]);

  // 3. User activity timer for UI controls auto-hide
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  // 4. Video element event listeners
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setDuration(dur);

    // Update buffer range
    if (videoRef.current.buffered.length > 0) {
      try {
        const bufferedEndVal = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBufferedEnd(bufferedEndVal);
      } catch {}
    }

    // Auto next episode countdown trigger when 20s remaining
    if (hasNextEpisode && dur > 30 && dur - curr <= 20) {
      setShowNextPrompt(true);
      setNextCountdown(Math.max(0, Math.ceil(dur - curr)));
    } else {
      setShowNextPrompt(false);
    }
  };

  // Playback control functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      safePlay();
    }
  };

  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const changeQuality = (levelIndex: number) => {
    if (!hlsRef.current) return;
    setCurrentQuality(levelIndex);
    hlsRef.current.currentLevel = levelIndex;
    if (levelIndex === -1) {
      setActiveQualityLabel('Auto');
    } else {
      const selected = qualityLevels.find((q) => q.index === levelIndex);
      setActiveQualityLabel(selected ? selected.label : 'HD');
    }
    setShowSettingsMenu(false);
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSettingsMenu(false);
  };

  const skipIntro = () => {
    if (videoRef.current && introEnd > 0) {
      videoRef.current.currentTime = introEnd;
    }
  };

  // 5. Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowright':
        case 'l':
          seekRelative(10);
          break;
        case 'arrowleft':
        case 'j':
          seekRelative(-10);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const next = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'escape':
          if (!document.fullscreenElement) {
            onBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const isIntroActive = introEnd > 0 && currentTime >= introStart && currentTime < introEnd;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center select-none group font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onLoadedData={() => setIsBuffering(false)}
        onError={(e) => {
          const v = e.currentTarget as HTMLVideoElement;
          const err = v.error;
          // Ignore Code 1 (MEDIA_ERR_ABORTED) which occurs on navigation/remount
          if (!err || err.code === 1) return;

          setIsBuffering(false);
          setHasError(true);
          if (src?.startsWith('/uploads/')) {
            setErrorMessage(
              'This video was uploaded locally on developer storage and is not hosted on the cloud. Go to /admin and link an online stream URL (HLS .m3u8 or MP4) for cloud viewing.'
            );
          } else {
            const codeNames: Record<number, string> = {
              2: 'Network error loading video file.',
              3: 'Decoding error: browser was unable to decode this file.',
              4: 'Codec not supported by your browser or stream is offline.',
            };
            setErrorMessage(codeNames[err.code] || `Error Code ${err.code}: ${err.message}`);
          }
        }}
        onTimeUpdate={handleTimeUpdate}
        preload="auto"
        playsInline
      />

      {/* Error Card Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-40">
          <AlertTriangle className="w-12 h-12 text-emerald-400 mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">Playback Error</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">{errorMessage}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              Return to Browse
            </button>
            <Link
              href="/admin"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              Edit in Admin
            </Link>
          </div>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      )}

      {/* Big Center Play Button Overlay when paused & ready */}
      {!isPlaying && !isBuffering && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all duration-300 hover:scale-110 z-20 group/playbtn"
          title="Play Video"
        >
          <Play className="w-9 h-9 fill-current ml-1 transition-transform group-hover/playbtn:scale-110" />
        </button>
      )}

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-full hover:bg-white/20 transition-colors text-white"
            title="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
            {subTitle && <p className="text-sm text-gray-300 font-medium">{subTitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 bg-white/10 rounded border border-white/20 font-semibold text-gray-200">
            {activeQualityLabel}
          </span>
        </div>
      </div>

      {/* Skip Intro Button Overlay */}
      {isIntroActive && (
        <button
          onClick={skipIntro}
          className="absolute bottom-28 right-8 z-40 bg-black/80 hover:bg-white text-white hover:text-black border border-white/40 px-5 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 backdrop-blur transition-all duration-200 hover:scale-105 shadow-2xl"
        >
          <FastForward className="w-4 h-4 fill-current" />
          Skip Intro
        </button>
      )}

      {/* Next Episode Auto Countdown Overlay */}
      {showNextPrompt && hasNextEpisode && (
        <div className="absolute bottom-28 right-8 z-40 bg-zinc-900/95 border border-zinc-700 p-4 rounded-lg shadow-2xl backdrop-blur flex items-center gap-4 animate-fade-in">
          <div>
            <p className="text-xs text-gray-400 font-medium">Up Next in {nextCountdown}s</p>
            <p className="text-sm font-bold text-white">Next Episode</p>
          </div>
          <button
            onClick={onNextEpisode}
            className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-1.5 transition-colors"
          >
            Play Now
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 pt-12 pb-5 px-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="relative mb-4 group/bar cursor-pointer">
          {/* Buffer Bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-white/30 rounded-full transition-all group-hover/bar:h-2"
            style={{ width: `${duration > 0 ? (bufferedEnd / duration) * 100 : 0}%` }}
          />

          {/* Played Bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-emerald-500 rounded-full transition-all group-hover/bar:h-2 pointer-events-none"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />

          {/* Interactive Range Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 group-hover/bar:h-2 opacity-0 cursor-pointer relative z-10"
          />
        </div>

        {/* Buttons and Tools */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Replay 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-300 hover:text-white"
              title="Rewind 10 seconds (Left Arrow)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-300 hover:text-white"
              title="Fast Forward 10 seconds (Right Arrow)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-300 hover:text-white"
                title="Mute (M)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-emerald-500 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Time Stamp */}
            <span className="text-xs font-semibold text-gray-300 tracking-wider">
              {formatTime(currentTime)} <span className="text-gray-500">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Settings Menu Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setSettingsTab('main');
                }}
                className={`p-2 rounded-full transition-colors ${
                  showSettingsMenu ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Flyout Settings Menu */}
              {showSettingsMenu && (
                <div className="absolute bottom-12 right-0 w-56 bg-zinc-900/95 border border-zinc-700 rounded-lg shadow-2xl p-2 text-sm backdrop-blur z-50 animate-in fade-in">
                  {settingsTab === 'main' && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSettingsTab('quality')}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded text-gray-200"
                      >
                        <span>Quality</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          {activeQualityLabel}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      <button
                        onClick={() => setSettingsTab('speed')}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded text-gray-200"
                      >
                        <span>Speed</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    </div>
                  )}

                  {settingsTab === 'quality' && (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs text-gray-400">
                        <button onClick={() => setSettingsTab('main')} className="hover:text-white font-bold">
                          ← Back
                        </button>
                        <span>Stream Quality</span>
                      </div>
                      <button
                        onClick={() => changeQuality(-1)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded text-gray-200"
                      >
                        <span>Auto (Recommended)</span>
                        {currentQuality === -1 && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                      {qualityLevels.map((lvl) => (
                        <button
                          key={lvl.index}
                          onClick={() => changeQuality(lvl.index)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded text-gray-200"
                        >
                          <span>{lvl.label}</span>
                          {currentQuality === lvl.index && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {settingsTab === 'speed' && (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs text-gray-400">
                        <button onClick={() => setSettingsTab('main')} className="hover:text-white font-bold">
                          ← Back
                        </button>
                        <span>Playback Speed</span>
                      </div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => changeSpeed(spd)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded text-gray-200"
                        >
                          <span>{spd === 1 ? 'Normal (1x)' : `${spd}x`}</span>
                          {playbackSpeed === spd && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={() => {
                if (document.pictureInPictureElement) {
                  document.exitPictureInPicture();
                } else if (videoRef.current) {
                  videoRef.current.requestPictureInPicture().catch(() => {});
                }
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-300 hover:text-white"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-gray-300 hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
