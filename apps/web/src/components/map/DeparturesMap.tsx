'use client';

/**
 * The homepage: a map of the United States with the number of open requests
 * leaving each state. Open a state, press a city, and the list underneath
 * shows what leaves and arrives there. Visitors get counts and destinations;
 * members get items, prices and people.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { requestQueries, tripQueries } from '@ondigo/shared';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthProvider';
import { CountdownTimer } from '@/components/CountdownTimer';
import {
  departsIn,
  itemsFromPublic,
  itemsFromRows,
  loadMapData,
  type MapData,
  type MapItem,
  type PublicActivity,
} from '@/lib/map/data';
import { createEngine, type Bundle, type CityNode, type Engine, type ViewState } from '@/lib/map/engine';
import { PlaceSearch } from './PlaceSearch';

type Selected = { item: MapItem; bundle?: undefined } | { bundle: Bundle; item?: undefined } | null;

const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.1em] text-steel';
const PILL = 'inline-flex items-center whitespace-nowrap rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-transform duration-150 ease-out active:scale-[0.97]';
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export function DeparturesMap() {
  const { user, loading: authLoading } = useAuth();
  const signedIn = !!user;
  const client = getSupabaseClient();

  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const [data, setData] = useState<MapData | null>(null);
  const [items, setItems] = useState<MapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ level: 'country', state: null, city: null, bundles: [], hint: { text: '' } });
  const [selected, setSelected] = useState<Selected>(null);
  const [phone, setPhone] = useState(false);
  // two columns need room: from 1024 px wide the pressed city's list slides in beside the map
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [statesActive, setStatesActive] = useState(0);

  useEffect(() => {
    const mq = matchMedia('(max-width: 720px)');
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // activity: full rows for members, the address-free RPC for everyone else
  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    (async () => {
      const d = await loadMapData();
      let list: MapItem[];
      if (user) {
        const [reqs, trips] = await Promise.all([requestQueries.listOpenRequests(client), tripQueries.listOpenTrips(client)]);
        list = itemsFromRows(reqs, trips, d.cities);
      } else {
        // the function is not in the generated Database types yet
        const { data: pub, error: rpcError } = await (client as unknown as { rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }> }).rpc('map_public_activity');
        if (rpcError) throw new Error(rpcError.message);
        list = itemsFromPublic(pub as PublicActivity, d.cities);
      }
      if (alive) {
        setData(d);
        setItems(list);
      }
    })().catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Could not load the map'));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  // the drawing
  useEffect(() => {
    if (!data || !items || !svgRef.current || !rootRef.current || !stageRef.current || !hoverRef.current) return;
    const engine = createEngine(svgRef.current, data, {
      items,
      phone,
      root: rootRef.current,
      stage: stageRef.current,
      hover: hoverRef.current,
      onChange: (v) => {
        setView(v);
        setSelected((s) => (v.city || !s ? (v.level === 'country' ? null : s) : null));
      },
      onSelectBundle: (b) => {
        setSelected({ bundle: b });
        engine.highlightBundle(b.id);
      },
    });
    engineRef.current = engine;
    setStatesActive(Object.keys(engine.counts).length);
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [data, items, phone]);

  // opening a state lines the page up so the title, the map and the row under it all fit
  const stateAbbr = view.state?.abbr ?? null;
  useEffect(() => {
    if (!stateAbbr || !rootRef.current) return;
    const top = rootRef.current.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [stateAbbr]);
  const showStage = () => stageRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  const closeBar = useCallback(() => {
    setSelected(null);
    engineRef.current?.highlightBundle(null);
  }, []);
  const pickItem = (item: MapItem) => {
    setSelected({ item });
    engineRef.current?.highlightItem(item.id);
    showStage();
  };
  const pickBundle = (b: Bundle) => {
    setSelected({ bundle: b });
    engineRef.current?.highlightBundle(b.id);
    showStage();
  };

  const requestsTotal = items?.filter((i) => i.kind === 'request').length ?? 0;
  const split = wide && !!view.city;
  const underProps = items
    ? { view, items, signedIn, requestsTotal, statesActive, selected, onItem: pickItem, onBundle: pickBundle, onBack: () => engineRef.current?.clearCity() }
    : null;
  const search = data ? (
    <PlaceSearch
      cities={data.cities}
      states={engineRef.current?.states ?? []}
      counts={engineRef.current?.counts ?? {}}
      onPick={(abbr, cityKey) => engineRef.current?.goTo(abbr, cityKey)}
    />
  ) : null;
  const st = view.state;
  const city = view.city;

  return (
    <section ref={rootRef} data-level="country">
      {/* lead: the full invitation for the country, one compact line once a state is open */}
      {st ? (
        <div className="flex flex-col gap-2.5 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <h1 className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
            <span className="text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.06] tracking-display">{st.name}</span>
            <span className="tnum text-[17px] text-muted">
              {st.requests} {st.requests === 1 ? 'request' : 'requests'} · {st.trips} {st.trips === 1 ? 'trip' : 'trips'}
            </span>
          </h1>
          {data && <div className="w-full sm:w-[38%] sm:max-w-[420px]">{search}</div>}
        </div>
      ) : (
        <div className="flex flex-col items-start justify-between gap-5 pb-4 sm:flex-row sm:items-end sm:gap-8">
          <div>
            <h1 className="text-[clamp(1.7rem,3vw,2.5rem)] font-semibold leading-[1.06] tracking-display text-balance sm:whitespace-nowrap">
              The journey someone’s already making.
            </h1>
            <p className="mt-3 max-w-[54ch] text-[17px] leading-relaxed text-muted">
              Post what you need moved, and a driver already making that trip takes it along. It’s as easy, and as safe, as asking a friend.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:pb-1">
            <Link href="/trips/new" className={`${PILL} border-line-strong hover:border-ink`}>
              Post a trip
            </Link>
            <Link href="/requests/new" className={`${PILL} border-ink bg-ink text-paper`}>
              Post a request
            </Link>
          </div>
        </div>
      )}

      {/* stage: at state level it is sized to the screen, and what you press opens inside it */}
      <div className={`dm-split${split ? ' is-split' : ''}`}>
        <aside className="dm-side" aria-hidden={!split}>
          <div className="dm-side-inner">{split && underProps && <Under {...underProps} compact />}</div>
        </aside>
      <div ref={stageRef} className="dm-stage">
        <div className="dm-stage-inner">
          <svg ref={svgRef} className="dm-svg" role="img" aria-label="Map of the United States with the number of open delivery requests leaving each state" />
          {!data && !error && (
            <p className="pointer-events-none -mt-[60%] text-center text-[13px] text-steel sm:-mt-[40%]">Loading the map</p>
          )}
          {error && <p className="-mt-[40%] text-center text-[13px] text-signal">{error}</p>}
        </div>
        <div ref={hoverRef} className="dm-hover" />
        {selected && (
          <div className="dm-sheet" role="dialog" aria-label="Selected route">
            <Bar selected={selected} city={city} signedIn={signedIn} onClose={closeBar} />
          </div>
        )}
      </div>
      </div>

      {/* under the map: one sentence on how to use it; the search sits here on the country view */}
      <div className="mt-2 flex flex-col gap-2 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="dm-hint">
          {view.hint.strong && <b className="font-semibold text-ink">{view.hint.strong}</b>}
          {view.hint.text}
          {!signedIn && view.level === 'country' && <span> Log in to see prices and who is driving.</span>}
        </div>
        {view.level === 'state' && (
          <div className="dm-legend flex flex-wrap items-center gap-x-4 gap-y-1 whitespace-nowrap text-[12px] text-steel">
            <span className="flex items-center gap-2"><i className="inline-block w-6 border-t-[1.6px] border-ink" /> Request</span>
            <span className="flex items-center gap-2"><i className="inline-block w-6 rounded-full border-t-[3px] border-steel/50" /> Driver trip</span>
            <span className="flex items-center gap-2"><i className="font-bold tracking-[2px] text-signal">···</i> continues out of state</span>
          </div>
        )}
        {view.level === 'country' && data && <div className="w-full sm:w-[38%] sm:max-w-[420px]">{search}</div>}
      </div>

      <div className="mt-4">{!split && underProps && <Under {...underProps} />}</div>
    </section>
  );
}

