// /<lang>/shop: the shop in another language. All logic lives in the main
// shop page, which reads `lang` from the route params.
export { default, generateMetadata } from "@/app/(site)/shop/page";
export const dynamic = "force-dynamic";
