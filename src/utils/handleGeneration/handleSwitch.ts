'use client'



import { handleVideoGeneration_fal } from '@/utils/handleGeneration/handleFalVideo';
import { handleImageGeneration_fal } from '@/utils/handleGeneration/handleFal';

import { findSettingByModelId } from "@/lib/ai-model-setting/modelSetting";



export interface OnSubmitClientParams {
    userInputData: any;
    setIsGenerating: (value: any, meta?: any) => void | null;
    setGenerationStatus?: React.Dispatch<React.SetStateAction<string>> | null;
    setGenerationSrc: any;
    setRecentGenerations?: any;
    handleCallBack?: (data: any) => void;
    options?: {
        [key: string]: any;
    }
}

export const handleGeneration_switch = async (
    handle_input: OnSubmitClientParams
) => {

    // console.log('handle_input', handle_input)
    const {
        options
    } = handle_input

 

    // you can add other func here


    await handleGeneration_switch_model(handle_input)




}


export const handleGeneration_switch_model = async (
    handle_input: OnSubmitClientParams
) => {
    let prediction_object: any

    const { userInputData, setGenerationStatus, setIsGenerating, options } = handle_input

    try {
        if (options?.isClient && !options?.customApiKey) {
            throw new Error("No custom api key provided");
        }

        const gen_model_id = userInputData.model_id?.toLowerCase() || '';

        // model support check
        const setting = findSettingByModelId(gen_model_id);
        const apiEndpoint = setting?.apiInput?.endpoint;

        const gen_type = setting?.type?.toLowerCase() || '';
        const gen_model_provider = setting?.apiInput?.provider.toLowerCase() || ''
        if (!apiEndpoint && gen_model_provider == "fal") {
            throw new Error("Unsupported model, no endpoint");
        };

        if (!gen_type || !gen_model_provider) {
            throw new Error("Unsupported model, no type or provider");
        }


        switch (gen_model_provider) {
            case "fal":
                prediction_object = gen_type === "image" ?
                    await handleImageGeneration_fal(handle_input) :
                    await handleVideoGeneration_fal(handle_input)
                break;

            // add other model provider here replicate , huggingface , kling , runway , openai , etc

            default:
                throw new Error(`Unsupported model provider for: ${gen_model_provider}`);
        }

    } catch (error: any) {
        setGenerationStatus && setGenerationStatus(error.message || "Unexpected error occurred");
        setIsGenerating && setIsGenerating(false);

    }

}


