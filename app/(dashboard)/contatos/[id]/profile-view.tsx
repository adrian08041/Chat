"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  useContactProfile,
  useDeleteContact,
  useUpdateContact,
} from "@/lib/hooks/use-contacts";
import { ApiClientError } from "@/lib/api-client";
import {
  ContactProfileHeader,
  type ContactProfileUpdate,
} from "@/components/contacts/contact-profile-header";
import { ContactConversationsTimeline } from "@/components/contacts/contact-conversations-timeline";
import { ContactNotesAggregate } from "@/components/contacts/contact-notes-aggregate";

type Tab = "conversations" | "notes";

export function ProfileView({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useContactProfile(contactId);
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();
  const [tab, setTab] = useState<Tab>("conversations");

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonProfile />
      </div>
    );
  }

  if (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    return (
      <div className="p-6">
        <p className="text-sm text-danger">
          Falha ao carregar perfil.{" "}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline"
          >
            Tentar novamente
          </button>
        </p>
      </div>
    );
  }

  if (!data) return null;

  async function handleUpdate(partial: ContactProfileUpdate) {
    await updateMutation.mutateAsync({ id: contactId, ...partial });
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este contato? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(contactId);
      toast.success("Contato excluído");
      router.push("/contatos");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        toast.error("Este contato possui conversas e não pode ser excluído");
      } else {
        toast.error(err instanceof Error ? err.message : "Falha ao excluir");
      }
    }
  }

  const canDelete = data.contact.conversasCount === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <Link
          href="/contatos"
          className="inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-txt-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleteMutation.isPending}
          title={canDelete ? undefined : "Contato possui conversas e não pode ser excluído"}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-danger text-sm font-medium text-danger hover:bg-danger-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 p-6 overflow-y-auto">
        <div>
          <ContactProfileHeader item={data.contact} onUpdate={handleUpdate} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 border-b border-border-subtle">
            <TabButton
              active={tab === "conversations"}
              onClick={() => setTab("conversations")}
              label={`Conversas (${data.conversations.length})`}
            />
            <TabButton
              active={tab === "notes"}
              onClick={() => setTab("notes")}
              label={`Notas (${data.notes.length})`}
            />
          </div>
          {tab === "conversations" ? (
            <ContactConversationsTimeline conversations={data.conversations} />
          ) : (
            <ContactNotesAggregate notes={data.notes} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary-600 text-txt-primary"
          : "border-transparent text-txt-muted hover:text-txt-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function SkeletonProfile() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-24 bg-surface-elevated rounded-lg" />
      <div className="h-4 bg-surface-elevated rounded w-1/2" />
      <div className="h-4 bg-surface-elevated rounded w-1/3" />
    </div>
  );
}
