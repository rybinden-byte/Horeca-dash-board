import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { OrderRow } from '../types/kds';

function loadClientEnv(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    console.warn(
      '[KDS] Задайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY у .env — інакше працює демо-режим.'
    );
    return null;
  }

  if (!/^https?:\/\//i.test(url)) {
    console.warn('[KDS] VITE_SUPABASE_URL має починатися з https:// (повний URL проєкту Supabase).');
    return null;
  }

  return { url, anonKey };
}

const env = loadClientEnv();

/** `true`, якщо в .env задані URL і anon key */
export const isSupabaseConfigured = env !== null;

/** Клієнт для браузера; `null`, якщо змінні не задані */
export const supabase: SupabaseClient | null = env
  ? createClient(env.url, env.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

/** Завантаження замовлень з позиціями та модифікаторами для однієї локації */
export async function fetchOrdersWithItems(locationId: string): Promise<OrderRow[]> {
  if (!supabase) return [];

  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        order_item_modifiers (*)
      )
    `
    )
    .eq('location_id', locationId)
    .in('status', ['new', 'prep', 'ready'])
    .order('created_at', { ascending: true });

  if (error) throw error;

  const list = (orders ?? []) as OrderRow[];
  for (const o of list) {
    o.order_items?.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    for (const item of o.order_items ?? []) {
      item.order_item_modifiers?.sort((a, b) => a.sort_order - b.sort_order);
    }
  }
  return list;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderRow['status'],
  extra?: { prep_started_at?: string | null; ready_at?: string | null }
) {
  if (!supabase) return;
  const patch: Record<string, unknown> = { status, ...extra };
  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw error;
}
