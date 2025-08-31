import { CanvasViewport, CanvasSize } from "@/types/canvas";



import { urlToBase64 } from '@/utils/tools/fileUrlProcess';



// for canvas placement
export function computePlacement(
    naturalWidth: number,
    naturalHeight: number,
    index: number,
    viewport: CanvasViewport,
    canvasSize: CanvasSize,
) {
    const aspectRatio = naturalWidth / Math.max(1, naturalHeight);
    const maxSize = 300; // align with handleFileUpload
    let width = maxSize;
    let height = maxSize / aspectRatio;
    if (height > maxSize) {
        height = maxSize;
        width = maxSize * aspectRatio;
    }

    // horizontally center in current viewport, vertically near top
    const viewportCenterX = (canvasSize.width / 2 - viewport.x) / viewport.scale;
    const viewportTopY = (0 - viewport.y) / viewport.scale; // world Y for the top edge of current viewport
    const topMargin = 40 * viewport.scale; // safe padding from top in world units

    let x = viewportCenterX - width / 2;
    let y = viewportTopY + topMargin;

    // offset if multiple (diagonal stacking)
    if (index > 0) {
        x += index * 20;
        y += index * 20;
    }

    return { x, y, width, height };
}

async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    retries = 1,
    backoffMs = 300
): Promise<Response> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const resp = await fetch(url, init);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return resp;
        } catch (err) {
            lastErr = err;
            if (attempt < retries) {
                // simple linear backoff
                await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
                continue;
            }
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}



// small tool: use <img> to measure image size, throw error if failed
function measureImageByURL(objectUrl: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = objectUrl;
    });
}


// Convert remote image URL to base64 data URL and measure dimensions
export async function toImageBase64(
    url: string,
): Promise<{ base64: string; naturalWidth: number; naturalHeight: number; mime?: string } | null> {
    try {
        const resp = await fetchWithRetry(url, { cache: "no-store" }, 1);
        const originalBlob = await resp.blob();

        let finalBlob: Blob = originalBlob;
        let base64FromWatermark: string | null = null;

        // Measure dimensions via object URL, fallback to ImageBitmap
        const tempObjectUrl = URL.createObjectURL(finalBlob);
        let naturalWidth = 0;
        let naturalHeight = 0;
        try {
            const size = await measureImageByURL(tempObjectUrl);
            naturalWidth = size.naturalWidth;
            naturalHeight = size.naturalHeight;
        } catch {
            try {
                const bitmap = await createImageBitmap(finalBlob);
                naturalWidth = bitmap.width;
                naturalHeight = bitmap.height;
                bitmap.close?.();
            } catch {
                naturalWidth = 0;
                naturalHeight = 0;
            }
        } finally {
            URL.revokeObjectURL(tempObjectUrl);
        }

        // Convert to base64 data URL (prefer shared util; fallback to local reader)
        const base64 = base64FromWatermark
            ?? (await urlToBase64(url))
            ?? await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === "string") resolve(reader.result);
                    else reject(new Error("Failed to read image blob as data URL"));
                };
                reader.onerror = () => reject(new Error("FileReader error"));
                reader.readAsDataURL(finalBlob);
            });

        const mime = finalBlob.type || undefined;
        return { base64, naturalWidth, naturalHeight, mime };
    } catch {
        return null;
    }
}


