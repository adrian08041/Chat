import { redirect } from "next/navigation";

import { auth } from "@/auth";

// Relatórios é manager-only (passo 17). Mesmo guard do /dashboard.
export default async function RelatoriosSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/conversas");
  }
  return children;
}
