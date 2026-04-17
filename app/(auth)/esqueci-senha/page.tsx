"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconField } from "@/components/forms/icon-field";

const forgotSchema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (_data: ForgotForm) => {
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
  };

  const tryAgain = () => {
    reset();
    setSent(false);
  };

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
        {sent ? (
          <>
            <CardHeader className="pb-2">
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary-50">
                <CheckCircle2 className="size-5 text-primary-600" />
              </div>
              <CardTitle className="text-base">Verifique seu email</CardTitle>
              <CardDescription>
                Se existe uma conta associada ao email informado, enviamos um
                link para redefinir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-txt-muted">
                O link tem validade limitada. Não recebeu? Confira spam ou tente
                novamente em alguns instantes.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={tryAgain}
                >
                  Usar outro email
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
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recuperar senha</CardTitle>
              <CardDescription>
                Informe o email da sua conta e enviaremos instruções para
                redefinir a senha.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <IconField
                  id="email"
                  label="Email"
                  icon={Mail}
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar instruções"
                  )}
                </Button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
                >
                  <ArrowLeft className="size-3.5" />
                  Voltar para login
                </Link>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
