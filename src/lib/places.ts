import "server-only";

/**
 * Free place suggestions for the booking form (pickup and destination).
 *
 * Provider is picked at runtime, so it is easy to swap:
 * - GEOAPIFY_API_KEY set  -> Geoapify (free plan, needs a key, more reliable).
 * - otherwise             -> Photon by Komoot (free public OpenStreetMap search, no key, fair use only).
 * Both are OpenStreetMap data, so the form shows "© OpenStreetMap contributors".
 * Results are biased to Tamil Nadu and limited to India.
 */

export type PlaceSuggestion = { label: string; detail: string };

const TN = { lat: 10.8, lon: 78.7 }; // centre of Tamil Nadu
const INDIA_BBOX = "68.1,6.5,97.4,35.7"; // minLon,minLat,maxLon,maxLat
const TIMEOUT_MS = 4000;

export const placesProvider = () => (process.env.GEOAPIFY_API_KEY ? "geoapify" : "photon");

export async function searchPlaces(q: string): Promise<PlaceSuggestion[]> {
  return placesProvider() === "geoapify" ? geoapify(q, process.env.GEOAPIFY_API_KEY!) : photon(q);
}

function uniq(list: PlaceSuggestion[]) {
  const seen = new Set<string>();
  return list.filter((p) => p.label && !seen.has(p.label.toLowerCase()) && seen.add(p.label.toLowerCase())).slice(0, 6);
}

const join = (...parts: (string | undefined | null)[]) =>
  parts.filter((p, i, a) => p && a.indexOf(p) === i).join(", ");

async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`places provider HTTP ${res.status}`);
  return res.json();
}

type PhotonFeature = {
  properties: {
    name?: string; street?: string; housenumber?: string; district?: string; city?: string;
    county?: string; state?: string; country?: string; countrycode?: string; osm_value?: string;
  };
};

async function photon(q: string): Promise<PlaceSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "10");
  url.searchParams.set("lang", "en");
  url.searchParams.set("lat", String(TN.lat));
  url.searchParams.set("lon", String(TN.lon));
  url.searchParams.set("bbox", INDIA_BBOX);
  const data = (await getJson(url.toString())) as { features?: PhotonFeature[] };

  return uniq(
    (data.features ?? [])
      .filter((f) => !f.properties.countrycode || f.properties.countrycode.toUpperCase() === "IN")
      .map(({ properties: p }) => {
        const main = p.name ?? join(p.housenumber, p.street);
        const place = p.city ?? p.district ?? p.county;
        return { label: join(main, place, p.state), detail: join(p.osm_value?.replace(/_/g, " "), p.country) };
      }),
  );
}

type GeoapifyResult = {
  name?: string; formatted?: string; address_line1?: string; city?: string; county?: string;
  state?: string; country?: string; result_type?: string;
};

async function geoapify(q: string, key: string): Promise<PlaceSuggestion[]> {
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", q);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("filter", "countrycode:in");
  url.searchParams.set("bias", `proximity:${TN.lon},${TN.lat}`);
  url.searchParams.set("apiKey", key);
  const data = (await getJson(url.toString())) as { results?: GeoapifyResult[] };
  return uniq(
    (data.results ?? []).map((r) => ({
      label: join(r.name ?? r.address_line1, r.city ?? r.county, r.state),
      detail: join(r.result_type, r.country),
    })),
  );
}
