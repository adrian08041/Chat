import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/hash";

const prisma = new PrismaClient();

const DEFAULT_WORKSPACE_SLUG = "default";
const DEFAULT_WORKSPACE_NAME = "My App";
const FALLBACK_ADMIN_EMAIL = "admin@local.test";
const FALLBACK_ADMIN_PASSWORD = "admin123";
const FALLBACK_AGENT_EMAIL = "vendedor@local.test";
const FALLBACK_AGENT_PASSWORD = "vendedor123";

async function ensureUser(params: {
  workspaceId: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (existing) {
    console.log(`[seed] ${params.role.toLowerCase()} já existe (${params.email}) — skip`);
    return;
  }

  const passwordHash = await hashPassword(params.password);
  await prisma.user.create({
    data: {
      workspaceId: params.workspaceId,
      email: params.email,
      name: params.name,
      passwordHash,
      role: params.role,
    },
  });
  console.log(`[seed] ${params.role.toLowerCase()} criado: ${params.email} (senha: ${params.password})`);
}

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

  console.log(`[seed] workspace: ${workspace.slug} (${workspace.id})`);

  await ensureUser({
    workspaceId: workspace.id,
    email: adminEmail,
    password: adminPassword,
    name: "Admin",
    role: UserRole.ADMIN,
  });

  // Vendedor (AGENT) — só em dev, nunca em prod
  if (!isProd) {
    await ensureUser({
      workspaceId: workspace.id,
      email: FALLBACK_AGENT_EMAIL,
      password: FALLBACK_AGENT_PASSWORD,
      name: "Vendedor",
      role: UserRole.AGENT,
    });
  }

  if (usingFallback) {
    console.log(
      `[seed] ATENÇÃO: usando credenciais de fallback (somente dev).`,
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