/* ---------- the bar: one pressed thing ---------- */

function Bar({ selected, city, signedIn, onClose }: { selected: NonNullable<Selected>; city: CityNode | null; signedIn: boolean; onClose: () => void }) {
  let head: React.ReactNode, kind: string, meta: React.ReactNode, price: React.ReactNode = null, link: React.ReactNode = null;
  const arrow = <span aria-hidden className="mx-2 font-normal text-steel">&#8594;</span>;
  if (selected.item) {
    const i = selected.item;
    const same = i.from.state === i.to.state;
    head = <>{i.from.city}{same ? '' : `, ${i.from.state}`}{arrow}{i.to.city}{same ? '' : `, ${i.to.state}`}</>;
    kind = i.kind === 'trip' ? 'Driver trip' : i.mode === 'auction' ? 'Auction' : 'Fixed price';
    if (!signedIn) meta = <><b>Log in to see the details</b>{i.kind === 'trip' ? 'Who is driving and when they leave' : 'The item, the price and who is bidding'} are visible to members.</>;
    else if (i.kind === 'trip') {
      meta = <><b>{i.driver}, {cap(i.vehicle)}</b>Departs {i.departAt ? departsIn(i.departAt) : 'soon'}. {same ? `Stays inside ${i.from.state}.` : `Crosses into ${i.to.state}.`}</>;
      link = <Link href={`/trips/${i.id}`} className={`${PILL} border-ink bg-ink text-paper`}>Open trip</Link>;
    } else {
      meta = <><b>{i.item}</b>{i.weightKg ? `${i.weightKg} kg. ` : ''}{same ? `Stays inside ${i.from.state}` : `Ends in ${i.to.city}, ${i.to.state}`}</>;
      price = (
        <div className="text-right">
          <div className="tnum text-[clamp(1.15rem,1.8vw,1.5rem)] font-semibold tracking-display">{typeof i.price === 'number' ? `$${i.price.toFixed(0)}` : ''}</div>
          <div className="mt-0.5 text-[11px] font-semibold tracking-[0.1em] text-steel">{i.mode === 'auction' && i.endsAt ? (new Date(i.endsAt).getTime() > Date.now() ? <><CountdownTimer endsAt={i.endsAt} /> LEFT</> : 'AUCTION CLOSED') : 'NO BIDDING'}</div>
        </div>
      );
      link = <Link href={`/requests/${i.id}`} className={`${PILL} border-ink bg-ink text-paper`}>Open request</Link>;
    }
  } else {
    const b = selected.bundle;
    const n = b.items.length;
    const same = !city || b.other.state === city.state;
    head = <>{city?.name}{arrow}{b.other.city}{same ? '' : `, ${b.other.state}`}</>;
    if (b.kind === 'trip') {
      kind = n === 1 ? 'Driver trip' : `${n} driver trips`;
      meta = signedIn
        ? <><b>{b.items.map((t) => t.driver).join(', ')}</b>{n === 1 && b.items[0].departAt ? `Departs ${departsIn(b.items[0].departAt)}` : `${n} drivers going this way`}</>
        : <><b>Log in to see who is driving</b>{n} {n === 1 ? 'driver is' : 'drivers are'} going this way.</>;
    } else {
      const out = b.items.filter((i) => i.from.key === city?.key).length;
      const inn = n - out;
      const dir = [out ? `${out} leaving` : '', inn ? `${inn} arriving` : ''].filter(Boolean).join(', ');
      kind = n === 1 ? 'Request' : `${n} requests`;
      if (!signedIn) meta = <><b>Log in to see the items and prices</b>{dir}.</>;
      else {
        const prices = b.items.map((i) => i.price ?? 0);
        const lo = Math.min(...prices), hi = Math.max(...prices);
        meta = <><b>{dir}</b>{b.items.slice(0, 3).map((i) => i.item).join(', ')}{n > 3 ? `, and ${n - 3} more` : ''}</>;
        price = (
          <div className="text-right">
            <div className="tnum text-[clamp(1.15rem,1.8vw,1.5rem)] font-semibold tracking-display">{lo === hi ? `$${lo}` : `$${lo} to $${hi}`}</div>
            <div className="mt-0.5 text-[11px] font-semibold tracking-[0.1em] text-steel">{(() => { const n = b.items.filter((i) => i.mode === 'auction').length; return n ? `${n} IN AUCTION` : 'NO BIDDING'; })()}</div>
          </div>
        );
      }
    }
  }
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 border-b border-line border-t-2 border-t-ink px-1 py-4 md:grid-cols-[1.6fr_1fr_auto_auto]">
      <div className="text-[clamp(1.25rem,2.2vw,1.8rem)] font-semibold leading-[1.1] tracking-display">
        {head}
        <span className={`mt-1.5 block ${LABEL}`}>{kind}</span>
      </div>
      <div className="col-span-2 text-[14px] leading-relaxed text-muted md:col-span-1 [&_b]:block [&_b]:font-semibold [&_b]:text-ink">{meta}</div>
      {price}
      <div className="col-start-2 row-start-1 flex items-center gap-2 md:col-start-auto md:row-start-auto">
        {link}
        <button type="button" onClick={onClose} className={`${PILL} border-line-strong text-muted`}>Close</button>
      </div>
    </div>
  );
}

