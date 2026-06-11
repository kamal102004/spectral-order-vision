import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { TREND } from "@/lib/mockData";
import { useState } from "react";
import { Download, Maximize2 } from "lucide-react";

const CHART_TYPES = ["Area", "Line", "Bar", "Combo"] as const;
type ChartType = (typeof CHART_TYPES)[number];

const METRICS = [
  { key: "requested", label: "Requested", color: "var(--chart-1)" },
  { key: "fulfilled", label: "Fulfilled", color: "var(--chart-2)" },
  { key: "expired", label: "Expired", color: "var(--chart-4)" },
  { key: "open", label: "Open", color: "var(--chart-3)" },
] as const;

export function TrendChart() {
  const [type, setType] = useState<ChartType>("Area");
  const [active, setActive] = useState<string[]>(["requested", "fulfilled"]);

  const toggle = (k: string) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  const tooltipStyle = {
    background: "oklch(0.2 0.006 250 / 0.95)",
    border: "1px solid oklch(0.82 0.14 86 / 0.35)",
    borderRadius: 12,
    backdropFilter: "blur(12px)",
    color: "white",
  };

  const renderChart = () => {
    const common = (
      <>
        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis dataKey="period" stroke="oklch(0.72 0.012 90)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.72 0.012 90)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
      </>
    );

    if (type === "Bar") {
      return (
        <BarChart data={TREND}>
          {common}
          {METRICS.filter((m) => active.includes(m.key)).map((m) => (
            <Bar key={m.key} dataKey={m.key} fill={m.color} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      );
    }
    if (type === "Line") {
      return (
        <LineChart data={TREND}>
          {common}
          {METRICS.filter((m) => active.includes(m.key)).map((m) => (
            <Line key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2.5} dot={false} />
          ))}
        </LineChart>
      );
    }
    if (type === "Combo") {
      return (
        <ComposedChart data={TREND}>
          {common}
          {active.includes("requested") && <Bar dataKey="requested" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />}
          {active.includes("fulfilled") && <Line type="monotone" dataKey="fulfilled" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />}
          {active.includes("expired") && <Line type="monotone" dataKey="expired" stroke="var(--chart-4)" strokeWidth={2} dot={false} />}
          {active.includes("open") && <Bar dataKey="open" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />}
        </ComposedChart>
      );
    }
    return (
      <AreaChart data={TREND}>
        <defs>
          {METRICS.map((m) => (
            <linearGradient key={m.key} id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={m.color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={m.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {common}
        {METRICS.filter((m) => active.includes(m.key)).map((m) => (
          <Area key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2.5} fill={`url(#g-${m.key})`} />
        ))}
      </AreaChart>
    );
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-gold">Trend Analysis</h3>
          <p className="text-xs text-muted-foreground">Compare metrics across time</p>
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
    </div>
  );
}
