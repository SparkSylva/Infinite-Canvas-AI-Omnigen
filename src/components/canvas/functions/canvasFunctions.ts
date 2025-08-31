import { PlacedImage, PlacedVideo } from "@/types/canvas";
import Konva from "konva";

// canvasFunctions.ts 

// some functions for canvas

// 处理文件上传功能 - 将图片文件添加到画布中
export const handleFileUpload = (
    files: FileList | null,
    position: { x: number; y: number } | undefined,
    viewport: { x: number; y: number; scale: number },
    canvasSize: { width: number; height: number },
    setImages?: React.Dispatch<React.SetStateAction<PlacedImage[]>>,
    setVideos?: React.Dispatch<React.SetStateAction<PlacedVideo[]>>
) => {
    if (!files) return;

    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const id = `img-${Date.now()}-${Math.random()}`;
                const img = new window.Image();
                img.crossOrigin = "anonymous"; // Enable CORS
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    const maxSize = 300;
                    let width = maxSize;
                    let height = maxSize / aspectRatio;

                    if (height > maxSize) {
                        height = maxSize;
                        width = maxSize * aspectRatio;
                    }

                    // Place image at position or center of current viewport
                    let x, y;
                    if (position) {
                        // Convert screen position to canvas coordinates
                        x = (position.x - viewport.x) / viewport.scale - width / 2;
                        y = (position.y - viewport.y) / viewport.scale - height / 2;
                    } else {
                        // Center of viewport
                        const viewportCenterX =
                            (canvasSize.width / 2 - viewport.x) / viewport.scale;
                        const viewportCenterY =
                            (canvasSize.height / 2 - viewport.y) / viewport.scale;
                        x = viewportCenterX - width / 2;
                        y = viewportCenterY - height / 2;
                    }

                    // Add offset for multiple files
                    if (index > 0) {
                        x += index * 20;
                        y += index * 20;
                    }

                    setImages && setImages((prev) => [
                        ...prev,
                        {
                            id,
                            src: e.target?.result as string,
                            x,
                            y,
                            width,
                            height,
                            rotation: 0,
                        },
                    ]);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        } else if ((file.type.startsWith("video/") || file.type.startsWith("audio/")) && setVideos) {
            // Handle video files: add a video node based on metadata (no manual duration)
            const id = `vid-${Date.now()}-${Math.random()}`;
            const objectUrl = URL.createObjectURL(file);
            const isAudio = file.type.startsWith("audio/");

            const videoEl = document.createElement("video");
            videoEl.preload = "metadata";
            videoEl.src = objectUrl;
            videoEl.crossOrigin = "anonymous";
            videoEl.muted = true;

            const onLoadedMetadata = () => {
                const videoWidth = videoEl.videoWidth || 300;
                const videoHeight = videoEl.videoHeight || 300;
                const aspectRatio = videoWidth / Math.max(1, videoHeight);

                const maxSize = 300;
                let width = maxSize;
                let height = maxSize / aspectRatio;
                if (isAudio) {
                    width = 240;
                    height = 135; // 16:9 
                }
                else {
                    if (height > maxSize) {
                        height = maxSize;
                        width = maxSize * aspectRatio;
                    }
                }

                // Place video at position or center of current viewport
                let x: number, y: number;
                if (position) {
                    x = (position.x - viewport.x) / viewport.scale - width / 2;
                    y = (position.y - viewport.y) / viewport.scale - height / 2;
                } else {
                    const viewportCenterX = (canvasSize.width / 2 - viewport.x) / viewport.scale;
                    const viewportCenterY = (canvasSize.height / 2 - viewport.y) / viewport.scale;
                    x = viewportCenterX - width / 2;
                    y = viewportCenterY - height / 2;
                }

                // Add offset for multiple files
                if (index > 0) {
                    x += index * 20;
                    y += index * 20;
                }

                setVideos((prev) => [
                    ...prev,
                    {
                        id,
                        src: objectUrl,
                        x,
                        y,
                        width,
                        height,
                        rotation: 0,
                        isVideo: !isAudio,
                        // duration is derived from metadata; optional until loaded
                        duration: Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : undefined,
                        currentTime: 0,
                        isPlaying: false,
                        volume: 1,
                        muted: false,
                        isLooping: false,
                        isLoaded: true, // metadata already loaded
                        isAudio: file.type.startsWith("audio/"),
                    },
                ]);

                // Do not revoke object URL here because it's in use by the canvas item
                videoEl.removeEventListener("loadedmetadata", onLoadedMetadata);
            };

            videoEl.addEventListener("loadedmetadata", onLoadedMetadata);
        }
    });
};



