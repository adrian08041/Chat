import { prisma } from "../lib/prisma";

async function main() {
  const started = Date.now();
  const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
  const ms = Date.now() - started;

  if (rows[0]?.ok === 1) {
    console.log(`DB OK (${ms}ms)`);
    process.exit(0);
  }

  console.error("DB respondeu, mas valor inesperado:", rows);
  process.exit(1);
}

main()
  .catch((err) => {
    console.error("DB FAIL:", err?.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
