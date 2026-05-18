/** Typed access to public environment variables. */

export const env = {
  /** FastAPI backend base URL (no trailing slash). */
  apiBaseUrl: (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/$/, ""),
  apiPrefix: "/api/v1",
} as const;

export const apiUrl = (path: string): string =>
  `${env.apiBaseUrl}${env.apiPrefix}${path.startsWith("/") ? path : `/${path}`}`;
