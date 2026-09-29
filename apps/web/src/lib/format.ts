export type Handoff = 'in_person' | 'leave_at_door';

const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

/** "Sat 4 Oct, 09:00 to 12:00", or "Sat 4 Oct" when the window is a whole day. */
export function formatWindow(from?: string | null, until?: string | null, fallbackDate?: string | null) {
  if (!from || !until) return fallbackDate ? day.format(new Date(fallbackDate)) : 'Not set';
  const a = new Date(from);
  const b = new Date(until);
  const sameDay = a.toDateString() === b.toDateString();
  return sameDay
    ? `${day.format(a)}, ${clock.format(a)} to ${clock.format(b)}`
    : `${day.format(a)} ${clock.format(a)} to ${day.format(b)} ${clock.format(b)}`;
}

/** "Mon 6 Oct, 18:00", falling back to the bare needed_by date on older rows. */
export function formatDeadline(deliverBy?: string | null, fallbackDate?: string | null) {
  if (deliverBy) {
    const d = new Date(deliverBy);
    return `${day.format(d)}, ${clock.format(d)}`;
  }
  return fallbackDate ? day.format(new Date(fallbackDate)) : 'Not set';
}

export function handoffLabel(end: 'pickup' | 'dropoff', mode: Handoff | string | null | undefined) {
  if (mode === 'leave_at_door') {
    return end === 'pickup' ? 'Left out for collection' : 'Leave at the door';
  }
  return end === 'pickup' ? 'Handed over in person' : 'Hand to the recipient';
}

/** What the driver must do at that end, stated as an instruction. */
export function handoffInstruction(end: 'pickup' | 'dropoff', mode: Handoff | string | null | undefined) {
  if (mode === 'leave_at_door') {
    return end === 'pickup'
      ? 'The item will be left out. Photograph it where you find it before loading.'
      : 'Leave it exactly where the notes say, then photograph it in place. That photo releases the payment.';
  }
  return end === 'pickup'
    ? 'Someone will hand it to you. Photograph it at collection.'
    : 'Hand it to the named person and photograph the handover.';
}
