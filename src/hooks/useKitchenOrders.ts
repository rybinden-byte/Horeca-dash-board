import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrderRow, OrderStatus } from '../types/kds';
import { createMockOrders, MOCK_LOCATION_ID } from '../components/kds/mockData';
import {
  fetchOrdersWithItems,
  isSupabaseConfigured,
  supabase,
  updateOrderStatus,
} from '../lib/supabase';

const DEBOUNCE_MS = 200;
const DEMO_STORAGE_VERSION = 1;

type DemoStorage = {
  version: number;
  orders: OrderRow[];
  updatedAt: string;
};

function storageKey(locationId: string) {
  return `kds-demo-orders:v${DEMO_STORAGE_VERSION}:${locationId}`;
}

function safeParseDemo(raw: string | null): DemoStorage | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoStorage;
  } catch {
    return null;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStatusExtras(next: OrderStatus, nowIso: string) {
  switch (next) {
    case 'new':
      return { prep_started_at: null, ready_at: null };
    case 'prep':
      return { prep_started_at: nowIso, ready_at: null };
    case 'ready':
      return { prep_started_at: undefined, ready_at: nowIso };
    case 'served':
      return { prep_started_at: undefined, ready_at: nowIso };
    case 'cancelled':
    default:
      return { prep_started_at: undefined, ready_at: undefined };
  }
}

function applyStatusToOrders(current: OrderRow[], orderId: string, nextStatus: OrderStatus) {
  const nowIso = new Date().toISOString();
  return current.map((o) => {
    if (o.id !== orderId) return o;

    const extras = getStatusExtras(nextStatus, nowIso);

    const updated: OrderRow = {
      ...o,
      status: nextStatus,
      updated_at: nowIso,
      prep_started_at: typeof extras.prep_started_at === 'undefined' ? o.prep_started_at : extras.prep_started_at,
      ready_at: typeof extras.ready_at === 'undefined' ? o.ready_at : extras.ready_at,
    };
    return updated;
  });
}

export function useKitchenOrders(locationId: string | undefined) {
  const normalizedLocationId = locationId || MOCK_LOCATION_ID;
  const demoKey = useMemo(() => storageKey(normalizedLocationId), [normalizedLocationId]);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(!isSupabaseConfigured || !locationId);

  const [supabaseMode, setSupabaseMode] = useState<boolean>(false);

  const ordersRef = useRef<OrderRow[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDemo = useCallback((): OrderRow[] => {
    const parsed = safeParseDemo(window.localStorage.getItem(demoKey));
    if (parsed?.orders?.length) return clone(parsed.orders);

    const created = createMockOrders(normalizedLocationId);
    const storage: DemoStorage = { version: DEMO_STORAGE_VERSION, orders: created, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(demoKey, JSON.stringify(storage));
    return clone(created);
  }, [demoKey, normalizedLocationId]);

  const saveDemo = useCallback(
    (nextOrders: OrderRow[]) => {
      const storage: DemoStorage = {
        version: DEMO_STORAGE_VERSION,
        orders: nextOrders,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(demoKey, JSON.stringify(storage));
    },
    [demoKey]
  );

  const loadSupabase = useCallback(async () => {
    if (!locationId || !supabase) return;
    const data = await fetchOrdersWithItems(locationId);
    setOrders(data);
  }, [locationId]);

  const switchToDemo = useCallback(
    (reason?: unknown) => {
      setDemoMode(true);
      setSupabaseMode(false);
      if (reason instanceof Error) setError(reason);
      setOrders(loadDemo());
    },
    [loadDemo]
  );

  // Bootstrap: try Supabase, otherwise fall back to Demo Mode.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      if (!locationId || !supabase || !isSupabaseConfigured) {
        if (cancelled) return;
        setDemoMode(true);
        setSupabaseMode(false);
        setOrders(loadDemo());
        setLoading(false);
        return;
      }

      try {
        const data = await fetchOrdersWithItems(locationId);
        if (cancelled) return;
        setOrders(data);
        setDemoMode(false);
        setSupabaseMode(true);
        setLoading(false);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (cancelled) return;
        switchToDemo(err);
        setLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [locationId, loadDemo, switchToDemo]);

  const reload = useCallback(async () => {
    if (demoMode) {
      setOrders(loadDemo());
      return;
    }

    if (!locationId || !supabase) return;
    setLoading(true);
    setError(null);
    try {
      await loadSupabase();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      switchToDemo(err);
    } finally {
      setLoading(false);
    }
  }, [demoMode, loadDemo, loadSupabase, locationId, switchToDemo]);

  const scheduleReload = useCallback(() => {
    if (demoMode) return;
    if (!locationId || !supabase) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void reload();
    }, DEBOUNCE_MS);
  }, [demoMode, locationId, reload]);

  // Realtime subscription (only when Supabase mode is active).
  useEffect(() => {
    if (demoMode) return;
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
  }, [demoMode, locationId, scheduleReload]);

  const setOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      const current = ordersRef.current;
      const optimistic = applyStatusToOrders(current, orderId, nextStatus);
      setOrders(optimistic);

      if (demoMode || !supabaseMode) {
        setDemoMode(true);
        setSupabaseMode(false);
        saveDemo(optimistic);
        return;
      }

      if (!locationId || !supabase) {
        switchToDemo(new Error('Supabase client is not available'));
        saveDemo(optimistic);
        return;
      }

      // Optimistic update already applied; now try remote.
      const nowIso = new Date().toISOString();
      const extras = (() => {
        switch (nextStatus) {
          case 'new':
            return { prep_started_at: null, ready_at: null };
          case 'prep':
            return { prep_started_at: nowIso, ready_at: null };
          case 'ready':
            return { ready_at: nowIso };
          case 'served':
            return { ready_at: nowIso };
          default:
            return {};
        }
      })();

      try {
        await updateOrderStatus(orderId, nextStatus, extras);
        await reload();
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        // Keep optimistic UI state; switch to demo persistence.
        setDemoMode(true);
        setSupabaseMode(false);
        saveDemo(optimistic);
      }
    },
    [demoMode, locationId, reload, saveDemo, setOrders, supabase, supabaseMode]
  );

  const addDemoOrder = useCallback((): OrderRow => {
    setDemoMode(true);
    setSupabaseMode(false);
    setError(null);

    const base = loadDemo();
    const templates = base.flatMap((o) => o.order_items ?? []);
    const now = new Date();

    const maxNum = base.reduce((acc, o) => {
      const m = o.display_number?.match(/(\d+)\s*$/);
      return m ? Math.max(acc, Number(m[1])) : acc;
    }, 0);

    const nextDisplay = `D-${String(maxNum + 1).padStart(3, '0')}`;
    const table = Math.max(1, Math.floor(Math.random() * 12));

    const sources = ['Зал', 'Винос', 'Доставка'] as const;
    const source = sources[Math.floor(Math.random() * sources.length)];
    const customer_note =
      source === 'Зал'
        ? `Стіл ${table} · 2 дорослих`
        : source === 'Винос'
          ? `Винос · Самовивіз`
          : `Доставка · Адреса уточнюється`;

    const itemCount = 1 + Math.floor(Math.random() * 2);
    const chosen = Array.from({ length: itemCount }, () => templates[Math.floor(Math.random() * templates.length)]);

    const orderId = crypto.randomUUID();

    const order_items = chosen.map((t) => {
      const newItemId = crypto.randomUUID();
      const newMods = (t.order_item_modifiers ?? []).map((m) => ({
        ...m,
        id: crypto.randomUUID(),
        order_item_id: newItemId,
      }));
      return {
        ...t,
        id: newItemId,
        order_id: orderId,
        order_item_modifiers: newMods,
      };
    });

    const nowIso = now.toISOString();
    const newOrder: OrderRow = {
      id: orderId,
      location_id: normalizedLocationId,
      display_number: nextDisplay,
      status: 'new',
      source,
      customer_note,
      prep_started_at: null,
      ready_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      order_items,
    };

    const nextOrders = [...base, newOrder].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    setOrders(nextOrders);
    saveDemo(nextOrders);
    return newOrder;
  }, [loadDemo, normalizedLocationId, saveDemo]);

  const resetDemoOrders = useCallback(() => {
    setDemoMode(true);
    setSupabaseMode(false);
    setError(null);
    window.localStorage.removeItem(demoKey);
    const fresh = createMockOrders(normalizedLocationId);
    setOrders(fresh);
    saveDemo(fresh);
  }, [createMockOrders, demoKey, normalizedLocationId, saveDemo]);

  return {
    orders,
    loading,
    error,
    demoMode,
    reload,
    setOrderStatus,
    addDemoOrder,
    resetDemoOrders,
  };
}
