'use client'

// Add sharp for image processing


import { aspectRatioDimensions_1280 } from '@/lib/ai-model-setting/aspectRatio';

import {  computeFileHash } from '@/utils/tools/stringGen';
import { fal_upload_file,fal_nsfw_filter_xlab} from '@/server-action/ai-generation/toolKit_client';




/**
 * Parses an aspect ratio string into a numerical ratio.
 * Supported formats:
 *  - "W:H" (e.g., "16:9", "3:2")
 *  - "W/H" (e.g., "16/9")
 *  - Direct decimal (e.g., "1.7777")
 */
function parseRatioString(r: string): number | null {
    const s = r.trim();
    if (!s) return null;

    // 1) "W:H" or "W/H"
    const m = s.match(/^(\d+(?:\.\d+)?)[/:](\d+(?:\.\d+)?)$/);
    if (m) {
        const w = parseFloat(m[1]);
        const h = parseFloat(m[2]);
        if (h > 0) return w / h;
        return null;
    }

    // 2) decimal like "1.7777"
    const asNum = Number(s);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;

    return null;
}

/**
 * Gets the numerical value of the aspect ratio from a map or the string itself.
 * Prioritizes using your existing aspectRatioDimensions_1280 (if it exists and matches),
 * otherwise parses the string itself.
 */
function ratioFromString(
    ratioString: string,
    map?: Record<string, { width: number; height: number }>
): number | undefined {
    if (map && ratioString in map) {
        const dim = map[ratioString as keyof typeof map];
        if (dim?.height) return dim.width / dim.height;
    }
    return parseRatioString(ratioString) ?? undefined; // Changed null to undefined
}


const allAspectRatios = Object.keys(aspectRatioDimensions_1280);

// Cache: Reusable for multiple comparisons of the same batch of supportedAspectRatios
const _ratioCache = new Map<string, number>();

/**
 * Finds the closest aspect ratio to the input image file
 * @param file Image file (File | Blob | string)
 * @param supportedAspectRatios List of supported aspect ratio strings (e.g., ["1:1", "16:9", ...])
 * @returns The closest aspect ratio string (e.g., "16:9")
 */

export const findClosestAspectRatio = async (
    file: File | Blob | string,
    supportedAspectRatios: string[] = allAspectRatios
): Promise<string> => {

    if (!supportedAspectRatios || supportedAspectRatios.length === 0) {
        // Provide a fallback when there are no options
        return "1:1";
    }

    // 1) Read image dimensions: prioritize createImageBitmap (faster and doesn't require DOM insertion)
    let width = 0;
    let height = 0;
    try {
        // Handle blob URL string format
        if (typeof file === 'string') {
            if (file.startsWith('blob:')) {
                // For blob URLs, use fetch to get the blob and then process it
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`Failed to fetch blob URL: ${response.status}`);
                }
                const blob = await response.blob();
                file = blob; // Assign the blob to the file variable for further processing
            } else if (file.startsWith('data:')) {
                // For base64 data URLs, convert to blob
                const response = await fetch(file);
                const blob = await response.blob();
                file = blob;
            } else {
                // For regular URLs, use fetch to get
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`Failed to fetch URL: ${response.status}`);
                }
                const blob = await response.blob();
                file = blob;
            }
        }

        // Now file should be of type File or Blob
        if (file instanceof File || file instanceof Blob) {
            if ("createImageBitmap" in window) {
                const bmp = await createImageBitmap(file);
                width = bmp.width;
                height = bmp.height;
                bmp.close(); // Release in time
            } else {
                // Fallback to Image object
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);
                try {
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = (e) => reject(e);
                        img.src = objectUrl;
                    });
                    width = img.naturalWidth || img.width;
                    height = img.naturalHeight || img.height;
                } finally {
                    URL.revokeObjectURL(objectUrl);
                }
            }
        } else {
            throw new Error('Invalid file type after processing');
        }
    } catch (e) {
        console.error("Failed to decode image:", e);
        return "1:1";
    }

    if (width <= 0 || height <= 0) {
        // Fallback for abnormal dimensions
        return "1:1";
    }

    const imageRatio = width / height;

    // 2) Pre-calculate/cache all candidate ratios
    // If aspectRatioDimensions_1280 exists in your project, you can pass it in here for priority parsing:
    // @ts-ignore - This mapping will take effect if defined in your project
    const dimMap: Record<string, { width: number; height: number }> | undefined =
        (typeof aspectRatioDimensions_1280 !== "undefined"
            ? aspectRatioDimensions_1280
            : undefined);

    let closest = supportedAspectRatios[0];
    let minDiff = Number.POSITIVE_INFINITY;

    for (const r of supportedAspectRatios) {
        let ratio = _ratioCache.get(r);
        if (ratio == null) {
            ratio = ratioFromString(r, dimMap);
            if (ratio !== undefined && Number.isFinite(ratio) && ratio > 0) {
                _ratioCache.set(r, ratio);
            }
        }
        // If parsing still fails, skip this item
        if (ratio === undefined || !Number.isFinite(ratio) || ratio <= 0) continue;

        const diff = Math.abs(imageRatio - ratio);
        if (diff < minDiff) {
            minDiff = diff;
            closest = r;
        }
    }

    // If all candidates are invalid (extreme case), fallback to "1:1"
    return closest ?? "1:1";
};

