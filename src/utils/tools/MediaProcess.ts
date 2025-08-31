'use client'
// util/mediaprocess.ts
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'


export const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);

        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
            let media: HTMLMediaElement = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video');
            media.src = url;

            media.onloadedmetadata = () => {
                resolve(media.duration);
                URL.revokeObjectURL(url);
            };
            media.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`${file.name}: Failed to load media`));
            };
        } else {
            URL.revokeObjectURL(url);
            reject(new Error('Unsupported media type'));
        }
    });
};
// ========== Utility: Time to String ==========
function toTimeString(t: number | string): string {
    if (typeof t === 'number' && Number.isFinite(t)) {
        const s = Math.max(0, t);
        const hh = Math.floor(s / 3600);
        const mm = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        const pad = (n: number) => String(n).padStart(2, '0');
        const dec = ss % 1;
        const sec = dec ? ss.toFixed(3) : String(Math.floor(ss));
        return `${pad(hh)}:${pad(mm)}:${sec.padStart(2, '0')}`;
    }
    return String(t);
}

// ========== 1) Trim Audio ==========
export async function trimAudio({
    file,
    start,
    end,
    setMessage,
  }: {
    file: File;
    start: number | string;
    end: number | string;
    setMessage?: (msg: string) => void;
  }): Promise<File> {
    const ffmpeg = new FFmpeg();
    const uid =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Date.now());
  
    // Extension (default mp3)
    const name = file.name || 'audio';
    const dot = name.lastIndexOf('.');
    const inExt = dot > -1 ? name.slice(dot + 1).toLowerCase() : 'mp3';
    const outExt = inExt || 'mp3';
  
    const baseName = dot > 0 ? name.slice(0, dot) : name;
    const inputFilename = `input_${uid}.${outExt}`;
    const outputFilename = `output_${uid}.${outExt}`;
  
    const startStr = toTimeString(start);
    const endStr = toTimeString(end);
    const startNum = typeof start === 'number' ? Math.max(0, start) : null;
    const endNum = typeof end === 'number' ? Math.max(0, end) : null;
    const useDuration = startNum !== null && endNum !== null && endNum > startNum;
    const durationStr = useDuration ? String(endNum - startNum) : null;
  
    try {
      if (!ffmpeg.loaded) await ffmpeg.load();
  
      ffmpeg.on('progress', ({ progress }: { progress: number }) => {
        if (setMessage) setMessage(`Processing: ${(progress * 100).toFixed(2)}%`);
      });
  
      const data = new Uint8Array(await file.arrayBuffer());
      await ffmpeg.writeFile(inputFilename, data);
  
      if (setMessage) setMessage('Trimming audio (no re-encode)...');
  
      // Key: No re-encoding, directly copy the audio stream
      await ffmpeg.exec([
        '-ss', startStr,
        '-i', inputFilename,
        ...(useDuration && durationStr ? ['-t', durationStr] : ['-to', endStr]),
        '-vn',
        '-map', '0:a:0?',            // Only the first audio track (ignored if not present)
        '-c', 'copy',                 // ★ No re-encoding
        '-avoid_negative_ts', 'make_zero',
        '-y',
        outputFilename,
      ]);
  
      const outData = (await ffmpeg.readFile(outputFilename)) as Uint8Array;
      if (!outData?.length) throw new Error('Audio trim failed: empty output');
  
      const mime =
        outExt === 'mp3' ? 'audio/mpeg'
        : outExt === 'm4a' ? 'audio/mp4'
        : outExt === 'aac' ? 'audio/aac'
        : outExt === 'wav' ? 'audio/wav'
        : outExt === 'flac' ? 'audio/flac'
        : outExt === 'ogg' ? 'audio/ogg'
        : outExt === 'opus' ? 'audio/ogg'
        : 'audio/mpeg';
  
      const newFile = new File([new Blob([outData], { type: mime })], `${baseName}_trim.${outExt}`, { type: mime });
      if (setMessage) setMessage('Done');
      return newFile;
    } finally {
      try {
        // @ts-ignore
        if (typeof ffmpeg.deleteFile === 'function') {
          // @ts-ignore
          await ffmpeg.deleteFile(inputFilename);
          // @ts-ignore
          await ffmpeg.deleteFile(outputFilename).catch(() => {});
        }
      } catch {}
      ffmpeg.terminate();
    }
  }
  

