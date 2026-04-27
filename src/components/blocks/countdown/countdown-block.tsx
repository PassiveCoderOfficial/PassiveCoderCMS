"use client";

import React, { useEffect, useState } from "react";
import type { CountdownBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";

function pad(n: number) { return String(n).padStart(2, "0"); }

function useCountdown(target: string) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const calc = () => setDiff(Math.max(0, new Date(target).getTime() - Date.now()));
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    expired: diff === 0,
  };
}

export function CountdownBlock({ block }: { block: CountdownBlockProps }) {
  const { data } = block;
  const { days, hours, minutes, seconds, expired } = useCountdown(data.targetDate);
  const labels = data.labels;

  if (expired && data.expiredMessage) {
    return <div className="text-center text-2xl font-bold">{data.expiredMessage}</div>;
  }

  const units = [
    { value: days, label: labels.days },
    { value: hours, label: labels.hours },
    { value: minutes, label: labels.minutes },
    ...(data.showSeconds ? [{ value: seconds, label: labels.seconds }] : []),
  ];

  if (data.layout === "minimal") {
    return (
      <div className="flex items-center justify-center gap-4 text-4xl font-bold">
        {units.map((u, i) => (
          <React.Fragment key={i}>
            <div className="text-center">
              <div>{pad(u.value)}</div>
              <div className="text-sm font-normal text-muted-foreground">{u.label}</div>
            </div>
            {i < units.length - 1 && <span className="text-muted-foreground mb-5">:</span>}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {units.map((u, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            "flex flex-col items-center justify-center",
            data.layout === "boxes" && "bg-white border rounded-xl shadow-sm w-24 h-24",
          )}>
            <span className="text-4xl font-bold tabular-nums">{pad(u.value)}</span>
            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{u.label}</span>
          </div>
          {i < units.length - 1 && data.layout === "boxes" && (
            <span className="text-3xl font-bold text-muted-foreground mb-4">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
