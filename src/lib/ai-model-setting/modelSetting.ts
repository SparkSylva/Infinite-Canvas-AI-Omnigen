import { ModelSeriesSetting, ApiInputSchema } from "./commonModel";
import { common_model_serise_setting } from "./commonModel";



function getAllMain(
    source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting
): ModelSeriesSetting[] {
    return Object.values(source).flat();
}

export function findSettingByModelId(
    model_id: string,
    source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting
): ModelSeriesSetting | undefined {
    if (!model_id) return undefined;
    return getAllMain(source).find(s => s.id === model_id);
}

export function findApiPointByModelId(
    model_id: string,
    source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting
): string {
    if (!model_id) return "";
    const setting = findSettingByModelId(model_id, source);
    return setting?.apiInput?.endpoint ?? "";
}

export function findModelsByTag(
    tagString: string,
    source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting
): ModelSeriesSetting[] {
    if (!tagString) return [];

    return getAllMain(source).filter(model =>
        model.tag && model.tag.some(tag =>
            tag.toLowerCase().includes(tagString.toLowerCase())
        )
    );
}
export function findfirstFreeModelId(source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting): string | undefined {
    return getAllMain(source).find(model =>
        model.badge && Array.isArray(model.badge) && model.badge.some(badge => badge.toLowerCase().includes('free to try'))
    )?.id;
}

/**
 * get the label of the model by modelId
 * @param modelId the modelId string
 * @param source the model setting data source, default is common_model_serise_setting
 * @returns if the model is found, return its label, otherwise return an empty string
 */
export function findLabelByModelId(
    modelId: string,
    source: Record<string, ModelSeriesSetting[]> = common_model_serise_setting
): string {
    if (!modelId) return "";
    const setting = findSettingByModelId(modelId, source);
    return setting?.label ?? "";
}

