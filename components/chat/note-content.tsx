"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";

type NoteContentProps = {
  content: string;
  className?: string;
};

// Split: captura `@` seguido de letra/dígito, com espaços internos permitidos
// no meio do nome (ex.: `@Adrian Santos`), parando em pontuação ou fim.
const MENTION_SPLIT_RE = /(@[\p{L}\p{N}](?:[\p{L}\p{N} ]*[\p{L}\p{N}])?)/gu;
// Test sem flag /g — evita armadilha do lastIndex mutável entre iterações.
const MENTION_TEST_RE = /^@[\p{L}\p{N}]/u;

export function NoteContent({ content, className }: NoteContentProps) {
  const parts = content.split(MENTION_SPLIT_RE);
  return (
    <p
      className={cn(
        "whitespace-pre-wrap text-sm text-txt-secondary",
        className,
      )}
    >
      {parts.map((part, i) =>
        MENTION_TEST_RE.test(part) ? (
          <span key={i} className="font-medium text-primary-600">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </p>
  );
}
