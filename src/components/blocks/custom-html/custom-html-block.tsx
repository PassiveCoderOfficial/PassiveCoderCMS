import React from "react";
import type { CustomHtmlBlockProps } from "@/types/cms";

export function CustomHtmlBlock({ block }: { block: CustomHtmlBlockProps }) {
  const { html, css } = block.data;
  return (
    <div className="w-full">
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
