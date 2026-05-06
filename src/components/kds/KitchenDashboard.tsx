import { useCallback, useMemo, useState } from 'react';
import { KANBAN_COLUMNS, type OrderStatus } from '../../types/kds';
import { useKitchenOrders } from '../../hooks/useKitchenOrders';
import { isSupabaseConfigured, supabase, updateOrderStatus } from '../../lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { mockOrders } from './mockData';

interface Props {
  locationId: string;
  brandTitle?: string;
}

export function KitchenDashboard({ locationId, brandTitle = "Rybin's Family — KDS" }: Props) {
  const { orders: liveOrders, loading, error: bootstrapError, reload } = useKitchenOrders(
    supabase ? locationId : undefined
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const orders = supabase ? liveOrders : mockOrders;

  const byStatus = useMemo(() => {
    const map: Record<string, typeof orders> = { new: [], prep: [], ready: [] };
    for (const o of orders) {
      if (o.status === 'new' || o.status === 'prep' || o.status === 'ready') {
        map[o.status].push(o);
      }
    }
    return map;
  }, [orders]);

  const move = useCallback(
    async (id: string, status: OrderStatus, timestamps?: { prep?: boolean; ready?: boolean }) => {
      setLocalError(null);
      if (!supabase) return;
      try {
        const extra: { prep_started_at?: string | null; ready_at?: string | null } = {};
        if (timestamps?.prep) extra.prep_started_at = new Date().toISOString();
        if (timestamps?.ready) extra.ready_at = new Date().toISOString();
        if (status === 'new') {
          extra.prep_started_at = null;
          extra.ready_at = null;
        }
        if (status === 'prep' && !timestamps?.ready) {
          extra.ready_at = null;
        }
        await updateOrderStatus(id, status, extra);
        await reload();
      } catch (e) {
        setLocalError(e instanceof Error ? e.message : String(e));
      }
    },
    [reload]
  );

  const onMoveToPrep = useCallback((id: string) => move(id, 'prep', { prep: true }), [move]);
  const onMoveToReady = useCallback((id: string) => move(id, 'ready', { ready: true }), [move]);
  const onBackToNew = useCallback((id: string) => move(id, 'new'), [move]);
  const onBackToPrep = useCallback(
    (id: string) => move(id, 'prep', { prep: false }),
    [move]
  );

  return (
    <div className="kds-root">
      <header className="kds-topbar">
        <div className="kds-topbar__brand">
          <span className="kds-topbar__logo" aria-hidden>
            RF
          </span>
          <div>
            <h1 className="kds-topbar__title">{brandTitle}</h1>
            <p className="kds-topbar__sub">Кухонний дисплей · Kanban</p>
          </div>
        </div>
        <div className="kds-topbar__meta">
          {loading && <span className="kds-badge">Оновлення…</span>}
          {isSupabaseConfigured && !bootstrapError && !loading && (
            <span className="kds-badge kds-badge--ok">Онлайн · Supabase</span>
          )}
          {!isSupabaseConfigured && (
            <span className="kds-badge kds-badge--warn">Демо без Supabase</span>
          )}
          {bootstrapError && (
            <span className="kds-badge kds-badge--error" title={bootstrapError.message}>
              Помилка завантаження
            </span>
          )}
          {localError && (
            <span className="kds-badge kds-badge--error" title={localError}>
              Помилка збереження
            </span>
          )}
        </div>
      </header>

      <main className="kds-board" role="main">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            orders={byStatus[col.status]}
            onMoveToPrep={onMoveToPrep}
            onMoveToReady={onMoveToReady}
            onBackToNew={onBackToNew}
            onBackToPrep={onBackToPrep}
          />
        ))}
      </main>
    </div>
  );
}
