"use client";

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Tag } from "@/types/tag";

interface ConversationTagsProps {
  tags: Tag[];
  allTags: Tag[];
  allTagsLoading?: boolean;
  disabled?: boolean;
  onChange: (tagIds: string[]) => void;
}

export function ConversationTags({
  tags,
  allTags,
  allTagsLoading = false,
  disabled = false,
  onChange,
}: ConversationTagsProps) {
  const [open, setOpen] = useState(false);
  const appliedIds = new Set(tags.map((t) => t.id));

  const toggleTag = (tagId: string) => {
    const next = appliedIds.has(tagId)
      ? tags.filter((t) => t.id !== tagId).map((t) => t.id)
      : [...tags.map((t) => t.id), tagId];
    onChange(next);
  };

  const removeTag = (tagId: string) => {
    onChange(tags.filter((t) => t.id !== tagId).map((t) => t.id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-headline font-semibold text-sm text-txt-primary">
          Tags
        </h4>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            disabled={disabled}
            className="inline-flex items-center gap-1.5 h-7 px-2 rounded-lg bg-surface-elevated hover:bg-surface-card border border-border-default text-xs text-txt-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </PopoverTrigger>
          <PopoverContent align="end" className="p-1.5">
            <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5">
              {allTagsLoading && (
                <p className="text-xs text-txt-muted px-2 py-3">
                  Carregando...
                </p>
              )}
              {!allTagsLoading && allTags.length === 0 && (
                <p className="text-xs text-txt-muted px-2 py-3">
                  Nenhuma tag criada ainda.
                </p>
              )}
              {allTags.map((tag) => {
                const selected = appliedIds.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-surface-elevated transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm text-txt-primary flex-1 truncate">
                      {tag.name}
                    </span>
                    {selected && (
                      <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {tags.length === 0 ? (
        <p className="text-xs text-txt-muted font-body">Sem tags.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full text-[11px] font-body font-medium"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                border: `1px solid ${tag.color}30`,
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                disabled={disabled}
                aria-label={`Remover tag ${tag.name}`}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
