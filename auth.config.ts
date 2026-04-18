import type { NextAuthConfig } from "next-auth";

// Config edge-safe: sem imports de Prisma ou bcrypt (que não rodam em Edge).
// O Credentials provider de verdade vive em auth.ts, que estende este config.
// O proxy.ts do Next 16 roda em Node.js, mas manter split prepara pra caso
// precisemos rodar callbacks em Edge no futuro.

const AUTH_PAGES = ["/login", "/esqueci-senha", "/convite"];

function isAuthPath(pathname: string): boolean {
  return AUTH_PAGES.some((path) => pathname.startsWith(path));
}

export default {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova cookie se idade > 24h
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const onAuthPage = isAuthPath(nextUrl.pathname);

      if (onAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/conversas", nextUrl));
      }

      if (!onAuthPage && !isLoggedIn) {
        const redirectTo = new URL("/login", nextUrl);
        if (nextUrl.pathname !== "/") {
          redirectTo.searchParams.set("from", nextUrl.pathname);
        }
        return Response.redirect(redirectTo);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.workspaceId = token.workspaceId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
