import type { OrderRow, OrderStatus } from '../../types/kds';
import { OrderCard } from './OrderCard';

interface Props {
  title: string;
  status: Exclude<OrderStatus, 'served' | 'cancelled'>;
  orders: OrderRow[];
  onMoveToPrep: (id: string) => void;
  onMoveToReady: (id: string) => void;
  onBackToNew: (id: string) => void;
  onBackToPrep: (id: string) => void;
}

export function KanbanColumn({
  title,
  status,
  orders,
  onMoveToPrep,
  onMoveToReady,
  onBackToNew,
  onBackToPrep,
}: Props) {
  return (
    <section className="kanban-column" data-status={status} aria-label={title}>
      <header className="kanban-column__head">
        <h2 className="kanban-column__title">{title}</h2>
        <span className="kanban-column__count">{orders.length}</span>
      </header>
      <div className="kanban-column__body">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onMoveToPrep={onMoveToPrep}
            onMoveToReady={onMoveToReady}
            onBackToNew={onBackToNew}
            onBackToPrep={onBackToPrep}
          />
        ))}
      </div>
    </section>
  );
}
