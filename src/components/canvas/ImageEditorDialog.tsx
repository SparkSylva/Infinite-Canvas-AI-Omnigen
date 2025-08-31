'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlacedImage } from "@/types/canvas";
import { Button, Input } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/shadcn-ui/dialog";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Circle, Arrow, Transformer } from 'react-konva';
import {
  Text as TextIcon,
  Square,
  Circle as CircleIcon,
  Check,
  X,
  Palette,
  MousePointer,
  Undo,
  Redo,
  Type,
  Trash2
} from "lucide-react";
import useImage from 'use-image';
import Konva from 'konva';

interface EditorElement {
  id: string;
  type: 'text' | 'rect' | 'circle' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  // for arrow
  points?: number[]; // for Arrow
  pointerLength?: number;
  pointerWidth?: number;
  tension?: number;
}

interface HistoryState {
  elements: EditorElement[];
  selectedId: string;
}

interface Props {
  image: PlacedImage;
  setImages?: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageEditorDialog: React.FC<Props> = ({ image, setImages, isOpen, onClose }) => {
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

    // Reserve space for toolbar (~80px) and buttons (~80px) and padding (~32px)
    const reservedHeight = 80 + 80 + 32;
    const reservedWidth = 32; // padding

    return {
      width: Math.max(400, dialogMaxWidth - reservedWidth),
      height: Math.max(300, dialogMaxHeight - reservedHeight)
    };
  };

