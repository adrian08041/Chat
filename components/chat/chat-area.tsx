"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Send,
  CheckCheck,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarInitials } from "./avatar-initials";
import { QuickReplyPopover } from "./quick-reply-popover";
import { EmojiPickerPopover } from "./emoji-picker-popover";
import { CONVERSATION_STATUS_LABELS, CONVERSATION_STATUS_COLORS } from "@/lib/constants";
import { MOCK_QUICK_REPLIES } from "@/lib/mock-data";
import type { Conversation } from "@/types/conversation";
import type { Message } from "@/types/message";
import type { QuickReply } from "@/types/quick-reply";

const QUICK_REPLY_PATTERN = /(?:^|\s)(\/[a-z0-9-]*)$/i;

function findQuickReplyTrigger(value: string): { slashIndex: number; query: string } | null {
  const match = value.match(QUICK_REPLY_PATTERN);
  if (!match || match.index === undefined) return null;
  const slashToken = match[1];
  return {
    slashIndex: value.length - slashToken.length,
    query: slashToken.slice(1).toLowerCase(),
  };
}

function filterQuickReplies(query: string, replies: QuickReply[]): QuickReply[] {
  if (!query) return replies;
  return replies.filter(
    (r) =>
      r.shortcut.toLowerCase().startsWith(query) ||
      r.title.toLowerCase().includes(query)
  );
}

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  assigneeName: string;
  onSendMessage: (content: string) => void;
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function getDateKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function MessageStatusIcon({ status }: { status: Message["status"] }) {
  if (status === "READ") {
    return <CheckCheck className="w-[14px] h-[14px] text-info" />;
  }
  if (status === "DELIVERED") {
    return <CheckCheck className="w-[14px] h-[14px] text-txt-muted" />;
  }
  return null;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="bg-surface-card px-4 py-1.5 rounded-lg text-xs text-txt-muted font-body shadow-sm">
        {label}
      </span>
    </div>
  );
}

