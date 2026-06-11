import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Boxes, Package, PackageCheck, PackageX, ShoppingCart, Sparkles, Truck,
  Warehouse, Plus, Activity, Gauge, ClipboardList,
} from "lucide-react";
import { aggregate, Platform, Product, PRODUCTS } from "@/lib/mockData";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { ProductTable } from "@/components/dashboard/ProductTable";
import { ProductDrillDown } from "@/components/dashboard/ProductDrillDown";
import { UploadPanel, UploadResult } from "@/components/dashboard/UploadPanel";
import { KeywordAnalytics } from "@/components/dashboard/KeywordAnalytics";
import { rowsToProducts } from "@/lib/csvParser";
import { buildKeywordRows } from "@/lib/keywordAnalytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurum — Marketplace PO Analytics" },
      { name: "description", content: "Grey & gold glassy analytics for Blinkit, Instamart and Zepto PO, stock, fulfillment and vendor performance." },
      { property: "og:title", content: "Aurum — Marketplace PO Analytics" },
      { property: "og:description", content: "Magic-feel analytics platform for marketplace operations." },
    ],
  }),
  component: Dashboard,
});

const ALL_KPIS = [
  { key: "orderQty", label: "Total Order Qty", icon: <ShoppingCart className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "stockDarkstore", label: "Stock at Darkstore", icon: <Package className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "stockWarehouse", label: "Stock at Warehouse", icon: <Warehouse className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "totalStock", label: "Total Stock", icon: <Boxes className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "stockOpenForRo", label: "Stock Open For RO", icon: <Truck className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "poRequested", label: "PO Units Requested", icon: <ClipboardList className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "poFulfilled", label: "PO Units Fulfilled", icon: <PackageCheck className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "poExpired", label: "PO Units Expired", icon: <PackageX className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "poOpen", label: "PO Units Open", icon: <Activity className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "fulfillment", label: "Fulfillment %", icon: <Gauge className="h-4 w-4" />, fmt: (v: number) => `${v.toFixed(1)}%`, accent: true },
  { key: "totalPos", label: "Total POs", icon: <ClipboardList className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "openPos", label: "Open POs", icon: <ClipboardList className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "expiredPos", label: "Expired POs", icon: <PackageX className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "fulfilledPos", label: "Fulfilled POs", icon: <PackageCheck className="h-4 w-4" />, fmt: (v: number) => v.toLocaleString() },
  { key: "doh", label: "DOH (days)", icon: <Gauge className="h-4 w-4" />, fmt: (v: number) => `${v}d` },
] as const;

