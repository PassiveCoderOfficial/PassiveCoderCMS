"use client";

import { useId, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { passwordScore } from "@/lib/validation/customer";

/**
 * Storefront input with label, hint and a friendly error under it. The error
 * shows once the field has been left (or the form submitted, via `showError`),
 * not while the shopper is still typing their first characters.
 */
export function FormField({
  label, value, onChange, error, showError, hint, type = "text", required, autoComplete, inputMode, placeholder, multiline, meter, name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  showError?: boolean;
  hint?: string;
  type?: "text" | "email" | "tel" | "password";
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  placeholder?: string;
  multiline?: boolean;
  /** Password strength meter under the field. */
  meter?: boolean;
  name?: string;
}) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [reveal, setReveal] = useState(false);
  const shown = (touched || showError) && error ? error : null;
  const cls = cn(
    "w-full rounded-xl border bg-background px-3.5 text-sm transition-colors focus:outline-none focus:ring-2",
    multiline ? "py-2.5 min-h-[76px]" : "h-11",
    shown ? "border-destructive focus:ring-destructive/20" : "focus:ring-primary/25 focus:border-primary",
    type === "password" && "pr-11",
  );
  const common = {
    id, name, value, placeholder, autoComplete, inputMode, required,
    "aria-invalid": !!shown,
    "aria-describedby": shown ? `${id}-err` : hint ? `${id}-hint` : undefined,
    onBlur: () => setTouched(true),
    className: cls,
  };
  const score = meter && value ? passwordScore(value) : 0;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}{required && <span className="text-destructive"> *</span>}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...common} type={type === "password" && reveal ? "text" : type} onChange={(e) => onChange(e.target.value)} />
        )}
        {type === "password" && (
          <button type="button" onClick={() => setReveal(!reveal)} aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {meter && value && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((k) => (
              <span key={k} className={cn("h-1 rounded-full", k < score ? (score <= 1 ? "bg-red-500" : score === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-muted")} />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground w-12 text-right">{["Weak", "Weak", "Okay", "Good", "Strong"][score]}</span>
        </div>
      )}
      {shown ? (
        <p id={`${id}-err`} className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" /> {shown}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Form-level message (server answer) in the same style. */
export function FormAlert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  return (
    <div role="alert" className={cn("rounded-xl px-3.5 py-2.5 text-sm flex items-start gap-2",
      tone === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-800")}>
      {tone === "error" && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}
