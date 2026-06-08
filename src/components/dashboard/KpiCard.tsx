import { X, TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  delta?: number;
  icon?: ReactNode;
  onRemove?: () => void;
  accent?: boolean;
};

export function KpiCard({ label, value, delta, icon, onRemove, accent }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${
        accent ? "glass-gold" : "glass"
      }`}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--gold)]/10 blur-2xl" />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-[var(--gold)]">{icon}</div>}
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-white/5 hover:text-foreground group-hover:opacity-100"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="font-display text-3xl font-semibold leading-none text-gold">{value}</div>
        {delta !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              positive ? "text-[var(--success)]" : "text-[var(--destructive)]"
            }`}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
