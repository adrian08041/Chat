"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import getCaretCoordinates from "textarea-caret";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspaceUsers } from "@/lib/hooks/use-users";
import { cn } from "@/lib/utils";

type NoteEditorProps = {
  value: string;
  onChange: (content: string, mentionedUserIds: string[]) => void;
  onSubmit: () => void;
  submitting?: boolean;
  placeholder?: string;
  className?: string;
};

// Posição do `@` ativo (trigger detectado no texto) — null = popover fechado.
type Trigger = {
  start: number;
  query: string;
  top: number;
  left: number;
};

const MAX_VISIBLE = 8;

export function NoteEditor({
  value,
  onChange,
  onSubmit,
  submitting = false,
  placeholder,
  className,
}: NoteEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mentionedMap, setMentionedMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [highlight, setHighlight] = useState(0);

  const { data: users = [] } = useWorkspaceUsers();

  // Filtra membros pela query do `@`. Sem rede — `useWorkspaceUsers` cacheia.
  const filtered = useMemo(() => {
    if (!trigger) return [];
    const q = trigger.query.toLowerCase();
    return users
      .filter((u) => u.name.toLowerCase().includes(q))
      .slice(0, MAX_VISIBLE);
  }, [trigger, users]);

  // Re-sincroniza IDs: mantém só os cujos @Nome ainda aparecem no texto.
  const reconcileIds = useCallback(
    (text: string, current: Map<string, string>): string[] => {
      const next: string[] = [];
      for (const [id, name] of current) {
        if (text.includes("@" + name)) next.push(id);
      }
      return next;
    },
    [],
  );

  // Detecta trigger ativo: `@` em início ou após whitespace, sem espaços/quebras
  // entre o `@` e o cursor.
  const detectTrigger = useCallback(
    (text: string, caret: number): Trigger | null => {
      for (let i = caret - 1; i >= 0; i--) {
        const ch = text[i];
        if (ch === "@") {
          const prev = i === 0 ? " " : text[i - 1];
          if (/\s/.test(prev) || i === 0) {
            const query = text.slice(i + 1, caret);
            if (/\s/.test(query)) return null;
            const el = textareaRef.current;
            if (!el) return null;
            const coords = getCaretCoordinates(el, i);
            return {
              start: i,
              query,
              top: coords.top + coords.height,
              left: coords.left,
            };
          }
          return null;
        }
        if (/\s/.test(ch)) return null;
      }
      return null;
    },
    [],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const caret = e.target.selectionStart ?? text.length;
      const nextIds = reconcileIds(text, mentionedMap);
      // Drop entradas órfãs do map também (libera memória + comparações).
      if (nextIds.length !== mentionedMap.size) {
        const next = new Map<string, string>();
        for (const id of nextIds) {
          const name = mentionedMap.get(id);
          if (name) next.set(id, name);
        }
        setMentionedMap(next);
      }
      onChange(text, nextIds);
      setTrigger(detectTrigger(text, caret));
      setHighlight(0);
    },
    [mentionedMap, onChange, reconcileIds, detectTrigger],
  );

  const selectMember = useCallback(
    (user: { id: string; name: string }) => {
      const el = textareaRef.current;
      if (!el || !trigger) return;
      const before = value.slice(0, trigger.start);
      const after = value.slice(el.selectionStart ?? value.length);
      const insertion = `@${user.name} `;
      const nextText = before + insertion + after;
      const nextMap = new Map(mentionedMap);
      nextMap.set(user.id, user.name);
      setMentionedMap(nextMap);
      const nextIds = Array.from(nextMap.keys());
      onChange(nextText, nextIds);
      setTrigger(null);
      requestAnimationFrame(() => {
        const pos = before.length + insertion.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [value, trigger, mentionedMap, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (trigger && filtered.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlight((h) => (h + 1) % filtered.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          selectMember(filtered[highlight]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setTrigger(null);
          return;
        }
      }
      if (
        !trigger &&
        e.key === "Enter" &&
        (e.metaKey || e.ctrlKey) &&
        !submitting &&
        value.trim()
      ) {
        e.preventDefault();
        onSubmit();
      }
    },
    [trigger, filtered, highlight, selectMember, submitting, value, onSubmit],
  );

  // Fecha popover ao perder foco — usa mousedown no item pra disparar antes do blur.
  useEffect(() => {
    const close = () => setTrigger(null);
    const el = textareaRef.current;
    if (!el) return;
    el.addEventListener("blur", close);
    return () => el.removeEventListener("blur", close);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
      />
      {trigger && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 max-h-56 w-56 overflow-y-auto rounded-md border border-border-subtle bg-surface-card shadow-lg"
          style={{ top: trigger.top + 4, left: trigger.left }}
        >
          {filtered.map((u, i) => (
            <li
              key={u.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                selectMember(u);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                i === highlight
                  ? "bg-primary-50 text-primary-700"
                  : "text-txt-primary hover:bg-surface-muted",
              )}
            >
              {u.name}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
          size="sm"
        >
          {submitting ? "Salvando..." : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}
