import { useCallback, useEffect, useRef, useState } from 'react';
import type { OrderRow } from '../types/kds';
import { fetchOrdersWithItems, supabase } from '../lib/supabase';

const DEBOUNCE_MS = 200;

export function useKitchenOrders(locationId: string | undefined) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!locationId || !supabase) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrdersWithItems(locationId);
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  const scheduleReload = useCallback(() => {
    if (!locationId || !supabase) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void load();
    }, DEBOUNCE_MS);
  }, [locationId, load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!locationId || !supabase) return;

    const channel = supabase
      .channel(`kds:${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `location_id=eq.${locationId}`,
        },
        scheduleReload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        scheduleReload
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_item_modifiers' },
        scheduleReload
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [locationId, scheduleReload]);

  return { orders, loading, error, reload: load };
}
