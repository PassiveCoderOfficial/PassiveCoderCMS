"use client";

import * as React from "react";
import {
  addDays, addMonths, addYears, endOfMonth, endOfWeek, format, isSameMonth, isValid, parse, startOfMonth, startOfWeek,
} from "date-fns";
import { bn as bnLocale } from "date-fns/locale/bn";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";

/**
 * The date and time control for every admin screen. Takes and emits the same
 * strings as the native input of that type (yyyy-MM-dd, yyyy-MM-ddTHH:mm,
 * HH:mm) and calls onChange with { target: { value } }, so it swaps in for
 * <input type="date"> without touching the form's state.
 */
export type DateTimeKind = "date" | "datetime-local" | "time";
export type DateTimeChange = { target: { value: string; name: string } };

type Props = {
  type: DateTimeKind;
  value?: string | null;
  defaultValue?: string;
  onChange?: (e: DateTimeChange) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  /** Time used when a date is picked and no time is set yet. */
  defaultTime?: string;
  "aria-label"?: string;
};

const YMD = "yyyy-MM-dd";
const toYmd = (d: Date) => format(d, YMD);
const parseYmd = (s: string) => {
  const d = parse(s, YMD, new Date());
  return isValid(d) ? d : null;
};
const pad = (n: number) => String(n).padStart(2, "0");