export function ChatArea({ conversation, messages, assigneeName, onSendMessage }: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  const trigger = findQuickReplyTrigger(inputValue);
  const triggerActive = trigger !== null;
  const matches = useMemo(
    () => (trigger ? filterQuickReplies(trigger.query, MOCK_QUICK_REPLIES) : []),
    [trigger]
  );
  const popoverOpen = triggerActive && matches.length > 0 && !dismissed;
  const clampedActiveIndex =
    matches.length > 0 ? Math.min(activeIndex, matches.length - 1) : 0;
  const activeOptionId = popoverOpen
    ? `${optionIdPrefix}-${clampedActiveIndex}`
    : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setActiveIndex(0);
    setDismissed(false);
  };

  const handleInputFocus = () => setDismissed(false);
  const handleInputBlur = () => setDismissed(true);

  const handleSelectReply = (reply: QuickReply) => {
    if (!trigger) return;
    const before = inputValue.slice(0, trigger.slashIndex);
    const next = before + reply.content;
    setInputValue(next);
    setActiveIndex(0);
    setDismissed(false);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.length, next.length);
    });
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage(text);
    setInputValue("");
  };

  const handleSelectEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setInputValue((v) => v + emoji);
      setEmojiPickerOpen(false);
      return;
    }
    const start = input.selectionStart ?? inputValue.length;
    const end = input.selectionEnd ?? inputValue.length;
    const next = inputValue.slice(0, start) + emoji + inputValue.slice(end);
    setInputValue(next);
    setEmojiPickerOpen(false);
    // Mantém foco + posiciona cursor depois do emoji inserido.
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (popoverOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectReply(matches[clampedActiveIndex]);
        return;
      }
    }

    if (triggerActive && trigger && e.key === "Escape") {
      e.preventDefault();
      setInputValue(inputValue.slice(0, trigger.slashIndex));
      setDismissed(false);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-bg">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="font-headline font-semibold text-lg text-txt-primary mb-1">
            Selecione uma conversa
          </h3>
          <p className="text-sm text-txt-muted font-body">
            Escolha uma conversa ao lado para começar
          </p>
        </div>
      </div>
    );
  }

  const contactName = conversation.contact.name ?? conversation.contact.phone ?? "Contato";
  const contactPhone = conversation.contact.phone;
  const statusLabel = CONVERSATION_STATUS_LABELS[conversation.status] ?? conversation.status;

  // Agrupar mensagens por data para date separators dinâmicos
  const messagesWithSeparators: { type: "separator"; label: string; key: string }[] | { type: "message"; msg: Message }[] = [];
  let lastDateKey = "";
  for (const msg of messages) {
    const dateKey = getDateKey(msg.createdAt);
    if (dateKey !== lastDateKey) {
      (messagesWithSeparators as { type: string; label?: string; key?: string; msg?: Message }[]).push({
        type: "separator",
        label: formatDateLabel(msg.createdAt),
        key: `sep-${dateKey}`,
      });
      lastDateKey = dateKey;
    }
    (messagesWithSeparators as { type: string; msg?: Message }[]).push({ type: "message", msg });
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <header className="h-[68px] flex items-center justify-between px-5 border-b border-border-default bg-surface-card flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarInitials name={contactName} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-headline font-semibold text-txt-primary truncate">
                {contactName}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium",
                  CONVERSATION_STATUS_COLORS[conversation.status] ?? "bg-neutral-100 text-neutral-600"
                )}
              >
                {statusLabel}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium border"
                style={{
                  backgroundColor: `${conversation.instance.color}15`,
                  color: conversation.instance.color,
                  borderColor: `${conversation.instance.color}30`,
                }}
                title={`Número: ${conversation.instance.name}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: conversation.instance.color }}
                />
                {conversation.instance.name}
              </span>
            </div>
            <p className="text-xs text-txt-muted font-body truncate">
              {contactPhone} • {assigneeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {([
            { Icon: Phone, label: "Ligar" },
            { Icon: Video, label: "Vídeo chamada" },
            { Icon: Search, label: "Pesquisar na conversa" },
            { Icon: MoreVertical, label: "Mais opções" },
          ] as const).map(({ Icon, label }) => (
            <button
              key={label}
              aria-label={label}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors"
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          ))}
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto px-16 py-4"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23075E54' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: "var(--surface-bg)",
        }}
      >
        {(messagesWithSeparators as { type: string; label?: string; key?: string; msg?: Message }[]).map((item) => {
          if (item.type === "separator") {
            return <DateSeparator key={item.key} label={item.label!} />;
          }

          const msg = item.msg!;
          const isOutbound = msg.direction === "OUTBOUND";
          const isImage = msg.type === "IMAGE";

          return (
            <div
              key={msg.id}
              className={cn(
                "flex mb-2",
                isOutbound ? "justify-end" : "justify-start"
              )}
            >
              {!isOutbound && (
                <AvatarInitials name={contactName} size="sm" className="mt-1 mr-2 flex-shrink-0" />
              )}

              <div
                className={cn(
                  "max-w-[520px] rounded-2xl px-4 py-2.5 shadow-sm relative",
                  isOutbound
                    ? "bg-primary-50 rounded-tr-md"
                    : "bg-surface-card rounded-tl-md"
                )}
              >
                {isImage ? (
                  <div className="w-[260px] h-[180px] rounded-lg bg-surface-elevated flex items-center justify-center mb-1">
                    <ImageIcon className="w-10 h-10 text-txt-muted" />
                  </div>
                ) : (
                  <p className="text-sm text-txt-primary font-body leading-relaxed">
                    {msg.content}
                  </p>
                )}
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  isOutbound ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] text-txt-muted font-body">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                  {isOutbound && <MessageStatusIcon status={msg.status} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-5 py-3 border-t border-border-default bg-surface-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-label="Emoji"
              aria-expanded={emojiPickerOpen}
              onClick={() => setEmojiPickerOpen((v) => !v)}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                emojiPickerOpen
                  ? "text-primary-600 bg-primary-50"
                  : "text-txt-muted hover:text-txt-primary hover:bg-surface-elevated",
              )}
            >
              <Smile className="w-5 h-5" />
            </button>
            {emojiPickerOpen && (
              <EmojiPickerPopover
                onSelect={handleSelectEmoji}
                onClose={() => setEmojiPickerOpen(false)}
              />
            )}
          </div>
          <button aria-label="Anexar arquivo" className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt-primary hover:bg-surface-elevated transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              placeholder="Escreva uma mensagem (digite / para respostas rápidas)"
              aria-label="Mensagem"
              aria-autocomplete="list"
              aria-expanded={popoverOpen}
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="w-full h-11 px-4 rounded-xl bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
            />
            {popoverOpen && (
              <QuickReplyPopover
                listboxId={listboxId}
                optionIdPrefix={optionIdPrefix}
                matches={matches}
                activeIndex={clampedActiveIndex}
                onSelect={handleSelectReply}
                onHoverIndex={setActiveIndex}
              />
            )}
          </div>
          {inputValue.trim() ? (
            <button
              aria-label="Enviar mensagem"
              onClick={handleSend}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-primary-600 hover:bg-primary-800 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button aria-label="Gravar áudio" className="w-9 h-9 rounded-lg flex items-center justify-center text-txt-muted hover:text-primary-600 hover:bg-primary-50 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