  // State
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<'text' | 'rect' | 'circle' | null>(null);
  const [currentColor, setCurrentColor] = useState<string>('#ffffff');
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Text editing state
  const [editingTextId, setEditingTextId] = useState<string>('');
  const [textInputValue, setTextInputValue] = useState<string>('');
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ elements: [], selectedId: '' }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Refs
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);


  // Load the base image
  const [baseImage] = useImage(image.src, 'anonymous');

  // History management
  const saveToHistory = useCallback((newElements: EditorElement[], newSelectedId: string = '') => {
    const newState: HistoryState = { elements: newElements, selectedId: newSelectedId };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);

    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setHistory(newHistory);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setElements(state.elements);
      setSelectedId(state.selectedId);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setElements(state.elements);
      setSelectedId(state.selectedId);
      setHistoryIndex(newIndex);
    }
  }, [history, historyIndex]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate stage and image dimensions
  // Calculate display dimensions based on current window size (align with ImageCropDialog)
  const displayDimensions = useMemo(() => {
    const maxDimensions = getMaxDisplayDimensions();
    return {
      maxWidth: maxDimensions.width,
      maxHeight: maxDimensions.height
    };
  }, [windowSize]);

  const stageAndImageProps = useMemo(() => {
    const maxWidth = displayDimensions.maxWidth;
    const maxHeight = displayDimensions.maxHeight;

    if (!baseImage) return {
      stageWidth: maxWidth,
      stageHeight: maxHeight,
      imageWidth: 0,
      imageHeight: 0,
      imageX: 0,
      imageY: 0
    };

    // Calculate the scaling factor to fit the image within max dimensions
    const scaleX = maxWidth / baseImage.width;
    const scaleY = maxHeight / baseImage.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    const scaledWidth = baseImage.width * scale;
    const scaledHeight = baseImage.height * scale;

    return {
      stageWidth: scaledWidth,
      stageHeight: scaledHeight,
      imageWidth: scaledWidth,
      imageHeight: scaledHeight,
      imageX: 0,
      imageY: 0,
    };
  }, [baseImage, displayDimensions]);

  // Handle tool click to add elements
  const handleToolClick = useCallback((tool: 'text' | 'rect' | 'circle' | 'arrow') => {
    const stage = stageRef.current;
    if (!stage) return;

    // Get center position of the stage
    const centerX = stageAndImageProps.stageWidth / 2;
    const centerY = stageAndImageProps.stageHeight / 2;

    const newElement: EditorElement = {
      id: `${tool}_${Date.now()}`,
      type: tool,
      x: centerX,
      y: centerY,
      fill: tool === 'text' ? currentColor : 'transparent', // Text uses fill, shapes are transparent
      stroke: tool === 'text' ? undefined : currentColor, // Shapes use stroke for border
      strokeWidth: tool === 'text' ? undefined : 5, // Border thickness for shapes
    };

    if (tool === 'text') {
      newElement.text = 'Double click to edit';
      newElement.fontSize = 24;
      newElement.fontFamily = 'Arial';
      // Position text at center
      newElement.x = centerX - 50; // Rough text width estimation
      newElement.y = centerY - 12; // Half font size
    } else if (tool === 'rect') {
      newElement.width = 100;
      newElement.height = 60;
      // Position rect at center
      newElement.x = centerX - 50;
      newElement.y = centerY - 30;
    } else if (tool === 'circle') {
      newElement.radius = 40;
      // Circle position is center by default
    } else if (tool === 'arrow') {


      newElement.points = [centerX - 50, centerY, centerX + 50, centerY]; // 默认一条水平箭头
      newElement.pointerLength = 10;
      newElement.pointerWidth = 10;
      newElement.tension = 0;
      newElement.fill = currentColor


    }

    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedId(newElement.id);
    setCurrentTool(null); // Reset tool after adding
    saveToHistory(newElements, newElement.id);
  }, [currentColor, elements, saveToHistory, stageAndImageProps]);

  // Handle stage click for selection only
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Clear selection if clicking on empty area
    if (e.target === e.target.getStage()) {
      setSelectedId('');
      return;
    }
  }, []);

  // Handle element selection
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, elementId: string) => {
    e.cancelBubble = true;
    setSelectedId(elementId);

    // Update color picker to match selected element's color
    const selectedElement = elements.find(el => el.id === elementId);
    if (selectedElement) {
      if (selectedElement.type === 'text') {
        setCurrentColor(selectedElement.fill || '#ffffff');
      } else {
        setCurrentColor(selectedElement.stroke || '#ffffff');
      }
    }
  }, [elements]);

  // Handle element changes (drag, resize, etc.)
  const handleElementChange = useCallback((elementId: string, newAttrs: Partial<EditorElement>, saveHistory: boolean = true) => {
    const newElements = elements.map(el =>
      el.id === elementId ? { ...el, ...newAttrs } : el
    );
    setElements(newElements);

    if (saveHistory) {
      saveToHistory(newElements, selectedId);
    }
  }, [elements, selectedId, saveToHistory]);

  // Handle text editing
  const handleTextDblClick = useCallback((elementId: string) => {
    const textElement = elements.find(el => el.id === elementId);
    if (!textElement || textElement.type !== 'text') return;

    // Get element position on stage for positioning the input
    const stage = stageRef.current;
    if (stage) {
      const elementNode = layerRef.current?.findOne(`#${elementId}`);
      if (elementNode) {
        const elementPosition = elementNode.absolutePosition();
        setTextInputPosition({
          x: elementPosition.x,
          y: elementPosition.y
        });
      }
    }

    setEditingTextId(elementId);
    setTextInputValue(textElement.text || '');
  }, [elements]);

  const handleTextInputConfirm = useCallback(() => {
    if (editingTextId && textInputValue.trim()) {
      handleElementChange(editingTextId, { text: textInputValue });
    }
    setEditingTextId('');
    setTextInputValue('');
  }, [editingTextId, textInputValue, handleElementChange]);

  const handleTextInputCancel = useCallback(() => {
    setEditingTextId('');
    setTextInputValue('');
  }, []);

  // Delete selected element
  const handleDeleteSelected = useCallback(() => {
    if (selectedId) {
      const newElements = elements.filter(el => el.id !== selectedId);
      setElements(newElements);
      setSelectedId('');
      saveToHistory(newElements, '');
    }
  }, [selectedId, elements, saveToHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle text input mode
      if (editingTextId) {
        if (e.key === 'Enter') {
          handleTextInputConfirm();
        } else if (e.key === 'Escape') {
          handleTextInputCancel();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'Escape') {
        setSelectedId('');
        setCurrentTool(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingTextId, handleDeleteSelected, handleTextInputConfirm, handleTextInputCancel, undo, redo]);

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;

    if (selectedId) {
      const node = layerRef.current?.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Save edited image
  const handleSave = useCallback(async () => {
    if (!stageRef.current || !setImages) return;

    try {
      // Create a data URL from the stage
      const dataURL = stageRef.current.toDataURL({
        mimeType: 'image/png',
        quality: 1,
      });

      // Calculate display size (similar to ImageCropDialog)
      const aspectRatio = stageAndImageProps.stageWidth / stageAndImageProps.stageHeight;
      const maxSize = 300;
      let displayWidth = maxSize;
      let displayHeight = maxSize / aspectRatio;

      if (displayHeight > maxSize) {
        displayHeight = maxSize;
        displayWidth = maxSize * aspectRatio;
      }

      // Create new image object
      const newImage: PlacedImage = {
        id: `edited_${image.id}_${Date.now()}`,
        src: dataURL,
        x: image.x + image.width + 20, // Place to the right of original image
        y: image.y,
        width: displayWidth,
        height: displayHeight,
        rotation: 0,
        isGenerated: false,
      };

      // Add the new edited image to the canvas
      setImages(prev => [...prev, newImage]);

      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error saving edited image:', error);
    }
  }, [image, setImages, onClose, stageAndImageProps]);

  const handleCancel = useCallback(() => {
    // Reset all states
    setElements([]);
    setSelectedId('');
    setCurrentTool(null);
    setCurrentColor('#ffffff');
    setEditingTextId('');
    setTextInputValue('');
    setHistory([{ elements: [], selectedId: '' }]);
    setHistoryIndex(0);
    onClose();
  }, [onClose]);

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setElements([]);
      setSelectedId('');
      setCurrentTool(null);
      setCurrentColor('#ffffff');
      setEditingTextId('');
      setTextInputValue('');
      setHistory([{ elements: [], selectedId: '' }]);
      setHistoryIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-[85vw] md:max-w-[65vw] max-h-[70vh] md:max-h-[80vh] flex flex-col"
        onContextMenuCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDownCapture={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogTitle>Edit Image</DialogTitle>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center  p-2 md:p-4 border-b gap-2">
          <div className="flex items-center gap-4">
            {/* Tool selection */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolClick('text')}
                className="flex items-center gap-2"
              >
                <TextIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Text</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolClick('rect')}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                <span className="hidden sm:inline">Rectangle</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolClick('circle')}
                className="flex items-center gap-2"
              >
                <CircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Circle</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToolClick('arrow')}
                className="flex items-center gap-2"
              >
                <MousePointer className="h-4 w-4" /> 
                <span className="hidden sm:inline">Arrow</span>
              </Button>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setCurrentColor(newColor);

                  // Update selected element's color
                  if (selectedId) {
                    const selectedElement = elements.find(el => el.id === selectedId);
                    if (selectedElement) {
                      if (selectedElement.type === 'text') {
                        handleElementChange(selectedId, { fill: newColor });
                      } else {
                        // For shapes, update stroke color
                        handleElementChange(selectedId, { stroke: newColor });
                      }
                    }
                  }
                }}
                className="w-8 h-8 rounded border cursor-pointer"
                title="Choose color"
              />
              <span className="hidden sm:inline text-sm text-muted-foreground">Color</span>
            </div>


          </div>
          {/* History controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-2"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex items-center gap-2"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          {/* Delete button */}
          {(
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
              disabled={!selectedId}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        {/* Stage container */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto p-4 relative">
          {/* Text editing input */}
          {editingTextId && (
            <div
              className="absolute z-10 border border-gray-300 rounded-md shadow-lg p-2"
              style={{
                left: textInputPosition.x + 'px',
                top: textInputPosition.y + 'px',
              }}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={textInputValue}
                  onChange={(e) => setTextInputValue(e.target.value)}
                  placeholder="Enter text..."
                  className="min-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTextInputConfirm();
                    } else if (e.key === 'Escape') {
                      handleTextInputCancel();
                    }
                    e.stopPropagation();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleTextInputConfirm}
                  className="flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTextInputCancel}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="border border-gray-300 bg-white relative">
            <Stage
              ref={stageRef}
              width={stageAndImageProps.stageWidth}
              height={stageAndImageProps.stageHeight}
              onClick={handleStageClick}
              onTap={handleStageClick}
            >
              <Layer ref={layerRef}>
                {/* Base image */}
                {baseImage && (
                  <KonvaImage
                    image={baseImage}
                    x={stageAndImageProps.imageX}
                    y={stageAndImageProps.imageY}
                    width={stageAndImageProps.imageWidth}
                    height={stageAndImageProps.imageHeight}
                    listening={false}
                  />
                )}

                {/* Render elements */}
                {elements.map((element) => {
                  if (element.type === 'text') {
                    return (
                      <KonvaText
                        key={element.id}
                        id={element.id}
                        text={element.text || ''}
                        x={element.x}
                        y={element.y}
                        fontSize={element.fontSize}
                        fontFamily={element.fontFamily}
                        fill={element.fill}
                        draggable
                        onClick={(e) => handleElementClick(e, element.id)}
                        onTap={(e) => handleElementClick(e as any, element.id)}
                        onDblClick={() => handleTextDblClick(element.id)}
                        onDblTap={() => handleTextDblClick(element.id)}
                        onDragEnd={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                        onDragMove={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          }, false);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          // Reset scale and apply to fontSize
                          node.scaleX(1);
                          node.scaleY(1);

                          handleElementChange(element.id, {
                            x: node.x(),
                            y: node.y(),
                            fontSize: (element.fontSize || 24) * Math.max(scaleX, scaleY),
                          });
                        }}
                      />
                    );
                  } else if (element.type === 'rect') {
                    return (
                      <Rect
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        height={element.height}
                        fill={element.fill}
                        stroke={element.stroke}
                        strokeWidth={element.strokeWidth}
                        draggable
                        onClick={(e) => handleElementClick(e, element.id)}
                        onTap={(e) => handleElementClick(e as any, element.id)}
                        onDragEnd={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                        onDragMove={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          }, false);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          // Reset scale and apply to width/height
                          node.scaleX(1);
                          node.scaleY(1);

                          handleElementChange(element.id, {
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, (element.width || 100) * scaleX),
                            height: Math.max(5, (element.height || 60) * scaleY),
                          });
                        }}
                      />
                    );
                  } else if (element.type === 'circle') {
                    return (
                      <Circle
                        key={element.id}
                        id={element.id}
                        x={element.x}
                        y={element.y}
                        radius={element.radius}
                        fill={element.fill}
                        stroke={element.stroke}
                        strokeWidth={element.strokeWidth}
                        draggable
                        onClick={(e) => handleElementClick(e, element.id)}
                        onTap={(e) => handleElementClick(e as any, element.id)}
                        onDragEnd={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                        onDragMove={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          }, false);
                        }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          // Reset scale and apply to radius
                          node.scaleX(1);
                          node.scaleY(1);

                          handleElementChange(element.id, {
                            x: node.x(),
                            y: node.y(),
                            radius: Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY)),
                          });
                        }}
                      />
                    );
                  } else if (element.type === 'arrow') {
                    return (
                      <Arrow
                        key={element.id}
                        id={element.id}
                 
                        points={element.points || [0, 0, 100, 0]}
                        stroke={element.stroke}
                        strokeWidth={element.strokeWidth}
                        pointerLength={element.pointerLength || 10}
                        pointerWidth={element.pointerWidth || 10}
                        tension={element.tension || 0}
                        draggable
                        onClick={(e) => handleElementClick(e, element.id)}
                        onTap={(e) => handleElementClick(e as any, element.id)}
                        onDragEnd={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          });
                        }}
                        onDragMove={(e) => {
                          handleElementChange(element.id, {
                            x: e.target.x(),
                            y: e.target.y(),
                          }, false);
                        }}
                        // onTransform={(e) => {
                        //   const node = e.target;
                        //   const s = Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()));
                        //   node.scaleX(s);
                        //   node.scaleY(s);
                        // }}
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const sRaw = Math.max(Math.abs(node.scaleX()), Math.abs(node.scaleY()));
                   
                          const s = Math.min(Math.max(sRaw, 0.2), 10);

                     
                          const basePoints = element.points || [-50, 0, 50, 0];
                          const bakedPoints = basePoints.map((v) => v * s);

                          node.scaleX(1);
                          node.scaleY(1);

                          handleElementChange(element.id, {
                            x: node.x(),
                            y: node.y(),
                            points: bakedPoints,
                            strokeWidth: (element.strokeWidth || 2) * s, 
                          });
                        }}
                      // onTransformEnd={(e) => {
                      //   const node = e.target;
                      //   const scaleX = node.scaleX();
                      //   const scaleY = node.scaleY();

                      //   node.scaleX(1);
                      //   node.scaleY(1);


                      //   handleElementChange(element.id, {
                      //     x: node.x(),
                      //     y: node.y(),
                      //     points: (element.points || [0, 0, 100, 0]).map((p, i) =>
                      //       i % 2 === 0
                      //         ? (p - (element.x || 0)) * scaleX + (element.x || 0)
                      //         : (p - (element.y || 0)) * scaleY + (element.y || 0)
                      //     ),
                      //   });
                      // }}




                      />
                    );
                  }
                  return null;
                })}

                {/* Transformer for selected element */}
                <Transformer
                  ref={transformerRef}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                  keepRatio
                  boundBoxFunc={(oldBox, newBox) => {
                    // Limit resize
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 p-2 md:p-4 border-t">
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
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}