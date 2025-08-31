




export async function toObjectUrl(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        return objectUrl;
    } catch (e) {
        return url;
    }
}

// Convert a remote URL to a base64 data URL string
export async function urlToBase64(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) return null;
        let blob = await resp.blob();

        // Prefer content-type from header; fallback to blob.type; finally infer from extension
        const headerType = resp.headers.get('content-type')?.split(';')[0]?.trim() || '';
        let mime = headerType || blob.type || '';

        if (!mime || mime === 'application/octet-stream' || mime === 'binary/octet-stream') {
            const u = url.split('?')[0].toLowerCase();
            if (u.endsWith('.png')) mime = 'image/png';
            else if (u.endsWith('.jpg') || u.endsWith('.jpeg')) mime = 'image/jpeg';
            else if (u.endsWith('.gif')) mime = 'image/gif';
            else if (u.endsWith('.webp')) mime = 'image/webp';
            else if (u.endsWith('.svg')) mime = 'image/svg+xml';
            else if (u.endsWith('.mp4')) mime = 'video/mp4';
            else if (u.endsWith('.mov')) mime = 'video/quicktime';
            else mime = 'application/octet-stream';

            // Rewrap blob to carry the inferred type
            if (!blob.type || blob.type === 'application/octet-stream' || blob.type === 'binary/octet-stream') {
                blob = new Blob([blob], { type: mime });
            }
        }

        // Convert Blob to base64 data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') resolve(reader.result);
                else reject(new Error('Failed to read blob as data URL'));
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });

        // Normalize MIME if the reader produced a generic or empty one
        if (mime && (dataUrl.startsWith('data:;base64,') || dataUrl.startsWith('data:application/octet-stream;base64,') || dataUrl.startsWith('data:binary/octet-stream;base64,'))) {
            const payload = dataUrl.split(',')[1] ?? '';
            return `data:${mime};base64,${payload}`;
        }

        return dataUrl;
    } catch (e) {
        // Fall back to original URL to avoid breaking callers expecting a string
        return url;
    }
}