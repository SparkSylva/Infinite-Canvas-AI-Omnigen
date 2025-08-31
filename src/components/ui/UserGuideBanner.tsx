"use client";

import React, { useState, useEffect } from 'react';
import { X, Settings, Sparkles, Key, Globe, Zap, ChevronUp, ChevronDown, Star } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/shadcn-ui/button';
import { Card, CardContent } from '@/components/ui/shadcn-ui/card';
import { Badge } from '@/components/ui/shadcn-ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/basicLayout/LanguageSelector';

interface UserGuideBannerProps {
    onClose?: () => void;
    className?: string;
}

export const UserGuideBanner: React.FC<UserGuideBannerProps> = ({
    onClose,
    className = ""
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    // i18n configuration with fallback to appLocale
    const { t } = useTranslation();
    const bannerContent = t('components:user-banner', { returnObjects: true }) as any || appLocale["user-banner"];

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('banner-collapsed');
        if (savedState === 'true') {
            setIsCollapsed(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        onClose?.();
    };

    const handleToggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('banner-collapsed', newState.toString());
    };

    if (!isVisible) return null;

    return (
        <Card className={`w-full border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
            <CardContent className="p-4 relative">
                {/* Control Buttons */}
                <div className="absolute top-2 right-2 flex gap-3 flex-col md:flex-row items-center justify-end">
                    <LanguageSelector />
                    <Button
                    
                        size="sm"
                        type='button'
                        onClick={handleToggleCollapse}
                        className="h-6 w-6"
                    >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                    {/* <Button
                        
                        size="sm"
                        type='button'
                        onClick={handleClose}
                        className="h-6 w-6"
                    >
                        <X className="h-4 w-4" />
                    </Button> */}
                </div>

                <div className="pr-16">
                    {/* Header - Always visible */}
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">
                            {bannerContent.title}
                        </h2>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            {bannerContent.freeBadge}
                        </Badge>
                    </div>

                    {/* Main Content - Collapsible */}
                    {!isCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Free Online Version - Recommended */}
                            <div className="md:col-span-2 bg-background/70 rounded-lg p-4 border border-primary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe className="h-5 w-5 " />
                                    <h3 className="font-semibold text-foreground">{bannerContent.onlineService.title}</h3>
                                    {/* <Badge className="bg-green-500 text-white">No API Key</Badge> */}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {bannerContent.onlineService.description}
                                </p>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <a
                                        href="https://aiomnigen.com/playground"
                                        target="_blank"
                                 
                                        className={cn(
                                            buttonVariants({
                                                size: "sm",
                                      
                                            })
                                        )}
                                        title="Try our free online AI canvas service"
                                    >
                                        <Zap className="h-4 w-4 mr-1" />
                                        {bannerContent.onlineService.tryOnlineButton}
                                    </a>
                                    <a
                                        href="https://github.com/SparkSylva/Infinite-Canvas-AI-Omnigen"
                                        target="_blank"
                                   
                                        className={cn(
                                            buttonVariants({
                                                variant: "outline",
                                                size: "sm",
                                                className: "gap-2",
                                            })
                                        )}
                                        title="Star our project on GitHub"
                                    >
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        {bannerContent.onlineService.starOnGithubButton}
                                        <svg className="h-4 w-4 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* API Setup Guide */}
                            <div className="bg-background/70 rounded-lg p-4 border border-secondary/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Settings className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-foreground">{bannerContent.localSetup.title}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {bannerContent.localSetup.description}
                                </p>
                                <div className="space-y-1  text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Key className="h-3 w-3" />
                                        <span>{bannerContent.localSetup.getApiKey}</span>
                                        <a
                                            href="https://fal.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline"
                                            title="Get your fal.ai API key"
                                        >
                                            fal.ai
                                        </a>
                                    </div>
                                    <div>{bannerContent.localSetup.clientSideNote}</div>
                                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                                        <div className="flex items-start gap-1">
                                            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                                            <span className="text-yellow-700 dark:text-yellow-300">{bannerContent.localSetup.securityWarning}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Links - Always visible */}
                    {!isCollapsed && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{bannerContent.features.multipleAi}</span>
                                <span>{bannerContent.features.imageVideo}</span>
                                <span>{bannerContent.features.infiniteCanvas}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default UserGuideBanner;


export const appLocale = {
    "user-banner": {
      "title": "🎨 Infinite Canvas AI OmniGen",
      "freeBadge": "Free to Use",
      "onlineService": {
        "title": "🚀 Recommended: Online Service",
        "description": "Access our online service with all AI features - no setup required!",
        "tryOnlineButton": "Try Online Service",
        "starOnGithubButton": "Star on GitHub"
      },
      "localSetup": {
        "title": "Local Setup",
        "description": "Click the ⚙️ icon to set up your API Key for fal.ai models",
        "getApiKey": "Get API Key:",
        "clientSideNote": "💡 Client-side only, ensure proper permissions",
        "securityWarning": "API keys are sent directly from your browser to AI providers. Please use in a secure browser environment and delete when not needed."
      },
      "features": {
        "multipleAi": "✨ Multiple AI Models",
        "imageVideo": "🎬 Image & Video Processing", 
        "infiniteCanvas": "🖼️ Infinite Canvas Creation"
      }
    }
  };