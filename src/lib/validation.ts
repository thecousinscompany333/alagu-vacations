import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Stable `min` for date inputs on statically prerendered pages (real “today” is applied on the client). */
export const STATIC_DATE_MIN = "2020-01-01";

export const enquirySchema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter your full name").max(100),
    // Digits only, exactly 10, starting 6-9. No letters, spaces, +91 or extra digits.
    mobile: z
      .string()
      .trim()
      .regex(/^\d+$/, "Use numbers only")
      .regex(/^\d{10}$/, "Enter exactly 10 digits")
      .regex(/^[6-9]/, "Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)"),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().email("Enter a valid email address").optional()),
    pickup_location: z.string().trim().min(2, "Where should we pick you up?").max(160),
    destination: z.string().trim().min(2, "Where would you like to go?").max(160),
    pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose your journey start date"),
    return_date: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid return date").optional()),
    passengers: z.coerce
      .number({ message: "How many people are travelling?" })
      .int("Whole numbers only")
      .min(1, "At least 1 passenger")
      .max(80, "For more than 80 passengers, please call us"),
    /** Id of the vehicle picked in the form (empty = no preference). */
    vehicle_id: optionalText(64),
    trip_type: optionalText(80),
    notes: optionalText(1500),
  })
  .superRefine((v, ctx) => {
    if (v.pickup_date < todayInIndia()) {
      ctx.addIssue({ code: "custom", path: ["pickup_date"], message: "Start date can't be in the past" });
    }
    if (v.return_date && v.return_date < v.pickup_date) {
      ctx.addIssue({ code: "custom", path: ["return_date"], message: "Return date must be on or after the start date" });
    }
  });

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type FieldErrors = Partial<Record<keyof EnquiryInput, string>>;