export const processImageSize = async (file: File | Blob, minSize: number = 768, maxSize: number = 1536): Promise<{ file: Blob, width: number, height: number }> => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    try {
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = objectUrl;
        });

        const MIN_SIZE = minSize || 768;
        const MAX_SIZE = maxSize || 1536;
        let newWidth = img.width;
        let newHeight = img.height;

        // If the image is too small, scale it up to MIN_SIZE
        if (newWidth < MIN_SIZE && newHeight < MIN_SIZE) {
            if (newWidth > newHeight) {
                newWidth = MIN_SIZE;
                newHeight = Math.round((newHeight * MIN_SIZE) / img.width);
            } else {
                newHeight = MIN_SIZE;
                newWidth = Math.round((newWidth * MIN_SIZE) / img.height);
            }
        }
        // If the image is too large, scale it down to MAX_SIZE
        else if (newWidth > MAX_SIZE || newHeight > MAX_SIZE) {
            if (newWidth > newHeight) {
                newWidth = MAX_SIZE;
                newHeight = Math.round((newHeight * MAX_SIZE) / img.width);
            } else {
                newHeight = MAX_SIZE;
                newWidth = Math.round((newWidth * MAX_SIZE) / img.height);
            }
        }

        // Create a canvas for image scaling
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to Blob
        const newFile = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob as Blob);
            }, 'image/jpeg');
        });

        return {
            file: newFile,
            width: newWidth,
            height: newHeight
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};



export const processFileToBase64 = async (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result); // e.g. "data:application/octet-stream;base64,..."
            } else {
                reject(new Error("Failed to read file as base64"));
            }
        };

        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(file); // Key method
    });
};





function isFileLike(v: any): v is Blob {
    return !!v && typeof v === 'object' && typeof v.arrayBuffer === 'function' && typeof v.type === 'string';
}

/**
 * Transforms various input types (string, File, Blob) into an array of Blobs.
 * Supported string formats: data URLs, blob URLs, http(s) URLs.
 * @param {Array<string|File|Blob>} items - The items to be normalized.
 * @returns {Promise<Blob[]>} A promise that resolves to an array of Blobs.
 */
// Utility: Parse any data:URL (compatible with or without ;base64)
function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
    const m = dataUrl.match(/^data:([^;,]*)(?:;charset=[^;,]*)?(;base64)?,([\s\S]*)$/);

    if (!m) throw new Error("Invalid data URL");
    const mime = m[1] && m[1].trim() ? m[1].trim() : "application/octet-stream";
    const isBase64 = !!m[2];
    const payload = m[3] ?? "";

    if (isBase64) {
        const binary = atob(payload);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return { mime, bytes };
    } else {
        // Non-base64 data: uses percent-encoding
        const decoded = decodeURIComponent(payload);
        const bytes = new TextEncoder().encode(decoded);
        return { mime, bytes };
    }
}