// ========== 2) Trim Video ==========
export async function trimVideo({
    file,
    start,
    end,
    setMessage,
}: {
    file: File;
    start: number | string;
    end: number | string;
    setMessage?: (msg: string) => void;
}): Promise<File> {
    const ffmpeg = new FFmpeg();
    const uid =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : String(Date.now());

    // Get extension (default mp4)
    const name = file.name || 'video';
    const dot = name.lastIndexOf('.');
    const inExt = dot > -1 ? name.slice(dot + 1).toLowerCase() : 'mp4';
    const outExt = inExt || 'mp4';

    const baseName = dot > 0 ? name.slice(0, dot) : name;
    const inputFilename = `input_${uid}.${outExt}`;
    const outputFilename = `output_${uid}.${outExt}`;

    // Simple and universal: re-encode with H.264 + AAC (compatible with mp4/mov/most containers)
    // No container/codec branching, keep implementation minimal
    const startStr = toTimeString(start);
    const endStr = toTimeString(end);
    const startNum = typeof start === 'number' ? Math.max(0, start) : null;
    const endNum = typeof end === 'number' ? Math.max(0, end) : null;
    const useDuration = startNum !== null && endNum !== null && endNum > startNum;
    const durationStr = useDuration ? String(endNum - startNum) : null;

    try {
        if (!ffmpeg.loaded) await ffmpeg.load();

        ffmpeg.on('progress', ({ progress }: { progress: number }) => {
            if (setMessage) setMessage(`Processing: ${(progress * 100).toFixed(2)}%`);
        });

        const data = new Uint8Array(await file.arrayBuffer());
        await ffmpeg.writeFile(inputFilename, data);

        if (setMessage) setMessage('Trimming video...');
        // await ffmpeg.exec([
        //     '-ss', startStr,
        //     '-i', inputFilename,
        //     ...(useDuration && durationStr ? ['-t', durationStr] : ['-to', endStr]),
        //     '-c:v', 'libx264',
        //     '-preset', 'veryfast',
        //     '-crf', '23',
        //     '-pix_fmt', 'yuv420p',
        //     '-c:a', 'aac',
        //     '-b:a', '128k',
        //     '-movflags', '+faststart',
        //     '-y',
        //     outputFilename,
        // ]);
        await ffmpeg.exec([
            '-ss', startStr,       // Start time, placing before -i is more efficient (almost instant for keyframe alignment)
            '-i', inputFilename,
            ...(useDuration && durationStr ? ['-t', durationStr] : ['-to', endStr]),
            '-c', 'copy',          // Copy both video and audio streams directly, no re-encoding
            '-y',
            outputFilename,
          ]);
          
        const outData = (await ffmpeg.readFile(outputFilename)) as Uint8Array;
        if (!outData?.length) throw new Error('Video trim failed: empty output');

        const mime =
            outExt === 'mp4' ? 'video/mp4'
                : outExt === 'mov' ? 'video/quicktime'
                    : outExt === 'webm' ? 'video/webm'
                        : outExt === 'mkv' ? 'video/x-matroska'
                            : 'video/mp4';

        const newFile = new File([new Blob([outData], { type: mime })], `${baseName}_trim.${outExt}`, { type: mime });
        if (setMessage) setMessage('Done');
        return newFile;
    } finally {
        try {
            // @ts-ignore
            if (typeof ffmpeg.deleteFile === 'function') {
                // @ts-ignore
                await ffmpeg.deleteFile(inputFilename);
                // @ts-ignore
                await ffmpeg.deleteFile(outputFilename).catch(() => { });
            }
        } catch { }
        ffmpeg.terminate();
    }
}

type TranscodeParams = {
    ffmpeg: FFmpeg,
    videoElementSetter: (url: string) => void
};


// Function to initialize the FFmpeg library
// export async function loadFFmpeg({
//     setIsLoading,
//     setLoaded,
//     ffmpeg,
//     setMessage
// }: LoadFFmpegParams): Promise<void> {
//     setIsLoading(true);
//     const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

