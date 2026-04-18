import type { Tag } from "./tag";

export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
  source: string | null;
  assignedUserId: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface ContactTableRow {
  contact: Contact;
  responsavel: string;
  conversasCount: number;
  ultimoContato: string;
}

export interface ConversaHistorico {
  id: string;
  data: string;
  descricao: string;
  atendidoPor: string;
  duracao: string;
}

export interface NotaInterna {
  id: string;
  autor: string;
  data: string;
  conteudo: string;
}
