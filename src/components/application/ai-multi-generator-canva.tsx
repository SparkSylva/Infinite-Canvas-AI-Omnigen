'use client'

import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/shadcn-ui/accordion"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/shadcn-ui/form"

import { cn } from "@/lib/utils"
import {
    UploadIcon, X, CheckIcon,
    ChevronsUpDown, WandSparkles,
    Crown, Loader, ArrowDownToLine, Zap, SquareArrowOutUpRight, Info, CircleHelp, DollarSign,
    ImagePlus,
    Languages,
    Loader2,
} from "lucide-react"

import { Button, Textarea, Checkbox, Input, Label, Slider, Switch } from '@/components/ui';
import { Badge } from "@/components/ui/shadcn-ui/badge"
import { toast } from 'sonner';

import { AspectRatioSelectorPop } from '@/components/application/AspectRatioSelector';
import { aspectRatioDimensions_1280 } from '@/lib/ai-model-setting/aspectRatio';
import { ModelSettingsDialog, AdapterModelSettingsDialog, PromptSettingsDialog } from '@/components/application/setting-dialog';
import { AdvancedSettingsDialog } from '@/components/application/AdvancedSettingsDialog';
;
import { createGenerationStore } from '@/hooks/stores/user-generation';
import {
    handleGenerationStart,
    handleGenerationUpdate,
    handleGenerationComplete,
    canStartGeneration,
    getActiveGenerationsCount,
    getMaxConcurrentGenerations
} from '@/utils/handleGeneration/imageQueuePersist'


import { useTranslation } from 'react-i18next';

import { useUserSettingStore, useSettingValue } from '@/hooks/stores/user-setting';

import { handleGeneration_switch } from '@/utils/handleGeneration/handleSwitch';
import imageCompression from 'browser-image-compression';
import { extractAudioFromVideo, convertAudioToMp3, getMediaDuration } from '@/utils/tools/MediaProcess';

import { SettingDialog } from "@/components/canvas/SettingDialog";
import { TooltipLabel } from "@/components/ui/tooltip-label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/shadcn-ui/tooltip"



import { DynamicCommonSchema } from '@/server-action/ai-generation/schema/commonSchema';

import { findClosestAspectRatio, normalizeToFiles } from '@/utils/tools/ImagePreProcess';
import {
    func_model_serise_setting,
    type ModelSeriesSetting, type SupportFileSetting
} from '@/lib/ai-model-setting/commonModel';

import { StylePreset, promptLibrarySettings } from '@/lib/ai-model-setting/commonPrompt';


import { processFileUrlToApiInput } from '@/utils/tools/ImagePreProcess';
import { AdapterModelSeriesSetting } from '@/lib/ai-model-setting/apaterModel/styleModel';
import { MediaPreview } from '@/components/application/MediaPreview';
import { ImagesPreview } from '@/components/application/ImagePreview';

// imageCheckCache
const imageCheckCache = new Map<string, string>();

