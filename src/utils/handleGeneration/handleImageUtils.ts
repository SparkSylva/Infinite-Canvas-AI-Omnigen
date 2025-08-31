import { PlacedImage, PlacedVideo, CanvasSize, CanvasViewport } from "@/types/canvas";
import { ApiError } from "@fal-ai/client";
import { fal_rmbg_imageutils, fal_upload_file, fal_upscale_imageutils } from "@/server-action/ai-generation/toolKit_client";
import { computePlacement, toImageBase64 } from "@/utils/tools/generationResultHelper";


export interface HandleCanvasImageParams {
    image: PlacedImage;
    setImages?: React.Dispatch<React.SetStateAction<PlacedImage[]>>;
    viewport: CanvasViewport;
    canvasSize: CanvasSize;
    options?: {
        isClient?: boolean;
        customApiKey?: string;
        [key: string]: any;
    },
    setGenerationStatus?: React.Dispatch<React.SetStateAction<string>>
    setGenerationSrc?: any
}


export const handleImageRemoveBackground = async ({
    image,
    viewport,
    canvasSize,
    setImages,
    setGenerationStatus,
    options = {}
}: HandleCanvasImageParams) => {
    const { isClient, customApiKey } = options;
    try {
        if (isClient && !customApiKey) {
            throw new Error('customApiKey is required');
        }
        
        const upload_url = await fal_upload_file(image.src, 15 * 1024 * 1024, options);
        const result = await fal_rmbg_imageutils(upload_url, options);
        const rmbg_url = result?.data?.image?.url
        if (!rmbg_url) {
            throw new Error('remove bg failed');
        }
        const processResult = await toImageBase64(rmbg_url);
        if (!processResult) {
            throw new Error('processResult is null');
        }
        const { base64, naturalWidth, naturalHeight, mime } = processResult;
        const { x, y, width, height } = computePlacement(naturalWidth, naturalHeight, 1, viewport, canvasSize);
        const id = `img-${Date.now()}-${Math.random()}`;

        setImages && setImages((prev) => [
            ...prev,
            {
                id,
                src: base64,
                x,
                y,
                width,
                height,
                rotation: 0,
                isGenerated: false,
            },
        ]);




    } catch (error: any) {
        let err_msg = "Unexpected error occurred"

        if (error instanceof ApiError || error?.body?.detail?.length > 0) {
            console.error("ApiError error body:", error?.body);
            const error_type = error?.body?.detail[0].type
            const error_message = error?.body?.detail[0].msg
            console.error("ApiError status:", error?.status);
            err_msg = `api error: ${error?.status}; error_type: ${error_type}; error_message: ${error_message}`
        }
        else {
            err_msg = error?.message || "Unexpected error occurred, please check your api key"
        }
        setGenerationStatus && setGenerationStatus(error?.message || "Unexpected error occurred")
    }
}


export const handleImageUpcale = async ({
    image,
    viewport,
    canvasSize,
    setImages,
    setGenerationStatus,
    options = {}
}: HandleCanvasImageParams) => {
    const { isClient, customApiKey } = options;
    try {
        if (isClient && !customApiKey) {
            throw new Error('customApiKey is required');
        }
        const upload_url = await fal_upload_file(image.src, 15 * 1024 * 1024, options);
        const result = await fal_upscale_imageutils(upload_url, options);
        const upscale_url = result?.data?.image?.url
        if (!upscale_url) {
            throw new Error('upscale failed');
        }

        let processResult = upscale_url
        try {
            processResult = await toImageBase64(upscale_url);
        } catch (error) {
            console.error('toImageBase64 failed, use original url', error)
        }
        if (!processResult) {
            throw new Error('blobResult is null');
        }
        
        const { base64, naturalWidth, naturalHeight, mime } = processResult;
        const { x, y, width, height } = computePlacement(naturalWidth, naturalHeight, 1, viewport, canvasSize);
        const id = `img-${Date.now()}-${Math.random()}`;

        setImages && setImages((prev) => [
            ...prev,
            {
                id,
                src: base64,
                x,
                y,
                width,
                height,
                rotation: 0,
                isGenerated: false,
            },
        ]);
    } catch (error: any) {
        let err_msg = "Unexpected error occurred"

        if (error instanceof ApiError || error?.body?.detail?.length > 0) {
            console.error("ApiError error body:", error?.body);
            const error_type = error?.body?.detail[0].type
            const error_message = error?.body?.detail[0].msg
            console.error("ApiError status:", error?.status);
            err_msg = `api error: ${error?.status}; error_type: ${error_type}; error_message: ${error_message}`
        }
        else {
            err_msg = error?.message || "Unexpected error occurred, please check your api key"
        }
        setGenerationStatus && setGenerationStatus(error?.message || "Unexpected error occurred")
    }
}