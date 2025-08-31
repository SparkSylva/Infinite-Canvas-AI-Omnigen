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


export const MemoizedAiCanvaApp = memo(({ 
  aiAppRef, 
  hideFormFields = {

  }, 
  initialFormValues = {},
  onGenerate
}: MemoizedAiImageAppProps) => {
  

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

  const hideFieldsEqual = JSON.stringify(prevProps.hideFormFields) === JSON.stringify(nextProps.hideFormFields);
  const initialValuesEqual = JSON.stringify(prevProps.initialFormValues) === JSON.stringify(nextProps.initialFormValues);
  const refEqual = prevProps.aiAppRef === nextProps.aiAppRef;
  
  return hideFieldsEqual && initialValuesEqual && refEqual;
});

MemoizedAiCanvaApp.displayName = 'MemoizedAiCanvaApp';