export interface AiAppRef {
    form: any; // 
    setValue: (name: string, value: any) => void;
    getValues: (name?: string) => any;
    handleSubmit: (callback?: (data: any) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    getSelectedModelConfig: () => ModelSeriesSetting | undefined;
}

interface AppProps {
    defaultSchemaSetting?: any;
    modelSeriesSetting?: Record<string, ModelSeriesSetting[]>;
    initialFormValues?: {
        model_id?: string;
        prompt?: string;
        [key: string]: any; // Allow other form fields to be passed as well
    };
    hideFormFields?: {
        [key: string]: boolean;
    };
    // External generation handler: if provided, will be called after validations in handleUserGenerationReady
    onGenerate?: (handleInput: any) => Promise<void> | void;
}
// const modelSeriesSetting = common_model_serise_setting


const AiMultiGeneratorApp = forwardRef<AiAppRef, AppProps>(({
    defaultSchemaSetting = DynamicCommonSchema,
    modelSeriesSetting = func_model_serise_setting,// common_model_serise_setting,
    initialFormValues,
    hideFormFields,
    onGenerate
}, ref) => {

    const prevModelIdRef = useRef<string | undefined>(undefined);
    const isSubmittingRef = useRef(false);
    /* ----------------------- USER SETTING ----------------------- */

    const [isUseClientApi, setIsUseClientApi] = useState(false);
    const tempFalApiKey = useSettingValue<string>("falApiKey");


    /* ----------------------- generation tasks ----------------------- */
    // track multiple ongoing generation tasks
    const [ongoingGenerations, setOngoingGenerations] = useState<string[]>([]);
    // add a state to track the details of each generation task
    const [generationDetails, setGenerationDetails] = useState<{ [key: string]: any }>({});

    const [generationStatus, setGenerationStatus] = useState('');
    const [generateButtonDisabled, setGenerateButtonDisabled] = useState<boolean>(false);


    const { activeTasks, recentGenerations, addToTmpRecentGenerations, setRecentGenerations } = createGenerationStore();

    /* ----------------------- user data ralated ----------------------- */

    /* ----------------------- i18n ----------------------- */
    const { t } = useTranslation();
    const tabLocaleObject = t('app/generator:ai-generator-app', { returnObjects: true }) as any || appLocale
    /* ----------------------- dialog  ----------------------- */
    const [showModelSettingsDialog, setShowModelSettingsDialog] = useState(false);
    const [showAdvancedSettingsDialog, setShowAdvancedSettingsDialog] = useState(false);
    const [showStylePresetDialog, setShowStylePresetDialog] = useState(false);
    const [showAdapterModelSettingsDialog, setShowAdapterModelSettingsDialog] = useState(false);
    const [showSettingDialog, setShowSettingDialog] = useState(false);

    /* ----------------------- prompt related  ----------------------- */

    const [showPromptSettingsDialog, setShowPromptSettingsDialog] = useState(false);


    /* ----------------------- adapter model related  ----------------------- */
    const [selectedAdapterModel, setSelectedAdapterModel] = useState<any | null>(null);

    const [promptProcessMode, setPromptProcessMode] = useState<string>('none'); // 'none', 'translate', 'enhance'
    const [generationSrc, setGenerationSrc] = useState<any[]>([
   

    ]);
    const [tabGenerationType, setTabGenerationType] = useState<string>('images');

    const defaultFormValues = {
        model_id: Object.values(modelSeriesSetting).flat()[0]?.id || "",  //"wan2-2-turbo-image2video"
        duration: "5",
        aspect_ratio: '1:1',
        width: 1024,
        height: 1024,
        prompt: "",
        prompt_process: "",
        num_outputs: 1,
        output_format: "png",
        control_images: [],
        control_images_2: [],
        control_files: [],
        control_files_2: [],
        seed: 0,
        randomize_seed: true,
        // disable_safety_checker: true,
        enable_safety_checker: false,
        meta_data: {},
        resolution: '480p',
        generation_type: "image",

        ...initialFormValues, // Override with any provided initial values
    }

    const form = useForm({
        resolver: zodResolver(defaultSchemaSetting),
        defaultValues: defaultFormValues,
    });

    const { formState: { errors }, watch } = form;
    const errorMessages = Object.values(errors).filter(error => error?.message).map(error => error?.message); //["test error 1 ","test error 2"]//

    const { control } = form;

    const model_id = useWatch({ control, name: "model_id" });
    const resolution = useWatch({ control, name: "resolution" });
    const duration = useWatch({ control, name: "duration" });
    const num_outputs = useWatch({ control, name: "num_outputs" }) || 1;
    const aspect_ratio = useWatch({ control, name: "aspect_ratio" });
    const meta_data = useWatch({ control, name: "meta_data" });
    const control_images = useWatch({ control, name: "control_images" });
    const control_files = useWatch({ control, name: "control_files" });
    const control_files_2 = useWatch({ control, name: "control_files_2" });
    const mediaMaxDuration = useWatch({ control, name: 'meta_data.maxDuration' }); // Only get this from the top level


    const selectedModelConfig = useMemo(() => {
        return Object.values(modelSeriesSetting).flat().find(m => m.id === model_id);
    }, [model_id]);

    // Build generic image support config (prefer new config, fallback to legacy fields)
    const supportImagesConfig: SupportFileSetting[] = useMemo(() => {
        if (selectedModelConfig?.supportAddFiles && selectedModelConfig.supportAddFiles.length > 0) {
            return selectedModelConfig.supportAddFiles.filter(s => s.type === 'image');
        }
        const legacy: SupportFileSetting[] = [];
        if (typeof selectedModelConfig?.isSupportImageRef === 'number') {
            legacy.push({
                name: 'control_images',
                label: 'Control Images',
                type: 'image',
                isRequired: selectedModelConfig?.isRequiredImageRef || false,
                isSupport: selectedModelConfig?.isSupportImageRef || 0,
            });
        }
        if (typeof selectedModelConfig?.isSupportEndImageRef === 'number') {
            legacy.push({
                name: 'end_control_images',
                label: 'End Control Images',
                type: 'image',
                isRequired: false,
                isSupport: selectedModelConfig?.isSupportEndImageRef || 0,
            });
        }
        return legacy;
    }, [selectedModelConfig]);
    const supportAddFilesConfig: SupportFileSetting[] = useMemo(() => {
        if (selectedModelConfig?.supportAddFiles && selectedModelConfig.supportAddFiles.length > 0) {
            return selectedModelConfig.supportAddFiles.filter(s => s.type === 'audio' || s.type === 'video');
        }
        return [];
    }, [selectedModelConfig]);

    const supportAdapterModelConfig: Record<string, AdapterModelSeriesSetting[]> | null = useMemo(() => {
        if (selectedModelConfig?.supportAdapterModel && Object.keys(selectedModelConfig.supportAdapterModel).length > 0) {
            return selectedModelConfig.supportAdapterModel;
        }
        return null;
    }, [selectedModelConfig]);

    const selectedAdapter = React.useMemo(() => {
        if (!supportAdapterModelConfig || !selectedAdapterModel) return null
        // supportAdapterModelConfig: Record<string, AdapterModelSeriesSetting[]>
        // selectedAdapterModel: string (id)
        for (const list of Object.values(supportAdapterModelConfig)) {
            const found = list.find(m => m.id === selectedAdapterModel)
            if (found) return found
        }
        return null
    }, [supportAdapterModelConfig, selectedAdapterModel])


    // refs for each dynamic image input
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    // refs for dynamic media (audio/video) inputs
    const mediaInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        const cur = selectedModelConfig?.id;
        if (!cur || prevModelIdRef.current === cur) return;
        prevModelIdRef.current = cur;

        // ---------- Utility Functions ----------
        type Option = { value: any; label?: string };
        type Param = { name: string; defaultValue: any; options?: Option[] };
        const toMap = (arr?: Param[]) => new Map((arr ?? []).map(p => [p.name, p as Param]));
        const params = toMap(selectedModelConfig?.customParameters);

        const castToSampleType = (value: any, sample: any) => {
            if (sample === undefined || sample === null) return value;
            if (typeof sample === 'number') return Number(value);
            if (typeof sample === 'string') return String(value);
            return value;
        };

        const ensureByParamOrFallback = <T,>(
            currentValue: any,
            paramName: string,
            fallback?: T
        ) => {
            const param = params.get(paramName);
            if (param) {
                // Parameter is defined
                if (param.options?.length) {
                    const ok = param.options.some(o => o.value === currentValue);
                    return ok ? currentValue : castToSampleType(param.defaultValue, currentValue);
                }
                // No options, use default directly
                return castToSampleType(param.defaultValue, currentValue);
            }
            // This parameter is not defined, use fallback (optional)
            return fallback !== undefined ? castToSampleType(fallback, currentValue) : currentValue;
        };

        // ---------- Assemble data for reset ----------
        const currentAll = form.getValues(); // Current entire form
        const currentMeta = currentAll?.meta_data ?? {};

        // 1) generation_type: Prioritize model type, fallback to 'image'
        const next_generation_type = selectedModelConfig?.type ?? 'image';

        // 2) duration / resolution / num_outputs: Add back fallback rule from ensureParam
        const next_duration = ensureByParamOrFallback(
            currentAll?.duration,
            'duration',
            selectedModelConfig?.options?.creditBySecond ? undefined : '5' // Fallback to '5' only when not charging by second
        );
        const next_resolution = ensureByParamOrFallback(currentAll?.resolution, 'resolution', '480p');
        const next_num_outputs = ensureByParamOrFallback(currentAll?.num_outputs, 'num_outputs', 1);

        // 3) Other customParameters: Write to meta_data default value + (optional) sync to top-level fields with the same name
        const EXCLUDE = new Set(['duration', 'resolution', 'num_outputs']);
        const restParamDefaults: Record<string, any> = {};
        const topLevelParamDefaults: Record<string, any> = {};
        params.forEach((param, name) => {
            if (EXCLUDE.has(name)) return;
            restParamDefaults[name] = param.defaultValue;

            // -- If you want to sync defaults to top-level fields with the same name like in the old version (keep if needed, otherwise delete this line) --
            const currentTop = currentAll?.[name];
            topLevelParamDefaults[name] = castToSampleType(param.defaultValue, currentTop);
        });

        // 4) Summarize meta_data: Based on current values, overwrite with parameter defaults (consistent with old version: direct overwrite)
        const next_meta_data = {
            ...currentMeta,
            ...restParamDefaults,
        };

        // 5) Final reset (write once to reduce subscription rendering)
        form.reset(
            {
                ...currentAll,
                generation_type: next_generation_type,
                duration: next_duration,
                resolution: next_resolution,
                num_outputs: next_num_outputs,
                // Sync other custom parameters to top-level fields with the same name (if top-level sync is not needed, you can remove the topLevelParamDefaults spread)
                ...topLevelParamDefaults,
                meta_data: next_meta_data,
            },
            { keepDirty: false, keepTouched: true }
        );
        // params.forEach((param, name) => {
        //     // If your control is bound to meta_data
        //     form.resetField(`meta_data.${name}`, { defaultValue: param.defaultValue });
        //     // If your control is bound to a top-level field with the same name (optional)
        //     form.resetField(name as any, { defaultValue: castToSampleType(param.defaultValue, currentAll?.[name]) });
        // });
    }, [selectedModelConfig?.id, form]);
    // B. Link width and height only when aspect ratio changes
    useEffect(() => {
        const supported = selectedModelConfig?.supportedAspectRatios ?? [];
        if (!supported.length) return;
        if (!supported.includes(aspect_ratio)) {
            handleAspectRatioChange(supported[0]);
            return;
        }
        if (aspect_ratio in aspectRatioDimensions_1280) {
            const { width, height } = aspectRatioDimensions_1280[aspect_ratio as keyof typeof aspectRatioDimensions_1280];
            // Set value only when it's actually different to avoid meaningless setValue
            const curW = form.getValues('width');
            const curH = form.getValues('height');
            if (curW !== width) form.setValue('width', width);
            if (curH !== height) form.setValue('height', height);
        }
    }, [aspect_ratio, selectedModelConfig?.supportedAspectRatios, form]);




