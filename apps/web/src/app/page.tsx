import Link from 'next/link';
import { DeparturesMap } from '@/components/map/DeparturesMap';

const chain = [
  ['Escrow funded', 'Before pickup'],
  ['Pickup photographed', 'Timestamped, geotagged'],
  ['Live tracking', 'Visible to both sides'],
  ['Drop-off photographed', 'Confirmed by the recipient'],
  ['Escrow released', 'After confirmation'],
];

const vehicles = [
  ['Car', 'A box, a bag, a framed print'],
  ['Bike', 'Same-day local, small and light'],
  ['Truck', 'Furniture, appliances, the awkward things'],
];

export default function HomePage() {
  return (
    <div>
      {/* The map is the first viewport: where things need collecting from, right now */}
      <DeparturesMap />

      {/* Bidding */}
      <section className="-mx-6 mt-24 border-y border-line bg-ground px-6 py-20 sm:mt-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div>
            <h2 className="max-w-[20ch] text-[clamp(1.4rem,2.3vw,1.85rem)] font-semibold leading-[1.12] tracking-display text-balance">
              Drivers bid against each other. You take the best one.
            </h2>
            <p className="mt-4 max-w-[62ch] text-[15.5px] leading-relaxed text-muted">
              A request can be posted at a fixed price, or opened as an auction with a countdown.
              Drivers already heading that way bid the price down. When the clock runs out the
              request matches automatically and escrow holds the money until delivery is confirmed.
            </p>
            <div className="mt-9 flex flex-wrap gap-x-14 gap-y-7">
              <div>
                <div className="tnum text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-none tracking-display">
                  $55
                </div>
                <div className="mt-2 max-w-[22ch] text-[13px] leading-snug text-steel">
                  Current leading bid, down from an $80 opening ask
                </div>
              </div>
              <div>
                <div className="tnum text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-none tracking-display">
                  4
                </div>
                <div className="mt-2 max-w-[22ch] text-[13px] leading-snug text-steel">
                  Drivers competing on this one route
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="border-t border-ink">
              {[
                ['Drew Okafor', 'Truck · 4.8 rating · 61 deliveries', 55, '2m ago', true],
                ['Alice Rivera', 'Car · 4.9 rating · 128 deliveries', 62, '9m ago', false],
                ['Ben Sorensen', 'Bike · 4.7 rating · 34 deliveries', 68, '21m ago', false],
                ['Drew Okafor', 'Truck · 4.8 rating · 61 deliveries', 74, '38m ago', false],
              ].map(([name, meta, amount, ago, lead], i) => (
                <div
                  key={i}
                  className={`land grid grid-cols-[1fr_auto_auto] items-baseline gap-5 px-0.5 py-4 ${
                    lead ? 'border-b-2 border-ink' : 'border-b border-line'
                  }`}
                >
                  <div className={lead ? '' : 'opacity-45'}>
                    <span className={`text-[15px] font-medium ${lead ? '' : 'line-through'}`}>
                      {name as string}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-steel">{meta as string}</span>
                  </div>
                  <div
                    className={`tnum font-semibold tracking-display ${
                      lead ? 'text-[clamp(1.4rem,2.1vw,1.8rem)]' : 'text-[clamp(1.15rem,1.7vw,1.45rem)] opacity-45 line-through'
                    }`}
                  >
                    ${amount as number}
                  </div>
                  <div className="hidden min-w-[62px] text-right text-[12px] text-steel sm:block">
                    {ago as string}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-baseline justify-between gap-4 px-0.5 pt-4">
              <span className="text-[12.5px] text-steel">Seattle to Portland, bookshelf</span>
              <span className="tnum text-[13.5px] font-semibold text-signal">19:00 left</span>
            </div>
          </div>
        </div>
      </section>

      {/* Handoff verification */}
      <section className="mt-24 grid items-center gap-12 sm:mt-28 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['/img/handoff-pickup.jpg', 'Pickup', '09:42, Seattle', 'Pickup photo taken at the sender&apos;s door'],
            ['/img/handoff-dropoff.jpg', 'Drop-off', '14:08, Portland', 'Drop-off photo taken at the recipient&apos;s door'],
          ].map(([src, label, meta]) => (
            <figure key={label} className="m-0 border border-line bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${label} verification photograph`}
                className="block aspect-[4/5] w-full object-cover grayscale contrast-[1.04]"
              />
              <figcaption className="flex items-baseline justify-between gap-2.5 border-t border-line px-3 py-2.5 text-[12px] text-steel">
                <b className="font-semibold tracking-[-0.01em] text-ink">{label}</b>
                <span className="tnum">{meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div>
          <h2 className="max-w-[20ch] text-[clamp(1.4rem,2.3vw,1.85rem)] font-semibold leading-[1.12] tracking-display text-balance">
            The part where you hand a stranger your things.
          </h2>
          <p className="mt-4 max-w-[62ch] text-[15.5px] leading-relaxed text-muted">
            Every delivery leaves a record. Both ends are photographed and timestamped, the money
            sits in escrow until the drop-off is confirmed, and each side rates the other
            afterwards. Nothing here asks you to simply trust the other person.
          </p>
          <ul className="mt-7 border-t border-line">
            {chain.map(([step, when]) => (
              <li
                key={step}
                className="grid grid-cols-[1fr_auto] items-baseline gap-5 border-b border-line px-0.5 py-4 text-[14.5px]"
              >
                <b className="font-medium">{step}</b>
                <span className="text-[13px] text-steel">{when}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Driver path */}
      <section className="-mx-6 mt-24 border-y border-line bg-ground px-6 py-20 sm:mt-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="max-w-[20ch] text-[clamp(1.4rem,2.3vw,1.85rem)] font-semibold leading-[1.12] tracking-display text-balance">
              You were making the drive anyway.
            </h2>
            <p className="mt-4 max-w-[62ch] text-[15.5px] leading-relaxed text-muted">
              Post your route, your dates, and how much room you have. Bid on whatever is heading
              the same way. The empty seat and the empty trunk are the whole business.
            </p>
            <div className="mt-9 flex flex-wrap gap-x-14 gap-y-7">
              {vehicles.map(([name, desc]) => (
                <div key={name}>
                  <div className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-none tracking-display">
                    {name}
                  </div>
                  <div className="mt-2 max-w-[22ch] text-[13px] leading-snug text-steel">{desc}</div>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex w-fit items-center justify-self-start rounded-full border border-ink bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-paper transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Post a trip
          </Link>
        </div>
      </section>

      <p className="mt-16 border-t border-line pt-5 text-[12px] leading-relaxed text-steel">
        <b className="font-semibold text-muted">Demo build.</b> Payments are simulated: escrow hold,
        release and refund run as real ledger logic, but no card is ever charged. The panic button
        logs an alert and surfaces emergency contact details; it is not connected to emergency
        dispatch. Routes, bids and ratings shown here are seeded sample data.
      </p>
    </div>
  );
}
