import { FileTypeConfig } from "./fileTypes";
import { RawRow, mapRow } from "./csvParser";

export type KeywordRow = {
  keyword: string;
  matchType: string;
  campaignId: string;
  campaignName: string;
  campaignType: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  orders: number;
  sales: number;
  roas: number;
  acos: number;
};

export function buildKeywordRows(
  rows: RawRow[],
  config: FileTypeConfig,
  mapping: Record<string, string | null>
): KeywordRow[] {
  return rows.map((r) => {
    const m = mapRow(r, config, mapping) as unknown as KeywordRow;
    // Derive missing metrics
    if (!m.ctr && m.impressions) m.ctr = (m.clicks / m.impressions) * 100;
    if (!m.roas && m.spend) m.roas = m.sales / m.spend;
    if (!m.acos && m.sales) m.acos = (m.spend / m.sales) * 100;
    return m;
  });
}

export function keywordKpis(rows: KeywordRow[]) {
  const sum = (k: keyof KeywordRow) =>
    rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const impressions = sum("impressions");
  const clicks = sum("clicks");
  const spend = sum("spend");
  const sales = sum("sales");
  const orders = sum("orders");
  return {
    impressions,
    clicks,
    spend,
    sales,
    orders,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    roas: spend ? sales / spend : 0,
    acos: sales ? (spend / sales) * 100 : 0,
    keywords: rows.length,
  };
}

export function topKeywords(rows: KeywordRow[], n = 10) {
  return [...rows].sort((a, b) => b.sales - a.sales).slice(0, n);
}

export function highSpendLowRoas(rows: KeywordRow[], n = 10) {
  const med = median(rows.map((r) => r.spend).filter((s) => s > 0));
  return rows
    .filter((r) => r.spend >= med && (r.roas || 0) < 1.5)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, n);
}

export function bestCampaigns(rows: KeywordRow[], n = 8) {
  const map = new Map<string, KeywordRow & { count: number }>();
  for (const r of rows) {
    const k = r.campaignName || r.campaignId || "Unknown";
    const cur = map.get(k);
    if (cur) {
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.spend += r.spend;
      cur.sales += r.sales;
      cur.orders += r.orders;
      cur.count++;
    } else {
      map.set(k, { ...r, campaignName: k, count: 1 });
    }
  }
  return [...map.values()]
    .map((c) => ({
      ...c,
      ctr: c.impressions ? (c.clicks / c.impressions) * 100 : 0,
      roas: c.spend ? c.sales / c.spend : 0,
      acos: c.sales ? (c.spend / c.sales) * 100 : 0,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, n);
}

export function matchTypeBreakdown(rows: KeywordRow[]) {
  const map = new Map<string, { matchType: string; spend: number; sales: number; clicks: number; impressions: number; keywords: number }>();
  for (const r of rows) {
    const mt = (r.matchType || "unknown").toLowerCase();
    const cur = map.get(mt) ?? { matchType: mt, spend: 0, sales: 0, clicks: 0, impressions: 0, keywords: 0 };
    cur.spend += r.spend;
    cur.sales += r.sales;
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.keywords++;
    map.set(mt, cur);
  }
  return [...map.values()].map((m) => ({
    ...m,
    roas: m.spend ? m.sales / m.spend : 0,
    acos: m.sales ? (m.spend / m.sales) * 100 : 0,
  }));
}

export function recommendations(rows: KeywordRow[]): { type: string; text: string; impact: "High" | "Med" | "Low" }[] {
  const recs: { type: string; text: string; impact: "High" | "Med" | "Low" }[] = [];
  const wasted = rows.filter((r) => r.spend > 0 && r.sales === 0);
  if (wasted.length)
    recs.push({
      type: "alert",
      text: `Pause ${wasted.length} keywords spending with zero sales (₹${Math.round(wasted.reduce((a, r) => a + r.spend, 0)).toLocaleString()} wasted).`,
      impact: "High",
    });

  const lowCtr = rows.filter((r) => r.impressions > 1000 && r.ctr < 0.2);
  if (lowCtr.length)
    recs.push({
      type: "warning",
      text: `${lowCtr.length} keywords have <0.2% CTR despite high impressions — refresh creatives or refine match type.`,
      impact: "Med",
    });

  const winners = rows.filter((r) => r.roas > 4 && r.clicks > 20);
  if (winners.length)
    recs.push({
      type: "positive",
      text: `Scale ${winners.length} winning keywords (ROAS > 4×) by raising bids or budgets.`,
      impact: "High",
    });

  const lowRoas = highSpendLowRoas(rows);
  if (lowRoas.length)
    recs.push({
      type: "alert",
      text: `${lowRoas.length} high-spend keywords below ROAS 1.5× — review bids or negate underperforming search terms.`,
      impact: "High",
    });

  return recs;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
