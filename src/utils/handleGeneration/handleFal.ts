




import { OnSubmitClientParams,} from "@/utils/handleGeneration/handleSwitch";
import { findApiPointByModelId, findLabelByModelId } from "@/lib/ai-model-setting/modelSetting";


import { handleFalGeneration as handleFalGeneration_client } from "@/server-action/ai-generation/falGen_client";

import { urlToBase64 } from '@/utils/tools/fileUrlProcess'


export const handleImageGeneration_fal = async ({
    userInputData,

    setIsGenerating,
    setGenerationStatus,
    setGenerationSrc,
    setRecentGenerations,
    handleCallBack,
    options = {}
}: OnSubmitClientParams) => {

    const { customApiKey, isClient } = options;

    // model endpoint support check
    const apiEndpoint = findApiPointByModelId(userInputData.model_id);
    if (!apiEndpoint) {
        throw new Error("Unsupported model, no endpoint");
    }

    try {
        // preprocess inputs
        const inputData = { ...userInputData };
        // request prediction
        const fal_webhook_url = "";
        let gen_result_data = null;

        setIsGenerating && setIsGenerating('update');
        const gen_result = await handleFalGeneration_client(inputData, "", customApiKey);

        if (gen_result?.error) {
            throw new Error(gen_result?.error || "Generation create failed");
        }
        // direct get result from client
        gen_result_data = gen_result.data;

        // console.log('gen_result_data', gen_result_data)

        if (gen_result_data) {

            if (gen_result_data?.has_nsfw_concepts) {
                if (Array.isArray(gen_result_data.has_nsfw_concepts) && gen_result_data.has_nsfw_concepts[0]) {
                    throw new Error("nsfw detected, please try another prompt");
                }
            }
            // Handle both data.images and data.image response formats

            let generated = [] as Array<{ url: string }>;


            if (gen_result_data.images) {
                generated = Array.isArray(gen_result_data.images) ? gen_result_data.images : [gen_result_data.images];
            } else if (gen_result_data.image) {
                generated = [gen_result_data.image];
            }
            if (!generated.length) {
                throw new Error("Empty generation result");
            }
            const dataMeta = {
                ...(() => {
                    const {
                        prompt,
                        prompt_process,
                        model_id,

                        aspect_ratio,
                        ...otherData } = userInputData;
                    return {
                        prompt,
                        prompt_process,
                        model_id,
                        model: findLabelByModelId(model_id),
                        aspect_ratio,
                        created_at: new Date().toISOString(),
                    };
                })(),
            };
            // if handleCallBack is provided, call it and ignore other default logic
            if (handleCallBack) {
                handleCallBack?.({ type: 'image', generationResult: generated });
                // return
            }
            // default save to tmp when use  handleCallBack , set setGenerationSrc null avoid duplicate add
            if (setGenerationSrc) {

                let displayImageObjects = generated.map((image: any) => ({
                    ...image,
                    generationUrl: image?.url,
                    input: dataMeta,
                    type: 'image',
                }));


                const blobPromises = displayImageObjects.map(async (imageObj: any, index: number) => {
                    try {
                        const base64 = await urlToBase64(imageObj.generationUrl);
                        if (base64 && base64.startsWith('data:')) {
                            return { ...imageObj, generationUrl: base64 };
                        }
                        return imageObj;
                    } catch (error) {
                        console.warn(`Failed to convert image ${index} to base64:`, error);
                        return imageObj;
                    }
                });


                const displayImages = await Promise.all(blobPromises);
      
                setGenerationSrc && setGenerationSrc({
                    data: displayImages,
                    isTmp: true,
                    type: 'images',
                });
            }
        } else {

            throw new Error(gen_result_data.error || 'unknown error');
        }


        // 处理生成的图像结果
    } catch (err: any) {
        console.error('Unexpected error:', err);
        setGenerationStatus && setGenerationStatus(err?.message || 'Unexpected error occurred');
    } finally {
        setIsGenerating && setIsGenerating(false);
    }
};


