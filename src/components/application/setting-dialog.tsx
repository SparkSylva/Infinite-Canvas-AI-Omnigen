"use client"

import React, { useEffect, useMemo, useRef, useState, } from 'react';
import {
  Settings,
  Video,
  Image,
  Sparkles,
  CheckIcon,
  WandSparkles,
  Zap, PlusCircle, Trash2,
  Menu
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn-ui//breadcrumb"
import { Input, Badge, Button, Label, Textarea, } from "@/components/ui/"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn-ui//select"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/shadcn-ui//card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn-ui//dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/shadcn-ui//sidebar"
import { ModelSeriesSetting } from "@/lib/ai-model-setting/commonModel"
import { AdapterModelSeriesSetting } from "@/lib/ai-model-setting/apaterModel/styleModel"

import { useUserSettingStore } from "@/hooks/stores/user-setting"; // 新增：持久化
import { toast } from "sonner";
import { shallow } from "zustand/shallow";
//
import { StylePreset } from '@/lib/ai-model-setting/commonPrompt';
// Interface for model settings
// interface ModelSeriesSetting {
//   value: string;
//   label: string;
//   description: string;
//   badge?: string | string[];
//   supportedAspectRatios?: string[];
//   customParameters?: any[];
//   isSupportImageRef?: number;
//   isRequiredImageRef?: boolean;
//   isSupportEndImageRef?: number;
// }

interface ModelSettingsDialogProps {
  modelSeries: Record<string, ModelSeriesSetting[]>;
  onModelSelect: (modelSetting: ModelSeriesSetting) => void;
  currentModel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerText?: string;
}

// Get icon for model category
const getModelCategoryIcon = (category: string) => {
  if (category.includes('video')) {
    return Video;
  } else if (category.includes('image')) {
    return Image;
  } else {
    return Sparkles;
  }
};

export function ModelSettingsDialog({
  modelSeries,
  onModelSelect,
  currentModel,
  open,
  onOpenChange,
  triggerText = "Choose Settings"
}: ModelSettingsDialogProps) {

  const [selectedCategory, setSelectedCategory] = React.useState<string>("")

  // Use controlled or uncontrolled state
  const [internalDialogOpen, setInternalDialogOpen] = React.useState(false)
  // Determine if we're using controlled or uncontrolled state
  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : internalDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setInternalDialogOpen

  // Initialize selected category
  React.useEffect(() => {
    if (Object.keys(modelSeries).length > 0 && !selectedCategory) {
      setSelectedCategory(Object.keys(modelSeries)[0])
    }
  }, [modelSeries, selectedCategory])

  const modelCategories = React.useMemo(() => {
    const keys = Object.keys(modelSeries || {})
    return keys.map((category) => ({
      name: category,
      icon: getModelCategoryIcon(category),
      displayName: category
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" "),
    }))
  }, [modelSeries])

  React.useEffect(() => {
    if (!modelCategories.length) {
      if (selectedCategory) setSelectedCategory("")
      return
    }
    if (!selectedCategory || !(selectedCategory in modelSeries)) {
      setSelectedCategory(modelCategories[0]?.name ?? "")
    }
  }, [modelCategories, modelSeries, selectedCategory])

  // 扁平列表（稳定，用于 currentModel 查找）
  const flatModels = React.useMemo(
    () => Object.values(modelSeries || {}).flat(),
    [modelSeries]
  )

  // 当前选择的模型对象（用于触发按钮处的小徽标）
  const currentModelObj = React.useMemo(() => {
    if (!currentModel) return undefined
    return flatModels.find((m) => m.id === currentModel)
  }, [flatModels, currentModel])

  // 点击选择模型
  const handleModelClick = React.useCallback(
    (model: ModelSeriesSetting) => {
      onModelSelect(model)
      // 不自动关闭，保持原交互：让用户可以继续看/切换
      // 如需选择后自动关闭可在此处 setDialogOpen(false)
      // 注意：如果使用受控模式，这里应该调用传入的 onOpenChange(false)
    },
    [onModelSelect]
  )
  // 当前分类下的模型列表
  const list = React.useMemo<ModelSeriesSetting[]>(
    () => (selectedCategory ? modelSeries[selectedCategory] ?? [] : []),
    [modelSeries, selectedCategory]
  )

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <div className='flex flex-row gap-1 items-center hover:bg-foreground/10 rounded-md p-2 cursor-pointer border border-foreground'>
          <Menu className="h-4 w-4" />
          {currentModelObj && (
            <Badge className="ml-1 text-xs" variant="outline">
              {currentModelObj?.tag?.join(", ") || currentModel}
            </Badge>
          )}
          {currentModelObj && (
            <Badge className="ml-1 text-xs">
              {currentModelObj?.label || currentModel}
            </Badge>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[90vw] md:max-w-[65vw] max-h-[50vh] md:max-h-[80vh] overflow-y-auto w-full">
        <DialogTitle className="sr-only">Model Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Choose the model you want to use
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-auto min-w-[150px]">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className=''>
                    {modelCategories.map((category) => (
                      <SidebarMenuItem key={category.name}>
                        <SidebarMenuButton
                          onClick={() => setSelectedCategory(category.name)}
                          isActive={selectedCategory === category.name}
                          className="cursor-pointer h-12"
                        >
                          <category.icon className="h-4 w-4" />
                          <span className="capitalize">{category.displayName}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div className="flex flex-1 flex-col overflow-y-auto relative w-full">
            <header className="flex h-16 hidden md:block shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Model Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="capitalize">
                        {selectedCategory
                          .split(" ")
                          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
                          .join(" ")}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            {/* Mobile 分类选择 */}
            <div className="md:hidden pb-4 z-10">
              <div className="flex flex-wrap gap-2 ">
                {modelCategories.map((category) => (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex-shrink-0 gap-1"
                  >
                    <category.icon className="h-3 w-3" />
                    <span className="text-xs capitalize">{category.displayName}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 llg:grid-cols-5 gap-2">
                {list.length > 0 ? (
                  list.map((model) => {
                    const isSelected = currentModel === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`relative rounded-lg cursor-pointer transition-all hover:scale-102 ${
                          isSelected
                            ? "border-primary ring-4 ring-primary/40 shadow-xl shadow-primary/30 bg-primary/5"
                            : "border-border hover:border-primary/60 hover:shadow-md hover:bg-accent/50"
                        }`}
                        onClick={() => handleModelClick(model)}
                      >
                        <Card className={`border-0 h-full relative ${isSelected ? "bg-primary/10" : ""}`}>
                          <CardHeader className="flex flex-wrap gap-1 items-center justify-between">
                            <CardTitle className={`capitalize ${isSelected ? "text-primary" : ""}`}>{model.label}</CardTitle>
                            <div className='flex flex-wrap gap-1'>
                              {model?.useCredits && (
                                <Badge variant="outline" className="text-xs flex-shrink-0 capitalize">
                                  {model?.useCredits}
                                  <Zap className='ml-1 h-4 text-[#facc15]' />
                                </Badge>
                              )}
                            </div>
                          </CardHeader>

                          <CardContent className="flex flex-wrap gap-1 items-end">
                            <CardDescription className="hidden md:block">
                              {model.description.length > 50 ? model.description.slice(0, 50) + "..." : model.description}
                            </CardDescription>


                          </CardContent>
                          <CardFooter className="flex flex-wrap gap-1 items-end">
                            {Array.isArray(model?.tag) &&
                              model.tag.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={isSelected ? "default" : "secondary"}
                                  className={`text-xs flex-shrink-0 capitalize ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            {Array.isArray(model?.badge) &&
                              model.badge.map((badge) => (
                                <Badge
                                  key={badge}
                                  variant="outline"
                                  className="text-xs flex-shrink-0 capitalize hidden md:block"
                                >
                                  {badge}
                                </Badge>
                              ))}



                          </CardFooter>
                          {/* // test */}
                          {/* <div className='flex flex-wrap gap-1 px-4'>
                            {
                              model?.apiInput?.rules?.map((rule) => (
                                <Badge key={rule.to} variant="outline" className="text-xs flex-shrink-0 capitalize">
                                  {rule.to}
                                </Badge>
                              ))
                            }
                          </div>
                          <div className='flex flex-wrap gap-1 px-4'>
                            {
                              model?.apiInput?.endpoint &&
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {`${model?.apiInput?.provider} api point: ${model?.apiInput?.endpoint}`}
                              </Badge>

                            }
                          </div> */}
                        </Card>

                        {/* 未选中状态的 overlay */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-background/20 rounded-lg pointer-events-none transition-opacity duration-200" />
                        )}

                        {/* 选中状态对勾 */}
                        {isSelected && (
                          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg shadow-primary/50 z-10 animate-in zoom-in-95 duration-200">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No available models in this category
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </DialogContent>

    </Dialog>
  )
}


interface AdapterModelSettingsDialogProps {
  modelSeries: Record<string, AdapterModelSeriesSetting[]>;
  onModelSelect: (modelSetting: AdapterModelSeriesSetting) => void;
  currentModel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerText?: string;
  supportCustonModel?: SupportCustonModelOptions;   // 修改：从 boolean 改为对象
}
interface SupportCustonModelOptions {               // 新增：对象参数
  supportedBases: string;                         // 必填：支持的基座/适配器名称（如 "sdxl", "flux", "kling" 等）
  storageKey?: string;                              // 可选：自定义存储 key（默认自动生成）
}


export function AdapterModelSettingsDialog({
  modelSeries,
  onModelSelect,
  currentModel = "",
  open,
  onOpenChange,
  triggerText = "Choose Settings",
  supportCustonModel,                               // 修改：对象
}: AdapterModelSettingsDialogProps) {
  /* ----------------------- state ----------------------- */
  const [selectedCategory, setSelectedCategory] = React.useState<string>("");

  // Use controlled or uncontrolled state
  const [internalDialogOpen, setInternalDialogOpen] = React.useState(false)
  // Determine if we're using controlled or uncontrolled state
  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : internalDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setInternalDialogOpen

  // ====== 自定义模型持久化配置（新增）======
  const enabledCustom = Boolean(supportCustonModel?.supportedBases?.length);
  const autoStorageKey =
    "adapter.customModels:" + (supportCustonModel?.supportedBases || "default");
  const STORAGE_KEY = supportCustonModel?.storageKey ?? autoStorageKey;
  const EMPTY_CUSTOM_MODELS: ReadonlyArray<AdapterModelSeriesSetting> = Object.freeze([]);

  // 订阅持久化里的自定义模型数组
  const savedCustomModels = useUserSettingStore(
    React.useCallback(
      (s) =>
        (s.persistentSettings[STORAGE_KEY]?.value as AdapterModelSeriesSetting[] | undefined)
        ?? (EMPTY_CUSTOM_MODELS as AdapterModelSeriesSetting[]),
      [STORAGE_KEY]
    ),
    // 用任一即可：
    // Object.is

  );

  // 写持久化的帮助函数
  const saveCustomModels = React.useCallback(
    (arr: AdapterModelSeriesSetting[]) => {
      useUserSettingStore.getState().setSetting(STORAGE_KEY, arr as any, { persistent: true });
    },
    [STORAGE_KEY]
  );

  // 本地态（用于即时编辑/新增），初始用 saved 值
  const [customModels, setCustomModels] = React.useState<AdapterModelSeriesSetting[]>(
    savedCustomModels
  );

  // 持久化 -> 本地态 同步（当别处修改时）
  React.useEffect(() => {
    setCustomModels(savedCustomModels);
  }, [savedCustomModels]);

  // 表单状态（新增）
  const [newName, setNewName] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newScale, setNewScale] = React.useState<string>("1");
  const [newBase, setNewBase] = React.useState<string>("");
  const [checkAddModelRequire, setCheckAddModelRequire] = React.useState<string>("");

  // 初始化选中分类
  React.useEffect(() => {
    if (Object.keys(modelSeries).length > 0 && !selectedCategory) {
      setSelectedCategory(Object.keys(modelSeries)[0]);
    }
  }, [modelSeries, selectedCategory]);

  const modelCategories = React.useMemo(() => {
    const keys = Object.keys(modelSeries || {});
    const base = keys.map((category) => ({
      name: category,
      icon: getModelCategoryIcon(category),
      displayName: category
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" "),
    }));
    if (enabledCustom) {
      base.push({ name: "custom", icon: PlusCircle, displayName: "Custom" });
    }
    return base;
  }, [modelSeries, enabledCustom]);

  React.useEffect(() => {
    const names = new Set(modelCategories.map((c) => c.name));

    // no category
    if (names.size === 0) {
      if (selectedCategory !== "") setSelectedCategory("");
      return;
    }

    // the selected category is valid
    if (names.has(selectedCategory)) return;


    // no valid category, fallback to the first category
    const fallback = modelCategories[0]?.name ?? "";


    if (fallback !== selectedCategory) setSelectedCategory(fallback);
  }, [modelCategories, selectedCategory]);

  const flatModels = React.useMemo(
    () => Object.values(modelSeries || {}).flat().concat(customModels),
    [modelSeries, customModels]
  );

  const currentModelObj = React.useMemo(() => {
    if (!currentModel) return undefined;
    return flatModels.find((m) => m.id === currentModel);
  }, [flatModels, currentModel]);

  const handleModelClick = React.useCallback(
    (model: AdapterModelSeriesSetting) => {
      onModelSelect(model);
    },
    [onModelSelect]
  );

  const list = React.useMemo<AdapterModelSeriesSetting[]>(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === "custom") return customModels;
    return modelSeries[selectedCategory] ?? [];
  }, [modelSeries, selectedCategory, customModels]);

  // ---------- custom model logic ----------
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const genUniqueCustomId = (base: string, name: string) => {
    const root = `custom-${base}-${slugify(name) || "model"}`;
    let cand = root;
    let i = 2;
    const exists = (id: string) =>
      flatModels.some((m) => m.id === id) || customModels.some((m) => m.id === id);
    while (exists(cand)) cand = `${root}-${i++}`;
    return cand;
  };

  const handleAddCustomModel = () => {
    const name = newName.trim();
    const url = newUrl.trim();
    const desc = newDesc.trim();
    const base = newBase || supportCustonModel?.supportedBases?.[0] || "";
    const scaleNum = Number(newScale || "1");
    const scale = Number.isFinite(scaleNum) && scaleNum > 0 ? scaleNum : 1;

    if (!name) return setCheckAddModelRequire("Name is required");
    if (!url) return setCheckAddModelRequire("Model URL is required");
    if (!base) return setCheckAddModelRequire("Please choose a base");

    const id = genUniqueCustomId(base, name);

    const newModel: AdapterModelSeriesSetting = {
      id,
      name,
      description: desc || undefined,
      model: [{ path: url, scale }],
      tag: ["custom", `base:${base}`],   // 用 tag 标识基座，避免改类型
      badge: ["custom"],
      image: [],
    };

    const next = [newModel, ...customModels];
    setCustomModels(next);
    saveCustomModels(next);              // 持久化
    onModelSelect(newModel);
    toast.success(`Added: ${name}`);

    if (enabledCustom) setSelectedCategory("custom");
    setNewName("");
    setNewUrl("");
    setNewDesc("");
    setNewScale("1");
    setNewBase("");
  };

  const handleRemoveCustomModel = (id: string) => {
    const next = customModels.filter((m) => m.id !== id);
    setCustomModels(next);
    saveCustomModels(next);              // 持久化
    toast.success("Deleted");
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" type="button" className="rounded-lg ">
          <WandSparkles className="h-4 w-4" />
          <span className="text-xs">{triggerText || "Style"}</span>
          {currentModelObj && (
            <Badge className="ml-1 text-xs capitalize">
              {currentModelObj.name ?? currentModel}
            </Badge>
          )}
        </Button>
      </DialogTrigger>


      <DialogContent className="max-w-[90vw] md:max-w-[65vw] max-h-[50vh] md:max-h-[80vh] overflow-y-auto w-full">
        <DialogTitle className="sr-only">Model Settings</DialogTitle>
        <DialogDescription className="sr-only">Choose the model you want to use</DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-auto min-w-[150px]">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {modelCategories.map((category) => (
                      <SidebarMenuItem key={category.name}>
                        <SidebarMenuButton
                          onClick={() => setSelectedCategory(category.name)}
                          isActive={selectedCategory === category.name}
                          className="cursor-pointer h-12"
                        >
                          <category.icon className="h-4 w-4" />
                          <span className="capitalize">{category.displayName}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div className="flex flex-1 flex-col overflow-y-auto relative w-full">
            <header className="flex h-16 hidden md:block shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink >Model Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="capitalize">
                        {selectedCategory
                          .split(" ")
                          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
                          .join(" ")}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-1">
              {/* 新增：自定义模型表单 */}
              {enabledCustom && selectedCategory === "custom" && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Add Custom Model</CardTitle>
                    {/* <CardDescription>
                        Name*, Model URL*, Base*, Scale defaults to 1
                      </CardDescription> */}
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name *</Label>
                      <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Custom Model" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs">Model URL (path) *</Label>
                      <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://... or /path/to/model" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Base *</Label>
                      <span>{supportCustonModel?.supportedBases}</span>

                    </div>
                    {/* <div className="space-y-1">
                        <Label className="text-xs">Scale</Label>
                        <Input value={newScale} onChange={(e) => setNewScale(e.target.value)} placeholder="1" inputMode="decimal" />
                      </div> */}
                    <div className="space-y-1 md:col-span-4">
                      <Label className="text-xs">Description</Label>
                      <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" onClick={handleAddCustomModel} className="w-full md:w-auto">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Model
                      </Button>

                    </div>
                  </CardContent>
                  {checkAddModelRequire && (
                    <p className="text-red-500 text-xs text-center">{checkAddModelRequire}</p>
                  )}
                </Card>
              )}

              {/* 卡片列表 */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 llg:grid-cols-5 gap-2">
                {list.length > 0 ? (
                  list.map((model) => {
                    const hasImage = Array.isArray(model?.image) && model.image.length > 0 && !!model.image[0];
                    const isCustom = selectedCategory === "custom";
                    const isSelected = currentModel === model.id;

                    return (
                      <div
                        key={model.id}
                        className={`relative rounded-lg cursor-pointer transition-all hover:scale-102 ${
                          isSelected
                            ? "border-primary ring-4 ring-primary/40 shadow-xl shadow-primary/30 bg-primary/5"
                            : "border-border hover:border-primary/60 hover:shadow-md hover:bg-accent/50"
                        }`}
                        onClick={() => handleModelClick(model)}
                      >
                        {hasImage && (
                          <>
                            <img src={model.image?.[0]} alt="" className="absolute inset-0 h-full w-full object-cover rounded-lg" loading="lazy" />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/70 via-black/40 to-black/70" />
                          </>
                        )}

                        <Card className={`border-0 h-full ${hasImage ? "bg-transparent" : ""} ${isSelected ? "bg-primary/10" : ""}`}>
                          <CardHeader className={`${hasImage ? "text-white" : ""}`}>
                            <CardTitle className={`capitalize ${hasImage ? "drop-shadow" : ""} ${isSelected ? "text-primary" : ""}`}>
                              {model.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-1 items-end">
                            <CardDescription className={`hidden md:block ${hasImage ? "drop-shadow text-white/90" : ""}`}>
                              {model?.description && model?.description?.length > 50 ? model?.description?.slice(0, 50) + "..." : model?.description}
                            </CardDescription>
                          </CardContent>
                          <CardFooter className="flex flex-wrap gap-1 items-end">
                            {Array.isArray(model?.tag) &&
                              model.tag.map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant={isSelected ? "default" : "secondary"} 
                                  className={`text-xs flex-shrink-0 capitalize ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            {Array.isArray(model?.badge) &&
                              (Array.isArray(model.badge) ? model.badge : [model.badge]).map((badge) => (
                                <Badge key={badge} variant="outline" className="text-xs flex-shrink-0 capitalize hidden md:block">
                                  {badge}
                                </Badge>
                              ))}
                          </CardFooter>
                        </Card>

                        {/* 未选中状态的 overlay */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-background/20 rounded-lg pointer-events-none transition-opacity duration-200" />
                        )}

                        {/* 选中对勾 */}
                        {isSelected && !isCustom && (
                          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg shadow-primary/50 z-10 animate-in zoom-in-95 duration-200">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        )}
                        {/* 自定义项的删除按钮（只在 custom 分类时显示） */}
                        {isCustom && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="absolute bottom-2 right-2"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomModel(model.id);
                            }}
                            aria-label="Delete custom model"
                            title="Delete custom model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No available models in this category
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarProvider>
      </DialogContent>

    </Dialog>
  );
}
interface SupportCustomPromptOptions {
  storageKey?: string; // 默认: "prompt.customPresets"
}
interface PromptSettingsDialogProps {
  modelSeries: Record<string, any[]>;
  onModelSelect: (modelSetting: any) => void;
  currentModel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerText?: string;
  supportCustomPrompt?: SupportCustomPromptOptions;
}


export function PromptSettingsDialog({
  modelSeries,
  onModelSelect,
  currentModel,
  open,
  onOpenChange,
  triggerText = "Prompt Library",
  supportCustomPrompt,
}: PromptSettingsDialogProps) {

  const [selectedCategory, setSelectedCategory] = React.useState<string>("")
  const [clickedPresetId, setClickedPresetId] = React.useState<string | null>(null)

  // Use controlled or uncontrolled state
  const [internalDialogOpen, setInternalDialogOpen] = React.useState(false)
  // Determine if we're using controlled or uncontrolled state
  const isControlled = open !== undefined && onOpenChange !== undefined
  const dialogOpen = isControlled ? open : internalDialogOpen
  const setDialogOpen = isControlled ? onOpenChange : setInternalDialogOpen

  // custom prompt logic
  // ===== 自定义 Prompt 持久化配置（新增） =====
  const enabledCustom = !!supportCustomPrompt?.storageKey; // 默认启用“自定义 Prompt”能力
  const STORAGE_KEY =
    supportCustomPrompt?.storageKey ?? "prompt.customPresets";
  const EMPTY_CUSTOM_PRESETS: ReadonlyArray<StylePreset> = Object.freeze([]);
  // 订阅持久化中的自定义 prompts
  const savedCustomPresets = useUserSettingStore(
    React.useCallback(
      (s) =>
        (s.persistentSettings[STORAGE_KEY]?.value as unknown as StylePreset[] | undefined) ??
        (EMPTY_CUSTOM_PRESETS as StylePreset[]),
      [STORAGE_KEY]
    )
  );

  // 写持久化
  const saveCustomPresets = React.useCallback(
    (arr: StylePreset[]) => {
      useUserSettingStore
        .getState()
        .setSetting(STORAGE_KEY, arr as any, { persistent: true });
    },
    [STORAGE_KEY]
  );

  // 本地态自定义 prompts
  const [customPresets, setCustomPresets] = React.useState<StylePreset[]>(
    savedCustomPresets
  );

  // 持久化 -> 本地态 同步（当别处修改时）
  React.useEffect(() => {
    setCustomPresets(savedCustomPresets);
  }, [savedCustomPresets]);





  // Initialize selected category
  React.useEffect(() => {
    if (Object.keys(modelSeries).length > 0 && !selectedCategory) {
      setSelectedCategory(Object.keys(modelSeries)[0])
    }
  }, [modelSeries, selectedCategory])

  // ---- 左侧分类（增加 Custom）----
  const modelCategories = React.useMemo(() => {
    const keys = Object.keys(modelSeries || {});
    const base = keys.map((category) => ({
      name: category,
      icon: getModelCategoryIcon(category),
      displayName: category
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" "),
    }));
    if (enabledCustom) {
      base.push({ name: "custom", icon: PlusCircle, displayName: "Custom" });
    }
    return base;
  }, [modelSeries, enabledCustom])




  React.useEffect(() => {
    if (!modelCategories.length) {
      if (selectedCategory) setSelectedCategory("");
      return;
    }
    const names = new Set(modelCategories.map((c) => c.name));
    if (names.has(selectedCategory)) return;
    const fallback = modelCategories[0]?.name ?? "";
    if (fallback !== selectedCategory) setSelectedCategory(fallback);
  }, [modelCategories, selectedCategory]);


  // ---- 工具：拿到“所有内置” presets（跨全部分类，用于去重/生成唯一 id）----
  const allBuiltinPresets = React.useMemo<StylePreset[]>(() => {
    const out: StylePreset[] = [];
    Object.values(modelSeries || {}).forEach((items: any[]) => {
      items?.forEach((item: any) => {
        if (Array.isArray(item?.preset)) out.push(...item.preset);
      });
    });
    return out;
  }, [modelSeries]);

  // 点击选择模型
  const handleModelClick = React.useCallback(
    (model: StylePreset) => {
      onModelSelect(model)
      setClickedPresetId(model.id)
      setTimeout(() => {
        setClickedPresetId(null)
      }, 1500)

    },
    [onModelSelect]
  )

  // ---- 当前分类下的 presets（支持 custom）----
  const displayPresets = React.useMemo<StylePreset[]>(() => {
    if (!selectedCategory) return [];
    if (selectedCategory === "custom") return customPresets;
    const categoryItems = modelSeries[selectedCategory] ?? [];
    const all: StylePreset[] = [];
    categoryItems.forEach((item: any) => {
      if (Array.isArray(item?.preset)) all.push(...item.preset);
    });
    return all;
  }, [selectedCategory, modelSeries, customPresets]);




  // 获取当前分类下的所有 preset
  const currentCategoryPresets = React.useMemo(() => {
    if (!selectedCategory || !modelSeries[selectedCategory]) return []

    const categoryItems = modelSeries[selectedCategory]
    const allPresets: StylePreset[] = []

    categoryItems.forEach((item: any) => {
      if (item.preset && Array.isArray(item.preset)) {
        allPresets.push(...item.preset)
      }
    })

    return allPresets
  }, [selectedCategory, modelSeries])


  // ---------- 自定义 Prompt 逻辑（新增） ----------
  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const genUniqueCustomId = (name: string) => {
    const root = `custom-${slugify(name) || "prompt"}`;
    let cand = root;
    let i = 2;
    const existingIds = new Set<string>([
      ...allBuiltinPresets.map((p) => p.id),
      ...customPresets.map((p) => p.id),
    ]);
    while (existingIds.has(cand)) cand = `${root}-${i++}`;
    return cand;
  };

  // 表单状态
  const [newName, setNewName] = React.useState("");
  const [newPrompt, setNewPrompt] = React.useState("");

  const [checkAddPromptRequire, setCheckAddPromptRequire] = React.useState("");

  const handleAddCustomPrompt = () => {
    const name = newName.trim();
    const prompt = newPrompt.trim();


    if (!name) return setCheckAddPromptRequire("Name is required");
    if (!prompt) return setCheckAddPromptRequire("Prompt is required");

    const id = genUniqueCustomId(name);
    const newPreset: StylePreset = {
      id,
      name,
      prompt,
    };

    const next = [newPreset, ...customPresets];
    setCustomPresets(next);
    saveCustomPresets(next);
    toast.success(`Added: ${name}`);

    // 切到 Custom 分类，方便看到新增
    if (enabledCustom) setSelectedCategory("custom");

    // 重置表单
    setNewName("");
    setNewPrompt("");
    setCheckAddPromptRequire("");
  };

  const handleRemoveCustomPrompt = (id: string) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    saveCustomPresets(next);
    toast.success("Deleted");
  };








  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" type="button" className="rounded-lg">
          <WandSparkles className="h-4 w-4" />

          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[90vw] md:max-w-[65vw] max-h-[50vh] md:max-h-[80vh] overflow-y-auto w-full">
        <DialogTitle className="sr-only">Prompt Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Choose the Prompt you want to use
        </DialogDescription>

        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-auto min-w-[150px]">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className=''>
                    {modelCategories.map((category) => (
                      <SidebarMenuItem key={category.name}>
                        <SidebarMenuButton
                          onClick={() => setSelectedCategory(category.name)}
                          isActive={selectedCategory === category.name}
                          className="cursor-pointer h-12"
                        >
                          <category.icon className="h-4 w-4" />
                          <span className="capitalize">{category.displayName}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <div className="flex flex-1 flex-col overflow-y-auto relative w-full">
            <header className="flex h-16 hidden md:block shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Model Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="capitalize">
                        {selectedCategory
                          .split(" ")
                          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
                          .join(" ")}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            {/* Mobile 分类选择 */}
            <div className="md:hidden pb-4 z-10">
              <div className="flex flex-wrap gap-2 ">
                {modelCategories.map((category) => (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className="flex-shrink-0 gap-1"
                  >
                    <category.icon className="h-3 w-3" />
                    <span className="text-xs capitalize">{category.displayName}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-1">
              {/* 显示当前分类下的所有 preset */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 llg:grid-cols-5 gap-2">
                {displayPresets.length > 0 ? (
                  displayPresets.map((preset) => {
                    const hasImage =
                      !!preset?.imageUrl ||
                      (Array.isArray((preset as any)?.imageUrl) &&
                        (preset as any).imageUrl.length > 0 &&
                        !!(preset as any).imageUrl[0]);

                    const presetImageUrl = hasImage
                      ? (Array.isArray((preset as any)?.imageUrl)
                        ? (preset as any).imageUrl[0]
                        : (preset as any).imageUrl)
                      : "";
                    const isJustClicked = clickedPresetId === preset.id;
                    const isCustom = selectedCategory === "custom";
                    const isSelected = currentModel === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className={`relative aspect-[3/2] rounded-lg cursor-pointer transition-all hover:scale-102 ${
                          isSelected
                            ? "border-primary ring-4 ring-primary/40 shadow-xl shadow-primary/30 bg-primary/5"
                            : "border-border hover:border-primary/60 hover:shadow-md hover:bg-accent/50"
                        }`}
                        onClick={() => handleModelClick(preset)}
                      >
                        {hasImage && (
                          <>
                            <img src={presetImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover rounded-lg" loading="lazy" />
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/70 via-black/40 to-black/70" />
                          </>
                        )}
                        {isJustClicked && (
                          <div className="absolute inset-0 bg-black/70 text-white rounded-lg flex items-center justify-center z-10 animate-in fade-in duration-200">
                            <div className="font-semibold text-sm md:text-base flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </div>
                          </div>
                        )}
                        <Card className={`border-0 h-full ${hasImage ? "bg-transparent" : ""} ${isSelected ? "bg-primary/10" : ""}`}>
                          <CardHeader className={`${hasImage ? "text-white" : ""}`}>
                            <CardTitle className={`capitalize ${hasImage ? "drop-shadow" : ""} ${isSelected ? "text-primary" : ""}`}>
                              {preset.name || preset.id}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="flex flex-wrap gap-1 items-end">
                            <CardDescription className={`hidden md:block ${hasImage ? "drop-shadow text-white/90" : ""}`}>

                              {preset?.prompt && preset?.prompt?.length > 75 ? preset?.prompt?.slice(0, 75) + "..." : preset?.prompt}
                            </CardDescription>
                          </CardContent>


                        </Card>

                        {/* 未选中状态的 overlay */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-background/20 rounded-lg pointer-events-none transition-opacity duration-200" />
                        )}

                        {/* 选中状态对勾 */}
                        {isSelected && !isCustom && (
                          <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg shadow-primary/50 z-10 animate-in zoom-in-95 duration-200">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        )}

                        {/* 自定义项的删除按钮（只在 custom 分类时显示） */}
                        {isCustom && (
                          <Button
                            type="button"
                            variant="ghost"
                            className="absolute bottom-2 right-2"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCustomPrompt(preset.id);
                            }}
                            aria-label="Delete custom prompt"
                            title="Delete custom prompt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No available presets in this category
                  </div>
                )}

                {enabledCustom && selectedCategory === "custom" && (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">Add Custom Prompt</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">Name *</Label>
                        <Input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="My Prompt"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label className="text-xs">Prompt *</Label>
                        <Textarea
                          value={newPrompt}
                          onChange={(e) => setNewPrompt(e.target.value)}
                          placeholder="Write your prompt text here…"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-end md:col-span-6">
                        <Button type="button" onClick={handleAddCustomPrompt} className="w-full md:w-auto">
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Prompt
                        </Button>
                      </div>
                    </CardContent>
                    {checkAddPromptRequire && (
                      <p className="text-red-500 text-xs text-center">{checkAddPromptRequire}</p>
                    )}
                  </Card>
                )}


              </div>
            </div>
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}