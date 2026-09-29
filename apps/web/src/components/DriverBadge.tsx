import type { DriverSummary } from '@ondigo/shared';
import { StarRating } from './StarRating';

export function DriverBadge({ driver, size = 13 }: { driver: DriverSummary | null | undefined; size?: number }) {
  if (!driver) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-medium">{driver.full_name}</span>
      <span className="flex items-center gap-1.5 text-steel">
        <StarRating value={Math.round(driver.rating_avg)} readOnly size={size} />
        {driver.rating_count > 0 ? (
          <span className="tnum text-xs">
            {driver.rating_avg.toFixed(1)} ({driver.rating_count})
          </span>
        ) : (
          <span className="text-xs">No reviews yet</span>
        )}
      </span>
    </div>
  );
}
