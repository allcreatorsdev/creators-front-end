/** Typed fetch wrapper around the FastAPI backend.

Backend speaks camelCase JSON and returns errors as
`{ error: { code, message, details } }`. Auth is dev-bypass for now
(`AUTH_PROVIDER=mock`); when Firebase lands, set the token in `authToken`.
*/

import { apiUrl } from "@/config/env";

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildQuery(q: Options["query"]): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const res = await fetch(apiUrl(path) + buildQuery(opts.query), {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = (data as { error?: { code: string; message: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      e?.code ?? "error",
      e?.message ?? res.statusText,
      e?.details,
    );
  }
  return data as T;
}
