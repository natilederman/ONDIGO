'use client';

import { useState } from 'react';

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const on = star <= display;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(null)}
            className={readOnly ? 'cursor-default' : 'cursor-pointer transition-transform duration-150 ease-out active:scale-90'}
            aria-label={`${star} star`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={on ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.25}
              strokeLinejoin="round"
              className={on ? 'text-ink' : 'text-line-strong'}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
