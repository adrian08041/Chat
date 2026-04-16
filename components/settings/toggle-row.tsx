"use client";

import { Switch } from "@/components/ui/switch";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  lastItem?: boolean;
}

export function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
  lastItem,
}: ToggleRowProps) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 py-3" +
        (lastItem ? "" : " border-b border-border-subtle")
      }
    >
      <div className="min-w-0">
        <p className="font-medium text-sm text-txt-primary mb-0.5">{label}</p>
        <p className="text-sm text-txt-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
