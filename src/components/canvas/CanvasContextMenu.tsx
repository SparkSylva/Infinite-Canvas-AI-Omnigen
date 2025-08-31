'use client'

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/shadcn-ui/context-menu"

import React from "react";


import { ShortcutBadge } from "@/components/canvas/ShortcutBadge";
import {
  Play,
  Copy,
  Crop,
  Scissors,
  Combine,
  Download,
  X,
  Layers,
  ChevronUp,
  ChevronDown,
  MoveUp,
  MoveDown,
  Video,
  FilePlus,
  LoaderCircle,
  Pencil,
  Image as ImageIcon
} from "lucide-react";


import JSZip from 'jszip'
import { checkOS } from "@/utils/canvas/os-utils";

// Helper function to download a single file with presigned URL support
const downloadSingleFile = async (src: string, fileName: string): Promise<Blob> => {
  // Handle base64 data URLs
  if (src.startsWith('data:')) {
    const mimeType = src.split(';')[0].split(':')[1];
    const base64Data = src.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  let fetchUrl = src;
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  return await response.blob();
};

// Main download function that handles both single and multiple file downloads
const handleDownloadSelected = async (
  selectedIds: string[],
  images: PlacedImage[],
  videos: PlacedVideo[]
) => {
  try {
    if (selectedIds.length === 1) {
      // Single file download
      const id = selectedIds[0];
      const image = images.find((img) => img.id === id);
      const video = videos?.find((vid) => vid.id === id);

      if (image) {
        try {
          const blob = await downloadSingleFile(image.src, `image-${Date.now()}.png`);
          const blobUrl = URL.createObjectURL(blob);

          // Generate filename with proper extension
          let fileName = `image-${Date.now()}.png`;
          if (image.src.startsWith('data:')) {
            const mimeType = image.src.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1];
            fileName = `image-${Date.now()}.${extension}`;
          } else {
            const urlFileName = image.src.split("/").pop();
            if (urlFileName && urlFileName.includes('.')) {
              fileName = urlFileName;
            }
          }

          const link = document.createElement("a");
          link.download = fileName;
          link.href = blobUrl;
          link.click();

          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
          console.error("Failed to download image:", error);
          // Fallback to direct download
          const link = document.createElement("a");
          link.download = `image-${Date.now()}.png`;
          link.href = image.src;
          link.target = "_blank";
          link.click();
        }
      } else if (video) {
        try {
          const blob = await downloadSingleFile(video.src, `video-${Date.now()}.mp4`);
          const blobUrl = URL.createObjectURL(blob);

          // Generate filename with proper extension
          let fileName = `video-${Date.now()}.mp4`;
          if (video.src.startsWith('data:')) {
            const mimeType = video.src.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1];
            fileName = `video-${Date.now()}.${extension}`;
          } else {
            const urlFileName = video.src.split("/").pop();
            if (urlFileName && urlFileName.includes('.')) {
              fileName = urlFileName;
            }
          }

          const link = document.createElement("a");
          link.download = fileName;
          link.href = blobUrl;
          link.click();

          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
          console.error("Failed to download video:", error);
          // Fallback to direct download
          const link = document.createElement("a");
          link.download = `video-${Date.now()}.mp4`;
          link.href = video.src;
          link.target = "_blank";
          link.click();
        }
      }
    } else {
      // Multiple files download as ZIP
      const zip = new JSZip();
      const downloadPromises: Promise<void>[] = [];

      for (let i = 0; i < selectedIds.length; i++) {
        const id = selectedIds[i];
        const image = images.find((img) => img.id === id);
        const video = videos?.find((vid) => vid.id === id);

        if (image) {
          const promise = downloadSingleFile(image.src, `image-${i + 1}.png`)
            .then(blob => {
              // Generate proper filename with extension
              let fileName = `image-${i + 1}.png`;
              if (image.src.startsWith('data:')) {
                const mimeType = image.src.split(';')[0].split(':')[1];
                const extension = mimeType.split('/')[1];
                fileName = `image-${i + 1}.${extension}`;
              } else {
                const urlFileName = image.src.split("/").pop();
                if (urlFileName && urlFileName.includes('.')) {
                  const extension = urlFileName.split('.').pop();
                  fileName = `image-${i + 1}.${extension}`;
                }
              }
              zip.file(fileName, blob);
            })
            .catch(error => {
              console.error(`Failed to download image ${id}:`, error);
            });
          downloadPromises.push(promise);
        } else if (video) {
          const promise = downloadSingleFile(video.src, `video-${i + 1}.mp4`)
            .then(blob => {
              // Generate proper filename with extension
              let fileName = `video-${i + 1}.mp4`;
              if (video.src.startsWith('data:')) {
                const mimeType = video.src.split(';')[0].split(':')[1];
                const extension = mimeType.split('/')[1];
                fileName = `video-${i + 1}.${extension}`;
              } else {
                const urlFileName = video.src.split("/").pop();
                if (urlFileName && urlFileName.includes('.')) {
                  const extension = urlFileName.split('.').pop();
                  fileName = `video-${i + 1}.${extension}`;
                }
              }
              zip.file(fileName, blob);
            })
            .catch(error => {
              console.error(`Failed to download video ${id}:`, error);
            });
          downloadPromises.push(promise);
        }
      }

      // Wait for all downloads to complete
      await Promise.all(downloadPromises);

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.download = `canvas-files-${Date.now()}.zip`;
      link.href = zipUrl;
      link.click();

      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
    }
  } catch (error) {
    console.error("Download failed:", error);
  }
};
import type {
  PlacedImage,
  PlacedVideo,
} from "@/types/canvas";

