import type { OrderRow } from '../../types/kds';
import { ModifierList } from './ModifierList';

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

interface Props {
  order: OrderRow;
  onMoveToPrep: (id: string) => void;
  onMoveToReady: (id: string) => void;
  onBackToNew: (id: string) => void;
  onBackToPrep: (id: string) => void;
}

export function OrderCard({ order, onMoveToPrep, onMoveToReady, onBackToNew, onBackToPrep }: Props) {
  const items = order.order_items ?? [];

  return (
    <article className="order-card" aria-label={`Замовлення ${order.display_number}`}>
      <header className="order-card__header">
        <span className="order-card__number">#{order.display_number}</span>
        <time className="order-card__time" dateTime={order.created_at}>
          {formatTime(order.created_at)}
        </time>
        {order.source ? <span className="order-card__source">{order.source}</span> : null}
      </header>

      {order.customer_note ? (
        <p className="order-card__note">
          <strong>Стол / коментар:</strong> {order.customer_note}
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
            На преп
          </button>
        )}
        {order.status === 'prep' && (
          <>
            <button
              type="button"
              className="touch-btn touch-btn--ghost"
              onClick={() => onBackToNew(order.id)}
            >
              Назад
            </button>
            <button
              type="button"
              className="touch-btn touch-btn--accent"
              onClick={() => onMoveToReady(order.id)}
            >
              Готово
            </button>
          </>
        )}
        {order.status === 'ready' && (
          <button
            type="button"
            className="touch-btn touch-btn--ghost"
            onClick={() => onBackToPrep(order.id)}
          >
            Повернути в преп
          </button>
        )}
      </footer>
    </article>
  );
}