export async function normalizeToBlobs(items: any[]): Promise<Blob[]> {
    return Promise.all(
        items.map(async (item) => {
            if (typeof item === "string") {
                if (item.startsWith("data:")) {
                    const { mime, bytes } = parseDataUrl(item);
                    return new Blob([bytes], { type: mime });
                }
                if (item.startsWith("blob:") || item.startsWith("http://") || item.startsWith("https://")) {
                    const resp = await fetch(item);
                    return await resp.blob();
                }
            }
            if (item instanceof File) return new Blob([item], { type: item.type });
            return item as Blob;
        })
    );
}

export async function normalizeToFiles(items: any[]): Promise<File[]> {
    return Promise.all(
        items.map(async (item, idx) => {
            if (typeof item === "string") {
                if (item.startsWith("data:")) {
                    const { mime, bytes } = parseDataUrl(item);
                    const ext = (mime.split("/")[1] || "bin").split("+")[0];
                    const prefix = mime.split("/")[0] || "file";
                    return new File([bytes], `${prefix}_${idx}.${ext}`, { type: mime });
                }
                if (item.startsWith("blob:") || item.startsWith("http://") || item.startsWith("https://")) {
                    const resp = await fetch(item);
                    const blob = await resp.blob();
                    const mime = blob.type || "application/octet-stream";
                    const ext = (mime.split("/")[1] || "bin").split("+")[0];
                    const prefix = mime.split("/")[0] || "file";
                    return new File([blob], `${prefix}_${idx}.${ext}`, { type: mime });
                }
            }
            if (item instanceof Blob && !(item instanceof File)) {
                const mime = item.type || "application/octet-stream";
                const ext = (mime.split("/")[1] || "bin").split("+")[0];
                const prefix = mime.split("/")[0] || "file";
                return new File([item], `${prefix}_${idx}.${ext}`, { type: mime });
            }
            return item as File;
        })
    );
}

export async function normalizeToBase64(items: any[]): Promise<string[]> {
    return Promise.all(
        items.map(async (item) => {
            if (typeof item === "string") {
                if (item.startsWith("data:")) {
                    // Already a data:URL, return directly
                    return item;
                }
                if (item.startsWith("blob:") || item.startsWith("http://") || item.startsWith("https://")) {
                    const resp = await fetch(item);
                    const blob = await resp.blob();
                    return await blobToBase64(blob);
                }
            }
            if (item instanceof File || item instanceof Blob) {
                return await blobToBase64(item);
            }
            throw new Error("Unsupported item type for normalizeToBase64");
        })
    );
}

// Helper function: Blob → data:URL(base64)
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}



export const processInputMultiFiles = async (
    inputData: any,
    fileKeys: string[]
): Promise<Record<string, any>> => {
    const src = inputData ?? {};
    const out: Record<string, any> = { ...src };

    for (const key of fileKeys) {
        const raw = src[key];

        // Unify into an array for easier subsequent processing
        const list = Array.isArray(raw) ? raw : (raw == null ? [] : [raw]);

        if (!list.length) {
            continue;
        }

        const processed = await Promise.all(
            list.map(async (item) => {
                // 1) File/Blob -> base64
                if (isFileLike(item)) {
                    try {
                        return await processFileToBase64(item);
                    } catch {
                        throw new Error(`Failed to process file in ${key}, please reupload and try again`);
                    }
                }
                if (typeof item === "string") {
                    // If it's a temporary URL like blob:http, fetch -> base64
                    if (item.startsWith("blob:")) {
                        try {
                            const resp = await fetch(item);
                            const blob = await resp.blob();
                            return await processFileToBase64(blob);
                        } catch {
                            throw new Error(`Failed to process blob URL in ${key}, please reupload and try again`);
                        }
                    }
                    // If it's a dataURL(base64) or http(s) URL -> return as is
                    return item;
                }
                // 2) If it's already a base64(dataURL), a regular URL, or another value -> return as is
                return item;
            })
        );

        // Maintain original structure: if it was an array, keep it as an array; if it was a single value, restore it to a single value
        out[key] = Array.isArray(raw) ? processed : processed[0];
    }

    return out;
};
/**
 * Converts webp and jpeg images to PNG format using browser Canvas API
 * @param file - File object to convert (webp, jpeg, jpg)
 * @returns Promise with the converted PNG file
 */
