export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="p-6">
      <h1 className="font-headline text-2xl font-bold text-txt-primary">Perfil do Contato</h1>
      <p className="mt-2 text-txt-secondary text-sm">Detalhes e histórico</p>
    </div>
  );
}
