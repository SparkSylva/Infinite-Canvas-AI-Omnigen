import React from "react";
import { useWatch, type Control } from "react-hook-form";
import { Button } from "@/components/ui";
import { X } from "lucide-react";

/** custom Hook: Blob -> objectURL; string directly use; null return null */
function useObjectUrl(fileOrUrl: any) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
   
    if (!fileOrUrl) {
      setUrl(null);
      return;
    }
    // string: empty string return null
    if (typeof fileOrUrl === "string") {
      const s = fileOrUrl.trim();
      setUrl(s.length ? s : null);
      return;
    }
    // Blob/File: create URL, recycle when unmount
    if (fileOrUrl instanceof Blob) {
      const u = URL.createObjectURL(fileOrUrl);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(null);
  }, [fileOrUrl]);

  return url;
}

type ImagesPreviewProps = {
  name: string;
  label?: string;
  limit: number;
  control: Control<any>;
  setValue: (name: string, value: any) => void;
};

/** single image item, internal use Hook; avoid calling Hook directly in .map */
const ImageItem = React.memo(function ImageItem({
  file,
  label,
  isIgnored,
  onRemove,
}: {
  file: any;
  label?: string;
  isIgnored: boolean;
  onRemove: () => void;
}) {
  const url = useObjectUrl(file);

  return (
    <div
      className={`relative w-full border rounded-md flex items-center justify-center ${
        isIgnored ? "opacity-50 grayscale" : ""
      }`}
    >
      <div className="absolute top-2 left-2 bg-black/65 text-white px-2 py-1 rounded-md text-xs">
        {label || "Image"}
      </div>


      {url ? (
        <img src={url} className="w-auto h-24 object-contain" />
      ) : null}

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

/** preview list component: only subscribe name field; each item by ImageItem carry Hook */
export const ImagesPreview = React.memo(function ImagesPreview({
  name,
  label,
  limit,
  control,
  setValue,
}: ImagesPreviewProps) {
  const files: any[] = useWatch({ control, name }) || [];
  const handleRemove = React.useCallback(
    (index: number) => {
      const next = files.slice();
      next.splice(index, 1);
      setValue(name as any, next);
    },
    [files, name, setValue]
  );

  if (!files.length) return null;

  return (
    <div className="mt-4 w-full flex flex-col gap-2">
      <div className="flex gap-2 w-full">
        {files.map((file, index) => (
          <ImageItem
            key={index}
            file={file}
            label={label}
            isIgnored={index >= limit}
            onRemove={() => handleRemove(index)}
          />
        ))}
      </div>
    </div>
  );
});
