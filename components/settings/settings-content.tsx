"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Lock,
  Palette,
  MessageSquare,
  Globe,
  CreditCard,
  Users,
  Shield,
} from "lucide-react";
import { SettingsNav, type SettingsSection } from "@/components/settings/settings-nav";
import { ProfileSection } from "@/components/settings/profile-section";
import { NotificationsSection } from "@/components/settings/notifications-section";
import { SecuritySection } from "@/components/settings/security-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { MessagingSection } from "@/components/settings/messaging-section";
import { LanguageSection } from "@/components/settings/language-section";
import { BillingSection } from "@/components/settings/billing-section";
import { TeamSection } from "@/components/settings/team-section";
import { PrivacySection } from "@/components/settings/privacy-section";

const SECTIONS: SettingsSection[] = [
  { id: "profile", name: "Perfil", icon: User, description: "Gerencie suas informações pessoais" },
  { id: "notifications", name: "Notificações", icon: Bell, description: "Configure alertas e notificações" },
  { id: "security", name: "Segurança", icon: Lock, description: "Senha e autenticação" },
  { id: "appearance", name: "Aparência", icon: Palette, description: "Tema e personalização" },
  { id: "messaging", name: "Mensagens", icon: MessageSquare, description: "Preferências de mensagens" },
  { id: "language", name: "Idioma e Região", icon: Globe, description: "Idioma, fuso horário e formato" },
  { id: "billing", name: "Pagamento", icon: CreditCard, description: "Planos e faturamento" },
  { id: "team", name: "Equipe", icon: Users, description: "Gerenciar membros da equipe" },
  { id: "privacy", name: "Privacidade", icon: Shield, description: "Controle de dados e privacidade" },
];

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  profile: ProfileSection,
  notifications: NotificationsSection,
  security: SecuritySection,
  appearance: AppearanceSection,
  messaging: MessagingSection,
  language: LanguageSection,
  billing: BillingSection,
  team: TeamSection,
  privacy: PrivacySection,
};

export function SettingsContent() {
  const [activeSection, setActiveSection] = useState("profile");
  const ActiveComponent = SECTION_COMPONENTS[activeSection] ?? ProfileSection;

  return (
    <div className="flex flex-1 overflow-hidden">
      <SettingsNav
        sections={SECTIONS}
        activeSection={activeSection}
        onSelect={setActiveSection}
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="font-headline text-2xl font-bold text-txt-primary">
            Configurações
          </h2>
          <p className="text-sm text-txt-muted mt-1">
            Gerencie as configurações da sua conta e preferências
          </p>
        </div>
        <ActiveComponent />
      </main>
    </div>
  );
}
