export type OrderStatus = 'new' | 'prep' | 'ready' | 'served' | 'cancelled';

export type ModifierKind = 'removal' | 'cooking' | 'extra' | 'allergy' | 'note';

export interface OrderItemModifierRow {
  id: string;
  order_item_id: string;
  label: string;
  kind: ModifierKind;
  sort_order: number;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  station: string | null;
  course: number;
  sort_order: number;
  order_item_modifiers?: OrderItemModifierRow[];
}

export interface OrderRow {
  id: string;
  location_id: string;
  display_number: string;
  status: OrderStatus;
  source: string | null;
  customer_note: string | null;
  prep_started_at: string | null;
  ready_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
}

export const KANBAN_COLUMNS: { status: Exclude<OrderStatus, 'served' | 'cancelled'>; title: string }[] = [
  { status: 'new', title: 'New' },
  { status: 'prep', title: 'Prep' },
  { status: 'ready', title: 'Ready' },
];
