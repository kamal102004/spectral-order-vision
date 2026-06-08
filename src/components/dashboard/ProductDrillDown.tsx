import { X } from "lucide-react";
import { useState } from "react";
import { CITIES, Product, VENDORS } from "@/lib/mockData";

type Props = { product: Product | null; onClose: () => void };

const TABS = ["City View", "Vendor View", "PO View", "Actions"] as const;
type Tab = (typeof TABS)[number];

export function ProductDrillDown({ product, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("City View");
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl">
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--gold)]/15 blur-3xl" />
        <div className="flex items-start justify-between border-b border-white/5 p-6">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Drill Down</p>
            <h2 className="font-display text-2xl text-gold">{product.name}</h2>
            <p className="text-xs text-muted-foreground">{product.sku} · {product.platform}</p>
          </div>
          <button onClick={onClose} className="glass rounded-lg p-2 hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/5 px-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-sm transition ${
                tab === t ? "text-[var(--gold-soft)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: "var(--gradient-gold)" }} />
              )}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {tab === "City View" && <CityView product={product} />}
          {tab === "Vendor View" && <VendorView product={product} />}
          {tab === "PO View" && <POView product={product} />}
          {tab === "Actions" && <ActionsView />}
        </div>
      </div>
    </div>
  );
}

function CityView({ product }: { product: Product }) {
  const rows = CITIES.map((c, i) => {
    const mult = 0.5 + ((i * 13) % 100) / 100;
    return {
      city: c,
      orderQty: Math.round(product.orderQty * mult),
      poRequested: Math.round(product.poRequested * mult),
      totalStock: Math.round((product.stockDarkstore + product.stockWarehouse) * mult),
      totalPos: Math.round(product.totalPos * mult),
      doh: Math.round(product.doh * mult),
      fulfillment: 60 + ((i * 7) % 35),
    };
  });
  return <SimpleTable headers={["City", "Order Qty", "PO Req", "Stock", "POs", "DOH", "Fulfillment %"]} rows={rows.map(r => [r.city, r.orderQty, r.poRequested, r.totalStock, r.totalPos, r.doh, `${r.fulfillment}%`])} />;
}

function VendorView({ product }: { product: Product }) {
  const rows = VENDORS.map((v, i) => ({
    vendor: v,
    city: CITIES[i % CITIES.length],
    req: Math.round(product.poRequested * (0.3 + (i * 11) % 70 / 100)),
    fulfilled: Math.round(product.poFulfilled * (0.3 + (i * 7) % 70 / 100)),
    open: Math.round(product.poOpen * (0.3 + (i * 5) % 70 / 100)),
    expired: Math.round(product.poExpired * (0.3 + (i * 3) % 70 / 100)),
  }));
  return <SimpleTable headers={["Vendor", "City", "Requested", "Fulfilled", "Open", "Expired"]} rows={rows.map(r => [r.vendor, r.city, r.req, r.fulfilled, r.open, r.expired])} />;
}

function POView({ product }: { product: Product }) {
  const rows = Array.from({ length: 8 }).map((_, i) => {
    const req = 200 + ((i * 37) % 1500);
    const ful = Math.round(req * (0.5 + (i * 7) % 50 / 100));
    const exp = Math.round(req * 0.1);
    const open = Math.max(0, req - ful - exp);
    const statuses = ["Open", "Fulfilled", "Expired", "Partial"];
    return [`PO-${10000 + i}-${product.platform.slice(0,2).toUpperCase()}`, `2025-0${(i % 9) + 1}-${10 + i}`, req, ful, exp, open, statuses[i % statuses.length]];
  });
  return <SimpleTable headers={["PO Number", "PO Date", "Requested", "Fulfilled", "Expired", "Open", "Status"]} rows={rows} />;
}

function ActionsView() {
  const cards = [
    { title: "Root Cause Analysis", body: "Fulfillment dipped due to vendor delivery delays in Bangalore zone for SKUs > 5kg." },
    { title: "Stock Issues", body: "Darkstore stock falling below 7-day DOH threshold across 3 cities." },
    { title: "Vendor Issues", body: "Galaxy Commercials missed 12% of PO commitments in the last 30 days." },
    { title: "Fulfillment Issues", body: "Open POs aging beyond 14 days. Recommend escalation to ops lead." },
    { title: "Suggested Actions", body: "Re-route 18% of replenishment to Apex Distributors. Increase safety stock by 12%." },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.title} className="glass-gold rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-wider text-[var(--gold-soft)]">{c.title}</p>
          <p className="mt-2 text-sm text-foreground/90">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-black/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            {headers.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5 hover:bg-[var(--gold)]/5">
              {r.map((c, j) => <td key={j} className="px-4 py-3 tabular-nums">{typeof c === "number" ? c.toLocaleString() : c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
