// /<lang>/products/<slug>: the product page in another language. All logic
// lives in the main product page, which reads `lang` from the route params.
export { default, generateMetadata } from "@/app/(site)/products/[slug]/page";
export const dynamic = "force-dynamic";