    const creditUsed = useMemo(() => {
        const baseCredit = Number(selectedModelConfig?.useCredits ?? 5);

        const round2 = (n: number) =>
            Math.round((n + Number.EPSILON) * 100) / 100;

        const params = new Map(
            (selectedModelConfig?.customParameters ?? []).map(p => [p.name, p])
        );

        const optionIndex = (name: string, value: any) => {
            const p = params.get(name);
            if (!p?.options?.length) return -1;
            return p.options.findIndex(o => o.value === value);
        };

        const creditBySecond = Boolean(selectedModelConfig?.options?.creditBySecond);

        // -- Video: charge by second --
        if (creditBySecond) {
            const dur = Number(duration ?? 0);
            const total = baseCredit * (Number.isFinite(dur) ? dur : 0);
            return round2(total);
        }

        // -- Image/Not by second: by resolution/duration tier multiplier --
        const resIdx = optionIndex('resolution', resolution);
        const resolutionMultiplier = resIdx >= 0 ? resIdx + 1 : 1;

        const durIdx = optionIndex('duration', duration);
        const durationMultiplier = durIdx >= 0 ? durIdx + 1 : 1;

        const hasNumOutputs = params.has('num_outputs');
        const outputs = hasNumOutputs ? Number(num_outputs ?? 1) : 1;

        const total = baseCredit * resolutionMultiplier * durationMultiplier * (Number.isFinite(outputs) ? outputs : 1);

        return round2(total/10);
    }, [selectedModelConfig, resolution, duration, num_outputs]);



    const maxGenQueen = useMemo(() => {
        return getMaxConcurrentGenerations('default');
    }, []);


    useEffect(() => {
        if (control_images?.length > 0 && selectedModelConfig?.supportedAspectRatios) {
            // console.log('control_images', {control_images})
            // console.log('selectedModelConfig?.supportedAspectRatios', selectedModelConfig?.supportedAspectRatios)

            findClosestAspectRatio(control_images[0], selectedModelConfig?.supportedAspectRatios).then(ratio => {
                // console.log('ratio', ratio)
                handleAspectRatioChange(ratio)
            })
        }
    }, [control_images?.[0], selectedModelConfig?.supportedAspectRatios]);

    // 监听 control_files / control_files_2 的变化，必要时修正 duration
    useEffect(() => {

        const creditsByControl = selectedModelConfig?.options?.creditsByControl;
        if (!creditsByControl) return;
        console.log('control_files ', control_files)
        // Define a function to handle matching logic
        const handleControlField = (fieldName: 'control_files' | 'control_files_2', value: any) => {
            if (creditsByControl === fieldName && (!value || value.length === 0)) {
                // This field matches and has been cleared, correct duration
                form.setValue('duration', '5');
                form.setValue('meta_data.duration', '5');
            }
        };
        handleControlField('control_files', control_files);
        handleControlField('control_files_2', control_files_2);
    }, [
        control_files,
        control_files_2,
        selectedModelConfig?.options?.creditsByControl,
        selectedModelConfig?.options?.creditBySecond,
        selectedModelConfig?.customParameters
    ]);





