import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Normalises "+91 98765 43210" / "098765-43210" to "9876543210". */
export function normaliseMobile(input: string): string {
  return input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
}

export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Stable `min` for date inputs on statically prerendered pages (real “today” is applied on the client). */
export const STATIC_DATE_MIN = "2020-01-01";

export const enquirySchema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter your full name").max(100),
    mobile: z
      .string()
      .transform(normaliseMobile)
      .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")),
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
    vehicle_preference: optionalText(120),
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

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type FieldErrors = Partial<Record<keyof EnquiryInput, string>>;
