"use client";

// Hosteia o hook useRealtime uma única vez por dashboard. Não renderiza nada;
// existe só pra manter a conexão SSE viva enquanto o usuário está logado.

import { useRealtime } from "@/lib/hooks/use-realtime";

export function RealtimeProvider() {
  useRealtime();
  return null;
}
