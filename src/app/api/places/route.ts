import { NextResponse, type NextRequest } from "next/server";
import { searchPlaces, type PlaceSuggestion } from "@/lib/places";

/*
 * GET /api/places?q=madurai -> { suggestions: [{ label, detail }] }
 * Server-side proxy so a provider key never reaches the browser. Per-IP rate limit and a small
 * in-memory cache keep us well inside the free provider limits (both per server instance).
 * Any provider error returns an empty list: the form still accepts free text.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40; // requests per IP per minute
const hits = new Map<string, { count: number; start: number }>();

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 1000;
const cache = new Map<string, { at: number; data: PlaceSuggestion[] }>();

function clientKey(req: NextRequest) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

function rateLimited(ip: string) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.start > RATE_WINDOW_MS) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  h.count += 1;
  return h.count > RATE_MAX;
}

const json = (suggestions: PlaceSuggestion[], status = 200) =>
  NextResponse.json({ suggestions }, { status, headers: { "Cache-Control": "private, max-age=300" } });

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 3) return json([]);
  if (rateLimited(clientKey(req))) return json([], 429);

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return json(hit.data);

  try {
    const data = await searchPlaces(q);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), data });
    return json(data);
  } catch (e) {
    console.error("[places]", e instanceof Error ? e.message : e);
    return json([]);
  }
}
