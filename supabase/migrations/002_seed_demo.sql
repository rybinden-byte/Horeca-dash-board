-- Демо-дані для перевірки KDS (запускайте один раз або адаптуйте)

INSERT INTO locations (id, slug, name) VALUES
  ('00000000-0000-4000-8000-000000000001', 'kyiv-1', 'Rybin''s Family — Київ, ТРЦ')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO orders (id, location_id, display_number, status, source, customer_note)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-4000-8000-000000000001',
    'A-042',
    'new',
    'Зал',
    'Стіл 12 · 2 дорослих'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-4000-8000-000000000001',
    'B-018',
    'prep',
    'Доставка',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, name, quantity, station, sort_order) VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Стейк рибай',
    2,
    'Гриль',
    0
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '11111111-1111-4111-8111-111111111111',
    'Картопля по-селянськи',
    1,
    'Гарнір',
    1
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '22222222-2222-4222-8222-222222222222',
    'Бургер Rybin',
    1,
    'Гарячий',
    0
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_item_modifiers (id, order_item_id, label, kind, sort_order) VALUES
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Без цибулі', 'removal', 0),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Добре просмажити', 'cooking', 1),
  ('99999999-9999-4999-8999-999999999999', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Подвійне м''ясо', 'extra', 0),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Алергія: горіхи', 'allergy', 1)
ON CONFLICT (id) DO NOTHING;