/* ---------- the list under the map ---------- */

function Gate({ lead, rest, compact }: { lead: string; rest: string; compact?: boolean }) {
  return (
    <div className={`grid items-center gap-5 border-b border-line border-t border-t-ink px-1 py-5 ${compact ? '' : 'md:grid-cols-[1fr_auto]'}`}>
      <p className="max-w-[56ch] text-[15px] leading-relaxed text-muted">
        <b className="font-semibold text-ink">{lead}</b> {rest}
      </p>
      <div className="flex gap-2.5">
        <Link href="/login" className={`${PILL} border-line-strong hover:border-ink`}>Log in</Link>
        <Link href="/signup" className={`${PILL} border-ink bg-ink text-paper`}>Sign up</Link>
      </div>
    </div>
  );
}

function Head({ title, aside, children, compact }: { title: string; aside?: React.ReactNode; children?: React.ReactNode; compact?: boolean }) {
  if (compact)
    return (
      <div className="border-b border-ink px-1 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[clamp(1.15rem,1.6vw,1.4rem)] font-semibold leading-tight tracking-display">{title}</h2>
          {children}
        </div>
        {aside && <div className="mt-1 text-[12px] text-steel">{aside}</div>}
      </div>
    );
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink px-1 pb-2.5 pt-4">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
      <span className="flex items-center gap-3 text-[12px] text-steel">{aside}{children}</span>
    </div>
  );
}

