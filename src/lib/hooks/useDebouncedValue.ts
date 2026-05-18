import { useEffect, useState } from "react";

/** Returns a debounced copy of `value` — only updates after `delay` ms of
 *  no further changes. Used to stop the feed from firing a backend request
 *  on every filter keystroke/tweak. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
