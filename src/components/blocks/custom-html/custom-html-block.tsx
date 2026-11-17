import React from "react";
import { styleText } from "@/lib/security/style-text";
import type { CustomHtmlBlockProps } from "@/types/cms";

export function CustomHtmlBlock({ block }: { block: CustomHtmlBlockProps }) {
  const { html, css } = block.data;
  return (
    <div className="w-full">
      {css && <style dangerouslySetInnerHTML={{ __html: styleText(css) }} />}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
