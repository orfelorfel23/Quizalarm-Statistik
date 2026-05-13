// Baserow client – fetches via the same-origin /api/baserow proxy.
// IMPORTANT: this code never sees the API token. The nginx reverse proxy
// inside the container injects "Authorization: Token …" before forwarding
// to Baserow. The browser only sees the unauthenticated request.

const BASE = "/api/baserow";

export type BaserowPage<T = Record<string, unknown>> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: (T & { id: number; order: string })[];
};

export async function fetchTable<T = Record<string, unknown>>(
  tableId: number,
  opts: { pageSize?: number } = {},
): Promise<(T & { id: number })[]> {
  const size = opts.pageSize ?? 200;
  const all: (T & { id: number })[] = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/api/database/rows/table/${tableId}/?user_field_names=true&size=${size}&page=${page}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Baserow ${tableId} HTTP ${res.status}`);
    const data = (await res.json()) as BaserowPage<T>;
    all.push(...data.results);
    if (!data.next) break;
    page += 1;
    if (page > 100) break; // safety
  }
  return all;
}
