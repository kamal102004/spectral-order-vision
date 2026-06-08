import { useMemo, useState } from "react";
import { ArrowUpDown, Columns3, Download } from "lucide-react";
import { Product } from "@/lib/mockData";

const COLUMNS = [
  { key: "name", label: "Product", always: true },
  { key: "sku", label: "SKU", always: true },
  { key: "platform", label: "Platform" },
  { key: "orderQty", label: "Order Qty" },
  { key: "poRequested", label: "PO Requested" },
  { key: "poFulfilled", label: "PO Fulfilled" },
  { key: "poExpired", label: "PO Expired" },
  { key: "poOpen", label: "PO Open" },
  { key: "stockDarkstore", label: "Stock DS" },
  { key: "stockWarehouse", label: "Stock WH" },
  { key: "doh", label: "DOH" },
  { key: "fulfillment", label: "Fulfillment %" },
] as const;

type Props = { products: Product[]; onSelect: (p: Product) => void };

export function ProductTable({ products, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<string>("poRequested");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [showCols, setShowCols] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const pageSize = 8;

  const rows = useMemo(() => {
    const withPct = products.map((p) => ({
      ...p,
      fulfillment: p.poRequested ? (p.poFulfilled / p.poRequested) * 100 : 0,
    }));
    return withPct.sort((a: any, b: any) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      return asc ? av - bv : bv - av;
    });
  }, [products, sortKey, asc]);

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const visible = COLUMNS.filter((c) => c.always || !hidden.includes(c.key));

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-gold">Product Performance</h3>
          <p className="text-xs text-muted-foreground">{rows.length} SKUs · click any row to drill down</p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setShowCols((s) => !s)}
            className="glass flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs hover:bg-white/5"
          >
            <Columns3 className="h-3.5 w-3.5 text-[var(--gold)]" /> Columns
          </button>
          {showCols && (
            <div className="absolute right-24 top-10 z-20 w-56 rounded-xl border border-white/10 bg-zinc-900/95 p-2 backdrop-blur-xl">
              {COLUMNS.filter((c) => !c.always).map((c) => (
                <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={!hidden.includes(c.key)}
                    onChange={() =>
                      setHidden((h) => (h.includes(c.key) ? h.filter((x) => x !== c.key) : [...h, c.key]))
                    }
                    className="accent-[var(--gold)]"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
          <button className="glass flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs hover:bg-white/5">
            <Download className="h-3.5 w-3.5 text-[var(--gold)]" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              {visible.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() => {
                      if (sortKey === c.key) setAsc(!asc);
                      else { setSortKey(c.key); setAsc(false); }
                    }}
                  >
                    {c.label}
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p: any) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className="cursor-pointer border-t border-white/5 transition hover:bg-[var(--gold)]/5"
              >
                {visible.map((c) => {
                  const v = p[c.key];
                  if (c.key === "name") {
                    return <td key={c.key} className="px-4 py-3 font-medium">{v}</td>;
                  }
                  if (c.key === "platform") {
                    return (
                      <td key={c.key} className="px-4 py-3">
                        <span className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-2 py-0.5 text-[11px] text-[var(--gold-soft)]">
                          {v}
                        </span>
                      </td>
                    );
                  }
                  if (c.key === "fulfillment") {
                    const val = Number(v).toFixed(1);
                    const tone = v >= 85 ? "text-[var(--success)]" : v >= 70 ? "text-[var(--warning)]" : "text-[var(--destructive)]";
                    return (
                      <td key={c.key} className={`px-4 py-3 font-semibold ${tone}`}>
                        {val}%
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className="px-4 py-3 tabular-nums text-foreground/85">
                      {typeof v === "number" ? v.toLocaleString() : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="glass rounded-md px-3 py-1 hover:bg-white/5"
          >Prev</button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="glass rounded-md px-3 py-1 hover:bg-white/5"
          >Next</button>
        </div>
      </div>
    </div>
  );
}
