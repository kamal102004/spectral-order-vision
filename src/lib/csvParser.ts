import Papa from "papaparse";
import { Product, Platform, PLATFORMS } from "./mockData";

// Map of normalized header → Product field. Keep keys lowercase + no spaces/symbols.
const HEADER_MAP: Record<string, keyof Product> = {
  // identity
  id: "id",
  productid: "id",
  itemid: "id",
  name: "name",
  product: "name",
  productname: "name",
  itemname: "name",
  title: "name",
  description: "name",
  sku: "sku",
  skuid: "sku",
  productsku: "sku",
  itemcode: "sku",
  code: "sku",
  ean: "sku",
  barcode: "sku",
  asin: "sku",
  // platform / city
  platform: "platform",
  marketplace: "platform",
  channel: "platform",
  source: "platform",
  city: "city",
  location: "city",
  region: "city",
  market: "city",
  // orders
  orderqty: "orderQty",
  orderquantity: "orderQty",
  orders: "orderQty",
  qty: "orderQty",
  quantity: "orderQty",
  unitssold: "orderQty",
  sales: "orderQty",
  // PO units
  porequested: "poRequested",
  requested: "poRequested",
  unitsrequested: "poRequested",
  porderqty: "poRequested",
  poqty: "poRequested",
  pofulfilled: "poFulfilled",
  fulfilled: "poFulfilled",
  unitsfulfilled: "poFulfilled",
  delivered: "poFulfilled",
  received: "poFulfilled",
  poexpired: "poExpired",
  expired: "poExpired",
  unitsexpired: "poExpired",
  poopen: "poOpen",
  open: "poOpen",
  unitsopen: "poOpen",
  pending: "poOpen",
  // stock
  stockdarkstore: "stockDarkstore",
  darkstorestock: "stockDarkstore",
  darkstore: "stockDarkstore",
  storestock: "stockDarkstore",
  stockwarehouse: "stockWarehouse",
  warehousestock: "stockWarehouse",
  warehouse: "stockWarehouse",
  whstock: "stockWarehouse",
  stockopenforro: "stockOpenForRo",
  openforro: "stockOpenForRo",
  rostock: "stockOpenForRo",
  // PO counts
  totalpos: "totalPos",
  totalpurchaseorders: "totalPos",
  pototal: "totalPos",
  openpos: "openPos",
  openpurchaseorders: "openPos",
  expiredpos: "expiredPos",
  fulfilledpos: "fulfilledPos",
  fulfilledpurchaseorders: "fulfilledPos",
  // doh
  doh: "doh",
  daysonhand: "doh",
  daysofinventory: "doh",
  doi: "doh",
  coverdays: "doh",
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s_\-./\\]+/g, "").replace(/[^a-z0-9]/g, "");
}

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
  const norm = p.trim().toLowerCase();
  const found = PLATFORMS.find((x) => x.toLowerCase() === norm);
  if (found) return found;
  // fuzzy
  if (norm.includes("blink")) return "Blinkit" as Platform;
  if (norm.includes("insta") || norm.includes("swiggy")) return "Instamart" as Platform;
  if (norm.includes("zepto")) return "Zepto" as Platform;
  return PLATFORMS[0];
}

export type ParseResult = {
  products: Product[];
  rowCount: number;
  errors: string[];
  warnings: string[];
  detectedColumns: string[];
};

export function parseProductCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (results.errors.length) {
          warnings.push(...results.errors.slice(0, 3).map((e) => `Row ${e.row ?? "?"}: ${e.message}`));
        }

        const rawHeaders = (results.meta.fields ?? []).filter(Boolean);

        if (rawHeaders.length === 0) {
          errors.push("No columns detected. Make sure the first row of your CSV contains column headers.");
          resolve({ products: [], rowCount: 0, errors, warnings, detectedColumns: [] });
          return;
        }

        const fieldMap = new Map<string, keyof Product>();
        const unmapped: string[] = [];
        for (const h of rawHeaders) {
          const norm = normalizeHeader(h);
          const mapped = HEADER_MAP[norm];
          if (mapped) fieldMap.set(h, mapped);
          else unmapped.push(h);
        }

        if (fieldMap.size === 0) {
          errors.push(
            `None of your columns matched expected fields. Detected: ${rawHeaders.join(", ")}. ` +
              `Try renaming at least one column to: name, sku, platform, city, requested, fulfilled, etc.`
          );
          resolve({ products: [], rowCount: 0, errors, warnings, detectedColumns: rawHeaders });
          return;
        }

        if (!fieldMap.has("name" as never) && ![...fieldMap.values()].includes("name")) {
          warnings.push("No product name column found — using row index as the product name.");
        }
        if (![...fieldMap.values()].includes("sku")) {
          warnings.push("No SKU column found — auto-generating SKUs.");
        }
        if (unmapped.length) {
          warnings.push(`Ignored unrecognized columns: ${unmapped.slice(0, 6).join(", ")}${unmapped.length > 6 ? "…" : ""}`);
        }

        const products: Product[] = [];
        let rowCount = 0;

        for (const row of results.data) {
          rowCount++;
          const p: Partial<Record<keyof Product, unknown>> = {};
          for (const [rawH, mapped] of fieldMap) {
            p[mapped] = row[rawH];
          }

          const product: Product = {
            id: asString(p.id) || `row-${rowCount}`,
            name: asString(p.name) || `Product ${rowCount}`,
            sku: asString(p.sku) || `SKU-${String(rowCount).padStart(5, "0")}`,
            platform: validPlatform(asString(p.platform)),
            city: asString(p.city) || "Unknown",
            orderQty: asNumber(p.orderQty),
            poRequested: asNumber(p.poRequested),
            poFulfilled: asNumber(p.poFulfilled),
            poExpired: asNumber(p.poExpired),
            poOpen: asNumber(p.poOpen),
            stockDarkstore: asNumber(p.stockDarkstore),
            stockWarehouse: asNumber(p.stockWarehouse),
            stockOpenForRo: asNumber(p.stockOpenForRo),
            totalPos: asNumber(p.totalPos),
            openPos: asNumber(p.openPos),
            expiredPos: asNumber(p.expiredPos),
            fulfilledPos: asNumber(p.fulfilledPos),
            doh: asNumber(p.doh),
          };

          products.push(product);
        }

        resolve({ products, rowCount, errors, warnings, detectedColumns: rawHeaders });
      },
      error: (err) =>
        resolve({ products: [], rowCount: 0, errors: [err.message], warnings: [], detectedColumns: [] }),
    });
  });
}
