
import {
    AdapterModelSeriesSetting,
    kontext_lora_adapter_model,
} from "@/lib/ai-model-setting/apaterModel/styleModel";
// Note: Avoid importing functions into config objects that cross client boundaries.
// Any transform functions should be referenced by string identifiers and
// implemented in utils/tools/mapping.ts under the customFn handler.

import { MappingRule, Condition, Transform } from "@/utils/tools/mapping";


// ------------------- New Type Definitions for Extensibility -------------------

export type ApiInputSchema = {
    provider: 'fal' | 'runway' | 'kling' | 'huggingface' | 'replicate' | string;
    endpoint?: string;                            // 如果能提前定死端点，可放这
    variant_endpoint?: string;
    options?: {
        [key: string]: any,
    };
    rules: MappingRule[];
};


// Interface for custom parameter dropdown options
interface CustomParameterOption {
    value: string | number;
    label: string;
}

// Interface for defining model-specific custom parameters
interface CustomParameter {
    name: string; // The key for the parameter, used in form submission
    label: string; // The label displayed in the UI
    type: 'select' | 'slider' | 'switch' | 'input'; // The type of UI control
    defaultValue: string | number | boolean; // The default value
    description?: string; // Parameter description, can be used for tooltips
    options?: CustomParameterOption[]; // Options for 'select' type
    min?: number; // Minimum value for 'slider' type
    max?: number; // Maximum value for 'slider' type
    step?: number; // Step value for 'slider' type
}

// New generic support settings for media inputs
export interface SupportFileSetting {
    name: string; // e.g. "control_images", "end_control_images"
    label: string; // e.g. "Control Images", "End Control Images"
    type: 'image' | 'audio' | 'video';
    isRequired?: boolean; // Whether this input is required
    isSupport: number; // Supported items count (0 = no support, 1 = single, etc.)
    options?: {
        [key: string]: any,
    }
}

// Extended model settings type
export type ModelSeriesSetting = {
    id: string;
    label: string;
    description: string;
    badge?: string[];
    tag?: string[];
    // category?: string;
    supportedAspectRatios?: string[]; // Supported aspect ratios
    customParameters?: CustomParameter[]; // Array of custom parameters
    // supportAddFiles?: SupportFileSetting[]; // Generic media support definition
    supportAddFiles?: SupportFileSetting[]; // Generic media support definition
    type?: 'image' | 'video';
    provider?: string[];
    promptIgnore?: boolean;
    useCredits?: number;
    options?: {
        [key: string]: any,
    }
    /**
     * Deprecated: use supportAddFiles instead
     */
    isSupportImageRef?: number; // DEPRECATED: use supportAddFiles
    /**
     * Deprecated: use supportAddFiles instead
     */
    isRequiredImageRef?: boolean; // DEPRECATED: use supportAddFiles
    /**
     * Deprecated: use supportAddFiles instead
     */
    isSupportEndImageRef?: number; // DEPRECATED: use supportAddFiles
    // apiInput: 
    apiInput?: ApiInputSchema;
    // hfApiInput?: ApiInputSchema
    // adpter model : such as lora

    supportAdapterModel?: Record<string, AdapterModelSeriesSetting[]>;
    supportAdapterBase?: string;
};




