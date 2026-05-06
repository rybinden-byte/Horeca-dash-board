-- Rybin's Family — Kitchen Display System (KDS)
-- PostgreSQL / Supabase: orders flow New → Prep → Ready

-- Extensions (Supabase often has uuid-ossp or gen_random_uuid from pgcrypto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE order_status AS ENUM ('new', 'prep', 'ready', 'served', 'cancelled');

CREATE TYPE modifier_kind AS ENUM (
  'removal',   -- без X
  'cooking',   -- ступінь прожарки / час
  'extra',     -- додаток
  'allergy',   -- алергія / особлива увага
  'note'       -- вільний коментар
);

-- ─── Locations (мережа) ─────────────────────────────────────────────────────
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  timezone    TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Orders (тикет на екрані кухні) ──────────────────────────────────────────
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID NOT NULL REFERENCES locations (id) ON DELETE CASCADE,
  display_number  TEXT NOT NULL,
  status          order_status NOT NULL DEFAULT 'new',
  source          TEXT,
  customer_note   TEXT,
  prep_started_at TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_display_per_location UNIQUE (location_id, display_number)
);

CREATE INDEX idx_orders_location_status ON orders (location_id, status)
  WHERE status IN ('new', 'prep', 'ready');

-- ─── Line items ─────────────────────────────────────────────────────────────
CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  quantity       INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  station        TEXT,
  course         INT NOT NULL DEFAULT 1,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

-- ─── Modifiers (до позиції) ─────────────────────────────────────────────────
CREATE TABLE order_item_modifiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   UUID NOT NULL REFERENCES order_items (id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  kind            modifier_kind NOT NULL DEFAULT 'note',
  sort_order      INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_modifiers_item ON order_item_modifiers (order_item_id);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ─── Realtime: додати таблиці до publication supabase_realtime (у Dashboard)
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_item_modifiers;

-- ─── RLS (приклад: кухня бачить лише свою локацію) ───────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- Сервісний ключ обходить RLS; для anon — політики під JWT claims location_id
-- Приклад політики (налаштуйте під ваш auth):
-- CREATE POLICY "kitchen_read_orders" ON orders FOR SELECT
--   USING (location_id = (auth.jwt() ->> 'location_id')::uuid);

COMMENT ON TABLE orders IS 'KDS Kanban: статуси new / prep / ready для колонок';
COMMENT ON COLUMN order_item_modifiers.kind IS 'Відображення: removal=cooking note тощо для кольорових міток';
