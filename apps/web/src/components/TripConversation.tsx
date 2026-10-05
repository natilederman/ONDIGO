'use client';

/**
 * A private conversation about one trip, between a member and its driver.
 *
 * Messages and offers share one stream. An offer is a card (item and price)
 * the other side can accept, decline or counter; a counter is simply the next
 * card. When the driver is one of the demo accounts, a reply is requested a
 * few seconds after the member writes, with a typing line in the meantime.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { tripThreadQueries, type TripMessage } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';
const PILL = 'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40';
const money = (n: number | null) => (n === null ? '' : `$${Number.isInteger(Number(n)) ? Number(n).toFixed(0) : Number(n).toFixed(2)}`);
const time = (iso: string) => new Date(iso).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const STATUS: Record<string, string> = {
  open: 'Waiting for an answer',
  accepted: 'Accepted',
  declined: 'Declined',
  countered: 'Countered',
  withdrawn: 'Replaced by a newer offer',
};

export function TripConversation({
  tripId,
  threadId: initialThread,
  me,
  otherId,
  otherName,
  asMember,
  height = 460,
  barFirst = false,
}: {
  tripId: string;
  threadId: string | null;
  me: string;
  otherId: string;
  otherName: string;
  /** the member side: may open the thread, and gets demo replies */
  asMember: boolean;
  /** the most the thread grows to before it scrolls (or its fixed height when the bar sits at the bottom) */
  height?: number;
  /** the trip page: just the bar until something is written, then the thread opens underneath and grows */
  barFirst?: boolean;
}) {
  const client = getSupabaseClient();
  const [threadId, setThreadId] = useState<string | null>(initialThread);
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [text, setText] = useState('');
  const [offering, setOffering] = useState(false);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  // whether a reply will come on its own; a promise so a fast first message still waits for the answer
  const demo = useRef<Promise<boolean>>(Promise.resolve(false));
  const scroller = useRef<HTMLDivElement>(null);
  const first = otherName.split(' ')[0];

  useEffect(() => setThreadId(initialThread), [initialThread]);
  useEffect(() => {
    demo.current = asMember ? tripThreadQueries.isDemoDriver(client, otherId).catch(() => false) : Promise.resolve(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId, asMember]);

  const load = useCallback(async (thread: string | null = threadId) => {
    if (!thread) return [];
    const list = await tripThreadQueries.listMessages(client, thread);
    setMessages(list);
    // reading a thread updates the header's unread count straight away
    if (document.visibilityState === 'visible') tripThreadQueries.markRead(client, thread).then(() => window.dispatchEvent(new Event('ondigo:unread')));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  /** Ask a demo driver to answer, with a typing line for the moment it takes. */
  const awaitReply = async (thread: string) => {
    if (!asMember || !(await demo.current)) return;
    setTyping(true);
    await new Promise((r) => setTimeout(r, 1400 + Math.random() * 1800));
    await tripThreadQueries.demoReply(client, thread).catch(() => {});
    setTyping(false);
    await load(thread);
  };

  useEffect(() => {
    if (!threadId) return;
    load().then((list) => {
      // left before the driver answered last time: answer now
      const last = list[list.length - 1];
      if (last && last.sender_id === me && !busy) awaitReply(threadId);
    });
    return tripThreadQueries.subscribe(client, threadId, () => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // newest at the bottom, kept in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing]);

  /** Run something the member did, then let a demo driver answer it. */
  const act = async (fn: (thread: string) => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    let ok = false;
    try {
      let thread = threadId;
      if (!thread) {
        thread = await tripThreadQueries.openThread(client, tripId);
        setThreadId(thread);
      }
      await fn(thread);
      await load(thread);
      ok = true;
      await awaitReply(thread);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setTyping(false);
    } finally {
      setBusy(false);
    }
    return ok;
  };

  const send = () => {
    if (offering) {
      const n = Number(amount);
      if (!item.trim() || !n || n < 1) {
        setError('Add what it is and a price.');
        return;
      }
      const body = text.trim();
      act((t) => tripThreadQueries.sendOffer(client, t, me, item.trim(), n, body)).then((ok) => {
        if (!ok) return;
        setOffering(false);
        setItem('');
        setAmount('');
        setText('');
      });
    } else {
      const body = text.trim();
      if (!body) return;
      setText('');
      act((t) => tripThreadQueries.sendText(client, t, me, body));
    }
  };

  const byId = new Map(messages.map((m) => [m.id, m]));
  const agreed = [...messages].reverse().find((m) => m.offer_status === 'accepted');

  const showThread = !barFirst || messages.length > 0 || typing;

  const thread = showThread && (
      <div
        ref={scroller}
        style={barFirst ? { maxHeight: height } : { height }}
        className={`space-y-3 overflow-y-auto px-4 py-4 ${barFirst ? 'dm-thread-in border-t border-ink' : ''}`}
        aria-live="polite"
      >
        {messages.length === 0 && !typing && (
          <p className="mx-auto max-w-[44ch] pt-6 text-center text-[14px] leading-relaxed text-muted">
            {asMember
              ? `Ask ${first} about size or timing, or offer a price for your item. Only you and ${first} see this.`
              : `Nothing here yet.`}
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === me;
          const who = mine ? 'You' : first;
          const side = mine ? 'items-end' : 'items-start';

          // an answer to an offer: a line across the thread, plus anything they wrote
          if (m.answers) {
            const o = byId.get(m.answers);
            const verb = o?.offer_status === 'declined' ? 'declined' : 'accepted';
            return (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-line" />
                  <span className={`${LABEL} ${verb === 'accepted' ? '!text-ink' : ''}`}>
                    {who} {verb} {o ? `${money(o.offer_amount)} for ${o.offer_item}` : 'the offer'}
                  </span>
                  <span className="h-px flex-1 bg-line" />
                </div>
                {m.body && <Bubble mine={mine} body={m.body} at={m.created_at} />}
              </div>
            );
          }

          if (m.offer_status) {
            const open = m.offer_status === 'open';
            return (
              <div key={m.id} className={`flex flex-col gap-2 ${side}`}>
                {m.body && <Bubble mine={mine} body={m.body} at={m.created_at} />}
                <OfferCard
                  m={m}
                  who={who}
                  canAnswer={open && !mine}
                  busy={busy}
                  onAccept={() => act(() => tripThreadQueries.respond(client, m.id, 'accept'))}
                  onDecline={() => act(() => tripThreadQueries.respond(client, m.id, 'decline'))}
                  onCounter={(n) => act(() => tripThreadQueries.respond(client, m.id, 'counter', n))}
                />
              </div>
            );
          }

          return (
            <div key={m.id} className={`flex flex-col ${side}`}>
              <Bubble mine={mine} body={m.body} at={m.created_at} />
            </div>
          );
        })}

        {typing && (
          <div className="flex items-center gap-2 text-[13px] text-steel">
            <span className="dm-typing" aria-hidden><i /><i /><i /></span>
            {first} is typing
          </div>
        )}
      </div>
  );

  const bar = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className={`p-3 ${barFirst ? '' : 'border-t border-ink'}`}
      >
        {offering && (
          <div className="mb-2.5 grid grid-cols-[1fr_120px] gap-2">
            <label className="block">
              <span className={LABEL}>Item</span>
              <input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Bicycle"
                maxLength={120}
                className="mt-1 w-full border border-line bg-paper px-3 py-2 text-[14px] focus:border-ink focus:outline-none"
                autoFocus
              />
            </label>
            <label className="block">
              <span className={LABEL}>Price</span>
              <div className="mt-1 flex items-center border border-line bg-paper focus-within:border-ink">
                <span className="pl-3 text-[14px] text-steel">$</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                  inputMode="decimal"
                  placeholder="50"
                  className="tnum w-full bg-transparent px-2 py-2 text-[14px] focus:outline-none"
                />
              </div>
            </label>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOffering((o) => !o);
              setError(null);
            }}
            aria-pressed={offering}
            className={`${PILL} shrink-0 ${offering ? 'border-ink bg-ink text-paper' : 'border-line-strong hover:border-ink'}`}
          >
            {offering ? 'Just a message' : 'Offer a price'}
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={offering ? 'Add a note (optional)' : `Message ${first}`}
            maxLength={2000}
            className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-[14px] focus:border-ink focus:outline-none"
          />
          <button type="submit" disabled={busy} className={`${PILL} shrink-0 border-ink bg-ink text-paper`}>
            {offering ? 'Send offer' : 'Send'}
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-signal">{error}</p>}
      </form>
  );

  return (
    <div className="border border-ink">
      {agreed && (
        <div className="flex items-baseline justify-between gap-4 border-b border-ink bg-ink px-4 py-2.5 text-paper">
          <span className="text-[13px] font-semibold">Agreed: {agreed.offer_item}</span>
          <span className="tnum text-[15px] font-semibold">{money(agreed.offer_amount)}</span>
        </div>
      )}
      {barFirst ? (
        <>
          {bar}
          {thread}
        </>
      ) : (
        <>
          {thread}
          {bar}
        </>
      )}
    </div>
  );
}

function Bubble({ mine, body, at }: { mine: boolean; body: string; at: string }) {
  return (
    <div className={`flex max-w-[78%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div className={`px-3.5 py-2 text-[14px] leading-snug ${mine ? 'bg-ink text-paper' : 'bg-ash text-ink'}`}>{body}</div>
      <span className="mt-1 text-[11px] text-steel">{time(at)}</span>
    </div>
  );
}

function OfferCard({
  m,
  who,
  canAnswer,
  busy,
  onAccept,
  onDecline,
  onCounter,
}: {
  m: TripMessage;
  who: string;
  canAnswer: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: (n: number) => void;
}) {
  const [countering, setCountering] = useState(false);
  const [value, setValue] = useState('');
  const settled = m.offer_status !== 'open';
  const accepted = m.offer_status === 'accepted';
  return (
    <div className={`w-full max-w-[340px] border bg-paper ${accepted ? 'border-2 border-ink' : 'border-line-strong'} ${settled && !accepted ? 'opacity-60' : ''}`}>
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3">
        <span className={LABEL}>{who === 'You' ? 'Your offer' : `${who}'s offer`}</span>
        <span className="text-[11px] text-steel">{time(m.created_at)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-3 px-4 pb-3 pt-1">
        <span className="text-[16px] font-semibold leading-tight">{m.offer_item}</span>
        <span className={`tnum text-[22px] font-semibold tracking-display ${m.offer_status === 'countered' || m.offer_status === 'withdrawn' ? 'line-through decoration-1' : ''}`}>
          {money(m.offer_amount)}
        </span>
      </div>
      {canAnswer ? (
        <div className="border-t border-line px-4 py-3">
          {countering ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(value);
                if (n >= 1) onCounter(n);
              }}
            >
              <div className="flex flex-1 items-center border border-line focus-within:border-ink">
                <span className="pl-3 text-[14px] text-steel">$</span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
                  inputMode="decimal"
                  placeholder="Your price"
                  autoFocus
                  className="tnum w-full bg-transparent px-2 py-1.5 text-[14px] focus:outline-none"
                />
              </div>
              <button type="submit" disabled={busy} className={`${PILL} border-ink bg-ink text-paper`}>Counter</button>
              <button type="button" onClick={() => setCountering(false)} className="text-[12.5px] font-semibold text-muted">Cancel</button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" disabled={busy} onClick={onAccept} className={`${PILL} border-ink bg-ink text-paper`}>Accept</button>
              <button type="button" disabled={busy} onClick={() => setCountering(true)} className={`${PILL} border-line-strong hover:border-ink`}>Counter</button>
              <button type="button" disabled={busy} onClick={onDecline} className="ml-auto text-[12.5px] font-semibold text-muted hover:text-ink">Decline</button>
            </div>
          )}
        </div>
      ) : (
        <div className={`border-t border-line px-4 py-2 ${LABEL} ${accepted ? '!text-ink' : ''}`}>{STATUS[m.offer_status ?? 'open']}</div>
      )}
    </div>
  );
}
