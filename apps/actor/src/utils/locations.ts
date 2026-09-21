const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Federal Capital Territory',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

const STATE_ALIASES: Record<string, (typeof NIGERIAN_STATES)[number]> = {
  abuja: 'Federal Capital Territory',
  fct: 'Federal Capital Territory',
  'federal capital territory': 'Federal Capital Territory',
};

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeState(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  const alias = STATE_ALIASES[normalized.toLowerCase()];
  if (alias) {
    return alias;
  }

  const match = NIGERIAN_STATES.find((state) => state.toLowerCase() === normalized.toLowerCase());
  return match ?? normalized;
}

export function normalizeLocality(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return normalizeWhitespace(value);
}

export function formatLocation(state?: string, locality?: string): string | undefined {
  const normalizedState = normalizeState(state);
  const normalizedLocality = normalizeLocality(locality);

  if (normalizedState && normalizedLocality) {
    return `${normalizedLocality}, ${normalizedState}`;
  }

  return normalizedState ?? normalizedLocality;
}

export { NIGERIAN_STATES };