export const handleCombineImages = async (
    selectedIds: string[],
    images: PlacedImage[],
    setImages: React.Dispatch<React.SetStateAction<PlacedImage[]>>,
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
    saveToHistory: () => void
) => {
    if (selectedIds.length < 2) return;

    // Save to history before combining
    saveToHistory();

    // Get selected images and sort by layer order
    const selectedImages = selectedIds
        .map((id) => images.find((img) => img.id === id))
        .filter((img) => img !== undefined) as PlacedImage[];

    const sortedImages = [...selectedImages].sort((a, b) => {
        const indexA = images.findIndex((img) => img.id === a.id);
        const indexB = images.findIndex((img) => img.id === b.id);
        return indexA - indexB;
    });

    // Load all images to calculate scale factors
    const imageElements: {
        img: PlacedImage;
        element: HTMLImageElement;
        scale: number;
    }[] = [];
    let maxScale = 1;

    for (const img of sortedImages) {
        const imgElement = new window.Image();
        imgElement.crossOrigin = "anonymous"; // Enable CORS
        imgElement.src = img.src;
        await new Promise((resolve) => {
            imgElement.onload = resolve;
        });

        // Calculate scale factor (original size / display size)
        // Account for crops if they exist
        const effectiveWidth = img.cropWidth
            ? imgElement.naturalWidth * img.cropWidth
            : imgElement.naturalWidth;
        const effectiveHeight = img.cropHeight
            ? imgElement.naturalHeight * img.cropHeight
            : imgElement.naturalHeight;

        const scaleX = effectiveWidth / img.width;
        const scaleY = effectiveHeight / img.height;
        const scale = Math.min(scaleX, scaleY); // Use min to maintain aspect ratio

        maxScale = Math.max(maxScale, scale);
        imageElements.push({ img, element: imgElement, scale });
    }

    // Use a reasonable scale - not too large to avoid memory issues
    const optimalScale = Math.min(maxScale, 4); // Cap at 4x to prevent huge images

    // Calculate bounding box of all selected images
    let minX = Infinity,
        minY = Infinity;
    let maxX = -Infinity,
        maxY = -Infinity;

    sortedImages.forEach((img) => {
        minX = Math.min(minX, img.x);
        minY = Math.min(minY, img.y);
        maxX = Math.max(maxX, img.x + img.width);
        maxY = Math.max(maxY, img.y + img.height);
    });

    const combinedWidth = maxX - minX;
    const combinedHeight = maxY - minY;

    // Create canvas at higher resolution
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Failed to get canvas context");
        return;
    }

    canvas.width = Math.round(combinedWidth * optimalScale);
    canvas.height = Math.round(combinedHeight * optimalScale);

    console.log(
        `Creating combined image at ${canvas.width}x${canvas.height} (scale: ${optimalScale.toFixed(2)}x)`,
    );

    // Draw each image in order using the pre-loaded elements
    for (const { img, element: imgElement } of imageElements) {
        // Calculate position relative to the combined canvas, scaled up
        const relX = (img.x - minX) * optimalScale;
        const relY = (img.y - minY) * optimalScale;
        const scaledWidth = img.width * optimalScale;
        const scaledHeight = img.height * optimalScale;

        ctx.save();

        // Handle rotation if needed
        if (img.rotation) {
            ctx.translate(relX + scaledWidth / 2, relY + scaledHeight / 2);
            ctx.rotate((img.rotation * Math.PI) / 180);
            ctx.drawImage(
                imgElement,
                -scaledWidth / 2,
                -scaledHeight / 2,
                scaledWidth,
                scaledHeight,
            );
        } else {
            // Handle cropping if exists
            if (
                img.cropX !== undefined &&
                img.cropY !== undefined &&
                img.cropWidth !== undefined &&
                img.cropHeight !== undefined
            ) {
                ctx.drawImage(
                    imgElement,
                    img.cropX * imgElement.naturalWidth,
                    img.cropY * imgElement.naturalHeight,
                    img.cropWidth * imgElement.naturalWidth,
                    img.cropHeight * imgElement.naturalHeight,
                    relX,
                    relY,
                    scaledWidth,
                    scaledHeight,
                );
            } else {
                ctx.drawImage(
                    imgElement,
                    0,
                    0,
                    imgElement.naturalWidth,
                    imgElement.naturalHeight,
                    relX,
                    relY,
                    scaledWidth,
                    scaledHeight,
                );
            }
        }

        ctx.restore();
    }

    // Convert to blob and create data URL
    const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
    });

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(blob);
    });

    // Create new combined image
    const combinedImage: PlacedImage = {
        id: `combined-${Date.now()}-${Math.random()}`,
        src: dataUrl,
        x: minX,
        y: minY,
        width: combinedWidth,
        height: combinedHeight,
        rotation: 0,
    };

    // Remove the original images and add the combined one
    setImages((prev: PlacedImage[]) => [
        ...prev.filter((img: PlacedImage) => !selectedIds.includes(img.id)),
        combinedImage,
    ]);

    // Select the new combined image
    setSelectedIds([combinedImage.id]);
};



