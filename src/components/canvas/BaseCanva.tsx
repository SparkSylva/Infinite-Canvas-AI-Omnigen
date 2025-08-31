"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Stage, Layer, Rect, Text } from "react-konva";
import Konva from "konva";
import { GithubBadge } from "@/components/canvas/GithubBadge";
import { CanvasImage } from "./CanvasImage";
import { CanvasImageEnhanced } from "./CanvasImageEnhanced";
import CanvasImageMetaDialog from "./CanvasImageMetaDialog";
import CanvasVideoMetaDialog from "./CanvasVideoMetaDialog";
import { ImageEditorDialog } from "./ImageEditorDialog";
import { ImageCropDialog } from "./ImageCropDialog";
import { CanvasVideo } from "./CanvasVideo";
import { VideoFrameExtractDialog } from "./VideoFrameExtractDialog";
import { TrimMediaDialog } from "./TrimMediaDialog";
import { ZoomControls } from "./ZoomControls";
import { VideoOverlays } from "./VideoOverlays";
import { ImageOverlays } from "./ImageOverlays";
import { MiniMap } from "./MiniMap";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { SelectionBoxComponent } from "./SelectionBox";
import { PreviewPlaceholderComponent } from "./PreviewPlaceholder";
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/shadcn-ui/context-menu";
import type { PlacedImage, PlacedVideo, HistoryState, PreviewPlaceholder } from "@/types/canvas";
import HelpPanel from "./HelpPanel";
import {
  handleCombineImages,
  handleWheel,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleFileUpload as handleFileUploadUtil,
  handleSelect,
  handleTouchStart as handleTouchStartUtil,
  handleTouchMove as handleTouchMoveUtil,
  handleTouchEnd as handleTouchEndUtil,
} from "./functions/canvasFunctions";

import { AiAppRef } from '@/components/application/ai-multi-generator-canva';

import { debounce } from "@/utils/canvas/performance";
import { MemoizedAiCanvaApp } from "./MemoizedAICanvaApp";
import { MobileToolbar } from "@/components/canvas/MobileToolbar";


import { useIsMobile } from "@/hooks/use-mobile";
import { ActiveTaskInCanvas } from '@/components/application/recent-generation';

import { handleImageRemoveBackground, handleImageUpcale } from "./functions/handleGeneration/handleImageUtils";

import { handleGeneration_switch } from "@/utils/handleGeneration/handleSwitch";
import { findLabelByModelId } from '@/lib/ai-model-setting/modelSetting';

import { computePlacement, toImageBase64, toVideoBase64 } from "@/utils/tools/generationResultHelper";
import { canvasStorage, type CanvasState, } from "@/lib/storage";
import {
  imageToCanvasElement,
  videoToCanvasElement,
} from "@/utils/canvas/canvas-utils"
import { normalizeToBase64 } from "@/utils/tools/ImagePreProcess";
import { findSettingByModelId } from "@/lib/ai-model-setting/modelSetting";

import { Switch } from "@/components/ui/shadcn-ui/switch";
import { Label } from "@/components/ui/shadcn-ui/label";
import { Button } from "@/components/ui/shadcn-ui/button";

import {
  handleGenerationStart,
  handleGenerationUpdate,
  handleGenerationComplete,
  canStartGeneration,
  getActiveGenerationsCount,
  getMaxConcurrentGenerations
} from '@/utils/handleGeneration/imageQueuePersist'
import { useUserSettingStore } from '@/hooks/stores/user-setting';
import { useSettingValue } from '@/hooks/stores/user-setting';
import { Toaster, toast } from 'sonner';


interface CanvasProps {
  className?: string;
  containerHeight?: string | number;
}

