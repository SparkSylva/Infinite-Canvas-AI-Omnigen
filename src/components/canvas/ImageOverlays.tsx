import React, { useEffect, useState } from "react";
import type { PlacedImage } from "@/types/canvas";
import { Button } from "@/components/ui";
import { Info } from "lucide-react";

interface ImageOverlaysProps {
  images: PlacedImage[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  selectedIds?: string[];
  isDraggingImage?: boolean;
  onRequestMetaDialog?: (image: PlacedImage, meta: Record<string, unknown>) => void;
}

// Simple DOM overlay for images: when image has meta, show an "i" button on top-right
export const ImageOverlays: React.FC<ImageOverlaysProps> = ({
  images,
  viewport,
  selectedIds = [],
  isDraggingImage,
  onRequestMetaDialog,
}) => {
  const ICON_SIZE = 28; // px in screen space
  const ICON_MARGIN = 6; // px in canvas space, scaled with viewport
  const [naturalSizeMap, setNaturalSizeMap] = useState<Record<string, { width: number; height: number }>>({});

  // Load natural sizes for selected images (actual pixel resolution)
  useEffect(() => {
    selectedIds.forEach((id) => {
      if (naturalSizeMap[id]) return;
      const imgItem = images.find((i) => i.id === id);
      if (!imgItem) return;
      const loader = new window.Image();
      loader.crossOrigin = "anonymous";
      loader.onload = () => {
        setNaturalSizeMap((prev) => ({
          ...prev,
          [id]: { width: loader.naturalWidth, height: loader.naturalHeight },
        }));
      };
      loader.src = imgItem.src;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, images]);

  return (
    <>
      {images.map((img) => {
        const meta: any = (img as any).meta || (img as any).dataMeta || null;
        const hasMeta = Boolean(meta);
        // Position at image's top-right corner (doesn't account for rotation, matching previous behavior)
        const top = img.y * viewport.scale + viewport.y + ICON_MARGIN * viewport.scale;
        const left =
          (img.x + img.width) * viewport.scale +
          viewport.x -
          ICON_SIZE -
          ICON_MARGIN * viewport.scale;

        const elements: React.ReactNode[] = [];
        const isSelected = selectedIds.includes(img.id);
        
        if (hasMeta && !isDraggingImage && isSelected) {
          elements.push(
            <Button
              key={`image-meta-${img.id}`}
              type="button"
              aria-label="Show image metadata"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (meta) {
                  onRequestMetaDialog?.(img, meta);
                }
              }}
              size="icon"
              variant="outline"
              style={{
                position: "absolute",
                top,
                left,
                width: ICON_SIZE,
                height: ICON_SIZE,
                pointerEvents: isDraggingImage ? "none" : "auto",
              }}
            >
              <Info className="h-3 w-3" />
            </Button>
          );
        }

        // Bottom-left size label when selected - show actual image resolution if available
        if (isSelected && !isDraggingImage) {
          const labelTop = (img.y + img.height) * viewport.scale + viewport.y + 6; // 6px offset
          const labelLeft = img.x * viewport.scale + viewport.x + 6; // 6px inset
          const fontSize = Math.max(10, Math.min(12, 12 * Math.sqrt(viewport.scale)));
          const natural = naturalSizeMap[img.id];
          const label = natural
            ? `${natural.width} × ${natural.height}`
            : `${Math.round(img.width)} × ${Math.round(img.height)}`;

          elements.push(
            <div
              key={`image-size-${img.id}`}
              style={{
                position: "absolute",
                top: labelTop,
                left: labelLeft,
                zIndex: 10,
                pointerEvents: "none",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize,
                lineHeight: 1.2,
                transform: "translateY(0)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </div>
          );
        }

        return elements;
      })}
    </>
  );
};

export default ImageOverlays;


