"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsSection {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface SettingsNavProps {
  sections: SettingsSection[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ sections, activeSection, onSelect }: SettingsNavProps) {
  return (
    <aside className="w-80 bg-surface-card border-r border-border-default overflow-y-auto flex-shrink-0">
      <nav className="p-3 flex flex-col gap-1" aria-label="Seções de configurações">
        {sections.map((section) => {
          const isActive = section.id === activeSection;
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSelect(section.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "w-full flex items-center justify-between gap-3 p-3 rounded-lg transition-colors text-left",
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-txt-primary hover:bg-surface-elevated"
              )}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isActive ? "text-primary-600" : "text-txt-muted"
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">
                    {section.name}
                  </span>
                  <span
                    className={cn(
                      "block text-xs truncate",
                      isActive ? "text-primary-600/80" : "text-txt-muted"
                    )}
                  >
                    {section.description}
                  </span>
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-primary-600" : "text-txt-muted"
                )}
              />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
