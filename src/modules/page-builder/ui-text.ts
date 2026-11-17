/**
 * Built-in words of blocks (button labels, form placeholders, empty states,
 * filter options, badges...) that a site owner can now replace, per block.
 *
 * One list per block type is the single source for:
 *  - the renderer: `uiText(type, data)` returns the saved text, or the exact
 *    built-in text when the field is empty (so blocks saved before a field
 *    existed render exactly as before);
 *  - the web settings panel (UiTextFields): one box per entry, the built-in
 *    text shown in grey as the placeholder;
 *  - block-fields.ts (mobile editor) and the MCP block docs.
 *
 * Keys are flat `data` fields. Every key ends in Label / Text / Title /
 * Placeholder so the AI page translator (lib/i18n-site/translate.ts) picks
 * them up on language versions. Nothing is written to registry defaults:
 * an empty field keeps the built-in text, which for storefront words is the
 * page language's own wording (storeText) rather than English.
 *
 * Data only: no React.
 */

type Data = Record<string, unknown>;

export type UiTextDef = {
  /** data key */
  key: string;
  /** Built-in text, rendered when the field is empty. A function when it depends on other settings. */
  en: string | ((d: Data) => string);
  /** Field label (English panel) and its Bangla label (mobile editor). */
  label: string;
  bn: string;
  /** Panel sub-heading the box is grouped under. */
  section?: string;
  /** Panel: shown only when this holds for the block's current settings (layout, toggles). */
  when?: (d: Data) => boolean;
  /** Mobile editor: same idea, declarative (sibling field must exist in the schema). */
  showWhen?: { field: string; in: string[] };
  /** Typing "-" hides the line (optional sentences, not buttons). */
  hideable?: boolean;
  multiline?: boolean;
  /** A list (one per line) instead of one text; this is the built-in list. */
  lines?: readonly string[];
  /** Panel hint under the box. */
  note?: string;
};

const on = (k: string) => (d: Data) => !!d[k];
const isPortrait = (d: Data) => !!d.portraitImage;
const isMobileLayout = (d: Data) => !!d.mobileLayout && d.mobileLayout !== "default";

// ── ecommerce product cards: which card the layout / card style draws ──────
const CARD_LAYOUTS = ["list", "featured", "minimal", "wide-cards", "carousel"];
const cardLayout = (d: Data) => !CARD_LAYOUTS.includes(String(d.layout ?? "grid")) || ["carousel", "featured"].includes(String(d.layout));
const productMode = (d: Data) => d.showAs !== "categories";
const cardStyleIs = (...s: string[]) => (d: Data) => productMode(d) && cardLayout(d) && s.includes(String(d.cardStyle ?? "default"));
const plainCard = (d: Data) => productMode(d) && ((cardLayout(d) && !["boutique", "retail"].includes(String(d.cardStyle ?? "default"))) || ["wide-cards", "list"].includes(String(d.layout)));
const withButtons = (f: (d: Data) => boolean) => (d: Data) => f(d) && d.showAddToCart !== false;

// ── contact form: which field types the form has ───────────────────────────
const contactHas = (d: Data, type: string) => Array.isArray(d.fields) && d.fields.some((f) => (f as { type?: string } | null)?.type === type);

// ── real estate search: split (portrait) layout vs the default bar ─────────
const reSplit = (split: string, bar: string) => (d: Data) => (isPortrait(d) ? split : bar);

