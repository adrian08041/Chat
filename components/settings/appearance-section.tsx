"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const THEMES: {
  id: Theme;
  label: string;
  description: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "light",
    label: "Claro",
    description: "Modo claro",
    preview: <div className="w-full h-24 bg-surface-card border border-border-default rounded-lg" />,
  },
  {
    id: "dark",
    label: "Escuro",
    description: "Modo escuro",
    preview: <div className="w-full h-24 bg-neutral-900 rounded-lg" />,
  },
  {
    id: "system",
    label: "Sistema",
    description: "Seguir o sistema",
    preview: (
      <div className="w-full h-24 rounded-lg bg-gradient-to-br from-surface-card to-neutral-900" />
    ),
  },
];

export function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>("light");

  const handleChange = (next: Theme) => {
    setTheme(next);
    const label = next === "light" ? "claro" : next === "dark" ? "escuro" : "do sistema";
    toast.success(`Tema ${label} aplicado!`);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">Aparência</h2>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <h3 className="font-headline font-semibold text-sm text-txt-primary">
            Tema
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleChange(t.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors text-left",
                    isActive
                      ? "border-primary-600 bg-primary-50/40"
                      : "border-border-default hover:bg-surface-elevated"
                  )}
                >
                  {t.preview}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {isActive && <Check className="w-4 h-4 text-primary-600" />}
                    <p
                      className={cn(
                        "font-medium text-sm",
                        isActive ? "text-primary-600" : "text-txt-secondary"
                      )}
                    >
                      {t.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
