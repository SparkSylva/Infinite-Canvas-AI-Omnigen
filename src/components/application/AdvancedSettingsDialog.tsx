'use client'

import React from 'react';
import { Control, UseFormReturn } from 'react-hook-form';
import { SlidersHorizontal } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/shadcn-ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/shadcn-ui/accordion";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/shadcn-ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/shadcn-ui/select";
import { Input, Slider, Switch } from '@/components/ui';
import { Button } from "@/components/ui/shadcn-ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/shadcn-ui/tooltip";
import { coerceString, coerceNumber, coerceBool, ensureSelectValue } from '@/utils/tools/formCoerce';

interface AdvancedSettingsDialogProps {
    form: UseFormReturn<any>;
    selectedModelConfig?: any;
    hideFormFields?: { [key: string]: boolean };
    tabLocaleObject?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AdvancedSettingsDialog({
    form,
    selectedModelConfig,
    hideFormFields,
    tabLocaleObject,
    open,
    onOpenChange
}: AdvancedSettingsDialogProps) {
    // Use controlled or uncontrolled state
    const [internalDialogOpen, setInternalDialogOpen] = React.useState(false)
    // Determine if we're using controlled or uncontrolled state
    const isControlled = open !== undefined && onOpenChange !== undefined
    const dialogOpen = isControlled ? open : internalDialogOpen
    const setDialogOpen = isControlled ? onOpenChange : setInternalDialogOpen


    // Check if we should show the dialog
    const shouldShowDialog = selectedModelConfig?.customParameters &&
        selectedModelConfig.customParameters.length > 0 &&
        !hideFormFields?.advanced_settings;

    const hasCustomParameters = selectedModelConfig?.customParameters &&
        selectedModelConfig.customParameters.length > 0;

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${hasCustomParameters && !hideFormFields?.advanced_settings
                                    ? 'text-foreground hover:bg-accent'
                                    : 'text-muted-foreground/50 cursor-not-allowed'
                                    }`}
                                disabled={!shouldShowDialog}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        {shouldShowDialog
                            ? (tabLocaleObject?.advancedSettings || 'Advanced Settings')
                            : 'No advanced settings'
                        }
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {shouldShowDialog && (
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {tabLocaleObject?.advancedSettings || 'Advanced Settings'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
                        {selectedModelConfig.customParameters.map((param: any) => {
                            const fieldName = `${param.name}` as const;

                            switch (param.type) {
                                case 'select':
                                    return (
                                        <FormField
                                            key={param.name}
                                            control={form.control}
                                            name={fieldName}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm">{param.label}</FormLabel>
                                                    <Select
                                                        value={ensureSelectValue(field.value, param.options, param.defaultValue)}
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            form.setValue(`meta_data.${param.name}`, value, { shouldDirty: true, shouldValidate: true });
                                                        }}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder={`Select ${param.label}`} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="w-full">
                                                            {param.options?.map((option: any) => (
                                                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {param.description && <FormDescription>{param.description}</FormDescription>}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    );

                                case 'slider': {

                                    return (
                                        <FormField
                                            key={param.name}
                                            control={form.control}
                                            name={fieldName}
                                            render={({ field }) => {
                                                const display = coerceNumber(field.value, param.defaultValue ?? param.min ?? 0);

                                                return (
                                                    <FormItem>
                                                        <div className="flex justify-between">
                                                            <FormLabel>{param.label}</FormLabel>
                                                            <span className="text-sm text-muted-foreground">{display}</span>
                                                        </div>
                                                        <FormControl>
                                                            <Slider
                                                                min={param.min}
                                                                max={param.max}
                                                                step={param.step}
                                                                value={[display]}
                                                                onValueChange={(value) => {
                                                                    const v = value[0];
                                                                    field.onChange(v);
                                                                    form.setValue(`meta_data.${param.name}`, v, { shouldDirty: true, shouldValidate: true });
                                                                }}
                                                            />
                                                        </FormControl>
                                                        {param.description && <FormDescription>{param.description}</FormDescription>}
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                    );
                                }

                                case 'switch':
                                    return (
                                        <FormField
                                            key={param.name}
                                            control={form.control}
                                            name={fieldName}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>{param.label}</FormLabel>
                                                        {param.description && <FormDescription>{param.description}</FormDescription>}
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={coerceBool(field.value, param.defaultValue ?? false)}
                                                            onCheckedChange={(checked) => {
                                                                field.onChange(checked);
                                                                form.setValue(`meta_data.${param.name}`, checked, { shouldDirty: true, shouldValidate: true });
                                                            }}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    );

                                case 'input':
                                    return (
                                        <FormField
                                            key={param.name}
                                            control={form.control}
                                            name={fieldName}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{param.label}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={param.description || `Enter ${param.label}`}
                                                            value={coerceString(field.value, param.defaultValue ?? "")}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                field.onChange(v);
                                                                form.setValue(`meta_data.${param.name}`, v, { shouldDirty: true, shouldValidate: true });
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    );

                                default:
                                    return null;
                            }
                        })}

                  
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}