//     ffmpeg.on('log', ({ message }) => {
//         setMessage(message);
//     });

//     await ffmpeg.load({
//         coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
//         wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
//     });

//     setLoaded(true);
//     setIsLoading(false);
// }

type AudioProcessParams = {
    // ffmpeg: FFmpeg,
    file: File  // Now expecting a File object instead of a URL
    audioSetter?: (url: string) => void,
    setMessage?: (message: string) => void,
    options?: {
        [key: string]: any,
    }
};
type VideoFrameProcessParams = {
    // ffmpeg: FFmpeg,
    file: File  // Now expecting a File object instead of a URL
    extract_time: (number | 'start' | 'end')[],  // Allow 'start' and 'end' as special values
    setMessage?: (message: string) => void | null,
    options?: {
        [key: string]: any,
    }
};

// Function to transcode video to mp4
export async function transcodeVideo({
    ffmpeg,
    videoElementSetter
}: TranscodeParams): Promise<void> {
    if (!ffmpeg.loaded) {
        await ffmpeg.load()
    }
    // await ffmpeg.writeFile('input.avi', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi'));
    await ffmpeg.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'));
    await ffmpeg.exec(['-i', 'input.avi', 'output.mp4']);
    const data = (await ffmpeg.readFile('output.mp4')) as any;
    videoElementSetter(URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })));
}

function pickExtensionFromMime(mime: string | undefined): string | null {
    if (!mime) return null;
    // Common mappings, can be extended as needed
    const map: Record<string, string> = {
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/x-matroska': 'mkv',
        'video/webm': 'webm',
        'video/avi': 'avi',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/aac': 'aac',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg',
    };
    return map[mime] ?? null;
}

// Function to extract audio from video as mp3

export async function extractAudioFromVideo({
    file,
    audioSetter,
    setMessage,
}: AudioProcessParams): Promise<File> {
    const ffmpeg = new FFmpeg();
    const uid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());

    // Filename and extension handling
    const originalName = file.name ?? 'input';
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;

    // More reliable extension inference
    const mimeExt = pickExtensionFromMime(file.type);
    const nameExt = (lastDot > -1 && originalName.slice(lastDot + 1)) || null;
    const inputExt = mimeExt || nameExt || ''; // Don't use an extension if uncertain

    const inputFilename = inputExt ? `input_${uid}.${inputExt}` : `input_${uid}`;
    const outputFilename = `output_${uid}.mp3`;
    // console.log('inputFilename', inputFilename)
    // console.log('outputFilename', outputFilename)
    try {
        if (!ffmpeg.loaded) {
            await ffmpeg.load();
        }

        ffmpeg.on('progress', ({ progress, time }: { progress: number; time: number }) => {
            if (setMessage) setMessage(`Processing: ${(progress * 100).toFixed(2)}%`);
        });
        // ffmpeg.on('log', (log: any) => {
        //     console.log('[ffmpeg:log]', log);
        // });

        const data = await fileToUint8Array(file);
        await ffmpeg.writeFile(inputFilename, data);

        if (setMessage) setMessage('Extracting audio...');

        // More robust parameters (prioritize libmp3lame, fallback if unavailable)
        // First, try libmp3lame
        try {
            await ffmpeg.exec([
                '-i', inputFilename,
                '-vn',
                '-map', 'a:0?',
                '-c:a', 'libmp3lame',
                '-b:a', '128k',
                '-ar', '44100',
                '-ac', '2',
                '-y',
                outputFilename,
            ]);
        } catch (e) {
            // Fallback encoding parameters (some builds lack libmp3lame)
            await ffmpeg.exec(['-i', inputFilename, '-q:a', '6', '-map', 'a', outputFilename, '-y']);

            // await ffmpeg.exec([
            //     '-i', inputFilename,
            //     '-vn',
            //     '-map', 'a:0?',
            //     '-q:a', '2',
            //     '-y',
            //     outputFilename,
            // ]);
        }

        const audioData = (await ffmpeg.readFile(outputFilename)) as Uint8Array;
        if (!audioData || audioData.length === 0) {
            throw new Error('Failed to produce audio; output is empty. The input may not contain an audio stream.');
        }

        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        if (audioSetter) {
            const objectUrl = URL.createObjectURL(blob);
            audioSetter(objectUrl);
            // ⚠️ Reminder: Remember to call URL.revokeObjectURL(objectUrl) when the component unmounts or the audio is replaced
        }

        if (setMessage) setMessage('Done');

        const newFile = new File([blob], `${baseName}.mp3`, { type: 'audio/mpeg' });
        return newFile;
    } finally {
        // Clean up temporary files if possible (if your FFmpeg instance provides deleteFile)
        try {
            // @ts-ignore
            if (typeof ffmpeg.deleteFile === 'function') {
                // @ts-ignore
                await ffmpeg.deleteFile(inputFilename);
                // @ts-ignore
                await ffmpeg.deleteFile(outputFilename);
            }
        } catch {
            /* noop */
        }
        ffmpeg.terminate();
    }
}


