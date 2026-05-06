import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KANBAN_COLUMNS } from '../../types/kds';
import { useKitchenOrders } from '../../hooks/useKitchenOrders';
import { KanbanColumn } from './KanbanColumn';

interface Props {
  locationId: string;
  brandTitle?: string;
}

export function KitchenDashboard({ locationId, brandTitle = "Rybin's Family — KDS" }: Props) {
  const { orders, loading, error, demoMode, reload, setOrderStatus, addDemoOrder, resetDemoOrders } =
    useKitchenOrders(locationId);

  const [demoToast, setDemoToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const lastAddedOrderIdRef = useRef<string | null>(null);

  const playNewOrderSound = useCallback(() => {
    // Called from a user click handler (Add Demo Order), so autoplay restrictions should not block it.
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.05;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);

      osc.start(t0);
      osc.stop(t0 + 0.22);

      window.setTimeout(() => void ctx.close().catch(() => {}), 300);
    } catch {
      // No-op: sound is optional.
    }
  }, []);

  const showDemoToast = useCallback((text: string) => {
    setDemoToast({ visible: true, text });
    window.setTimeout(() => setDemoToast((t) => ({ ...t, visible: false })), 2600);
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, typeof orders> = { new: [], prep: [], ready: [] };
    for (const o of orders) {
      if (o.status === 'new' || o.status === 'prep' || o.status === 'ready') {
        map[o.status].push(o);
      }
    }
    return map;
  }, [orders]);

  // Realtime / realtime-like notification: detect newly inserted order ids.
  useEffect(() => {
    const currentIds = new Set(orders.map((o) => o.id));
    const prev = prevOrderIdsRef.current;

    // Ignore first successful load.
    if (prev.size === 0) {
      prevOrderIdsRef.current = currentIds;
      return;
    }

    const inserted = orders.filter((o) => !prev.has(o.id));
    prevOrderIdsRef.current = currentIds;

    if (!inserted.length) return;

    const newest = inserted.reduce((acc, o) => {
      const accMs = new Date(acc.created_at).getTime();
      const oMs = new Date(o.created_at).getTime();
      return oMs > accMs ? o : acc;
    }, inserted[0]);

    // Only notify about "new" column items.
    if (newest.status !== 'new') return;

    // Avoid double-notification when user clicked Add Demo Order.
    if (lastAddedOrderIdRef.current && lastAddedOrderIdRef.current === newest.id) {
      lastAddedOrderIdRef.current = null;
      return;
    }

    showDemoToast(`New order #${newest.display_number}`);
    playNewOrderSound();
  }, [orders, playNewOrderSound, showDemoToast]);

  const onMoveToPrep = useCallback((id: string) => void setOrderStatus(id, 'prep'), [setOrderStatus]);
  const onMoveToReady = useCallback((id: string) => void setOrderStatus(id, 'ready'), [setOrderStatus]);
  const onBackToNew = useCallback((id: string) => void setOrderStatus(id, 'new'), [setOrderStatus]);
  const onBackToPrep = useCallback((id: string) => void setOrderStatus(id, 'prep'), [setOrderStatus]);
  const onCompleteOrder = useCallback((id: string) => void setOrderStatus(id, 'served'), [setOrderStatus]);

  const onAddDemoOrder = useCallback(() => {
    const o = addDemoOrder();
    lastAddedOrderIdRef.current = o.id;
    showDemoToast(`Новий демо-ордeр #${o.display_number}`);
    playNewOrderSound();
  }, [addDemoOrder, playNewOrderSound, showDemoToast]);

  const onResetDemoOrders = useCallback(() => {
    resetDemoOrders();
    showDemoToast('Демо-замовлення скинуто');
  }, [resetDemoOrders, showDemoToast]);

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
          {demoMode ? (
            <span className="kds-badge kds-badge--warn">Demo Mode</span>
          ) : (
            <span className="kds-badge kds-badge--ok">Онлайн · Supabase</span>
          )}

          {error && (
            <span className="kds-badge kds-badge--error" title={error.message}>
              Помилка
            </span>
          )}

          <button
            type="button"
            className="touch-btn touch-btn--primary kds-topbar__action"
            onClick={onAddDemoOrder}
          >
            Add Demo Order
          </button>
          <button
            type="button"
            className="touch-btn touch-btn--ghost kds-topbar__action"
            onClick={onResetDemoOrders}
          >
            Reset Demo Orders
          </button>

          <button
            type="button"
            className="touch-btn touch-btn--ghost kds-topbar__action"
            onClick={() => void reload()}
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="kds-board" role="main">
        {demoToast.visible ? (
          <div className="kds-demo-toast kds-demo-toast--visible" role="status" aria-live="polite">
            {demoToast.text}
          </div>
        ) : null}
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
            onCompleteOrder={onCompleteOrder}
          />
        ))}
      </main>
    </div>
  );
}
