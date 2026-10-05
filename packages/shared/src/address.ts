/**
 * How a street address is shown in public.
 *
 * Members browsing open jobs see the block, never the door: "1200 block of
 * Valencia St, San Francisco, CA". That is close enough to judge and price a
 * job and far enough to keep a home address off a public list. The exact
 * number lives in request_contact_details and reaches only the matched driver.
 * The demo seed (migration 15) writes its labels with the same rules.
 */

const SUFFIX: Record<string, string> = {
  street: 'St', avenue: 'Ave', boulevard: 'Blvd', road: 'Rd', drive: 'Dr', lane: 'Ln', place: 'Pl',
  court: 'Ct', parkway: 'Pkwy', highway: 'Hwy', terrace: 'Ter', square: 'Sq', circle: 'Cir', trail: 'Trl',
  way: 'Way', expressway: 'Expy', freeway: 'Fwy', turnpike: 'Tpke', alley: 'Aly', plaza: 'Plz',
};
const DIRECTION: Record<string, string> = {
  north: 'N', south: 'S', east: 'E', west: 'W', northeast: 'NE', northwest: 'NW', southeast: 'SE', southwest: 'SW',
};

/** "West 34th Street" → "W 34th St", "2nd Street Northwest" → "2nd St NW". Leaves names it does not recognise alone. */
export function shortStreet(street: string): string {
  const words = street.trim().split(/\s+/);
  const key = (w: string) => w.toLowerCase().replace(/\.$/, '');
  const last = words.length - 1;
  // the type is the last word, or the one before a trailing direction
  const typeAt = last > 0 && DIRECTION[key(words[last])] ? last - 1 : last;
  // "West Street" has no name besides the direction, so the direction stays a word
  const named = words.some((w, i) => i !== typeAt && !DIRECTION[key(w)]);
  return words
    .map((w, i) => {
      const k = key(w);
      if (i === typeAt && i > 0 && SUFFIX[k]) return SUFFIX[k];
      if (named && (i === 0 || i === last) && DIRECTION[k]) return DIRECTION[k];
      return w;
    })
    .join(' ');
}

/** Split "1234 Valencia Street" (or "1234-1240 …", "12B …") into number and street. */
export function splitStreetLine(line1: string): { number: number | null; street: string } {
  const m = line1.trim().match(/^(\d+)[A-Za-z]?(?:\s*[-–]\s*\d+[A-Za-z]?)?\s+(.+)$/);
  if (!m) return { number: null, street: line1.trim() };
  return { number: Number(m[1]), street: m[2] };
}

/** The public street part: "1200 block of Valencia St", or just the street when there is no number. */
export function blockOf(line1: string): string {
  const { number, street } = splitStreetLine(line1);
  if (!street) return '';
  const s = shortStreet(street);
  if (number === null) return s;
  if (number < 100) return `First block of ${s}`;
  return `${Math.floor(number / 100) * 100} block of ${s}`;
}

/** The full public label: block, city, state. Any part may be missing. */
export function blockLabel(line1: string, city?: string | null, state?: string | null): string {
  return [blockOf(line1), city, state].filter(Boolean).join(', ');
}

/** Coordinates published with a request: about 100 m, the size of a block. */
export const roundCoord = (n: number) => Math.round(n * 1000) / 1000;

/** "1200 block of Valencia St, San Francisco, CA" → "San Francisco, CA" */
export const afterStreet = (label: string) => label.split(',').slice(1).join(',').trim();
