export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-border-default bg-surface-card">
        <div className="p-5 font-headline font-bold text-lg text-txt-primary">
          WhatsApp Platform
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 flex items-center px-6 border-b border-border-default bg-surface-card flex-shrink-0">
          <span className="text-txt-secondary text-sm font-body">Topbar</span>
        </header>

        <main className="flex-1 overflow-auto bg-surface-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
