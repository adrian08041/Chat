"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconField } from "@/components/forms/icon-field";
import { PasswordField } from "@/components/forms/password-field";

const acceptSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Informe seu nome completo")
      .min(3, "Nome muito curto"),
    password: z
      .string()
      .min(8, "A senha deve ter ao menos 8 caracteres")
      .regex(/[A-Za-z]/, "A senha deve conter letras")
      .regex(/\d/, "A senha deve conter números"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

type AcceptInput = z.infer<typeof acceptSchema>;

type ApiResult =
  | { success: true; data: { email: string } }
  | { success: false; error: string };

export function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInput>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: AcceptInput) => {
    setFormError(null);

    const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.fullName, password: data.password }),
    });

    const payload = (await res.json().catch(() => null)) as ApiResult | null;

    if (!res.ok || !payload?.success) {
      setFormError(payload?.success === false ? payload.error : "Falha ao aceitar convite");
      return;
    }

    const signInRes = await signIn("credentials", {
      email: payload.data.email,
      password: data.password,
      redirect: false,
    });

    if (!signInRes || signInRes.error) {
      setFormError(
        "Sua conta foi criada, mas o login automático falhou. Faça login manualmente.",
      );
      return;
    }

    router.push("/conversas");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-sm text-danger"
        >
          {formError}
        </div>
      )}

      <IconField
        id="email"
        label="Email"
        icon={Mail}
        type="email"
        value={email}
        readOnly
        hint="Vinculado a este convite"
        className="cursor-not-allowed opacity-75"
      />

      <IconField
        id="fullName"
        label="Nome completo"
        icon={UserRound}
        type="text"
        autoComplete="name"
        placeholder="Seu nome"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <PasswordField
        id="password"
        label="Senha"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        hint="Use letras e números"
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Repita a senha"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
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
            Criando conta...
          </>
        ) : (
          "Aceitar convite e entrar"
        )}
      </Button>
    </form>
  );
}
