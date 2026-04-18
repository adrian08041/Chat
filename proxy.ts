export { auth as proxy } from "@/auth";

// Roda em todas as rotas exceto:
// - /api/auth/* (callbacks do próprio Auth.js)
// - /api/webhooks/* (chamados por terceiros sem session — autenticados via
//   secret no path ou HMAC; proteger com Auth.js quebraria a integração)
// - /api/invites/[token]* (links públicos de convite — token já é o segredo)
// - /_next/static, /_next/image, /favicon.ico, /logo.png (assets)
export const config = {
  matcher: [
    "/((?!api/auth|api/webhooks|api/invites|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