interface CanvasContextMenuProps {
  selectedIds: string[];
  images: PlacedImage[];
  videos?: PlacedVideo[];
  isGenerating: boolean;
  handleRun?: () => void;
  handleDuplicate: () => void;
  handleCombineImages: () => void;
  handleRemoveImageBackground?: (image: PlacedImage) => void;
  handleImageUpcale?: (image: PlacedImage) => void;
  handleDelete: () => void;
  handleConvertToVideo?: (imageId: string) => void;
  handleVideoToVideo?: (videoId: string) => void;
  handleExtendVideo?: (videoId: string) => void;
  handleRemoveVideoBackground?: (videoId: string) => void;
  setCroppingImageId: (id: string | null) => void;
  sendToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  onEditImage?: (id: string) => void;
  onOpenVideoFrameExtract?: (videoId: string) => void;
  onOpenTrimMedia?: (videoId: string) => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  selectedIds,
  images,
  videos = [], // Provide a default empty array
  isGenerating,
  handleRun,
  handleDuplicate,
  handleCombineImages,
  handleDelete,
  handleConvertToVideo,
  handleVideoToVideo,
  handleExtendVideo,
  handleRemoveVideoBackground,
  handleRemoveImageBackground,
  handleImageUpcale,
  setCroppingImageId,
  sendToFront,
  sendToBack,
  bringForward,
  sendBackward,
  onEditImage,
  onOpenVideoFrameExtract,
  onOpenTrimMedia,
}) => {
  return (
    <ContextMenuContent>
      <ContextMenuItem
        onClick={() => {
          if (selectedIds.length === 1 && onEditImage) onEditImage(selectedIds[0]);
        }}
        disabled={
          selectedIds.length !== 1 ||
          videos?.some((v) => selectedIds.includes(v.id))
        }
        className="flex items-center gap-2"
      >
        <Pencil className="h-4 w-4" />
        Edit
      </ContextMenuItem>
      {handleRun && (
        <ContextMenuItem
          onClick={handleRun}
          // disabled={}
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-content" />
            ) : (
              <Play className="h-4 w-4 text-content" />
            )}
            <span>Run</span>
          </div>
          <ShortcutBadge
            variant="alpha"
            size="xs"
            shortcut={
              checkOS("Win") || checkOS("Linux") ? "ctrl+enter" : "meta+enter"
            }
          />
        </ContextMenuItem>
      )}
      {selectedIds.length === 1 &&
        handleRemoveImageBackground &&
        images?.some((img) => img.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleRemoveImageBackground(images.find((img) => img.id === selectedIds[0])!);
            }}
            className="flex items-center gap-2"
          >
            <Scissors className="h-4 w-4" />
            Remove Background
          </ContextMenuItem>
        )}

      {selectedIds.length === 1 &&
        handleImageUpcale &&
        images?.some((img) => img.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleImageUpcale(images.find((img) => img.id === selectedIds[0])!);
            }}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Upcale Image
          </ContextMenuItem>
        )}



      <ContextMenuItem
        onClick={handleDuplicate}
        disabled={selectedIds.length === 0}
        className="flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => {
          if (selectedIds.length === 1) {
            setCroppingImageId(selectedIds[0]);
          }
        }}
        disabled={
          selectedIds.length !== 1 ||
          videos?.some((v) => selectedIds.includes(v.id))
        }
        className="flex items-center gap-2"
      >
        <Crop className="h-4 w-4" />
        Crop
      </ContextMenuItem>
      {selectedIds.length === 1 &&
        handleConvertToVideo &&
        images.some((img) => img.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleConvertToVideo(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            Image to Video
          </ContextMenuItem>
        )}
      {/* Temporarily disabled Video to Video option
      {selectedIds.length === 1 &&
        handleVideoToVideo &&
        videos?.some((v) => v.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleVideoToVideo(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            Video to Video
          </ContextMenuItem>
        )} */}
      {selectedIds.length === 1 &&
        handleExtendVideo &&
        videos?.some((v) => v.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleExtendVideo(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            Extend Video
          </ContextMenuItem>
        )}
      {selectedIds.length === 1 &&
        onOpenVideoFrameExtract &&
        videos?.some((v) => v.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              onOpenVideoFrameExtract(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Extract Video Frame
          </ContextMenuItem>
        )}
      {selectedIds.length === 1 &&
        onOpenTrimMedia &&
        videos?.some((v) => v.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              onOpenTrimMedia(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <Video className="h-4 w-4" />
            Trim Media
          </ContextMenuItem>
        )}
      {selectedIds.length === 1 &&
        handleRemoveVideoBackground &&
        videos?.some((v) => v.id === selectedIds[0]) && (
          <ContextMenuItem
            onClick={() => {
              handleRemoveVideoBackground(selectedIds[0]);
            }}
            className="flex items-center gap-2"
          >
            <Scissors className="h-4 w-4" />
            Remove Video Background
          </ContextMenuItem>
        )}

      <ContextMenuItem
        onClick={handleCombineImages}
        disabled={selectedIds.length < 2}
        className="flex items-center gap-2"
      >
        <Combine className="h-4 w-4" />
        Combine Images
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger
          disabled={
            selectedIds.length === 0
              ? true
              : images.some((img) => selectedIds.includes(img.id)) &&
              (videos ?? []).some((v) => selectedIds.includes(v.id))
          }
          className="flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          Layer Order
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-64" sideOffset={10}>
          <ContextMenuItem
            onClick={sendToFront}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <MoveUp className="h-4 w-4" />
              <span>Send to Front</span>
            </div>
            <ShortcutBadge
              variant="alpha"
              size="xs"
              shortcut={
                checkOS("Win") || checkOS("Linux") ? "ctrl+]" : "meta+]"
              }
            />
          </ContextMenuItem>
          <ContextMenuItem
            onClick={bringForward}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <ChevronUp className="h-4 w-4" />
              <span>Bring Forward</span>
            </div>
            <ShortcutBadge variant="alpha" size="xs" shortcut="]" />
          </ContextMenuItem>
          <ContextMenuItem
            onClick={sendBackward}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4" />
              <span>Send Backward</span>
            </div>
            <ShortcutBadge variant="alpha" size="xs" shortcut="[" />
          </ContextMenuItem>
          <ContextMenuItem
            onClick={sendToBack}
            disabled={selectedIds.length === 0}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <MoveDown className="h-4 w-4" />
              <span>Send to Back</span>
            </div>
            <ShortcutBadge
              variant="alpha"
              size="xs"
              shortcut={
                checkOS("Win") || checkOS("Linux") ? "ctrl+[" : "meta+["
              }
            />
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuItem
        onClick={() => handleDownloadSelected(selectedIds, images, videos)}
        disabled={selectedIds.length === 0}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download
      </ContextMenuItem>
      <ContextMenuItem
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        className="flex items-center gap-2"
      >
        <X className="h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );
};