const Sub = ({ children }: { children: React.ReactNode }) => <div className={`border-b border-line px-1 pb-1.5 pt-4 ${LABEL}`}>{children}</div>;

const rowCls = (compact: boolean | undefined, sel: boolean) =>
  `dm-row grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-1 text-left ${compact ? 'py-3' : 'py-4 md:grid-cols-[1.6fr_1fr_96px_120px] md:gap-x-6'} ${sel ? 'border-b-2 border-ink' : 'border-b border-line'}`;
const routeCls = (compact?: boolean) => `${compact ? 'col-span-2 row-start-1 text-[15px]' : 'text-[clamp(1.05rem,1.6vw,1.35rem)]'} font-semibold leading-[1.15] tracking-display`;
// narrow column: route on its own line, then the item on the left with price over status on the right
const cell = (compact: boolean | undefined, which: 'item' | 'price' | 'status', wideCls: string) =>
  compact
    ? { item: 'col-start-1 row-start-2 row-span-2 self-start', price: 'col-start-2 row-start-2', status: 'col-start-2 row-start-3' }[which]
    : wideCls;

function Row({ item, sel, onClick, compact }: { item: MapItem; sel: boolean; onClick: () => void; compact?: boolean }) {
  const same = item.from.state === item.to.state;
  const isTrip = item.kind === 'trip';
  return (
    <button type="button" onClick={onClick} className={rowCls(compact, sel)}>
      <div className={routeCls(compact)}>
        {item.from.city}<span aria-hidden className="mx-1.5 font-normal text-steel">&#8594;</span>{item.to.city}
        {!same && <span className="ml-1.5 text-[.68em] font-semibold tracking-[0.06em] text-steel">{item.to.state}</span>}
      </div>
      <div className={`text-muted ${compact ? 'text-[13px]' : 'text-[14px]'} ${cell(compact, 'item', 'row-start-2 md:row-start-auto')}`}>{isTrip ? `${item.driver}, ${cap(item.vehicle)}` : item.item}</div>
      <div className={`tnum text-right font-semibold tracking-display ${compact ? 'text-[15px]' : 'text-[1.05rem]'} ${cell(compact, 'price', 'row-start-1 md:row-start-auto')}`}>{!isTrip && typeof item.price === 'number' ? `$${item.price.toFixed(0)}` : ''}</div>
      <div className={`text-right text-[12.5px] font-semibold ${cell(compact, 'status', 'row-start-2 md:row-start-auto')}`}>
        {isTrip ? (
          <>{item.departAt ? cap(departsIn(item.departAt)) : ''}<small className={`block ${LABEL} mt-0.5`}>Departs</small></>
        ) : item.mode === 'auction' && item.endsAt ? (
          <><CountdownTimer endsAt={item.endsAt} /><small className={`block ${LABEL} mt-0.5`}>Auction</small></>
        ) : (
          <>Fixed<small className={`block ${LABEL} mt-0.5`}>No bidding</small></>
        )}
      </div>
    </button>
  );
}