    useEffect(() => {
        // show error info to user
        if (!generationStatus) return;

        try {
            //  only string type
            if (typeof generationStatus === 'string') {
                const status = generationStatus.toLowerCase();
                if (status !== 'succeeded' && status !== 'ok') {
                    toast(generationStatus, { duration: 3500 })
                }
            }
        } catch (error) {
            // silent error, not affect UI
        }
    }, [generationStatus])


    const setRecentGenerationsCallback = useCallback((
        { data, isTmp = true, type = 'images' }:
            { data: any[], isTmp?: boolean, type?: string }) => {
        addToTmpRecentGenerations?.(data, isTmp);
        setTabGenerationType(type.includes('video') ? 'videos' : 'images');
    }, [addToTmpRecentGenerations]);



    const handleAspectRatioChange = useCallback((ratio: string) => {
        form.setValue('aspect_ratio', ratio);
        if (ratio in aspectRatioDimensions_1280) {
            const { width, height } = aspectRatioDimensions_1280[ratio as keyof typeof aspectRatioDimensions_1280];
            form.setValue('width', width);
            form.setValue('height', height);
        }
    }, [form]);

    const handleModelSettings = (modelSetting: any) => {
        // console.log('handleModelSettings', modelSetting)
        form.setValue('model_id', modelSetting.id);
        form.clearErrors();
    }
    const handleAdapterModelSettings = (adapterModelSetting: any) => {
        // console.log('adapterModelSetting', adapterModelSetting)
        setSelectedAdapterModel(adapterModelSetting?.id)

        form.setValue('meta_data.adapter_model', adapterModelSetting?.model || []);
        if (adapterModelSetting?.prompt) {
            form.setValue('prompt', adapterModelSetting?.prompt);
        }
        form.clearErrors();
    }


    const handleImageUpload = useCallback((e: any, formKey: string = 'control_images') => {
        const file = e.target.files?.[0];
        if (!file) return;
        form.setValue(formKey as any, [...(form.getValues(formKey as any) || []), file]);
        form.trigger(formKey as any);
        e.target.value = '';
    }, [form]);

    // Handle audio and video file uploads

