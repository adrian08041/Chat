"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconField } from "@/components/forms/icon-field";
import { PasswordField } from "@/components/forms/password-field";
import { loginSchema, type LoginInput } from "@/lib/auth-schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (!res || res.error) {
      setAuthError("Email ou senha inválidos");
      return;
    }

    const from = searchParams.get("from");
    router.push(from && from.startsWith("/") ? from : "/conversas");
    router.refresh();
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Entrar na sua conta</CardTitle>
          <CardDescription>
            Use seu email corporativo para acessar o painel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {authError && (
              <div
                role="alert"
                className="rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
              >
                {authError}
              </div>
            )}

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

            <PasswordField
              id="password"
              label="Senha"
              autoComplete="current-password"
              placeholder="Sua senha"
              error={errors.password?.message}
              labelAction={
                <Link
                  href="/esqueci-senha"
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  Esqueci a senha
                </Link>
              }
              {...register("password")}
            />

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-txt-muted">
        Precisa de uma conta? Fale com o administrador da sua empresa.
      </p>
    </div>
  );
}
