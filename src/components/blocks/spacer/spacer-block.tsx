import React from "react";
import type { SpacerBlockProps } from "@/types/cms";

export function SpacerBlock({ block }: { block: SpacerBlockProps }) {
  return <div style={{ height: block.data.height }} />;
}
