import { redirect } from "next/navigation";

import { auth } from "@/auth";

// Dashboard é manager-only (passo 17). AGENT que acessar direto cai aqui;
// proxy.ts não faz essa distinção porque depende de role. Sidebar já filtra
// o link, mas defesa em profundidade previne bypass por URL colada.
export default async function DashboardSectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    redirect("/conversas");
  }
  return children;
}
