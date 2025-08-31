"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlacedImage, PlacedVideo } from '@/types/canvas';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/shadcn-ui/dialog';
import { Pause, Play, X } from 'lucide-react';
import { extractFramesFromVideo } from '@/utils/tools/MediaProcess'
interface Props {
  video: PlacedVideo;
  setImages?: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoFrameExtractDialog: React.FC<Props> = ({ video, setImages, isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const getMaxDisplayDimensions = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const isMdScreen = viewportWidth >= 768;
    const dialogMaxWidth = isMdScreen ? viewportWidth * 0.65 : viewportWidth * 0.85;
    const dialogMaxHeight = isMdScreen ? viewportHeight * 0.8 : viewportHeight * 0.7;
    const reservedHeight = 40 + 40 + 80 + 32;
    const reservedWidth = 32;
    return {
      width: Math.max(400, dialogMaxWidth - reservedWidth),
      height: Math.max(300, dialogMaxHeight - reservedHeight),
    };
  };

  const displayDimensions = useMemo(() => {
    const max = getMaxDisplayDimensions();
    return { maxWidth: max.width, maxHeight: max.height };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const el = videoRef.current;
    if (!el) return;

    const handleLoaded = () => {
      setDuration(el.duration || 0);
      setCurrentTime(el.currentTime || 0);
    };
    const handleTime = () => setCurrentTime(el.currentTime || 0);
    const handleEnded = () => setIsPlaying(false);

    el.addEventListener('loadedmetadata', handleLoaded);
    el.addEventListener('timeupdate', handleTime);
    el.addEventListener('ended', handleEnded);

    return () => {
      el.removeEventListener('loadedmetadata', handleLoaded);
      el.removeEventListener('timeupdate', handleTime);
      el.removeEventListener('ended', handleEnded);
    };
  }, [isOpen]);

  const togglePlay = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      try {
        await el.play();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    }
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(time, duration || el.duration || 0));
  }, [duration]);

  const waitForSeek = (el: HTMLVideoElement) => new Promise<void>((resolve) => {
    const onSeeked = () => {
      el.removeEventListener('seeked', onSeeked);
      resolve();
    };
    el.addEventListener('seeked', onSeeked);
  });

  const captureCurrentFrame = useCallback(async (): Promise<{ url: string; width: number; height: number }> => {
    const el = videoRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) throw new Error('Video or canvas ref not available');

    const wasPlaying = !el.paused && !el.ended;
    if (wasPlaying) el.pause();

    const vw = el.videoWidth || 0;
    const vh = el.videoHeight || 0;
    if (!vw || !vh) throw new Error('Invalid video dimensions');

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    ctx.drawImage(el, 0, 0, vw, vh);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
    const url = URL.createObjectURL(blob);

    if (wasPlaying) {
      try { await el.play(); } catch { /* noop */ }
    }

    return { url, width: vw, height: vh };
  }, []);

  const captureAtTime = useCallback(async (time: number): Promise<{ url: string; width: number; height: number }> => {
    const el = videoRef.current;
    if (!el) throw new Error('Video ref not available');
    const wasPlaying = !el.paused && !el.ended;
    if (wasPlaying) el.pause();

    el.currentTime = time;
    await waitForSeek(el);
    const result = await captureCurrentFrame();

    if (wasPlaying) {
      try { await el.play(); } catch { /* noop */ }
    }
    return result;
  }, [captureCurrentFrame]);

  const addImageToCanvas = useCallback((result: { url: string; width: number; height: number }) => {
    if (!setImages) return;
    const aspectRatio = result.width / result.height;
    const maxSize = 300;
    let displayWidth = maxSize;
    let displayHeight = maxSize / aspectRatio;
    if (displayHeight > maxSize) {
      displayHeight = maxSize;
      displayWidth = maxSize * aspectRatio;
    }

    const newImage: PlacedImage = {
      id: `frame_${video.id}_${Date.now()}`,
      src: result.url,
      x: video.x + video.width + 20,
      y: video.y,
      width: displayWidth,
      height: displayHeight,
      rotation: 0,
      isGenerated: false,
    };
    setImages((prev) => [...prev, newImage]);
  }, [setImages, video.id, video.x, video.y, video.width]);

  const extractFirst = useCallback(async () => {
    if (!isOpen) return;
    try {
      setIsProcessing(true);
      const result = await captureAtTime(0);
      addImageToCanvas(result);
    } finally {
      setIsProcessing(false);
    }
  }, [captureAtTime, addImageToCanvas, isOpen]);

  const extractCurrent = useCallback(async () => {
    if (!isOpen) return;
    try {
      setIsProcessing(true);
      const result = await captureCurrentFrame();
      addImageToCanvas(result);
    } finally {
      setIsProcessing(false);
    }
  }, [captureCurrentFrame, addImageToCanvas, isOpen]);

  const extractLast = useCallback(async () => {
    if (!isOpen) return;
    try {
      setIsProcessing(true);
      // Prefer using FFmpeg-based extraction for the most reliable last-frame capture
      try {
        // Fetch video data and convert to File for FFmpeg API
        const response = await fetch(video.src);
        const blob = await response.blob();
        const mimeType = blob.type || 'video/mp4';
        let fileName = 'video.mp4';
        try {
          const u = new URL(video.src, typeof window !== 'undefined' ? window.location.href : undefined);
          const last = (u.pathname.split('/').pop() || 'video');
          fileName = /\.[a-zA-Z0-9]+$/.test(last) ? last : `${last}.mp4`;
        } catch {
          // keep default fileName
        }

        const file = new File([blob], fileName, { type: mimeType });
        const frames = await extractFramesFromVideo({ file, extract_time: ['end'] });
        const frameFile = frames?.[0];
        if (frameFile) {
          const url = URL.createObjectURL(frameFile);
          const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error('Failed to load extracted frame image'));
            img.src = url;
          });
          addImageToCanvas({ url, width, height });
          return;
        }
        // If no frame returned, fall back
      } catch {
        // Fallback to canvas capture near the end
        const end = Math.max(0, (duration || 0) - 0.05);
        const result = await captureAtTime(end);
        addImageToCanvas(result);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [captureAtTime, addImageToCanvas, duration, isOpen]);

  const formatTime = (t: number) => {
    if (!isFinite(t)) return '00:00';
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleClose = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      try { el.pause(); } catch { /* noop */ }
    }
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-[85vw] md:max-w-[65vw] max-h-[70vh] md:max-h-[80vh] flex flex-col"
        onContextMenuCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <DialogTitle>Extract Video Frame</DialogTitle>

        <div className="flex justify-between text-sm text-muted-foreground px-1">
          <span>Time: {formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <video
              ref={videoRef}
              src={video.src}
              controls
              className="max-w-full max-h-full rounded-md border"
              style={{
                maxWidth: `${displayDimensions.maxWidth}px`,
                maxHeight: `${displayDimensions.maxHeight}px`,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              {/* <Button onClick={togglePlay} className="flex items-center gap-2" variant="secondary">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button> */}
              {/* <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.01}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-48"
              /> */}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={extractFirst} disabled={isProcessing} variant="outline" className="h-10">First Frame</Button>
              <Button onClick={extractCurrent} disabled={isProcessing} className="h-10">Current Frame</Button>
              <Button onClick={extractLast} disabled={isProcessing} variant="outline" className="h-10">Last Frame</Button>
              <Button onClick={handleClose} variant="outline" className="flex items-center gap-2 h-10">
                <X className="h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};


