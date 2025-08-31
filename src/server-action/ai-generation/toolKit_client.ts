'use client'

import { ApiError, createFalClient } from "@fal-ai/client";

import type { FalClient } from "@fal-ai/client";

import { normalizeToBlobs } from "@/utils/tools/ImagePreProcess";


export const fal_upload_file = async (file: File | Blob | string, maxFileSize: number = 30 * 1024 * 1024, options: any = {}) => {

    const { isClient, customApiKey } = options;

    const fal_client: FalClient = createFalClient({
        credentials: customApiKey || "", // or a function that returns a string
    });

    const fileBlob = await normalizeToBlobs([file]);

    // check file size
    if (fileBlob[0].size > maxFileSize) {
        throw new Error(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit, try another file`);
    }
    // Upload the file using fal storage
    const url = await fal_client.storage.upload(fileBlob[0]);

    return url;
}

export const fal_rmbg_imageutils = async (image_url: string, options: any = {}): Promise<any> => {

    const { isClient, customApiKey } = options;

    const fal_client: FalClient = createFalClient({
        credentials: customApiKey || "", // or a function that returns a string
    });


    const result = await fal_client.subscribe("fal-ai/imageutils/rembg", {
        input: {
            image_url: image_url
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
            }
        },
        pollInterval: 5000,
    });

    // Process the result and return boolean
    const resultData = result.data || result;

    return result
};
export const fal_upscale_imageutils = async (image_url: string, options: any = {}): Promise<any> => {

    const { isClient, customApiKey } = options;

    const fal_client: FalClient = createFalClient({
        credentials: customApiKey || "", // or a function that returns a string
    });


    const result = await fal_client.subscribe("fal-ai/recraft/upscale/crisp", {
        input: {
            image_url: image_url
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
            }
        },
        pollInterval: 5000,
    });



    return result
};


export const fal_nsfw_filter_xlab = async (detect_image: string, options: any = {}): Promise<boolean> => {


    const { isClient, customApiKey } = options;

    const fal_client: FalClient = createFalClient({
        credentials: customApiKey || "", // or a function that returns a string
    });


    const result = await fal_client.subscribe("fal-ai/x-ailab/nsfw", {
        input: {
            image_urls: [detect_image] // array of image urls base64 or url format
        },
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log);
            }
        },
        pollInterval: 3000,

    });

    console.log('fal_nsfw_filter result:', result);

    // Process the result and return boolean
    const resultData = result.data || result;

    // Handle has_nsfw_concepts array format
    let hasNsfwConcepts = false;
    if (Array.isArray(resultData.has_nsfw_concepts)) {
        // If it's an array, check if any value is true
        hasNsfwConcepts = resultData.has_nsfw_concepts.some((concept: boolean) => concept === true);
    } else if (typeof resultData.has_nsfw_concepts === 'boolean') {
        // If it's a boolean, use it directly
        hasNsfwConcepts = resultData.has_nsfw_concepts;
    }

    return hasNsfwConcepts;
};