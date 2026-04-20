import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { TopHeader } from "@/components/dashboard/top-header";
import { RealtimeProvider } from "@/components/realtime-provider";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Defesa em profundidade: proxy.ts já protege, mas o layout checa de novo
  // caso o matcher do proxy deixe alguma rota passar.
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg">
      <SidebarNav role={session.user.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        {children}
      </div>
      <Toaster position="top-right" richColors closeButton />
      <RealtimeProvider />
    </div>
  );
}