export default function MinimalInfiniteCanvas({ className = "", containerHeight = "100vh" }: CanvasProps) {

  const isMobile = useIsMobile();
  /* ----------------------- user data ralated ----------------------- */
  const tempFalApiKey = useSettingValue<string>("falApiKey");
  const handle_options = {
    isClient: true,
    customApiKey: tempFalApiKey,
  }


  /* ----------------------- image app & refs ----------------------- */
  const aiGenerationAppRef = useRef<AiAppRef>(null);

  const [isPureMode, setIsPureMode] = useState(false);


  /* ----------------------- state & refs ----------------------- */

  const [images, setImages] = useState<PlacedImage[]>([]);
  const [videos, setVideos] = useState<PlacedVideo[]>([]); // 为MiniMap和ContextMenu组件添加videos状态
  const [hiddenVideoControlsIds, setHiddenVideoControlsIds] = useState<
    Set<string>
  >(new Set());
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 });
  // history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // CanvasContextMenu 相关状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");

  const [isolateInputValue, setIsolateInputValue] = useState("");
  const [isIsolating, setIsIsolating] = useState(false);
  const [isolateTarget, setIsolateTarget] = useState<string | null>(null);
  const [croppingImageId, setCroppingImageId] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false,
  });

  // Preview placeholder state
  const [previewPlaceholder, setPreviewPlaceholder] = useState<PreviewPlaceholder>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
    text: "Generation result will display here",
    count: 1
  });


  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({
    width: 1200,
    height: 800,
  });
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isClient, setIsClient] = useState(false);

  // default canvas only load once: read if it has been loaded before
  const hasLoadedDefaultCanvas = useSettingValue<boolean>('canvas_default_loaded') === true;

  // Show preview placeholder for generation
  const showPreviewPlaceholder = useCallback((count: number = 1, text?: string) => {
    // Use the same placement logic as computePlacement for consistency
    const naturalWidth = 300; // Default width for preview
    const naturalHeight = 300; // Default height for preview
    const { x, y, width, height } = computePlacement(
      naturalWidth,
      naturalHeight,
      0, // First index for preview
      viewport,
      canvasSize
    );

    // Calculate total area needed for multiple items
    const totalWidth = count > 1 ? width + (count - 1) * 20 : width;
    const totalHeight = count > 1 ? height + (count - 1) * 20 : height;

    setPreviewPlaceholder({
      x,
      y,
      width: totalWidth,
      height: totalHeight,
      visible: true,
      text: text || "Generation result will display here",
      count
    });
  }, [viewport, canvasSize]);

  // Hide preview placeholder
  const hidePreviewPlaceholder = useCallback(() => {
    setPreviewPlaceholder(prev => ({ ...prev, visible: false }));
  }, []);
  // Mobile touch helpers
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);
  const [isTouchingImage, setIsTouchingImage] = useState(false);

  // Meta dialog state
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [metaDialogImage, setMetaDialogImage] = useState<PlacedImage | null>(null);
  const [metaDialogMeta, setMetaDialogMeta] = useState<Record<string, unknown> | null>(null);
  const [metaDialogVideoOpen, setMetaDialogVideoOpen] = useState(false);
  const [metaDialogVideo, setMetaDialogVideo] = useState<PlacedVideo | null>(null);



  // Image editor dialog state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTargetImage, setEditorTargetImage] = useState<PlacedImage | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetImage, setCropTargetImage] = useState<PlacedImage | null>(null);
  const [isVideoFrameDialogOpen, setIsVideoFrameDialogOpen] = useState(false);
  const [isTrimMediaDialogOpen, setIsTrimMediaDialogOpen] = useState(false);
  const [processTargetVideo, setProcessTargetVideo] = useState<PlacedVideo | null>(null);

  const isDragging = useMemo(() => {
    return isDraggingCanvas || isDraggingImage || isDraggingVideo;
  }, [isDraggingCanvas, isDraggingImage, isDraggingVideo]);

  // when the outer menu or double-clicking sets the croppingImageId, open a new Crop Dialog
  useEffect(() => {
    if (!croppingImageId) return;
    const img = images.find((i) => i.id === croppingImageId);
    if (img) {
      setCropTargetImage(img);
      setIsCropOpen(true);
    }
    // reset old state, avoid outer component thinking it is still cropping
    setCroppingImageId(null);
  }, [croppingImageId, images]);


  useEffect(() => {
    setIsClient(true);
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height
        });
      } else {
        // Fallback to window dimensions if container not available
        setCanvasSize({
          width: window.innerWidth,
          height: window.innerHeight - 200 // Reserve space for header/footer
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver: ResizeObserver;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [])
  // Prevent body scrolling on mobile
  useEffect(() => {
    if (isPureMode) {
      // Prevent scrolling on mobile when in pure mode
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      // Restore normal scrolling when not in pure mode
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }

    // Cleanup function: always restore original styles when component unmounts
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isPureMode]);
  // Save state to history
  const saveToHistory = useCallback(() => {
    const newState = {
      images: [...images],
      videos: [...videos],
      selectedIds: [...selectedIds],
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [images, videos, selectedIds, history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setImages(prevState.images);
      setVideos(prevState.videos || []);
      setSelectedIds(prevState.selectedIds);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setImages(nextState.images);
      setVideos(nextState.videos || []);
      setSelectedIds(nextState.selectedIds);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Save initial state
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory();
    }
  }, []);

  // Set canvas ready state after mount
  useEffect(() => {
    // Only set canvas ready after we have valid dimensions
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      setIsCanvasReady(true);
    }
  }, [canvasSize]);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    updateCanvasSize();

    // Update on resize
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);
  /* ----------------------- storage ---------------------------- */
  // Save current state to storage
  const saveToStorage = useCallback(async () => {
    try {
      // setIsSaving(true);

      // Save canvas state (positions, transforms, etc.)
      const canvasState: CanvasState = {
        elements: [
          ...images.map(imageToCanvasElement),
          ...videos.map(videoToCanvasElement),
        ],
        backgroundColor: "#ffffff",
        lastModified: Date.now(),
        viewport: viewport,
      };
      canvasStorage.saveCanvasState(canvasState);

      // Save actual image data to IndexedDB
      for (const image of images) {
        // Skip if it's a placeholder for generation
        if (
          image.src.startsWith("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP")
        )
          continue;

        // Check if we already have this image stored
        const existingImage = await canvasStorage.getImage(image.id);
        if (!existingImage) {
          const base64 = await normalizeToBase64([image.src]);
          await canvasStorage.saveImage(base64[0], image.id, image?.meta || {});
        }
      }

      // Save video data to IndexedDB
      for (const video of videos) {
        // Skip if it's a placeholder for generation
        if (
          video.src.startsWith("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP")
        )
          continue;

        // Check if we already have this video stored
        const existingVideo = await canvasStorage.getVideo(video.id);
        if (!existingVideo) {
      
          const base64 = await normalizeToBase64([video.src]);
  
          await canvasStorage.saveVideo(base64[0], video.duration, video.id, video?.isAudio, video?.meta);
        }
      }

      // Clean up unused images and videos
      await canvasStorage.cleanupOldData();

      // Brief delay to show the indicator
      // setTimeout(() => setIsSaving(false), 300);
    } catch (error) {
      console.error("Failed to save to storage:", error);
      // setIsSaving(false);
    }
  }, [images, videos, viewport]);

  // Load state from storage
  const loadFromStorage = useCallback(async () => {
    try {
      const canvasState = canvasStorage.getCanvasState();
      if (!canvasState) {
        setIsStorageLoaded(true);
        return;
      }

      const loadedImages: PlacedImage[] = [];
      const loadedVideos: PlacedVideo[] = [];

      for (const element of canvasState.elements) {
        if (element.type === "image" && element.imageId) {
          const imageData = await canvasStorage.getImage(element.imageId);
  
          if (imageData) {
            loadedImages.push({
              id: element.id,
              src: imageData.originalDataUrl,
              x: element.transform.x,
              y: element.transform.y,
              width: element.width || 300,
              height: element.height || 300,
              rotation: element.transform.rotation,
              ...(element.transform.cropBox && {
                cropX: element.transform.cropBox.x,
                cropY: element.transform.cropBox.y,
                cropWidth: element.transform.cropBox.width,
                cropHeight: element.transform.cropBox.height,
              }),
              meta: imageData?.meta,
            });
          }
        } else if (element.type === "video" && element.videoId) {
          const videoData = await canvasStorage.getVideo(element.videoId);

          if (videoData) {
            loadedVideos.push({
              id: element.id,
              src: videoData.originalDataUrl,
              x: element.transform.x,
              y: element.transform.y,
              width: element.width || 300,
              height: element.height || 300,
              rotation: element.transform.rotation,
              isVideo: true,
              duration: element.duration || videoData.duration,
              currentTime: element.currentTime || 0,
              isPlaying: element.isPlaying || false,
              volume: element.volume || 1,
              muted: element.muted || false,
              isLoaded: false, // Initialize as not loaded
              ...(element.transform.cropBox && {
                cropX: element.transform.cropBox.x,
                cropY: element.transform.cropBox.y,
                cropWidth: element.transform.cropBox.width,
                cropHeight: element.transform.cropBox.height,
              }),
              meta: videoData?.meta,
              isAudio: videoData?.isAudio,
            });
          }
        } else if (element.type === "audio" && element.videoId) {
          const videoData = await canvasStorage.getVideo(element.videoId);
          if (videoData) {
            loadedVideos.push({
              id: element.id,
              src: videoData.originalDataUrl,
              x: element.transform.x,
              y: element.transform.y,
              width: element.width || 300,
              height: element.height || 300,
              rotation: element.transform.rotation,
              isVideo: false,
              duration: element.duration || videoData.duration,
              currentTime: element.currentTime || 0,
              isPlaying: element.isPlaying || false,
              volume: element.volume || 1,
              muted: element.muted || false,
              isLoaded: false, // Initialize as not loaded
              ...(element.transform.cropBox && {
                cropX: element.transform.cropBox.x,
                cropY: element.transform.cropBox.y,
                cropWidth: element.transform.cropBox.width,
                cropHeight: element.transform.cropBox.height,
              }),
              meta: videoData?.meta,
              isAudio: true,
            });
          }
        }
      }

      // Set loaded images and videos
      if (loadedImages.length > 0) {
        setImages(loadedImages);
      }

      if (loadedVideos.length > 0) {
        setVideos(loadedVideos);
      }

      // Restore viewport if available
      if (canvasState.viewport) {
        setViewport(canvasState.viewport);
      }
    } catch (error) {
      console.error("Failed to load from storage:", error);
      toast.error("Failed to restore canvas");
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  // Load from storage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Auto-save to storage when images change (with debounce)
  useEffect(() => {
    if (!isStorageLoaded) return; // Don't save until we've loaded


    const timeoutId = setTimeout(() => {
      saveToStorage();
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timeoutId);
  }, [
    images,
    viewport,
    isStorageLoaded,
    saveToStorage,
  ]);

  // Load default images only if no saved state
  useEffect(() => {
    if (!isStorageLoaded) return;
    if (images.length > 0 && videos.length > 0) return; // Already have images from storage
    if (hasLoadedDefaultCanvas) return; // the default canvas has been loaded, so no need to load again
    const loadDefaultCanvas = async () => {
      try {
        const canva_state_json = await fetch('https://assets.aiomnigen.com/aiomnigen/assets/canvas-default.json').then(res => res.json())
        await canvasStorage.importCanvasData(canva_state_json)
        // mark that the default canvas has been loaded (persistent)
        useUserSettingStore.getState().setSetting('canvas_default_loaded', true, {
          persistent: true,
          category: 'canvas',
          description: 'Default canvas imported once'
        });
        loadFromStorage();
      } catch (err) {
        console.error('Failed to load default canvas:', err)
      }
    }

    loadDefaultCanvas()
    // loadDefaultVideos();
    // loadDefaultImages();
  }, [isStorageLoaded, hasLoadedDefaultCanvas]);


  /* ----------------------- helpers ---------------------------- */

  const handleExportCanvasData = useCallback(async () => {
    try {
      const data = await canvasStorage.exportCanvasData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `canvas_export_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Exported successfully, download started');
    } catch (error) {
      console.error('Failed to export canvas data:', error);
      toast.error('Export failed, please try again');
    }
  }, []);
  const handleImportCanvasData = useCallback(async () => {
    // try {
    //   const import_file_json = await fetch('https://url-to-import/canvas-state.json').then(res => res.json())
    //   await canvasStorage.importCanvasData(import_file_json);
    //   loadFromStorage();
    // } catch (error) {
    //   console.error('Failed to export canvas data:', error);
    //   toast.error('Export failed, please try again');
    // }
  }, []);


  const handleDelete = () => {
    // Save to history before deleting
    saveToHistory();
    setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
    setVideos((prev) => prev.filter((vid) => !selectedIds.includes(vid.id)));
    setSelectedIds([]);
  };
  const handleDuplicate = () => {
    // Save to history before duplicating
    saveToHistory();

    // Duplicate selected images
    const selectedImages = images.filter((img) => selectedIds.includes(img.id));
    const newImages = selectedImages.map((img) => ({
      ...img,
      id: `img-${Date.now()}-${Math.random()}`,
      x: img.x + 20,
      y: img.y + 20,
    }));

    // Duplicate selected videos
    const selectedVideos = videos.filter((vid) => selectedIds.includes(vid.id));
    const newVideos = selectedVideos.map((vid) => ({
      ...vid,
      id: `vid-${Date.now()}-${Math.random()}`,
      x: vid.x + 20,
      y: vid.y + 20,
      // Reset playback state for duplicated videos
      currentTime: 0,
      isPlaying: false,
    }));

    // Update both arrays
    setImages((prev) => [...prev, ...newImages]);
    setVideos((prev) => [...prev, ...newVideos]);

    // Select all duplicated items
    const newIds = [
      ...newImages.map((img) => img.id),
      ...newVideos.map((vid) => vid.id),
    ];
    setSelectedIds(newIds);
  };

  // Track which image IDs are assigned to which form fields
  const [assignedImageIds, setAssignedImageIds] = useState<Map<string, string[]>>(new Map());
  // Keep a ref to always read the latest assignedImageIds inside debounced callback
  const assignedImageIdsRef = useRef<Map<string, string[]>>(new Map());
  useEffect(() => {
    assignedImageIdsRef.current = assignedImageIds;
  }, [assignedImageIds]);

  const debouncedSendToAiAppRef = useRef(
    debounce((selectedImages: PlacedImage[]) => {
      const modelConfig = aiGenerationAppRef?.current?.getSelectedModelConfig();

      const imageSupports: Array<{ name: string; isSupport: number }> = [];
      if (modelConfig?.supportAddFiles && modelConfig.supportAddFiles.length > 0) {
        modelConfig.supportAddFiles
          .filter((s: any) => s?.type === 'image')
          .forEach((s: any) => imageSupports.push({ name: s.name, isSupport: Math.max(0, s.isSupport || 0) }));
      }

      // If we have declared supports, intelligently distribute images
      if (imageSupports.length > 0) {
        const selectedImageIds = selectedImages.map(img => img.id);
        const selectedImageMap = new Map(selectedImages.map(img => [img.id, img.src]));
        // Use latest assigned map from ref to avoid stale closure
        const newAssignedImageIds = new Map(assignedImageIdsRef.current);

        imageSupports.forEach(({ name, isSupport }) => {
          const count = Math.max(0, isSupport);
          if (count > 0) {
            // Get currently assigned image IDs for this field
            const currentAssignedIds = newAssignedImageIds.get(name) || [];

            // Filter out IDs that are no longer selected
            let stillSelectedIds = currentAssignedIds.filter(id => selectedImageIds.includes(id));
            // Respect capacity shrink: keep only first N already-assigned
            if (stillSelectedIds.length > count) {
              stillSelectedIds = stillSelectedIds.slice(0, count);
            }

            // Calculate how many more images we can add
            const remainingSlots = Math.max(0, count - stillSelectedIds.length);

            // Find new image IDs that haven't been assigned to any field yet
            const allAssignedIds = Array.from(newAssignedImageIds.values()).flat();
            const unassignedIds = selectedImageIds.filter(id => !allAssignedIds.includes(id));

            // Take as many unassigned images as we have slots for
            const newIds = unassignedIds.slice(0, remainingSlots);

            // Combine existing (still selected) + new images
            const finalAssignedIds = [...stillSelectedIds, ...newIds];

            // Update the assignment tracking
            newAssignedImageIds.set(name, finalAssignedIds);

            // Convert IDs to src URLs and set form value
            const finalImages = finalAssignedIds.map(id => selectedImageMap.get(id)).filter(Boolean);
            aiGenerationAppRef?.current?.setValue(name, finalImages);
          }
        });

        // Update the state with new assignments
        setAssignedImageIds(newAssignedImageIds);
        return;
      }

      // If no image supports declared, do nothing
    }, 500)
  );
  // Keep the original selection order to drive allocation order
  const selectedIdsKey = useMemo(() => {
    return selectedIds.join(',');
  }, [selectedIds]);




  useEffect(() => {
    // Build selected images preserving the order of selectedIds
    const orderedSelectedImages = selectedIds
      .map((id) => images.find((img) => img.id === id))
      .filter(Boolean) as PlacedImage[];
    if (orderedSelectedImages.length > 0 && aiGenerationAppRef?.current) {
      debouncedSendToAiAppRef.current(orderedSelectedImages);
    }
  }, [selectedIdsKey, aiGenerationAppRef]);

  const selectAllItems = useCallback(() => {
    setSelectedIds(images.map(img => img.id).concat(videos.map(vid => vid.id)));
    // toast.info(`Selected ${images.length + videos.length} elements`);
  }, [images, videos]);

  // 取消选择
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Group drag move handler: move all selected items (images + videos) together
  const onGroupDragMove = useCallback(
    (activeId: string, nodeX: number, nodeY: number) => {
      const startPosOfActive = dragStartPositions.get(activeId);
      if (!startPosOfActive) return;

      const deltaX = nodeX - startPosOfActive.x;
      const deltaY = nodeY - startPosOfActive.y;

      setImages((prev) =>
        prev.map((img) => {
          if (!selectedIds.includes(img.id)) return img;
          const imgStartPos = dragStartPositions.get(img.id);
          if (!imgStartPos) return img;
          if (img.id === activeId) {
            return { ...img, x: nodeX, y: nodeY };
          }
          return { ...img, x: imgStartPos.x + deltaX, y: imgStartPos.y + deltaY };
        }),
      );

      setVideos((prev) =>
        prev.map((vid) => {
          if (!selectedIds.includes(vid.id)) return vid;
          const vidStartPos = dragStartPositions.get(vid.id);
          if (!vidStartPos) return vid;
          if (vid.id === activeId) {
            return { ...vid, x: nodeX, y: nodeY };
          }
          return { ...vid, x: vidStartPos.x + deltaX, y: vidStartPos.y + deltaY };
        }),
      );
    },
    [dragStartPositions, setImages, setVideos, selectedIds],
  );



  const handleOnGenerate = async (handleInput: any) => {

    const { userInputData, setGenerationSrc } = handleInput;
    const handleCallBack = async ({
      generationResult,
      type = 'image',
    }: {
      generationResult: any;
      type: "image" | "video";
    }) => {

      const idsAdded: string[] = [];
      const dataMeta = {
        model_id: userInputData.model_id,
        model: findLabelByModelId(userInputData.model_id),
        prompt: userInputData.prompt_process || userInputData.prompt || "",
        created_at: new Date().toISOString(),
      }

      if (type === "image") {

        // 1) concurrent fetch all base64 data url (invalid/failed items return null)
        const tasks = generationResult.map(async (img: any, originalIndex: number) => {
          const imageUrl = img?.url;
          if (!imageUrl) return null;

          const base64Result = await toImageBase64(imageUrl);
          if (!base64Result) return null;

          const { base64, naturalWidth, naturalHeight, mime } = base64Result;
          return { imageUrl, base64, naturalWidth, naturalHeight, mime, originalIndex };
        });

        const results = await Promise.all(tasks);

        // === A. setGenerationSrc：展示用数据（优先用 blob 的 objectUrl；失败则用原始 URL） ===
        const displayImages = results.map((r, i) => {
          const safeUrl = r?.base64 ?? generationResult[i]?.url ?? "";
          return {
            generationUrl: safeUrl,
            input: dataMeta,
            type: "image" as const,
          };
        });

        setGenerationSrc?.({ data: displayImages });

        // 2) filter failed items, and calculate placement and generate elements in "success order"
        const successful = results.filter(Boolean) as Array<{
          imageUrl: string;
          base64: string;
          naturalWidth: number;
          naturalHeight: number;
          mime: string;
          originalIndex: number;
        }>;

        if (successful.length === 0) return;

        const elementsToAdd = successful.map((item, successIndex) => {
          const { naturalWidth, naturalHeight, base64, imageUrl } = item;
          // use successIndex as the grid/waterfall flow number, avoid empty spots in the middle
          const { x, y, width, height } = computePlacement(
            naturalWidth,
            naturalHeight,
            successIndex,
            viewport,
            canvasSize
          );

          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `img-${Date.now()}-${Math.random()}`;

          idsAdded.push(id);

          return {
            id,
            src: base64,
            x,
            y,
            width,
            height,
            rotation: 0,
            isGenerated: true,
            meta: dataMeta,
          };
        });

        setImages?.((prev) => [...prev, ...elementsToAdd]);

        setIsGenerating?.(false);
      } else if (type === "video") {

        // 1) concurrent fetch all video base64 data url (failed return null)
        const tasks = generationResult.map(async (video: any, originalIndex: number) => {
          const videoUrl = video?.url;
          if (!videoUrl) return null;

          const processResult = await toVideoBase64(videoUrl);
          if (!processResult) return null;

          const { base64, naturalWidth, naturalHeight, duration, mime } = processResult;
          return { videoUrl, base64, naturalWidth, naturalHeight, duration, mime, originalIndex };
        });

        const results = await Promise.all(tasks);

        // === A. setGenerationSrc：show data bottom
        const blobDisplayVideos = results.map((r, i) => {
          const safeUrl = r?.base64 ?? generationResult[i]?.url ?? "";
          return {
            generationUrl: safeUrl,
            input: dataMeta,
            type: "video" as const,
          };
        });

        setGenerationSrc?.({ data: blobDisplayVideos, type: 'videos' });

        // 2) filter failed items
        const successful = results.filter(Boolean) as Array<{
          videoUrl: string;
          base64: string;
          naturalWidth: number;
          naturalHeight: number;
          duration: number;
          mime: string;
          originalIndex: number;
        }>;

        if (successful.length === 0) return;

        // 3) convert to PlacedVideo elements, calculate placement
        const elementsToAdd = successful.map((item, successIndex) => {
          const { naturalWidth, naturalHeight, base64, duration } = item;

          const { x, y, width, height } = computePlacement(
            naturalWidth,
            naturalHeight,
            successIndex,
            viewport,
            canvasSize
          );

          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `vid-${Date.now()}-${Math.random()}`;

          idsAdded.push(id);

          return {
            id,
            src: base64,
            x,
            y,
            width,
            height,
            rotation: 0,
            isVideo: true,
            duration: duration,
            currentTime: 0,
            isPlaying: false,
            volume: 1,
            muted: false,
            isLooping: false,
            isLoaded: true,
            meta: dataMeta,
          };
        });

        setVideos?.((prev) => [...prev, ...elementsToAdd]);

        setIsGenerating?.(false);




        // setVideos((prev) => [...prev, generationResult]);
      }
      // add to canvas
      // console.log('handleCallBack', generationResult)
    }

    const finalHandleInput = {
      ...handleInput,
      handleCallBack,
      setGenerationSrc: null,
    }

    // Show preview placeholder before generation starts
    const isImageGeneration = finalHandleInput.userInputData?.type?.toLowerCase() === 'image' ||
      !finalHandleInput.userInputData?.type; // Default to image if not specified
    const generateCount = finalHandleInput.userInputData?.numImages || 1;

    if (isImageGeneration) {
      showPreviewPlaceholder(generateCount, "Generating...");
    } else {
      showPreviewPlaceholder(1, "Generating...");
    }

    // handleInput.setIsGenerating && handleInput.setIsGenerating(false)
    await handleGeneration_switch(finalHandleInput)

    // Hide preview placeholder after generation completes
    hidePreviewPlaceholder();

    setViewport({
      x: 0,
      y: 0,
      scale: 1,
    })
  };

  const handleImageEditor = useCallback((id: string) => {
    const img = images.find(i => i.id === id);
    if (!img) return;
    setEditorTargetImage(img);
    setIsEditorOpen(true);
  }, [images]);


  const handleOpenVideoFrameExtract = useCallback((videoId: string) => {
    const vid = videos.find(v => v.id === videoId) || null;
    if (!vid) return;
    setProcessTargetVideo(vid);
    setIsVideoFrameDialogOpen(true);
  }, [videos]);

  const handleOpenTrimMedia = useCallback((videoId: string) => {
    const vid = videos.find(v => v.id === videoId) || null;
    if (!vid) return;
    setProcessTargetVideo(vid);
    setIsTrimMediaDialogOpen(true);
  }, [videos]);

  // 图层管理函数

  const sendToFront = useCallback(() => {
    if (selectedIds.length === 0) return;

    const includesImage = images.some((img) => selectedIds.includes(img.id));
    const includesVideo = videos.some((vid) => selectedIds.includes(vid.id));

    saveToHistory();

    if (includesImage && !includesVideo) {
      setImages((prev) => {
        const selectedImages = selectedIds
          .map((id) => prev.find((img) => img.id === id))
          .filter(Boolean) as PlacedImage[];
        const remainingImages = prev.filter((img) => !selectedIds.includes(img.id));
        return [...remainingImages, ...selectedImages];
      });
    } else if (includesVideo && !includesImage) {
      setVideos((prev) => {
        const selectedVideos = selectedIds
          .map((id) => prev.find((v) => v.id === id))
          .filter(Boolean) as PlacedVideo[];
        const remainingVideos = prev.filter((v) => !selectedIds.includes(v.id));
        return [...remainingVideos, ...selectedVideos];
      });
    }
  }, [selectedIds, images, videos, saveToHistory]);

  const sendToBack = useCallback(() => {
    if (selectedIds.length === 0) return;

    const includesImage = images.some((img) => selectedIds.includes(img.id));
    const includesVideo = videos.some((vid) => selectedIds.includes(vid.id));

    saveToHistory();

    if (includesImage && !includesVideo) {
      setImages((prev) => {
        const selectedImages = selectedIds
          .map((id) => prev.find((img) => img.id === id))
          .filter(Boolean) as PlacedImage[];
        const remainingImages = prev.filter((img) => !selectedIds.includes(img.id));
        return [...selectedImages, ...remainingImages];
      });
    } else if (includesVideo && !includesImage) {
      setVideos((prev) => {
        const selectedVideos = selectedIds
          .map((id) => prev.find((v) => v.id === id))
          .filter(Boolean) as PlacedVideo[];
        const remainingVideos = prev.filter((v) => !selectedIds.includes(v.id));
        return [...selectedVideos, ...remainingVideos];
      });
    }
  }, [selectedIds, images, videos, saveToHistory]);

  const bringForward = useCallback(() => {
    if (selectedIds.length === 0) return;

    const includesImage = images.some((img) => selectedIds.includes(img.id));
    const includesVideo = videos.some((vid) => selectedIds.includes(vid.id));

    saveToHistory();

    if (includesImage && !includesVideo) {
      setImages((prev) => {
        const result = [...prev];
        for (let i = result.length - 2; i >= 0; i--) {
          if (selectedIds.includes(result[i].id) && !selectedIds.includes(result[i + 1].id)) {
            [result[i], result[i + 1]] = [result[i + 1], result[i]];
          }
        }
        return result;
      });
    } else if (includesVideo && !includesImage) {
      setVideos((prev) => {
        const result = [...prev];
        for (let i = result.length - 2; i >= 0; i--) {
          if (selectedIds.includes(result[i].id) && !selectedIds.includes(result[i + 1].id)) {
            [result[i], result[i + 1]] = [result[i + 1], result[i]];
          }
        }
        return result;
      });
    }
  }, [selectedIds, images, videos, saveToHistory]);

  const sendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;

    const includesImage = images.some((img) => selectedIds.includes(img.id));
    const includesVideo = videos.some((vid) => selectedIds.includes(vid.id));

    saveToHistory();

    if (includesImage && !includesVideo) {
      setImages((prev) => {
        const result = [...prev];
        for (let i = 1; i < result.length; i++) {
          if (selectedIds.includes(result[i].id) && !selectedIds.includes(result[i - 1].id)) {
            [result[i], result[i - 1]] = [result[i - 1], result[i]];
          }
        }
        return result;
      });
    } else if (includesVideo && !includesImage) {
      setVideos((prev) => {
        const result = [...prev];
        for (let i = 1; i < result.length; i++) {
          if (selectedIds.includes(result[i].id) && !selectedIds.includes(result[i - 1].id)) {
            [result[i], result[i - 1]] = [result[i - 1], result[i]];
          }
        }
        return result;
      });
    }
  }, [selectedIds, images, videos, saveToHistory]);

  const handleFileUpload = (
    files: FileList | null,
    position?: { x: number; y: number },
  ) => {
    handleFileUploadUtil(files, position, viewport, canvasSize, setImages, setVideos);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // Get drop position relative to the stage
    const stage = stageRef.current;
    if (stage) {
      const container = stage.container();
      const rect = container.getBoundingClientRect();
      const dropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      handleFileUpload(e.dataTransfer.files, dropPosition);
    } else {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // keyboard shortcut handle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input element
      const isInputElement =
        e.target && (e.target as HTMLElement).matches("input, textarea");

      // select all Ctrl+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInputElement) {
        e.preventDefault();
        selectAllItems();
      }
      // undo Ctrl+Z
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // redo Ctrl+Y or Ctrl+Shift+Z
      else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }
      // delete Deletee/Backspace .key === 'Delete'
      else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputElement) {
        e.preventDefault();
        handleDelete();
      }
      // copy Ctrl+D
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'v') && !isInputElement) {
        e.preventDefault();
        handleDuplicate();
      }
      // cancel selection Escape
      else if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectAllItems, handleDelete, handleDuplicate, clearSelection, undo, redo]);

  // Touch event handlers for mobile (pinch-to-zoom + pan) moved to canvasFunctions

  /* ----------------------- image utils handle ----------------------- */
  const handleCanvasImageRemoveBackground = async (image: PlacedImage) => {

    const model_id = "image-remove-bg-imageutils"
    const model_setting = findSettingByModelId(model_id)
    if (!model_setting) {
      toast.error("Model not found")
      return
    }
    if (!handle_options.customApiKey) {
      toast.error("API key is required")
      return
    }
    let generationId = crypto.randomUUID();
    try {
      generationId = handleGenerationStart(
        {
          prompt: "remove background",
          model_id: model_id,
          type: "image",
        },
      ) as string;
      if (!generationId) {
        throw new Error('You have reached the maximum number of concurrent generations');
      }

      showPreviewPlaceholder(1, "Removing background...");
      setGenerationStatus?.('')
      await handleImageRemoveBackground({
        image,
        setImages,
        viewport,
        canvasSize,
        setGenerationStatus,
        options: handle_options,
      });


    } catch (err: any) {
      toast.error(err?.message || 'Some Unkonw erro happened');
      console.error('imageUpScale error', err)
      setGenerationStatus?.(err?.message || 'Some Unkonw erro happened')
    } finally {
      handleGenerationComplete(
        generationId,
      );
      // Hide preview placeholder after generation completes
      hidePreviewPlaceholder();
    }

  }
  const handleCanvasImageUpcale = async (image: PlacedImage) => {

    const model_id = "image-upscale-recraft-crisp"
    const model_setting = findSettingByModelId(model_id)
    if (!model_setting) {
      toast.error("Model not found")
      return
    }
    if (!handle_options.customApiKey) {
      toast.error("API key is required")
      return
    }
    let generationId = crypto.randomUUID();
    try {
      generationId = handleGenerationStart(
        {
          prompt: "upscale image",
          model_id: model_id,
          type: "image",
        }) as string;
      if (!generationId) {
        throw new Error('You have reached the maximum number of concurrent generations');
      }

      showPreviewPlaceholder(1, "Generating...");
      setGenerationStatus?.('')
      await handleImageUpcale({
        image,
        setImages,
        viewport,
        canvasSize,
        setGenerationStatus,
        options: handle_options,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Some Unkonw erro happened');
      console.error('imageUpScale error', err)
      setGenerationStatus?.(err?.message || 'Some Unkonw erro happened')

    } finally {
      handleGenerationComplete(
        generationId,
      );
      // Hide preview placeholder after generation completes
      hidePreviewPlaceholder();
    }
  }
  /* ----------------------- JSX ------------------------------- */
  if (!isClient) {
    return (
      <div
        className={`w-full flex items-center justify-center border rounded-lg ${className}`}
        style={{ height: containerHeight }}
      >
        <div className="">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative select-none">
      <Toaster
        position="top-center"

        offset={{ top: '30%' }}
        richColors

      />
      {/* !isMobile || */}
      {true && (
        <div
          ref={containerRef}
          className={`relative bg-white rounded-lg overflow-hidden w-full ${className}`}
          style={{ height: containerHeight }}
          // onDrop={e => {
          //   e.preventDefault();
          //   if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          // }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onDragLeave={(e) => e.preventDefault()}
        >
          <ContextMenu
            onOpenChange={(open) => {
              if (!open) {

              }
            }}
          >
            <ContextMenuTrigger asChild>
              <div
                className="relative bg-background overflow-hidden w-full h-full"
                style={{
                  height: `${canvasSize.height}px`,
                  width: `${canvasSize.width}px`,
                  minHeight: `${canvasSize.height}px`,
                  minWidth: `${canvasSize.width}px`,
                  cursor: "default",
                  WebkitTouchCallout: "none",
                  touchAction: "none",
                }}
              >
                <Stage
                  ref={stageRef}
                  width={canvasSize.width}
                  height={canvasSize.height}
                  x={viewport.x}
                  y={viewport.y}
                  scaleX={viewport.scale}
                  scaleY={viewport.scale}
                  draggable={false}
                  onMouseDown={(e) => handleMouseDown(e, stageRef, viewport, setIsDraggingCanvas, setCanvasDragStart, clearSelection, setIsSelecting, setSelectionBox)}
                  onMouseMove={(e) => handleMouseMove(e, stageRef, isDraggingCanvas, canvasDragStart, setViewport, setCanvasDragStart, isSelecting, viewport, setSelectionBox)}
                  onMouseUp={(e) => handleMouseUp(isDraggingCanvas, setIsDraggingCanvas, isSelecting, selectionBox, images, videos, setSelectedIds, toast, setIsSelecting, setSelectionBox)}
                  onTouchStart={(e) => handleTouchStartUtil(
                    e,
                    stageRef,
                    viewport,
                    images,
                    setLastTouchDistance,
                    setLastTouchCenter,
                    setIsTouchingImage
                  )}
                  onTouchMove={(e) => handleTouchMoveUtil(
                    e,
                    stageRef,
                    viewport,
                    setViewport,
                    lastTouchDistance,
                    lastTouchCenter,
                    setLastTouchDistance,
                    setLastTouchCenter,
                    isSelecting,
                    isDraggingImage,
                    isTouchingImage
                  )}
                  onTouchEnd={(e) => handleTouchEndUtil(
                    e,
                    setLastTouchDistance,
                    setLastTouchCenter,
                    setIsTouchingImage
                  )}
                  onContextMenu={e => {
                    // check if clicked image
                    const stage = e.target.getStage();
                    if (!stage) return;

                    const point = stage.getPointerPosition();
                    if (!point) return;

                    // convert to canvas coordinate
                    const canvasPoint = {
                      x: (point.x - viewport.x) / viewport.scale,
                      y: (point.y - viewport.y) / viewport.scale,
                    };

                    // check if clicked image (check from back to front, get the topmost image)
                    const clickedImage = [...images].reverse().find((img) => {
                      return (
                        canvasPoint.x >= img.x &&
                        canvasPoint.x <= img.x + img.width &&
                        canvasPoint.y >= img.y &&
                        canvasPoint.y <= img.y + img.height
                      );
                    });

                    if (clickedImage) {
                      if (!selectedIds.includes(clickedImage.id)) {
                        // if clicked image is not selected, only select that image
                        setSelectedIds([clickedImage.id]);
                      }
                      // keep current selection for multi-select context menu
                    }
                  }}
                  onWheel={(e) => handleWheel(e, stageRef, viewport, setViewport)}
                >
                  <Layer>
                    {/* selection box */}
                    <SelectionBoxComponent selectionBox={selectionBox} />

                    {/* preview placeholder */}
                    <PreviewPlaceholderComponent
                      placeholder={previewPlaceholder}
                      viewport={viewport}
                    />

                    {/* render images */}
                    {images.map((image) => (
                      <CanvasImageEnhanced
                        key={image.id}
                        image={image}
                        isSelected={selectedIds.includes(image.id)}
                        onSelect={(e) => handleSelect(image.id, e, setSelectedIds)}
                        onChange={(newAttrs) => {
                          setImages((prev) =>
                            prev.map((img) =>
                              img.id === image.id ? { ...img, ...newAttrs } : img,
                            ),
                          );
                        }}
                        // onDoubleClick={() => {
                        //   setCroppingImageId(image.id);
                        //   const img = images.find(i => i.id === image.id);
                        //   if (!img) return;
                        //   setCropTargetImage(img);
                        //   setIsCropOpen(true);
                        // }}
                        onDragStart={() => {
                          // if dragging unselected item, only select that item
                          let currentSelectedIds = selectedIds;
                          if (!selectedIds.includes(image.id)) {
                            currentSelectedIds = [image.id];
                            setSelectedIds(currentSelectedIds);
                          }

                          setIsDraggingImage(true);
                          // save positions of all selected items
                          const positions = new Map<string, { x: number; y: number }>();
                          currentSelectedIds.forEach((id) => {
                            const img = images.find((i) => i.id === id);
                            if (img) {
                              positions.set(id, { x: img.x, y: img.y });
                              return;
                            }
                            const vid = videos.find((v) => v.id === id);
                            if (vid) {
                              positions.set(id, { x: vid.x, y: vid.y });
                            }
                          });
                          setDragStartPositions(positions);
                        }}
                        onDragEnd={() => {
                          setIsDraggingImage(false);
                          saveToHistory();
                          setDragStartPositions(new Map());
                        }}
                        selectedIds={selectedIds}
                        images={images}
                        setImages={setImages}
                        isDraggingImage={isDraggingImage}
                        isCroppingImage={croppingImageId === image.id}
                        dragStartPositions={dragStartPositions}
                        onGroupDragMove={onGroupDragMove}

                      />
                    ))}


                    {/* Render videos */}
                    {videos
                      .filter((video) => {
                        // Performance optimization: only render visible videos
                        const buffer = 100; // pixels buffer
                        const viewBounds = {
                          left: -viewport.x / viewport.scale - buffer,
                          top: -viewport.y / viewport.scale - buffer,
                          right:
                            (canvasSize.width - viewport.x) / viewport.scale +
                            buffer,
                          bottom:
                            (canvasSize.height - viewport.y) /
                            viewport.scale +
                            buffer,
                        };

                        return !(
                          video.x + video.width < viewBounds.left ||
                          video.x > viewBounds.right ||
                          video.y + video.height < viewBounds.top ||
                          video.y > viewBounds.bottom
                        );
                      })
                      .map((video) => (
                        <CanvasVideo
                          key={video.id}
                          video={video}
                          isSelected={selectedIds.includes(video.id)}
                          onSelect={(e) => handleSelect(video.id, e, setSelectedIds)}
                          onChange={(newAttrs) => {
                            setVideos((prev) =>
                              prev.map((vid) =>
                                vid.id === video.id
                                  ? { ...vid, ...newAttrs }
                                  : vid,
                              ),
                            );
                          }}
                          onDragStart={() => {
                            // If dragging a selected item in a multi-selection, keep the selection
                            // If dragging an unselected item, select only that item
                            let currentSelectedIds = selectedIds;
                            if (!selectedIds.includes(video.id)) {
                              currentSelectedIds = [video.id];
                              setSelectedIds(currentSelectedIds);
                            }

                            setIsDraggingVideo(true);
                            // Hide video controls during drag
                            setHiddenVideoControlsIds(
                              (prev) => new Set([...prev, video.id]),
                            );
                            // Save positions of all selected items
                            const positions = new Map<
                              string,
                              { x: number; y: number }
                            >();
                            currentSelectedIds.forEach((id) => {
                              const vid = videos.find((v) => v.id === id);
                              if (vid) {
                                positions.set(id, { x: vid.x, y: vid.y });
                                return;
                              }
                              const img = images.find((i) => i.id === id);
                              if (img) {
                                positions.set(id, { x: img.x, y: img.y });
                              }
                            });
                            setDragStartPositions(positions);
                          }}
                          onGroupDragMove={onGroupDragMove}
                          onDragEnd={() => {
                            setIsDraggingVideo(false);
                            // Show video controls after drag ends
                            setHiddenVideoControlsIds((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(video.id);
                              return newSet;
                            });
                            saveToHistory();
                            setDragStartPositions(new Map());
                          }}
                          selectedIds={selectedIds}
                          videos={videos}
                          setVideos={setVideos}
                          isDraggingVideo={isDraggingVideo}
                          isCroppingVideo={false}
                          dragStartPositions={dragStartPositions}
                          onResizeStart={() =>
                            setHiddenVideoControlsIds(
                              (prev) => new Set([...prev, video.id]),
                            )
                          }
                          onResizeEnd={() =>
                            setHiddenVideoControlsIds((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(video.id);
                              return newSet;
                            })
                          }

                        />
                      ))}

                  </Layer>
                </Stage>

                {/* Meta Dialog rendered outside of Konva tree */}
                {
                  metaDialogVideoOpen && (
                    <CanvasVideoMetaDialog
                      open={metaDialogVideoOpen}
                      onOpenChange={(open) => setMetaDialogVideoOpen(open)}
                      video={metaDialogVideo}
                      meta={metaDialogMeta}
                    />
                  )
                }
                {
                  metaDialogOpen && (
                    <CanvasImageMetaDialog
                      open={metaDialogOpen}
                      onOpenChange={(open) => setMetaDialogOpen(open)}
                      image={metaDialogImage}
                      meta={metaDialogMeta}
                    />
                  )
                }


                {editorTargetImage && (
                  <ImageEditorDialog
                    image={editorTargetImage}
                    setImages={setImages}
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                  />
                )}
                {cropTargetImage && (
                  <ImageCropDialog
                    image={cropTargetImage}
                    setImages={setImages}
                    isOpen={isCropOpen}
                    onClose={() => setIsCropOpen(false)}
                  />
                )}
                {processTargetVideo && isVideoFrameDialogOpen && (
                  <VideoFrameExtractDialog
                    video={processTargetVideo}
                    setImages={setImages}
                    isOpen={isVideoFrameDialogOpen}
                    onClose={() => setIsVideoFrameDialogOpen(false)}
                  />
                )}
                {processTargetVideo && isTrimMediaDialogOpen && (
                  <TrimMediaDialog
                    video={processTargetVideo}
                    setVideos={setVideos}
                    isOpen={isTrimMediaDialogOpen}
                    onClose={() => setIsTrimMediaDialogOpen(false)}
                  />
                )}
              </div>
            </ContextMenuTrigger>
            <CanvasContextMenu
              selectedIds={selectedIds}
              images={images}
              videos={videos}
              isGenerating={isGenerating}
              handleDuplicate={handleDuplicate}
              handleCombineImages={() => handleCombineImages(selectedIds, images, setImages, setSelectedIds, saveToHistory)}
              handleDelete={handleDelete}
              handleRemoveImageBackground={handleCanvasImageRemoveBackground}
              handleImageUpcale={handleCanvasImageUpcale}

              setCroppingImageId={setCroppingImageId}
              sendToFront={sendToFront}
              sendToBack={sendToBack}
              bringForward={bringForward}
              sendBackward={sendBackward}
              onEditImage={handleImageEditor}
              onOpenVideoFrameExtract={handleOpenVideoFrameExtract}
              onOpenTrimMedia={handleOpenTrimMedia}
            />
          </ContextMenu>

          {/* zoom control */}
          <ZoomControls
            viewport={viewport}
            setViewport={setViewport}
            canvasSize={canvasSize}
            undo={undo}
            redo={redo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />

          {/* mini map */}
          <MiniMap
            images={images}
            videos={videos}
            viewport={viewport}
            canvasSize={canvasSize}
          />


          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 select-none hidden md:block">
            {/*logo */}
            <div className=" bg-background/80 py-2 px-3 flex flex-row rounded-xl gap-2 items-center border">
              <a
                href="https://aiomnigen.com"
                target="_blank"
                className="block transition-opacity"
              >
                <img src="/logo.webp" alt="logo" className="h-16 w-auto" />
              </a>

            </div>

            <div className="flex flex-col items-start justify-center gap-2 mt-4">
              {/* <div className="flex items-center space-x-2">
                <Switch id="pure-mode"
                  className='cursor-pointer'
                  checked={isPureMode}
                  onCheckedChange={(checked) => setIsPureMode(checked)}
                />
                <Label htmlFor="pure-mode">{isPureMode ? 'Fixed Mode' : 'Scroll Mode'}</Label>
              </div> */}

              <div className="flex items-center space-x-2 gap-2">
                <Switch id="preview-placeholder"
                  className='cursor-pointer'
                  checked={previewPlaceholder.visible}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      showPreviewPlaceholder(1, "Generation result will display here");
                    } else {
                      hidePreviewPlaceholder();
                    }
                  }}
                />
                <Label htmlFor="preview-placeholder">Generation Area</Label>
              </div>
              {/* <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCanvasData}
              >
                Export Canvas
              </Button>
              <Button
                type="button"
                onClick={handleImportCanvasData}
                variant="outline"
                size="sm"
              >
                Import Default Canvas
              </Button> */}
              <HelpPanel />
            </div>

          </div>
          <div className="absolute top-20  left-4 z-20 flex flex-col items-start gap-2">


            {/* Mobile tool icons - animated based on selection */}
            {
              isMobile && (
                <MobileToolbar
                  selectedIds={selectedIds}
                  images={images}
                  handleDuplicate={handleDuplicate}
                  handleCombineImages={() => handleCombineImages(selectedIds, images, setImages, setSelectedIds, saveToHistory)}
                  handleDelete={handleDelete}
                  setCroppingImageId={setCroppingImageId}
                  sendToFront={sendToFront}
                  sendToBack={sendToBack}
                  bringForward={bringForward}
                  sendBackward={sendBackward}
                  onEditImage={handleImageEditor}
                />
              )
            }

          </div>

          {/* Video Controls Overlays */}
          {
            (
              <VideoOverlays
                videos={videos}
                selectedIds={selectedIds}
                viewport={viewport}
                hiddenVideoControlsIds={hiddenVideoControlsIds}
                setVideos={setVideos}
                isDraggingVideo={isDragging}
                onRequestMetaDialog={(video, meta) => {
                  setMetaDialogVideo(video);
                  setMetaDialogMeta(meta);
                  setMetaDialogVideoOpen(true);
                }}
              />
            )
          }
          {
            (
              <ImageOverlays
                images={images}
                viewport={viewport}
                selectedIds={selectedIds}
                isDraggingImage={isDragging}
                onRequestMetaDialog={(img, meta) => {
                  setMetaDialogImage(img);
                  setMetaDialogMeta(meta);
                  setMetaDialogOpen(true);
                }}
              />
            )
          }



        </div>
      )
      }      <GithubBadge />


      {
        isCanvasReady && (

          <div className="flex flex-col gap-1 bottom-2 left-0 right-0 md:absolute md:bottom-4 md:left-1/2 md:ml-[-324px] z-20 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:p-0 md:pb-0 md:max-w-[648px]">
            {(typeof generationStatus === 'string' &&
              generationStatus.toLowerCase() !== "succeeded" &&
              generationStatus.toLowerCase() !== "ok") && (
                <p className='text-center text-sm text-red-400'>
                  {(generationStatus)}
                </p>
              )}
            <MemoizedAiCanvaApp
              aiAppRef={aiGenerationAppRef}
              // onGenerate={isMobile ? undefined : handleOnGenerate}
              onGenerate={handleOnGenerate}
            />

          </div>
        )
      }
      <div className="md:absolute md:top-1/2 md:left-4 md:-translate-y-1/2">
        <ActiveTaskInCanvas />
        {/* className="hidden md:block" */}
      </div>

    </div >

  );
}
