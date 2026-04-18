export { auth as proxy } from "@/auth";

// Roda em todas as rotas exceto:
// - /api/auth/* (callbacks do próprio Auth.js)
// - /_next/static, /_next/image, /favicon.ico, /logo.png (assets)
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|logo.png).*)"],
};