export const convertImageToPng = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        try {
            // Check if conversion is needed
            const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
            if (!['webp', 'jpeg', 'jpg'].includes(fileExtension)) {
                // No conversion needed
                resolve(file);
                return;
            }

            // Create file reader to read the file
            const reader = new FileReader();
            reader.onload = (event) => {
                // Create an image element to load the file
                const img = new Image();
                img.onload = () => {
                    // Create canvas with the same dimensions as the image
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw the image on the canvas
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    // Draw with white background for images with transparency
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw the image
                    ctx.drawImage(img, 0, 0);

                    // Convert canvas to PNG blob
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Failed to convert image to PNG'));
                            return;
                        }

                        // Create new filename with png extension
                        const baseFilename = file.name.substring(0, file.name.lastIndexOf('.'));
                        const newFilename = `${baseFilename}.png`;

                        // Create new File object with PNG blob
                        const pngFile = new File([blob], newFilename, { type: 'image/png' });
                        resolve(pngFile);
                    }, 'image/png', 1.0); // 1.0 is maximum quality
                };

                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };

                // Set image source from FileReader result
                img.src = event.target?.result as string;
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            // Read file as data URL
            reader.readAsDataURL(file);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Process multiple images and convert them to PNG if needed
 * @param files - Array of files to process
 * @returns Promise with array of processed files
 */
export const processImagesToPng = async (files: File[]): Promise<File[]> => {
    try {
        const processedFiles = await Promise.all(
            files.map(async (file) => {
                // Only process image files
                if (file.type.startsWith('image/')) {
                    return await convertImageToPng(file);
                }
                return file;
            })
        );

        return processedFiles;
    } catch (error) {
        console.error('Error processing images to PNG:', error);
        throw new Error(`Failed to process images to PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};


interface FileUrlProcessParams {
    inputData: any,
    process_image_keys?: string[],
    process_media_keys?: string[],
    need_to_upload_image_url?: string[],
    customApiKey?: string,
}
export const processFileUrlToApiInput = async ({
    inputData,
    process_image_keys = ["control_images", "control_images_2"],
    process_media_keys = ['control_files', 'control_files_2'],
    need_to_upload_image_url = [],
    customApiKey = '',
}: FileUrlProcessParams) => {

    const options = {
        customApiKey: customApiKey,
    }
    // process image to base64
    const process_input = await processInputMultiFiles(inputData, process_image_keys);
    // console.log('process_input', process_input)
    if (need_to_upload_image_url.some(m => process_input?.model_id?.toLowerCase().includes(m))) {
        for (const key of process_image_keys) {
            const arr = process_input[key];
            if (arr && Array.isArray(arr) && arr.length > 0) {
                const uploadedUrls = await Promise.all(
                    arr.map((imgBase64: string) => fal_upload_file(imgBase64, 30 * 1024 * 1024, options))
                );
                process_input[key] = uploadedUrls; // Now it's an array of URL strings
            }
        }
    }

    for (const key of process_media_keys) {
        const arr = process_input[key];
        if (arr && Array.isArray(arr) && arr.length > 0) {
            const uploadedUrls = await Promise.all(
                arr.map((file: File) => fal_upload_file(file, 30 * 1024 * 1024, options))
            );
            process_input[key] = uploadedUrls; // Unify into a URL array
        }
    }
    return process_input;
}



