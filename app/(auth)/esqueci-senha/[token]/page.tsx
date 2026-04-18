import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api-utils";
import { verifyResetToken } from "@/lib/services/password-reset.service";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let metadata: Awaited<ReturnType<typeof verifyResetToken>> | null = null;
  let errorMessage =
    "Este link expirou ou não é mais válido. Solicite um novo para continuar.";

  try {
    metadata = await verifyResetToken(token);
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else {
      console.error("[reset/page] erro inesperado:", error);
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Adrilo"
          width={240}
          height={74}
          priority
          className="h-16 w-auto object-contain"
        />
        <p className="mt-2 text-sm text-txt-muted">
          Gestão multi-número para sua equipe
        </p>
      </div>

      <Card className="border-border-default">
        {!metadata ? (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Link inválido</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="lg"
                className="w-full"
                render={<Link href="/esqueci-senha" />}
              >
                Solicitar novo link
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full"
                render={<Link href="/login" />}
              >
                <ArrowLeft className="size-4" />
                Voltar para login
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Definir nova senha</CardTitle>
              <CardDescription>
                Escolha uma nova senha para{" "}
                <span className="font-medium text-txt-primary">
                  {metadata.email}
                </span>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResetPasswordForm token={token} />
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