    const handleMediaFileUpload = useCallback(async (event: any, support: SupportFileSetting) => {
        const fileSizeUnit = 1024 * 1024;
        const maxFileSize = (support?.options?.maxFileSize || 15) * fileSizeUnit; // 15 Mb

        const maxDuration = mediaMaxDuration || support?.options?.maxDuration || 15; // Default 15 seconds
        // console.log('maxDuration ', maxDuration)
        // console.log('support?.options?.maxDuration ', support?.options?.maxDuration)

        const file = event.target.files?.[0];
        if (!file) return;

        const ext = file.name.toLowerCase();

        try {
            // Validate file type and handle audio extraction
            let finalFile = file;
            let isVideoToAudio = false;
            let isAudioToMp3 = false;


            if (support.type === 'audio') {
                // audio type: allow audio file and video file (convert video to audio)
                if (ext.endsWith('.mp3')) {
                    // directly support mp3 audio file
                    finalFile = file;
                } else if (ext.endsWith('.wav') || ext.endsWith('.m4a') || ext.endsWith('.aac') || ext.endsWith('.ogg') || ext.endsWith('.webm')) {
                    //non mp3 audio file, need to convert to mp3
                    isAudioToMp3 = true;
                    // toast.info('Converting audio to MP3 format...');
                } else if (ext.endsWith('.mp4') || ext.endsWith('.mov') || ext.endsWith('.avi')) {
                    // support video file, need to convert to audio
                    isVideoToAudio = true;
                    toast.info('Converting video to audio...');
                } else {
                    throw new Error('Only mp3, wav, m4a, aac, or mp4, mov, avi video files are allowed for audio input');
                }
            } else if (support.type === 'video') {
                //  video type: only allow video files
                if (!(ext.endsWith('.mp4') || ext.endsWith('.mov') || ext.endsWith('.avi'))) {
                    throw new Error('Only mp4, mov, avi video files are allowed');
                }
                finalFile = file;
            }

            // Check file count limit
            const currentFiles: any[] = form.getValues(support.name) || [];
            if ((support.isSupport || 0) > 0 && currentFiles.length >= (support.isSupport || 0)) {
                throw new Error('Reached maximum number of files');
            }

            // Check media duration

            console.log('getMediaDuration finalFile', finalFile)
            const duration = await getMediaDuration(finalFile);
            console.log('duration', duration)
            if (duration > maxDuration) {
                throw new Error(`File duration (${duration.toFixed(1)}s) exceeds maximum allowed duration (${maxDuration}s)`);
            }


            // Process audio to mp3 if needed
            if (isAudioToMp3) {
                try {
                    toast.info('Converting audio to MP3...');
                    finalFile = await convertAudioToMp3({
                        file: file,
                        audioSetter: undefined, // No need to set audio URL
                        setMessage: (message) => toast.info(message)
                    });
                    toast.success('Audio converted to MP3 successfully');
                } catch (error) {
                    throw new Error('Failed to convert audio to MP3');
                }
            }

            // Process video to audio if needed
            if (isVideoToAudio) {
                try {
                    toast.info('Extracting audio from video...');
                    finalFile = await extractAudioFromVideo({
                        file: file,
                        audioSetter: undefined, // No need to set audio URL
                        setMessage: (message) => toast.info(message)
                    });
                    toast.success('Audio extracted successfully');
                } catch (error) {
                    throw new Error('Failed to extract audio from video, Please ensure your video has audio track');
                }
            }

            if (finalFile.size > maxFileSize) {
                throw new Error(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit, try another file`);
            }

            // Add file to form
            form.setValue(support.name as any, [...currentFiles, finalFile]);
            form.trigger(support.name as any);
            event.target.value = '';

            // check duration

            if (selectedModelConfig?.options?.creditsByControl === support.name) {

                form.setValue('duration', duration);
                form.setValue('meta_data.duration', duration);
            }

        } catch (error: any) {
            console.error('Error processing media file:', error);
            toast.error(error?.message || 'Failed to process media file');
        } finally {
            event.target.value = '';
        }
    }, [form, mediaMaxDuration, selectedModelConfig]);




    const filterUserInputForFileUpload = async (userInputData: any) => {
        const file_keys = ['control_images', 'control_images_2', 'control_files', 'control_files_2'];
        const image_keys = ['control_images', 'control_images_2'];
        // Shallow clone to avoid mutating original reference
        const filtered: any = { ...userInputData };

        // Find model config by current model_id
        const modelConfig = Object.values(modelSeriesSetting)
            .flat()
            .find((m) => m.id === filtered.model_id);

        // Determine allowed counts for each file key
        const allowedCounts: Record<string, number> = {};
        if (modelConfig?.supportAddFiles && modelConfig.supportAddFiles.length > 0) {
            for (const support of modelConfig.supportAddFiles) {
                allowedCounts[support.name] = Math.max(0, support.isSupport || 0);
            }
        } else {
            // Legacy fallback
            if (typeof modelConfig?.isSupportImageRef === 'number') {
                allowedCounts['control_images'] = Math.max(0, modelConfig.isSupportImageRef || 0);
            }
            if (typeof modelConfig?.isSupportEndImageRef === 'number') {
                allowedCounts['control_images_2'] = Math.max(0, modelConfig.isSupportEndImageRef || 0);
            }
            // Default to not allowing media files when not explicitly supported
            allowedCounts['control_files'] = 0;
            allowedCounts['control_files_2'] = 0;
        }

        // Apply filtering and truncation based on allowed counts
        for (const key of file_keys) {
            const allowed = Object.prototype.hasOwnProperty.call(allowedCounts, key)
                ? allowedCounts[key]
                : 0;
            const value = filtered[key];
            if (!Array.isArray(value)) {
                filtered[key] = [];
                continue;
            }
            if (allowed <= 0) {
                filtered[key] = [];
            } else if (value.length > allowed) {
                filtered[key] = value.slice(0, allowed);
            }
        }

        for (const key of image_keys) {
            const value = filtered[key];
            if (Array.isArray(value) && value.length > 0) {
                // base64 / blob: URL / File => Blob|File
                const normalized = await normalizeToFiles(value);

                const compressedFiles: Array<Blob | File | any> = [];
                for (const item of normalized) {
                    if (item instanceof Blob && item.type?.startsWith('image/')) {
                        try {
                            const options = {
                                maxSizeMB: 2,
                                maxWidthOrHeight: 1024,
                                useWebWorker: true,
                                fileType: 'image/jpeg',
                            };
                            const compressed = await imageCompression(item, options);
                            compressedFiles.push(compressed);
                        } catch (error) {
                            console.error('Image compression failed:', error);
                            //  compress failed, use original item
                            compressedFiles.push(item);
                        }
                    } else {
                        // not image or not Blob/File: keep original
                        compressedFiles.push(item);
                    }
                }
                filtered[key] = compressedFiles;
            }
        }

        console.log('filtered', filtered)
        const apiInputData = await processFileUrlToApiInput({
            inputData: filtered,
            need_to_upload_image_url: [],
            customApiKey: tempFalApiKey,
        })



        return apiInputData;
    }
    const userInputDataProcess = async (userInputData: any) => {
        // add other process here
        // console.log('before userInputData', userInputData)
        return userInputData;
    }

    const handleUserGenerationReady = async (userInputData: any, onGenerate?: (handleInput: any) => Promise<void> | void) => {
        // toast('begin generate')
        if (!tempFalApiKey) {
            toast('Please set your custom API key in the settings', { duration: 3500, icon: '😅' });
            setShowSettingDialog(true);
            return;
        }
        setGenerationStatus('')

        let generationId = crypto.randomUUID();
        // console.log('generationId ready', generationId)
        try {
            generationId = handleGenerationStart(userInputData) as string;

            if (!generationId) {
                toast('You have reached the maximum number of concurrent generations', { duration: 3500, icon: '😅' });
                return;
            }

            // filter file upload and process user input data for api input
            userInputData = await filterUserInputForFileUpload(userInputData);
            console.log('filteredUserInputData', userInputData)
            // Process user input data with translation if needed
            userInputData = await userInputDataProcess(userInputData);
            // return

            // Build handle_input for external or internal generation
            const handle_input = {
                userInputData,

                setIsGenerating: (value: any, meta?: any) => {
                    if (value === false) {
                        console.log('handle_input setIsGenerating false')
                        handleGenerationComplete(
                            generationId,
                            null,
                            null
                        );
                    }
                    if (value === 'update') {
                        const predictionId = meta?.predictionId || crypto.randomUUID();
                        handleGenerationUpdate(generationId, predictionId)
                    }
                },
                setGenerationStatus,
                setRecentGenerations: null,
                setGenerationSrc: setRecentGenerationsCallback,


                options: {
                    isClient: true,
                    customApiKey: tempFalApiKey,

                },
            };

            // If external callback provided, delegate generation; otherwise use internal flow
            if (typeof onGenerate === 'function') {
                console.log('handle_input is provided, use external flow')
                await onGenerate(handle_input);
            } else {
                console.log('handle_input is not provided, use internal flow')
                await handleGeneration_switch(handle_input);
            }
        } finally {
            // handleGenerationComplete(generationId, null, null);
        }




    }

    const submitWithValidation = form.handleSubmit(async (data) => {
        if (isSubmittingRef.current) {
            return;
        }
        isSubmittingRef.current = true;
        setTimeout(() => {
            isSubmittingRef.current = false;
            setGenerateButtonDisabled(false)
        }, 2000);

        setGenerateButtonDisabled(true)
        try {
            await handleUserGenerationReady(data, onGenerate)
            setGenerateButtonDisabled(false)
        } catch (error) {
            console.error(error)
            setGenerateButtonDisabled(false)
        }
    });
    useImperativeHandle(ref, () => ({
        form,
        setValue: (name: string, value: any) => form.setValue(name as any, value),
        getValues: (name?: string) => form.getValues(name as any),
        handleSubmit: (callback?: (data: any) => void) => {
            // If a callback is provided, use the custom callback; otherwise, use the default submission logic
            if (callback) {
                console.log('callback')
                return form.handleSubmit(callback);
            }
            console.log('submitWithValidation')
            return submitWithValidation;
        },
        getSelectedModelConfig: () => selectedModelConfig,
    }), [form, selectedModelConfig])
    // if (!userData || userData?.email != "lcorinst@gmail.com") {
    //     return <div>
    //         <h1>Please login first</h1>
    //     </div>
    // }
    return (

        <div className="w-full max-w-2xl mx-auto flex flex-col bg-card/50 rounded-lg relative p-2 gap-2 select-none">

            <Form {...form} >
                <form className="flex flex-col gap-2" onSubmit={submitWithValidation}>
                    <p className='text-sm text-muted-foreground'>
                        {tabLocaleObject?.apiSettings?.useCustomApiKey || appLocale.apiSettings.useCustomApiKey} {tempFalApiKey ? `****${tempFalApiKey.slice(-5)}` : (tabLocaleObject?.apiSettings?.none || appLocale.apiSettings.none)}
                    </p>
                    <div className='flex flex-wrap justify-between gap-2'>
                        {!hideFormFields?.model_id && (
                            <FormField
                                control={form.control}
                                name="model_id"
                                render={({ field }) => (
                                    <FormItem className='flex flex-row gap-2'>
                                        {/* <FormLabel className='capitalize'>{tabLocaleObject?.modelLable}</FormLabel> */}
                                        <FormControl>
                                            <ModelSettingsDialog
                                                modelSeries={modelSeriesSetting}
                                                onModelSelect={handleModelSettings}
                                                currentModel={field.value}
                                                open={showModelSettingsDialog}
                                                onOpenChange={setShowModelSettingsDialog}
                                                triggerText={tabLocaleObject?.buttons?.model || "Model"}
                                            />
                                        </FormControl>
                                        <FormMessage />

                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Advanced Settings Button - Top Right */}
                        {(
                            <div className="z-10 flex flex-wrap gap-2 items-center justify-end">
                                <SettingDialog isOpen={showSettingDialog} onOpenChange={setShowSettingDialog} />
                                {selectedModelConfig?.customParameters && selectedModelConfig.customParameters.length > 0 && (
                                    <AdvancedSettingsDialog
                                        form={form}
                                        selectedModelConfig={selectedModelConfig}
                                        hideFormFields={hideFormFields}
                                        tabLocaleObject={tabLocaleObject}
                                    />
                                )}


                            </div>
                        )}
                    </div>




                    <div className='grid grid-cols-2 gap-2'>
                        {supportImagesConfig.map(support => (
                            <ImagesPreview
                                key={`preview-${support.name}`}
                                name={support.name}
                                label={support.label}
                                limit={support.isSupport || 0}
                                control={form.control}
                                setValue={form.setValue}
                            />
                        ))}

                        {supportAddFilesConfig.map((support) => (
                            <MediaPreview
                                key={`media-${support.name}`}
                                support={support}
                                control={form.control}
                                setValue={form.setValue}
                                ignoredText={tabLocaleObject?.imageUpload?.ignored || 'Ignored'}
                                unsupportedText={tabLocaleObject?.imageUpload?.unsupported || 'Unsupported'}
                            />
                        ))}
                    </div>

                    {/* prompt textarea */}
                    {!hideFormFields?.prompt && (
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem className='flex flex-col gap-2'>
                                    {/* <FormLabel className='capitalize font-bold'>Describe your image</FormLabel> */}
                                    <FormControl>

                                        <div className='flex flex-col gap-2 relative w-full '>
                                            <Textarea {...field} placeholder={tabLocaleObject?.promptPlaceholder ||
                                                "Describe your idea"
                                            }
                                                className='min-h-[200px] md:min-h-[150px] w-full max-w-2xl max-h-[500px] py-4 pb-12'
                                                value={field.value}
                                                onChange={(e) => {
                                                    // handlePromptChange(e);
                                                    field.onChange(e);

                                                }}
                                            />
                                            <FormDescription className={`absolute top-2 right-4 text-xs text-right ${field.value?.length && field.value?.length > 1200 ? 'text-red-500' : ''}`}>
                                                {tabLocaleObject?.characterCount?.replace('{{current}}', field.value?.length?.toString() || '0')?.replace('{{max}}', '1200') || `${field.value?.length}/1200 `}
                                            </FormDescription>

                                            {/* setting buttons in textarea area  md:max-w-[calc(100%-120px)]*/}
                                            <div className='w-full px-3 flex flex-col md:flex-wrap  md:absolute md:bottom-1  '>

                                                <div className='w-auto flex flex-wrap gap-1 items-center '>
                                                    {selectedModelConfig?.supportedAspectRatios && (
                                                        <AspectRatioSelectorPop
                                                            handleAspectRatioChange={handleAspectRatioChange}
                                                            selectedRatio={aspect_ratio}
                                                            customAspectRatios={selectedModelConfig.supportedAspectRatios}
                                                        />
                                                    )}

                                                    {/* Dynamic image upload buttons based on supportImagesConfig */}
                                                    {supportImagesConfig.map((support: SupportFileSetting) => {
                                                        const currentFiles: any[] = form.watch(support.name as any) || [];
                                                        const isSupported = (support.isSupport || 0) > 0;
                                                        const disabled = !isSupported || currentFiles.length >= (support.isSupport || 0);
                                                        const label = support.label || (tabLocaleObject?.buttons?.imageUpload || 'Image');
                                                        return (
                                                            <TooltipProvider key={`btn-${support.name}`}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            type="button"
                                                                            className={`rounded-lg ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (!inputRefs.current[support.name]) return;
                                                                                if (isSupported && !disabled) {
                                                                                    inputRefs.current[support.name]?.click();
                                                                                }
                                                                            }}
                                                                        >
                                                                            <ImagePlus className="h-4 w-4" />
                                                                            <span className="text-xs">
                                                                                + {label} {isSupported ? `(${currentFiles.length}/${support.isSupport})` : ''}
                                                                            </span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            {isSupported
                                                                                ? `Upload ${label.toLowerCase()} (max ${support.isSupport})`
                                                                                : tabLocaleObject?.tips?.notSupported ?? 'Not supported by this model'}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })}

