import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { INSIGHTS } from "@/lib/mockData";

const ICONS = {
  alert: <AlertTriangle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  trend: <TrendingDown className="h-4 w-4" />,
  positive: <TrendingUp className="h-4 w-4" />,
};

const TONE: Record<string, string> = {
  alert: "text-[var(--destructive)] bg-[var(--destructive)]/10",
  warning: "text-[var(--warning)] bg-[var(--warning)]/10",
  trend: "text-[var(--gold)] bg-[var(--gold)]/10",
  positive: "text-[var(--success)] bg-[var(--success)]/10",
};

export function InsightsPanel() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-gold)" }}>
          <Sparkles className="h-4 w-4 text-[var(--primary-foreground)]" />
        </div>
        <div>
          <h3 className="font-display text-lg text-gold leading-tight">Insights Engine</h3>
          <p className="text-[11px] text-muted-foreground">Auto-generated from your data</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {INSIGHTS.map((i, idx) => (
          <li
            key={idx}
            className="group flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3 transition hover:border-[var(--gold)]/30"
          >
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${TONE[i.type]}`}>
              {ICONS[i.type as keyof typeof ICONS]}
            </div>
            <div className="flex-1">
              <p className="text-sm leading-snug text-foreground/90">{i.text}</p>
              <span className="mt-1 inline-block text-[10px] uppercase tracking-wider text-muted-foreground">
                Impact · {i.impact}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
