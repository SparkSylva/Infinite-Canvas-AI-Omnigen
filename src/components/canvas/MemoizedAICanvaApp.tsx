"use client";

import React, { memo, useMemo } from 'react';


import AiMultiGeneratorCanva, { AiAppRef } from '@/components/application/ai-multi-generator-canva';

interface MemoizedAiImageAppProps {
  aiAppRef: React.RefObject<AiAppRef | null>;
  hideFormFields?: {
    [key: string]: boolean;
  };
  initialFormValues?: {
    [key: string]: any;
  };
  onGenerate?: (handleInput: any) => Promise<void> | void;  
}

// 创建一个高度优化的 AiImageApp 包装组件
export const MemoizedAiCanvaApp = memo(({ 
  aiAppRef, 
  hideFormFields = {

  }, 
  initialFormValues = {},
  onGenerate
}: MemoizedAiImageAppProps) => {
  
  // 缓存 props 对象，确保引用稳定性
  const stableHideFormFields = useMemo(() => hideFormFields, [
    JSON.stringify(hideFormFields)
  ]);
  
  const stableInitialFormValues = useMemo(() => initialFormValues, [
    JSON.stringify(initialFormValues)
  ]);

  return (
    <AiMultiGeneratorCanva
      ref={aiAppRef}

      hideFormFields={stableHideFormFields}
      initialFormValues={stableInitialFormValues}
      onGenerate={onGenerate}
    />
  );
}, (prevProps, nextProps) => {
  // 深度比较优化
  const hideFieldsEqual = JSON.stringify(prevProps.hideFormFields) === JSON.stringify(nextProps.hideFormFields);
  const initialValuesEqual = JSON.stringify(prevProps.initialFormValues) === JSON.stringify(nextProps.initialFormValues);
  const refEqual = prevProps.aiAppRef === nextProps.aiAppRef;
  
  return hideFieldsEqual && initialValuesEqual && refEqual;
});

MemoizedAiCanvaApp.displayName = 'MemoizedAiCanvaApp';


