"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BASE_INPUT =
  "w-full h-10 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors font-body";

export interface IconFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  labelAction?: React.ReactNode;
  hint?: string;
}

export const IconField = React.forwardRef<HTMLInputElement, IconFieldProps>(
  function IconField(
    { id, label, icon: Icon, error, labelAction, hint, className, ...props },
    ref,
  ) {
    const errorId = error ? `${id}-error` : undefined;
    const hintId = hint ? `${id}-hint` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {labelAction}
        </div>
        <div className="relative">
          <Icon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-txt-muted"
          />
          <input
            id={id}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(BASE_INPUT, "pl-10 pr-3", className)}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-txt-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
