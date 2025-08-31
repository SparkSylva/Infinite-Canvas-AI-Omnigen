"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PlacedVideo } from '@/types/canvas';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/shadcn-ui/dialog';
import { X } from 'lucide-react';
import { trimAudio, trimVideo, getMediaDuration } from '@/utils/tools/MediaProcess'; 

interface Props {
  video: PlacedVideo; // video.src can be audio or video
  setVideos?: React.Dispatch<React.SetStateAction<PlacedVideo[]>>;
  isOpen: boolean;
  onClose: () => void;
}

const AUDIO_EXTS = ['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'opus', 'wma'];
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'ts'];

function extsFromUrl(url: string): { filename: string; ext: string } {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
    const last = (u.pathname.split('/').pop() || '').split('?')[0].split('#')[0];
    const m = last.match(/\.([a-zA-Z0-9]+)$/);
    return { filename: last || 'media', ext: m ? m[1].toLowerCase() : '' };
  } catch {
    const m = url.match(/\/?([^/?#]+)$/)?.[1] || 'media';
    const extm = m.match(/\.([a-zA-Z0-9]+)$/);
    return { filename: m, ext: extm ? extm[1].toLowerCase() : '' };
  }
}

function formatMMSS(t: number) {
  if (!isFinite(t)) return '00:00';
  const m = Math.floor(t / 60).toString().padStart(2, '0');
  const s = Math.floor(t % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const TrimMediaDialog: React.FC<Props> = ({ video, setVideos, isOpen, onClose }) => {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [start, setStart] = useState<number>(0);
  const [end, setEnd] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  const { maxWidth, maxHeight } = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
    const isMd = vw >= 768;
    const dialogMaxW = isMd ? vw * 0.65 : vw * 0.85;
    const dialogMaxH = isMd ? vh * 0.8 : vh * 0.7;
    const reservedH = 40 + 40 + 140 + 32;
    const reservedW = 32;
    return { maxWidth: Math.max(400, dialogMaxW - reservedW), maxHeight: Math.max(300, dialogMaxH - reservedH) };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const el = mediaRef.current;
    if (!el) return;

    const onLoaded = () => {
      // Prioritize MediaElement's duration, but use getMediaDuration as a fallback (from MediaProcess)
      const d1 = el.duration || 0;
      setDuration(d1);
      setCurrentTime(el.currentTime || 0);
    };
    const onTime = () => setCurrentTime(el.currentTime || 0);

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [isOpen]);

  // On first open, use fetch -> File -> getMediaDuration to get the precise duration
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await fetch(video.src);
        const blob = await res.blob();
        // Try to extract the extension from the URL; if not found, default based on media type
        const { filename, ext } = extsFromUrl(video.src);
        const finalExt = ext || (blob.type.startsWith('audio/') ? 'mp3' : 'mp4');
        const finalName = /\.[a-zA-Z0-9]+$/.test(filename) ? filename : `${filename}.${finalExt}`;
        const file = new File([blob], finalName, { type: blob.type || (finalExt === 'mp3' ? 'audio/mpeg' : 'video/mp4') });
        const d = await getMediaDuration(file);
        setDuration(d || 0);
        setStart(0);
        setEnd(d || 0);
      } catch {
        // On failure, fall back to the media element's duration
        setStart(0);
        setEnd((mediaRef.current?.duration || 0) || 0);
      }
    })();
  }, [isOpen, video.src]);

  const handleClose = useCallback(() => {
    const el = mediaRef.current;
    if (el) {
      try { el.pause(); } catch { /* noop */ }
    }
    onClose();
  }, [onClose]);

  // Visual range bar (highlighted selected area in the middle)
  const RangeBar: React.FC = () => {
    const pctStart = duration ? (start / duration) * 100 : 0;
    const pctEnd = duration ? (end / duration) * 100 : 0;
    return (
      <div className="relative w-full h-3 rounded bg-primary/20 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 bg-primary"
          style={{ left: `${pctStart}%`, width: `${Math.max(0, pctEnd - pctStart)}%` }}
        />
      </div>
    );
  };

  const onStartChange = (v: number) => {
    const minGap = 0.001;
    const newStart = Math.max(0, Math.min(v, Math.max(0, end - minGap)));
    setStart(newStart);
    if (mediaRef.current) mediaRef.current.currentTime = newStart;
  };
  const onEndChange = (v: number) => {
    const minGap = 0.001;
    const newEnd = Math.min(duration, Math.max(v, Math.min(duration, start + minGap)));
    setEnd(newEnd);
    if (mediaRef.current) mediaRef.current.currentTime = Math.min(newEnd, duration);
  };

  const fetchAsFile = useCallback(async (src: string) => {
    const res = await fetch(src);
    const blob = await res.blob();
    const { filename, ext } = extsFromUrl(src);
    const finalExt = ext || (blob.type.startsWith('audio/') ? 'mp3' : 'mp4');
    const finalName = /\.[a-zA-Z0-9]+$/.test(filename) ? filename : `${filename}.${finalExt}`;
    return new File([blob], finalName, { type: blob.type || (finalExt === 'mp3' ? 'audio/mpeg' : 'video/mp4') });
  }, []);

  // Add the trimmed media to the canvas
  const addVideoToCanvas = useCallback(async (outFile: File) => {
    if (!setVideos) return;
    console.log(' addVideoToCanvas outFile', outFile)
    const isAudio = outFile.type.startsWith('audio/') || AUDIO_EXTS.includes(outFile.name.split('.').pop()?.toLowerCase() || '');
    let displayW = 240;
    let displayH = 135; // 16:9 
    if (!isAudio) {
      // Try to read the actual dimensions of the video
      const url = URL.createObjectURL(outFile);
      try {
        const size = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.onloadedmetadata = () => resolve({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
          v.onerror = () => reject(new Error('read video size failed'));
          v.src = url;
        });
        if (size.w && size.h) {
          const ratio = size.w / size.h;
          displayW = 360;
          displayH = Math.round(displayW / ratio);
          if (displayH > 360) {
            displayH = 360;
            displayW = Math.round(displayH * ratio);
          }
        }
      } catch { /* keep default */ }
      finally { URL.revokeObjectURL(url); }
    }

    const objectUrl = URL.createObjectURL(outFile);
    console.log('video', video)
    console.log(' add objectUrl', objectUrl)
    const newVideo: PlacedVideo = {
      id: `trim_${video.id}_${Date.now()}`,
      src: objectUrl,
      x: video.x + video.width + 20,
      y: video.y,
      width: displayW,
      height: displayH,
      rotation: 0,
      isVideo: true,
      currentTime: 0,
      isPlaying: false,
      volume: 1,
      muted: false,
      isAudio: isAudio,
    } as PlacedVideo;
    console.log(' add newVideo', newVideo)
    setVideos((prev) => [...prev, newVideo]);
  }, [setVideos, video.id, video.x, video.y, video.width]);

  const handleTrim = useCallback(async () => {
    if (end <= start) {
      setMsg('End must be greater than Start');
      return;
    }
    setIsProcessing(true);
    setMsg('Preparing...');

    try {
      const file = await fetchAsFile(video.src);
      const { ext } = extsFromUrl(file.name);
      const extLower = (ext || '').toLowerCase();

      const run = AUDIO_EXTS.includes(extLower)
        ? () => trimAudio({ file, start, end, setMessage: setMsg })
        : () => trimVideo({ file, start, end, setMessage: setMsg });

      const outFile = await run();
      console.log(' handleTrim outFile', outFile)
      await addVideoToCanvas(outFile);
      setMsg('Added to canvas');
    } catch (e: any) {
      console.error(e);
      setMsg(e?.message || 'Trim failed');
    } finally {
      setIsProcessing(false);
    }
  }, [addVideoToCanvas, fetchAsFile, video.src, start, end]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-[85vw] md:max-w-[65vw] max-h-[70vh] md:max-h-[80vh] flex flex-col"
        onContextMenuCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <DialogTitle>Trim Media (Audio / Video)</DialogTitle>

        <div className="flex justify-between text-sm text-muted-foreground px-1">
          <span>Time: {formatMMSS(currentTime)} / {formatMMSS(duration)}</span>
          <span>{msg}</span>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Use <video> for preview (audio can also be played) */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            {video.isAudio ? (
              <audio
                ref={mediaRef}
                src={video.src}
                controls
                className="max-w-full max-h-full rounded-md border"
                style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }}
              />
            ) : (
              <video
                ref={mediaRef}
                src={video.src}
                controls
                className="max-w-full max-h-full rounded-md border"
                style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }}
              />)}
          </div>

          {/* Range slider */}
          <div className="flex flex-col gap-3 px-1">
            <RangeBar />

            <div className="relative w-full">
              {/* Double slider: start point */}
           
              <input
                type="range"
                min={0}
                max={Math.max(0, duration - 0.001)}
                step={0.001}
                value={start}
                onChange={(e) => onStartChange(parseFloat(e.target.value))}
                className="w-full appearance-none h-2 bg-transparent pointer-events-auto"
              />
              {/* End point */}
              <input
                type="range"
                min={0.001}
                max={duration || 0}
                step={0.001}
                value={end}
                onChange={(e) => onEndChange(parseFloat(e.target.value))}
                className="w-full -mt-2 appearance-none h-2 bg-transparent pointer-events-auto"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">Start</label>
                <input
                  className="w-full h-10 px-3 rounded border"
                  value={start}
                  onChange={(e) => onStartChange(Number(e.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground">{formatMMSS(start)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm w-24">End</label>
                <input
                  className="w-full h-10 px-3 rounded border"
                  value={end}
                  onChange={(e) => onEndChange(Number(e.target.value) || 0)}
                />
                <span className="text-xs text-muted-foreground">{formatMMSS(end)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleTrim} disabled={isProcessing} className="h-10 w-full">
                  Trim & Add to Canvas
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button onClick={handleClose} variant="outline" className="flex items-center gap-2 h-10">
              <X className="h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
