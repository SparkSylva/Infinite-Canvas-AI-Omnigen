'use client'

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { PlacedImage } from '@/types/canvas';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/shadcn-ui/dialog';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Check, X } from 'lucide-react';

interface Props {
  image: PlacedImage;
  setImages?: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
  isOpen: boolean;
  onClose: () => void;
  /** Optional fixed aspect ratio, e.g., 1 for square. If undefined, free crop. */
  aspect?: number;
}

export const ImageCropDialog: React.FC<Props> = ({ image, setImages, isOpen, onClose, aspect }) => {
  // Calculate available space dynamically
  const getMaxDisplayDimensions = () => {
    // Consider dialog padding, toolbar, and buttons height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if we're on md breakpoint (768px+) to match Tailwind's responsive design
    const isMdScreen = viewportWidth >= 768;
    
    // Calculate dialog dimensions based on CSS classes:
    // max-w-[85vw] md:max-w-[65vw] max-h-[50vh] md:max-h-[80vh]
    const dialogMaxWidth = isMdScreen 
      ? viewportWidth * 0.65  // md:max-w-[65vw]
      : viewportWidth * 0.85; // max-w-[85vw]
    
    const dialogMaxHeight = isMdScreen 
      ? viewportHeight * 0.8  // md:max-h-[80vh]
      : viewportHeight * 0.5; // max-h-[50vh]
    
    // Reserve space for title (~40px), info display (~40px), buttons (~80px) and padding (~32px)
    const reservedHeight = 40 + 40 + 80 + 32;
    const reservedWidth = 32; // padding
    
    return {
      width: Math.max(400, dialogMaxWidth - reservedWidth),
      height: Math.max(300, dialogMaxHeight - reservedHeight)
    };
  };

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgSrc, setImgSrc] = useState<string>('');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate the actual crop size
  const actualCropSize = useMemo(() => {
    if (!completedCrop || !imgRef.current || !naturalSize.width) return null;
    
    const scaleX = naturalSize.width / imgRef.current.width;
    const scaleY = naturalSize.height / imgRef.current.height;
    
    return {
      width: Math.round(completedCrop.width * scaleX),
      height: Math.round(completedCrop.height * scaleY),
    };
  }, [completedCrop, naturalSize]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate display dimensions based on current window size
  const displayDimensions = useMemo(() => {
    const maxDimensions = getMaxDisplayDimensions();
    return {
      maxWidth: maxDimensions.width,
      maxHeight: maxDimensions.height
    };
  }, [windowSize]);

  // Initialize crop when dialog opens
  useEffect(() => {
    if (isOpen && image) {
      setImgSrc(image.src);
      // Reset crop when opening
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [isOpen, image]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const imgElement = e.currentTarget;
    const { width, height, naturalWidth, naturalHeight } = imgElement;
    
    // Save the original image size
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    
    // Create initial crop area (60% of displayed image size, centered)
    const cropSize = Math.min(width, height) * 0.6;
    
    let initialCrop: Crop;
    
    if (aspect) {
      // Fixed aspect ratio
      initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: 'px',
            width: cropSize,
            height: cropSize / aspect,
          },
          aspect,
          width,
          height,
        ),
        width,
        height,
      );
    } else {
      // Free crop - square by default
      initialCrop = centerCrop(
        {
          unit: 'px',
          width: cropSize,
          height: cropSize,
          x: 0,
          y: 0,
        },
        width,
        height,
      );
    }
    
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  }, [aspect]);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: Crop,
  ): Promise<{ url: string; width: number; height: number }> => {
    const canvas = canvasRef.current;
    if (!canvas || !crop.width || !crop.height) {
      throw new Error('Canvas ref not available or invalid crop');
    }

    // Calculate the scaling ratio from display size to original size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Actual size of the original crop area
    const originalCropWidth = crop.width * scaleX;
    const originalCropHeight = crop.height * scaleY;
    
    // Set canvas size to original crop size
    canvas.width = originalCropWidth;
    canvas.height = originalCropHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Crop using original size
    ctx.drawImage(
      image,
      crop.x * scaleX,          // Original X coordinate
      crop.y * scaleY,          // Original Y coordinate
      originalCropWidth,        // Original crop width
      originalCropHeight,       // Original crop height
      0,                        // Canvas target X
      0,                        // Canvas target Y
      originalCropWidth,        // Canvas target width
      originalCropHeight,       // Canvas target height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            url: URL.createObjectURL(blob),
            width: originalCropWidth,
            height: originalCropHeight,
          });
        }
      }, 'image/png');
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !setImages) {
      return;
    }

    try {
      const croppedResult = await getCroppedImg(imgRef.current, completedCrop);
      
      // Calculate appropriate canvas display size (refer to upload image logic)
      // Although the original resolution is maintained during cropping, the display size needs to be controlled on the canvas
      const aspectRatio = croppedResult.width / croppedResult.height;
      const maxSize = 300; // max canvas size
      let displayWidth = maxSize;
      let displayHeight = maxSize / aspectRatio;

      // If the height exceeds the maximum size, recalculate the width based on the height
      if (displayHeight > maxSize) {
        displayHeight = maxSize;
        displayWidth = maxSize * aspectRatio;
      }
      
      // Create new image object with cropped image
      const newImage: PlacedImage = {
        id: `crop_${image.id}_${Date.now()}`,
        src: croppedResult.url,
        x: image.x + image.width + 20, // Place to the right of original image with 20px gap
        y: image.y,
        width: displayWidth,      // Use calculated display size
        height: displayHeight,    // Use calculated display size
        rotation: 0,
        isGenerated: false,
      };

      // Add the new cropped image to the canvas
      setImages(prev => [...prev, newImage]);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [completedCrop, image, setImages, onClose, getCroppedImg]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-[85vw] md:max-w-[65vw] max-h-[70vh] md:max-h-[80vh] flex flex-col"
        onContextMenuCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        <DialogTitle>Crop Image</DialogTitle>
        
        {/* Image information display */}
        {naturalSize.width > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground px-1">
            <span>Original size: {naturalSize.width} × {naturalSize.height}</span>
            {actualCropSize && (
              <span>Crop size: {actualCropSize.width} × {actualCropSize.height}</span>
            )}
          </div>
        )}
        
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Image crop area */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <div className="max-w-full max-h-full">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop, percentCrop) => setCompletedCrop(pixelCrop)}
                  aspect={aspect}
                  minWidth={50}
                  minHeight={50}
                  keepSelection
                  ruleOfThirds
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    style={{ 
                      maxWidth: `${displayDimensions.maxWidth}px`,
                      maxHeight: `${displayDimensions.maxHeight}px`,
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      userSelect: 'none',
                      pointerEvents: 'auto'
                    }}
                  />
                </ReactCrop>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!completedCrop}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Save Crop
            </Button>
          </div>
        </div>

        {/* Hidden canvas for image processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}


