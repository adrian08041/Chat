"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLAN_FEATURES = [
  "Até 15 usuários",
  "5 números WhatsApp",
  "Relatórios avançados",
];

export function BillingSection() {
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-headline text-xl font-bold text-txt-primary">Pagamento</h2>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-headline font-semibold text-sm text-txt-primary mb-1">
                Plano Atual
              </h3>
              <p className="text-sm text-txt-muted">
                Você está no plano Profissional
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-600">
              Ativo
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl font-bold text-txt-primary">
              R$ 299
            </span>
            <span className="text-txt-muted">/mês</span>
          </div>

          <ul className="space-y-2">
            {PLAN_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-txt-secondary"
              >
                <Check className="w-4 h-4 text-primary-600" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              toast.info("Funcionalidade de mudança de plano em breve!")
            }
          >
            Alterar Plano
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border-default">
        <CardContent className="space-y-4">
          <h3 className="font-headline font-semibold text-sm text-txt-primary">
            Método de Pagamento
          </h3>

          <div className="flex items-center gap-4 p-4 bg-surface-elevated rounded-lg">
            <div className="w-12 h-8 rounded bg-info flex items-center justify-center text-white text-xs font-bold">
              VISA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-txt-primary">
                •••• •••• •••• 4242
              </p>
              <p className="text-xs text-txt-muted">Expira em 12/2026</p>
            </div>
            <button
              onClick={() => toast.info("Funcionalidade de edição em breve!")}
              className="text-sm text-primary-600 hover:text-primary-400 font-medium transition-colors"
            >
              Editar
            </button>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() =>
              toast.info("Funcionalidade de adicionar cartão em breve!")
            }
          >
            Adicionar Método de Pagamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
