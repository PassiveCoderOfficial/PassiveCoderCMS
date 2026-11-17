"use client";

import type { BookingBlockProps } from "@/types/cms";
import { BookingWidget, BOOKING_LABELS_EN, type BookingLabels } from "@/components/booking/booking-widget";
import { uiText } from "@/modules/page-builder/ui-text";

/**
 * The widget's words with this block's own replacements (Words on this
 * section). Empty fields keep the widget's built-in text, so blocks saved
 * before these fields existed render exactly as before. One email / phone /
 * note field covers both contact rules (one of them, or both required).
 */
export function bookingLabels(data: BookingBlockProps["data"]): BookingLabels {
  const t = uiText("booking", data);
  const own = t.own;
  const email = own("emailPlaceholder"), phone = own("phonePlaceholder"), note = own("contactNoteText");
  const manageEmail = own("manageEmailText");
  return {
    ...BOOKING_LABELS_EN,
    noTimes: t("noTimesText"),
    at: t("atText"),
    name: t("namePlaceholder"),
    ...(email ? { email, emailOr: email } : {}),
    ...(phone ? { phone, phoneOr: phone } : {}),
    ...(note ? { bothRequired: note, oneRequired: note } : {}),
    messagePh: t("messagePlaceholder"),
    emailed: t("emailedText"),
    willCall: t("callText"),
    manageLater: t("manageText"),
    manageLink: t("manageLinkLabel"),
    // Built-in text starts with a space (it follows the link).
    ...(manageEmail ? { manageInEmail: ` ${manageEmail.trim()}` } : {}),
  };
}

/** Site booking block: the shared widget on this site's own booking API. */
export function BookingBlock({ block }: { block: BookingBlockProps }) {
  const { data } = block;
  return (
    <BookingWidget endpoint="/api/bookings/public" accent={data.accentColor} title={data.title} subtitle={data.subtitle}
      daysToShow={data.daysToShow} showMessage={data.showMessage} submitLabel={data.submitLabel} labels={bookingLabels(data)} />
  );
}
