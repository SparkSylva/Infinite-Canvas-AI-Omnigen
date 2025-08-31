"use client"
import React, { useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/shadcn-ui/dialog"
import { Button } from "@/components/ui/shadcn-ui/button"
import { Badge } from "@/components/ui/shadcn-ui/badge"
import { Checkbox } from "@/components/ui/shadcn-ui/checkbox"
import { cn } from "@/lib/utils";
import {
    Info,
    ArrowDownToLine,
    CopyCheck,
    Copy,
    Download,
    CheckSquare,
    Square,
} from 'lucide-react'

import { toast } from "sonner"
import JSZip from 'jszip'
import { toKebabCase } from "@/utils/tools/stringGen";



// Helper function to get image URL from generation object
const getImageUrl = (generation: any): string => {
    // Prioritize generationUrl (new format) over imageUrl (old format)
    if (generation?.generationUrl) {
        return Array.isArray(generation.generationUrl)
            ? generation.generationUrl[0]
            : generation.generationUrl;
    }

    // Fallback to imageUrl for backward compatibility
    if (generation?.imageUrl) {
        return Array.isArray(generation.imageUrl)
            ? generation.imageUrl[0]
            : generation.imageUrl;
    }

    // Return empty string if neither exists
    return '';
};
interface ImageGalleryProps {
    generations: any[];
    enableDownload?: boolean;
    enableInfo?: boolean;
    downloadMethod?: "direct" | "pre-sign";
    imgStyle?: string;
    basis?: string;
    title?: string;
}

export const ImageGalleryWithBulkDownload: React.FC<ImageGalleryProps> = ({
    generations = [],
    enableDownload = true,
    enableInfo = true,
    imgStyle = "",
    basis = '',
    title = "Generated Images"
}) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<any | null>(null)
    const [copied, setCopied] = useState(false);

    // Bulk selection related state
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [isBulkDownloading, setIsBulkDownloading] = useState(false);

    const handleImageClick = (image: any) => {
        if (enableInfo) {
            setSelectedImage(image)
            setIsOpen(true)
        }
    }

    const downloadImage = async (imageSrc: string) => {
        let blob;
        let fileName = 'image.png';

        if (imageSrc.startsWith('data:')) {
            // Extract MIME type from base64 string
            const mimeType = imageSrc.split(';')[0].split(':')[1];
            const base64Data = imageSrc.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });

            // Determine file extension based on MIME type
            const extension = mimeType.split('/')[1];
            fileName = `image-${new Date().getTime()}.${extension}`;
        } else {
            let fetchUrl = imageSrc;
            const response = await fetch(fetchUrl);
            blob = await response.blob();
            fileName = imageSrc.split("/").pop() || 'image.png';
        }

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName;
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleDownloadClick = async (imageSrc: string) => {
        toast.info("Downloading image...");
        await downloadImage(imageSrc)
        toast.success("Downloaded successfully!");
    }

    // Bulk selection feature
    const handleImageSelect = (imageIndex: number) => {
        const imageId = imageIndex.toString();
        const newSelected = new Set(selectedImages);
        if (newSelected.has(imageId)) {
            newSelected.delete(imageId);
        } else {
            newSelected.add(imageId);
        }
        setSelectedImages(newSelected);
        setIsSelectAll(newSelected.size === generations.length);
    };

    const handleSelectAll = () => {
        if (isSelectAll) {
            setSelectedImages(new Set());
            setIsSelectAll(false);
        } else {
            const allIds = new Set(generations.map((_, index) => index.toString()));
            setSelectedImages(allIds);
            setIsSelectAll(true);
        }
    };

    // Bulk download feature
    const handleBulkDownload = async () => {
        if (selectedImages.size === 0) {
            toast.error("Please select images to download");
            return;
        }

        setIsBulkDownloading(true);

        const imagesToDownload = generations.filter((_, index) =>
            selectedImages.has(index.toString())
        );

        try {
            if (imagesToDownload.length === 1) {
                // Direct download for a single image
                toast.info("Downloading image...");
                await handleDownloadClick(getImageUrl(imagesToDownload[0]));
                toast.success("Image downloaded successfully!");
            } else {
                // Pack and download multiple images
                toast.info(`Downloading ${imagesToDownload.length} images...`);

                const zip = new JSZip();
                const promises: Promise<void>[] = [];

                imagesToDownload.forEach((image, index) => {
                    const promise = (async () => {
                        try {
                            let blob: Blob;
                            let fileName = `image_${index + 1}`;

                            const imageUrl = getImageUrl(image);

                            if (imageUrl.startsWith('data:')) {
                                // Handle Base64 images
                                const mimeType = imageUrl.split(';')[0].split(':')[1];
                                const base64Data = imageUrl.split(',')[1];
                                const byteCharacters = atob(base64Data);
                                const byteNumbers = new Array(byteCharacters.length);

                                for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }

                                const byteArray = new Uint8Array(byteNumbers);
                                blob = new Blob([byteArray], { type: mimeType });

                                const extension = mimeType.split('/')[1];
                                fileName = `image_${index + 1}.${extension}`;
                            } else {
                                // Handle network images
                                let fetchUrl = imageUrl;

            
                                const response = await fetch(fetchUrl);
                                blob = await response.blob();

                                // Get file extension from URL or from response Content-Type
                                const urlFileName = imageUrl.split("/").pop() || '';
                                const urlExtension = urlFileName.split('.').pop();

                                if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExtension.toLowerCase())) {
                                    fileName = `image_${index + 1}.${urlExtension}`;
                                } else {
                                    // Determine from Content-Type
                                    const contentType = response.headers.get('content-type');
                                    const extension = contentType?.split('/')[1] || 'png';
                                    fileName = `image_${index + 1}.${extension}`;
                                }
                            }

                            zip.file(fileName, blob);
                        } catch (error) {
                            console.error(`Failed to process image ${index + 1}:`, error);
                        }
                    })();

                    promises.push(promise);
                });

                // Wait for all image processing to complete
                await Promise.all(promises);

                // Generate zip package
                const zipBlob = await zip.generateAsync({
                    type: "blob",
                    compression: "DEFLATE",
                    compressionOptions: {
                        level: 6
                    }
                });

                // Download zip package
                const url = window.URL.createObjectURL(zipBlob);
                const link = document.createElement("a");
                link.href = url;

                // Generate a filename with a timestamp
                const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
                link.download = `AI_Generated_Images_${timestamp}.zip`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success(`Successfully downloaded ${imagesToDownload.length} images!`);
            }

            setSelectedImages(new Set());
            setIsSelectAll(false);
        } catch (error) {
            console.error("Bulk download error:", error);
            toast.error("Bulk download failed, please try again later");
        } finally {
            setIsBulkDownloading(false);
        }
    };

    if (!generations || generations.length === 0) {
        return null;
    }

    return (
        <div className='flex flex-col gap-4 w-auto'>
            {/* Title and control bar */}
            <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-medium font-bold">{title}</p>

                <div className="flex items-center gap-2">


                    {/* Bulk Download */}
                    {selectedImages.size > 0 && (
                        <Button
                            onClick={handleBulkDownload}
                            disabled={isBulkDownloading}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Download className="w-4 h-4" />
                            {isBulkDownloading ? "Downloading..." : `Download (${selectedImages.size})`}
                        </Button>
                    )}
                    {/* Select/Deselect All */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex items-center gap-2"
                    >
                        {isSelectAll ? (
                            <CheckSquare className="w-4 h-4" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        {isSelectAll ? "Deselect All" : "Select All"}
                    </Button>
                </div>
            </div>

            {/* Image grid */}
            <div className="flex flex-wrap justify-center items-center w-full">
                {generations.map((image, index) => {
                    const imageId = index.toString();
                    const isSelected = selectedImages.has(imageId);
                    const imageUrl = getImageUrl(image);

                    return (
                        <div
                            key={index}
                            className={cn(
                                "relative group max-h-[400px] overflow-hidden p-1 transition-all duration-300 hover:-translate-y-2 flex items-center justify-center",
                                basis ? basis : "flex-auto",
                                isSelected && " ring-primary shadow-lg "
                            )}
                        >
                            <img
                                src={imageUrl}
                                className={cn("w-full h-full object-cover object-center rounded-lg cursor-pointer touch-manipulation", imgStyle)}
                                onClick={() => handleImageClick(image)}
                                alt={`Generated image ${index + 1}`}
                            />

                            {/* Selection checkbox */}
                            <div className="absolute top-2 left-2">
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleImageSelect(index)}
                                    className="bg-background/50 border-2 w-6 h-6"
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {enableDownload && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        className="p-2 rounded-md opacity-75 text-foreground"
                                        onClick={(e) => { e.stopPropagation(); handleDownloadClick(imageUrl); }}
                                    >
                                        <ArrowDownToLine className="h-5 w-5" />
                                    </Button>
                                )}
                                {enableInfo && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        className="p-2 rounded-md opacity-75 text-foreground"
                                        onClick={(e) => { e.stopPropagation(); handleImageClick(image); }}
                                    >
                                        <Info className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Details dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="p-0 flex flex-col items-center justify-center rounded-none md:max-w-[70vh] md:max-h-[80vh] max-w-[80vw] max-h-[60vh]">
                    <DialogTitle asChild>
                        <VisuallyHidden.Root>
                            Image Details
                        </VisuallyHidden.Root>
                    </DialogTitle>
                    {getImageUrl(selectedImage) && (
                        <div className="w-full md:w-auto md:max-h-[60vh] max-h-[30vh] overflow-auto">
                            <img
                                src={getImageUrl(selectedImage)}
                                className={cn("mt-2 w-auto max-h-[50vh] object-contain rounded-md")}
                                alt="Selected image"
                            />
                        </div>
                    )}
                    {selectedImage?.input ? (
                        <div className="w-full mb-4 px-4 text-left md:text-left md:pl-6 flex-1 max-h-[20vh] overflow-auto">
                            {(() => {
                                const parsedInput = typeof selectedImage.input === 'string' ? JSON.parse(selectedImage.input) : selectedImage.input;
                                const prompt = parsedInput?.prompt || '';
                                // console.log('parsedInput', parsedInput)
                                return (
                                    <div>
                                        {/* Prompt Title and Copy Button */}

                                        <div className="flex items-center mb-2">
                                            {prompt && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    className="p-2"
                                                    onClick={() => handleCopy(prompt)}
                                                >
                                                    {copied ? (
                                                        <CopyCheck className="h-5 w-5" />
                                                    ) : (
                                                        <Copy className="h-5 w-5" />
                                                    )}
                                                    <span className="sr-only">Copy</span>
                                                </Button>
                                            )}

                                            {enableDownload && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    type="button"
                                                    className="p-2"
                                                    onClick={() => handleDownloadClick(getImageUrl(selectedImage))}
                                                >
                                                    <ArrowDownToLine className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Prompt Content in a Box */}
                                        {prompt && (
                                            <div className="bg-primary/10 p-4 rounded-md text-sm md:text-base">
                                                <p className="whitespace-pre-wrap">{prompt}</p>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap w-full gap-2 mt-4">
                                            {Object.entries(parsedInput)
                                                .filter(([key, value]) =>
                                                    ['aspect_ratio', "created_at", "model"]
                                                        .some(term => key.toLowerCase() === term.toLowerCase()) &&
                                                    (typeof value === 'string' || typeof value === 'number') &&
                                                    key !== 'prompt'
                                                )
                                                .sort(([keyA], [keyB]) => {
                                                    const order = ['aspect_ratio', "created_at"];
                                                    return order.indexOf(keyA.toLowerCase()) - order.indexOf(keyB.toLowerCase());
                                                })
                                                .map(([key, value]) => (
                                                    <Badge key={key} variant="outline" className="text-xs">
                                                        {key === 'created_at'
                                                            ? `created at: ${new Date(String(value)).toLocaleString()}`
                                                            : `${toKebabCase(key).replace(/[-_]/g, ' ')}: ${String(value)}`
                                                        }
                                                    </Badge>
                                                ))
                                            }
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        selectedImage?.prompt && (
                            <div className="w-full mb-4 px-4 text-left md:text-left md:pl-6 flex-1 max-h-[20vh] overflow-auto">
                                <div className="flex items-center mb-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        className="p-2"
                                        onClick={() => handleCopy(selectedImage.prompt)}
                                    >
                                        {copied ? (
                                            <CopyCheck className="h-5 w-5" />
                                        ) : (
                                            <Copy className="h-5 w-5" />
                                        )}
                                        <span className="sr-only">Copy</span>
                                    </Button>
                                    {enableDownload && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            className="p-2"
                                            onClick={() => handleDownloadClick(getImageUrl(selectedImage))}
                                        >
                                            <ArrowDownToLine className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                                <div className="bg-primary/10 p-4 rounded-md">
                                    <p className="whitespace-pre-wrap">{selectedImage.prompt}</p>
                                </div>
                            </div>
                        )
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}; 