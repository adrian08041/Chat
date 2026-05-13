"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTags } from "@/lib/hooks/use-tags";

interface Props {
  value: { id: string; name: string; color: string }[];
  onSave: (tagIds: string[]) => Promise<void>;
}

export function ContactTagsEditor({ value, onSave }: Props) {
  const { data: tags = [] } = useTags();
  const [savingId, setSavingId] = useState<string | null>(null);
  const selectedIds = new Set(value.map((t) => t.id));

  async function toggle(tagId: string) {
    const next = selectedIds.has(tagId)
      ? [...selectedIds].filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    setSavingId(tagId);
    try {
      await onSave(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar tags");
    } finally {
      setSavingId(null);
    }
  }

  if (tags.length === 0) {
    return <p className="text-xs text-txt-muted">Nenhuma tag disponível</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const selected = selectedIds.has(tag.id);
        const pending = savingId === tag.id;
        return (
          <button
            key={tag.id}
            type="button"
            disabled={pending}
            onClick={() => void toggle(tag.id)}
            aria-pressed={selected}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all disabled:opacity-60"
            style={
              selected
                ? {
                    backgroundColor: `${tag.color}18`,
                    color: tag.color,
                    boxShadow: `inset 0 0 0 1px ${tag.color}`,
                  }
                : {
                    backgroundColor: "transparent",
                    color: "var(--color-txt-muted)",
                    boxShadow: "inset 0 0 0 1px var(--color-border-default)",
                  }
            }
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
