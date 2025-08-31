export interface PlacedImage {
    id: string;
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    isGenerated?: boolean;
    parentGroupId?: string;
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    // Optional metadata for generated images (e.g., model, prompt, timestamps)
    meta?: Record<string, unknown>;
    [key: string]: any; // other meta data like prompt,model,size,etc. form input
  }
  
  export interface PlacedVideo extends Omit<PlacedImage, "isGenerated"> {
    isVideo: boolean;
    duration?: number; // Duration is derived from metadata; optional until loaded
    currentTime: number;
    isPlaying: boolean;
    volume: number;
    muted: boolean;
    isLooping?: boolean; // Whether the video should loop when it reaches the end
    isGenerating?: boolean; // Similar to isGenerated for images
    isLoaded?: boolean; // Whether the video has loaded its metadata
    isAudio?: boolean; // Whether the video is an audio file
  }
  
  export interface HistoryState {
    images: PlacedImage[];
    videos?: PlacedVideo[]; // Optional for backward compatibility
    selectedIds: string[];
  }
  
  export interface CanvasViewport {
    x: number;
    y: number;
    scale: number;
}

export interface CanvasSize {
    width: number;
    height: number;
}

  export interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  }

  export interface PreviewPlaceholder {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    text?: string;
    count?: number; // Number of items that will be placed
  }