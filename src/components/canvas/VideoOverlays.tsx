import React, { useEffect, useRef } from "react";
import { VideoControls } from "./VideoControls";
import type { PlacedVideo } from "@/types/canvas";
import { Button } from "@/components/ui";
import { Info } from "lucide-react";
interface VideoOverlaysProps {
  videos: PlacedVideo[];
  selectedIds: string[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  hiddenVideoControlsIds: Set<string>;
  setVideos: React.Dispatch<React.SetStateAction<PlacedVideo[]>>;
  isDraggingVideo?: boolean;
  onRequestMetaDialog?: (video: PlacedVideo, meta: Record<string, unknown>) => void;
}

export const VideoOverlays: React.FC<VideoOverlaysProps> = ({
  videos,
  selectedIds,
  viewport,
  hiddenVideoControlsIds,
  setVideos,
  isDraggingVideo,
  onRequestMetaDialog,
}) => {
  // Keep track of video refs
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // 统一的 UI 常量（与 ImageOverlays 对齐的尺寸/边距）
  const ICON_SIZE = 28;              // px（屏幕空间，不跟随缩放）
  const ICON_MARGIN = 6;             // px（画布空间，跟随缩放）

  // Handle play/pause state changes (仅对非 isAudio 的视频生效；找不到元素会直接 return)
  useEffect(() => {
    videos.forEach((video) => {
      const videoEl = videoRefs.current.get(video.id);
      if (!videoEl) return;

      // Handle play/pause - only if state doesn't match
      if (video.isPlaying && videoEl.paused) {
        videoEl.play().catch(() => { });
      } else if (!video.isPlaying && !videoEl.paused) {
        videoEl.pause();
      }

      // Only update properties if they've changed
      if (videoEl.volume !== video.volume) {
        videoEl.volume = video.volume;
      }
      if (videoEl.muted !== video.muted) {
        videoEl.muted = video.muted;
      }
      if (videoEl.loop !== (video.isLooping || false)) {
        videoEl.loop = video.isLooping || false;
      }
    });
  }, [videos]);

  // 固定音频占位渲染
  const renderAudioPlaceholder = (video: PlacedVideo) => {
    const top = video.y * viewport.scale + viewport.y;
    const left = video.x * viewport.scale + viewport.x;
    const width = video.width * viewport.scale;
    const height = video.height * viewport.scale;

    return (
      <div
        key={`audio-${video.id}`}
        style={{
          position: "absolute",
          top,
          left,
          width,
          height,
          zIndex: 10,
          transform: `rotate(${video.rotation || 0}deg)`,
          transformOrigin: "0 0",
          pointerEvents: "none", // 与原 video 一致，避免抢事件
          background:
            "linear-gradient(135deg, rgba(15,15,20,0.9) 0%, rgba(30,30,40,0.9) 100%)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // 轻微描边，便于在复杂背景上看清楚
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
        }}
      >
        {/* 简洁的音频图标（SVG），随容器缩放 */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          role="img"
          width={Math.max(24, Math.min(80, width * 0.35))}
          height={Math.max(24, Math.min(80, height * 0.35))}
        >
          <path
            d="M9 17V7l10-2v10M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.9}
          />
        </svg>
        {/* 角标文字，提示是音频（可选） */}
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 6,
            fontSize: `${Math.max(10, Math.min(12, 12 * Math.sqrt(viewport.scale)))}px`,
            color: "rgba(255,255,255,0.8)",
            letterSpacing: 0.3,
            userSelect: "none",
          }}
        >
          AUDIO
        </div>
      </div>
    );
  };
  const renderMetaButton = (video: PlacedVideo) => {
    const meta: any = (video as any).meta || (video as any).dataMeta || null;
    const hasMeta = Boolean(meta);
    const isSelected = selectedIds.includes(video.id);

    if (!hasMeta || !isSelected) return null;

    // 顶部右侧坐标（不考虑旋转，与 ImageOverlays 一致）
    const top = video.y * viewport.scale + viewport.y + ICON_MARGIN * viewport.scale;
    const left =
      (video.x + video.width) * viewport.scale +
      viewport.x -
      ICON_SIZE -
      ICON_MARGIN * viewport.scale;

    return (
      <Button
        key={`video-meta-${video.id}`}
        type="button"
        aria-label="Show video metadata"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRequestMetaDialog?.(video, meta);
        }}
        size="icon"
        variant="outline"
        style={{
          position: "absolute",
          top,
          left,
          width: ICON_SIZE,
          height: ICON_SIZE,
          zIndex: 11,           // 高于视频/音频占位
          pointerEvents: "auto" // 确保可点
        }}
      >
        <Info className="h-3 w-3" />
      </Button>
    );
  };
  return (
    <>
      {videos.map((video) => (
        <React.Fragment key={`controls-${video.id}`}>
          {/* 当 isAudio = true，用固定图标占位；否则渲染真实 <video> */}
          {video.isAudio ? (
            renderAudioPlaceholder(video)
          ) : (
            <video
              key={`video-${video.id}`}
              id={`video-${video.id}`}
              src={video.src}
              style={{
                position: "absolute",
                top: video.y * viewport.scale + viewport.y,
                left: video.x * viewport.scale + viewport.x,
                width: video.width * viewport.scale,
                height: video.height * viewport.scale,
                zIndex: 10,
                objectFit: "cover",
                // When selected, let Konva transformer receive events
                pointerEvents: selectedIds.includes(video.id) ? "none" : "none",
                transform: `rotate(${video.rotation || 0}deg)`,
                transformOrigin: "0 0",
              }}
              autoPlay={false}
              loop={video.isLooping}
              muted={video.muted}
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              ref={(el) => {
                if (el) {
                  videoRefs.current.set(video.id, el);
                } else {
                  videoRefs.current.delete(video.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();

                // First, select the video if not already selected
                if (!selectedIds.includes(video.id)) {
                  setVideos((prev) => {
                    // 触发一次渲染，外层自己维护 selectedIds
                    return prev;
                  });
                }

                // 将右键事件转发到 Konva canvas
                const konvaContainer = document.querySelector(".konvajs-content");
                if (konvaContainer) {
                  const canvas = konvaContainer.querySelector("canvas");
                  if (canvas) {
                    const event = new MouseEvent("contextmenu", {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: e.clientX,
                      clientY: e.clientY,
                      screenX: e.screenX,
                      screenY: e.screenY,
                      button: 2,
                      buttons: 2,
                    });
                    (event as any).videoId = video.id;
                    canvas.dispatchEvent(event);
                  }
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                const videoEl = e.currentTarget;
                const isPlaying = videoEl.paused ? true : false;
                if (videoEl.paused) {
                  videoEl.play().catch(() => { });
                } else {
                  videoEl.pause();
                }
                setVideos((prev) =>
                  prev.map((v) => (v.id === video.id ? { ...v, isPlaying } : v)),
                );
              }}
              onTimeUpdate={(e) => {
                const videoEl = e.currentTarget;
                // Update more frequently for smooth seek bar, but throttle to 10 times per second
                if (!videoEl.paused) {
                  const currentTenthSecond = Math.floor(videoEl.currentTime * 10);
                  const storedTenthSecond = Math.floor(video.currentTime * 10);

                  if (currentTenthSecond !== storedTenthSecond) {
                    setVideos((prev) =>
                      prev.map((vid) =>
                        vid.id === video.id
                          ? { ...vid, currentTime: videoEl.currentTime }
                          : vid,
                      ),
                    );
                  }
                }
              }}
              onLoadedMetadata={(e) => {
                const ve = e.currentTarget;
                setVideos((prev) =>
                  prev.map((v) =>
                    v.id === video.id
                      ? { ...v, duration: ve.duration, isLoaded: true }
                      : v,
                  ),
                );
              }}
              onEnded={() => {
                if (!video.isLooping) {
                  setVideos((prev) =>
                    prev.map((v) =>
                      v.id === video.id ? { ...v, isPlaying: false, currentTime: 0 } : v,
                    ),
                  );
                }
              }}
            />
          )}

          {/* 播放指示器：仅对非音频、已加载且未播放时显示 */}
          {(!video.isAudio) && !video.isPlaying && video.isLoaded && (
            <div
              className="absolute bg-none text-white px-1 py-0.5"
              style={{
                position: "absolute",
                top: video.y * viewport.scale + viewport.y + 5 * viewport.scale,
                left: video.x * viewport.scale + viewport.x + 5 * viewport.scale,
                zIndex: 10,
                pointerEvents: "none",
                visibility: video.isLoaded ? "visible" : "hidden",
                display: video.isLoaded ? "block" : "none",
                opacity: hiddenVideoControlsIds.has(video.id) ? 0 : 1,
                transition: "opacity 0.05s ease-in-out",
                fontSize: `${Math.max(10, Math.min(20, 20 * Math.sqrt(viewport.scale)))}px`,
              }}
            >
              ▶
            </div>
          )}
          {!isDraggingVideo && renderMetaButton(video)}

          {/* 控制条：保持原有条件（音频/视频都可使用同一套控制逻辑，如果你希望音频不显示，可在此加 !video.isAudio 判断） */}
          {selectedIds.includes(video.id) && selectedIds.length === 1 && (
            <div
              style={{
                position: "absolute",
                top: (video.y + video.height) * viewport.scale + viewport.y + 10,
                left: video.x * viewport.scale + viewport.x,
                zIndex: 10,
                width: Math.max(video.width * viewport.scale, 180),
                opacity: hiddenVideoControlsIds.has(video.id) ? 0 : 1,
                transition: "opacity 0.05s ease-in-out",
              }}
            >
              <VideoControls
                video={video}
                onChange={(newAttrs) => {
                  setVideos((prev) =>
                    prev.map((vid) =>
                      vid.id === video.id ? { ...vid, ...newAttrs } : vid,
                    ),
                  );
                }}
                className="mt-2"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
};
