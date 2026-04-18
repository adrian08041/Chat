"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/forms/password-field";

const resetSchema = z
  .object({
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

type ResetInput = z.infer<typeof resetSchema>;

type ApiResult =
  | { success: true; data: { updated: true } }
  | { success: false; error: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetInput) => {
    setFormError(null);

    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    const payload = (await res.json().catch(() => null)) as ApiResult | null;

    if (!res.ok || !payload?.success) {
      setFormError(
        payload?.success === false ? payload.error : "Falha ao redefinir senha",
      );
      return;
    }

    setDone(true);
  };

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push("/login"), 1500);
    return () => clearTimeout(timer);
  }, [done, router]);

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary-50">
          <CheckCircle2 className="size-5 text-primary-600" />
        </div>
        <p className="text-sm font-medium text-txt-primary">
          Senha redefinida com sucesso
        </p>
        <p className="text-xs text-txt-muted">
          Redirecionando para o login...
        </p>
      </div>
    );
  }

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

      <PasswordField
        id="password"
        label="Nova senha"
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

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Redefinir senha"
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
  );
}