/** "17:05" as "5:05 PM". */
export function formatTime12(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

function TimeControl({ value, onChange }: { value: string; onChange: (hm: string) => void }) {
  const { t } = useLanguage();
  const [h24, minute] = (value || "09:00").split(":").map(Number);
  const [hourDraft, setHourDraft] = React.useState<string | null>(null);
  const [minuteDraft, setMinuteDraft] = React.useState<string | null>(null);
  const pm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const set = (h: number, m: number) => onChange(`${pad((h + 24) % 24)}:${pad((m + 60) % 60)}`);
  const setH12 = (h: number) => set((h % 12) + (pm ? 12 : 0), minute);

  const stepBtn = "flex h-5 w-full items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground";
  const numCls = "h-9 w-12 rounded-md border border-input bg-background text-center text-base font-semibold tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const presets = ["09:00", "12:00", "17:00", "23:59"];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-12">
          <button type="button" aria-label={t("picker.hourUp")} className={stepBtn} onClick={() => set(h24 + 1, minute)}><ChevronUp className="h-3.5 w-3.5" /></button>
          <input
            inputMode="numeric" aria-label={t("picker.hour")} className={numCls} value={hourDraft ?? String(h12)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              setHourDraft(v);
              if (Number(v) >= 1 && Number(v) <= 12) setH12(Number(v));
            }}
            onBlur={() => setHourDraft(null)}
          />
          <button type="button" aria-label={t("picker.hourDown")} className={stepBtn} onClick={() => set(h24 - 1, minute)}><ChevronDown className="h-3.5 w-3.5" /></button>
        </div>
        <span className="text-lg font-semibold text-muted-foreground">:</span>
        <div className="w-12">
          <button type="button" aria-label={t("picker.minuteUp")} className={stepBtn} onClick={() => set(h24, (Math.floor(minute / 5) + 1) * 5)}><ChevronUp className="h-3.5 w-3.5" /></button>
          <input
            inputMode="numeric" aria-label={t("picker.minute")} className={numCls} value={minuteDraft ?? pad(minute)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              setMinuteDraft(v);
              if (v !== "" && Number(v) <= 59) set(h24, Number(v));
            }}
            onBlur={() => setMinuteDraft(null)}
          />
          <button type="button" aria-label={t("picker.minuteDown")} className={stepBtn} onClick={() => set(h24, (Math.ceil(minute / 5) - 1) * 5)}><ChevronDown className="h-3.5 w-3.5" /></button>
        </div>
        <div className="ml-2 flex flex-col overflow-hidden rounded-md border border-input">
          {(["AM", "PM"] as const).map((label) => {
            const on = (label === "PM") === pm;
            return (
              <button key={label} type="button" aria-pressed={on}
                onClick={() => { if (!on) set(h24 + (pm ? -12 : 12), minute); }}
                className={cn("px-2.5 py-1 text-xs font-semibold transition-colors", on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center gap-1">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => onChange(p)}
            className={cn("rounded-full border px-2 py-0.5 text-[11px] transition-colors", value === p ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground")}>
            {formatTime12(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Calendar({ selected, min, max, onPick }: { selected: string; min?: string; max?: string; onPick: (ymd: string) => void }) {
  const { language } = useLanguage();
  const locale = language === "bn" ? bnLocale : undefined;
  const start = parseYmd(selected) ?? new Date();
  const [view, setView] = React.useState(startOfMonth(start));
  const [mode, setMode] = React.useState<"days" | "months" | "years">("days");
  const [cursor, setCursor] = React.useState(toYmd(start));
  const grid = React.useRef<HTMLDivElement>(null);
  const moved = React.useRef(false);
  const today = toYmd(new Date());
  const out = (ymd: string) => (!!min && ymd < min.slice(0, 10)) || (!!max && ymd > max.slice(0, 10));

  // Follow a date set from outside the grid (Today, Tomorrow).
  React.useEffect(() => {
    const d = parseYmd(selected);
    if (!d) return;
    setView(startOfMonth(d));
    setMode("days");
    setCursor(selected);
  }, [selected]);

  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${cursor}"]`)?.focus();
  }, [cursor, view]);

  const days: Date[] = [];
  const last = endOfWeek(endOfMonth(view));
  for (let d = startOfWeek(startOfMonth(view)); d <= last; d = addDays(d, 1)) days.push(d);
  const weekdays = days.slice(0, 7).map((d) => format(d, "EEEEEE", { locale }));
  const yearStart = Math.floor(view.getFullYear() / 12) * 12;

  function onKey(e: React.KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = addDays(parseYmd(cursor) ?? new Date(), step);
    moved.current = true;
    setCursor(toYmd(next));
    if (!isSameMonth(next, view)) setView(startOfMonth(next));
  }

  const navBtn = "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const shift = (dir: number) => setView((v) => (mode === "days" ? addMonths(v, dir) : mode === "months" ? addYears(v, dir) : addYears(v, dir * 12)));
  const label = mode === "days" ? format(view, "MMMM yyyy", { locale }) : mode === "months" ? format(view, "yyyy", { locale }) : `${yearStart} – ${yearStart + 11}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous" className={navBtn} onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => setMode(mode === "days" ? "months" : mode === "months" ? "years" : "days")}
          className="rounded-md px-2 py-1 text-sm font-semibold transition-colors hover:bg-accent">
          {label}
        </button>
        <button type="button" aria-label="Next" className={navBtn} onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></button>
      </div>

      {mode === "days" && (
        <div ref={grid} onKeyDown={onKey}>
          <div className="mb-1 grid grid-cols-7">
            {weekdays.map((w) => <span key={w} className="py-1 text-center text-[11px] font-medium text-muted-foreground">{w}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const ymd = toYmd(d);
              const isSel = ymd === selected;
              return (
                <button key={ymd} type="button" data-day={ymd} disabled={out(ymd)} tabIndex={ymd === cursor ? 0 : -1} aria-pressed={isSel}
                  onClick={() => onPick(ymd)}
                  className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
                    isSel ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-accent",
                    !isSel && ymd === today && "font-semibold text-primary ring-1 ring-primary/50",
                    !isSel && !isSameMonth(d, view) && "text-muted-foreground/50",
                  )}>
                  {format(d, "d", { locale })}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "months" && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, m) => new Date(view.getFullYear(), m, 1)).map((d) => (
            <button key={d.getMonth()} type="button" onClick={() => { setView(d); setMode("days"); }}
              className={cn("rounded-md py-2.5 text-sm transition-colors", d.getMonth() === view.getMonth() ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
              {format(d, "MMM", { locale })}
            </button>
          ))}
        </div>
      )}

      {mode === "years" && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y) => (
            <button key={y} type="button" onClick={() => { setView(new Date(y, view.getMonth(), 1)); setMode("months"); }}
              className={cn("rounded-md py-2.5 text-sm tabular-nums transition-colors", y === view.getFullYear() ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DateTimeField({
  type, value, defaultValue, onChange, name, id, required, disabled, min, max, placeholder, className, defaultTime = "09:00", ...rest
}: Props) {
  const { t, language } = useLanguage();
  const locale = language === "bn" ? bnLocale : undefined;
  const [inner, setInner] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const current = (value === undefined ? inner : value) ?? "";

  const date = type === "time" ? "" : current.slice(0, 10);
  const time = type === "date" ? "" : type === "time" ? current.slice(0, 5) : current.slice(11, 16);
  const hasDate = type !== "time";
  const hasTime = type !== "date";

  const emit = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.({ target: { value: next, name: name ?? "" } });
  };
  const pickDate = (ymd: string) => {
    if (type === "date") { emit(ymd); setOpen(false); }
    else emit(`${ymd}T${time || defaultTime}`);
  };
  const pickTime = (hm: string) => {
    if (type === "time") emit(hm);
    else emit(`${date || toYmd(new Date())}T${hm}`);
  };

  const parsed = date ? parseYmd(date) : null;
  const shown = [parsed ? format(parsed, "EEE, d MMM yyyy", { locale }) : "", time ? formatTime12(time) : ""].filter(Boolean).join(" · ");
  const empty = placeholder ?? t(type === "time" ? "picker.pickTime" : type === "date" ? "picker.pickDate" : "picker.pickDateTime");
  const Icon = type === "time" ? Clock : CalendarDays;
  const quick = [{ label: t("picker.today"), days: 0 }, { label: t("picker.tomorrow"), days: 1 }]
    .map((q) => ({ ...q, ymd: toYmd(addDays(new Date(), q.days)) }))
    .filter((q) => !(min && q.ymd < min.slice(0, 10)) && !(max && q.ymd > max.slice(0, 10)));

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <button type="button" id={id} disabled={disabled} aria-label={rest["aria-label"]}
            className={cn(
              "inline-flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:border-primary data-[state=open]:ring-1 data-[state=open]:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}>
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("min-w-0 flex-1 truncate", !shown && "text-muted-foreground")}>{shown || empty}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionPadding={8}
          className={cn("z-[200] rounded-xl p-3 shadow-xl", hasDate ? "w-[19.5rem]" : "w-64")}
          onClick={(e) => e.stopPropagation()}>
          {hasDate && <Calendar selected={date} min={min} max={max} onPick={pickDate} />}
          {hasDate && hasTime && <div className="my-3 border-t border-border" />}
          {hasTime && <TimeControl value={time || defaultTime} onChange={pickTime} />}

          <div className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
            {hasDate && quick.map((q) => (
              <button key={q.days} type="button" onClick={() => pickDate(q.ymd)}
                className="rounded-md px-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent">
                {q.label}
              </button>
            ))}
            <span className="flex-1" />
            {current && !required && (
              <button type="button" onClick={() => { emit(""); setOpen(false); }}
                className="rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                {t("picker.clear")}
              </button>
            )}
            {hasTime && (
              <button type="button" onClick={() => { if (!current) pickTime(defaultTime); setOpen(false); }}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
                {t("picker.done")}
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {(name || required) && (
        // Carries the value for plain form posts and the browser's "required" check.
        <input className="sr-only" tabIndex={-1} aria-hidden name={name} required={required} value={current} onChange={() => {}} />
      )}
    </>
  );
}
