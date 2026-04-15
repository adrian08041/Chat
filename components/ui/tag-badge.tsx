export function TagBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {name}
    </span>
  );
}
