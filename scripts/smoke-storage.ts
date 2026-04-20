// Smoke test do storage R2 (passo 14). Sobe um PNG minúsculo e imprime a URL,
// depois deleta o objeto pra não deixar lixo no bucket.
// Rodar: npx tsx scripts/smoke-storage.ts

import "dotenv/config";

import { buildObjectKey, deleteFile, uploadFile } from "../lib/storage";

// PNG 1×1 transparente (67 bytes).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

async function main() {
  const key = buildObjectKey({
    workspaceId: "smoke-test",
    scope: "chat",
    fileName: "probe.png",
  });

  console.log(`Uploading key=${key} size=${PNG_1x1.byteLength}B...`);

  const result = await uploadFile({
    key,
    body: PNG_1x1,
    contentType: "image/png",
  });

  console.log("OK:");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nValidar acesso público: curl -I "${result.url}"`);

  // Cleanup — evita acumular lixo a cada smoke run.
  if (!process.argv.includes("--keep")) {
    console.log("\nDeletando objeto de teste...");
    await deleteFile(result.key);
    console.log("OK, bucket limpo.");
  } else {
    console.log("\n--keep passado; objeto permanece no bucket.");
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
