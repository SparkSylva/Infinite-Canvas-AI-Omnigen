import React from "react";
import { useWatch, type Control } from "react-hook-form";
import { Button } from "@/components/ui";
import { X, Upload as UploadIcon } from "lucide-react";
import { common_model_serise_setting, ModelSeriesSetting, SupportFileSetting } from '@/lib/ai-model-setting/commonModel';

function useObjectUrl(fileOrUrl: any) {
    const [url, setUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
   
        if (!fileOrUrl) {
            setUrl(null);
            return;
        }

       
        if (typeof fileOrUrl === "string") {
            const str = fileOrUrl.trim();
            setUrl(str.length > 0 ? str : null);
            return;
        }

  
        if (fileOrUrl instanceof Blob) {
            const u = URL.createObjectURL(fileOrUrl);
            setUrl(u);
            return () => URL.revokeObjectURL(u);
        }

      
        setUrl(null);
    }, [fileOrUrl]);

    return url;
}


function getFileName(v: any) {
    if (typeof v === "string") {
        try {
            const u = new URL(v);
            const pathname = u.pathname.split("/").pop() || "file";
            return decodeURIComponent(pathname);
        } catch {
            return v.slice(0, 64) + (v.length > 64 ? "..." : "");
        }
    }
    return v?.name || "file";
}

type MediaItemProps = {
    file: any;
    label?: string;
    isIgnored: boolean;
    supportType: "audio" | "video" | string;
    ignoredText?: string;
    unsupportedText?: string; 
    onRemove: () => void;
};

const MediaItem = React.memo(function MediaItem({
    file,
    label,
    isIgnored,
    supportType,
    ignoredText = "Ignored",
    unsupportedText = "Unsupported",
    onRemove,
}: MediaItemProps) {
    const fileUrl = useObjectUrl(file);
    const fileName = React.useMemo(() => getFileName(file), [file]);

    return (
        <div
            className={[
                "relative w-full border rounded-md overflow-hidden group flex flex-col items-center justify-center",
                supportType === "video" ? "max-h-[150px]" : "",
                isIgnored ? "opacity-50 grayscale" : "",
            ].join(" ")}
        >
            <div className="absolute top-2 left-2 bg-black/65 text-white px-2 py-1 rounded-md text-xs">
                {label || (supportType === "audio" ? "Audio" : supportType === "video" ? "Video" : "Media")}
            </div>

            {isIgnored && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {ignoredText || unsupportedText}
                    </div>
                </div>
            )}

            {supportType === "audio" ? (
                <div className="w-full p-4 flex flex-col items-center gap-2">
                    <div className="w-16 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <UploadIcon className="h-6 w-6 text-primary" />
                    </div>
                    {fileUrl ? (
                        <audio controls className="w-full h-8" src={fileUrl}>
                            Your browser does not support the audio element.
                        </audio>
                    ) : (

                        <div className="text-xs text-muted-foreground">No audio preview</div>
                    )}

                    <span className="text-xs text-center text-muted-foreground truncate max-w-[160px]" title={fileName}>
                        {fileName}
                    </span>
                </div>
            ) : supportType === "video" ? (
                <div className="w-full p-2 flex flex-col items-center gap-2 max-h-[150px]">
                    {fileUrl ? (
                        <video className="w-auto h-full object-cover rounded" controls src={fileUrl ?? undefined}>
                            Your browser does not support the video element.
                        </video>
                    ) : (
                        <div className="text-xs text-muted-foreground">No video preview</div>
                    )}
                    <span className="text-xs text-center text-muted-foreground truncate max-w-[160px]" title={fileName}>
                        {fileName}
                    </span>
                </div>
            ) : (
                <div className="w-full p-4 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <UploadIcon className="h-8 w-8 text-gray-600" />
                    </div>
                    <span className="text-xs text-center text-muted-foreground truncate max-w-[160px]" title={fileName}>
                        {fileName}
                    </span>
                </div>
            )}

            <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={onRemove}
                className="opacity-75 absolute top-2 right-2"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
});

type MediaPreviewProps = {
    support: SupportFileSetting;
    control: Control<any>;
    setValue: (name: string, value: any) => void;
    ignoredText?: string;
    unsupportedText?: string;
};


export const MediaPreview = React.memo(function MediaPreview({
    support,
    control,
    setValue,
    ignoredText,
    unsupportedText,
}: MediaPreviewProps) {
    const name = support.name;
    const limit = Math.max(0, support.isSupport || 0);
    const files: any[] = useWatch({ control, name }) || [];

    const onRemove = React.useCallback(
        (idx: number) => {
            const next = files.slice();
            next.splice(idx, 1);
            setValue(name as any, next);
        },
        [files, name, setValue]
    );

    if (!files.length) return null;

    const isSupported = limit > 0;

    return (
        <div key={`preview-${name}`} className="mt-4 w-full flex flex-col gap-2">
            <div className="flex w-full flex-wrap gap-2">
                {files.map((file, idx) => (
                    <MediaItem
                        key={idx}
                        file={file}
                        label={support.label}
                        isIgnored={!isSupported || idx >= limit}
                        supportType={support.type}
                        ignoredText={isSupported ? ignoredText : unsupportedText}
                        unsupportedText={unsupportedText}
                        onRemove={() => onRemove(idx)}
                    />
                ))}
            </div>
        </div>
    );
});