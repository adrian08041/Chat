"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";

// Picker é client-only e pesado — carrega só quando abrir.
const Picker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface EmojiPickerPopoverProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPickerPopover({
  onSelect,
  onClose,
}: EmojiPickerPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Escape.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Selecionar emoji"
      className="absolute bottom-full left-0 mb-2 z-20 shadow-lg rounded-xl overflow-hidden"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native?: string }) => {
          if (emoji.native) onSelect(emoji.native);
        }}
        locale="pt"
        theme="light"
        previewPosition="none"
        skinTonePosition="search"
        navPosition="top"
        perLine={9}
        maxFrequentRows={1}
      />
    </div>
  );
}