export const UI_TEXT = {
  header_account: [
    { key: "signInLabel", en: "Sign in", label: "Text when signed out", bn: "সাইন আউট অবস্থায় লেখা", when: on("showLabel"), showWhen: { field: "showLabel", in: ["true"] } },
    { key: "accountLabel", en: "Account", label: "Text when signed in", bn: "সাইন ইন অবস্থায় লেখা", when: on("showLabel"), showWhen: { field: "showLabel", in: ["true"] } },
  ],
  header_cart: [
    { key: "cartLabel", en: "Cart", label: "Text beside the icon", bn: "আইকনের পাশের লেখা", when: on("showLabel"), showWhen: { field: "showLabel", in: ["true"] } },
  ],
  navigation: [
    { key: "searchAllLabel", en: "All", label: "'All categories' choice in the search box", bn: "সার্চ বক্সে 'সব ক্যাটাগরি' অপশন", when: (d) => !!d.showSearch && !!d.searchCategoryFilter },
    { key: "accountLabel", en: "My account", label: "Account link in the phone menu", bn: "ফোন মেনুতে অ্যাকাউন্ট লিংক", when: (d) => !!d.showAccount && isMobileLayout(d), note: "Empty: \"My account\" (Arabic pages: حسابي)." },
    { key: "trackOrderLabel", en: "Track your order", label: "Track-order link in the phone menu", bn: "ফোন মেনুতে অর্ডার ট্র্যাক লিংক", when: (d) => !!d.trackOrderUrl && isMobileLayout(d), note: "Empty: \"Track your order\" (Arabic pages: تتبّع طلبك)." },
  ],
  footer: [
    { key: "newsletterText", en: "Tips, offers and service updates — no spam.", label: "Line under the newsletter title", bn: "নিউজলেটার শিরোনামের নিচের লাইন", hideable: true, when: (d) => !!d.showNewsletter && d.style !== "retail", showWhen: { field: "showNewsletter", in: ["true"] } },
    { key: "newsletterButtonLabel", en: "Subscribe", label: "Newsletter button", bn: "নিউজলেটার বাটন", when: (d) => !!d.showNewsletter && d.style !== "retail", showWhen: { field: "showNewsletter", in: ["true"] } },
    { key: "newsletterDoneLabel", en: "Subscribed", label: "Newsletter button after signing up", bn: "সাইন আপের পরে নিউজলেটার বাটন", when: (d) => !!d.showNewsletter && d.style !== "retail", showWhen: { field: "showNewsletter", in: ["true"] } },
  ],
  booking: [
    { key: "noTimesText", en: "No available times on this day — try another date.", label: "When a day has no free times", bn: "কোনো দিনে খালি সময় না থাকলে", section: "Picking a time" },
    { key: "atText", en: "at", label: "Word between the date and the time", bn: "তারিখ আর সময়ের মাঝের শব্দ", section: "Picking a time" },
    { key: "namePlaceholder", en: "Your name", label: "Name box", bn: "নামের ঘর", section: "Form" },
    { key: "emailPlaceholder", en: "Email (or phone)", label: "Email box", bn: "ইমেইলের ঘর", section: "Form", note: "Empty: \"Email (or phone)\", or \"Email\" when both are required (Dashboard > Bookings)." },
    { key: "phonePlaceholder", en: "Phone / WhatsApp (or email)", label: "Phone box", bn: "ফোনের ঘর", section: "Form", note: "Empty: \"Phone / WhatsApp (or email)\", or \"Phone / WhatsApp\" when both are required." },
    { key: "contactNoteText", en: "Give us an email or a phone / WhatsApp number, at least one.", label: "Note under the phone box", bn: "ফোনের ঘরের নিচের নোট", section: "Form", note: "Empty: the note for your Bookings setting (one of them, or both required)." },
    { key: "messagePlaceholder", en: "Anything we should know?", label: "Message box", bn: "বার্তার ঘর", section: "Form", when: on("showMessage"), showWhen: { field: "showMessage", in: ["true"] } },
    { key: "emailedText", en: "A confirmation email is on its way to you.", label: "After booking, when an email was sent", bn: "বুকিংয়ের পরে, ইমেইল পাঠানো হলে", section: "After booking" },
    { key: "callText", en: "We will contact you on the number you gave us.", label: "After booking, when no email was given", bn: "বুকিংয়ের পরে, ইমেইল না দিলে", section: "After booking" },
    { key: "manageText", en: "Need to change or cancel later?", label: "Change or cancel line", bn: "বদল বা বাতিলের লাইন", section: "After booking" },
    { key: "manageLinkLabel", en: "Use your booking link", label: "Change or cancel link", bn: "বদল বা বাতিলের লিংক", section: "After booking" },
    { key: "manageEmailText", en: "(also in your email)", label: "Words after the link when an email was sent", bn: "ইমেইল পাঠানো হলে লিংকের পরের লেখা", section: "After booking" },
  ],
  contact: [
    { key: "callLabel", en: "Call us", label: "Small label above the phone", bn: "ফোনের উপরের ছোট লেখা", section: "Contact details", when: (d) => !!d.showContactInfo && !!d.phone, showWhen: { field: "showContactInfo", in: ["true"] } },
    { key: "emailLabel", en: "Email us", label: "Small label above the email", bn: "ইমেইলের উপরের ছোট লেখা", section: "Contact details", when: (d) => !!d.showContactInfo && !!d.email, showWhen: { field: "showContactInfo", in: ["true"] } },
    { key: "visitLabel", en: "Visit us", label: "Small label above the address", bn: "ঠিকানার উপরের ছোট লেখা", section: "Contact details", when: (d) => !!d.showContactInfo && !!d.address, showWhen: { field: "showContactInfo", in: ["true"] } },
    { key: "hoursLabel", en: "Opening hours", label: "Small label above the opening hours", bn: "খোলার সময়ের উপরের ছোট লেখা", section: "Contact details", when: (d) => !!d.showContactInfo && !!d.hours, showWhen: { field: "showContactInfo", in: ["true"] } },
    { key: "whatsappLabel", en: "Chat on WhatsApp", label: "WhatsApp button", bn: "হোয়াটসঅ্যাপ বাটন", section: "Contact details", when: (d) => !!d.showContactInfo && !!d.whatsapp, showWhen: { field: "showContactInfo", in: ["true"] } },
    { key: "sendingLabel", en: "Sending…", label: "Button while sending", bn: "পাঠানোর সময় বাটনের লেখা", section: "Form", when: (d) => !d.hideForm },
    { key: "selectPlaceholder", en: "Select…", label: "First line of dropdown fields", bn: "ড্রপডাউন ঘরের প্রথম লাইন", section: "Form", when: (d) => !d.hideForm && contactHas(d, "select") },
    { key: "filePlaceholder", en: "Choose file (PDF, Word or image, max 10 MB)", label: "File upload box", bn: "ফাইল আপলোডের ঘর", section: "Form", when: (d) => !d.hideForm && d.formStyle !== "filled" && contactHas(d, "file") },
    { key: "quotePrefillText", en: "I would like a quote for:", label: "Message start for get-a-quote links", bn: "কোটেশন লিংকের বার্তার শুরু", section: "Form", note: "Put in the message box when a visitor taps a link to this form that names an item.", when: (d) => !d.hideForm && contactHas(d, "textarea") },
    { key: "whatsappContinueLabel", en: "Continue on WhatsApp", label: "WhatsApp button after sending", bn: "পাঠানোর পরে হোয়াটসঅ্যাপ বাটন", section: "After sending", when: (d) => !d.hideForm && !!(d.whatsappAfterSubmit as { enabled?: boolean } | undefined)?.enabled },
  ],
  ecommerce_products: [
    { key: "emptyText", en: (d) => (d.showAs === "categories" ? "Pick categories in the block settings." : "No products available."), label: "When there is nothing to show", bn: "দেখানোর কিছু না থাকলে" },
    { key: "itemLabel", en: "item", label: "Count word for one product", bn: "একটি পণ্যের সংখ্যার শব্দ", section: "Category tiles", when: (d) => d.showAs === "categories" && !!d.showCount && (d.tileShape ?? "classic") !== "classic" },
    { key: "itemsLabel", en: "items", label: "Count word for several products", bn: "একাধিক পণ্যের সংখ্যার শব্দ", section: "Category tiles", when: (d) => d.showAs === "categories" && !!d.showCount && (d.tileShape ?? "classic") !== "classic" },
    { key: "addLabel", en: "Add", label: "Add button", bn: "যোগ করার বাটন", section: "Card buttons and badges", when: withButtons(plainCard) },
    { key: "addToCartLabel", en: "Add to cart", label: "Add to cart button", bn: "কার্টে যোগের বাটন", section: "Card buttons and badges", when: withButtons(cardStyleIs("boutique", "retail")) },
    { key: "soldOutLabel", en: "Sold out", label: "Button when sold out", bn: "স্টক শেষ হলে বাটন", section: "Card buttons and badges", when: withButtons((d) => productMode(d) && d.layout !== "minimal") },
    { key: "outOfStockLabel", en: "Out of stock", label: "Out of stock badge", bn: "স্টক নেই ব্যাজ", section: "Card buttons and badges", when: (d) => productMode(d) && cardLayout(d) && d.showBadges !== false },
    { key: "saleLabel", en: "Sale!", label: "Sale badge", bn: "সেল ব্যাজ", section: "Card buttons and badges", when: (d) => cardStyleIs("boutique")(d) && d.showBadges !== false },
    { key: "saleTagLabel", en: "SALE", label: "Sale badge", bn: "সেল ব্যাজ", section: "Card buttons and badges", when: (d) => cardStyleIs("retail")(d) && d.showBadges !== false },
    { key: "bestSellerLabel", en: "Best Seller", label: "Badge on featured products", bn: "ফিচার্ড পণ্যের ব্যাজ", section: "Card buttons and badges", when: (d) => cardStyleIs("retail")(d) && d.showBadges !== false },
    { key: "chooseSizeLabel", en: "Choose size", label: "Button before a size is picked", bn: "সাইজ বাছার আগে বাটন", section: "Card buttons and badges", when: withButtons(cardStyleIs("retail")) },
    { key: "chooseOptionsLabel", en: "Choose options", label: "Button on products with options", bn: "অপশনসহ পণ্যের বাটন", section: "Card buttons and badges", when: withButtons(cardStyleIs("retail")) },
    { key: "selectOptionsLabel", en: "Select options", label: "Button on products with options", bn: "অপশনসহ পণ্যের বাটন", section: "Card buttons and badges", when: withButtons(cardStyleIs("boutique")) },
  ],
  marketplace_booking: [
    { key: "stepServiceLabel", en: "Service", label: "Step 1 name", bn: "ধাপ ১-এর নাম", section: "Steps and questions" },
    { key: "stepDetailsLabel", en: "Details", label: "Step 2 name", bn: "ধাপ ২-এর নাম", section: "Steps and questions" },
    { key: "categoryQuestionLabel", en: "What do you need help with?", label: "Category question", bn: "ক্যাটাগরির প্রশ্ন", section: "Steps and questions" },
    { key: "serviceQuestionLabel", en: "Which service?", label: "Service question", bn: "সার্ভিসের প্রশ্ন", section: "Steps and questions" },
    { key: "selectServicePlaceholder", en: "Select a service", label: "Service list placeholder", bn: "সার্ভিস তালিকার প্লেসহোল্ডার", section: "Steps and questions" },
    { key: "dayLabel", en: "Pick a day", label: "Day heading", bn: "দিনের শিরোনাম", section: "Steps and questions" },
    { key: "timeLabel", en: "Pick a time", label: "Time heading", bn: "সময়ের শিরোনাম", section: "Steps and questions" },
    { key: "noTimesText", en: "No open times this day — try another date.", label: "When a day has no free times", bn: "কোনো দিনে খালি সময় না থাকলে", section: "Steps and questions" },
    { key: "namePlaceholder", en: "Your name", label: "Name box", bn: "নামের ঘর", section: "Form" },
    { key: "phonePlaceholder", en: "Phone number", label: "Phone box", bn: "ফোনের ঘর", section: "Form" },
    { key: "addressPlaceholder", en: "Address", label: "Address box", bn: "ঠিকানার ঘর", section: "Form" },
    { key: "pinLabel", en: "Pin your location", label: "Map heading", bn: "ম্যাপের শিরোনাম", section: "Form" },
    { key: "pinHintText", en: "(optional, helps us find you faster)", label: "Small text beside the map heading", bn: "ম্যাপ শিরোনামের পাশের ছোট লেখা", section: "Form", hideable: true },
    { key: "whatsappLabel", en: "Also send details to WhatsApp!", label: "WhatsApp tick box", bn: "হোয়াটসঅ্যাপ টিক বক্স", section: "Form" },
    { key: "doneTitle", en: "Request received!", label: "Heading after sending", bn: "পাঠানোর পরের শিরোনাম", section: "After sending" },
    { key: "doneText", en: "We'll confirm your booking shortly.", label: "Text after sending", bn: "পাঠানোর পরের লেখা", section: "After sending" },
  ],
  marketplace_request: [
    { key: "urgencyQuestionLabel", en: "How urgent is this?", label: "Urgency question", bn: "জরুরি কিনা প্রশ্ন", section: "Questions" },
    { key: "regularLabel", en: "Regular", label: "Regular choice", bn: "সাধারণ অপশন", section: "Questions" },
    { key: "urgentLabel", en: "Urgent", label: "Urgent choice", bn: "জরুরি অপশন", section: "Questions" },
    { key: "urgentNoteText", en: "Nearby providers get notified right away, with follow-up waves every 10 minutes until someone responds.", label: "Note when Urgent is picked", bn: "জরুরি বাছাই করলে নোট", section: "Questions", multiline: true },
    { key: "categoryQuestionLabel", en: "What do you need help with?", label: "Category question", bn: "ক্যাটাগরির প্রশ্ন", section: "Questions" },
    { key: "serviceQuestionLabel", en: "Which service?", label: "Service question", bn: "সার্ভিসের প্রশ্ন", section: "Questions" },
    { key: "selectServicePlaceholder", en: "Select a service", label: "Service list placeholder", bn: "সার্ভিস তালিকার প্লেসহোল্ডার", section: "Questions" },
    { key: "describePlaceholder", en: "Describe the issue", label: "Description box", bn: "বিবরণের ঘর", section: "Form" },
    { key: "namePlaceholder", en: "Your name", label: "Name box", bn: "নামের ঘর", section: "Form" },
    { key: "phonePlaceholder", en: "Phone number", label: "Phone box", bn: "ফোনের ঘর", section: "Form" },
    { key: "addressPlaceholder", en: "Address", label: "Address box", bn: "ঠিকানার ঘর", section: "Form" },
    { key: "pinLabel", en: "Pin your location", label: "Map heading", bn: "ম্যাপের শিরোনাম", section: "Form" },
    { key: "doneTitle", en: "Request posted!", label: "Heading after sending", bn: "পাঠানোর পরের শিরোনাম", section: "After sending" },
    { key: "doneText", en: "We'll be in touch shortly.", label: "Text after sending (regular)", bn: "পাঠানোর পরের লেখা (সাধারণ)", section: "After sending" },
    { key: "urgentDoneText", en: "Nearby providers have been notified — you'll hear back soon.", label: "Text after sending (urgent)", bn: "পাঠানোর পরের লেখা (জরুরি)", section: "After sending" },
  ],
  marketplace_vendor_directory: [
    { key: "emptyText", en: "No providers listed yet — check back soon.", label: "When no providers are listed", bn: "কোনো সেবাদাতা না থাকলে" },
    { key: "verifiedLabel", en: "Verified", label: "Badge on each card", bn: "প্রতিটি কার্ডের ব্যাজ", when: (d) => d.showCards !== false },
    { key: "bookLabel", en: "Book with this provider", label: "Link on each card", bn: "প্রতিটি কার্ডের লিংক", when: (d) => d.showCards !== false },
  ],
  re_search: [
    { key: "saleTabLabel", en: "Buy", label: "Buy tab", bn: "কেনার ট্যাব", section: "Tabs" },
    { key: "rentTabLabel", en: "Rent", label: "Rent tab", bn: "ভাড়ার ট্যাব", section: "Tabs" },
    { key: "offplanTabLabel", en: "Off-Plan", label: "Off-plan tab", bn: "নির্মাণাধীন ট্যাব", section: "Tabs" },
    { key: "locationLabel", en: "Location", label: "Location heading", bn: "এলাকার শিরোনাম", section: "Search fields", when: isPortrait },
    { key: "allLocationsLabel", en: "All locations", label: "'All locations' choice", bn: "'সব এলাকা' অপশন", section: "Search fields" },
    { key: "typeLabel", en: "Property type", label: "Property type heading", bn: "প্রপার্টির ধরনের শিরোনাম", section: "Search fields", when: isPortrait },
    { key: "anyTypeLabel", en: "Any type", label: "'Any type' choice", bn: "'যেকোনো ধরন' অপশন", section: "Search fields" },
    { key: "bedroomsLabel", en: "Bedrooms", label: "Bedrooms heading", bn: "বেডরুমের শিরোনাম", section: "Search fields", when: isPortrait },
    { key: "anyBedsLabel", en: reSplit("Any", "Beds"), label: "'Any bedrooms' choice", bn: "'যেকোনো বেডরুম' অপশন", section: "Search fields" },
    { key: "studioLabel", en: "Studio+", label: "Studio choice", bn: "স্টুডিও অপশন", section: "Search fields" },
    { key: "budgetLabel", en: "Max budget", label: "Budget heading", bn: "বাজেটের শিরোনাম", section: "Search fields", when: isPortrait },
    { key: "anyPriceLabel", en: reSplit("No limit", "Max price"), label: "'Any price' choice", bn: "'যেকোনো দাম' অপশন", section: "Search fields" },
    { key: "upToLabel", en: "Up to", label: "Word before each price", bn: "প্রতিটি দামের আগের শব্দ", section: "Search fields", when: isPortrait },
    { key: "searchButtonLabel", en: reSplit("Search properties", "Search"), label: "Search button", bn: "সার্চ বাটন", section: "Search fields" },
  ],
  re_listings: [
    { key: "allTabLabel", en: "All", label: "'All' tab", bn: "'সব' ট্যাব", section: "Filters", when: (d) => d.showFilters !== false && !d.listingType },
    { key: "saleTabLabel", en: "Buy", label: "Buy tab", bn: "কেনার ট্যাব", section: "Filters", when: (d) => d.showFilters !== false && !d.listingType },
    { key: "rentTabLabel", en: "Rent", label: "Rent tab", bn: "ভাড়ার ট্যাব", section: "Filters", when: (d) => d.showFilters !== false && !d.listingType },
    { key: "offplanTabLabel", en: "Off-Plan", label: "Off-plan tab", bn: "নির্মাণাধীন ট্যাব", section: "Filters", when: (d) => d.showFilters !== false && !d.listingType },
    { key: "filtersLabel", en: "Filters", label: "Filters button (phones)", bn: "ফিল্টার বাটন (ফোনে)", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "allLocationsLabel", en: "All locations", label: "'All locations' choice", bn: "'সব এলাকা' অপশন", section: "Filters", when: (d) => d.showFilters !== false && !d.communitySlug },
    { key: "anyTypeLabel", en: "Any type", label: "'Any type' choice", bn: "'যেকোনো ধরন' অপশন", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "anyBedsLabel", en: "Any beds", label: "'Any bedrooms' choice", bn: "'যেকোনো বেডরুম' অপশন", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "studioLabel", en: "Studio+", label: "Studio choice", bn: "স্টুডিও অপশন", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "bedsLabel", en: "beds", label: "Word after the bedroom number", bn: "বেডরুম সংখ্যার পরের শব্দ", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "minPricePlaceholder", en: "Min price", label: "Lowest price box", bn: "সর্বনিম্ন দামের ঘর", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "maxPricePlaceholder", en: "Max price", label: "Highest price box", bn: "সর্বোচ্চ দামের ঘর", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "sortFeaturedLabel", en: "Featured", label: "Sort: featured", bn: "সাজানো: ফিচার্ড", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "sortNewestLabel", en: "Newest", label: "Sort: newest", bn: "সাজানো: নতুন", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "sortPriceAscLabel", en: "Price: low to high", label: "Sort: price low to high", bn: "সাজানো: দাম কম থেকে বেশি", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "sortPriceDescLabel", en: "Price: high to low", label: "Sort: price high to low", bn: "সাজানো: দাম বেশি থেকে কম", section: "Filters", when: (d) => d.showFilters !== false },
    { key: "propertyLabel", en: "property", label: "Count word for one result", bn: "একটি ফলাফলের সংখ্যার শব্দ", section: "Results", when: (d) => d.showFilters !== false },
    { key: "propertiesLabel", en: "properties", label: "Count word for several results", bn: "একাধিক ফলাফলের সংখ্যার শব্দ", section: "Results", when: (d) => d.showFilters !== false },
    { key: "gridLabel", en: "Grid", label: "Grid view button", bn: "গ্রিড ভিউ বাটন", section: "Results", when: (d) => d.showFilters !== false },
    { key: "mapLabel", en: "Map", label: "Map view button", bn: "ম্যাপ ভিউ বাটন", section: "Results", when: (d) => d.showFilters !== false },
    { key: "emptyTitle", en: "No properties match these filters", label: "When nothing matches", bn: "কিছু না মিললে", section: "Results" },
    { key: "emptyText", en: "Try widening your search, or message us — many deals never reach the public market.", label: "Line under that", bn: "তার নিচের লাইন", section: "Results", multiline: true, hideable: true },
    { key: "loadMoreLabel", en: "Load more", label: "Load more button", bn: "আরও দেখান বাটন", section: "Results", when: (d) => d.showFilters !== false },
    { key: "viewAllLabel", en: "View all properties", label: "'View all' button", bn: "'সব দেখুন' বাটন", section: "Results", when: on("viewAllUrl") },
    { key: "forSaleLabel", en: "For Sale", label: "Badge: for sale", bn: "ব্যাজ: বিক্রি", section: "Property cards" },
    { key: "forRentLabel", en: "For Rent", label: "Badge: for rent", bn: "ব্যাজ: ভাড়া", section: "Property cards" },
    { key: "offPlanLabel", en: "Off-Plan", label: "Badge: off-plan", bn: "ব্যাজ: নির্মাণাধীন", section: "Property cards" },
    { key: "featuredLabel", en: "Featured", label: "Badge: featured", bn: "ব্যাজ: ফিচার্ড", section: "Property cards", when: (d) => (d.cardStyle ?? "standard") === "standard" },
    { key: "reservedLabel", en: "Reserved", label: "Badge: reserved", bn: "ব্যাজ: রিজার্ভড", section: "Property cards", when: (d) => d.cardStyle !== "showcase" },
    { key: "soldLabel", en: "Sold", label: "Badge: sold", bn: "ব্যাজ: বিক্রি হয়েছে", section: "Property cards", when: (d) => d.cardStyle !== "showcase" },
    { key: "rentedLabel", en: "Rented", label: "Badge: rented", bn: "ব্যাজ: ভাড়া হয়েছে", section: "Property cards", when: (d) => d.cardStyle !== "showcase" },
    { key: "byLabel", en: "by", label: "Word before the developer name", bn: "ডেভেলপারের নামের আগের শব্দ", section: "Property cards", when: (d) => (d.cardStyle ?? "standard") === "standard" },
    { key: "handoverLabel", en: "Handover", label: "Word before the handover date", bn: "হস্তান্তরের তারিখের আগের শব্দ", section: "Property cards", when: (d) => (d.cardStyle ?? "standard") === "standard" },
    { key: "studioBedsLabel", en: "Studio", label: "Bedrooms: studio", bn: "বেডরুম: স্টুডিও", section: "Property cards", when: (d) => d.cardStyle === "editorial" },
    { key: "viewResidenceLabel", en: "View residence", label: "Button on each slide", bn: "প্রতিটি স্লাইডের বাটন", section: "Property cards", when: (d) => d.cardStyle === "showcase" },
  ],
  re_communities: [
    { key: "emptyText", en: "Area guides coming soon.", label: "When no areas are added", bn: "কোনো এলাকা না থাকলে" },
    { key: "listingLabel", en: "listing", label: "Count word for one listing", bn: "একটি লিস্টিংয়ের সংখ্যার শব্দ" },
    { key: "listingsLabel", en: "listings", label: "Count word for several listings", bn: "একাধিক লিস্টিংয়ের সংখ্যার শব্দ" },
    { key: "avgLabel", en: "Avg", label: "Word before the average price", bn: "গড় দামের আগের শব্দ" },
    { key: "yieldLabel", en: "yield", label: "Word after the rental yield", bn: "ভাড়ার আয়ের পরের শব্দ" },
  ],
  re_developers: [
    { key: "viewProjectsLabel", en: "View projects →", label: "Link on each card", bn: "প্রতিটি কার্ডের লিংক", when: (d) => d.style === "cards", showWhen: { field: "style", in: ["cards"] } },
  ],
  re_calculator: [
    { key: "mortgageTabLabel", en: "Mortgage", label: "Mortgage tab", bn: "মর্টগেজ ট্যাব", section: "Tabs", when: (d) => (d.mode ?? "both") === "both" },
    { key: "yieldTabLabel", en: "Rental yield", label: "Rental yield tab", bn: "ভাড়ার আয় ট্যাব", section: "Tabs", when: (d) => (d.mode ?? "both") === "both" },
    { key: "priceLabel", en: "Property price", label: "Price box", bn: "দামের ঘর", section: "Boxes" },
    { key: "downPaymentLabel", en: "Down payment", label: "Down payment (box and result)", bn: "ডাউন পেমেন্ট (ঘর ও ফলাফল)", section: "Boxes", when: (d) => d.mode !== "roi" },
    { key: "interestLabel", en: "Interest rate", label: "Interest box", bn: "সুদের ঘর", section: "Boxes", when: (d) => d.mode !== "roi" },
    { key: "termLabel", en: "Loan term", label: "Loan term box", bn: "ঋণের মেয়াদের ঘর", section: "Boxes", when: (d) => d.mode !== "roi" },
    { key: "yearsLabel", en: "years", label: "Unit after the loan term", bn: "ঋণের মেয়াদের পরের একক", section: "Boxes", when: (d) => d.mode !== "roi" },
    { key: "rentLabel", en: "Annual rent", label: "Rent box", bn: "ভাড়ার ঘর", section: "Boxes", when: (d) => d.mode !== "mortgage" },
    { key: "costsLabel", en: "Annual costs (service charge, maintenance)", label: "Costs box", bn: "খরচের ঘর", section: "Boxes", when: (d) => d.mode !== "mortgage" },
    { key: "occupancyLabel", en: "Occupancy", label: "Occupancy box", bn: "ভাড়া থাকার হারের ঘর", section: "Boxes", when: (d) => d.mode !== "mortgage" },
    { key: "monthlyLabel", en: "Monthly payment", label: "Main result (mortgage)", bn: "মূল ফলাফল (মর্টগেজ)", section: "Results", when: (d) => d.mode !== "roi" },
    { key: "loanAmountLabel", en: "Loan amount", label: "Loan amount", bn: "ঋণের পরিমাণ", section: "Results", when: (d) => d.mode !== "roi" },
    { key: "totalInterestLabel", en: "Total interest", label: "Total interest", bn: "মোট সুদ", section: "Results", when: (d) => d.mode !== "roi" },
    { key: "totalCostLabel", en: "Total cost", label: "Total cost", bn: "মোট খরচ", section: "Results", when: (d) => d.mode !== "roi" },
    { key: "netYieldLabel", en: "Net yield", label: "Main result (yield)", bn: "মূল ফলাফল (আয়)", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "grossYieldLabel", en: "Gross yield", label: "Gross yield", bn: "মোট আয়", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "netIncomeLabel", en: "Net income / yr", label: "Net income", bn: "নিট আয়", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "paybackLabel", en: "Payback", label: "Payback", bn: "খরচ উঠে আসার সময়", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "yrsLabel", en: "yrs", label: "Unit after the payback years", bn: "বছরের একক", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "monthlyNetLabel", en: "Monthly net", label: "Monthly net", bn: "মাসিক নিট", section: "Results", when: (d) => d.mode !== "mortgage" },
    { key: "disclaimerText", en: "Estimates for guidance only. Rates and eligibility vary by bank and residency status.", label: "Small print", bn: "ছোট লেখা", section: "Results", multiline: true, hideable: true },
  ],
  re_lead_form: [
    { key: "namePlaceholder", en: "Full name", label: "Name box", bn: "নামের ঘর" },
    { key: "phonePlaceholder", en: "WhatsApp number", label: "Phone box", bn: "ফোনের ঘর" },
    { key: "emailPlaceholder", en: "Email (optional)", label: "Email box", bn: "ইমেইলের ঘর" },
    { key: "budgetPlaceholder", en: "Budget (optional)", label: "Budget list placeholder", bn: "বাজেট তালিকার প্লেসহোল্ডার", when: on("showBudget"), showWhen: { field: "showBudget", in: ["true"] } },
    { key: "budgetOptionsText", en: "Under SAR 1M, SAR 1M – 2M, SAR 2M – 5M, SAR 5M – 10M, SAR 10M+", lines: ["Under SAR 1M", "SAR 1M – 2M", "SAR 2M – 5M", "SAR 5M – 10M", "SAR 10M+"], label: "Budget choices", bn: "বাজেটের অপশন", when: on("showBudget"), showWhen: { field: "showBudget", in: ["true"] } },
    { key: "messagePlaceholder", en: "How can we help?", label: "Message box", bn: "বার্তার ঘর" },
    { key: "replyNoteText", en: "We reply on WhatsApp, usually within the hour.", label: "Small line under the button", bn: "বাটনের নিচের ছোট লাইন", hideable: true },
  ],
  donor_group_cards: [
    { key: "donorLabel", en: "donor", label: "Count word for one donor", bn: "একজন ডোনারের সংখ্যার শব্দ" },
    { key: "donorsLabel", en: "donors", label: "Count word for several donors", bn: "একাধিক ডোনারের সংখ্যার শব্দ" },
  ],
  donor_map: [
    { key: "withinText", en: "Showing donors within {km} km of your location.", label: "Line after a nearby search ({km} = distance)", bn: "কাছাকাছি খোঁজার পরের লাইন ({km} = দূরত্ব)" },
  ],
  donor_requests: [
    { key: "moreLabel", en: "More Requests", label: "'More requests' button", bn: "'আরও অনুরোধ' বাটন" },
  ],
  donor_list: [
    { key: "mapViewLabel", en: "Map + List", label: "Map view button", bn: "ম্যাপ ভিউ বাটন", section: "Top of the list" },
    { key: "listViewLabel", en: "List only", label: "List view button", bn: "তালিকা ভিউ বাটন", section: "Top of the list" },
    { key: "allGroupsLabel", en: "All groups", label: "'All groups' choice", bn: "'সব গ্রুপ' অপশন", section: "Filters", when: on("showFilters") },
    { key: "allDistrictsLabel", en: "All districts", label: "'All districts' choice", bn: "'সব জেলা' অপশন", section: "Filters", when: on("showFilters") },
    { key: "allThanasLabel", en: "All thanas", label: "'All thanas' choice", bn: "'সব থানা' অপশন", section: "Filters", when: on("showFilters") },
    { key: "pickDistrictLabel", en: "Pick district first", label: "Thana list before a district is picked", bn: "জেলা বাছার আগে থানার তালিকা", section: "Filters", when: on("showFilters") },
    { key: "anyStatusLabel", en: "Any status", label: "'Any status' choice", bn: "'যেকোনো অবস্থা' অপশন", section: "Filters", when: on("showFilters") },
    { key: "readyOptionLabel", en: "Ready to donate", label: "Status choice: ready", bn: "অবস্থা: প্রস্তুত", section: "Filters", when: on("showFilters") },
    { key: "soonOptionLabel", en: "Almost ready", label: "Status choice: almost ready", bn: "অবস্থা: প্রায় প্রস্তুত", section: "Filters", when: on("showFilters") },
    { key: "notReadyOptionLabel", en: "Recently donated", label: "Status choice: recently donated", bn: "অবস্থা: সম্প্রতি দিয়েছেন", section: "Filters", when: on("showFilters") },
    { key: "unknownOptionLabel", en: "Unknown", label: "Status choice: unknown", bn: "অবস্থা: অজানা", section: "Filters", when: on("showFilters") },
    { key: "unavailableOptionLabel", en: "Temporarily unavailable", label: "Status choice: unavailable", bn: "অবস্থা: সাময়িক অনুপলব্ধ", section: "Filters", when: on("showFilters") },
    { key: "anyGenderLabel", en: "Any gender", label: "'Any gender' choice", bn: "'যেকোনো লিঙ্গ' অপশন", section: "Filters", when: on("showFilters") },
    { key: "maleLabel", en: "Male", label: "Gender: male", bn: "লিঙ্গ: পুরুষ", section: "Filters", when: on("showFilters") },
    { key: "femaleLabel", en: "Female", label: "Gender: female", bn: "লিঙ্গ: নারী", section: "Filters", when: on("showFilters") },
    { key: "otherGenderLabel", en: "Other", label: "Gender: other", bn: "লিঙ্গ: অন্যান্য", section: "Filters", when: on("showFilters") },
    { key: "anyReligionLabel", en: "Any religion", label: "'Any religion' choice", bn: "'যেকোনো ধর্ম' অপশন", section: "Filters", when: on("showFilters") },
    { key: "muslimLabel", en: "Muslim", label: "Religion: Muslim", bn: "ধর্ম: মুসলিম", section: "Filters", when: on("showFilters") },
    { key: "hinduLabel", en: "Hindu", label: "Religion: Hindu", bn: "ধর্ম: হিন্দু", section: "Filters", when: on("showFilters") },
    { key: "christianLabel", en: "Christian", label: "Religion: Christian", bn: "ধর্ম: খ্রিস্টান", section: "Filters", when: on("showFilters") },
    { key: "buddhistLabel", en: "Buddhist", label: "Religion: Buddhist", bn: "ধর্ম: বৌদ্ধ", section: "Filters", when: on("showFilters") },
    { key: "otherReligionLabel", en: "Other", label: "Religion: other", bn: "ধর্ম: অন্যান্য", section: "Filters", when: on("showFilters") },
    { key: "locationPlaceholder", en: "Location…", label: "Location box", bn: "এলাকার ঘর", section: "Filters", when: on("showFilters") },
    { key: "namePlaceholder", en: "Search name…", label: "Name search box", bn: "নাম খোঁজার ঘর", section: "Filters", when: on("showFilters") },
    { key: "groupChipLabel", en: "Group", label: "Filter tag: group", bn: "ফিল্টার ট্যাগ: গ্রুপ", section: "Filter tags", when: on("showFilters") },
    { key: "districtChipLabel", en: "District", label: "Filter tag: district", bn: "ফিল্টার ট্যাগ: জেলা", section: "Filter tags", when: on("showFilters") },
    { key: "thanaChipLabel", en: "Thana", label: "Filter tag: thana", bn: "ফিল্টার ট্যাগ: থানা", section: "Filter tags", when: on("showFilters") },
    { key: "locationChipLabel", en: "Location", label: "Filter tag: location", bn: "ফিল্টার ট্যাগ: এলাকা", section: "Filter tags", when: on("showFilters") },
    { key: "genderChipLabel", en: "Gender", label: "Filter tag: gender", bn: "ফিল্টার ট্যাগ: লিঙ্গ", section: "Filter tags", when: on("showFilters") },
    { key: "religionChipLabel", en: "Religion", label: "Filter tag: religion", bn: "ফিল্টার ট্যাগ: ধর্ম", section: "Filter tags", when: on("showFilters") },
    { key: "statusChipLabel", en: "Status", label: "Filter tag: status", bn: "ফিল্টার ট্যাগ: অবস্থা", section: "Filter tags", when: on("showFilters") },
    { key: "nameChipLabel", en: "Name", label: "Filter tag: name", bn: "ফিল্টার ট্যাগ: নাম", section: "Filter tags", when: on("showFilters") },
    { key: "withinText", en: "Within {km} km of you", label: "Tag after a nearby search ({km} = distance)", bn: "কাছাকাছি খোঁজার ট্যাগ ({km} = দূরত্ব)", section: "Filter tags", when: on("showFilters") },
    { key: "mapAreaLabel", en: "Map view area", label: "Tag when the map is moved", bn: "ম্যাপ সরালে ট্যাগ", section: "Filter tags", when: on("showFilters") },
    { key: "resetLabel", en: "Reset all", label: "Reset button", bn: "রিসেট বাটন", section: "Filter tags", when: on("showFilters") },
    { key: "groupColumnLabel", en: "Group", label: "Column: group", bn: "কলাম: গ্রুপ", section: "List" },
    { key: "nameColumnLabel", en: "Name & location", label: "Column: name", bn: "কলাম: নাম", section: "List" },
    { key: "ageColumnLabel", en: "Age", label: "Column: age", bn: "কলাম: বয়স", section: "List" },
    { key: "statusColumnLabel", en: "Status", label: "Column: status", bn: "কলাম: অবস্থা", section: "List" },
    { key: "emptyText", en: "No donors match these filters yet.", label: "When nothing matches", bn: "কিছু না মিললে", section: "List" },
    { key: "noLocationLabel", en: "Location not set", label: "When a donor has no location", bn: "ডোনারের এলাকা না থাকলে", section: "List" },
    { key: "yearsLabel", en: "yrs", label: "Word after the age", bn: "বয়সের পরের শব্দ", section: "List" },
    { key: "readyStatusLabel", en: "Ready", label: "Status: ready", bn: "অবস্থা: প্রস্তুত", section: "Status tags" },
    { key: "readyToDonateLabel", en: "Ready to donate", label: "Status: ready (with a donation date)", bn: "অবস্থা: প্রস্তুত (দানের তারিখসহ)", section: "Status tags" },
    { key: "soonStatusLabel", en: "Almost", label: "Status: almost ready", bn: "অবস্থা: প্রায় প্রস্তুত", section: "Status tags" },
    { key: "notReadyStatusLabel", en: "Not yet", label: "Status: not yet", bn: "অবস্থা: এখনও না", section: "Status tags" },
    { key: "unknownStatusLabel", en: "Unknown", label: "Status: unknown", bn: "অবস্থা: অজানা", section: "Status tags" },
    { key: "unavailableStatusLabel", en: "Unavailable", label: "Status: unavailable", bn: "অবস্থা: অনুপলব্ধ", section: "Status tags" },
    { key: "daysAgoText", en: "{days} days ago", label: "Days since the last donation ({days} = number)", bn: "শেষ দানের পর দিন ({days} = সংখ্যা)", section: "Status tags" },
    { key: "footerText", en: "Tap a donor to see contact details and full profile.", label: "Line under the list", bn: "তালিকার নিচের লাইন", section: "List", hideable: true },
  ],
  results_search: [
    { key: "dobPlaceholder", en: "Date of Birth (DD-MM-YYYY)", label: "Date of birth box", bn: "জন্মতারিখের ঘর", section: "Search", note: "Shown when Results Settings ask for the date of birth. Empty: the field name from Results Settings + (DD-MM-YYYY)." },
    { key: "rollPlaceholder", en: "Roll No", label: "Roll number box", bn: "রোল নম্বরের ঘর", section: "Search", note: "Shown when Results Settings ask for the roll number. Empty: the field name from Results Settings." },
    { key: "notFoundTitle", en: "No result found", label: "When nothing is found", bn: "কিছু না পাওয়া গেলে", section: "Result" },
    { key: "notFoundText", en: "Check the certificate number and try again.", label: "Line under that", bn: "তার নিচের লাইন", section: "Result", note: "Empty: \"Check the <certificate field> and try again.\" (mentions the other details when the lookup asks for them)." },
    { key: "cardTitle", en: "Result Verification", label: "Result card heading", bn: "রেজাল্ট কার্ডের শিরোনাম", section: "Result" },
    { key: "verifiedLabel", en: "Verified record", label: "Result card badge", bn: "রেজাল্ট কার্ডের ব্যাজ", section: "Result" },
    { key: "verifyLinkLabel", en: "Verification link:", label: "Words before the verification link", bn: "যাচাইয়ের লিংকের আগের লেখা", section: "Result" },
    { key: "printLabel", en: "Print result card", label: "Print button", bn: "প্রিন্ট বাটন", section: "Result", when: (d) => d.showPrint !== false },
    { key: "verifyPageLabel", en: "Verification page & QR", label: "Verification page button", bn: "যাচাই পেজের বাটন", section: "Result" },
  ],
  results_courses: [
    { key: "emptyText", en: "Courses will appear here once added in Dashboard → Results → Courses.", label: "When no courses are added", bn: "কোনো কোর্স না থাকলে" },
  ],
  results_alumni: [
    { key: "emptyText", en: "Feature students in Dashboard → Results to show them here.", label: "When no students are picked", bn: "কোনো শিক্ষার্থী বাছাই না থাকলে" },
  ],
  status_tracker: [
    { key: "orderIdLabel", en: "Order ID", label: "Order number heading", bn: "অর্ডার নম্বরের শিরোনাম", when: (d) => d.mode === "order", showWhen: { field: "mode", in: ["order"] } },
    { key: "emailLabel", en: "Billing email", label: "Email heading", bn: "ইমেইলের শিরোনাম", when: (d) => d.mode === "order", showWhen: { field: "mode", in: ["order"] } },
    { key: "referenceLabel", en: "Reference", label: "Result: reference heading", bn: "ফলাফল: রেফারেন্সের শিরোনাম", when: (d) => d.mode !== "order" },
    { key: "notFoundText", en: (d) => (d.mode === "order"
      ? "Sorry, we couldn't find an order with those details. Please check the order number and email."
      : "We couldn't find an application for that reference yet. If you've just applied, status may take 24–48 hours to appear. Contact our team on WhatsApp for an instant update."),
      label: "When nothing is found", bn: "কিছু না পাওয়া গেলে", multiline: true, note: "Empty: the lookup's own message (shown in grey)." },
    { key: "contactLabel", en: (d) => (d.mode === "order" ? "Contact us" : "Contact us on WhatsApp →"), label: "Help link when nothing is found", bn: "কিছু না পেলে সাহায্যের লিংক" },
  ],
  eligibility_checker: [
    { key: "destinationQuestionLabel", en: "Where do you want to go?", label: "Question 1", bn: "প্রশ্ন ১", section: "Questions" },
    { key: "ageQuestionLabel", en: "Your age group", label: "Question 2", bn: "প্রশ্ন ২", section: "Questions" },
    { key: "ageOptionsText", en: "18–24, 25–34, 35–44, 45–55, 55+", lines: ["18–24", "25–34", "35–44", "45–55", "55+"], label: "Question 2 answers", bn: "প্রশ্ন ২-এর উত্তর", section: "Questions", note: "Keep the same order: the first three score highest, the fourth a little." },
    { key: "eduQuestionLabel", en: "Highest education", label: "Question 3", bn: "প্রশ্ন ৩", section: "Questions" },
    { key: "eduOptionsText", en: "Below SSC, SSC / HSC, Diploma / Trade, Bachelor, Master or above", lines: ["Below SSC", "SSC / HSC", "Diploma / Trade", "Bachelor", "Master or above"], label: "Question 3 answers", bn: "প্রশ্ন ৩-এর উত্তর", section: "Questions", note: "Keep the same order: the last three score highest, the second a little." },
    { key: "expQuestionLabel", en: "Work experience", label: "Question 4", bn: "প্রশ্ন ৪", section: "Questions" },
    { key: "expOptionsText", en: "No experience, 1–3 years, 3–5 years, 5+ years", lines: ["No experience", "1–3 years", "3–5 years", "5+ years"], label: "Question 4 answers", bn: "প্রশ্ন ৪-এর উত্তর", section: "Questions", note: "Keep the same order: the last two score highest, the second a little." },
    { key: "englishQuestionLabel", en: "English proficiency", label: "Question 5", bn: "প্রশ্ন ৫", section: "Questions" },
    { key: "englishOptionsText", en: "None, Basic, IELTS / PTE band 5–6, IELTS / PTE 6.5+", lines: ["None", "Basic", "IELTS / PTE band 5–6", "IELTS / PTE 6.5+"], label: "Question 5 answers", bn: "প্রশ্ন ৫-এর উত্তর", section: "Questions", note: "Keep the same order: the last two score a point." },
    { key: "contactQuestionLabel", en: "Almost done — where should we send your result?", label: "Last step heading", bn: "শেষ ধাপের শিরোনাম", section: "Last step" },
    { key: "namePlaceholder", en: "Full name", label: "Name box", bn: "নামের ঘর", section: "Last step" },
    { key: "phonePlaceholder", en: "Phone / WhatsApp", label: "Phone box", bn: "ফোনের ঘর", section: "Last step" },
    { key: "backLabel", en: "← Back", label: "Back link", bn: "পেছনে যাওয়ার লিংক", section: "Last step" },
    { key: "eligibleTitle", en: "Great news — you look eligible!", label: "Heading when the answers score well", bn: "উত্তর ভালো হলে শিরোনাম", section: "Result" },
    { key: "reviewTitle", en: "Let's review your profile", label: "Heading otherwise", bn: "অন্যথায় শিরোনাম", section: "Result" },
    { key: "againLabel", en: "Check again", label: "Start-again link", bn: "আবার শুরুর লিংক", section: "Result" },
  ],
  accounting_feed: [
    { key: "emptyText", en: "No transactions to display yet.", label: "When there is nothing to show", bn: "দেখানোর কিছু না থাকলে" },
    { key: "anonymousLabel", en: "Anonymous", label: "Name when none was given", bn: "নাম না দিলে" },
  ],
} as const satisfies Record<string, readonly UiTextDef[]>;

