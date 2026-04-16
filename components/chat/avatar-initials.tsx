import { cn } from "@/lib/utils";

interface AvatarInitialsProps {
  name: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const AVATAR_COLORS = [
  "bg-primary-600",
  "bg-secondary-600",
  "bg-tertiary-400",
  "bg-info",
  "bg-primary-800",
  "bg-warning",
  "bg-danger",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

export function AvatarInitials({ name, size = "md", className }: AvatarInitialsProps) {
  const colorClass = name ? getColorFromName(name) : "bg-neutral-400";
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-headline font-bold text-white flex-shrink-0",
        sizeClasses[size],
        colorClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
