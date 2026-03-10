/**
 * Shared keyword parser/serializer for primary and secondary keyword tiers.
 * All keyword parsing and serialization MUST use this module.
 */

export function parseKeywords(csv: string): string[] {
  if (!csv || !csv.trim()) return []
  return csv
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // dedupe
}

export function serializeKeywords(kws: string[]): string {
  return kws
    .map(k => k.trim().toLowerCase())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .join(', ')
}
