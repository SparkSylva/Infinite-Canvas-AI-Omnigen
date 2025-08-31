import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn-ui/tooltip';

export const HelpPanel: React.FC = () => {
  return (
    <div className="">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* <button className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border hover:bg-white/95 transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button> */}
            <HelpCircle className="w-5 h-5 " />
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            align="start"
            className="max-w-[320px] p-4 bg-white/95 backdrop-blur-sm border shadow-lg"
          >
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">🎮 Help</div>
              
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  <div className="font-semibold mb-1">Mouse Operation:</div>
                  <div className="space-y-0.5 ml-2">
                    <div>• Drag Canvas: Ctrl + Left click / Right click</div>
                    <div>• Zoom: Ctrl + Scroll wheel</div>
                    <div>• Select Image: Click image</div>
                    <div>• Multi-select: Ctrl + Click or drag selection box</div>
                    <div>• Right-click menu: Right-click element</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="font-semibold mb-1">Shortcuts:</div>
                  <div className="space-y-0.5 ml-2">
                    {/* <div>• Undo: Ctrl + Z</div>
                    <div>• Redo: Ctrl + Y / Ctrl + Shift + Z</div> */}
                    <div>• Select All: Ctrl + A</div>
                    <div>• Delete: Delete / Backspace</div>
                    <div>• Copy: Ctrl + D / Ctrl + C and Ctrl + V</div>
                    <div>• Cancel Selection: Escape</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="font-semibold mb-1">File Operation:</div>
                  <div className="space-y-0.5 ml-2">
                    <div>• Drag and drop files to canvas</div>
                    <div>• Support multiple file selection upload</div>
                  </div>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default HelpPanel;
