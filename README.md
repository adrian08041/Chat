This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Desenvolvimento local

Pré-requisitos: Node 20+, Docker (Desktop no Windows com integração WSL2 ou daemon nativo).

```bash
cp .env.example .env         # valores de dev já funcionam como estão
npm install                  # postinstall roda prisma generate
npm run db:up                # sobe Postgres 16 em localhost:5433
npm run db:check             # valida conexão end-to-end
npm run dev                  # http://localhost:3000
```

### Scripts de banco

| Script | O que faz |
|---|---|
| `npm run db:up` | sobe o container Postgres |
| `npm run db:down` | derruba o container (volume preservado) |
| `npm run db:reset` | derruba e apaga o volume (zera dados) |
| `npm run db:logs` | tail dos logs do Postgres |
| `npm run db:studio` | abre Prisma Studio em `localhost:5555` |
| `npm run db:generate` | regenera o Prisma Client |
| `npm run db:migrate` | cria/aplica migration (passo 2+) |
| `npm run db:check` | `SELECT 1` via Prisma pra validar stack |

### Troubleshooting WSL

- Se `npm run db:check` falhar com `ECONNREFUSED`, verifique se o Docker Desktop está com a integração WSL2 ativada (`Settings → Resources → WSL Integration`).
- Se a porta 5433 estiver ocupada, troque `POSTGRES_PORT` no `.env` e atualize `DATABASE_URL` pra bater com a nova porta.
- Em máquina com Postgres nativo rodando na 5432, mantenha 5433 pra evitar conflito.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
