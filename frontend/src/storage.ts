import AsyncStorage from "@react-native-async-storage/async-storage";

export const EGG_PRICE = 3000;
export type Sale = { id: string; date: string; buyerId?: string; buyerName: string; eggs: number; total: number };
export type Buyer = { id: string; name: string; phone: string; address: string };
export type Expense = { id: string; date: string; category: string; itemName: string; quantity: string; unit: string; totalCost: number };
export type Production = { id: string; date: string; eggsCollected: number; activeChickens: number };
export type AppData = { sales: Sale[]; buyers: Buyer[]; expenses: Expense[]; productions: Production[]; categories: string[]; activeChickens: number };

const KEY = "telorku_data_v1";
export const emptyData: AppData = { sales: [], buyers: [], expenses: [], productions: [], categories: ["Pakan", "Vitamin", "Obat", "Lainnya"], activeChickens: 0 };

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { ...emptyData, ...parsed, categories: parsed.categories?.length ? parsed.categories : emptyData.categories };
  } catch {
    return emptyData;
  }
}

export async function saveData(data: AppData) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthKey(date = new Date()) {
  return todayKey(date).slice(0, 7);
}

export function formatRupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

export function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}