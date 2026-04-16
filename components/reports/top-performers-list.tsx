import { AvatarInitials } from "@/components/chat/avatar-initials";
import type { TopPerformerData } from "@/types/report";

interface Props {
  data: TopPerformerData[];
}

export function TopPerformersList({ data }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {data.map((performer, index) => (
        <div
          key={performer.nome}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <span className="font-headline text-base font-bold text-txt-muted w-7">
            #{index + 1}
          </span>
          <AvatarInitials name={performer.nome} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-txt-primary truncate">
              {performer.nome}
            </p>
            <p className="text-xs text-txt-muted">
              {performer.conversas} conversas
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-txt-secondary">{performer.tempoMedio}</p>
            <p className="text-xs text-txt-muted">Tempo médio</p>
          </div>
          <div className="text-right min-w-[56px]">
            <p className="text-sm font-bold text-primary-600">
              {performer.taxaResolucao.toFixed(1).replace(".", ",")}%
            </p>
            <p className="text-xs text-txt-muted">Taxa</p>
          </div>
        </div>
      ))}
    </div>
  );
}
