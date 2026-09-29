/**
 * Origin to destination, the site's most repeated object.
 * The arrow stays glued to the destination so a wrapped route breaks as
 * "Columbus" / "-> New Orleans" rather than orphaning the arrow on line one.
 */
export function Route({
  from,
  to,
  size = 'md',
  dimmed = false,
  className = '',
}: {
  from: string;
  to: string;
  size?: 'sm' | 'md' | 'lg';
  dimmed?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: 'text-[clamp(1.15rem,2.2vw,1.75rem)]',
    md: 'text-[clamp(1.2rem,2.75vw,2.15rem)]',
    lg: 'text-[clamp(1.35rem,3.2vw,2.5rem)]',
  } as const;

  return (
    <div
      className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 font-semibold leading-[1.12] tracking-display ${
        sizes[size]
      } ${dimmed ? 'opacity-45' : ''} ${className}`}
    >
      <span>{from}</span>
      <span className="whitespace-nowrap">
        <span aria-hidden className="font-normal text-steel">
          &#8594;
        </span>{' '}
        <span className="sr-only">to</span>
        {to}
      </span>
    </div>
  );
}
