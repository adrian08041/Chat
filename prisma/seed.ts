import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/hash";

const prisma = new PrismaClient();

const DEFAULT_WORKSPACE_SLUG = "default";
const DEFAULT_WORKSPACE_NAME = "My App";
const FALLBACK_ADMIN_EMAIL = "admin@local.test";
const FALLBACK_ADMIN_PASSWORD = "admin123";

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const emailFromEnv = process.env.SEED_ADMIN_EMAIL;
  const passwordFromEnv = process.env.SEED_ADMIN_PASSWORD;

  // Guard: em produção exigir envs explícitas — nunca cair no fallback dev.
  if (isProd && (!emailFromEnv || !passwordFromEnv)) {
    throw new Error(
      "Seed em production exige SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD",
    );
  }

  const adminEmail = emailFromEnv ?? FALLBACK_ADMIN_EMAIL;
  const adminPassword = passwordFromEnv ?? FALLBACK_ADMIN_PASSWORD;
  const usingFallback = !emailFromEnv || !passwordFromEnv;

  const workspace = await prisma.workspace.upsert({
    where: { slug: DEFAULT_WORKSPACE_SLUG },
    update: {},
    create: {
      slug: DEFAULT_WORKSPACE_SLUG,
      name: DEFAULT_WORKSPACE_NAME,
    },
  });

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`[seed] admin já existe (${adminEmail}) — nada a fazer`);
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log(`[seed] workspace: ${workspace.slug} (${workspace.id})`);
  console.log(`[seed] admin criado: ${adminEmail}`);

  if (usingFallback) {
    console.log(
      `[seed] ATENÇÃO: usando credenciais de fallback (somente dev). Senha: ${FALLBACK_ADMIN_PASSWORD}`,
    );
    console.log(
      "[seed] Em outros ambientes defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD",
    );
  }
}

main()
  .catch((err) => {
    console.error("[seed] FAIL:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
