import Papa from "papaparse";
import { Product, Platform, PLATFORMS } from "./mockData";

export type ReportType =
  | "product"
  | "campaign"
  | "targeting"
  | "inventory";

export type ReportSchema = {
  id: ReportType;
  label: string;
  description: string;
  /** Required logical fields */
  required: string[];
  /** Map of normalized header alias → logical field */
  aliases: Record<string, string>;
};

const baseAliases = {
  // product identity
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
};

export const REPORT_SCHEMAS: Record<ReportType, ReportSchema> = {
  product: {
    id: "product",
    label: "Product Analytics",
    description: "PO, stock & fulfillment at SKU level",
    required: [
      "name",
      "sku",
      "platform",
      "city",
      "orderQty",
      "poRequested",
      "poFulfilled",
      "poExpired",
      "poOpen",
      "stockDarkstore",
      "stockWarehouse",
      "doh",
    ],
    aliases: {
      ...baseAliases,
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
      openpos: "openPos",
      open_pos: "openPos",
      expiredpos: "expiredPos",
      expired_pos: "expiredPos",
      fulfilledpos: "fulfilledPos",
      fulfilled_pos: "fulfilledPos",
      doh: "doh",
      days_on_hand: "doh",
      days_of_inventory: "doh",
    },
  },
  campaign: {
    id: "campaign",
    label: "Campaign Analytics",
    description: "Spend, impressions, clicks & ROAS per campaign",
    required: [
      "campaignName",
      "platform",
      "spend",
      "impressions",
      "clicks",
      "orders",
      "revenue",
    ],
    aliases: {
      campaign: "campaignName",
      campaign_name: "campaignName",
      campaign_id: "campaignId",
      campaignid: "campaignId",
      platform: "platform",
      marketplace: "platform",
      spend: "spend",
      cost: "spend",
      ad_spend: "spend",
      impressions: "impressions",
      impr: "impressions",
      clicks: "clicks",
      ctr: "ctr",
      cpc: "cpc",
      orders: "orders",
      conversions: "orders",
      revenue: "revenue",
      sales: "revenue",
      roas: "roas",
    },
  },
  targeting: {
    id: "targeting",
    label: "Targeting Analytics",
    description: "Keyword & audience targeting performance",
    required: [
      "keyword",
      "matchType",
      "platform",
      "impressions",
      "clicks",
      "spend",
    ],
    aliases: {
      keyword: "keyword",
      search_term: "keyword",
      target: "keyword",
      match_type: "matchType",
      matchtype: "matchType",
      platform: "platform",
      marketplace: "platform",
      campaign: "campaignName",
      campaign_name: "campaignName",
      impressions: "impressions",
      clicks: "clicks",
      spend: "spend",
      cost: "spend",
      orders: "orders",
      conversions: "orders",
      revenue: "revenue",
      ctr: "ctr",
      cpc: "cpc",
      acos: "acos",
    },
  },
  inventory: {
    id: "inventory",
    label: "Inventory / PO Analytics",
    description: "Stock positions, PO status & DOH",
    required: [
      "sku",
      "platform",
      "city",
      "stockDarkstore",
      "stockWarehouse",
      "doh",
    ],
    aliases: {
      ...baseAliases,
      stockdarkstore: "stockDarkstore",
      stock_darkstore: "stockDarkstore",
      stockwarehouse: "stockWarehouse",
      stock_warehouse: "stockWarehouse",
      stockopenforro: "stockOpenForRo",
      stock_open_for_ro: "stockOpenForRo",
      totalpos: "totalPos",
      total_pos: "totalPos",
      openpos: "openPos",
      open_pos: "openPos",
      expiredpos: "expiredPos",
      expired_pos: "expiredPos",
      fulfilledpos: "fulfilledPos",
      fulfilled_pos: "fulfilledPos",
      doh: "doh",
      days_on_hand: "doh",
    },
  },
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function asNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function validPlatform(p: string): Platform | "Other" {
  const found = PLATFORMS.find((x) => x.toLowerCase() === p.trim().toLowerCase());
  return found ?? "Other";
}

export type ParseResult = {
  reportType: ReportType;
  /** Only populated for product reports — drives dashboard */
  products: Product[];
  /** Raw mapped rows for non-product reports */
  rows: Record<string, unknown>[];
  rowCount: number;
  detectedColumns: string[];
  missingColumns: string[];
  mapping: Record<string, string>;
  errors: string[];
};

export function parseCsv(file: File, reportType: ReportType): Promise<ParseResult> {
  const schema = REPORT_SCHEMAS[reportType];

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
        const mapping: Record<string, string> = {};
        for (const h of rawHeaders) {
          const mapped = schema.aliases[normalizeHeader(h)];
          if (mapped) mapping[h] = mapped;
        }

        const detected = Object.values(mapping);
        const missing = schema.required.filter((c) => !detected.includes(c));

        if (missing.length) {
          errors.push(
            `Missing required column${missing.length > 1 ? "s" : ""} for ${schema.label}: ${missing.join(", ")}`
          );
        }

        const rows: Record<string, unknown>[] = [];
        const products: Product[] = [];
        let rowCount = 0;

        for (const row of results.data) {
          rowCount++;
          const mapped: Record<string, unknown> = {};
          for (const [rawH, logical] of Object.entries(mapping)) {
            mapped[logical] = row[rawH];
          }
          rows.push(mapped);

          if (reportType === "product" && missing.length === 0) {
            products.push({
              id: asString(mapped.id) || `${rowCount}-${asString(mapped.sku)}`,
              name: asString(mapped.name) || `Product ${rowCount}`,
              sku: asString(mapped.sku) || `SKU-${rowCount}`,
              platform: validPlatform(asString(mapped.platform)) as Platform,
              city: asString(mapped.city) || "Unknown",
              orderQty: asNumber(mapped.orderQty),
              poRequested: asNumber(mapped.poRequested),
              poFulfilled: asNumber(mapped.poFulfilled),
              poExpired: asNumber(mapped.poExpired),
              poOpen: asNumber(mapped.poOpen),
              stockDarkstore: asNumber(mapped.stockDarkstore),
              stockWarehouse: asNumber(mapped.stockWarehouse),
              stockOpenForRo: asNumber(mapped.stockOpenForRo),
              totalPos: asNumber(mapped.totalPos),
              openPos: asNumber(mapped.openPos),
              expiredPos: asNumber(mapped.expiredPos),
              fulfilledPos: asNumber(mapped.fulfilledPos),
              doh: asNumber(mapped.doh),
            });
          }
        }

        resolve({
          reportType,
          products,
          rows,
          rowCount,
          detectedColumns: detected,
          missingColumns: missing,
          mapping,
          errors,
        });
      },
      error: (err) =>
        resolve({
          reportType,
          products: [],
          rows: [],
          rowCount: 0,
          detectedColumns: [],
          missingColumns: schema.required,
          mapping: {},
          errors: [err.message],
        }),
    });
  });
}

/** Back-compat */
export const parseProductCsv = (file: File) => parseCsv(file, "product");
