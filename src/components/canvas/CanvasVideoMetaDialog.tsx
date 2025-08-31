"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/shadcn-ui/dialog";
import { Button, Badge } from "@/components/ui/";
import { Copy, CopyCheck } from "lucide-react";
import type { PlacedImage, PlacedVideo } from "@/types/canvas";
import { toKebabCase } from "@/utils/tools/stringGen";

interface CanvasImageMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video?: PlacedVideo | null;
  meta?: Record<string, unknown> | null;
}

export default function CanvasVideoMetaDialog({ open, onOpenChange, video, meta }: CanvasImageMetaDialogProps) {
  const [copied, setCopied] = useState(false);

  const prompt: string = useMemo(() => {
    if (!meta) return "";
    const anyMeta = meta as any;
    return anyMeta?.prompt || anyMeta?.prompt_process || "";
  }, [meta]);
  // console.log('video', video)
  const handleCopy = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 flex flex-col items-center justify-center rounded-none md:max-w-[70vh] md:max-h-[80vh] max-w-[80vw] max-h-[60vh]">
        <DialogTitle className="sr-only">Video Details</DialogTitle>

        {video?.src && (
          <div className="w-full md:w-auto md:max-h-[60vh] max-h-[30vh] overflow-auto">
            <video src={video.src} className="mt-2 w-auto max-h-[50vh] object-contain rounded-md"
              controls
              muted
              preload="metadata" />
          </div>
        )}

        {meta && (
          <div className="w-full mb-4 px-4 text-left md:text-left md:pl-6 flex-1 max-h-[20vh] overflow-auto">
            {prompt ? (
              <div>
                <div className="flex items-center mb-2">
                  <Button variant="ghost" size="icon" type="button" className="p-2" onClick={handleCopy}>
                    {copied ? <CopyCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
                <div className="bg-primary/10 p-4 rounded-md text-sm md:text-base">
                  <p className="whitespace-pre-wrap">{prompt}</p>
                </div>

                <div className="flex flex-wrap w-full gap-2 mt-4">
                  {Object.entries(meta)
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
            ) : (
              <>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


