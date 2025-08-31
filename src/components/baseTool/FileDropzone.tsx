'use client'

import { Button } from "@/components/ui/shadcn-ui/button"
import { Upload, Video, Image as ImageIcon, File as FileIcon } from "lucide-react"
import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
    onFileSelect: (file: FileList) => void
    accept?: string
    variant: 'video' | 'image' | 'file'
    className?: string
    disabled?: boolean,
    componentDescription?: any
}

export function FileDropzone({
    onFileSelect,
    accept = 'any',
    variant,
    className,
    disabled = false,
    componentDescription={
        title: 'Upload your file',
        description: 'Drag and drop or click to select',
        buttonText: 'Select File'
    }
}: FileDropzoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files);
        let validFiles = files;
        if (variant === 'video') {
            validFiles = files.filter(file => file.type.startsWith('video/'));
        } else if (variant === 'image') {
            validFiles = files.filter(file => file.type.startsWith('image/'));
        }
        // For 'file' variant, all files are considered valid, so no filtering is needed.

        if (validFiles.length > 0) {
            onFileSelect(validFiles as unknown as FileList);
        }
    }

    const handleFileButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // const file = event.target.files?.[0]
        // console.debug('file: ', file)
        if (event.target.files) {
            onFileSelect(event.target.files)
        }
        event.target.value = ""; // Reset the input value
    }

    // const Icon = variant === 'video' ? Video : ImageIcon
    const Icon = FileIcon
    // const title = variant === 'video' ? 'Upload your video' : 'Upload your image'


    // const title = variant === 'file' ? 'Upload your file' : variant === 'video' ? 'Upload your video' : 'Upload your image'
    const title = componentDescription?.title || 'Upload your file'
    const description = componentDescription?.description || 'Drag and drop or click to select'
    const buttonText = componentDescription?.buttonText || 'Select File'
    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors",
                isDragging ? "border-primary" : "border-muted-foreground/25 hover:border-muted-foreground/50",
                className
            )}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={accept === 'any' ? "" : accept}
                onChange={handleFileChange}
                className="hidden"
            />
            <Icon className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-center space-y-2 mb-4">
                <p className="text-lg font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            <Button
                onClick={handleFileButtonClick}
                className="flex items-center gap-2"
                type="button"
                disabled={disabled}
            >
                <Upload className="w-4 h-4" />
                {buttonText}
            </Button>
        </div>
    )
}

export function VideoDropzone({
    accept = "video/*",
    ...props
}: Omit<FileDropzoneProps, 'variant' | 'accept'> & { accept?: string }) {
    return <FileDropzone {...props} variant="video" accept={accept} />
}

export function ImageDropzone({
    accept = "image/*",
    ...props
}: Omit<FileDropzoneProps, 'variant' | 'accept'> & { accept?: string }) {
    return <FileDropzone {...props} variant="image" accept={accept} />
}

export function AnyFileDropzone({
    accept = "any",
    ...props
}: Omit<FileDropzoneProps, 'variant' | 'accept'> & { accept?: string }) {
    return <FileDropzone {...props} variant="file" accept={accept} />
} 