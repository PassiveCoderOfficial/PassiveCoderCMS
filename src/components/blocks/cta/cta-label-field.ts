import type { CTABlockProps } from "@/types/cms";

/** Field a CTA button label is edited through on the canvas: with the booking
 *  toggle on, the second button is the Book button (bookingLabel). */
export function ctaLabelField(data: CTABlockProps["data"], btn: "primaryButton" | "secondaryButton" | "tertiaryButton"): string {
  return btn === "secondaryButton" && data.showBooking ? "bookingLabel" : `${btn}.label`;
}
