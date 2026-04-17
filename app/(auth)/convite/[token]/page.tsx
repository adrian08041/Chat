"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail, UserRound } from "lucide-react";

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

interface InviteInfo {
  email: string;
  role: "Administrador" | "Supervisor" | "Vendedor";
  invitedBy: string;
  company: string;
}

const MOCK_INVITE: InviteInfo = {
  email: "novo.membro@empresa.com",
  role: "Vendedor",
  invitedBy: "Admin User",
  company: "Adrilo",
};

const INVALID_MOCK_TOKENS = new Set(["expirado", "invalido"]);

const inviteSchema = z
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

type InviteForm = z.infer<typeof inviteSchema>;

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const invite = INVALID_MOCK_TOKENS.has(token) ? null : MOCK_INVITE;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (_data: InviteForm) => {
    await new Promise((r) => setTimeout(r, 900));
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
        {!invite ? (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Convite inválido</CardTitle>
              <CardDescription>
                Este link de convite expirou ou não é mais válido. Peça ao
                administrador da sua empresa para gerar um novo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                render={<Link href="/login" />}
              >
                <ArrowLeft className="size-4" />
                Ir para login
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aceitar convite</CardTitle>
              <CardDescription>
                <span className="font-medium text-txt-primary">
                  {invite.invitedBy}
                </span>{" "}
                convidou você para ingressar em{" "}
                <span className="font-medium text-txt-primary">
                  {invite.company}
                </span>{" "}
                como{" "}
                <span className="font-medium text-txt-primary">
                  {invite.role}
                </span>
                .
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
                  value={invite.email}
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
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