export const handleWheel = (
    e: Konva.KonvaEventObject<WheelEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
    viewport: { x: number; y: number; scale: number },
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>

) => {
    const stage = stageRef?.current;
    if (!stage) return;

    // Check if this is a zoom operation (Ctrl/Cmd + wheel)
    if (e.evt.ctrlKey || e.evt.metaKey) {
        // Prevent default behavior only for zoom operations
        e.evt.preventDefault();

        const oldScale = viewport.scale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mouse = { x: (pointer.x - viewport.x) / oldScale, y: (pointer.y - viewport.y) / oldScale };
        const scaleBy = 1.05;
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const scale = Math.max(0.1, Math.min(newScale, 5));
        setViewport({ x: pointer.x - mouse.x * scale, y: pointer.y - mouse.y * scale, scale });
    } else {
        // Prevent default behavior only for canvas panning operations (Shift + wheel)
        // e.evt.preventDefault();

        // setViewport(
        //     (prev: { x: number; y: number; scale: number }) => ({ ...prev, x: prev.x - e.evt.deltaX, y: prev.y - e.evt.deltaY }));
    }
    // If neither Ctrl/Cmd nor Shift is pressed, allow normal page scrolling
    // (don't call preventDefault, let the browser handle normal scrolling)
};

// 处理画布点击 - 开始选择框或画布拖拽
export const handleMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
    viewport: { x: number; y: number; scale: number },
    setIsDraggingCanvas: (isDragging: boolean) => void,
    setCanvasDragStart: (pos: { x: number; y: number }) => void,
    clearSelection: () => void,
    setIsSelecting: (isSelecting: boolean) => void,
    setSelectionBox: React.Dispatch<React.SetStateAction<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        visible: boolean;
    }>>
) => {
    const stage = stageRef?.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    const mouseButton = e.evt.button; // 0=左键, 1=中键, 2=右键

    // 中键拖动画布（无论是否点在元素上）
    if (mouseButton === 1) {
        e.evt.preventDefault();
        setIsDraggingCanvas(true);
        setCanvasDragStart({ x: pos.x, y: pos.y });
        return;
    }

    // Ctrl/Cmd + 左键 拖动画布
    const shouldDragCanvas = mouseButton === 0 && (e.evt.ctrlKey || e.evt.metaKey);
    if (shouldDragCanvas) {
        setIsDraggingCanvas(true);
        setCanvasDragStart({ x: pos.x, y: pos.y });
        return;
    }

    // 右键：保持现有选择状态，交由 context menu 处理
    if (mouseButton === 2) return;

    // 仅当点击空白区域时，开始框选
    if (!clickedOnEmpty) return;

    const canvasPos = {
        x: (pos.x - viewport.x) / viewport.scale,
        y: (pos.y - viewport.y) / viewport.scale,
    };

    if (!e.evt.ctrlKey && !e.evt.metaKey) {
        clearSelection();
    }

    setIsSelecting(true);
    setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        endX: canvasPos.x,
        endY: canvasPos.y,
        visible: true,
    });
};


