import Papa from "papaparse";
import { Product, Platform, PLATFORMS } from "./mockData";

const HEADER_MAP: Record<string, keyof Product> = {
  id: "id",
  name: "name",
  product: "name",
  product_name: "name",
  sku: "sku",
  sku_id: "sku",
  product_sku: "sku",
  platform: "platform",
  marketplace: "platform",
  city: "city",
  location: "city",
  orderqty: "orderQty",
  order_qty: "orderQty",
  orders: "orderQty",
  order_quantity: "orderQty",
  porequested: "poRequested",
  po_requested: "poRequested",
  requested: "poRequested",
  units_requested: "poRequested",
  pofulfilled: "poFulfilled",
  po_fulfilled: "poFulfilled",
  fulfilled: "poFulfilled",
  units_fulfilled: "poFulfilled",
  poexpired: "poExpired",
  po_expired: "poExpired",
  expired: "poExpired",
  poopen: "poOpen",
  po_open: "poOpen",
  open: "poOpen",
  stockdarkstore: "stockDarkstore",
  stock_darkstore: "stockDarkstore",
  darkstore_stock: "stockDarkstore",
  stockwarehouse: "stockWarehouse",
  stock_warehouse: "stockWarehouse",
  warehouse_stock: "stockWarehouse",
  stockopenforro: "stockOpenForRo",
  stock_open_for_ro: "stockOpenForRo",
  totalpos: "totalPos",
  total_pos: "totalPos",
  total_purchase_orders: "totalPos",
  openpos: "openPos",
  open_pos: "openPos",
  open_purchase_orders: "openPos",
  expiredpos: "expiredPos",
  expired_pos: "expiredPos",
  fulfilledpos: "fulfilledPos",
  fulfilled_pos: "fulfilledPos",
  fulfilled_purchase_orders: "fulfilledPos",
  doh: "doh",
  days_on_hand: "doh",
  days_of_inventory: "doh",
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function asNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validPlatform(p: string): Platform | "Other" {
  const norm = p.trim();
  const found = PLATFORMS.find((x) => x.toLowerCase() === norm.toLowerCase());
  return found ?? "Other";
}

export type ParseResult = {
  products: Product[];
  rowCount: number;
  errors: string[];
};

export function parseProductCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        if (results.errors.length) {
          errors.push(...results.errors.slice(0, 5).map((e) => e.message));
        }

        const rawHeaders = results.meta.fields ?? [];
        const fieldMap = new Map<string, keyof Product>();
        for (const h of rawHeaders) {
          const norm = normalizeHeader(h);
          const mapped = HEADER_MAP[norm];
          if (mapped) fieldMap.set(h, mapped);
        }

        if (!fieldMap.has("name") && !fieldMap.has("sku")) {
          errors.push(
            "Could not find recognizable product columns (name, sku). Please check your CSV headers."
          );
        }

        const products: Product[] = [];
        let rowCount = 0;

        for (const row of results.data) {
          rowCount++;
          const p = {} as Record<keyof Product, unknown>;
          for (const [rawH, mapped] of fieldMap) {
            p[mapped] = row[rawH];
          }

          const platformVal = validPlatform(asString(p.platform));
          const id = asString(p.id) || `${rowCount}-${asString(p.sku)}`;

          const product: Product = {
            id,
            name: asString(p.name) || `Product ${rowCount}`,
            sku: asString(p.sku) || `SKU-${rowCount}`,
            platform: platformVal as Platform,
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

        resolve({ products, rowCount, errors });
      },
      error: (err) => resolve({ products: [], rowCount: 0, errors: [err.message] }),
    });
  });
}
