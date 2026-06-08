export type Platform = "Blinkit" | "Instamart" | "Zepto";

export const PLATFORMS: Platform[] = ["Blinkit", "Instamart", "Zepto"];

export const CITIES = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata"];

export type Product = {
  id: string;
  name: string;
  sku: string;
  platform: Platform;
  city: string;
  orderQty: number;
  poRequested: number;
  poFulfilled: number;
  poExpired: number;
  poOpen: number;
  stockDarkstore: number;
  stockWarehouse: number;
  stockOpenForRo: number;
  totalPos: number;
  openPos: number;
  expiredPos: number;
  fulfilledPos: number;
  doh: number;
};

const seed = (n: number) => Math.floor(Math.abs(Math.sin(n) * 100000));

const NAMES = [
  "Whole Wheat Atta 5kg", "Cold Pressed Mustard Oil 1L", "Premium Basmati Rice 5kg",
  "Organic Almonds 500g", "Dark Chocolate 90% 100g", "Cold Brew Coffee 250ml",
  "Greek Yogurt Honey 400g", "A2 Cow Ghee 1L", "Pink Himalayan Salt 1kg",
  "Cashew Nuts Premium 250g", "Quinoa Grain 500g", "Manuka Honey 250g",
  "Extra Virgin Olive Oil 750ml", "Matcha Green Tea 100g", "Protein Granola 400g",
  "Sourdough Loaf 500g", "Single Origin Coffee 250g", "Coconut Water 1L",
  "Sparkling Mineral Water", "Artisan Pasta 500g",
];

export const PRODUCTS: Product[] = Array.from({ length: 40 }).flatMap((_, i) =>
  PLATFORMS.map((platform, p) => {
    const s = seed(i * 7 + p * 13);
    const requested = 500 + (s % 4500);
    const fulfilled = Math.floor(requested * (0.55 + ((s % 40) / 100)));
    const expired = Math.floor(requested * 0.08);
    const open = Math.max(0, requested - fulfilled - expired);
    const totalPos = 12 + (s % 80);
    const fulfilledPos = Math.floor(totalPos * 0.65);
    const expiredPos = Math.floor(totalPos * 0.1);
    const dark = 200 + (s % 1800);
    const wh = 500 + (s % 4000);
    return {
      id: `${i}-${platform}`,
      name: NAMES[i % NAMES.length],
      sku: `SKU-${(1000 + i).toString()}-${platform.slice(0, 2).toUpperCase()}`,
      platform,
      city: CITIES[s % CITIES.length],
      orderQty: 300 + (s % 6000),
      poRequested: requested,
      poFulfilled: fulfilled,
      poExpired: expired,
      poOpen: open,
      stockDarkstore: dark,
      stockWarehouse: wh,
      stockOpenForRo: 100 + (s % 800),
      totalPos,
      openPos: totalPos - fulfilledPos - expiredPos,
      expiredPos,
      fulfilledPos,
      doh: 3 + (s % 22),
    };
  })
);

export const TREND = (() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((m, i) => {
    const s = seed(i * 11);
    return {
      period: m,
      requested: 18000 + (s % 9000),
      fulfilled: 14000 + (s % 8000),
      expired: 800 + (s % 1500),
      open: 1500 + (s % 3000),
      fulfillment: 70 + (s % 25),
      stock: 40000 + (s % 30000),
    };
  });
})();

export const INSIGHTS = [
  { type: "alert", text: "Bangalore fulfillment dropped 18% vs last week", impact: "High" },
  { type: "warning", text: "Vendor Galaxy Commercials has highest open PO units (12,420)", impact: "Med" },
  { type: "alert", text: "Delhi stock is below 7 days DOH", impact: "High" },
  { type: "trend", text: "Expired PO units increased 22% across Blinkit", impact: "Med" },
  { type: "trend", text: "Fulfillment rate decreased from 92% to 84% MoM", impact: "High" },
  { type: "positive", text: "Mumbai darkstore stock replenishment improved 31%", impact: "Low" },
];

export const VENDORS = [
  "Galaxy Commercials", "Apex Distributors", "Northern Trade Co.",
  "Saffron Supply Chain", "Meridian Logistics", "Crown Mercantile",
];

export function aggregate(products: Product[]) {
  const sum = (k: keyof Product) => products.reduce((a, p) => a + (p[k] as number), 0);
  const requested = sum("poRequested");
  const fulfilled = sum("poFulfilled");
  return {
    orderQty: sum("orderQty"),
    stockDarkstore: sum("stockDarkstore"),
    stockWarehouse: sum("stockWarehouse"),
    totalStock: sum("stockDarkstore") + sum("stockWarehouse"),
    stockOpenForRo: sum("stockOpenForRo"),
    poRequested: requested,
    poFulfilled: fulfilled,
    poExpired: sum("poExpired"),
    poOpen: sum("poOpen"),
    fulfillment: requested ? (fulfilled / requested) * 100 : 0,
    totalPos: sum("totalPos"),
    openPos: sum("openPos"),
    expiredPos: sum("expiredPos"),
    fulfilledPos: sum("fulfilledPos"),
    doh: products.length ? Math.round(products.reduce((a, p) => a + p.doh, 0) / products.length) : 0,
  };
}
