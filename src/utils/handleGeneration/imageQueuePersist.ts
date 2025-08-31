"use client";

import { createGenerationStore, GenerationStatus } from "@/hooks/stores/user-generation";

export {
    handleGenerationStart,
    handleGenerationUpdate,
    handleGenerationComplete,
    canStartGeneration,
    getActiveGenerationsCount,
    getMaxConcurrentGenerations
}
 
/**
 * Checks if a new generation task can be started.
 * @param userSubscriptionLevel The user's subscription level.
 * @returns Whether a new task can be started.
 */
const canStartGeneration = (userSubscriptionLevel?: string): boolean => {
    const store = createGenerationStore.getState();
    return store.canStartNewGeneration(userSubscriptionLevel);
};

/**
 * Gets the number of currently active generation tasks.
 * @returns The number of active tasks.
 */
const getActiveGenerationsCount = (): number => {
    const store = createGenerationStore.getState();
    return store.getActiveTasksCount();
};

/**
 * Gets the maximum number of concurrent generations.
 * @param userSubscriptionLevel The user's subscription level.
 * @returns The maximum number of concurrent tasks.
 */
const getMaxConcurrentGenerations = (userSubscriptionLevel?: string): number => {
    const store = createGenerationStore.getState();
    return store.getMaxConcurrentTasks(userSubscriptionLevel);
};

/**
 * Starts a generation task - Stage 1: Pre-processing.
 * @param userInputData User input data.
 * @param setOngoingGenerations React state setter function (for UI display).
 * @param setGenerationDetails React state setter function (for UI display of details).
 * @param userSubscriptionLevel User's subscription level.
 * @param userId User's ID.
 * @returns The generation ID, or null if the concurrency limit is exceeded.
 */
const handleGenerationStart = (
    userInputData: any,
    setOngoingGenerations: any = null,
    setGenerationDetails: any = null,
    userSubscriptionLevel: string = 'free',
    userId: string = 'anonymous'

): string | null => {
    const store = createGenerationStore.getState();

    // Try to start a new generation task
    const generationId = store.startGeneration({
        prompt: userInputData?.prompt,
        model: userInputData?.model_id,
        type: userInputData?.type || 'image',
        userSubscriptionLevel: userSubscriptionLevel?.toLowerCase() || 'free',
        userId: userId || 'anonymous'
    });

    if (!generationId) {
        // Exceeded concurrency limit
        return null;
    }

    // Update UI state (for backward compatibility)
    if (setOngoingGenerations) {
        // const activeTasksCount = store.getActiveTasksCount();
        // const activeTasks = store.activeTasks || [];
        // const activeIds = activeTasks.map(task => task.id);
        // setOngoingGenerations(activeIds);
        setOngoingGenerations && setOngoingGenerations((prev: any) => [...prev, generationId]);

    }

    if (setGenerationDetails) {
        // const task = store.activeTasks?.find(t => t.id === generationId);
        // if (task) {
        // console.log('task userInputData', userInputData)
        // console.log('generationId', generationId)
        // console.log('prompt', userInputData.prompt)
        // console.log('model', userInputData.model_id)
  
        setGenerationDetails((prev: any) => ({
            ...prev,
            [generationId]: {
                prompt: userInputData.prompt?.substring(0, 50) + (userInputData.prompt && userInputData.prompt.length > 50 ? '...' : ''),
                model: userInputData.model_id,
            
            }
        }));
        // }
    }

    return generationId;
};

/**
 * Updates the generation task status - Stage 2: Generating.
 * @param generationId The generation task ID.
 * @param predictionId The API prediction ID.
 * @param additionalData Additional data.
 */
const handleGenerationUpdate = (
    generationId: string,
    predictionId: string,
    additionalData?: any
): void => {
    const store = createGenerationStore.getState();

    store.updateGenerationStatus(generationId, GenerationStatus.GENERATING, {
        predictionId,
        ...additionalData
    });
};

/**
 * Completes a generation task - Stage 3: Completed.
 * @param generationId The generation task ID.
 * @param setOngoingGenerations React state setter function (for UI display).
 * @param setGenerationDetails React state setter function (for UI display of details).
 * @param isSuccess Whether the task completed successfully.
 * @param errorMessage Error message (if failed).
 */
const handleGenerationComplete = (
    generationId: string,
    setOngoingGenerations?: any,
    setGenerationDetails?: any,
    isSuccess: boolean = true,
    errorMessage?: string
): void => {
    const store = createGenerationStore.getState();

    // If failed, first update the status to record the error message
    if (!isSuccess && errorMessage) {
        store.updateGenerationStatus(generationId, GenerationStatus.COMPLETED, {
            error: errorMessage,
            success: false
        });
    }

    // Complete the task (remove from the active list)
    store.completeGeneration(generationId);

    // Update UI state (for backward compatibility)
    // if (setOngoingGenerations) {
    //     const activeTasks = store.activeTasks || [];
    //     const activeIds = activeTasks.map(task => task.id);
    //     setOngoingGenerations(activeIds);

    // }
    setOngoingGenerations && setOngoingGenerations((prev: any) => {
        const updatedGenerations = prev.filter((id: any) => id !== generationId);
        return updatedGenerations;
    });

    if (setGenerationDetails) {
        setGenerationDetails((prev: any) => {
            const newDetails = { ...prev };
            delete newDetails[generationId];
            return newDetails;
        });
    }
};

