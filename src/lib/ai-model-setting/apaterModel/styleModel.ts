export type AdapterModelSeriesSetting = {
    id: string
    model?: {
        path: string;
        scale?: number;
    }[];
    name: string;
    image?: string[] // show image in the model setting
    description?: string;
    prompt?: string;
    badge?: string | string[];
    tag?: string[];
};


export const kontext_lora_adapter_model: Record<string, AdapterModelSeriesSetting[]> = {
    "Kontext": [
        {
            id: "ilkerzgi/overlay",
            model: [
                {
                    path: "https://huggingface.co/ilkerzgi/Overlay-Kontext-Dev-LoRA/blob/main/WVVtJFD90b8SsU6EzeGkO_adapter_model_comfy_converted.safetensors",
                    scale: 1.0
                }
            ],
            name: 'Image Overlay',
            prompt: "Place it",
            description: "Use this style model to overlay the image, keyword: Place it",
            image: ['https://huggingface.co/ilkerzgi/Overlay-Kontext-Dev-LoRA/resolve/main/in1.png']
        },
        {
            id: "gokaygokay/fuseit",
            name: "Fuse It",
            image: ["https://huggingface.co/gokaygokay/Fuse-it-Kontext-Dev-LoRA/resolve/main/outputs/3.png"],
            prompt: "Fuse this image into background",
            model: [
                {
                    path: "https://huggingface.co/gokaygokay/Fuse-it-Kontext-Dev-LoRA/blob/main/O93-UdItaNx8JzLYgnf2h_adapter_model_comfy_converted.safetensors",
                    scale: 1.0
                }
            ],
        },

        {
            id: "fofr/kontext-make-person-real",
            name: "Make this person real",
            image: ["https://replicate.delivery/xezq/wMTqaxZUaW5JBp4UGI8c0UOMdbIHuefI1D5iIYlGhlVz6cCVA/output.png"],
            prompt: "make this person look real",
            model: [
                {
                    path: "https://huggingface.co/fofr/kontext-make-person-real/blob/main/flux-kontext-make-person-real-lora.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "peteromallet/Flux-Kontext-InScene",
            name: "In Scene",
            image: ["https://huggingface.co/peteromallet/Flux-Kontext-InScene/resolve/main/samples.png"],
            prompt: "In Scene",
            description: "Generate images that maintain scene consistency. The primary use case is to generate variations of a shot while keeping the background and overall environment, characters, and styles the same",
            model: [
                {
                    path: "https://huggingface.co/peteromallet/Flux-Kontext-InScene/blob/main/InScene-v1.0.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "kontext-community/relighting-kontext-dev-lora-v3",
            name: "relighting v3",
            image: [""],
            prompt: "",
            description:"For relighting image",
            model: [
                {
                    path: "https://huggingface.co/kontext-community/relighting-kontext-dev-lora-v3/blob/main/relighting-kontext-dev-lora-v3.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "starsfriday/Kontext-Remover-General-LoRA",
            name: "Remover General",
            image: ["https://huggingface.co/starsfriday/Kontext-Remover-General-LoRA/resolve/main/results/1.png"],
            prompt: "",
            description:"For removing objects from the image",
            model: [
                {
                    path: "https://huggingface.co/starsfriday/Kontext-Remover-General-LoRA/blob/main/kontext_remove.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "gokaygokay/Light-Fix-Kontext-Dev-LoRA",
            name: "Light Fix",
            image: ["https://huggingface.co/gokaygokay/Light-Fix-Kontext-Dev-LoRA/resolve/main/outputs/2.png"],
            prompt: "Fuse this image into background",
            description:"For fixing the lighting of the image when place some object on image",
            model: [
                {
                    path: "https://huggingface.co/gokaygokay/Light-Fix-Kontext-Dev-LoRA/blob/main/oRdQNr1St3rF_DNI7miGM_adapter_model_comfy_converted.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "X-HighVoltage-X/Flux-Kontext-Makeup-remover",
            name: "Makeup remover",
            image: ["https://huggingface.co/X-HighVoltage-X/Flux-Kontext-Makeup-remover/resolve/main/images/ComfyUI_00001_.jpeg"],
            prompt: "Remove the makeup from the people",
            description:"For removing the makeup from the image",
            model: [
                {
                    path: "https://huggingface.co/X-HighVoltage-X/Flux-Kontext-Makeup-remover/blob/main/Kontext_remove_v1.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "xuminglong/kontext-tryon",
            name: "Try on",
            image: [],
            prompt: "Dress the figure in the right image in the clothes from the left image.",
            description:"Let the right people try on the clothes on the left",
            model: [
                {
                    path: "https://huggingface.co/xuminglong/kontext-tryon/blob/main/mytryon4_comfy.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "ilkerzgi/Tattoo-Kontext-Dev-Lora",
            name: "Tattoo place",
            image: ["https://huggingface.co/ilkerzgi/Tattoo-Kontext-Dev-Lora/resolve/main/out1.png"],
            prompt: "place this tattoo on forearm",
            description:"Place tattoo designs realistically on human bodies with natural integration and accurate positioning.",
            model: [
                {
                    path: "https://huggingface.co/ilkerzgi/Tattoo-Kontext-Dev-Lora/blob/main/tattoo-kontext-dev-lora-ilkerigz.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "starsfriday/Kontext-Emoji-LoRA",
            name: "Emoji filter",
            image: ["https://huggingface.co/starsfriday/Kontext-Emoji-LoRA/resolve/main/samples/result1.png"],
            prompt: "Turn this image into the emoji style of Apple iOS system",
            description:"",
            model: [
                {
                    path: "https://huggingface.co/starsfriday/Kontext-Emoji-LoRA/blob/main/kontext_emoji.safetensors",
                    scale: 1.0
                }
            ],
        },
        {
            id: "ilkerzgi/glittering-portrait-dark-shadow",
            name: "Glittering Portrait with dark shadows",
            image: ["https://huggingface.co/ilkerzgi/Glittering-Portrait-Kontext-Dev-Lora/resolve/main/out1.jpeg"],
            prompt: "Glittering Portrait with dark shadows",
            model: [
                {
                    path: "https://huggingface.co/ilkerzgi/Glittering-Portrait-Kontext-Dev-Lora/blob/main/Glittering-Portrait-Kontext-Dev-Lora.safetensors",
                    scale: 1.0
                }
            ],
        },

        // {
        //     id: "",
        //     name: "",
        //     image: [""],
        //     prompt: "",
        //     description:"",
        //     model: [
        //         {
        //             path: "",
        //             scale: 1.0
        //         }
        //     ],
        // },
    ],
}
export const pro_pro_kontext_lora_adapter_model: Record<string, AdapterModelSeriesSetting[]> = {
    "Image Edit": [
        {
            id: "overlay-pro",

            model: [
                {
                    path: "https://huggingface.co/ilkerzgi/Overlay-Kontext-Dev-LoRA/blob/main/WVVtJFD90b8SsU6EzeGkO_adapter_model_comfy_converted.safetensors",
                    scale: 1.0
                }
            ],
            name: 'Image Overlay',
            prompt: "Overlay the image with the style of the image",
            description: "Use this style model to overlay the image",
            image: ['https://huggingface.co/ilkerzgi/Overlay-Kontext-Dev-LoRA/resolve/main/in1.png']
        },
        {
            id: "overlay-2",

            name: 'Image Overlay',
            prompt: "Overlay the image with the style of the image",
            description: "Use this style model to overlay the image",

        },

    ],
}