export type UiTextBlock = keyof typeof UI_TEXT;
export type UiTextKey<T extends UiTextBlock> = (typeof UI_TEXT)[T][number]["key"];
type DefOf<T extends UiTextBlock, K> = Extract<(typeof UI_TEXT)[T][number], { key: K }>;
/** The optional text fields a block's `data` may carry (lists are string[]). */
export type UiTextData<T extends UiTextBlock> = {
  [K in UiTextKey<T>]?: DefOf<T, K> extends { lines: readonly string[] } ? string[] : string;
};

/** Definitions for a block type (empty for types without any). */
export function uiTextDefs(type: string): readonly UiTextDef[] {
  return (UI_TEXT as Record<string, readonly UiTextDef[]>)[type] ?? [];
}

/** The built-in text of one definition for the block's current settings. */
export function uiTextDefault(def: UiTextDef, data: object | undefined): string {
  return typeof def.en === "function" ? def.en((data ?? {}) as Data) : def.en;
}

/**
 * Reader for a block's text: `t(key)` = the saved text, else the built-in
 * text. `t.own(key)` = the saved text only (undefined when empty), for
 * built-ins that come from elsewhere (page-language wording).
 */
export function uiText<T extends UiTextBlock>(type: T, data: object | undefined) {
  const d = (data ?? {}) as Data;
  const defs = UI_TEXT[type] as readonly UiTextDef[];
  const def = (k: string) => defs.find((x) => x.key === k) as UiTextDef;
  const own = (k: UiTextKey<T>): string | undefined => {
    const v = d[k];
    return typeof v === "string" && v.trim() ? v : undefined;
  };
  const t = (k: UiTextKey<T>): string => own(k) ?? uiTextDefault(def(k), d);
  return Object.assign(t, {
    own,
    /** Optional line: null when the owner typed "-" to hide it. */
    opt: (k: UiTextKey<T>): string | null => (typeof d[k] === "string" && (d[k] as string).trim() === "-" ? null : t(k)),
    /** List text (one per line); the built-in list when empty. */
    lines: (k: UiTextKey<T>): string[] => {
      const v = d[k];
      const list = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [];
      return list.length ? list : [...(def(k).lines ?? [])];
    },
    /** Text with {name} slots filled in. */
    fill: (k: UiTextKey<T>, vars: Record<string, string | number>): string =>
      t(k).replace(/\{(\w+)\}/g, (m, n: string) => (n in vars ? String(vars[n]) : m)),
  });
}

/** One line for the MCP block docs: which text fields exist and their built-in text. */
export function uiTextDoc(type: string): string | undefined {
  const defs = uiTextDefs(type);
  if (!defs.length) return undefined;
  return `Text fields (optional; empty = built-in text${defs.some((x) => x.hideable) ? "; \"-\" hides optional lines" : ""}): ${defs
    .map((x) => `${x.key}${x.lines ? " (string[])" : ""} = "${uiTextDefault(x, {})}"`).join("; ")}.`;
}
