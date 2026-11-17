/**
 * What the visitor sees for the job intake in the chat widget, in English and
 * Arabic. No server code here: the widget imports this.
 */
export type IntakeLang = "en" | "ar";

/** Visitor-safe card on the AI's message (stored in site_chat_messages.meta, returned by the public GET). */
export type VisitCard = {
  kind: "visit" | "lead";
  lang: IntakeLang;
  /** The site's word, in the visitor's language ("site visit"). */
  word: string;
  when: string | null;
  status: "pending" | "confirmed" | null;
  /** Prefilled message from the visitor to the business. They still have to tap and send. */
  whatsapp: string | null;
  manageUrl: string | null;
};

export type ChatPhoto = { url: string; width?: number | null; height?: number | null };
export type MessageMeta = { photos?: ChatPhoto[]; visit?: VisitCard };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const WORDS_AR: Record<string, string> = { "site visit": "زيارة الموقع", inspection: "المعاينة" };

/** The site's word in the visitor's language. A site's own custom word stays as the site wrote it. */
export const localWord = (word: string, lang: IntakeLang) => (lang === "ar" ? WORDS_AR[word.trim().toLowerCase()] ?? word : word);

export function intakeCopy(lang: IntakeLang) {
  return lang === "ar"
    ? {
        addPhoto: "إرسال صورة",
        uploading: "جارٍ إرسال الصور…",
        photoFail: "تعذّر إرسال الصورة. جرّب صورة أخرى بصيغة JPG أو PNG.",
        photosSent: (n: number) => (n > 1 ? `أرسلت ${n} صور.` : "أرسلت صورة."),
        photoAlt: "صورة من الزائر",
        visitTitle: (c: VisitCard) => (c.status === "confirmed" ? `تم تأكيد ${c.word}` : `تم طلب ${c.word}`),
        visitNote: (c: VisitCard) => (c.status === "confirmed" ? "سيتواصل معك الفريق." : "سيؤكد الفريق هذا الموعد معك."),
        leadTitle: () => "وصلت تفاصيلك إلى الفريق",
        leadNote: () => "سيتواصل معك الفريق قريبًا.",
        sendWhatsapp: "أرسل التفاصيل عبر واتساب",
        manage: "تغيير الموعد أو إلغاؤه",
      }
    : {
        addPhoto: "Send a photo",
        uploading: "Sending photos…",
        photoFail: "Could not send that photo. Please try another JPG or PNG.",
        photosSent: (n: number) => (n > 1 ? `I sent ${n} photos.` : "I sent a photo."),
        photoAlt: "Photo from the visitor",
        visitTitle: (c: VisitCard) => `${cap(c.word)} ${c.status === "confirmed" ? "confirmed" : "requested"}`,
        visitNote: (c: VisitCard) => (c.status === "confirmed" ? "The team will be in touch." : "The team will confirm this time with you."),
        leadTitle: () => "The team has your details",
        leadNote: () => "They will contact you soon.",
        sendWhatsapp: "Send these details on WhatsApp",
        manage: "Change or cancel",
      };
}