function BundleRow({ b, city, out, sel, onClick, compact }: { b: Bundle; city: CityNode; out: boolean; sel: boolean; onClick: () => void; compact?: boolean }) {
  const mine = b.items.filter((i) => (i.from.key === city.key) === out);
  const au = mine.filter((i) => i.mode === 'auction').length;
  const same = b.other.state === city.state;
  return (
    <button type="button" onClick={onClick} className={rowCls(compact, sel)}>
      <div className={routeCls(compact)}>
        {out ? city.name : b.other.city}<span aria-hidden className="mx-1.5 font-normal text-steel">&#8594;</span>{out ? b.other.city : city.name}
        {!same && <span className="ml-1.5 text-[.68em] font-semibold tracking-[0.06em] text-steel">{b.other.state}</span>}
      </div>
      <div className={`text-muted ${compact ? 'text-[13px]' : 'text-[14px]'} ${cell(compact, 'item', 'row-start-2 md:row-start-auto')}`}>{au ? `${au} in auction` : 'Fixed price'}</div>
      <div className={`tnum text-right font-semibold tracking-display ${compact ? 'text-[15px]' : 'text-[1.05rem]'} ${cell(compact, 'price', 'row-start-1 md:row-start-auto')}`}>&times;{mine.length}</div>
      <div className={`text-right ${cell(compact, 'status', 'row-start-2 md:row-start-auto')} ${LABEL}`}>Log in for prices</div>
    </button>
  );
}

