"use client"

import { useState } from "react"
import { Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn-ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn-ui/select"
import type { ModelSeriesSetting } from "@/lib/ai-model-setting/commonModel"
import { common_model_serise_setting } from "@/lib/ai-model-setting/commonModel"
interface ModelCreditsSelectorProps {
    modelSettings?: Record<string, ModelSeriesSetting[]>
}

export function ModelCreditsSelector({ modelSettings = common_model_serise_setting }: ModelCreditsSelectorProps) {
    const categories = Object.keys(modelSettings)
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || "")

    const selectedModels = selectedCategory ? modelSettings[selectedCategory] : []

    const formatCategoryName = (category: string) => {
        return category
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
    }

    const getUnitLabel = (model: ModelSeriesSetting) => {
        if (model.type === "video") return "videos"
        if (model.type === "image") return "images"
        return "credits"
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Model Credits</h3>
                <p className="">Select a category to view model credit costs</p>
            </div>

            <div className="space-y-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full ">
                        <SelectValue placeholder="Select a model category" />
                    </SelectTrigger>
                    <SelectContent >
                        {categories.map((category) => (
                            <SelectItem key={category} value={category} className="">
                                {formatCategoryName(category)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {selectedCategory && selectedModels.length > 0 && (
                    <Card className="backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <div className="w-5 h-5 rounded-sm flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-sm"></div>
                                </div>
                                {formatCategoryName(selectedCategory)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-0 divide-y divide-gray-800">
                                {selectedModels.map((model) => (
                                    <div
                                        key={model.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-normal text-sm">{model.label}</h4>
                                        </div>
                                        <div className="flex items-center gap-2 text-right">
                                            <Zap className="w-5 h-5 text-[#facc15]" />
                                            <span className="font-medium ">{`${model.useCredits} credits`}</span>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {selectedCategory && selectedModels.length === 0 && (
                    <Card className="">
                        <CardContent className="p-6 text-center">
                            <p className="text-gray-400">No models found in this category</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
