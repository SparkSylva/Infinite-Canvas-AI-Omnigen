import { common_model_serise_setting } from "@/lib/ai-model-setting/commonModel";
import { z } from "zod";


const fileSchema = z.custom<File | Blob | string>((value) => {
    //null or undefined is ok
    if (value === undefined || value === null) {
        return true;
    }
    // File or Blob or string
    return value instanceof File || value instanceof Blob || typeof value === "string";
}, {
    message: "Expected a file, a blob, or a string",
});


export const GenerationBaseSchema = z.object({
    model_id: z.string().min(1, 'Model name is required'),
    prompt: z.string().max(1500, 'Prompt cannot exceed 1500 characters').optional(),
    prompt_process: z.string().optional(),
    seed: z.number().optional().default(0),
    randomize_seed: z.boolean().optional().default(true),
    aspect_ratio: z.string().min(1).default("1:1"),
    // control image
    control_images: z.array(fileSchema)
        .default([])
        .optional()
        .describe("Multiple control images"),
    control_images_2: z.array(fileSchema)
        .default([])
        .optional()
        .describe("Multiple end control images"),
    control_files: z.array(fileSchema)
        .default([])
        .optional()
        .describe("Multiple control videos"),
    control_files_2: z.array(fileSchema)
        .default([])
        .optional()
        .describe("Multiple end control videos"),

    disable_safety_checker: z.boolean().optional().default(false),
    enable_safety_checker: z.boolean().optional().default(false),
    output_format: z.string().min(1, 'Output format is required').default("jpg").describe("Format of the output images"),
    // num_outputs: z.number().int().ranmin(1, 'Value must be between 1 and 4').max(4, 'Value must be between 1 and 4').default(1),
    num_outputs: z.preprocess(
        (val) => {
            if (typeof val === "string" && val.trim() !== "") {
                return parseInt(val, 10);
            }
            return val; // 保持原样交给 z.number() 处理
        },
        z.number()
            .int()
            .min(1, "Value must be between 1 and 4")
            .max(4, "Value must be between 1 and 4")
            .default(1)
    ),
    meta_data: z.record(z.any()).optional(),

    // image

    width: z.number()
        .int()
        .min(256, { message: "Width cannot be less than 256 pixels" })
        .max(1536, { message: "Width cannot exceed 1536 pixels" })
        .default(1024)
        .optional()
        .describe("Width of the generated image (256-1536 pixels)"),
    height: z.number()
        .int()
        .min(256, { message: "Height cannot be less than 256 pixels" })
        .max(1536, { message: "Height cannot exceed 1536 pixels" })
        .default(1024)
        .optional(),


    // video

    duration: z.preprocess(
        (val) => {
            if (typeof val === "number") {
                return String(val);
            }
            return val;
        },
        z.string().default("5").optional().describe("Duration of the video, in seconds")
    ),

    resolution: z.string().min(1, 'Resolution is required').default('480p').optional(),


    generation_type: z.string().default('image').optional(),

    // user setting
    // custom_api_key: z.string().optional().describe("Custom API key"),
})



export const DynamicCommonSchema = GenerationBaseSchema.superRefine((data, ctx) => {

    const modelConfig = Object.values(common_model_serise_setting)
        .flat()
        .find(m => m.id === data.model_id);

    // promptIgnore default is false
    if (!modelConfig?.promptIgnore && !data.prompt?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Prompt is required",
            path: ["prompt"],
        });
    }


    // Prefer new generic support settings
    if (Array.isArray(modelConfig?.supportAddFiles)) {
        for (const support of modelConfig!.supportAddFiles!) {
            if (support.isRequired && support.isSupport > 0) {
                const fieldName = support.name as keyof typeof data;
                const value = (data as any)[fieldName] as unknown[] | undefined;
                if (!Array.isArray(value) || value.length <= 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Please upload at least one ${support.type} for ${support.label}`,
                        path: [support.name],
                    });
                }
            }
        }
    }
});


