import { countriesOverlap, typesOverlap } from '../input/filters.js';
import type { ParsedActorInput } from '@scouvela/shared';
import { boiNigeriaSource } from './boi-nigeria.js';
import { geaGhanaSource } from './gea-ghana.js';
import { kcicKenyaSource } from './kcic-kenya.js';
import { tefAfricaSource } from './tef-africa.js';
import type { SourceAdapter } from './types.js';

export const SOURCE_REGISTRY: SourceAdapter[] = [
  boiNigeriaSource,
  tefAfricaSource,
  geaGhanaSource,
  kcicKenyaSource,
];

export function selectSources(input: ParsedActorInput): SourceAdapter[] {
  return SOURCE_REGISTRY.filter((source) => {
    if (!countriesOverlap(source.countries, input.countries)) {
      return false;
    }

    if (!input.opportunityTypes || input.opportunityTypes.length === 0) {
      return true;
    }

    return input.opportunityTypes.some((type) => typesOverlap(type, [...source.opportunityTypes]));
  });
}
