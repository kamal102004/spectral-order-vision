import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Label, LabelList, Legend, Line,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TREND, Product, aggregate } from "@/lib/mockData";
import { useMemo, useState } from "react";
import { Download, Maximize2, Tag } from "lucide-react";

const CHART_TYPES = ["Area", "Line", "Bar", "Combo"] as const;
type ChartType = (typeof CHART_TYPES)[number];

const METRICS = [
  { key: "requested", label: "Requested", color: "var(--chart-1)" },
  { key: "fulfilled", label: "Fulfilled", color: "var(--chart-2)" },
  { key: "expired", label: "Expired", color: "var(--chart-4)" },
  { key: "open", label: "Open", color: "var(--chart-3)" },
] as const;

const PERIOD_LABEL: Record<string, string> = {
  Daily: "Day", Weekly: "Week", Monthly: "Month", Quarterly: "Quarter", Yearly: "Year",
};

const fmt = (n: number) => Math.round(n).toLocaleString();

type Props = {
  products: Product[];
  period: string;
};

function GlassTooltip({ active, payload, label, periodLabel }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur-xl"
      style={{
        background: "oklch(0.18 0.006 250 / 0.92)",
        borderColor: "oklch(0.82 0.14 86 / 0.35)",
        boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)",
      }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-4 border-b border-white/10 pb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{periodLabel}</span>
        <span className="font-display text-sm text-gold">{label}</span>
      </div>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill || p.stroke }} />
              <span className="capitalize text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-mono font-semibold text-foreground">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ products, period }: Props) {
  const [type, setType] = useState<ChartType>("Area");
  const [active, setActive] = useState<string[]>(["requested", "fulfilled"]);
  const [showLabels, setShowLabels] = useState(false);

  const periodLabel = PERIOD_LABEL[period] ?? "Period";

  // Scale base trend by ratio of filtered to full dataset so filters reflect in chart
  const data = useMemo(() => {
    const agg = aggregate(products);
    const baseTotal = TREND.reduce((a, t) => a + t.requested, 0);
    const ratio = baseTotal ? (agg.poRequested * 12) / baseTotal : 1;
    const r = ratio || 0.0001;
    return TREND.map((t) => ({
      period: t.period,
      requested: Math.round(t.requested * r),
      fulfilled: Math.round(t.fulfilled * r),
      expired: Math.round(t.expired * r),
      open: Math.round(t.open * r),
    }));
  }, [products]);

  const toggle = (k: string) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  const singleMetric = active.length === 1;
  const showInlineLabels = showLabels || singleMetric;

  const labelProps = {
    position: "top" as const,
    fontSize: 10,
    fill: "oklch(0.92 0.02 90)",
    formatter: (v: number) => fmt(v),
  };

  const renderChart = () => {
    const common = (
      <>
        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis dataKey="period" stroke="oklch(0.72 0.012 90)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.72 0.012 90)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
        <Tooltip content={<GlassTooltip periodLabel={periodLabel} />} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      </>
    );

    const activeMetrics = METRICS.filter((m) => active.includes(m.key));

    if (type === "Bar") {
      return (
        <BarChart data={data}>
          {common}
          {activeMetrics.map((m) => (
            <Bar key={m.key} dataKey={m.key} name={m.label} fill={m.color} radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey={m.key} {...labelProps} />}
            </Bar>
          ))}
        </BarChart>
      );
    }
    if (type === "Line") {
      return (
        <LineChart data={data}>
          {common}
          {activeMetrics.map((m) => (
            <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2.5} dot={{ r: 3, fill: m.color }} activeDot={{ r: 5 }} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey={m.key} {...labelProps} />}
            </Line>
          ))}
        </LineChart>
      );
    }
    if (type === "Combo") {
      return (
        <ComposedChart data={data}>
          {common}
          {active.includes("requested") && (
            <Bar dataKey="requested" name="Requested" fill="var(--chart-1)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey="requested" {...labelProps} />}
            </Bar>
          )}
          {active.includes("open") && (
            <Bar dataKey="open" name="Open" fill="var(--chart-3)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey="open" {...labelProps} />}
            </Bar>
          )}
          {active.includes("fulfilled") && (
            <Line type="monotone" dataKey="fulfilled" name="Fulfilled" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey="fulfilled" {...labelProps} />}
            </Line>
          )}
          {active.includes("expired") && (
            <Line type="monotone" dataKey="expired" name="Expired" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive animationDuration={600}>
              {showInlineLabels && <LabelList dataKey="expired" {...labelProps} />}
            </Line>
          )}
        </ComposedChart>
      );
    }
    return (
      <AreaChart data={data}>
        <defs>
          {METRICS.map((m) => (
            <linearGradient key={m.key} id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={m.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {common}
        {activeMetrics.map((m) => (
          <Area key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2.5} fill={`url(#g-${m.key})`} isAnimationActive animationDuration={600}>
            {showInlineLabels && <LabelList dataKey={m.key} {...labelProps} />}
          </Area>
        ))}
      </AreaChart>
    );
  };

  const latest = data[data.length - 1];
  const latestPeriod = latest?.period;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-gold">Trend Analysis</h3>
          <p className="text-xs text-muted-foreground">Compare metrics across time · hover for exact values</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-black/20 p-1">
            {CHART_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  type === t ? "text-[var(--primary-foreground)]" : "text-muted-foreground hover:text-foreground"
                }`}
                style={type === t ? { background: "var(--gradient-gold)" } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowLabels((s) => !s)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              showLabels
                ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold-soft)]"
                : "border-white/10 text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle data labels on chart"
          >
            <Tag className="h-3.5 w-3.5" />
            Show Data Labels
          </button>
          <button className="glass rounded-lg p-2 hover:bg-white/5" aria-label="Download">
            <Download className="h-4 w-4 text-[var(--gold)]" />
          </button>
          <button className="glass rounded-lg p-2 hover:bg-white/5" aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4 text-[var(--gold)]" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {METRICS.map((m) => {
          const on = active.includes(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                on ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground" : "border-white/10 text-muted-foreground"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Latest values legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/5 pt-3 sm:grid-cols-4">
        {METRICS.filter((m) => active.includes(m.key)).map((m) => {
          const v = (latest as any)?.[m.key] ?? 0;
          return (
            <div key={m.key} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2 transition-all">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span key={v} className="font-mono text-lg font-semibold text-foreground animate-in fade-in slide-in-from-bottom-1 duration-500">
                  {fmt(v)}
                </span>
                <span className="text-[10px] text-muted-foreground">{latestPeriod}</span>
              </div>
            </div>
          );
        })}
        {active.length === 0 && (
          <p className="col-span-full text-center text-xs text-muted-foreground">Select a metric above to see latest values</p>
        )}
      </div>
    </div>
  );
}
