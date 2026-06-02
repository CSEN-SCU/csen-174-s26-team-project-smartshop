// Uses static JSON data instead of SQLite so it works on Vercel (no native modules needed).
// To refresh data: node scripts/export-db.js then redeploy.

import data from "./products-data.json";

type Product = {
  id: number;
  store_id: number;
  item_name: string;
  price: number;
  unit: string;
  brand: string;
  category: string;
  store_name: string;
  address: string;
  distance_miles: number;
};

type Store = {
  id: number;
  name: string;
  address: string;
  distance_miles: number;
};

const products: Product[] = data.products as Product[];
const stores: Store[] = data.stores as Store[];

export const dataExportedAt: string = (data as { exported_at?: string }).exported_at ?? "";

// In-memory chat messages (resets per serverless invocation — fine for demo)
const chatMessages: { role: string; content: string; created_at: string }[] = [];

export function getPricesForItems(items: string[]): object {
  const result: Record<string, { store: string; price: number; unit: string; distance: number }[]> = {};

  for (const item of items) {
    const lower = item.toLowerCase();
    const rows = products.filter(p => p.item_name.toLowerCase().includes(lower));

    if (rows.length > 0) {
      // Sort by price ascending
      const sorted = [...rows].sort((a, b) => a.price - b.price);
      result[item] = sorted.map(r => ({
        store: r.store_name,
        price: r.price,
        unit: r.unit,
        distance: r.distance_miles,
      }));
    }
  }

  return result;
}

export function saveMessage(role: string, content: string) {
  chatMessages.push({ role, content, created_at: new Date().toISOString() });
  // Keep last 50 messages in memory
  if (chatMessages.length > 50) chatMessages.shift();
}

export function getRecentMessages(limit = 10): { role: string; content: string }[] {
  return chatMessages.slice(-limit).map(({ role, content }) => ({ role, content }));
}

export function clearMessages() {
  chatMessages.length = 0;
}
