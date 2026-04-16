"use client";

import { useCallback, useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AvatarInitials } from "./avatar-initials";
import { MOCK_AGENTS } from "@/lib/mock-data";

interface TransferConversationSheetProps {
  open: boolean;
  currentAssignedUserId: string | null;
  onClose: () => void;
  onTransfer: (agentId: string) => void;
}

interface TransferListProps {
  currentAssignedUserId: string | null;
  onClose: () => void;
  onTransfer: (agentId: string) => void;
}

function TransferList({ currentAssignedUserId, onClose, onTransfer }: TransferListProps) {
  const [query, setQuery] = useState("");

  const availableAgents = useMemo(
    () => MOCK_AGENTS.filter((a) => a.id !== currentAssignedUserId),
    [currentAssignedUserId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableAgents;
    return availableAgents.filter((a) => a.name.toLowerCase().includes(q));
  }, [query, availableAgents]);

  const handleSelect = useCallback(
    (agentId: string) => {
      onTransfer(agentId);
      onClose();
    },
    [onTransfer, onClose]
  );

  return (
    <>
      <SheetHeader className="border-b border-border-default pb-4">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-headline text-base font-semibold text-txt-primary">
            Transferir conversa
          </SheetTitle>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-txt-muted" />
          </button>
        </div>
      </SheetHeader>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atendente..."
            aria-label="Buscar atendente"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-elevated border border-border-default text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-txt-muted text-center py-8 font-body">
            Nenhum atendente encontrado
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((agent) => (
              <li key={agent.id}>
                <button
                  onClick={() => handleSelect(agent.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-elevated transition-colors text-left"
                >
                  <AvatarInitials name={agent.name} size="sm" />
                  <span className="text-sm text-txt-primary font-body font-medium">
                    {agent.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function TransferConversationSheet({
  open,
  currentAssignedUserId,
  onClose,
  onTransfer,
}: TransferConversationSheetProps) {
  const handleOpenChange = useCallback(
    (o: boolean) => {
      if (!o) onClose();
    },
    [onClose]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="!max-w-sm bg-surface-card text-txt-primary flex flex-col overflow-hidden"
      >
        {open && (
          <TransferList
            currentAssignedUserId={currentAssignedUserId}
            onClose={onClose}
            onTransfer={onTransfer}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