// 处理鼠标移动 - 更新选择框或画布拖拽
export const handleMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
    isDraggingCanvas: boolean,
    canvasDragStart: { x: number; y: number },
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>,
    setCanvasDragStart: (pos: { x: number; y: number }) => void,
    isSelecting: boolean,
    viewport: { x: number; y: number; scale: number },
    setSelectionBox: React.Dispatch<React.SetStateAction<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        visible: boolean;
    }>>
) => {
    const stage = stageRef?.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // 处理画布拖拽
    if (isDraggingCanvas) {
        const deltaX = pos.x - canvasDragStart.x;
        const deltaY = pos.y - canvasDragStart.y;

        setViewport(prev => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));

        setCanvasDragStart({ x: pos.x, y: pos.y });
        return;
    }

    // 处理选择框
    if (isSelecting) {
        const canvasPos = {
            x: (pos.x - viewport.x) / viewport.scale,
            y: (pos.y - viewport.y) / viewport.scale,
        };

        setSelectionBox(prev => ({
            ...prev,
            endX: canvasPos.x,
            endY: canvasPos.y,
        }));
    }
};

// 处理鼠标释放 - 完成选择或画布拖拽
export const handleMouseUp = (
    isDraggingCanvas: boolean,
    setIsDraggingCanvas: (isDragging: boolean) => void,
    isSelecting: boolean,
    selectionBox: {
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        visible: boolean;
    },
    images: PlacedImage[],
    videos: PlacedVideo[],
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
    toast: { info: (message: string) => void },
    setIsSelecting: (isSelecting: boolean) => void,
    setSelectionBox: React.Dispatch<React.SetStateAction<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        visible: boolean;
    }>>
) => {
    // 结束画布拖拽
    if (isDraggingCanvas) {
        setIsDraggingCanvas(false);
        return;
    }

    // 结束选择框
    if (isSelecting) {
        const { startX, startY, endX, endY } = selectionBox;
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);

        // 选择框内的图片
        const selectedImages = images.filter(img => {
            const imgCenterX = img.x + img.width / 2;
            const imgCenterY = img.y + img.height / 2;
            return imgCenterX >= minX && imgCenterX <= maxX &&
                imgCenterY >= minY && imgCenterY <= maxY;
        });


        // // 选择框内的视频
        const selectedVideos = videos.filter(vid => {
            const vidCenterX = vid.x + vid.width / 2;
            const vidCenterY = vid.y + vid.height / 2;
            return vidCenterX >= minX && vidCenterX <= maxX &&
                vidCenterY >= minY && vidCenterY <= maxY;
        });
        // if (selectedImages.length > 0) {
        //     setSelectedIds(selectedImages.map(img => img.id));
        //     toast.info(`Selected ${selectedImages.length} images`);
        // }
        if (selectedImages.length > 0 || selectedVideos.length > 0) {
            setSelectedIds([...selectedImages?.map(img => img.id), ...selectedVideos?.map(vid => vid.id)]);
            // toast.info(`Selected ${selectedImages.length} images and ${selectedVideos.length} videos`);
        }

        setIsSelecting(false);
        setSelectionBox(prev => ({ ...prev, visible: false }));
    }
};


// Touch event handlers for mobile (pinch-to-zoom + pan)

