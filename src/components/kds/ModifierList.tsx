import type { ModifierKind, OrderItemModifierRow } from '../../types/kds';

const KIND_LABEL: Record<ModifierKind, string> = {
  removal: 'Без',
  cooking: 'Приготування',
  extra: 'Додатково',
  allergy: 'Алергія',
  note: 'Примітка',
};

function kindClass(kind: ModifierKind): string {
  switch (kind) {
    case 'removal':
      return 'mod mod--removal';
    case 'cooking':
      return 'mod mod--cooking';
    case 'extra':
      return 'mod mod--extra';
    case 'allergy':
      return 'mod mod--allergy';
    default:
      return 'mod mod--note';
  }
}

interface Props {
  modifiers: OrderItemModifierRow[];
  compact?: boolean;
}

export function ModifierList({ modifiers, compact }: Props) {
  if (!modifiers.length) return null;

  return (
    <ul className={`modifier-list ${compact ? 'modifier-list--compact' : ''}`}>
      {modifiers.map((m) => (
        <li key={m.id} className={kindClass(m.kind)} title={KIND_LABEL[m.kind]}>
          <span className="modifier-list__kind" aria-hidden>
            {KIND_LABEL[m.kind]}
          </span>
          <span className="modifier-list__label">{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
