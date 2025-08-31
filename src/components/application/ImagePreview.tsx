import React from "react";
import { useWatch, type Control } from "react-hook-form";
import { Button } from "@/components/ui";
import { X } from "lucide-react";

/** 自定义 Hook：Blob -> objectURL；字符串直接用；空值返回 null */
function useObjectUrl(fileOrUrl: any) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 清空
    if (!fileOrUrl) {
      setUrl(null);
      return;
    }
    // 字符串：空串视为 null
    if (typeof fileOrUrl === "string") {
      const s = fileOrUrl.trim();
      setUrl(s.length ? s : null);
      return;
    }
    // Blob/File：创建 URL，卸载时回收
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

/** 单个图片条目，内部使用 Hook；避免在 .map 里直接调用 Hook */
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

      {/* 避免 src=""：没有 url 就不渲染 img */}
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

/** 预览列表组件：只订阅 name 字段；每项由 ImageItem 承载 Hook */
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
