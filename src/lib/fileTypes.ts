// File type configs for the multi-format CSV upload engine.

export type FileTypeId =
  | "inventory"
  | "campaign"
  | "keyword"
  | "search_term"
  | "product_performance"
  | "unknown";

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  numeric?: boolean;
  aliases: string[]; // normalized (lowercase, no spaces/symbols)
};

export type FileTypeConfig = {
  id: FileTypeId;
  name: string;
  description: string;
  fields: FieldDef[];
  // Signal aliases: presence of any of these in headers strongly suggests this type.
  signals: string[];
};

export function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/[\s_\-./\\]+/g, "").replace(/[^a-z0-9]/g, "");
}

export const FILE_TYPES: FileTypeConfig[] = [
  {
    id: "inventory",
    name: "Inventory / PO Data",
    description: "Product-level purchase orders, stock and fulfillment",
    signals: ["sku", "porequested", "pofulfilled", "stockdarkstore", "stockwarehouse", "doh"],
    fields: [
      { key: "name", label: "Product Name", required: true, aliases: ["name", "product", "productname", "itemname", "title", "description"] },
      { key: "sku", label: "SKU", required: true, aliases: ["sku", "skuid", "productsku", "itemcode", "code", "ean", "barcode", "asin"] },
      { key: "platform", label: "Platform", aliases: ["platform", "marketplace", "channel", "source"] },
      { key: "city", label: "City", aliases: ["city", "location", "region", "market"] },
      { key: "orderQty", label: "Order Qty", numeric: true, aliases: ["orderqty", "orderquantity", "orders", "qty", "quantity", "unitssold", "sales"] },
      { key: "poRequested", label: "PO Units Requested", numeric: true, aliases: ["porequested", "requested", "unitsrequested", "porderqty", "poqty"] },
      { key: "poFulfilled", label: "PO Units Fulfilled", numeric: true, aliases: ["pofulfilled", "fulfilled", "unitsfulfilled", "delivered", "received"] },
      { key: "poExpired", label: "PO Units Expired", numeric: true, aliases: ["poexpired", "expired", "unitsexpired"] },
      { key: "poOpen", label: "PO Units Open", numeric: true, aliases: ["poopen", "open", "unitsopen", "pending"] },
      { key: "stockDarkstore", label: "Stock at Darkstore", numeric: true, aliases: ["stockdarkstore", "darkstorestock", "darkstore", "storestock"] },
      { key: "stockWarehouse", label: "Stock at Warehouse", numeric: true, aliases: ["stockwarehouse", "warehousestock", "warehouse", "whstock"] },
      { key: "stockOpenForRo", label: "Stock Open For RO", numeric: true, aliases: ["stockopenforro", "openforro", "rostock"] },
      { key: "totalPos", label: "Total POs", numeric: true, aliases: ["totalpos", "totalpurchaseorders", "pototal"] },
      { key: "openPos", label: "Open POs", numeric: true, aliases: ["openpos", "openpurchaseorders"] },
      { key: "expiredPos", label: "Expired POs", numeric: true, aliases: ["expiredpos"] },
      { key: "fulfilledPos", label: "Fulfilled POs", numeric: true, aliases: ["fulfilledpos", "fulfilledpurchaseorders"] },
      { key: "doh", label: "DOH (days)", numeric: true, aliases: ["doh", "daysonhand", "daysofinventory", "doi", "coverdays"] },
    ],
  },
  {
    id: "keyword",
    name: "Keyword Performance",
    description: "Ad keywords with spend, ROAS, ACOS and match type",
    signals: ["keyword", "keywordmatchtype", "acos", "roas", "campaignname"],
    fields: [
      { key: "keyword", label: "Keyword", required: true, aliases: ["keyword", "kw", "keywordtext", "searchkeyword"] },
      { key: "matchType", label: "Match Type", aliases: ["keywordmatchtype", "matchtype", "match"] },
      { key: "campaignId", label: "Campaign ID", aliases: ["campaignid", "campid"] },
      { key: "campaignName", label: "Campaign Name", aliases: ["campaignname", "campaign"] },
      { key: "campaignType", label: "Campaign Type", aliases: ["campaigntype", "adtype"] },
      { key: "status", label: "Keyword Status", aliases: ["keywordstatus", "status", "state"] },
      { key: "impressions", label: "Impressions", numeric: true, aliases: ["impressions", "impr", "imps"] },
      { key: "clicks", label: "Clicks", numeric: true, aliases: ["clicks"] },
      { key: "ctr", label: "CTR", numeric: true, aliases: ["ctr", "clickthroughrate"] },
      { key: "spend", label: "Spend", numeric: true, aliases: ["spend", "cost", "adspend"] },
      { key: "orders", label: "Orders", numeric: true, aliases: ["orders", "conversions", "purchases"] },
      { key: "sales", label: "Sales", numeric: true, aliases: ["sales", "revenue", "salesrevenue"] },
      { key: "roas", label: "ROAS", numeric: true, aliases: ["roas", "returnonadspend"] },
      { key: "acos", label: "ACOS", numeric: true, aliases: ["acos", "advertisingcostofsales"] },
    ],
  },
  {
    id: "campaign",
    name: "Campaign Performance",
    description: "Campaign-level ad metrics",
    signals: ["campaignname", "campaignid", "campaigntype"],
    fields: [
      { key: "campaignId", label: "Campaign ID", aliases: ["campaignid", "campid"] },
      { key: "campaignName", label: "Campaign Name", required: true, aliases: ["campaignname", "campaign"] },
      { key: "campaignType", label: "Campaign Type", aliases: ["campaigntype", "adtype"] },
      { key: "status", label: "Status", aliases: ["status", "state", "campaignstatus"] },
      { key: "impressions", label: "Impressions", numeric: true, aliases: ["impressions", "impr"] },
      { key: "clicks", label: "Clicks", numeric: true, aliases: ["clicks"] },
      { key: "ctr", label: "CTR", numeric: true, aliases: ["ctr"] },
      { key: "spend", label: "Spend", numeric: true, aliases: ["spend", "cost"] },
      { key: "orders", label: "Orders", numeric: true, aliases: ["orders", "conversions"] },
      { key: "sales", label: "Sales", numeric: true, aliases: ["sales", "revenue"] },
      { key: "roas", label: "ROAS", numeric: true, aliases: ["roas"] },
      { key: "acos", label: "ACOS", numeric: true, aliases: ["acos"] },
      { key: "budget", label: "Budget", numeric: true, aliases: ["budget", "dailybudget"] },
    ],
  },
  {
    id: "search_term",
    name: "Search Term Report",
    description: "Customer search terms with attributed performance",
    signals: ["searchterm", "customersearchterm"],
    fields: [
      { key: "searchTerm", label: "Search Term", required: true, aliases: ["searchterm", "customersearchterm", "query"] },
      { key: "keyword", label: "Targeted Keyword", aliases: ["keyword", "targetedkeyword"] },
      { key: "matchType", label: "Match Type", aliases: ["matchtype", "keywordmatchtype"] },
      { key: "campaignName", label: "Campaign Name", aliases: ["campaignname", "campaign"] },
      { key: "impressions", label: "Impressions", numeric: true, aliases: ["impressions"] },
      { key: "clicks", label: "Clicks", numeric: true, aliases: ["clicks"] },
      { key: "ctr", label: "CTR", numeric: true, aliases: ["ctr"] },
      { key: "spend", label: "Spend", numeric: true, aliases: ["spend", "cost"] },
      { key: "orders", label: "Orders", numeric: true, aliases: ["orders", "conversions"] },
      { key: "sales", label: "Sales", numeric: true, aliases: ["sales", "revenue"] },
      { key: "acos", label: "ACOS", numeric: true, aliases: ["acos"] },
      { key: "roas", label: "ROAS", numeric: true, aliases: ["roas"] },
    ],
  },
  {
    id: "product_performance",
    name: "Product Performance",
    description: "Product-level ad / sales performance",
    signals: ["asin", "productperformance", "glanceviews"],
    fields: [
      { key: "asin", label: "ASIN / Product ID", required: true, aliases: ["asin", "productid", "itemid"] },
      { key: "name", label: "Product Name", aliases: ["productname", "name", "title"] },
      { key: "sku", label: "SKU", aliases: ["sku", "itemcode"] },
      { key: "impressions", label: "Impressions", numeric: true, aliases: ["impressions"] },
      { key: "clicks", label: "Clicks", numeric: true, aliases: ["clicks"] },
      { key: "glanceViews", label: "Glance Views", numeric: true, aliases: ["glanceviews", "views", "pageviews"] },
      { key: "spend", label: "Spend", numeric: true, aliases: ["spend", "cost"] },
      { key: "units", label: "Units Sold", numeric: true, aliases: ["units", "unitssold", "qty"] },
      { key: "sales", label: "Sales", numeric: true, aliases: ["sales", "revenue"] },
      { key: "roas", label: "ROAS", numeric: true, aliases: ["roas"] },
      { key: "acos", label: "ACOS", numeric: true, aliases: ["acos"] },
      { key: "conversionRate", label: "Conversion Rate", numeric: true, aliases: ["conversionrate", "cvr"] },
    ],
  },
];

