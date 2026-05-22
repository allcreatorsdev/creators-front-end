/** Stat-badge SVG icons used everywhere video metrics are shown.
 *
 * Kept in one place so a tweak to (e.g.) the engagement icon updates the
 * Feed, Saved, Organizer and modal in lockstep — emojis previously drifted
 * between surfaces.
 */

type P = React.SVGProps<SVGSVGElement>;

/** Trending arrow — upward when outlier >= 1x, downward when below. */
export const OutlierUpIcon = (p: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <polyline points="3 17 9 11 13 15 21 7" />
    <polyline points="14 7 21 7 21 14" />
  </svg>
);

export const OutlierDownIcon = (p: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <polyline points="3 7 9 13 13 9 21 17" />
    <polyline points="14 17 21 17 21 10" />
  </svg>
);

/** Views — eye outline. */
export const ViewsIcon = (p: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Engagement — tap / pointer with click rays. */
export const EngagementIcon = (p: P) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    {/* Click rays around the pointer */}
    <path d="M12 2v3" />
    <path d="M4.9 4.9l2.1 2.1" />
    <path d="M2 12h3" />
    <path d="M19.1 4.9l-2.1 2.1" />
    {/* Cursor / pointer */}
    <path d="M9 11l3 10 2-5 5-2-10-3z" />
  </svg>
);