const base_image_rules: MappingRule[] = [
    { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
    { to: 'image_size.width', from: 'width', transform: [{ op: 'toNumber' }] },
    { to: 'image_size.height', from: 'height', transform: [{ op: 'toNumber' }] },
    { to: 'enable_safety_checker', from: 'enable_safety_checker' },
    {
        to: 'output_format', from: 'output_format',
        transform: [{ op: 'enumMap', map: { png: 'png', jpg: 'jpeg', jpeg: 'jpeg' }, default: 'png' }]
    },
    { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
    // { to: 'control_images', from: 'control_images' },
    // { to: 'control_images_2', from: 'control_images_2', transform: [{ op: 'pick', index: 1 }] },
    // { to: 'image_url', from: 'control_images_2', transform: [{ op: 'pick', index: 0 }] },
    // {
    //     to: 'image_urls',
    //     from: 'control_images_2',
    //     transform: [{ op: 'slice', start: 0, end: 2 }]
    // },
]
const base_image_aspect_rules: MappingRule[] = [
    { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
    { to: 'aspect_ratio', from: 'aspect_ratio' },
    { to: 'enable_safety_checker', from: 'enable_safety_checker' },
    {
        to: 'output_format', from: 'output_format',
        transform: [{ op: 'enumMap', map: { png: 'png', jpg: 'jpeg', jpeg: 'jpeg' }, default: 'png' }]
    },
    { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
]
const base_hf_image_rules: MappingRule[] = [
    {
        to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }]
    },
    { to: 'width', from: 'width', transform: [{ op: 'toNumber' }] },
    { to: 'height', from: 'height', transform: [{ op: 'toNumber' }] },
    { to: 'input_image', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
]

const base_video_rules: MappingRule[] = [
    { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
    { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
    { to: 'enable_safety_checker', from: 'enable_safety_checker' },
]



const flux_series_image_model: ModelSeriesSetting[] = [
    {
        id: "flux-schnell",
        label: "Flux schnell",
        tag: ["Text to Image"],
        badge: [],
        description: "Flux schnell model for image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.03,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux/schnell',
            rules: [
                ...base_image_rules,
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        }
    },
    {
        id: "flux-dev",
        label: "flux dev",
        description: "Balanced version with good quality-speed ratio",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        tag: ["Text to Image"],
        badge: [],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.3,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux/dev', // fal-ai/flux-1/dev   fal-ai/flux/dev
            rules: [
                ...base_image_rules,
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                },
                {
                    to: 'num_inference_steps', const: 28
                },
                {
                    to: 'guidance_scale', const: 3.5
                }
            ]
        }
    },
    {
        id: "flux-krea-dev",
        label: "flux krea dev",
        description: "Optimized for realistic images",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        tag: ["Text to Image"],
        badge: [],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.3,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux/krea',
            rules: [
                ...base_image_rules,
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        }
    },
    {
        id: "flux-dev-kontext-text2image-lora",
        label: "Flux dev Kontext",
        tag: ["Text to Image"],
        badge: [],
        description: "Flux dev kontext model for text to image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.3,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-kontext-lora/text-to-image',
            rules: [
                ...base_image_rules,
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        },

    },
    {
        id: "flux-pro-kontext-text2image",
        label: "Flux Pro Kontext",
        tag: ["Text to Image"],
        description: "Flux pro kontext model for text to image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.4,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/kontext/text-to-image',
            rules: [
                ...base_image_aspect_rules,
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }

            ]
        }
    },
    {
        id: "flux-max-kontext-text2image",
        label: "Flux Max Kontext",
        tag: ["Text to Image"],
        description: "Flux max kontext model for text to image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.8,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/kontext/max/text-to-imagee',
            rules: [
                ...base_image_aspect_rules,
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        }
    },
    {
        id: "flux-1.1-pro",
        label: "Flux 1.1 Pro",
        tag: ["Text to Image"],
        description: "Flux 1.1 Pro model for text to image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.4,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/v1.1',
            rules: [
                ...base_image_rules,
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }

            ]
        }
    },
    {
        id: "flux-1.1-pro-ultra",
        label: "Flux 1.1 Pro Ultra",
        tag: ["Text to Image"],
        description: "Flux 1.1 Pro Ultra model for text to image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.8,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },
            {
                name: "raw",
                label: "Raw",
                type: 'switch',
                defaultValue: false,
                description: "Whether to use raw mode.",
            }

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/v1.1-ultra',
            rules: [
                ...base_image_aspect_rules,
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'raw ', from: 'raw', transform: [{ op: 'default', value: false }]
                },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }

            ]
        }
    },
    {
        id: "flux-dev-kontext-image-edit",
        label: "Flux dev Kontext Edit",
        tag: ["Image to Image"],
        badge: ["Image Edit", ],
        description: "Flux dev kontext model for image editing",
        supportedAspectRatios: ["auto", "1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.25,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-kontext/dev',

            rules: [
                ...base_image_aspect_rules,

            ]
        }
    },
    {
        id: "flux-dev-kontext-image-edit-lora",
        label: "Flux dev Kontext Edit (Lora)",
        tag: ["Image to Image"],
        badge: ["Image Edit"],
        description: "Flux dev kontext model for image editing",
        supportedAspectRatios: ["auto", "1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.35,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-kontext-lora/text-to-image',
            rules: [
                ...base_image_aspect_rules,
                {
                    to: 'loras',
                    from: 'meta_data.adapter_model',

                }
            ]
        },

        supportAdapterModel: kontext_lora_adapter_model,
        supportAdapterBase: "flux-kontext",
    },
    {
        id: "flux-pro-kontext-image-edit",
        label: "Flux Pro Kontext Edit",
        description: "Flux pro kontext model for image editing",
        tag: ["Image to Image"],
        badge: ["Image Edit"],
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Image",
                type: "image",
                isRequired: true,
                isSupport: 2,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.4,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/kontext/multi',
            rules: [
                ...base_image_aspect_rules.filter(rule => rule.to !== 'image_url'),
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'image_urls',
                    from: 'control_images',
                    transform: [{ op: 'slice', start: 0, end: 2 }]
                },

            ]
        },
        // supportAdapterModel: pro_pro_kontext_lora_adapter_model,
        // supportAdapterBase: "flux-kontext",
    },
    {
        id: "flux-max-kontext-image-edit",
        label: "Flux Max Kontext Edit",
        description: "Flux max kontext model for image editing",
        tag: ["Image to Image"],
        badge: ["Image Edit"],
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Image",
                type: "image",
                isRequired: true,
                isSupport: 2,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.8,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pro/kontext/max/multi',
            rules: [
                ...base_image_aspect_rules.filter(rule => rule.to !== 'image_url'),
                {
                    to: 'safety_tolerance', const: '5'
                },
                {
                    to: 'image_urls',
                    from: 'control_images',
                    transform: [{ op: 'slice', start: 0, end: 2 }]
                },
            ]
        }
    },


]
const openai_series_image_model: ModelSeriesSetting[] = [
    {
        id: "gpt-image-1",
        label: "GPT Image",
        description: "Most powerful image generation model, understands and creates various image styles for many scenarios, but slower with limited generation quota",
        supportedAspectRatios: ["1:1", "2:3", "3:2"],
        tag: ["Text to Image", "Image to Image"],
        badge: ["Image Edit",],
        useCredits: 0.7,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: false,
                isSupport: 1,
            },
        ],
        type: 'image',

        apiInput: {
            provider: 'openai',
            endpoint: 'openai/gpt-image-1',
            rules: [
                ...base_image_rules,
            ]
        }
    },
    // {
    //     value: "gpt-image-1-reframe",
    //     label: "GPT Image Reframe",
    //     description: "GPT Image with reframe workflow",
    //     badge: ["Text to Image", "Image Edit", "Image to Image"],
    //     supportedAspectRatios: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3"],
    // type: 'image',
    // provider: ['workflow'],
    //     supportAddFiles: [
    //         {
    //             name: "control_images",
    //             label: "Reference Image",
    //             type: "image",
    //             isRequired: true,
    //             isSupport: 1,
    //         },
    //     ],
    // }
]
const google_series_image_model: ModelSeriesSetting[] = [
    {
        id: "gemini-2.0-flash-preview-image-generation",
        label: "Gemini Image Edit 2.0 Flash",
        description: "Suitable for simple image editing with faster processing speed",
        // supportedAspectRatios: ["1:1"],
        tag: ["Image to Image"],
        badge: ["Image Edit", ],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 2,
            },
        ],
        type: 'image',
        provider: ['fal',],
        useCredits: 0.1,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/gemini-flash-edit/multi',
            rules: [
                {
                    to: 'input_image_urls',
                    from: 'control_images',
                    transform: [{ op: 'slice', start: 0, end: 2 }]
                },
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
            ]
        }
    },
    {
        id: "gemini-2.5-flash-image-preview",
        label: "Gemini Image Edit 2.5 Flash | nano banana",
        description: "Insane Image Editing Model",
        // supportedAspectRatios: ["1:1"],
        tag: ["Image to Image"],
        badge: ["Image Edit", ],
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 3,
            },
        ],
        type: 'image',
        provider: ['fal',],
        useCredits: 0.4,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/gemini-25-flash-image/edit',
            rules: [
                {
                    to: 'image_urls',
                    from: 'control_images',
                    transform: [{ op: 'slice', start: 0, end: 3 }]
                },
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
            ]
        }
    },
    // {
    //     id: "gemini-2-5-flash-gen-exp",
    //     label: "Gemini Text to Image 2.5 Flash | nano banana",
    //     description: "Insane Text to Image Model",
    //     // supportedAspectRatios: ["1:1"],
    //     tag: ["Text to Image"],
    //     badge: [],

    //     type: 'image',
    //     provider: ['fal',],
    //     useCredits: 0.4,
    //     apiInput: {
    //         provider: 'fal',
    //         endpoint: 'fal-ai/gemini-25-flash-image',
    //         rules: [

    //             { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
    //         ]
    //     }
    // },
    {
        id: "google-imagen4-fast",
        label: "imagen4 fast",
        description: "Lightweight version for quick generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "16:9", "9:16",],
        tag: ["Text to Image"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.2,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/imagen4/preview/fast',
            rules: [
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
                { to: 'aspect_ratio', from: 'aspect_ratio' },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        }
    },
    {
        id: "google-imagen4",
        label: "imagen4 standard",
        description: "Standard version for stylized and realistic scenes",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "16:9", "9:16",],
        tag: ["Text to Image"],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.4,
        customParameters: [
            {
                name: "num_outputs",
                label: "Number",
                type: 'select',
                defaultValue: '1',
                description: "Number of images to generate.",
                options: [
                    { value: '1', label: '1' },
                    { value: '2', label: '2' },
                    { value: '3', label: '3' },
                    { value: '4', label: '4' },
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/imagen4/preview',
            rules: [
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
                { to: 'aspect_ratio', from: 'aspect_ratio' },
                {
                    to: 'num_images', from: 'num_outputs', transform: [{ op: 'toNumber' }]
                }
            ]
        }
    },
    {
        id: "google-imagen4-ultra",
        label: "imagen4 ultra",
        tag: ["Text to Image"],
        description: "Latest version for high quality image generation",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "16:9", "9:16",],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.6,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/imagen4/preview/ultra',
            rules: [
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
                { to: 'aspect_ratio', from: 'aspect_ratio' },
            ]
        }
    },
]
const qwen_series_image_model: ModelSeriesSetting[] = [
    {
        id: "qwen-image-edit",
        label: "Qwen Image Edit",
        description: "Suitable for simple image editing with faster processing speed",
        // supportedAspectRatios: ["1:1"],
        tag: ["Image to Image"],
        badge: ["Image Edit", ],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal',],
        useCredits: 0.3,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/qwen-image-edit',
            rules: [
                ...base_image_rules,
            ]
        }
    },

]