// Function to convert any audio file to compressed MP3 format
export async function convertAudioToMp3({
    file,
    audioSetter,
    setMessage,
}: AudioProcessParams): Promise<File> {
    const ffmpeg = new FFmpeg();
    try {
        if (!ffmpeg.loaded) {
            await ffmpeg.load()
        }
        ffmpeg.on('progress', ({ progress, time }) => {
            // console.debug(`[FFmpeg Progress]: ${(progress * 100).toFixed(2)}% (${time}ms)`);
            if (setMessage) {
                setMessage(`Processing: ${(progress * 100).toFixed(2)}%`);
            }
        });
        const fileName = file.name;
        const extension = fileName.split('.').pop() || 'mp3'; // Default to 'mp3' if no extension found
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

        const inputFilename = `input.${extension}`;
        const outputFilename = `output.mp3`;

        // Convert File to Uint8Array using FileReader
        const data = await fileToUint8Array(file);

        // Write the file using the updated name and data
        if (setMessage) {
            // setMessage('processing convertAudioToMp3')
        }
        // console.debug('processing convertAudioToMp3')
        await ffmpeg.writeFile(inputFilename, data);  //-b:a 128k  '-qscale:a', '9'  '-ar', '44100', '-ac', '1'
        await ffmpeg.exec(['-i', inputFilename, '-codec:a', 'libmp3lame', '-b:a', '128k', outputFilename]);  // 0-9
        // await ffmpeg.exec(['-i', inputFilename, '-b:a', '48k', outputFilename]);  // 0-9
        const audioData = (await ffmpeg.readFile(outputFilename, "binary")) as Uint8Array;
        const audioblob = new Blob([audioData], { type: 'audio/mp3' });
        if (audioSetter)
            audioSetter(URL.createObjectURL(audioblob));
        if (setMessage) {
            setMessage('processing convertAudioToMp3 done')
        }

        // const newfile = new File([audioblob], `${baseName}.mp3`, {
        //     type: 'audio/mp3',
        // });
        return new File([audioblob], `${baseName}.mp3`, {
            type: 'audio/mp3',
        });
    }
    finally {
        ffmpeg.terminate();
    }

}



function fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                resolve(new Uint8Array(reader.result as ArrayBuffer));
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}




type SplitAudioParams = {
    file: File,
    audioSetter?: (urls: string[]) => void | null,
    setMessage?: (message: string) => void | null,
    options?: {
        maxDuration?: number,
        [key: string]: any,
    }
};