export const handleTouchStart = (
    e: Konva.KonvaEventObject<TouchEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
    viewport: { x: number; y: number; scale: number },
    images: PlacedImage[],
    setLastTouchDistance: React.Dispatch<React.SetStateAction<number | null>>,
    setLastTouchCenter: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
    setIsTouchingImage: (isTouching: boolean) => void,
) => {
    const touches = e.evt.touches;
    const stage = stageRef?.current;

    if (touches.length === 2) {
        const touch1 = { x: touches[0].clientX, y: touches[0].clientY };
        const touch2 = { x: touches[1].clientX, y: touches[1].clientY };

        const distance = Math.sqrt(
            Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2),
        );

        const center = {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2,
        };

        setLastTouchDistance(distance);
        setLastTouchCenter(center);
    } else if (touches.length === 1) {
        const touch = { x: touches[0].clientX, y: touches[0].clientY };

        if (stage) {
            const pos = stage.getPointerPosition();
            if (pos) {
                const canvasPos = {
                    x: (pos.x - viewport.x) / viewport.scale,
                    y: (pos.y - viewport.y) / viewport.scale,
                };

                const touchedImage = images.some((img) => {
                    return (
                        canvasPos.x >= img.x &&
                        canvasPos.x <= img.x + img.width &&
                        canvasPos.y >= img.y &&
                        canvasPos.y <= img.y + img.height
                    );
                });

                setIsTouchingImage(touchedImage);
            }
        }

        setLastTouchCenter(touch);
    }
};

export const handleTouchMove = (
    e: Konva.KonvaEventObject<TouchEvent>,
    stageRef: React.RefObject<Konva.Stage | null>,
    viewport: { x: number; y: number; scale: number },
    setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; scale: number }>>,
    lastTouchDistance: number | null,
    lastTouchCenter: { x: number; y: number } | null,
    setLastTouchDistance: React.Dispatch<React.SetStateAction<number | null>>,
    setLastTouchCenter: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
    isSelecting: boolean,
    isDraggingImage: boolean,
    isTouchingImage: boolean,
) => {
    const touches = e.evt.touches;

    if (touches.length === 2 && lastTouchDistance && lastTouchCenter) {
        e.evt.preventDefault();

        const touch1 = { x: touches[0].clientX, y: touches[0].clientY };
        const touch2 = { x: touches[1].clientX, y: touches[1].clientY };

        const distance = Math.sqrt(
            Math.pow(touch2.x - touch1.x, 2) + Math.pow(touch2.y - touch1.y, 2),
        );

        const center = {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2,
        };

        const scaleFactor = distance / lastTouchDistance;
        const newScale = Math.max(0.1, Math.min(5, viewport.scale * scaleFactor));

        const stage = stageRef?.current;
        if (stage) {
            const stageBox = stage.container().getBoundingClientRect();
            const stageCenter = {
                x: center.x - stageBox.left,
                y: center.y - stageBox.top,
            };

            const mousePointTo = {
                x: (stageCenter.x - viewport.x) / viewport.scale,
                y: (stageCenter.y - viewport.y) / viewport.scale,
            };

            const newPos = {
                x: stageCenter.x - mousePointTo.x * newScale,
                y: stageCenter.y - mousePointTo.y * newScale,
            };

            setViewport({ x: newPos.x, y: newPos.y, scale: newScale });
        }

        setLastTouchDistance(distance);
        setLastTouchCenter(center);
    } else if (
        touches.length === 1 &&
        lastTouchCenter &&
        !isSelecting &&
        !isDraggingImage &&
        !isTouchingImage
    ) {
        const hasActiveFileInput = document.querySelector('input[type="file"]');
        if (!hasActiveFileInput) {
            e.evt.preventDefault();
        }

        const touch = { x: touches[0].clientX, y: touches[0].clientY };
        const deltaX = touch.x - lastTouchCenter.x;
        const deltaY = touch.y - lastTouchCenter.y;

        setViewport((prev) => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));

        setLastTouchCenter(touch);
    }
};

export const handleTouchEnd = (
    _e: Konva.KonvaEventObject<TouchEvent>,
    setLastTouchDistance: React.Dispatch<React.SetStateAction<number | null>>,
    setLastTouchCenter: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>,
    setIsTouchingImage: (isTouching: boolean) => void,
) => {
    setLastTouchDistance(null);
    setLastTouchCenter(null);
    setIsTouchingImage(false);
};


// Handle selection
export const handleSelect = (
    id: string,
    e: Konva.KonvaEventObject<MouseEvent>,
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>
) => {
    if (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
        );
    } else {
        setSelectedIds([id]);
    }
};


export const getPrimaryColor = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      return computedStyle.getPropertyValue('--primary').trim();
    }
    // default color
    return 'white';
  };