const character_series_image_model: ModelSeriesSetting[] = [

    {
        id: "flux-dev-pulid",
        label: "Character- face",
        tag: ["Image to Image"],
        badge: ["Face Reference", ],
        description: "Focuses on preserving facial features, more variability.",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Face Reference",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.5,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/flux-pulid',
            rules: [
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
                { to: 'reference_image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
                { to: 'image_size.width', from: 'width', transform: [{ op: 'toNumber' }] },
                { to: 'image_size.height', from: 'height', transform: [{ op: 'toNumber' }] },
                { to: 'max_sequence_length ', const: '512' },
                { to: 'enable_safety_checker', from: 'enable_safety_checker' },
            ]
        }
    },
    {
        id: "ideogram-character",
        label: "ideogram Character",
        tag: ["Image to Image"],
        badge: ["Character Reference"],
        description: "Generate consistent character appearances across multiple images. Maintain facial features, proportions, and distinctive traits for cohesive storytelling and branding.",
        supportedAspectRatios: ["1:1", "3:4", "4:3", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Character Reference",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 1.5,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/ideogram/character',
            rules: [
                { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
                { to: 'reference_image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
                { to: 'image_size.width', from: 'width', transform: [{ op: 'toNumber' }] },
                { to: 'image_size.height', from: 'height', transform: [{ op: 'toNumber' }] },

            ]
        }
    },
  
]
const other_series_image_model: ModelSeriesSetting[] = [
    {
        id: "ic-light-v2",
        label: "IC Light",
        description: "A model that specializes in relighting images.",
        tag: ["Image to Image"],
        badge: ["Relight", "Background Change", "Image Edit",],
        supportedAspectRatios: ["1:1", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Relight Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "light_type",
                label: "Light Type",
                type: 'select',
                defaultValue: 'None',
                description: "Choose the type of light to apply.",
                options: [
                    { value: 'None', label: 'None' },
                    { value: 'Left', label: 'Left Light' },
                    { value: 'Right', label: 'Right Light' },
                    { value: 'Bottom', label: 'Bottom Light' },
                    { value: 'Top', label: 'Top Light' },
                ]
            },
        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 1,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/iclight-v2',
            rules: [
                ...base_image_rules,
                {
                    to: 'initial_latent', from: 'meta_data.light_type', transform: [{ op: 'default', value: 'None' }]
                }
            ]
        }
    },
    // {
    //     id: "fashn-tryon",
    //     label: "Fashn Tryon",
    //     description: "A model that specializes in virtual tryon.",
    //     tag: ["Image to Image"],
    //     badge: ["Tryon", "Virtual Tryon"],
    //     promptIgnore: true,
    //     // supportedAspectRatios: ["1:1", "2:3", "3:2", "4:5", "5:4", "16:9", "9:16","21:9","9:21"],
    //     supportAddFiles: [
    //         {
    //             name: "control_images",
    //             label: "Model Image",
    //             type: "image",
    //             isRequired: true,
    //             isSupport: 1,
    //         },
    //         {
    //             name: "control_images_2",
    //             label: "Garment Image",
    //             type: "image",
    //             isRequired: true,
    //             isSupport: 1,
    //         },
    //     ],
    //     type: 'image',
    //     provider: ['fal'],
    //     useCredits: 0.8,
    //     apiInput: {
    //         provider: 'fal',
    //         endpoint: 'fal-ai/fashn/tryon/v1.6',
    //         rules: [
    //             // { to: 'prompt', from: ['prompt_process', 'prompt'], transform: [{ op: 'coalesce' }] },
    //             { to: 'model_image ', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
    //             { to: 'garment_image  ', from: 'control_images_2', transform: [{ op: 'pick', index: 0 }] },
    //         ]
    //     }
    // },
    {
        id: "luma-photon-flash-reframe",
        label: "Luma Reframe",
        description: "A model that specializes in reframing images.",
        tag: ["Image to Image"],
        badge: ["Reframe",],
        promptIgnore: true,
        supportedAspectRatios: ["16:9", "9:16", "1:1", "3:4", "4:3", "21:9", "9:21"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },

        ],
        type: 'image',
        provider: ['fal'],
        useCredits: 0.2,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/luma-photon/flash/reframe',
            rules: [
                { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
                { to: 'aspect_ratio', from: 'aspect_ratio', transform: [{ op: 'default', value: '1:1' }] },
            ]
        }
    },
]
const image_utils_series_model: ModelSeriesSetting[] = [
    {
        id: "image-remove-bg-imageutils",
        label: "Remove Background",
        description: "Remove background from image",
        // supportedAspectRatios: ["1:1"],
        promptIgnore: true,
        tag: ["Image to Image"],
        badge: ["Image Edit", "Remove Background",],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal',],
        useCredits: 0.01,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/imageutils/rembg',
            rules: [
                { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
            ]
        },
    },
    {
        id: "image-upscale-recraft-crisp",
        label: "Image Upscale",
        description: "Upscale image",
        // supportedAspectRatios: ["1:1"],
        promptIgnore: true,
        tag: ["Image to Image"],
        badge: ["Upscale", "Image Edit"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Reference Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'image',
        provider: ['fal',],
        useCredits: 0.04,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/recraft/upscale/crisp',
            rules: [
                { to: 'image_url', from: 'control_images', transform: [{ op: 'pick', index: 0 }] },
            ]
        },
    },
]