                                                    {/* Dynamic audio/video upload buttons based on supportAddFilesConfig */}
                                                    {supportAddFilesConfig.map((support) => {
                                                        const currentFiles: any[] = form.watch(support.name) || [];
                                                        const isSupported = (support.isSupport || 0) > 0;
                                                        const disabled = !isSupported || currentFiles.length >= (support.isSupport || 0);
                                                        const label = support.label || (support.type === 'audio' ?
                                                            (tabLocaleObject?.mediaTypes?.audio || appLocale.mediaTypes.audio) :
                                                            (tabLocaleObject?.mediaTypes?.video || appLocale.mediaTypes.video));
                                                        return (
                                                            <TooltipProvider key={`btn-media-${support.name}`}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            type="button"
                                                                            className={`rounded-lg ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            disabled={disabled}
                                                                            onClick={() => {
                                                                                if (!mediaInputRefs.current[support.name]) return;
                                                                                if (isSupported && !disabled) {
                                                                                    mediaInputRefs.current[support.name]?.click();
                                                                                }
                                                                            }}
                                                                        >
                                                                            <UploadIcon className="h-4 w-4" />
                                                                            <span className="text-xs">
                                                                                + {label} {isSupported ? `(${currentFiles.length}/${support.isSupport})` : ''}
                                                                            </span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>
                                                                            {isSupported
                                                                                ? (tabLocaleObject?.mediaTypes?.tooltips?.uploadMedia || appLocale.mediaTypes.tooltips.uploadMedia)
                                                                                    .replace('{{type}}', label.toLowerCase())
                                                                                    .replace('{{max}}', support.isSupport?.toString() || '0')
                                                                                : (tabLocaleObject?.mediaTypes?.tooltips?.mediaNotSupported || appLocale.mediaTypes.tooltips.mediaNotSupported)}
                                                                        </p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })}



                                                    {/* prompt library settings */}
                                                    {!hideFormFields?.promptLibaray && (
                                                        <PromptSettingsDialog
                                                            modelSeries={promptLibrarySettings}
                                                            onModelSelect={(preset: StylePreset) => {
                                                                // form.setValue('prompt', preset?.prompt)
                                                                navigator.clipboard.writeText(preset?.prompt || "");
                                                            }}

                                                            open={showPromptSettingsDialog}
                                                            onOpenChange={setShowPromptSettingsDialog}
                                                            triggerText={tabLocaleObject?.buttons?.promptLibrary || appLocale.buttons.promptLibrary}
                                                            supportCustomPrompt={{
                                                                storageKey: `custom-prompt-library`
                                                            }}
                                                        />
                                                    )}

                                                    {/* Dynamic hidden inputs per support item */}
                                                    {supportImagesConfig.map((support) => (
                                                        <input
                                                            key={`input-${support.name}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, support.name)}
                                                            ref={(el) => { inputRefs.current[support.name] = el; }}
                                                            className="hidden"
                                                        />
                                                    ))}

