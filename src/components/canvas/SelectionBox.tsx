import React from "react";
import { Rect } from "react-konva";
import type { SelectionBox } from "@/types/canvas";
import { getPrimaryColor } from "./functions/canvasFunctions";
interface SelectionBoxProps {
  selectionBox: SelectionBox;
}

export const SelectionBoxComponent: React.FC<SelectionBoxProps> = ({
  selectionBox,
}) => {
  if (!selectionBox.visible) {  
    return null;
  }

  return (
    <Rect
      x={Math.min(selectionBox.startX, selectionBox.endX)}
      y={Math.min(selectionBox.startY, selectionBox.endY)}
      width={Math.abs(selectionBox.endX - selectionBox.startX)}
      height={Math.abs(selectionBox.endY - selectionBox.startY)}
      fill="rgba(172, 172, 187, 0.38)"
      stroke={getPrimaryColor()}
      strokeWidth={1}
      dash={[5, 5]}
    />
  );
};