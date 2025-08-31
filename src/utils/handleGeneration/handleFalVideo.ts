
import { findApiPointByModelId, findLabelByModelId } from "@/lib/ai-model-setting/modelSetting";

import { OnSubmitClientParams } from "@/utils/handleGeneration/handleSwitch";
import { urlToBase64 } from '@/utils/tools/fileUrlProcess';
import { handleFalGeneration as handleFalGeneration_client } from "@/server-action/ai-generation/falGen_client";


export const handleVideoGeneration_fal = async ({
    userInputData,
    setIsGenerating,
    setGenerationStatus,
    setGenerationSrc,
    handleCallBack,
    options = {}
}: OnSubmitClientParams) => {


    let predictionId: string | null = null;

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

        setIsGenerating && setIsGenerating('update');

        const gen_result = await handleFalGeneration_client(inputData, "", customApiKey);
        let gen_result_data = null;
  
        // direct get result from client
        if (gen_result?.error) {
            throw new Error(gen_result?.error || "Generation create failed");
        }
        gen_result_data = gen_result.data;

        // console.log('gen_result_data', gen_result_data);

        let generated = [] as Array<{ url: string }>;

        if (gen_result_data) {

            if (gen_result_data.videos) {
                generated = Array.isArray(gen_result_data.videos) ? gen_result_data.videos : [gen_result_data.videos];
            } else if (gen_result_data.video) {
                generated = [gen_result_data.video];
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

                        ...otherData } = userInputData;
                    return {
                        prompt,
                        prompt_process,
                        model_id,
                        model: findLabelByModelId(model_id),
                        created_at: new Date().toISOString(),
                    };
                })(),
            };

 
            // if handleCallBack is provided, call it and ignore other default logic
            if (handleCallBack) {
                handleCallBack?.({ type: 'video', generationResult: generated });
                // return
            }

            // default save to tmp when use  handleCallBack , set setGenerationSrc null avoid duplicate add
            if (setGenerationSrc) {

                const displayVideoObjects = generated.map((video) => {
                    return {
                        generationUrl: video?.url,
                        input: dataMeta,
                        type: 'video',
                    };
                });

                const displayVideoObjectsPromises = displayVideoObjects.map(async (video: any) => {
                    const objectBase64 = await urlToBase64(video?.generationUrl);
                    return {
                        ...video,
                        generationUrl: objectBase64 || video?.generationUrl,
                        url: video?.url,
                    };
                })

                const displayVideoBase64Objects = await Promise.all(displayVideoObjectsPromises);
                // setGenerationSrc to show to user interface
                setGenerationSrc && setGenerationSrc({
                    data: displayVideoBase64Objects,
                    isTmp: true,
                    type: 'videos'
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