// video model
const alibaba_wan_series_video_model: ModelSeriesSetting[] = [
    // text to video
    {
        id: "wan2-2-text2video",
        label: "Wan2.2",
        description: "Budget-friendly, cinematic and realistic videos",
        tag: ["Text to Video"],
        badge: ["Cinematic"],
        type: 'video',
        provider: ['fal'],

        supportedAspectRatios: ['16:9', '9:16', '1:1',],
        customParameters: [
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '480p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                ]
            },
        ],
        useCredits: 2,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: 'auto' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },
            ]
        }
    },
    {
        id: "wan2-2-turbo-text2video",
        label: "Wan2.2 Turbo",
        description: "Fast, cinematic videos",
        tag: ["Text to Video"],
        badge: [ "Fast"],
        type: 'video',
        provider: ['fal'],

        supportedAspectRatios: ['16:9', '9:16', '1:1'],
        customParameters: [
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '480p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                ]
            },
        ],
        useCredits: 0.5,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/wan/v2.2-a14b/text-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: '16:9' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '480p' }]
                },
            ]
        }
    },



    // image to video

    {
        id: "wan2-2-turbo-image2video",
        label: "Wan2.2 Turbo",
        description: "Fast, cinematic videos",
        tag: ["Image to Video"],
        badge: ["Fast"],
        type: 'video',
        provider: ['fal'],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        supportedAspectRatios: ['auto', '16:9', '9:16', '1:1'],
        customParameters: [
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '480p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                ]
            },
        ],
        useCredits: 0.5,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/wan/v2.2-a14b/image-to-video/turbo',
            rules: [
                ...base_video_rules,
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: 'auto' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '480p' }]
                },
            ]
        }
    },
    {
        id: "wan2-2-image2video",
        label: "Wan2.2",
        description: "Budget-friendly, cinematic and realistic videos",
        tag: ["Image to Video"],
        badge: ["Cinematic"],
        type: 'video',
        provider: ['fal'],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        supportedAspectRatios: ['auto', '16:9', '9:16', '1:1',],
        customParameters: [
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [

                    { value: '720p', label: '720p' },
                ]
            },
        ],
        useCredits: 5,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/wan/v2.2-a14b/image-to-video/lora',
            rules: [
                ...base_video_rules,
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: 'auto' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },
            ]
        }
    },
]
const minimax_hailuo_series_video_model: ModelSeriesSetting[] = [
    // text to video

    {
        id: "haihuo-2-standard-text2video",
        label: "Hailuo 2 Standard",
        description: "Budget-friendly realistic videos",
        tag: ["Text to Video"],
        badge: ["Motion", "Fast"],
        type: 'video',
        provider: ['fal'],
        useCredits: 3,
        supportedAspectRatios: ['16:9', '9:16', '1:1'],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '6',
                description: "Choose the duration of the video.",
                options: [
                    { value: '6', label: '6 s' },
                    { value: '10', label: '10 s' }
                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/minimax/hailuo-02/standard/text-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },

            ]
        },
    },
    {
        id: "haihuo-2-pro-text2video",
        label: "Hailuo 2 Pro",
        description: "High-quality AI video generation",
        tag: ["Text to Video"],
        badge: ["High Quality"],
        type: 'video',
        provider: ['fal'],
        useCredits: 5,

        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/minimax/hailuo-02/standard/text-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
            ]
        },
    },


    // image to video
    {
        id: "haihuo-2-fast-image2video",
        label: "Hailuo 2 Fast",
        description: "Budget-friendly realistic videos",
        tag: ["Image to Video"],
        badge: ["Motion", "Fast"],

        type: 'video',
        provider: ['fal'],
        useCredits: 1,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '6',
                description: "Choose the duration of the video.",
                options: [
                    { value: '6', label: '6 s' },
                    { value: '10', label: '10 s' }
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/minimax/hailuo-02-fast/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },

            ]
        },
    },

    {
        id: "haihuo-2-standard-image2video",
        label: "Hailuo 2 Standard",
        description: "Budget-friendly realistic videos",
        tag: ["Image to Video"],
        badge: ["Realistic"],

        type: 'video',
        provider: ['fal'],
        useCredits: 3,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '6',
                description: "Choose the duration of the video.",
                options: [
                    { value: '6', label: '6 s' },
                    { value: '10', label: '10 s' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '512P',
                description: "Choose the resolution of the video.",
                options: [

                    { value: '512P', label: '512P' },
                    { value: '768P', label: '768P' },
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },
            ]
        },
    },

    {
        id: "haihuo-2-pro-image2video",
        label: "Hailuo 2 Pro",
        description: "Smooth motion videos",
        tag: ["Image to Video"],
        badge: ["Smooth Motion"],
        type: 'video',
        provider: ['fal'],
        useCredits: 5,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],

        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/minimax/hailuo-02/pro/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),

            ]
        },
    },


]
const kuaishou_kling_series_video_model: ModelSeriesSetting[] = [
    // text to video


    {
        id: "kling-1-5-standard-text2video",
        label: "Kling 1.6 Standard",
        description: "Budget-friendly realistic videos",
        tag: ["Text to Video"],
        badge: ["Realistic"],
        supportedAspectRatios: ['16:9', '9:16', '1:1',],
        type: 'video',
        provider: ['fal'],
        useCredits: 2.5,
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5 s' },
                    { value: '10', label: '10 s' }
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/kling-video/v1.6/standard/text-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
            ]
        }
    },

    // image to video

    // kling 
    {
        id: "kling-2-1-standard-image2video",
        label: "Kling 2.1 Standard",
        description: "Budget-friendly realistic videos",
        tag: ["Image to Video"],
        badge: ["Realistic"],

        type: 'video',
        provider: ['fal'],
        useCredits: 2.5,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5 s' },
                    { value: '10', label: '10 s' }
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/kling-video/v2.1/standard/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
            ]
        },
    },
    {
        id: "kling-2-1-pro-image2video",
        label: "Kling 2.1 Pro",
        description: "Realistic videos",
        tag: ["Image to Video"],
        badge: ["Realistic"],
        type: 'video',
        provider: ['fal'],
        useCredits: 5,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
            {
                name: "control_images_2",
                label: "End Image",
                type: "image",
                isRequired: false,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5 s' },
                    { value: '10', label: '10 s' }
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/kling-video/v2.1/pro/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'tail_image_url', from: 'control_images_2', transform: [{ op: 'pick', index: 0 }]
                },
            ]
        }
    },
    {
        id: "kling-2-1-master-image2video",
        label: "Kling 2.1 Master",
        description: "Budget-friendly realistic videos",
        tag: ["Image to Video"],
        badge: ["Realistic"],
        type: 'video',
        provider: ['fal'],
        useCredits: 15,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5 s' },
                    { value: '10', label: '10 s' }
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/kling-video/v2.1/master/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
            ]
        }
    },

]
const google_veo_series_video_model: ModelSeriesSetting[] = [
    // text to video
    {
        id: "google-veo3-text2video",
        label: "Google Veo3 Fast",
        description: "High quality, smooth motion, cinematic videos",
        tag: ["Text to Video"],
        badge: ["High Quality", "Cinematic", "With audio"],
        type: 'video',
        provider: ['fal'],
        useCredits: 35,
        supportedAspectRatios: ['16:9', '9:16', '1:1'],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '68',
                description: "Choose the duration of the video.",
                options: [
                    { value: '8s', label: '8 s' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },

                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/veo3/fast',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                // {
                //     to: 'duration', from: 'duration',
                //     transform: [{ op: 'toString' }, { op: 'default', value: '8s' }]
                // },
                // {
                //     to: 'resolution', from: 'resolution',
                //     transform: [{ op: 'default', value: '720p' }]
                // },

            ]
        },
    },

    // image to video


    {
        id: "google-veo3-image2video",
        label: "Google Veo3 Fast",
        description: "High quality, smooth motion, cinematic videos",
        tag: ["Image to Video"],
        badge: ["High Quality", "Cinematic", "With audio"],
        type: 'video',
        provider: ['fal'],
        useCredits: 35,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '68',
                description: "Choose the duration of the video.",
                options: [
                    { value: '8s', label: '8 s' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },

                ]
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/veo3/fast/image-to-video',
            rules: [
                ...base_video_rules.filter(rule => rule.to !== 'enable_safety_checker'),
                // {
                //     to: 'duration', from: 'duration',
                //     transform: [{ op: 'toString' }, { op: 'default', value: '8s' }]
                // },
                // {
                //     to: 'resolution', from: 'resolution',
                //     transform: [{ op: 'default', value: '720p' }]
                // },

            ]
        },
    },
]
const bytedance_seeddance_series_video_model: ModelSeriesSetting[] = [
    // text to video
    {
        id: "seedance-v1-lite-text2video",
        label: "Seedance V1 Lite",
        description: "Smooth motion, Good quality",
        tag: ["Text to Video"],
        badge: ["Good Quality", "Fast"],

        type: 'video',
        provider: ['fal'],
        useCredits: 2,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5' },
                    { value: '10', label: '10' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p' },
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/bytedance/seedance/v1/lite/text-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: '16:9' }]
                },
            ]
        },
    },
    {
        id: "seedance-v1-pro-text2video",
        label: "Seedance V1 Pro",
        description: "Smooth motion, Good quality",
        tag: ["Text to Video"],
        badge: ["High Quality",],

        type: 'video',
        provider: ['fal'],
        useCredits: 3,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5' },
                    { value: '10', label: '10' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p' },
                ]
            },
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '1080p' }]
                },
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: '16:9' }]
                },
            ]
        },
    },

    // image to video
    {
        id: "seedance-v1-lite-image2video",
        label: "Seedance V1 Lite",
        description: "Smooth motion, Good quality",
        tag: ["Image to Video"],
        badge: ["Good Quality", "Fast"],
        type: 'video',
        provider: ['fal'],
        useCredits: 2,
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
            {
                name: "control_images_2",
                label: "End Image",
                type: "image",
                isRequired: false,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5' },
                    { value: '10', label: '10' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p' },
                ]
            },
            {
                name: "camera_fixed",
                label: "Camera Fixed",
                type: 'switch',
                defaultValue: false,
                description: "Choose the camera fixed of the video.",
            }
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/bytedance/seedance/v1/lite/image-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },

                {
                    to: 'end_image_url', from: 'control_images_2', transform: [{ op: 'pick', index: 0 }]
                },
                {
                    to: 'camera_fixed', from: 'meta_data.camera_fixed',
                    transform: [{ op: 'default', value: false }]
                }
            ]
        },
    },

    {
        id: "seedance-v1-pro-2video",
        label: "Seedance V1 Pro",
        description: "Smooth motion, Good quality",
        tag: ["Image to Video"],
        badge: ["High Quality",],

        type: 'video',
        provider: ['fal'],
        useCredits: 3,
        supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
            {
                name: "control_images_2",
                label: "End Image",
                type: "image",
                isRequired: false,
                isSupport: 1,
            },
        ],
        customParameters: [
            {
                name: "duration",
                label: "Duration",
                type: 'select',
                defaultValue: '5',
                description: "Choose the duration of the video.",
                options: [
                    { value: '5', label: '5' },
                    { value: '10', label: '10' }
                ]
            },
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '720p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '720p', label: '720p' },
                    { value: '1080p', label: '1080p' },
                ]
            },
            {
                name: "camera_fixed",
                label: "Camera Fixed",
                type: 'switch',
                defaultValue: false,
                description: "Choose the camera fixed of the video.",
            }
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/bytedance/seedance/v1/pro/image-to-video',
            rules: [
                ...base_video_rules,
                {
                    to: 'duration', from: 'duration',
                    transform: [{ op: 'toString' }, { op: 'default', value: '5' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '720p' }]
                },

                {
                    to: 'end_image_url', from: 'control_images_2', transform: [{ op: 'pick', index: 0 }]
                },
                {
                    to: 'camera_fixed', from: 'meta_data.camera_fixed',
                    transform: [{ op: 'default', value: false }]
                }
            ]
        },
    },
]