                                                    {/* Hidden inputs for audio/video */}
                                                    {supportAddFilesConfig.map((support) => (
                                                        <input
                                                            key={`input-media-${support.name}`}
                                                            type="file"
                                                            accept={support.type === 'audio' ? 'audio/mp3, audio/wav, video/mp4, video/mov, video/avi' : 'video/mp4'}
                                                            onChange={(e) => handleMediaFileUpload(e, support)}
                                                            ref={(el) => { mediaInputRefs.current[support.name] = el; }}
                                                            className="hidden"
                                                        />
                                                    ))}

                                                    {supportAdapterModelConfig && (
                                                        <AdapterModelSettingsDialog
                                                            modelSeries={supportAdapterModelConfig}
                                                            onModelSelect={handleAdapterModelSettings}
                                                            currentModel={selectedAdapterModel}
                                                            triggerText={"Style"}
                                                            open={showAdapterModelSettingsDialog}
                                                            onOpenChange={setShowAdapterModelSettingsDialog}
                                                            supportCustonModel={{
                                                                supportedBases: selectedModelConfig?.supportAdapterBase || "",
                                                                storageKey: `custom-adapter-model-${selectedModelConfig?.supportAdapterBase}`
                                                            }}
                                                        />
                                                    )}

                                                </div>



                                            </div>
                                            {/* show the generate button, if the number of ongoing generations is less than the maximum concurrent generations */}


                                        </div>

                                    </FormControl>


                                    <FormMessage>
                                        {/* {form.formState.errors.prompt && <span>{form.formState.errors.prompt.message}</span>} */}
                                    </FormMessage>


