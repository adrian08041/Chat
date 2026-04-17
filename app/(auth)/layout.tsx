export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex justify-center bg-surface-bg py-8 sm:items-center overflow-y-auto">
      {children}
    </div>
  );
}