export async function splitAudio({
    file,
    audioSetter,
    setMessage,
    options
}: SplitAudioParams): Promise<File[]> {
    const ffmpeg = new FFmpeg();
    const MAX_DURATION = options?.maxDuration || 3600; // Maximum segment duration in seconds (1 hour)
    const fileName = file.name;
    const extension = fileName.split('.').pop() || 'mp3';
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

    if (setMessage) {
        setMessage('Initializing FFmpeg...');
    }

    try {
        if (!ffmpeg.loaded) {
            await ffmpeg.load();
        }

        const data = await fileToUint8Array(file);
        const inputFilename = `input.${extension}`;
        await ffmpeg.writeFile(inputFilename, data);

        if (setMessage) {
            setMessage('Getting audio duration...');
        }

        // Get the duration of the audio
        const duration = await getMediaDuration(file);
        const segments = Math.ceil(duration / MAX_DURATION);

        if (setMessage) {
            setMessage(`Splitting audio into ${segments} segment(s)...`);
        }

        const segmentFiles: File[] = [];
        const audioURLs: string[] = [];

        for (let i = 0; i < segments; i++) {
            const startTime = i * MAX_DURATION;
            const outputFilename = `output_${i + 1}.mp3`;

            await ffmpeg.exec([
                '-i', inputFilename,
                '-ss', `${startTime}`,
                '-t', `${MAX_DURATION}`,
                '-c', 'copy',
                outputFilename,
            ]);

            const audioData = await ffmpeg.readFile(outputFilename);
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
            const newFile = new File([audioBlob], `${baseName}_part_${i + 1}.mp3`, {
                type: 'audio/mp3',
            });

            segmentFiles.push(newFile);
            audioURLs.push(URL.createObjectURL(audioBlob));
        }

        if (audioSetter) {
            audioSetter(audioURLs);
        }

        if (setMessage) {
            setMessage('Audio splitting completed.');
        }

        return segmentFiles;
    } finally {
        ffmpeg.terminate();
    }
}

// Function to extract frames from video at specific timestamps
export async function extractFramesFromVideo({
    file,
    extract_time,
    setMessage,
}: VideoFrameProcessParams): Promise<File[]> {
    const ffmpeg = new FFmpeg();
    try {
        if (!ffmpeg.loaded) {
            await ffmpeg.load();
        }

        ffmpeg.on('progress', ({ progress, time }: { progress: number, time: number }) => {
            if (setMessage) {
                setMessage(`Processing: ${(progress * 100).toFixed(2)}%`);
            }
        });

        const fileName = file.name;
        const extension = fileName.split('.').pop() || 'mp4';
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const inputFilename = `input.${extension}`;

        // Write input file
        const data = await fileToUint8Array(file);
        await ffmpeg.writeFile(inputFilename, data);

        // Get video duration using getMediaDuration if needed
        let videoDuration = 0;
        if (extract_time.includes('end')) {
            try {
                videoDuration = await getMediaDuration(file);
            } catch (error) {
                console.error('Failed to get video duration:', error);
                throw new Error('Failed to get video duration');
            }
        }

        const extractedFrames: File[] = [];

        // Extract each frame
        for (let i = 0; i < extract_time.length; i++) {
            const timePoint = extract_time[i];
            const outputFilename = `frame_${i}.png`;
            let timestamp: number;

            // Determine the actual timestamp
            if (timePoint === 'start') {
                timestamp = 0;
            } else if (timePoint === 'end') {
                timestamp = Math.max(0, videoDuration - 0.1); // Slightly before the end to ensure we get the last frame
            } else {
                timestamp = timePoint as number;
            }

            if (setMessage) {
                const timeDescription = timePoint === 'start' ? 'start' :
                    timePoint === 'end' ? 'end' :
                        `${timestamp} seconds`;
                setMessage(`Extracting frame at ${timeDescription}...`);
            }

            // Use FFmpeg to extract the frame
            await ffmpeg.exec([
                '-ss', timestamp.toString(),
                '-i', inputFilename,
                '-vframes', '1',
                '-q:v', '2',
                '-f', 'image2',
                outputFilename
            ]);

            // Read the extracted frame
            const frameData = await ffmpeg.readFile(outputFilename) as Uint8Array;
            const frameBlob = new Blob([frameData], { type: 'image/png' });

            // Create a File object for the frame with descriptive name
            const frameDescription = timePoint === 'start' ? 'start' :
                timePoint === 'end' ? 'end' :
                    `${timestamp.toFixed(2)}s`;
            const frameFile = new File(
                [frameBlob],
                `${baseName}_frame_${frameDescription}.png`,
                { type: 'image/png' }
            );

            extractedFrames.push(frameFile);
        }

        if (setMessage) {
            setMessage('Frame extraction completed');
        }

        return extractedFrames;
    } finally {
        ffmpeg.terminate();
    }
}