                                </FormItem>
                            )}
                        />
                    )}
              

                    <div className='w-full'>
                        <Button
                            type="submit"
                            variant="default"
                            // size="sm"
                            // className="md:absolute bottom-1 right-5 h-7 px-2 text-xs rounded-lg z-10 mt-2 md:mt-0 self-end md:self-auto w-full md:w-auto"
                            className='w-full '

                            disabled={generateButtonDisabled || (activeTasks?.length || 0) >= maxGenQueen}
                        // onClick={() => toast.info('Quick Gen (sample button)')}
                        >
                            <WandSparkles className="h-4 w-4" />

                            <span className="ml-1 ">{tabLocaleObject?.buttons?.generate || "Generate"}</span>
                            {(
                                <>
                                    <DollarSign className='ml-1 h-4 text-[#facc15]' />{creditUsed}
                                </>
                            )}
                        </Button>
                    </div>

                    {selectedAdapter && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg border relative">
                            <Button
                                type='button'
                                onClick={() => setSelectedAdapterModel(null)}
                                className="absolute top-2 right-2 p-1 hover:bg-muted/50 rounded-md transition-colors"
                                title={tabLocaleObject?.adapter?.removeStyle || appLocale.adapter.removeStyle}
                                variant="ghost"
                                size="icon"
                            >
                                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <WandSparkles className="h-5 w-5 text-primary" />
                                    <p className="font-semibold text-sm capitalize"> {selectedAdapter.name ?? selectedAdapter.id}</p>
                                </div>
                                <div className="flex gap-3">
                                    {selectedAdapter?.image && selectedAdapter?.image.length > 0 && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={selectedAdapter.image[0]}
                                                alt={selectedAdapter.name ?? selectedAdapter.id}
                                                className="h-20 aspect-[3/2] object-cover rounded-md border"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 flex-col">
                                        {
                                            selectedAdapter.prompt && (
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {`${selectedAdapter.prompt} `}
                                                </p>
                                            )
                                        }
                                        {
                                            selectedAdapter.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {`${tabLocaleObject?.adapter?.description || appLocale.adapter.description} ${selectedAdapter.description}`}
                                                </p>
                                            )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {(typeof generationStatus === 'string' &&
                        generationStatus.toLowerCase() !== "succeeded" &&
                        generationStatus.toLowerCase() !== "ok") && (
                            <p className='text-center text-sm text-red-400'>
                                {(generationStatus)}
                            </p>
                        )}
                </form>
            </Form>
            {
                errorMessages.length > 0 && (
                    <div className="p-3 my-4 border border-destructive bg-white/85 rounded-md text-destructive">
                        {/* <h4 className="font-bold">Please fix the following issues:</h4>  */}
                        <ul className="list-disc list-inside mt-2 text-sm">
                            {errorMessages.map((message, index) => (
                                <li key={index}>{message as string}</li>
                            ))}
                        </ul>
                    </div>
                )
            }
        </div >





    );
});



AiMultiGeneratorApp.displayName = 'AiMultiGeneratorApp';
export default AiMultiGeneratorApp;



const appLocale = {
    // title and main label
    "tabTitle": "AI Canva APP",
    "modelLabel": "Model",
    "promptPlaceholder": "Describe your idea",
    "characterCount": "{{current}}/{{max}}",
    // API settings related
    "apiSettings": {
        "useCustomApiKey": "Use Custom API Key:",
        "none": "None"
    },
    // generation type selection
    "generationType": {
        "selectType": "Choose Type"
    },

    // step labels
    "stepLabels": {
        "uploadYourImage": "Upload your Image"
    },

    // tips and help information
    "tips": {
        "notSupported": "This model does not support image reference"
    },

    // button text
    "buttons": {
        "model": "Model",
        "promptLibrary": "Prompt Library",
        "imageUpload": "Image",
        "endImageUpload": "End",
        "style": "Style",
        "generate": "Generate",
        "advancedSettings": "Advanced Settings",
        "promptPreset": "Prompt Preset",
        // image combine step
        "chooseImage": "Choose Image",
        "choose": "Choose",
        "clear": "Clear",
        "remove": "Remove",
        "clearAll": "Clear All"
    },

    // image upload related
    "imageUpload": {
        "startImageLabel": "Start Image",
        "endImageLabel": "End Image",
        "unsupported": "Unsupported",
        "ignored": "Ignored",
        "uploadModes": {
            "single": "Single",
            "combine": "Combine (2)"
        },
        "imageLabels": {
            "firstImage": "First Image",
            "secondImage": "Second Image"
        },
        "status": {
            "noImageSelected": "No image selected",
            "combinedPreview": "Combined preview →",
            "selectTwoImages": "Select two images to auto-combine"
        },
        "altTexts": {
            "uploaded": "uploaded image",
            "firstImage": "first image",
            "secondImage": "second image",
            "mergedImage": "merged image"
        },
        "tooltips": {
            "imageNotSupported": "This model does not support image reference",
            "uploadReference": "Upload reference image (max {{maxImages}})",
            "endImageNotSupported": "This model does not support end image reference",
            "uploadEndReference": "Upload end image reference (max {{maxImages}})",
            "uploadSingle": "Upload 1 image (max {{max}})"
        }
    },

    // media file processing
    "mediaTypes": {
        "audio": "Audio",
        "video": "Video",
        "tooltips": {
            "uploadMedia": "Upload {{type}} (max {{max}})",
            "mediaNotSupported": "This model does not support this media input"
        }
    },

    // form related
    "form": {
        "placeholders": {
            "selectField": "Select {{field}}",
            "enterField": "Enter {{field}}"
        }
    },

    // prompt processing
    "promptProcessing": {
        "noProcessing": "No processing",
        "translateToEnglish": "Translate to English For better result",
        "enhancePrompt": "Enhance prompt",
        "displayModes": {
            "raw": "Raw",
            "en": "EN",
            "aiPlus": "AI+"
        }
    },

    // credits mode
    "creditsMode": {
        "free": "free",
        "freeTooltip": "Use free quota, shared compute, watermarked, public by default",
        "useCredits": "use credits",
        "useCreditsTooltip": "Use credits, faster and private generation",
        "termsNote": "Note: By using this feature, you agree to our website's Terms of Service and Privacy Policy.",

        // mode status description
        "modeStatus": {
            "creditMode": "Credit Mode: Use credits, faster and private generation",
            "freeMode": "Free Mode: Use free quota, shared compute, watermarked, public by default"
        }
    },

    // generation process related
    "generation": {
        "maxQueueLabel": "Max concurrent: {{current}}/{{max}}",
        "generating": {
            "tips1": "This may take a moment",
            "tips2": "Generating image..."
        }
    },

    // adapter and style
    "adapter": {
        "removeStyle": "Remove Style",
        "description": "Description:"
    },

    // results display
    "results": {

    },

    // tips message (only UI related)
    "toast": {

    }
}
