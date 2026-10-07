import { z } from "zod";
const short = z.string().trim().max(180);
const text = z.string().trim().max(5000);
export const webUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    if (!v) return true;
    try {
      return ["https:", "http:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "Use a full https:// URL");
const asset = z.string().max(100).default("");
const row = z.object({
  title: short,
  subtitle: short,
  date: short,
  description: text,
  hidden: z.boolean().default(false),
});
export const portfolioSchema = z.object({
  name: short.min(1),
  position: short,
  intro: text,
  about: text,
  location: short,
  email: z.union([z.literal(""), z.email()]),
  phone: short,
  portrait: asset,
  resume: asset,
  availability: short,
  available: z.boolean(),
  socials: z
    .array(
      z.object({
        label: short.min(1),
        url: webUrl,
        hidden: z.boolean().default(false),
      }),
    )
    .max(20),
  experience: z.array(row).max(40),
  education: z.array(row).max(30),
  skills: z
    .array(z.object({ title: short, hidden: z.boolean().default(false) }))
    .max(60),
  seoTitle: short,
  seoDescription: z.string().max(300),
});
export const entrySchema = z.object({
  title: short.min(1),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase words separated by hyphens",
    )
    .max(120),
  excerpt: z.string().max(500),
  body: z.string().max(50000),
  cover: asset,
  gallery: z.array(asset).max(20),
  category: short,
  role: short,
  date: short,
  skills: z.string().max(500),
  url: webUrl,
  featured: z.boolean(),
  order: z.number().int().min(0).max(9999),
  seoTitle: short,
  seoDescription: z.string().max(300),
});
export type Portfolio = z.infer<typeof portfolioSchema>;
export type Entry = z.infer<typeof entrySchema>;
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  subject: z.string().trim().min(2).max(180),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(200).default(""),
});
export const emptyEntry: Entry = {
  title: "Untitled story",
  slug: "untitled-story",
  excerpt: "",
  body: "",
  cover: "",
  gallery: [],
  category: "",
  role: "",
  date: "",
  skills: "",
  url: "",
  featured: false,
  order: 0,
  seoTitle: "",
  seoDescription: "",
};
export function mediaIds(kind: string, value: unknown): string[] {
  if (!value) return [];
  const d = value as Record<string, unknown>;
  return (
    kind === "portfolio"
      ? [d.portrait, d.resume]
      : [d.cover, ...(Array.isArray(d.gallery) ? d.gallery : [])]
  ).filter((v): v is string => typeof v === "string" && !!v);
}