function Under({ view, items, signedIn, requestsTotal, statesActive, selected, onItem, onBundle, onBack, compact }: {
  view: ViewState; items: MapItem[]; signedIn: boolean; requestsTotal: number; statesActive: number; selected: Selected;
  onItem: (i: MapItem) => void; onBundle: (b: Bundle) => void; onBack: () => void; compact?: boolean;
}) {
  const selId = selected?.item?.id ?? selected?.bundle?.id;
  const st = view.state;
  if (!st) {
    return signedIn ? (
      <>
        <Head title="Open requests across the country" aside={`${requestsTotal} open, leaving ${statesActive} ${statesActive === 1 ? 'state' : 'states'}`} />
        <p className="px-1 py-5 text-[14.5px] text-muted">Open a state, then press a city to see what leaves and arrives there.</p>
      </>
    ) : (
      <Gate lead={`${requestsTotal} open ${requestsTotal === 1 ? 'request is' : 'requests are'} leaving ${statesActive} ${statesActive === 1 ? 'state' : 'states'}.`} rest="Log in to see prices, items and who is driving that way." />
    );
  }
  const c = view.city;
  if (c) {
    const back = <button type="button" onClick={onBack} className={`${PILL} shrink-0 border-line-strong text-muted ${compact ? '!px-3 !py-1.5 !text-[12px]' : ''}`}>{compact ? 'Close' : `All of ${st.name}`}</button>;
    const aside = `${c.n} ${c.n === 1 ? 'request' : 'requests'}, ${c.trips.length} driver ${c.trips.length === 1 ? 'trip' : 'trips'}`;
    if (!c.n && !c.trips.length)
      return (<><Head compact={compact} title={c.name} aside={aside}>{back}</Head><p className="px-1 py-5 text-[14.5px] text-muted">Nothing leaves or arrives in {c.name} yet.</p></>);
    if (signedIn)
      return (
        <>
          <Head compact={compact} title={c.name} aside={aside}>{back}</Head>
          {c.leaving.length > 0 && <><Sub>Leaving</Sub>{c.leaving.map((i) => <Row compact={compact} key={i.id} item={i} sel={selId === i.id} onClick={() => onItem(i)} />)}</>}
          {c.arriving.length > 0 && <><Sub>Arriving</Sub>{c.arriving.map((i) => <Row compact={compact} key={i.id} item={i} sel={selId === i.id} onClick={() => onItem(i)} />)}</>}
          {c.trips.length > 0 && <><Sub>Drivers passing through</Sub>{c.trips.map((i) => <Row compact={compact} key={i.id} item={i} sel={selId === i.id} onClick={() => onItem(i)} />)}</>}
        </>
      );
    const outB = view.bundles.filter((b) => b.kind === 'request' && b.items.some((i) => i.from.key === c.key));
    const inB = view.bundles.filter((b) => b.kind === 'request' && b.items.some((i) => i.from.key !== c.key));
    return (
      <>
        <Head compact={compact} title={c.name} aside={aside}>{back}</Head>
        {outB.length > 0 && <><Sub>Leaving</Sub>{outB.map((b) => <BundleRow compact={compact} key={b.id} b={b} city={c} out sel={selId === b.id} onClick={() => onBundle(b)} />)}</>}
        {inB.length > 0 && <><Sub>Arriving</Sub>{inB.map((b) => <BundleRow compact={compact} key={'in' + b.id} b={b} city={c} out={false} sel={selId === b.id} onClick={() => onBundle(b)} />)}</>}
        {c.trips.length > 0 && <><Sub>Drivers passing through</Sub><p className="px-1 py-4 text-[14.5px] text-muted">{c.trips.length} driver {c.trips.length === 1 ? 'trip touches' : 'trips touch'} {c.name}. Log in to see who and when.</p></>}
        <Gate compact={compact} lead="Prices, items and drivers are visible to members." rest="Log in to bid or to book one of these." />
      </>
    );
  }
  const leaving = items.filter((i) => i.kind === 'request' && i.from.state === st.abbr);
  if (!signedIn)
    return <Gate lead={`${st.requests} open ${st.requests === 1 ? 'request is' : 'requests are'} leaving ${st.name}.`} rest="Press a city on the map to see where things go from there. Log in to see prices and who is driving." />;
  if (!leaving.length)
    return (<><Head title={`Requests leaving ${st.name}`} /><p className="px-1 py-5 text-[14.5px] text-muted">Nothing open right now. Drivers&apos; trips still show when you press a city.</p></>);
  return (
    <>
      <Head title={`Requests leaving ${st.name}`} aside={`${leaving.length} open. Press a city on the map to narrow this down.`} />
      {leaving.map((i) => <Row key={i.id} item={i} sel={selId === i.id} onClick={() => onItem(i)} />)}
    </>
  );
}
