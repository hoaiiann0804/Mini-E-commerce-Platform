import { api } from "./api";

export interface StockRow {
  productId: string; variantId: string | null; name: string; sku: string | null;
  stockQuantity: number; isAvailable: boolean; lowStock: boolean;
}
export interface InventoryEntry {
  id: string; productId: string; variantId: string | null; type: string;
  quantityChange: number; previousStock: number; newStock: number;
  actorName: string; source: string; reason: string; unitCost: string | null;
  currency: string; orderId: string | null; orderItemId: string | null;
  sku: string | null; productName: string; createdAt: string;
}
export interface InventoryInput {
  productId: string; variantId?: string | null; type: "IN" | "ADJUSTMENT" | "RETURN";
  quantityChange: number; reason: string; unitCost?: number; orderItemId?: string; requestKey: string;
}
interface Params { page?: number; limit?: number; search?: string; lowStock?: boolean; type?: string; productId?: string; from?: string; to?: string }
interface Page<T> { status: string; data: { rows: T[]; total: number; page: number; lowStock?: number; units?: number } }

export const inventoryApi = api.injectEndpoints({ endpoints: builder => ({
  getInventoryStock: builder.query<Page<StockRow>, Params>({
    query: params => ({ url: "/admin/inventory/stock", params }), providesTags: ["Inventory", "AdminProduct", "AdminOrder", "Order"],
  }),
  getInventoryHistory: builder.query<Page<InventoryEntry>, Params>({
    query: params => ({ url: "/admin/inventory/transactions", params }), providesTags: ["Inventory", "AdminProduct", "AdminOrder", "Order"],
  }),
  getInventoryStats: builder.query<{ data: { day: string; incoming: number; outgoing: number; restored: number; adjustments: number }[] }, Params>({
    query: params => ({ url: "/admin/inventory/stats", params }), providesTags: ["Inventory", "AdminProduct", "AdminOrder", "Order"],
  }),
  createInventoryMovement: builder.mutation<{ data: InventoryEntry }, InventoryInput>({
    query: body => ({ url: "/admin/inventory/transactions", method: "POST", body }),
    invalidatesTags: ["Inventory", "Product", "AdminProduct", "AdminDashboard", "AdminStats"],
  }),
}) });
export const { useGetInventoryStockQuery, useGetInventoryHistoryQuery, useGetInventoryStatsQuery, useCreateInventoryMovementMutation } = inventoryApi;
