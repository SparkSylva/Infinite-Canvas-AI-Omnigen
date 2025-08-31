import React from "react";
import { Button } from "@/components/ui/shadcn-ui/button";
import { ZoomIn, ZoomOut, Maximize2, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";

interface ZoomControlsProps {
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  setViewport: (viewport: { x: number; y: number; scale: number }) => void;
  canvasSize: {
    width: number;
    height: number;
  };
  // 历史记录功能
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  viewport,
  setViewport,
  canvasSize,
  undo,
  redo,
  canUndo,
  canRedo,
}) => {
  const handleZoomIn = () => {
    const newScale = Math.min(5, viewport.scale * 1.2);
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    // Zoom towards center
    const mousePointTo = {
      x: (centerX - viewport.x) / viewport.scale,
      y: (centerY - viewport.y) / viewport.scale,
    };

    setViewport({
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
      scale: newScale,
    });
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, viewport.scale / 1.2);
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;

    // Zoom towards center
    const mousePointTo = {
      x: (centerX - viewport.x) / viewport.scale,
      y: (centerY - viewport.y) / viewport.scale,
    };

    setViewport({
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
      scale: newScale,
    });
  };

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="absolute bottom-2 left-2 flex flex-row md:flex-col  gap-2 z-20 items-center ">
      {/* Undo/Redo controls */}
      <div
        className={cn(
          "flex flex-row md:flex-col bg-card rounded-xl overflow-clip",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:border dark:border-border",
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="w-10 h-10 p-0 rounded-none"
          title="undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border/40 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="w-10 h-10 p-0 rounded-none"
          title="redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom controls */}
      <div
        className={cn(
          "flex flex-row md:flex-col bg-card rounded-xl overflow-clip",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:border dark:border-border",
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="w-10 h-10 p-0 rounded-none"
          title="zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border/40 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="w-10 h-10 p-0 rounded-none"
          title="zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-px bg-border/40 mx-2" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetView}
          className="w-10 h-10 p-0 rounded-none"
          title="reset view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom percentage display */}
      <p
        className={cn(
          "text-xs text-muted-foreground text-center bg-card px-2 py-2 rounded-lg",
          "shadow-[0_0_0_1px_rgba(50,50,50,0.16),0_4px_8px_-0.5px_rgba(50,50,50,0.08),0_8px_16px_-2px_rgba(50,50,50,0.04)]",
          "dark:shadow-none dark:border dark:border-border",
        )}
      >
        {Math.round(viewport.scale * 100)}%
      </p>
    </div>
  );
};