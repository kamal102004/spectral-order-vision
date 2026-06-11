import Papa from "papaparse";
import { Product, Platform, PLATFORMS } from "./mockData";
import {
  FileTypeConfig,
  FileTypeId,
  autoMap,
  detectFileType,
  getConfig,
  missingRequired,
} from "./fileTypes";

export type RawRow = Record<string, unknown>;

export type ParsedFile = {
  headers: string[];
  rows: RawRow[];
  detectedType: FileTypeId;
  config?: FileTypeConfig;
  mapping: Record<string, string | null>;
  missing: string[];
  preview: RawRow[]; // first 10 mapped rows
  warnings: string[];
  errors: string[];
};

function asNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).replace(/[, ₹$%]/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validPlatform(p: string): Platform {
  const n = p.trim().toLowerCase();
  const f = PLATFORMS.find((x) => x.toLowerCase() === n);
  if (f) return f;
  if (n.includes("blink")) return "Blinkit";
  if (n.includes("insta") || n.includes("swiggy")) return "Instamart";
  if (n.includes("zepto")) return "Zepto";
  return PLATFORMS[0];
}

// Apply a mapping to a raw row producing { fieldKey: typedValue }
export function mapRow(
  row: RawRow,
  config: FileTypeConfig,
  mapping: Record<string, string | null>
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const f of config.fields) {
    const src = mapping[f.key];
    const raw = src ? row[src] : undefined;
    out[f.key] = f.numeric ? asNumber(raw) : asString(raw);
  }
  return out;
}

// Convert mapped rows into inventory Products (only used when type === inventory)
export function rowsToProducts(
  rows: RawRow[],
  config: FileTypeConfig,
  mapping: Record<string, string | null>
): Product[] {
  const products: Product[] = [];
  let i = 0;
  for (const row of rows) {
    i++;
    const m = mapRow(row, config, mapping);
    products.push({
      id: `row-${i}`,
      name: String(m.name || `Product ${i}`),
      sku: String(m.sku || `SKU-${String(i).padStart(5, "0")}`),
      platform: validPlatform(String(m.platform || "")),
      city: String(m.city || "Unknown"),
      orderQty: Number(m.orderQty) || 0,
      poRequested: Number(m.poRequested) || 0,
      poFulfilled: Number(m.poFulfilled) || 0,
      poExpired: Number(m.poExpired) || 0,
      poOpen: Number(m.poOpen) || 0,
      stockDarkstore: Number(m.stockDarkstore) || 0,
      stockWarehouse: Number(m.stockWarehouse) || 0,
      stockOpenForRo: Number(m.stockOpenForRo) || 0,
      totalPos: Number(m.totalPos) || 0,
      openPos: Number(m.openPos) || 0,
      expiredPos: Number(m.expiredPos) || 0,
      fulfilledPos: Number(m.fulfilledPos) || 0,
      doh: Number(m.doh) || 0,
    });
  }
  return products;
}

export function parseFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const warnings: string[] = [];
        const errors: string[] = [];
        const headers = (results.meta.fields ?? []).filter(Boolean) as string[];

        if (!headers.length) {
          errors.push("No columns detected. Ensure the first row contains headers.");
          resolve({
            headers: [], rows: [], detectedType: "unknown", mapping: {},
            missing: [], preview: [], warnings, errors,
          });
          return;
        }

        const { type, config } = detectFileType(headers);

        if (!config) {
          warnings.push("Could not confidently detect the file type. Please map columns manually.");
          resolve({
            headers, rows: results.data, detectedType: "unknown",
            mapping: {}, missing: [], preview: results.data.slice(0, 10),
            warnings, errors,
          });
          return;
        }

        const mapping = autoMap(config, headers);
        const missing = missingRequired(config, mapping);
        if (results.errors.length) {
          warnings.push(
            ...results.errors.slice(0, 3).map((e) => `Row ${e.row ?? "?"}: ${e.message}`)
          );
        }

        resolve({
          headers,
          rows: results.data,
          detectedType: type,
          config,
          mapping,
          missing,
          preview: results.data.slice(0, 10),
          warnings,
          errors,
        });
      },
      error: (err) =>
        resolve({
          headers: [], rows: [], detectedType: "unknown",
          mapping: {}, missing: [], preview: [], warnings: [], errors: [err.message],
        }),
    });
  });
}

// Backwards-compat: keep old export but route through new parser (inventory only).
export type ParseResult = {
  products: Product[];
  rowCount: number;
  errors: string[];
  warnings: string[];
  detectedColumns: string[];
};

export async function parseProductCsv(file: File): Promise<ParseResult> {
  const r = await parseFile(file);
  if (r.detectedType !== "inventory" || !r.config) {
    return {
      products: [],
      rowCount: r.rows.length,
      errors: r.errors.length ? r.errors : ["Not an inventory file."],
      warnings: r.warnings,
      detectedColumns: r.headers,
    };
  }
  const products = rowsToProducts(r.rows, r.config, r.mapping);
  return {
    products,
    rowCount: products.length,
    errors: r.errors,
    warnings: r.warnings,
    detectedColumns: r.headers,
  };
}
