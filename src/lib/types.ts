export type SiteSettings = {
  business_name: string;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  instagram_url: string | null;
  about_text: string | null;
  since_text: string | null;
  map_query: string | null;
};

export type Vehicle = {
  id: string;
  name: string;
  model: string | null;
  seats: number | null;
  facilities: string[];
  trip_types: string[];
  description: string | null;
  image_url: string | null;
  photos: string[];
  sort_order: number;
  is_active: boolean;
  /** Owner of the vehicle. null = Alagu Vacations' own vehicle. */
  partner_id?: string | null;
};

/** A third-party vehicle owner who receives leads for their vehicles. */
export type Partner = {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type TravelPackage = {
  id: string;
  title: string;
  destination: string | null;
  duration: string | null;
  highlights: string[];
  price: number | null;
  price_note: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  storage_path: string | null;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
};

export const ADMIN_ROLES = ["admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ENQUIRY_STATUSES = ["pending", "contacted", "confirmed", "cancelled"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export type Enquiry = {
  id: string;
  reference: string;
  full_name: string;
  mobile: string;
  email: string | null;
  pickup_location: string;
  destination: string;
  pickup_date: string;
  return_date: string | null;
  passengers: number;
  vehicle_preference: string | null;
  trip_type: string | null;
  notes: string | null;
  status: EnquiryStatus;
  admin_notes: string | null;
  /** Vehicle picked by the customer, and its owner at submit time (null = own vehicle / no preference). */
  vehicle_id: string | null;
  partner_id: string | null;
  /** When an admin released the customer's contact details to the partner. */
  shared_at: string | null;
  partner_notes: string | null;
  created_at: string;
  updated_at: string;
};

export const TRIP_TYPES = [
  "Family trip",
  "Friends / group trip",
  "Budget trip",
  "Package trip",
  "Customized package",
  "College trip",
  "Pilgrimage / temple visit",
  "Honeymoon trip",
  "Wedding / function",
  "Airport / railway transfer",
  "Other",
] as const;
