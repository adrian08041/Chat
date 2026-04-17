"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconField } from "@/components/forms/icon-field";
import { PasswordField } from "@/components/forms/password-field";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu email").email("Email inválido"),
  password: z.string().min(1, "Informe sua senha"),
  rememberMe: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (_data: LoginForm) => {
    setAuthError(null);
    await new Promise((r) => setTimeout(r, 800));
    router.push("/dashboard");
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

            <Controller
              control={control}
              name="rememberMe"
              render={({ field }) => (
                <Label htmlFor="rememberMe" className="cursor-pointer">
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span className="text-sm font-normal text-txt-primary">
                    Manter-me conectado
                  </span>
                </Label>
              )}
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
