"use client";

import React from "react";
import { Rect, Text, Group } from "react-konva";
import type { PreviewPlaceholder } from "@/types/canvas";

interface PreviewPlaceholderProps {
    placeholder: PreviewPlaceholder;
    viewport: { x: number; y: number; scale: number };
}

export const PreviewPlaceholderComponent: React.FC<PreviewPlaceholderProps> = ({
    placeholder,
    viewport
}) => {
    if (!placeholder.visible) return null;

    const fontSize = Math.max(12, 16 / viewport.scale);
    const padding = Math.max(8, 10 / viewport.scale);

    return (
        <Group>
            {/* Main placeholder rectangle */}
            <Rect
                x={placeholder.x}
                y={placeholder.y}
                width={placeholder.width}
                height={placeholder.height}
                fill="rgba(179, 200, 233, 0.1)" // Blue with transparency
                stroke="rgb(165, 179, 202)" // Blue border
                strokeWidth={2 / viewport.scale}
                dash={[10 / viewport.scale, 5 / viewport.scale]} // Dashed border
                cornerRadius={8 / viewport.scale}
            />

            {/* Text overlay */}
            <Rect
                x={placeholder.x + padding}
                y={placeholder.y + padding}
                width={placeholder.width - padding * 2}
                height={fontSize + padding}
                fill="rgba(0, 0, 0, 0.1)" // Solid blue background for text
                cornerRadius={4 / viewport.scale}
            />

            <Text
                x={placeholder.x + padding * 1.5}
                y={placeholder.y + padding * 1.25}
                width={placeholder.width - padding * 3}
                text={placeholder.count && placeholder.count > 1
                    ? `${placeholder.text} (${placeholder.count} items)`
                    : placeholder.text || "Generation result will display here"
                }
                fontSize={fontSize}
                fontFamily="Arial, sans-serif"
                fill="rgb(255, 255, 255)"
                align="center"
                verticalAlign="middle"
                wrap="word"
                ellipsis={true}
            />

            {/* Corner indicators */}
            {[
                { x: placeholder.x, y: placeholder.y },
                { x: placeholder.x + placeholder.width, y: placeholder.y },
                { x: placeholder.x, y: placeholder.y + placeholder.height },
                { x: placeholder.x + placeholder.width, y: placeholder.y + placeholder.height }
            ].map((corner, index) => (
                <Rect
                    key={index}
                    x={corner.x - 4 / viewport.scale}
                    y={corner.y - 4 / viewport.scale}
                    width={8 / viewport.scale}
                    height={8 / viewport.scale}
                    fill="rgb(63, 65, 66)"
                    cornerRadius={2 / viewport.scale}
                />
            ))}
        </Group>
    );
};
