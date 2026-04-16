"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const INITIAL: LanguageSettings = {
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
};

const LANGUAGES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (United States)" },
  { value: "es-ES", label: "Español (España)" },
];

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/New_York", label: "New York (GMT-5)" },
  { value: "Europe/London", label: "London (GMT+0)" },
];

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMATS = [
  { value: "24h", label: "24 horas" },
  { value: "12h", label: "12 horas (AM/PM)" },
];

export function LanguageSection() {
  const [settings, setSettings] = useState<LanguageSettings>(INITIAL);

  const update = <K extends keyof LanguageSettings>(key: K) =>
    (value: string | null) => {
      if (value) setSettings((s) => ({ ...s, [key]: value }));
    };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">
        Idioma e Região
      </h2>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={settings.language} onValueChange={update("language")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select value={settings.timezone} onValueChange={update("timezone")}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato de Data</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={update("dateFormat")}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato de Hora</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={update("timeFormat")}
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_FORMATS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="lg"
              onClick={() =>
                toast.success("Configurações de idioma e região salvas!")
              }
            >
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