const avatar_series_video_model: ModelSeriesSetting[] = [
    {
        id: "creatify-lipsync",
        label: "Creatify Lipsync",
        description: "Realistic lipsync video - optimized for speed, quality, and consistency, 0.2 credits/s",
        tag: ["Lipsync",],
        badge: ["Good Quality"],
        type: 'video',
        provider: ['fal'],
        useCredits: 0.2,
        promptIgnore: true,
        options: {
            creditBySecond: true,
            creditsByControl: "control_files",
        },
        supportAddFiles: [
            {
                name: "control_files",
                label: "Ref Audio",
                type: "audio",
                isRequired: true,
                isSupport: 1,
                options: {
                    maxDuration: 15,  // unit: second
                }
            },
            {
                name: "control_files_2",
                label: "Ref Video",
                type: "video",
                isRequired: true,
                isSupport: 1,
                options: {
                    maxDuration: 15,  // unit: second
                    maxFileSize: 30,  // unit: Mb
                }
            },
        ],
        customParameters: [
            {
                name: "maxDuration",
                label: "Max Duration",
                type: 'slider',
                defaultValue: 15,
                description: "Max duration of the audio/video input.",
                min: 1,
                max: 30,
                step: 1,
            },
            {
                name: "loop",
                label: "Loop",
                type: 'switch',
                defaultValue: true,
                description: "Enable the loop of the video.",
            }
        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'creatify/lipsync',
            rules: [
                {
                    to: 'audio_url', from: 'control_files',
                    transform: [{ op: 'pick', index: 0 }]
                },
                {
                    to: 'video_url', from: 'control_files_2',
                    transform: [{ op: 'pick', index: 0 }]
                },

                {
                    to: 'loop', from: 'meta_data.loop',
                    transform: [{ op: 'default', value: false }]
                }
            ]
        },
    },

    {
        id: "sync-lipsync-v2",
        label: "Sync Lipsync V2",
        description: "Generate realistic lipsync animations from audio with Sync Lipsync 2.0 model, 0.5 credits/s",
        tag: ["Lipsync",],
        badge: ["Good Quality"],
        type: 'video',
        provider: ['fal'],
        useCredits: 0.5,
        promptIgnore: true,
        options: {
            creditBySecond: true,
            creditsByControl: "control_files",
        },
        supportAddFiles: [
            {
                name: "control_files",
                label: "Ref Audio",
                type: "audio",
                isRequired: true,
                isSupport: 1,
                options: {
                    maxDuration: 15,  // unit: second

                }
            },
            {
                name: "control_files_2",
                label: "Ref Video",
                type: "audio",
                isRequired: true,
                isSupport: 1,
                options: {
                    maxDuration: 15,  // unit: second
                    maxSizeMB: 30,
                }
            },

        ],
        customParameters: [
            {
                name: "maxDuration",
                label: "Max Duration",
                type: 'slider',
                defaultValue: 15,
                description: "Max duration of the audio/video input.",
                min: 1,
                max: 30,
                step: 1,
            },

        ],
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/sync-lipsync/v2',
            rules: [

                {
                    to: 'audio_url', from: 'control_files',
                    transform: [{ op: 'pick', index: 0 }]
                },
                {
                    to: 'video_url', from: 'control_files_2',
                    transform: [{ op: 'pick', index: 0 }]
                },
            ]
        },
    },
    // {
    //     id: "bytedance-omnihuman",
    //     label: "bytedance omnihuman",
    //     description: `Generate vivid, high-quality videos where the character's emotions and movements maintain a strong correlation with the audio.`,
    //     tag: ["Lipsync",],
    //     badge: ["Good Quality"],
    //     type: 'video',
    //     provider: ['fal'],
    //     useCredits: 1.5,
    //     promptIgnore: true,
    //     options: {
    //         creditBySecond: true,
    //         creditsByControl: "control_files",
    //     },
    //     supportAddFiles: [
    //         {
    //             name: "control_images",
    //             label: "Ref Image",
    //             type: "image",
    //             isRequired: true,
    //             isSupport: 1,

    //         },
    //         {
    //             name: "control_files",
    //             label: "Ref Audio",
    //             type: "audio",
    //             isRequired: true,
    //             isSupport: 1,
    //             options: {
    //                 maxDuration: 15,  // unit: second

    //             }
    //         },
    //     ],
    //     customParameters: [
    //         {
    //             name: "maxDuration",
    //             label: "Max Duration",
    //             type: 'slider',
    //             defaultValue: 15,
    //             description: "Max duration of the audio/video input.",
    //             min: 1,
    //             max: 30,
    //             step: 1,
    //         },

    //     ],
    //     apiInput: {
    //         provider: 'fal',
    //         endpoint: 'creatify/lipsync',
    //         rules: [
    //             {
    //                 to: 'image_url', from: 'control_images',
    //                 transform: [{ op: 'pick', index: 0 }]
    //             },
    //             {
    //                 to: 'audio_url', from: 'control_files',
    //                 transform: [{ op: 'pick', index: 0 }]
    //             },
    //         ]
    //     },
    // },
]


