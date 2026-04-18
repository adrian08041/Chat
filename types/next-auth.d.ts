import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// As interfaces reais vivem em `@auth/core/*`. `next-auth/*` só re-exporta,
// e module augmentation não se propaga via re-export — por isso declaramos
// nos dois lugares.

type AppSessionUser = {
  id: string;
  role: UserRole;
  workspaceId: string;
} & DefaultSession["user"];

declare module "next-auth" {
  interface Session {
    user: AppSessionUser;
  }

  interface User {
    id: string;
    role: UserRole;
    workspaceId: string;
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: AppSessionUser;
  }

  interface User {
    id: string;
    role: UserRole;
    workspaceId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    workspaceId: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    workspaceId: string;
  }
}