function guessVideoMimeFromExt(url: string): string | null {
    const u = url.split('?')[0].toLowerCase();
    if (u.endsWith('.mp4') || u.endsWith('.m4v')) return 'video/mp4';
    if (u.endsWith('.webm')) return 'video/webm';
    if (u.endsWith('.ogg') || u.endsWith('.ogv')) return 'video/ogg';
    if (u.endsWith('.mov')) return 'video/quicktime';
    return null;
}

 
export async function toVideoObjectUrl(
    url: string
): Promise<{ objectUrl: string; naturalWidth: number; naturalHeight: number; duration?: number; blob: Blob; mime?: string } | null> {
    try {
        const resp = await fetchWithRetry(url, { cache: "no-store" }, 1);

        // get content-type
        const headerType = resp.headers.get('content-type')?.split(';')[0]?.trim() || '';
        let blob = await resp.blob();

        // if blob.type is missing or generic, then fix it
        const needsFix =
            !blob.type ||
            blob.type === 'application/octet-stream' ||
            blob.type === 'binary/octet-stream';

        let finalMime = headerType || blob.type || '';

        if (needsFix) {
            // first try header, then guess from url suffix
            const extGuess = guessVideoMimeFromExt(url);
            if (!finalMime || finalMime === 'application/octet-stream') {
                finalMime = extGuess || ''; // maybe still empty
            }

            // still empty, fallback to mp4 (most generated videos are mp4)
            if (!finalMime) finalMime = 'video/mp4';

            // rebuild a Blob with type (no data copy)
            blob = new Blob([blob], { type: finalMime });
        }

        const objectUrl = URL.createObjectURL(blob);

        // read metadata
        const meta = await new Promise<{ width: number; height: number; duration?: number } | null>((resolve) => {
            const videoEl = document.createElement("video");
            videoEl.preload = "metadata";
            videoEl.src = objectUrl;
            videoEl.crossOrigin = "anonymous";
            videoEl.muted = true;
            const onLoaded = () => {
                const width = videoEl.videoWidth || 300;
                const height = videoEl.videoHeight || 300;
                const duration = Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : undefined;
                cleanup();
                resolve({ width, height, duration });
            };
            const onError = () => { cleanup(); resolve(null); };
            const cleanup = () => {
                videoEl.removeEventListener("loadedmetadata", onLoaded);
                videoEl.removeEventListener("error", onError);
            };
            videoEl.addEventListener("loadedmetadata", onLoaded);
            videoEl.addEventListener("error", onError);
        });

        const naturalWidth = meta?.width ?? 300;
        const naturalHeight = meta?.height ?? 300;
        const duration = meta?.duration;

        return { objectUrl, naturalWidth, naturalHeight, duration, blob, mime: blob.type || finalMime };
    } catch {
        return null;
    }
}

// Convert remote video URL to base64 data URL and measure metadata
export async function toVideoBase64(
    url: string
): Promise<{ base64: string; naturalWidth: number; naturalHeight: number; duration?: number; mime?: string } | null> {
    try {
        const resp = await fetchWithRetry(url, { cache: "no-store" }, 1);

        // prefer header content-type
        const headerType = resp.headers.get('content-type')?.split(';')[0]?.trim() || '';
        let blob = await resp.blob();

        const needsFix = !blob.type || blob.type === 'application/octet-stream' || blob.type === 'binary/octet-stream';
        let finalMime = headerType || blob.type || '';
        if (needsFix) {
            const extGuess = guessVideoMimeFromExt(url);
            if (!finalMime || finalMime === 'application/octet-stream') {
                finalMime = extGuess || '';
            }
            if (!finalMime) finalMime = 'video/mp4';
            blob = new Blob([blob], { type: finalMime });
        }

        // Measure metadata via temp object URL
        const objectUrl = URL.createObjectURL(blob);
        let width = 300;
        let height = 300;
        let duration: number | undefined = undefined;
        try {
            const meta = await new Promise<{ width: number; height: number; duration?: number } | null>((resolve) => {
                const videoEl = document.createElement("video");
                videoEl.preload = "metadata";
                videoEl.src = objectUrl;
                videoEl.crossOrigin = "anonymous";
                videoEl.muted = true;
                const onLoaded = () => {
                    const w = videoEl.videoWidth || 300;
                    const h = videoEl.videoHeight || 300;
                    const d = Number.isFinite(videoEl.duration) && videoEl.duration > 0 ? videoEl.duration : undefined;
                    cleanup();
                    resolve({ width: w, height: h, duration: d });
                };
                const onError = () => { cleanup(); resolve(null); };
                const cleanup = () => {
                    videoEl.removeEventListener("loadedmetadata", onLoaded);
                    videoEl.removeEventListener("error", onError);
                };
                videoEl.addEventListener("loadedmetadata", onLoaded);
                videoEl.addEventListener("error", onError);
            });
            if (meta) {
                width = meta.width;
                height = meta.height;
                duration = meta.duration;
            }
        } finally {
            URL.revokeObjectURL(objectUrl);
        }

        // Convert video to base64 (prefer shared util; fallback to local reader)
        const base64 = (await urlToBase64(url)) ?? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') resolve(reader.result);
                else reject(new Error('Failed to read video blob as data URL'));
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });

        const mime = blob.type || finalMime || undefined;
        return { base64, naturalWidth: width, naturalHeight: height, duration, mime };
    } catch {
        return null;
    }
}






