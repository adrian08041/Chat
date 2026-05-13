// Helpers de apresentação de Contact. Storage usa phone só com dígitos
// (normalizeContactPhone em contact.service.ts) — a formatação fica aqui.

// Formato BR: +55 (11) 99999-9999. Outros países: +<digits>.
export function formatContactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    const middle =
      rest.length === 9
        ? `${rest.slice(0, 5)}-${rest.slice(5)}`
        : `${rest.slice(0, 4)}-${rest.slice(4)}`;
    return `+55 (${ddd}) ${middle}`;
  }
  return digits ? `+${digits}` : "";
}

// Nome para exibição: usa `name` quando preenchido, senão phone formatado.
// Cobre contatos importados do WhatsApp que não estavam na agenda.
export function getContactDisplayName(contact: {
  name: string | null;
  phone: string;
}): string {
  return contact.name ?? formatContactPhone(contact.phone);
}