const other_series_video_model: ModelSeriesSetting[] = [
    // ltx
    {
        id: "ltx-image2video",
        label: "LTX",
        description: "Budget-friendly realistic videos ",
        tag: ["Image to Video"],
        badge: ["Fast"],
        supportAddFiles: [
            {
                name: "control_images",
                label: "Start Image",
                type: "image",
                isRequired: true,
                isSupport: 1,
            },
        ],
        type: 'video',
        provider: ['fal'],
        customParameters: [
            {
                name: "resolution",
                label: "Resolution",
                type: 'select',
                defaultValue: '480p',
                description: "Choose the resolution of the video.",
                options: [
                    { value: '480p', label: '480p' },
                    { value: '720p', label: '720p' },
                ]
            },
        ],
        useCredits: 1,
        apiInput: {
            provider: 'fal',
            endpoint: 'fal-ai/ltxv-13b-098-distilled/image-to-video', //fal-ai/ltx-video-13b-distilled/image-to-video
            rules: [
                ...base_video_rules,
                {
                    to: 'aspect_ratio', from: 'aspect_ratio',
                    transform: [{ op: 'default', value: 'auto' }]
                },
                {
                    to: 'resolution', from: 'resolution',
                    transform: [{ op: 'default', value: '480p' }]
                },
            ]
        }
    },
]
export const all_image_model: ModelSeriesSetting[] = [
    ...flux_series_image_model,
    // ...openai_series_image_model,
    ...google_series_image_model,
    ...qwen_series_image_model,
    ...character_series_image_model,
    ...other_series_image_model,
]
export const all_video_model: ModelSeriesSetting[] = [
    ...alibaba_wan_series_video_model,
    ...bytedance_seeddance_series_video_model,
    ...kuaishou_kling_series_video_model,
    ...minimax_hailuo_series_video_model,
    ...google_veo_series_video_model,
    ...image_utils_series_model,
    ...other_series_video_model,
]

