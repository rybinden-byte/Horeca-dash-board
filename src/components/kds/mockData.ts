import type { OrderRow } from '../../types/kds';

export const MOCK_LOCATION_ID = '00000000-0000-4000-8000-000000000001';

function isoFromMsAgo(msAgo: number) {
  return new Date(Date.now() - msAgo).toISOString();
}

/** Базові демо-замовлення; генеруємо “зараз”, щоб таймери були живими. */
export function createMockOrders(locationId: string): OrderRow[] {
  return [
    {
      id: '11111111-1111-4111-8111-111111111111',
      location_id: locationId,
      display_number: 'A-042',
      status: 'new',
      source: 'Зал',
      customer_note: 'Стіл 12 · 2 дорослих',
      prep_started_at: null,
      ready_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      order_items: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          order_id: '11111111-1111-4111-8111-111111111111',
          name: 'Стейк рибай',
          quantity: 2,
          station: 'Гриль',
          course: 1,
          sort_order: 0,
          order_item_modifiers: [
            {
              id: 'm1',
              order_item_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              label: 'Без цибулі',
              kind: 'removal',
              sort_order: 0,
            },
            {
              id: 'm2',
              order_item_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              label: 'Добре просмажити',
              kind: 'cooking',
              sort_order: 1,
            },
          ],
        },
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          order_id: '11111111-1111-4111-8111-111111111111',
          name: 'Картопля по-селянськи',
          quantity: 1,
          station: 'Гарнір',
          course: 1,
          sort_order: 1,
          order_item_modifiers: [],
        },
      ],
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      location_id: locationId,
      display_number: 'B-018',
      status: 'prep',
      source: 'Доставка',
      customer_note: null,
      prep_started_at: isoFromMsAgo(4 * 60_000),
      ready_at: null,
      created_at: isoFromMsAgo(10 * 60_000),
      updated_at: new Date().toISOString(),
      order_items: [
        {
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          order_id: '22222222-2222-4222-8222-222222222222',
          name: 'Бургер Rybin',
          quantity: 1,
          station: 'Гарячий',
          course: 1,
          sort_order: 0,
          order_item_modifiers: [
            {
              id: 'm3',
              order_item_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              label: 'Подвійне м\'ясо',
              kind: 'extra',
              sort_order: 0,
            },
            {
              id: 'm4',
              order_item_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              label: 'Алергія: горіхи',
              kind: 'allergy',
              sort_order: 1,
            },
          ],
        },
      ],
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      location_id: locationId,
      display_number: 'A-039',
      status: 'ready',
      source: 'Зал',
      customer_note: null,
      prep_started_at: isoFromMsAgo(12 * 60_000),
      ready_at: isoFromMsAgo(2 * 60_000),
      created_at: isoFromMsAgo(18 * 60_000),
      updated_at: new Date().toISOString(),
      order_items: [
        {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          order_id: '33333333-3333-4333-8333-333333333333',
          name: 'Салат Цезар',
          quantity: 1,
          station: 'Холодний',
          course: 1,
          sort_order: 0,
          order_item_modifiers: [
            {
              id: 'm5',
              order_item_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
              label: 'Соус окремо',
              kind: 'note',
              sort_order: 0,
            },
          ],
        },
      ],
    },
  ];
}
