import { StarRating } from './StarRating';

const testimonials = [
  {
    name: 'Priya S.',
    route: 'San Francisco → Los Angeles',
    rating: 5,
    quote: "Oh my god, it was so amazing — my driver picked up the box the same day I posted and had it in LA by the next morning. Cheaper than any shipping quote I got.",
  },
  {
    name: 'Marcus T.',
    route: 'Columbus → New Orleans',
    rating: 5,
    quote: 'Bid on a request, got outbid twice, came back with a better offer and won it. Felt like a real marketplace, not just a shipping form.',
  },
  {
    name: 'Wei L.',
    route: 'Seattle → Portland',
    rating: 4,
    quote: 'Driver was a few hours late picking up but kept me posted the whole time and the bookshelf arrived without a scratch.',
  },
  {
    name: 'Dana R.',
    route: 'New York → Boston',
    rating: 5,
    quote: "Sent a box of documents up to Boston for a fraction of what a courier wanted. Photo verification at drop-off made me feel a lot better about it.",
  },
  {
    name: 'Omar F.',
    route: 'San Francisco → Los Angeles',
    rating: 5,
    quote: 'Needed a mattress moved last minute and someone with a totally empty truck was heading down that exact weekend. Unreal timing.',
  },
  {
    name: 'Yuki N.',
    route: 'Austin, TX',
    rating: 5,
    quote: 'Used a bike courier for a same-day local delivery. Tracked it moving across town in real time — genuinely fun to watch.',
  },
  {
    name: 'Ben A.',
    route: 'Columbus → New Orleans',
    rating: 4,
    quote: 'Good experience overall, communication could have been a touch faster but the price was hard to beat.',
  },
  {
    name: 'Carmen V.',
    route: 'Seattle → Portland',
    rating: 5,
    quote: "Checked the driver's rating before accepting the bid and I'm glad I did — smoothest delivery I've had shipping anything.",
  },
];

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="mx-3 w-80 shrink-0 rounded-card border border-line bg-paper p-5">
      <StarRating value={t.rating} readOnly size={16} />
      <p className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{t.quote}&rdquo;</p>
      <p className="mt-4 text-sm font-medium">{t.name}</p>
      <p className="text-xs text-muted">{t.route}</p>
    </div>
  );
}

export function Testimonials() {
  const items = [...testimonials, ...testimonials];
  return (
    <section className="-mx-6 overflow-hidden py-2">
      <h2 className="mb-6 px-6 text-center text-lg font-semibold text-ink">What people are saying</h2>
      <div className="flex w-max animate-marquee">
        {items.map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </section>
  );
}
