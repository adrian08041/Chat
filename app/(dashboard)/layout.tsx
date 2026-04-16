import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { TopHeader } from "@/components/dashboard/top-header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg">
      <SidebarNav />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopHeader />
        {children}
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
