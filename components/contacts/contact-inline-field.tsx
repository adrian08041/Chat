"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  value: string | null;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  onSave: (next: string | null) => Promise<void>;
  displayClassName?: string;
  inputClassName?: string;
  ariaLabel: string;
}

export function ContactInlineField({
  value,
  placeholder,
  multiline = false,
  maxLength,
  onSave,
  displayClassName,
  inputClassName,
  ariaLabel,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  async function commit() {
    const trimmed = draft.trim();
    const normalized = trimmed === "" ? null : trimmed;
    if ((value ?? "") === (normalized ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(normalized);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(value ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={
          displayClassName ??
          "text-left w-full hover:bg-surface-elevated rounded px-1 -mx-1 transition-colors"
        }
        aria-label={ariaLabel}
      >
        {value ?? <span className="text-txt-muted">{placeholder}</span>}
      </button>
    );
  }

  const shared = {
    value: draft,
    disabled: saving,
    maxLength,
    placeholder,
    "aria-label": ariaLabel,
    autoFocus: true,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: () => {
      void commit();
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      } else if (e.key === "Enter") {
        if (!multiline) {
          e.preventDefault();
          void commit();
        } else if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          void commit();
        }
      }
    },
    className:
      inputClassName ??
      "w-full rounded-md bg-surface-elevated border border-border-default px-2 py-1 text-sm text-txt-primary focus:outline-none focus:ring-2 focus:ring-primary-400",
  };

  if (multiline) {
    return <textarea ref={textareaRef} rows={3} {...shared} />;
  }
  return <input ref={inputRef} type="text" {...shared} />;
}
