import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/hash";

const EMAIL = "agent@local.test";
const PASSWORD = "agent123";
const NAME = "Agente Teste";

async function main() {
  const prisma = new PrismaClient();
  try {
    const workspace = await prisma.workspace.findFirst({
      where: { slug: "default" },
    });
    if (!workspace) {
      throw new Error("Workspace default não encontrado. Rode o seed primeiro.");
    }

    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
      console.log(`[create-agent] já existe: ${EMAIL} (role=${existing.role})`);
      return;
    }

    const passwordHash = await hashPassword(PASSWORD);
    const user = await prisma.user.create({
      data: {
        workspaceId: workspace.id,
        email: EMAIL,
        name: NAME,
        passwordHash,
        role: UserRole.AGENT,
      },
    });
    console.log(`[create-agent] criado: ${user.email} (id=${user.id})`);
    console.log(`[create-agent] senha: ${PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[create-agent] FAIL:", err);
  process.exit(1);
});