function Dashboard() {
  const [platform, setPlatform] = useState<Platform | "All">("All");
  const [city, setCity] = useState("All");
  const [period, setPeriod] = useState("Monthly");
  const [query, setQuery] = useState("");
  const [activeKpis, setActiveKpis] = useState<string[]>([
    "orderQty", "totalStock", "poRequested", "poFulfilled", "fulfillment", "poOpen", "doh", "expiredPos",
  ]);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [upload, setUpload] = useState<UploadResult | null>(null);

  const uploadedProducts = useMemo(() => {
    if (!upload || !upload.parsed.config || upload.parsed.detectedType !== "inventory") return null;
    return rowsToProducts(upload.parsed.rows, upload.parsed.config, upload.mapping);
  }, [upload]);

  const keywordRows = useMemo(() => {
    if (!upload || !upload.parsed.config || upload.parsed.detectedType !== "keyword") return null;
    return buildKeywordRows(upload.parsed.rows, upload.parsed.config, upload.mapping);
  }, [upload]);

  const dataSource = uploadedProducts ?? PRODUCTS;

  const filtered = useMemo(() => {
    return dataSource.filter(
      (p) =>
        (platform === "All" || p.platform === platform) &&
        (city === "All" || p.city === city) &&
        (!query ||
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()))
    );
  }, [dataSource, platform, city, query]);

  const agg = useMemo(() => aggregate(filtered), [filtered]);

  const available = ALL_KPIS.filter((k) => !activeKpis.includes(k.key));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto max-w-[1400px] px-6 pt-6">
        <div className="glass flex items-center justify-between rounded-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl shadow-[var(--shadow-gold)]" style={{ background: "var(--gradient-gold)" }}>
              <Sparkles className="h-5 w-5 text-[var(--primary-foreground)]" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none">
                <span className="text-gold">Aurum</span>
              </h1>
              <p className="text-[11px] tracking-wider text-muted-foreground">MARKETPLACE PO ANALYTICS</p>
            </div>
          </div>
          <nav className="hidden gap-1 text-xs text-muted-foreground md:flex">
            {["Overview", "Products", "Vendors", "Stock", "Insights", "Admin"].map((n, i) => (
              <button
                key={n}
                className={`rounded-lg px-3.5 py-1.5 transition ${i === 0 ? "bg-[var(--gold)]/10 text-[var(--gold-soft)]" : "hover:text-foreground"}`}
              >
                {n}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden text-right md:block">
              <p className="text-xs font-medium">Aarav Mehta</p>
              <p className="text-[10px] text-muted-foreground">Analyst</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-xs font-semibold text-[var(--gold-soft)]">
              AM
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-6 py-5">
        <FiltersBar
          platform={platform} setPlatform={setPlatform}
          city={city} setCity={setCity}
          period={period} setPeriod={setPeriod}
          query={query} setQuery={setQuery}
        />

        <UploadPanel
          onApply={setUpload}
          activeLabel={upload?.parsed.config?.name}
        />

        {keywordRows ? (
          <KeywordAnalytics rows={keywordRows} />
        ) : upload && upload.parsed.detectedType !== "inventory" && upload.parsed.detectedType !== "unknown" ? (
          <section className="glass rounded-2xl p-6 text-center">
            <h2 className="font-display text-xl text-gold">
              {upload.parsed.config?.name} loaded
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {upload.parsed.rows.length.toLocaleString()} rows imported. Tailored analytics for this file type are coming soon — your data is ready to query.
            </p>
          </section>
        ) : (<></>)}

        {/* KPI Grid */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-gold">Overview</h2>
              <p className="text-xs text-muted-foreground">Customise the metrics that matter to you</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setAdding((a) => !a)}
                className="glass-gold flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--gold-soft)]"
              >
                <Plus className="h-3.5 w-3.5" /> Add KPI
              </button>
              {adding && (
                <div className="absolute right-0 top-12 z-20 max-h-72 w-64 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 p-2 backdrop-blur-xl">
                  {available.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-muted-foreground">All metrics added.</p>
                  ) : (
                    available.map((k) => (
                      <button
                        key={k.key}
                        onClick={() => { setActiveKpis((a) => [...a, k.key]); setAdding(false); }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-white/5"
                      >
                        <span className="text-[var(--gold)]">{k.icon}</span>
                        {k.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {activeKpis.map((key) => {
              const def = ALL_KPIS.find((k) => k.key === key)!;
              const value = def.fmt((agg as any)[key]);
              const delta = ((key.charCodeAt(0) % 13) - 6) * 1.3;
              return (
                <KpiCard
                  key={key}
                  label={def.label}
                  value={value}
                  delta={delta}
                  icon={def.icon}
                  accent={(def as any).accent}
                  onRemove={() => setActiveKpis((a) => a.filter((x) => x !== key))}
                />
              );
            })}
          </div>
        </section>

        {/* Trend + Insights */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2"><TrendChart /></div>
          <InsightsPanel />
        </section>

        {/* Product Table */}
        <section>
          <ProductTable products={filtered} onSelect={setSelected} />
        </section>

        <footer className="pt-4 pb-8 text-center text-[11px] text-muted-foreground">
          Aurum · Crafted for marketplace operators · Grey & Gold edition
        </footer>
      </main>

      <ProductDrillDown product={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
