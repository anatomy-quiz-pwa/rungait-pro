'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { SkipBack, Play, SkipForward, Camera } from 'lucide-react';

interface EnhancedVideoPlayerProps {
  src: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  sessionId?: string;
  className?: string;
}

export function EnhancedVideoPlayer({
  src,
  currentTime,
  onTimeUpdate,
  sessionId,
  className = '',
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // 節流函數：150ms
  const throttledTimeUpdate = useCallback((time: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= 150) {
      lastUpdateRef.current = now;
      onTimeUpdate?.(time);
    } else {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      throttleTimerRef.current = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        onTimeUpdate?.(time);
      }, 150 - (now - lastUpdateRef.current));
    }
  }, [onTimeUpdate]);

  // 處理影片時間更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      throttledTimeUpdate(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [throttledTimeUpdate]);

  // 同步外部 currentTime
  useEffect(() => {
    const video = videoRef.current;
    if (!video || currentTime === undefined) return;

    const diff = Math.abs(video.currentTime - currentTime);
    if (diff > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // 同步播放速度
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    // TODO: 實作截圖功能
    console.log('Capture frame at:', video.currentTime);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Session Info */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Video Analysis</h2>
        {sessionId && (
          <span className="text-sm text-slate-400">Session: {sessionId}</span>
        )}
      </div>

      {/* Video Player */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain"
          playsInline
        />
      </div>

      {/* Video Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBackward}
            className="text-slate-300 hover:text-white cursor-pointer"
            type="button"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
            type="button"
          >
            <Play className={`w-5 h-5 ${isPlaying ? 'hidden' : ''}`} />
            <div className={`w-5 h-5 ${isPlaying ? '' : 'hidden'}`}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            className="text-slate-300 hover:text-white cursor-pointer"
            type="button"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Center: Time Display */}
        <div className="flex-1 text-center">
          <span className="text-sm text-slate-300">
            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(videoRef.current?.duration || 0)}
          </span>
        </div>

        {/* Right: Speed Controls & Capture */}
        <div className="flex items-center gap-2">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <Button
              key={rate}
              variant={playbackRate === rate ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPlaybackRate(rate)}
              className={
                playbackRate === rate
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-white cursor-pointer'
                  : 'text-slate-300 hover:text-white cursor-pointer'
              }
              type="button"
            >
              {rate}x
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCapture}
            className="text-slate-300 hover:text-white cursor-pointer"
            type="button"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

