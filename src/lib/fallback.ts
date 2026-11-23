import type { GalleryItem, SiteSettings, TravelPackage, Vehicle } from "./types";

/**
 * Verified defaults used when the database is not configured or unreachable,
 * so the public site never renders empty. Source: research/Alagu_Vacations_Research.md
 */
export const FALLBACK_SETTINGS: SiteSettings = {
  business_name: "Alagu Vacations",
  tagline: "Tours and Holiday Packages",
  phone: "7010998586",
  whatsapp: "7010998586",
  email: null,
  address: null,
  city: "Dindigul, Tamil Nadu",
  instagram_url: "https://www.instagram.com/alagu_vacations/",
  about_text:
    "Budget-friendly trips for friends and family, with a luxury and comfortable journey and well-organised, experienced drivers.",
  since_text: "Alagu Travels, since 1992",
  map_query: "Dindigul, Tamil Nadu",
};

export const FALLBACK_VEHICLES: Vehicle[] = [
  {
    id: "urbania-16",
    name: "Force Urbania – 16 Seater",
    model: "Force Urbania",
    seats: 16,
    facilities: [
      "Air-conditioned (A/C)",
      "Individual high-back seats",
      "Roof-mounted A/C vents",
      "Ceiling LED lighting",
      "Touchscreen infotainment",
    ],
    trip_types: [
      "Family trips",
      "Friends trips",
      "Budget trips",
      "Package trips",
      "College trips",
      "Pilgrimage tours",
      "Honeymoon trips",
      "Customized packages",
    ],
    description:
      "Our brand-new Force Urbania, launched in November 2026, built for comfortable group travel.",
    image_url: "/images/van-front.webp",
    photos: [
      "/images/van-front.webp",
      "/images/van-side.webp",
      "/images/interior-cabin.webp",
      "/images/interior-seats.webp",
      "/images/interior-aisle.webp",
      "/images/interior-cockpit.webp",
      "/images/interior-dashboard.webp",
    ],
    sort_order: 1,
    is_active: true,
  },
];

export const FALLBACK_PACKAGES: TravelPackage[] = [];

export const FALLBACK_GALLERY: GalleryItem[] = [
  ["/images/van-front.webp", "Our Force Urbania"],
  ["/images/interior-cabin.webp", "Spacious 16-seat cabin"],
  ["/images/launch-garland.webp", "Launch day in Dindigul"],
  ["/images/van-side-wide.webp", "Ready for the road"],
  ["/images/interior-aisle.webp", "Comfortable seats with A/C vents"],
  ["/images/launch-keys.webp", "Key handover, November 2026"],
  ["/images/interior-cockpit.webp", "Driver cabin"],
  ["/images/poster-new-services.webp", "Budget trips and package trips"],
  ["/images/interior-dashboard.webp", "Touchscreen infotainment"],
].map(([image_url, caption], i) => ({
  id: `fallback-${i}`,
  image_url,
  caption,
  storage_path: null,
  sort_order: i + 1,
  is_active: true,
}));
