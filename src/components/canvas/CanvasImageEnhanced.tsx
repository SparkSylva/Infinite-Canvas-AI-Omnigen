import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import type { PlacedImage } from "@/types/canvas";
import { throttle } from "@/utils/canvas/performance";
import { getPrimaryColor } from "./functions/canvasFunctions";

// Note: lucide-react icons are DOM components and can't be rendered inside Konva tree
// Dialog and other DOM UI must be rendered outside Konva tree

interface CanvasImageEnhancedProps {
  image: PlacedImage;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onChange: (newAttrs: Partial<PlacedImage>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDoubleClick?: () => void;
  selectedIds: string[];
  images: PlacedImage[];
  setImages: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
  isDraggingImage: boolean;
  isCroppingImage: boolean;
  dragStartPositions: Map<string, { x: number; y: number }>;
  // Notify parent to open a DOM dialog outside Konva tree
  onRequestMetaDialog?: (image: PlacedImage, meta: Record<string, unknown>) => void;
  // Group drag move callback from parent to move images and videos together
  onGroupDragMove?: (activeId: string, nodeX: number, nodeY: number) => void;
}

// Enhanced CanvasImage component that shows an info button on hover when meta exists.
export const CanvasImageEnhanced: React.FC<CanvasImageEnhancedProps> = ({
  image,
  isSelected,
  onSelect,
  onChange,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  selectedIds,
  images,
  setImages,
  isDraggingImage,
  isCroppingImage,
  dragStartPositions,
  onRequestMetaDialog,
  onGroupDragMove,
}) => {
  const shapeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [normalImg] = useImage(image.src, "anonymous");
  const img = normalImg;

  const [isHovered, setIsHovered] = useState(false);
  const [isDraggable, setIsDraggable] = useState(true);

  // Support both possible keys: meta or dataMeta
  const meta: any = (image as any).meta || (image as any).dataMeta || null;
  const hasMeta = Boolean(meta);
  const prompt: string = meta?.prompt || meta?.prompt_process || "";

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      if (selectedIds.length === 1) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else {
        trRef.current.nodes([]);
      }
    }
  }, [isSelected, selectedIds.length]);

  // DOM-based info overlay is rendered outside of Konva tree

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        id={image.id}
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        crop={
          image.cropX !== undefined && !isCroppingImage
            ? {
              x: (image.cropX || 0) * (img?.naturalWidth || 0),
              y: (image.cropY || 0) * (img?.naturalHeight || 0),
              width: (image.cropWidth || 1) * (img?.naturalWidth || 0),
              height: (image.cropHeight || 1) * (img?.naturalHeight || 0),
            }
            : undefined
        }
        draggable={isDraggable}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDoubleClick}
        onDblTap={onDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => {
          // Only left button should drag
          const isLeftButton = (e.evt as MouseEvent).button === 0;
          setIsDraggable(isLeftButton);
          if ((e.evt as MouseEvent).button === 1) {
            return;
          }
        }}
        onMouseUp={() => {
          // Re-enable dragging on mouse up
          setIsDraggable(true);
        }}
        onDragStart={(e) => {
          // Prevent stage from panning
          e.cancelBubble = true;
          if (!isSelected) {
            onSelect(e);
          }
          onDragStart();
        }}
        onDragMove={useMemo(
          () =>
            throttle((e: any) => {
              const node = e.target;
              if (selectedIds.includes(image.id) && selectedIds.length > 1) {
                if (onGroupDragMove) {
                  onGroupDragMove(image.id, node.x(), node.y());
                  return;
                }
                // Fallback: move only images if parent callback missing
                const startPos = dragStartPositions.get(image.id);
                if (startPos) {
                  const deltaX = node.x() - startPos.x;
                  const deltaY = node.y() - startPos.y;
                  setImages((prev) =>
                    prev.map((imgItem) => {
                      if (imgItem.id === image.id) {
                        return { ...imgItem, x: node.x(), y: node.y() };
                      } else if (selectedIds.includes(imgItem.id)) {
                        const imgStartPos = dragStartPositions.get(imgItem.id);
                        if (imgStartPos) {
                          return {
                            ...imgItem,
                            x: imgStartPos.x + deltaX,
                            y: imgStartPos.y + deltaY,
                          };
                        }
                      }
                      return imgItem;
                    }),
                  );
                }
              } else {
                onChange({ x: node.x(), y: node.y() });
              }
            }, 16),
          [selectedIds, image.id, dragStartPositions, setImages, onChange, onGroupDragMove],
        )}
        onDragEnd={() => {
          onDragEnd();
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (node) {
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: node.rotation(),
            });
          }
          onDragEnd();
        }}
        opacity={image.isGenerated ? 0.9 : 1}
        stroke={isSelected ? getPrimaryColor() : isHovered ? getPrimaryColor() : "transparent"}
        strokeWidth={isSelected || isHovered ? 6 : 0}
      />

      {/* Info button moved to DOM overlay (ImageOverlays) */}

      {isSelected && selectedIds.length === 1 && (
        <Transformer
          ref={trRef}
          borderStroke={getPrimaryColor()}
          cornerRadius={8}
          anchorStroke={getPrimaryColor()}
          anchorStrokeWidth={2}
          anchorFill="white"
          anchorSize={8}
          anchorCornerRadius={5}
          rotateAnchorOffset={30}
          rotateAnchorStroke={getPrimaryColor()}
          rotateAnchorFill="white"
          rotateAnchorCornerRadius={5}

          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}

      {/* Dialog is rendered by parent via onRequestMetaDialog callback */}
    </>
  );
};

export default CanvasImageEnhanced;


