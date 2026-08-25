import type { DriverSummary } from '@ondigo/shared';
import { StarRating } from './StarRating';

export function DriverBadge({ driver, size = 14 }: { driver: DriverSummary | null | undefined; size?: number }) {
  if (!driver) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium">{driver.full_name}</span>
      <span className="flex items-center gap-1 text-muted">
        <StarRating value={Math.round(driver.rating_avg)} readOnly size={size} />
        {driver.rating_count > 0 ? (
          <span>
            {driver.rating_avg.toFixed(1)} ({driver.rating_count})
          </span>
        ) : (
          <span>No reviews yet</span>
        )}
      </span>
    </div>
  );
}