const text_to_image_model: ModelSeriesSetting[] = [
    ...all_image_model.filter(model => model.tag?.includes("Text to Image")),
]
const image_to_image_model: ModelSeriesSetting[] = [
    ...all_image_model.filter(model => model.tag?.includes("Image to Image")),
]

const text_to_video_model: ModelSeriesSetting[] = [
    ...all_video_model.filter(model => model.tag?.includes("Text to Video")),
]
const image_to_video_model: ModelSeriesSetting[] = [
    ...all_video_model.filter(model => model.tag?.includes("Image to Video")),
]
const image_edit_model: ModelSeriesSetting[] = [
    ...all_image_model.filter(model => model.badge?.some(badge => badge.toLowerCase().includes("image edit"))),
]

export const all_models = [
    ...all_image_model,
    ...all_video_model,
]
const hot_model_id = [
    "gemini-2.5-flash-image-preview",
    "wan2-2-turbo-image2video",
    "flux-krea-dev",
    "flux-dev-kontext-image-edit",
    "qwen-image-edit","flux-dev-pulid"
]
const hot_series_model: ModelSeriesSetting[] = hot_model_id
    .map((modelId) => all_models.find((model) => model.id === modelId))
    .filter((model): model is ModelSeriesSetting => Boolean(model));


export const common_model_serise_setting: Record<string, ModelSeriesSetting[]> = {
    "hot": hot_series_model,
    "flux.1": flux_series_image_model,
    // "openai": openai_series_image_model,
    "google": google_series_image_model,
    "qwen": qwen_series_image_model,
    "character": character_series_image_model,
    "image tool": image_utils_series_model,
    "other": other_series_image_model,
    "image to video": image_to_video_model,
    "text to video": text_to_video_model,
    "avatar video": avatar_series_video_model,
};
export const func_model_serise_setting: Record<string, ModelSeriesSetting[]> = {
    "hot": hot_series_model,
    "text to image": text_to_image_model,
    "image to image": image_to_image_model,
    "image edit": image_edit_model,
    "character image": character_series_image_model,
    "text to video": text_to_video_model,
    "image to video": image_to_video_model,
    "avatar video (lipsync)": avatar_series_video_model,
};
export const func_video_model_serise_setting: Record<string, ModelSeriesSetting[]> = {

    "text to video": text_to_video_model,
    "image to video": image_to_video_model,
    "avatar video (lipsync)": avatar_series_video_model,
};
export const func_image_model_serise_setting: Record<string, ModelSeriesSetting[]> = {

    "text to image": text_to_image_model,
    "image to image": image_to_image_model,
    "character image": character_series_image_model,
};

export const image_edit_model_serise_setting: Record<string, ModelSeriesSetting[]> = {
    "image edit": image_edit_model
};

export const character_model_serise_setting: Record<string, ModelSeriesSetting[]> = {
    "character image": character_series_image_model,
    "avatar video": avatar_series_video_model,
};
export const character_image_molde_serise_setting: Record<string, ModelSeriesSetting[]> = {
    "character image": character_series_image_model,
};
