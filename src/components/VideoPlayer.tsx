'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface VideoPlayerProps {
  src: string;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export function VideoPlayer({
  src,
  currentTime,
  onTimeUpdate,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
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

  return (
    <div className={`relative w-full ${className}`}>
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full rounded-lg"
        playsInline
      />
    </div>
  );
}

