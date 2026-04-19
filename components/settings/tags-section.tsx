"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError } from "@/lib/api-client";
import {
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
} from "@/lib/hooks/use-tags";
import { TAG_COLORS, type Tag, type TagColor } from "@/types/tag";

type DraftState = {
  id: string | null;
  name: string;
  color: TagColor;
};

const EMPTY_DRAFT: DraftState = { id: null, name: "", color: TAG_COLORS[3] };

function ColorPicker({
  value,
  onChange,
}: {
  value: TagColor;
  onChange: (c: TagColor) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TAG_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Selecionar cor ${c}`}
          aria-pressed={value === c}
          className="w-7 h-7 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: c,
            borderColor: value === c ? c : "transparent",
            outline: value === c ? "2px solid white" : "none",
            outlineOffset: value === c ? "-4px" : "0",
          }}
        >
          {value === c && <Check className="w-3.5 h-3.5 text-white" />}
        </button>
      ))}
    </div>
  );
}

function TagRow({
  tag,
  isManager,
  onEdit,
  onRemove,
}: {
  tag: Tag;
  isManager: boolean;
  onEdit: (t: Tag) => void;
  onRemove: (t: Tag) => void;
}) {
  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-4">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${tag.color}18`,
            color: tag.color,
            border: `1px solid ${tag.color}30`,
          }}
        >
          {tag.name}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="text-xs font-mono text-txt-secondary">
            {tag.color}
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(tag)}
            disabled={!isManager}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-elevated hover:bg-surface-card border border-border-default transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Editar ${tag.name}`}
          >
            <Pencil className="w-4 h-4 text-txt-secondary" />
          </button>
          <button
            onClick={() => onRemove(tag)}
            disabled={!isManager}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Remover ${tag.name}`}
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TagsSection() {
  const { data: session } = useSession();
  const isManager =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

  const { data: tags = [], isLoading, error } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [formOpen, setFormOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Tag | null>(null);

  const handleStartCreate = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  }, []);

  const handleStartEdit = useCallback((tag: Tag) => {
    setDraft({ id: tag.id, name: tag.name, color: tag.color as TagColor });
    setFormOpen(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setFormOpen(false);
    setDraft(EMPTY_DRAFT);
  }, []);

  const handleSubmit = useCallback(async () => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Informe um nome para a tag");
      return;
    }
    try {
      if (draft.id) {
        await updateMutation.mutateAsync({
          id: draft.id,
          name,
          color: draft.color,
        });
        toast.success("Tag atualizada");
      } else {
        await createMutation.mutateAsync({ name, color: draft.color });
        toast.success("Tag criada");
      }
      handleCancelForm();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Falha ao salvar tag";
      toast.error(msg);
    }
  }, [draft, createMutation, updateMutation, handleCancelForm]);

  const handleConfirmRemove = useCallback(() => {
    if (!removeTarget) return;
    deleteMutation.mutate(removeTarget.id, {
      onSuccess: () => {
        toast.success(`Tag "${removeTarget.name}" removida`);
        setRemoveTarget(null);
      },
      onError: (err) => {
        const msg =
          err instanceof ApiClientError ? err.message : "Falha ao remover tag";
        toast.error(msg);
      },
    });
  }, [removeTarget, deleteMutation]);

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-headline text-xl font-bold text-txt-primary">Tags</h2>
          <p className="text-sm text-txt-muted mt-1">
            {isLoading
              ? "Carregando..."
              : `${tags.length} ${tags.length === 1 ? "tag" : "tags"}`}
          </p>
        </div>
        {isManager && (
          <button
            onClick={handleStartCreate}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova tag
          </button>
        )}
      </div>

      {formOpen && isManager && (
        <div className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4">
          <h3 className="font-headline font-semibold text-sm text-txt-primary">
            {draft.id ? "Editar tag" : "Nova tag"}
          </h3>
          <div className="space-y-2">
            <label
              htmlFor="tag-name"
              className="block text-xs font-medium text-txt-secondary"
            >
              Nome
            </label>
            <input
              id="tag-name"
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              maxLength={40}
              placeholder="ex: Lead quente"
              className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border-subtle text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-400 font-body transition-all"
            />
          </div>
          <div className="space-y-2">
            <span className="block text-xs font-medium text-txt-secondary">
              Cor
            </span>
            <ColorPicker
              value={draft.color}
              onChange={(c) => setDraft((d) => ({ ...d, color: c }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-4 rounded-lg bg-primary-600 text-txt-on-primary text-sm font-medium hover:bg-primary-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Salvando..." : draft.id ? "Atualizar" : "Criar"}
            </button>
            <button
              onClick={handleCancelForm}
              className="h-10 px-4 rounded-lg bg-surface-elevated text-txt-primary text-sm font-medium hover:bg-surface-card border border-border-default transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Tag
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Cor
                </th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-sm text-danger">
                    Erro ao carregar tags:{" "}
                    {error instanceof Error ? error.message : "desconhecido"}
                  </td>
                </tr>
              )}
              {!error && isLoading && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 text-center text-sm text-txt-muted"
                  >
                    Carregando tags...
                  </td>
                </tr>
              )}
              {!error && !isLoading && tags.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-12 text-center text-sm text-txt-muted"
                  >
                    Nenhuma tag criada.
                  </td>
                </tr>
              )}
              {!error &&
                !isLoading &&
                tags.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    isManager={isManager}
                    onEdit={handleStartEdit}
                    onRemove={setRemoveTarget}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Remover tag"
        description={
          <>
            Tem certeza que deseja remover a tag{" "}
            <strong>{removeTarget?.name}</strong>? Ela será removida de todas as
            conversas e contatos onde estiver aplicada.
          </>
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}
