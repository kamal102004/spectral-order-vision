import { useMemo } from "react";
import { Activity, MousePointerClick, Eye, DollarSign, ShoppingBag, TrendingUp, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { KpiCard } from "./KpiCard";
import {
  KeywordRow, keywordKpis, topKeywords, highSpendLowRoas, bestCampaigns,
  matchTypeBreakdown, recommendations,
} from "@/lib/keywordAnalytics";

const GOLD = "#d4af37";
const GOLD_SOFT = "#e8c46b";

export function KeywordAnalytics({ rows }: { rows: KeywordRow[] }) {
  const kpis = useMemo(() => keywordKpis(rows), [rows]);
  const top = useMemo(() => topKeywords(rows), [rows]);
  const lowRoas = useMemo(() => highSpendLowRoas(rows), [rows]);
  const campaigns = useMemo(() => bestCampaigns(rows), [rows]);
  const mt = useMemo(() => matchTypeBreakdown(rows), [rows]);
  const recs = useMemo(() => recommendations(rows), [rows]);

  const fmtN = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtC = (n: number) => `₹${fmtN(n)}`;
  const fmtP = (n: number) => `${n.toFixed(2)}%`;
  const fmtX = (n: number) => `${n.toFixed(2)}x`;

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <section>
        <div className="mb-3">
          <h2 className="font-display text-xl text-gold">Keyword Performance</h2>
          <p className="text-xs text-muted-foreground">{kpis.keywords.toLocaleString()} keywords analysed from your upload</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCard label="Impressions" value={fmtN(kpis.impressions)} icon={<Eye className="h-4 w-4" />} delta={0} />
          <KpiCard label="Clicks" value={fmtN(kpis.clicks)} icon={<MousePointerClick className="h-4 w-4" />} delta={0} />
          <KpiCard label="CTR" value={fmtP(kpis.ctr)} icon={<Activity className="h-4 w-4" />} delta={0} accent />
          <KpiCard label="Spend" value={fmtC(kpis.spend)} icon={<DollarSign className="h-4 w-4" />} delta={0} />
          <KpiCard label="Sales" value={fmtC(kpis.sales)} icon={<ShoppingBag className="h-4 w-4" />} delta={0} />
          <KpiCard label="Orders" value={fmtN(kpis.orders)} icon={<ShoppingBag className="h-4 w-4" />} delta={0} />
          <KpiCard label="ROAS" value={fmtX(kpis.roas)} icon={<TrendingUp className="h-4 w-4" />} delta={0} accent />
          <KpiCard label="ACOS" value={fmtP(kpis.acos)} icon={<TrendingUp className="h-4 w-4" />} delta={0} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {/* Top keywords chart */}
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg text-gold">Top Keywords by Sales</h3>
            <span className="text-[11px] text-muted-foreground">Top {top.length}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top} margin={{ left: 0, right: 10, top: 10, bottom: 30 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="keyword" stroke="#9ca3af" fontSize={10} angle={-25} textAnchor="end" interval={0} height={60} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip
                contentStyle={{ background: "rgba(20,20,24,0.95)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 12 }}
                labelStyle={{ color: GOLD_SOFT }}
              />
              <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                {top.map((_, i) => <Cell key={i} fill={GOLD} fillOpacity={1 - i * 0.06} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations */}
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg text-gold">
            <Sparkles className="h-4 w-4" /> Optimization Tips
          </h3>
          <ul className="space-y-2">
            {recs.length === 0 && (
              <li className="text-xs text-muted-foreground">No critical issues detected — nice work.</li>
            )}
            {recs.map((r, i) => (
              <li key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-start gap-2">
                  {r.type === "positive" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${r.type === "alert" ? "text-rose-400" : "text-[var(--gold)]"}`} />
                  )}
                  <p className="text-xs text-foreground/90">{r.text}</p>
                </div>
                <span className="mt-1 inline-block rounded-full bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] text-[var(--gold-soft)]">
                  Impact: {r.impact}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {/* High spend low ROAS */}
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 font-display text-lg text-gold">High Spend, Low ROAS</h3>
          <Table
            headers={["Keyword", "Match", "Spend", "Sales", "ROAS"]}
            rows={lowRoas.map((r) => [
              r.keyword, r.matchType || "—", fmtC(r.spend), fmtC(r.sales), fmtX(r.roas || 0),
            ])}
          />
        </div>

        {/* Best campaigns */}
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-3 font-display text-lg text-gold">Best Performing Campaigns</h3>
          <Table
            headers={["Campaign", "Spend", "Sales", "ROAS", "ACOS"]}
            rows={campaigns.map((c) => [
              c.campaignName, fmtC(c.spend), fmtC(c.sales), fmtX(c.roas), fmtP(c.acos),
            ])}
          />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h3 className="mb-3 font-display text-lg text-gold">Match Type Analysis</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={mt}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="matchType" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip contentStyle={{ background: "rgba(20,20,24,0.95)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 12 }} />
            <Bar dataKey="spend" fill={GOLD} radius={[6, 6, 0, 0]} />
            <Bar dataKey="sales" fill={GOLD_SOFT} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => (
              <th key={h} className="border-b border-white/5 px-2 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="px-2 py-6 text-center text-muted-foreground">No data</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-white/[0.03]">
              {r.map((c, j) => (
                <td key={j} className="border-b border-white/5 px-2 py-2 text-foreground/90">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
