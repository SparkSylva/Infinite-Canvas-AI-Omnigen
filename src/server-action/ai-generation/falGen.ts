"use server";
import { fal } from "@fal-ai/client";

import { buildApiInput } from '@/utils/tools/mapping';

import { findSettingByModelId } from '@/lib/ai-model-setting/modelSetting';
import { ApiError } from '@fal-ai/client';

fal.config({
    credentials: process.env.FAL_KEY_MAIN || '', //customApiKey ||  or a function that returns a string , supoose only support temp api key
});
// fal server action version ,use env api key ,and use queen func
export const handleFalGeneration = async (data: any, webhook_url = '', customApiKey: string = '') => {
    // let fal_enpoint = 'fal-ai/flux/schnell'

    const { model_id } = data;


    // model support check
    const setting = findSettingByModelId(model_id);

    if (!setting?.apiInput || !setting?.apiInput?.endpoint) {
        return { success: false, data: null, error: "Unsupported model, no endpoint" }
    }

    const api_endpoint = setting?.apiInput?.endpoint;
    console.log('api_endpoint', api_endpoint)
    // build api input
    const input = buildApiInput(setting.apiInput, data)

    const submit_setting: any = { input };

    if (webhook_url) {
        submit_setting.webhookUrl = `${webhook_url}?model_id=${model_id}`;
    }
    try {
        const { request_id } = await fal.queue.submit(api_endpoint, submit_setting);
        // console.debug(request_id);
        return { success: true, data: request_id, error: null }
    } catch (error: any) {
        console.error("handleGeneration error:", error);
        if (error instanceof ApiError) {
            console.error("ApiError error body:", error?.body);
            console.error("ApiError status:", error?.status);
            return { success: false, data: null, error: `api error: ${error?.status} ${error?.body?.detail}` }
        }
        else {
            return { success: false, data: null, error: error?.message || "Unexpected api error occurred, please check your api key" }
        }
    }
}