export function getConfig(id: FileTypeId): FileTypeConfig | undefined {
  return FILE_TYPES.find((t) => t.id === id);
}

// Score each file type by counting how many of its signals/fields match the headers.
export function detectFileType(headers: string[]): {
  type: FileTypeId;
  config?: FileTypeConfig;
  scores: Record<string, number>;
} {
  const normSet = new Set(headers.map(normalizeHeader));
  const scores: Record<string, number> = {};
  let best: { id: FileTypeId; score: number; config?: FileTypeConfig } = { id: "unknown", score: 0 };

  for (const cfg of FILE_TYPES) {
    let score = 0;
    for (const sig of cfg.signals) if (normSet.has(sig)) score += 3;
    for (const f of cfg.fields) {
      if (f.aliases.some((a) => normSet.has(a))) score += f.required ? 2 : 1;
    }
    scores[cfg.id] = score;
    if (score > best.score) best = { id: cfg.id, score, config: cfg };
  }

  if (best.score < 3) return { type: "unknown", scores };
  return { type: best.id, config: best.config, scores };
}

// Build an initial mapping fieldKey -> rawHeader (or null) from headers.
export function autoMap(config: FileTypeConfig, headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const f of config.fields) {
    const found = headers.find((h) => f.aliases.includes(normalizeHeader(h)));
    map[f.key] = found ?? null;
  }
  return map;
}

export function missingRequired(config: FileTypeConfig, mapping: Record<string, string | null>): string[] {
  return config.fields.filter((f) => f.required && !mapping[f.key]).map((f) => f.label);
}

// LocalStorage persistence for user mappings.
const STORAGE_KEY = "aurum.mappings.v1";

export function loadSavedMapping(typeId: FileTypeId): Record<string, string | null> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[typeId] ?? null;
  } catch {
    return null;
  }
}

export function saveMapping(typeId: FileTypeId, mapping: Record<string, string | null>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[typeId] = mapping;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
