'use client'
import React, { useEffect, useState } from 'react';

import { createGenerationStore, GenerationStatus } from '@/hooks/stores/user-generation';
import { Button } from "@/components/ui/shadcn-ui/button";
import { ImageGalleryWithBulkDownload } from '@/components/application/ImageGalleryWithBulkDownload';
import { VideoGalleryWithBulkDownload } from '@/components/application/VideoGalleryWithBulkDownload';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/shadcn-ui/tabs";
import { Badge } from "@/components/ui/shadcn-ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn-ui/card";
import { Loader2, Clock, Image, Video, LoaderCircle, ImageIcon } from "lucide-react";


interface Props {
    mode?: string;
    width?: string;
    height?: string;
    basis?: string;

}

const ITEMS_PER_PAGE = 18;
const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;




const ActiveTaskCard: React.FC<{ task: any }> = ({ task }) => {
    const getStatusIcon = (status: GenerationStatus) => {
        switch (status) {
            case GenerationStatus.PREPROCESSING:
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            case GenerationStatus.GENERATING:
                return <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
            default:
                return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusText = (status: GenerationStatus) => {
        switch (status) {
            case GenerationStatus.PREPROCESSING:
                return "Processing"
            case GenerationStatus.GENERATING:
                return "Generating"
            default:
                return "Processing"
        }
    }

    const getTypeIcon = (type: string) => {
        return type === "video" ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />
    }

    return (
        <Card className="w-full py-2">
            <CardContent className="px-2">
                {/* Header with type icon and status */}
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center">
                        {getTypeIcon(task.type)}
                        <span className="text-sm font-medium">{task.type === "video" ? "Video" : "Image"}</span>
                    </div>
                    <div className="flex items-center text-xs">
                        {/* <Badge className="text-sm"> */}
                            {getStatusIcon(task.status)} {getStatusText(task.status)}
                        {/* </Badge> */}
                    </div>
                </div>

                {/* Prompt text with proper wrapping */}
                <div className="w-full">
                    <p className="font-medium leading-relaxed break-words line-clamp-2">
                        {task?.prompt?.substring(0, 35) + (task?.prompt && task?.prompt.length > 35 ? "..." : "") ||
                            "Processing..."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

interface ActiveTaskInCanvasProps extends Props {
    className?: string;
}
export const ActiveTaskInCanvas: React.FC<ActiveTaskInCanvasProps> = ({ className }) => {
    const { recentGenerations, activeTasks, tmpRecentGenerations } = createGenerationStore();
    return (
        <div className={`${className} select-none mx-auto z-999`}>
            {activeTasks.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <p className="text-sm font-semibold">Active</p>
                        <Badge variant="outline">{activeTasks.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {activeTasks.map((task) => (
                            <ActiveTaskCard key={task.id} task={task} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
interface IngProps extends Props {
    imageGenerations?: any[];
    videoGenerations?: any[];
    tabGenerationType?: string;
    setTabGenerationType?: (type: string) => void;
    className?: string;
}
export const RecentGeneration_tmp: React.FC<IngProps> = ({
    basis = 'basis-1/3 md:basis-1/4 lg:basis-1/5',
    tabGenerationType,
    setTabGenerationType,
    className
}) => {
    const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
    // const [activeTab, setActiveTab] = useState('images');
    const { tmpRecentGenerations } = createGenerationStore();
    const [generationTypeTab, setGenerationTypeTab] = useState('images');
    
    // Determine controlled/uncontrolled tab state
    const isControlled =
        typeof tabGenerationType === 'string' && typeof setTabGenerationType === 'function';
    const currentTab = isControlled ? (tabGenerationType as string) : generationTypeTab;
    const onTabChange = isControlled ? (setTabGenerationType as (type: string) => void) : setGenerationTypeTab;
    const handleLoadMore = () => {
        setDisplayCount(prev => prev + ITEMS_PER_PAGE);
    };

    //  filter by type
    const imageGenerations = tmpRecentGenerations.filter(item => item.type === 'image');
    const videoGenerations = tmpRecentGenerations.filter(item => item.type === 'video');

    //  display by tab
    const displayedGenerations = currentTab === 'images'
        ? imageGenerations.slice(0, displayCount)
        : videoGenerations.slice(0, displayCount);

    //  has more
    const hasMore = currentTab === 'images'
        ? displayCount < imageGenerations.length
        : displayCount < videoGenerations.length;

    //  reset display count when switch tab
    useEffect(() => {
        setDisplayCount(ITEMS_PER_PAGE);
    }, [currentTab]);
    if (!tmpRecentGenerations || tmpRecentGenerations.length === 0) {
        return null;
    }
    return (
        <div className={`w-full max-w-[1220px] mx-auto p-4 flex flex-col gap-6 ${className}`}>
            {/* <div className='flex flex-col gap-2 items-center justify-center'>
                <pre>{JSON.stringify(activeTasks, null, 2)}</pre>
                <pre>{JSON.stringify(tmpRecentGenerations, null, 2)}</pre>
            </div> */}

            {/* 历史生成记录 */}
            {
                tmpRecentGenerations.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-semibold">Latest Generations</h2>

                        {imageGenerations.length > 0 || videoGenerations.length > 0 ? (
                            <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
                                <TabsList className="grid w-fit grid-cols-2">
                                    <TabsTrigger value="images" className="flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        Images ({imageGenerations.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="videos" className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        Videos ({videoGenerations.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="images" className="mt-4">
                                    {imageGenerations.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            <ImageGalleryWithBulkDownload
                                                generations={displayedGenerations}
                                                enableDownload={true}
                                                enableInfo={true}
                                                basis={`aspect-[1/1] ${basis}`}
                                                title=""
                                            />
                                            {hasMore && (
                                                <div className="flex justify-center mt-4">
                                                    <Button
                                                        onClick={handleLoadMore}
                                                        variant="default"
                                                    >
                                                        Load More
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className='text-center text-gray-500 py-8'>No image generations</p>
                                    )}
                                </TabsContent>

                                <TabsContent value="videos" className="mt-4">
                                    {videoGenerations.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            <VideoGalleryWithBulkDownload
                                                generations={displayedGenerations}
                                                enableDownload={true}
                                                enableInfo={true}
                                                basis='basis-1/3 md:basis-1/3 aspect-[1/1]'
                                                title=""
                                            />
                                            {hasMore && (
                                                <div className="flex justify-center mt-4">
                                                    <Button
                                                        onClick={handleLoadMore}
                                                        variant="default"
                                                    >
                                                        Load More
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className='text-center text-gray-500 py-8'>No video generations</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <p className='text-center text-gray-500 py-8'>No recent generations</p>
                        )}
                    </div>
                )
            }

        </div>
    );
};


