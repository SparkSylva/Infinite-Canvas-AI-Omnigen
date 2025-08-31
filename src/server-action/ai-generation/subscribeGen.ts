'use server'
import { fal } from "@fal-ai/client";
import { ApiError } from '@fal-ai/client';
fal.config({
    credentials: process.env.FAL_KEY_MAIN, // or a function that returns a string
});


export const fal_get_prediction_status = async (
    prediction_id: string,
    apiEndpoint: string,
) => {

    try {
   
        const status = await fal.queue.status(apiEndpoint, { requestId: prediction_id, logs: true });
        if (status?.status !== "COMPLETED") {
   
            return { body: { status: "in_progress", data: null }, httpStatus: 200 };
        }

        const result = await fal.queue.result(apiEndpoint, { requestId: prediction_id });
        const resultWithData = result?.data as any;
   
        if (resultWithData) {
            // Check for either images array or result data
            if ((!resultWithData?.images || resultWithData?.images.length === 0) && (!resultWithData?.image && !resultWithData?.image?.url) &&
                !resultWithData?.results && (!resultWithData?.video || !resultWithData?.video?.url)) {
                return { body: { error: "No data generated", status: "failed" }, httpStatus: 501 };
            }
        }
        else if (resultWithData?.detail) {
       
            return { body: { error: resultWithData?.detail?.message || "No data generated", status: "failed" }, httpStatus: 502 };
        }

        return { body: { status: "succeeded", data: resultWithData }, httpStatus: 200 };

    } catch (error: any) {
      
        const isNetworkError =
            error instanceof TypeError && (
                error?.message?.includes('fetch failed') ||
                error?.message?.includes('network') ||
                error?.message?.includes('Failed to fetch') ||
              
                (error?.cause && typeof error?.cause === 'object' &&
                    // @ts-ignore - cause.message may exist
                    error?.cause?.message && error?.cause?.message?.includes('network'))
            );

        if (isNetworkError) {
            return {
                body: {
                    error: "Network error occurred",
                    status: "network_error",
                    retryable: true
                }, httpStatus: 503
            };
        }

        try {
            // Collect all available error messages
            const messages: string[] = [];

            // Handle detail message if it exists
            if (error instanceof ApiError || error?.body?.detail?.length > 0) {
                const error_type = error?.body?.detail[0].type
                const error_message = error?.body?.detail[0].msg
                messages.push(`api error: ${error?.status}; error_type: ${error_type}; error_message: ${error_message}`);
            }

            // Use combined messages or fallback
            const errorMessage = messages.length > 0
                ? messages.join(' | ')
                : 'Unknown error';
            console.error('final errorMessage', messages)
            return {
                body: {
                    error: errorMessage,
                    status: "error"
                },
                httpStatus: error?.status || 500
            };
        } catch (parseError) {
            // Final fallback
            return {
                body: {
                    error: 'Failed to fetch prediction status',
                    status: "error"
                },
                httpStatus: error?.status || 500
            };
        }
    }
};