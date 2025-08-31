'use client'
import { Info } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/shadcn-ui/tooltip"
import { Label } from "@/components/ui/shadcn-ui/label"

interface TooltipLabelProps {
    htmlFor?: string;
    className?: string;
    label: string;
    tooltipContent?: string;
}

export const TooltipLabel = ({
    htmlFor,
    className,
    label,
    tooltipContent = ''
}: TooltipLabelProps) => {
    return (
        <div className="flex items-center space-x-2">
            <TooltipProvider delayDuration={100}>
                <Tooltip >
                    <TooltipTrigger asChild>
                        {/* <Info className="h-5 w-5 text-red-300" /> */}
                        <Label htmlFor={htmlFor} className={className}>
                            {label}
                        </Label>
                    </TooltipTrigger>
                    {tooltipContent && (
                        <TooltipContent className="max-w-[280px] break-words ">
                            <p className="text-sm whitespace-normal">{tooltipContent}</p>
                        </TooltipContent>
                    )}

                </Tooltip>
            </TooltipProvider>
        </div>
    )
} 