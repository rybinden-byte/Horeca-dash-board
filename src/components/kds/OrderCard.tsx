import { useEffect, useMemo, useState } from 'react';
import type { OrderRow, OrderStatus } from '../../types/kds';
import { ModifierList } from './ModifierList';

interface Props {
  order: OrderRow;
  onMoveToPrep: (id: string) => void;
  onMoveToReady: (id: string) => void;
  onBackToNew: (id: string) => void;
  onBackToPrep: (id: string) => void;
  onCompleteOrder: (id: string) => void;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      second: undefined,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function parseTableNumber(note: string | null) {
  if (!note) return null;
  const m = note.match(/Стіл\s*(\d+)/i) ?? note.match(/Стол\s*(\d+)/i);
  return m ? String(m[1]) : null;
}

function getOrderType(source: string | null) {
  const s = (source ?? '').toLowerCase();
  if (s.includes('зал')) return { key: 'dine_in' as const, label: 'Dine-in' };
  if (s.includes('винос') || s.includes('самовивіз')) return { key: 'takeaway' as const, label: 'Takeaway' };
  if (s.includes('доставка')) return { key: 'delivery' as const, label: 'Delivery' };
  return { key: 'dine_in' as const, label: source ?? '' };
}

type Urgency = 'normal' | 'warning' | 'urgent';

function urgencyForMinutes(minutes: number): Urgency {
  if (minutes >= 20) return 'urgent';
  if (minutes >= 10) return 'warning';
  return 'normal';
}

function formatElapsedShort(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    return `${hours}h ${remMin}m`;
  }
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'new':
      return 'NEW';
    case 'prep':
      return 'PREP';
    case 'ready':
      return 'READY';
    case 'served':
      return 'COMPLETE';
    case 'cancelled':
    default:
      return 'CANCELLED';
  }
}

export function OrderCard({ order, onMoveToPrep, onMoveToReady, onBackToNew, onBackToPrep, onCompleteOrder }: Props) {
  const items = order.order_items ?? [];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const createdMs = useMemo(() => new Date(order.created_at).getTime(), [order.created_at]);
  const elapsedMs = now - createdMs;
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  const urgency = urgencyForMinutes(elapsedMinutes);

  const elapsedText = formatElapsedShort(elapsedMs);
  const tableNumber = parseTableNumber(order.customer_note);
  const orderType = getOrderType(order.source);
  const status = order.status;
  const creationTime = formatTime(order.created_at);

  return (
    <article
      className={`order-card order-card--urgency-${urgency}`}
      aria-label={`Order ${order.display_number}`}
      data-urgency={urgency}
    >
      <header className="order-card__header">
        <div className="order-card__topline">
          <span className="order-card__number">#{order.display_number}</span>
          <span className={`order-status order-status--${status}`} aria-label={`Status ${status}`}>
            {statusLabel(status)}
          </span>
          <span className={`order-urgency order-urgency--${urgency}`} aria-label={`Urgency ${urgency}`}>
            {urgency === 'normal' ? 'NORMAL' : urgency === 'warning' ? 'WARNING' : 'URGENT'}
          </span>
        </div>

        <div className="order-card__metarow">
          <time
            className="order-card__time"
            dateTime={order.created_at}
            title={`Created at ${creationTime}`}
          >
            <span className="order-elapsed">{elapsedText}</span>
            <span className="order-created">{creationTime}</span>
          </time>

          <div className="order-card__badges">
            <span className={`order-type-badge order-type-badge--${orderType.key}`}>
              {orderType.label}
            </span>
            {tableNumber ? (
              <span className="order-table-badge">Table {tableNumber}</span>
            ) : null}
          </div>
        </div>
      </header>

      {order.customer_note ? (
        <p className="order-card__note">
          <strong>Notes:</strong> {order.customer_note}
        </p>
      ) : null}

      <ul className="order-card__items">
        {items.map((line) => (
          <li key={line.id} className="order-card__line">
            <div className="order-card__line-head">
              <span className="order-card__qty">×{line.quantity}</span>
              <span className="order-card__name">{line.name}</span>
              {line.station ? <span className="order-card__station">{line.station}</span> : null}
            </div>
            <ModifierList modifiers={line.order_item_modifiers ?? []} compact />
          </li>
        ))}
      </ul>

      <footer className="order-card__actions">
        {order.status === 'new' && (
          <button
            type="button"
            className="touch-btn touch-btn--primary"
            onClick={() => onMoveToPrep(order.id)}
          >
            Start Prep
          </button>
        )}
        {order.status === 'prep' && (
          <>
            <button
              type="button"
              className="touch-btn touch-btn--ghost"
              onClick={() => onBackToNew(order.id)}
            >
              Move Back
            </button>
            <button
              type="button"
              className="touch-btn touch-btn--accent"
              onClick={() => onMoveToReady(order.id)}
            >
              Mark Ready
            </button>
          </>
        )}
        {order.status === 'ready' && (
          <>
            <button
              type="button"
              className="touch-btn touch-btn--accent"
              onClick={() => onCompleteOrder(order.id)}
            >
              Complete Order
            </button>
            <button
              type="button"
              className="touch-btn touch-btn--ghost"
              onClick={() => onBackToPrep(order.id)}
            >
              Back to Prep
            </button>
          </>
        )}
      </footer>
    </article>
  );
}
