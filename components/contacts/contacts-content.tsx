"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Upload, Download, Plus, MessageSquare, Trash2 } from "lucide-react";
import { AvatarInitials } from "@/components/chat/avatar-initials";
import { TagBadge } from "@/components/ui/tag-badge";
import { ContactProfileDrawer } from "@/components/contacts/contact-profile-drawer";
import { formatRelativeTime } from "@/lib/format";
import { MOCK_CONTACTS_TABLE, MOCK_TAGS } from "@/lib/mock-data";
import type { ContactTableRow } from "@/types/contact";

const FILTER_TABS = [
  { key: "todos", label: "Todos" },
  ...MOCK_TAGS.map((tag) => ({ key: tag.name, label: tag.name })),
];

interface ContactRowProps {
  row: ContactTableRow;
  onOpenProfile: (row: ContactTableRow) => void;
  onStartChat: (contactId: string) => void;
  onDelete: (contactId: string) => void;
}

function ContactRow({ row, onOpenProfile, onStartChat, onDelete }: ContactRowProps) {
  const { contact, responsavel, conversasCount, ultimoContato } = row;

  return (
    <tr className="border-b border-border-subtle hover:bg-surface-elevated/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <AvatarInitials name={contact.name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-txt-primary truncate">{contact.name ?? "Contato sem nome"}</p>
            {contact.email && (
              <p className="text-xs text-txt-muted truncate">{contact.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-txt-secondary">{contact.phone}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1.5">
          {contact.tags?.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-txt-secondary">{formatRelativeTime(ultimoContato)}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <AvatarInitials name={responsavel} size="sm" />
          <span className="text-sm text-txt-primary">{responsavel}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-medium text-txt-primary">{conversasCount}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenProfile(row)}
            className="text-xs text-primary-600 hover:text-primary-400 font-medium transition-colors whitespace-nowrap mr-1"
          >
            Ver perfil
          </button>
          <button
            onClick={() => onStartChat(contact.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
            aria-label="Enviar mensagem"
          >
            <MessageSquare className="w-4 h-4 text-primary-600" />
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-light hover:bg-danger-light/80 transition-colors"
            aria-label="Excluir contato"
          >
            <Trash2 className="w-4 h-4 text-danger" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ConfirmDeleteDialog({
  contactName,
  onConfirm,
  onCancel,
}: {
  contactName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-surface-card rounded-xl border border-border-default shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="font-headline text-base font-semibold text-txt-primary">Excluir contato</h3>
        <p className="text-sm text-txt-secondary mt-2">
          Tem certeza que deseja excluir <strong>{contactName}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-10 rounded-lg bg-danger text-sm font-medium text-white hover:bg-danger/90 transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContactsContent() {
  const router = useRouter();
  const [rows, setRows] = useState<ContactTableRow[]>(MOCK_CONTACTS_TABLE);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [selectedRow, setSelectedRow] = useState<ContactTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactTableRow | null>(null);

  const handleOpenProfile = useCallback((row: ContactTableRow) => {
    setSelectedRow(row);
  }, []);

  const handleCloseProfile = useCallback(() => {
    setSelectedRow(null);
  }, []);

  const handleStartChat = useCallback((contactId: string) => {
    router.push(`/conversas?contact=${contactId}`);
  }, [router]);

  const handleRequestDelete = useCallback((contactId: string) => {
    const row = rows.find((r) => r.contact.id === contactId);
    if (row) setDeleteTarget(row);
  }, [rows]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setRows((prev) => prev.filter((r) => r.contact.id !== deleteTarget.contact.id));
    // Se o drawer está aberto para este contato, fechar
    if (selectedRow?.contact.id === deleteTarget.contact.id) {
      setSelectedRow(null);
    }
    setDeleteTarget(null);
  }, [deleteTarget, selectedRow]);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  // Callbacks para o drawer
  const handleDrawerStartChat = useCallback(() => {
    if (!selectedRow) return;
    setSelectedRow(null);
    router.push(`/conversas?contact=${selectedRow.contact.id}`);
  }, [selectedRow, router]);

  const handleDrawerDelete = useCallback(() => {
    if (!selectedRow) return;
    setDeleteTarget(selectedRow);
  }, [selectedRow]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = row.contact.name?.toLowerCase().includes(q);
        const matchesPhone = row.contact.phone.toLowerCase().includes(q);
        const matchesEmail = row.contact.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }
      if (activeFilter !== "todos") {
        const hasTag = row.contact.tags?.some((t) => t.name === activeFilter);
        if (!hasTag) return false;
      }
      return true;
    });
  }, [rows, searchTerm, activeFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">Contatos</h2>
          <p className="text-sm text-txt-muted mt-1">Gerencie seus contatos e leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors">
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-9 rounded-lg border border-border-default bg-surface-card text-sm font-medium text-txt-primary hover:bg-surface-elevated transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-9 rounded-lg bg-primary-600 text-sm font-medium text-txt-on-primary hover:bg-primary-400 transition-colors">
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          aria-label="Buscar contatos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-elevated border-none text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all font-body"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filtros de contatos">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeFilter === tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-primary-600 text-txt-on-primary"
                : "bg-surface-elevated text-txt-secondary hover:bg-surface-card"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-xl border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Contato</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Telefone</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Tags</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Último Contato</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Responsável</th>
                <th className="text-center text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Conversas</th>
                <th className="text-left text-xs font-semibold text-txt-muted uppercase tracking-wider py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <ContactRow
                  key={row.contact.id}
                  row={row}
                  onOpenProfile={handleOpenProfile}
                  onStartChat={handleStartChat}
                  onDelete={handleRequestDelete}
                />
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-txt-muted">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de perfil */}
      <ContactProfileDrawer
        row={selectedRow}
        onClose={handleCloseProfile}
        onStartChat={handleDrawerStartChat}
        onDelete={handleDrawerDelete}
      />

      {/* Dialog de confirmação de exclusão */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          contactName={deleteTarget.contact.name ?? "Contato sem nome"}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
