import type { SiteSettings } from "./types";
import { SITE_URL, phoneDigits } from "./site";

export const DEFAULT_KEYWORDS = [
  "Alagu Vacations",
  "Alagu Travels Dindigul",
  "Force Urbania rental Dindigul",
  "16 seater van Tamil Nadu",
  "tempo traveller Dindigul",
  "all India tour booking",
  "family tour van",
  "college trip bus Dindigul",
  "pilgrimage tour Tamil Nadu",
  "honeymoon trip package enquiry",
  "Kerala tour from Dindigul",
  "Kodaikanal van rental",
  "outstation van hire",
];

export function homeDescription(settings: SiteSettings): string {
  return [
    `${settings.business_name} — tours and holiday packages from Dindigul since 1992.`,
    "All-India family, group, college, pilgrimage and honeymoon enquiries in our 16-seater A/C Force Urbania.",
    "Book online or WhatsApp. Prices confirmed after enquiry.",
  ].join(" ");
}

export function localBusinessJsonLd(settings: SiteSettings) {
  const phone = settings.phone ? `+${phoneDigits(settings.phone)}` : undefined;
  return {
    "@context": "https://schema.org",
    "@type": ["TravelAgency", "LocalBusiness"],
    name: settings.business_name,
    description: settings.about_text,
    url: SITE_URL,
    image: `${SITE_URL}/images/van-front.webp`,
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dindigul",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN",
    },
    areaServed: { "@type": "Country", name: "India" },
    foundingDate: "1992",
    priceRange: "₹₹",
    sameAs: settings.instagram_url ? [settings.instagram_url] : undefined,
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do you offer all-India tours from Dindigul?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Share your route, dates and passenger count and we plan outstation trips across India in our 16-seater A/C Force Urbania. Final price is confirmed after enquiry.",
        },
      },
      {
        "@type": "Question",
        name: "How do I book the Force Urbania van?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the booking form on our website or WhatsApp/call us. We confirm availability and call you back with a reference number.",
        },
      },
      {
        "@type": "Question",
        name: "What trip types do you handle?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Family and friends groups, budget and package trips, college excursions, pilgrimage tours, honeymoons, weddings and airport transfers.",
        },
      },
    ],
  };
}