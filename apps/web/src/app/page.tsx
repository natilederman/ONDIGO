import Link from 'next/link';
import { Card } from '@/components/Card';
import { Testimonials } from '@/components/Testimonials';

const steps = [
  {
    title: 'Post or find a trip',
    body: 'Drivers already heading somewhere post their route, dates, and free capacity.',
  },
  {
    title: 'Match with a request',
    body: 'Senders post what they need carried — fixed price or an open auction, whichever gets the best deal.',
  },
  {
    title: 'Verify, track, deliver',
    body: 'Timestamped handoff photos, live tracking, and escrow keep both sides covered until it arrives.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      <section className="text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          People are already driving there. <span className="text-accent">Let them carry it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted">
          ONDIGO connects senders with drivers already making the trip — cheaper than standard shipping,
          faster than waiting for a truck.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/signup" className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper">
            Get started
          </Link>
          <Link href="/requests" className="rounded-full border border-ink px-6 py-3 text-sm font-medium">
            Browse requests
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <Card key={s.title}>
            <span className="text-sm font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.body}</p>
          </Card>
        ))}
      </section>

      <Testimonials />
    </div>
  );
}
