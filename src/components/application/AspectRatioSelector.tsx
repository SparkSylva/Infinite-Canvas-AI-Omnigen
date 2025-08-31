'use client'
import React, { useState } from 'react';
import { Button, Label } from '@/components/ui/';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/shadcn-ui/popover";
import { ChevronDown } from 'lucide-react';
import { aspectRatioDimensions_1280 } from '@/lib/ai-model-setting/aspectRatio';


const allAspectRatios = Object.keys(aspectRatioDimensions_1280);

// Define the props interface
interface AspectRatioSelectorProps {
    handleAspectRatioChange: (ratio: string) => void;
    customAspectRatios?: string[]; // Optional prop for custom aspect ratios
    selectedRatio?:any;
    disabled?:boolean
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ handleAspectRatioChange, customAspectRatios }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState("1:1");

    // Use customAspectRatios if provided, otherwise fallback to allAspectRatios
    const aspectRatios = customAspectRatios || allAspectRatios;

    // The first 5 options to show by default
    const visibleRatios = customAspectRatios ? customAspectRatios.slice(0, 5) : ["1:1", "3:4", "16:9", "4:3", "9:16"]
    
    // Check if the selected ratio is in the first 5 options
    const isSelectedRatioVisible = visibleRatios.includes(selectedRatio);

    // If the selected ratio is not in the first 5, add it as the 6th option
    const displayRatios = isSelectedRatioVisible
        ? visibleRatios
        : [...visibleRatios, selectedRatio];

    return (
        <div className='space-y-4'>
            <Label>Aspect ratio</Label>
            <Popover onOpenChange={(open) => setIsExpanded(open)}>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 px-3 py-2">
                        <svg 
                            className="w-4 h-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span>{selectedRatio}</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                    <div className="grid grid-cols-3 gap-2">
                        {displayRatios.map((ratio) => (
                            <Button
                                key={ratio}
                                variant={selectedRatio === ratio ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedRatio(ratio);
                                    handleAspectRatioChange(ratio);
                                }}
                                type="button"
                                className="text-sm"
                            >
                                {ratio}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};




export const AspectRatioSelectorExternal: React.FC<AspectRatioSelectorProps> = ({ handleAspectRatioChange, customAspectRatios,selectedRatio,disabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // const [selectedRatio, setSelectedRatio] = useState("1:1");

    // Use customAspectRatios if provided, otherwise fallback to allAspectRatios
    const aspectRatios = customAspectRatios || allAspectRatios;

    // The first 5 options to show by default
    // const visibleRatios = aspectRatios.slice(0, 5);
    const visibleRatios = customAspectRatios ? customAspectRatios.slice(0, 5) : ["1:1", "3:4", "16:9", "4:3", "9:16"]
    // const baseAspectRatios=["1:1","3:4","16:9"]
    // Check if the selected ratio is in the first 5 options
    const isSelectedRatioVisible = visibleRatios.includes(selectedRatio);

    // If the selected ratio is not in the first 5, add it as the 6th option
    const displayRatios = isSelectedRatioVisible
        ? visibleRatios
        : [...visibleRatios, selectedRatio];

    const { width, height } = aspectRatioDimensions_1280[selectedRatio as keyof typeof aspectRatioDimensions_1280] || { width: 100, height: 100 };

    return (
        <div className='space-y-4 w-full'>
            <Label>Aspect ratio</Label>
            <div className="flex items-center space-x-2 w-full">
                <div className="flex flex-wrap gap-2 w-full">
                    {displayRatios.map((ratio) => (
                        <Button
                            key={ratio}
                            variant={selectedRatio === ratio ? 'default' : 'outline'}
                            onClick={() => {
                                // setSelectedRatio(ratio);
                                handleAspectRatioChange(ratio);
                            }}
                            type='button'
                            disabled={disabled}
                        >
                            {ratio}
                        </Button>
                    ))}
                </div>

                <Popover onOpenChange={(open) => setIsExpanded(open)}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="px-2">
                            <ChevronDown
                                className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4">
                        <div className="grid grid-cols-3 gap-2">
                            {aspectRatios.map((ratio) => (
                                <Button
                                    key={ratio}
                                    variant={selectedRatio === ratio ? 'default' : 'outline'}
                                    onClick={() => {
                                        // setSelectedRatio(ratio);
                                        handleAspectRatioChange(ratio);
                                    }}
                                    type="button"
                                    className="text-sm"
                                    disabled={disabled}
                                >
                                    {ratio}
                                </Button>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-center items-center h-48">
                            <div
                                className="border border-gray-400"
                                style={{
                                    width: `${(width / 1536) * 200}px`,  // Scale down width
                                    height: `${(height / 1536) * 200}px` // Scale down height
                                }}
                            >
                                <p className="text-center mt-1 text-xs">{selectedRatio}</p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};


export const AspectRatioSelectorPop: React.FC<AspectRatioSelectorProps> = ({ handleAspectRatioChange, customAspectRatios, selectedRatio, disabled }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Use customAspectRatios if provided, otherwise fallback to allAspectRatios
    const aspectRatios = customAspectRatios || allAspectRatios;

    // The first 5 options to show by default
    const visibleRatios = customAspectRatios || allAspectRatios;
    
    // Check if the selected ratio is in the first 5 options
    const isSelectedRatioVisible = visibleRatios.includes(selectedRatio);

    // If the selected ratio is not in the first 5, add it as the 6th option
    const displayRatios = isSelectedRatioVisible
        ? visibleRatios
        : [...visibleRatios, selectedRatio];

    return (
        <div className='space-y-4'>
            {/* <Label>Aspect ratio</Label> */}
            <Popover onOpenChange={(open) => setIsExpanded(open)}>
                <PopoverTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className="flex items-center gap-2 px-3 py-2"
                        disabled={disabled}
                    >
                        <svg 
                            className="w-4 h-4" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <span>{selectedRatio || "1:1"}</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                    <div className="grid grid-cols-3 gap-2">
                        {displayRatios.map((ratio) => (
                            <Button
                                key={ratio}
                                variant={selectedRatio === ratio ? 'default' : 'outline'}
                                onClick={() => {
                                    handleAspectRatioChange(ratio);
                                }}
                                type="button"
                                className="text-sm"
                                disabled={disabled}
                            >
                                {ratio}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};
