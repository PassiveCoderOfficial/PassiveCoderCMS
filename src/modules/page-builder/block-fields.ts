/**
 * Declarative field schema for every block type: which data keys a block has,
 * what kind of control edits each one, its label and help in English and
 * Bangla, and which tab it belongs to. This is the single source the mobile
 * editor renders from (served by /api/page-builder/block-schema), and what the
 * web settings panels migrate to over time (docs/mobile-app-ux-spec.md §3.4).
 *
 * Data only: no React, no imports from components. Keys are never shown to
 * users; labels are. A test asserts every key in each block's default data is
 * covered here (or the block is marked `custom`), so schemas cannot drift
 * from block-registry.ts.
 */
import type { BlockType } from "@/types/cms";
import type { VariantThumbKind } from "./block-variants";
import type { PresetThumbKind } from "@/components/admin/page-builder/blocks-panel/preset-thumbnail";
import { uiTextDefs, uiTextDefault } from "./ui-text";

export type FieldType =
  | "text" | "textarea" | "lines" | "richtext" | "number" | "boolean"
  | "select" | "align" | "color" | "image" | "images" | "icon" | "link"
  | "list" | "group" | "countries" | "collection" | "date" | "hidden";

export type I18n = { en: string; bn: string };

export type FieldOption = { value: string; label: I18n };

export type Field = {
  /** data key (never shown) */
  key: string;
  type: FieldType;
  label?: I18n;
  help?: I18n;
  /** default "content" */
  group?: "content" | "style" | "advanced";
  placeholder?: I18n;
  /** select / align */
  options?: FieldOption[];
  min?: number; max?: number; step?: number;
  unit?: "px" | "s" | "%" | "items" | "vh";
  /** stored = shown * scale (autoPlayInterval: scale 1000, unit "s") */
  scale?: number;
  /** list items, or the sub-fields of a group (object) */
  item?: Field[];
  /** what "Add" creates for a list */
  itemDefaults?: Record<string, unknown>;
  /** list row: keys for primary/secondary text; first image key is found automatically */
  summary?: string[];
  showWhen?: { field: string; in: string[] } | { variant: string[] };
  effect?: "syncBackgroundImage" | "zeroPaddingEdgeToEdge";
  required?: boolean;
  maxLength?: number;
  /** link: show a label input next to the target (object {label,url}) */
  showLabel?: boolean;
};

export type BlockFieldSchema = {
  type: BlockType;
  thumb: VariantThumbKind | PresetThumbKind;
  /** keys shown as the block row's one-line summary; "items.length" = count */
  summary?: string[];
  fields: Field[];
  /** Bespoke web panel: keys not listed here are still editable under Advanced › Technical. */
  custom?: boolean;
};

/* ---------------------------------------------------------------- helpers */

const L = (en: string, bn: string): I18n => ({ en, bn });

const text = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "text", label, ...extra });
const area = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "textarea", label, ...extra });
const bool = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "boolean", label, ...extra });
const num = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "number", label, ...extra });
const img = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "image", label, ...extra });
const color = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "color", label, group: "style", ...extra });
const icon = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "icon", label, ...extra });
const link = (key: string, label: I18n, extra: Partial<Field> = {}): Field => ({ key, type: "link", label, ...extra });
const hidden = (key: string): Field => ({ key, type: "hidden" });
const sel = (key: string, label: I18n, options: FieldOption[], extra: Partial<Field> = {}): Field => ({ key, type: "select", label, options, ...extra });
const list = (key: string, label: I18n, item: Field[], itemDefaults: Record<string, unknown>, summary: string[], extra: Partial<Field> = {}): Field =>
  ({ key, type: "list", label, item, itemDefaults, summary, ...extra });
const group = (key: string, label: I18n, item: Field[], extra: Partial<Field> = {}): Field => ({ key, type: "group", label, item, ...extra });

const opt = (value: string, en: string, bn: string): FieldOption => ({ value, label: L(en, bn) });
const opts = (...pairs: [string, string, string][]): FieldOption[] => pairs.map(([v, en, bn]) => opt(v, en, bn));

/** A block's replaceable built-in words (ui-text.ts), as Advanced fields; the built-in text is the placeholder. */
const uiTextFields = (type: string): Field[] => uiTextDefs(type).map((d): Field => d.lines
  ? { key: d.key, type: "lines", label: L(d.label, d.bn), group: "advanced", ...(d.showWhen ? { showWhen: d.showWhen } : {}) }
  : text(d.key, L(d.label, d.bn), { group: "advanced", placeholder: L(uiTextDefault(d, {}), uiTextDefault(d, {})), ...(d.showWhen ? { showWhen: d.showWhen } : {}) }));

/* ------------------------------------------------------- shared vocabulary */

const T = {
  eyebrow: L("Small label above title", "শিরোনামের উপরের ছোট লেখা"),
  title: L("Title", "শিরোনাম"),
  subtitle: L("Subtitle", "উপশিরোনাম"),
  description: L("Description", "বিবরণ"),
  text: L("Text", "লেখা"),
  photo: L("Photo", "ছবি"),
  photoAlt: L("Photo description (for search engines)", "ছবির বিবরণ (সার্চ ইঞ্জিনের জন্য)"),
  button: L("Button", "বাটন"),
  button2: L("Second button", "দ্বিতীয় বাটন"),
  buttonText: L("Button text", "বাটনের লেখা"),
  buttonGoesTo: L("Button goes to", "বাটন যেখানে যাবে"),
  linkTo: L("Goes to", "যেখানে যাবে"),
  columns: L("Columns", "কলাম"),
  layout: L("Layout", "লেআউট"),
  style: L("Style", "স্টাইল"),
  items: L("Items", "আইটেম"),
  icon: L("Icon", "আইকন"),
  name: L("Name", "নাম"),
  label: L("Label", "লেবেল"),
  successMessage: L("Message after sending", "পাঠানোর পরের বার্তা"),
  submitLabel: L("Send button text", "পাঠানোর বাটনের লেখা"),
  accent: L("Accent colour", "অ্যাকসেন্ট রং"),
  show: L("Show", "দেখান"),
};

const columnsOpts = (values: number[]) => values.map((n) => opt(String(n), String(n), String(n)));
const cardStyleOpts = opts(["flat", "Flat", "সমতল"], ["elevated", "Shadow", "ছায়া"], ["bordered", "Outlined", "বর্ডার"], ["gradient", "Gradient", "গ্রেডিয়েন্ট"]);
const gapOpts = opts(["none", "None", "নেই"], ["sm", "Small", "ছোট"], ["md", "Normal", "সাধারণ"], ["lg", "Large", "বড়"]);
const sizeOpts = opts(["sm", "Small", "ছোট"], ["md", "Normal", "সাধারণ"], ["lg", "Large", "বড়"]);
const alignOpts = opts(["left", "Left", "বাম"], ["center", "Centre", "মাঝে"], ["right", "Right", "ডান"]);
const ratioOpts = opts(["16:9", "Wide (16:9)", "চওড়া (16:9)"], ["4:3", "Standard (4:3)", "সাধারণ (4:3)"], ["1:1", "Square", "বর্গ"]);

/** {label,url,variant?} button object */
const buttonField = (key: string, label: I18n, extra: Partial<Field> = {}): Field => link(key, label, { showLabel: true, ...extra });

const titleBlock = (withSubtitle = true, withEyebrow = false): Field[] => [
  ...(withEyebrow ? [text("eyebrow", T.eyebrow)] : []),
  text("title", T.title),
  ...(withSubtitle ? [text("subtitle", T.subtitle)] : []),
];

/* ------------------------------------------------------------ the schemas */

// Hero designs that draw each piece (renderers: hero-block.tsx, hero-showcase.tsx).
// "" and the retired keys (centered-dark, split-image, bold-dark) are the classic layout.
const HERO_CLASSIC = ["", "product", "split-image-right", "fullscreen-overlay", "centered-bold", "dark-gradient-left", "corporate", "centered-dark", "split-image", "bold-dark"];
const HERO_SHOWCASE = ["spec-card", "page-banner"];
const HERO_ACCENT = ["split-image-right", "centered-bold", "dark-gradient-left", "product", ...HERO_SHOWCASE];
const HERO_POSITIONED = ["", "product", "split-image-right", "fullscreen-overlay", "dark-gradient-left", "centered-dark", "split-image", "bold-dark"];

const hero: BlockFieldSchema = {
  type: "hero", thumb: "hero-centered", summary: ["title"],
  fields: [
    text("topLine", L("Highlight line above the badge", "ব্যাজের উপরের হাইলাইট লাইন"), { showWhen: { variant: ["spec-card"] } }),
    text("badge", L("Small badge above title", "শিরোনামের উপরের ছোট ব্যাজ"), { placeholder: L("Optional", "ঐচ্ছিক") }),
    text("title", L("Headline", "মূল শিরোনাম"), { required: true }),
    text("titleAccent", L("Second title line (accent colour)", "শিরোনামের দ্বিতীয় লাইন (অ্যাকসেন্ট রং)"), { showWhen: { variant: HERO_ACCENT } }),
    text("subtitle", T.subtitle, { showWhen: { variant: HERO_CLASSIC } }),
    area("description", T.description),
    { key: "bullets", type: "lines", label: L("Check-mark points (one per line)", "চেক চিহ্নের পয়েন্ট (প্রতি লাইনে একটি)"), showWhen: { variant: ["split-image-right", "product"] } },
    text("command", L("Command under the buttons (with a copy button)", "বাটনের নিচের কমান্ড (কপি বাটনসহ)"), { placeholder: L("docker compose up -d", "docker compose up -d"), showWhen: { variant: ["product"] } }),
    img("imageUrl", T.photo),
    text("frameUrl", L("Address in the screenshot window bar", "স্ক্রিনশট উইন্ডোর ঠিকানা"), { placeholder: L("yoursite.com/dashboard", "yoursite.com/dashboard"), help: L("Type none to hide the window bar", "উইন্ডো বার লুকাতে none লিখুন"), showWhen: { variant: ["product"] } }),
    num("imageRatio", L("Screenshot shape (width divided by height)", "স্ক্রিনশটের আকার (প্রস্থ ভাগ উচ্চতা)"), { min: 0.5, max: 3, step: 0.05, group: "style", showWhen: { variant: ["product"] } }),
    text("imageAlt", T.photoAlt, { group: "advanced" }),
    buttonField("primaryButton", T.button),
    buttonField("secondaryButton", T.button2),
    buttonField("tertiaryButton", L("Third button", "তৃতীয় বাটন")),
    text("homeLabel", L("Breadcrumb: first link text", "ব্রেডক্রাম্ব: প্রথম লিংকের লেখা"), { placeholder: L("Home", "Home"), help: L("Empty = Home, in the page's language", "খালি = পেজের ভাষায় Home"), showWhen: { variant: ["page-banner"] } }),
    sel("layout", L("Text position", "লেখার অবস্থান"), opts(["centered", "Centred", "মাঝে"], ["left", "Left", "বাম"], ["right", "Right", "ডান"], ["split", "Split with photo", "ছবির পাশে"]), { group: "style", showWhen: { variant: HERO_POSITIONED } }),
    sel("imagePosition", L("Photo focus", "ছবির ফোকাস"), opts(["top", "Top", "উপর"], ["center", "Centre", "মাঝে"], ["bottom", "Bottom", "নিচ"]), { group: "style" }),
    sel("overlayStyle", L("Overlay shape", "ওভারলের ধরন"), opts(["diagonal", "Diagonal wash", "কোনাকুনি"], ["left-fade", "Dark on the left", "বামে গাঢ়"]), { group: "style", showWhen: { variant: ["fullscreen-overlay"] } }),
    bool("compact", L("Shorter banner", "ছোট ব্যানার"), { group: "style", showWhen: { variant: ["fullscreen-overlay", "split-image-right"] } }),
    group("typography", L("Text looks", "লেখার ধরন"), [
      sel("titleSize", L("Headline size", "শিরোনামের আকার"), opts(["3xl", "Small", "ছোট"], ["4xl", "Medium", "মাঝারি"], ["5xl", "Large", "বড়"], ["6xl", "Extra large", "আরও বড়"], ["7xl", "Huge", "বিশাল"])),
      color("titleColor", L("Headline colour", "শিরোনামের রং")),
      color("subtitleColor", L("Subtitle colour", "উপশিরোনামের রং")),
      color("descColor", L("Description colour", "বিবরণের রং")),
    ], { group: "style" }),
    bool("showTrustLogos", L("Show logos (partners, certifications)", "লোগো দেখান (পার্টনার, সার্টিফিকেশন)")),
    list("trustLogos", L("Logos", "লোগো"), [img("url", L("Logo", "লোগো")), text("alt", L("Name", "নাম"))], { url: "", alt: "" }, ["alt"], { showWhen: { field: "showTrustLogos", in: ["true"] } }),
    text("trustLogosLabel", L("Text before the logos", "লোগোর আগের লেখা"), { placeholder: L("e.g. Certified by", "যেমন: Certified by"), showWhen: { field: "showTrustLogos", in: ["true"] } }),
    sel("trustLogosStyle", L("Logo look", "লোগোর ধরন"), opts(["plain", "Plain logos", "সাধারণ লোগো"], ["cards", "White logo cards", "সাদা লোগো কার্ড"]), { group: "style", showWhen: { field: "showTrustLogos", in: ["true"] } }),
    bool("trustFirst", L("Logos and rating above the buttons", "লোগো ও রেটিং বাটনের উপরে"), { group: "style", showWhen: { variant: ["spec-card"] } }),
    bool("showCountries", L("Show countries served", "যেসব দেশে সেবা দেন তা দেখান")),
    text("countriesLabel", L("Text before the flags", "পতাকার আগের লেখা"), { placeholder: L("e.g. Serving businesses in", "যেমন: Serving businesses in"), showWhen: { field: "showCountries", in: ["true"] } }),
    sel("badgeStyle", L("Badge look", "ব্যাজের ধরন"), opts(["pill", "Rounded badge", "গোল ব্যাজ"], ["text", "Plain coloured text", "সাধারণ রঙিন লেখা"]), { group: "style", showWhen: { variant: ["spec-card"] } }),
    bool("accentInline", L("Accent words on the same line", "অ্যাকসেন্ট শব্দ একই লাইনে"), { group: "style", showWhen: { variant: HERO_SHOWCASE } }),
    bool("gridTexture", L("Faint grid lines on the photo", "ছবির উপর হালকা গ্রিড লাইন"), { group: "style", showWhen: { variant: ["spec-card"] } }),
    list("statRow", L("Small stat boxes under the buttons", "বাটনের নিচে ছোট সংখ্যার বক্স"), [hidden("id"), text("value", L("Number or word", "সংখ্যা বা শব্দ")), text("label", T.label)], { value: "", label: "" }, ["value", "label"], { showWhen: { variant: ["spec-card", "product"] } }),
    list("chipRow", L("Highlight chips (e.g. 1000+ Jobs Completed)", "হাইলাইট চিপ (যেমন: 1000+ Jobs Completed)"), [hidden("id"), icon("icon", T.icon), text("text", L("Text", "লেখা"))], { icon: "BadgeCheck", text: "" }, ["text"], { showWhen: { variant: ["spec-card"] } }),
    sel("chipSize", L("Chip text size", "চিপের লেখার আকার"), opts(["sm", "Small", "ছোট"], ["md", "Medium", "মাঝারি"], ["lg", "Large", "বড়"]), { group: "style", showWhen: { variant: ["spec-card"] } }),
    bool("chipBorder", L("Chip rounded border", "চিপের গোল বর্ডার"), { group: "style", showWhen: { variant: ["spec-card"] } }),
    group("specCard", L("Side card", "পাশের কার্ড"), [
      text("label", L("Small label", "ছোট লেবেল")),
      text("title", T.title),
      list("meters", L("Spec bars (label + %)", "স্পেক বার (লেবেল + %)"), [hidden("id"), text("label", T.label), num("value", L("Percent", "শতাংশ"), { unit: "%", min: 0, max: 100, step: 5 })], { label: "", value: 80 }, ["label", "value"]),
      list("stats", L("Card stats", "কার্ডের সংখ্যা"), [hidden("id"), text("value", L("Number or word", "সংখ্যা বা শব্দ")), text("label", T.label)], { value: "", label: "" }, ["value", "label"]),
    ], { showWhen: { variant: ["spec-card"] } }),
    list("strip", L("Link strip along the bottom", "নিচের লিংক সারি"), [hidden("id"), text("title", T.title), text("subtitle", L("Small text", "ছোট লেখা")), link("url", T.linkTo)], { title: "", subtitle: "", url: "" }, ["title", "subtitle"], { showWhen: { variant: ["spec-card"] } }),
    group("sidePhoto", L("Photo beside the text", "লেখার পাশের ছবি"), [
      img("imageUrl", T.photo),
      text("alt", T.photoAlt, { group: "advanced" }),
      list("badges", L("Cards on the photo", "ছবির উপরের কার্ড"), [
        hidden("id"),
        text("title", L("Big text", "বড় লেখা")),
        text("text", L("Small text", "ছোট লেখা")),
        bool("stars", L("Show 5 stars", "৫ তারা দেখান")),
        link("link", T.linkTo),
        sel("position", L("Position", "অবস্থান"), opts(["top-right", "Top right", "উপরে ডানে"], ["top-left", "Top left", "উপরে বামে"], ["bottom-right", "Bottom right", "নিচে ডানে"], ["bottom-left", "Bottom left", "নিচে বামে"])),
      ], { title: "", text: "", position: "top-right" }, ["title", "text"]),
    ], { showWhen: { variant: ["spec-card"] } }),
    hidden("backgroundImages"),
    hidden("showBreadcrumb"),
    hidden("card"),
    hidden("trust"),
    hidden("whatsappButton"),
    hidden("phoneButton"),
  ],
  custom: true,
};

const slideItem: Field[] = [
  hidden("id"),
  img("imageUrl", T.photo),
  text("title", L("Headline", "শিরোনাম")),
  text("subtitle", L("Text under headline", "শিরোনামের নিচের লেখা")),
  text("buttonLabel", T.buttonText),
  link("buttonUrl", T.buttonGoesTo),
  link("linkUrl", L("Whole slide goes to", "পুরো স্লাইড যেখানে যাবে"), { group: "advanced" }),
  text("description", L("Link description for screen readers", "স্ক্রিন রিডারের জন্য লিংকের বিবরণ"), { group: "advanced", placeholder: L("View", "View") }),
  bool("overlay", L("Darken photo behind text", "লেখার পেছনে ছবি গাঢ় করুন"), { group: "style" }),
  // Split and Minimal draw the copy in fixed colours.
  color("textColor", L("Text colour", "লেখার রং"), { showWhen: { variant: ["", "left-copy", "centered"] } }),
];

const slider: BlockFieldSchema = {
  type: "slider", thumb: "slider-dots", summary: ["slides.length"],
  fields: [
    list("slides", L("Slides", "স্লাইড"), slideItem, { title: "", subtitle: "", imageUrl: "", buttonLabel: "", buttonUrl: "", overlay: true }, ["title", "subtitle"]),
    bool("autoPlay", L("Play automatically", "নিজে নিজে চলবে")),
    num("autoPlayInterval", L("Seconds per slide", "প্রতি স্লাইডে সেকেন্ড"), { unit: "s", scale: 1000, min: 2, max: 15, step: 1, showWhen: { field: "autoPlay", in: ["true"] } }),
    bool("showArrows", L("Show arrows", "তীর দেখান"), { group: "style" }),
    bool("showDots", L("Show dots", "ডট দেখান"), { group: "style" }),
    color("dotColor", L("Dot colour", "ডটের রং"), { showWhen: { field: "showDots", in: ["true"] } }),
    sel("height", L("Height", "উচ্চতা"), opts(["420px", "Short", "ছোট"], ["600px", "Normal", "সাধারণ"], ["780px", "Tall", "লম্বা"], ["100vh", "Full screen", "পুরো স্ক্রিন"]), { group: "style" }),
    sel("mobileHeight", L("Height on phones", "ফোনে উচ্চতা"), opts(["", "Same as above", "উপরের মতো"], ["360px", "Short", "ছোট"], ["480px", "Normal", "সাধারণ"], ["100vh", "Full screen", "পুরো স্ক্রিন"]), { group: "advanced" }),
    sel("buttonStyle", L("Button look", "বাটনের ধরন"), opts(["primary", "Brand colour", "ব্র্যান্ড রং"], ["white", "White", "সাদা"]), { group: "style", showWhen: { variant: ["", "left-copy", "centered"] } }),
  ],
};

const textBlock: BlockFieldSchema = {
  type: "text", thumb: "text-center", summary: ["content"],
  fields: [
    { key: "content", type: "richtext", label: T.text },
    { key: "alignment", type: "align", label: L("Alignment", "সারিবদ্ধ"), options: alignOpts, group: "style" },
    sel("columns", T.columns, columnsOpts([1, 2, 3, 4]), { group: "style" }),
    group("typography", L("Text looks", "লেখার ধরন"), [color("color", L("Text colour", "লেখার রং"))], { group: "style" }),
  ],
};

// Services designs (services-block.tsx). "" / "services-classic" = the default grid (Cards names it).
const SVC_DEFAULT = ["", "services-classic"];
const SVC_ICON = [...SVC_DEFAULT, "icon-cards-grid", "bordered-list", "dark-grid-cards", "numbered"];
const SVC_KICKER = [...SVC_DEFAULT, "site-showcase", "bento", "photo-cards"];
const SVC_LINK_TEXT = [...SVC_DEFAULT, "icon-cards-grid", "dark-grid-cards", "site-showcase", "image-cards-dark", "bordered-list", "numbered", "menu-cards", "program-cards-dark", "bento", "boutique-tiles"];
const SVC_INTRO = [...SVC_DEFAULT, "icon-cards-grid", "image-cards-dark", "site-showcase", "bordered-list", "dark-grid-cards", "menu-cards", "image-tiles", "program-cards-dark", "numbered"];
const serviceItem: Field[] = [
  hidden("id"),
  text("title", T.title),
  area("description", T.description),
  icon("icon", T.icon, { showWhen: { variant: SVC_ICON } }),
  hidden("iconType"),
  img("imageUrl", T.photo),
  hidden("imageFocus"),
  link("link", T.linkTo),
  text("linkLabel", L("Link text", "লিংকের লেখা"), { placeholder: L("Learn More", "Learn More"), showWhen: { variant: SVC_LINK_TEXT } }),
  text("kicker", L("Small label above the title", "শিরোনামের উপরের ছোট লেখা"), { showWhen: { variant: SVC_KICKER } }),
  text("category", L("Category (filter tab)", "ক্যাটাগরি (ফিল্টার ট্যাব)"), { group: "advanced" }),
  list("meta", L("Details under the text (e.g. Client: Barzan)", "লেখার নিচের তথ্য (যেমন Client: Barzan)"), [text("label", T.label), text("value", L("Value", "মান"))], { label: "", value: "" }, ["label", "value"], { group: "advanced" }),
];

const services: BlockFieldSchema = {
  type: "services", thumb: "cards-3", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(true, true),
    area("intro", L("Text under the title", "শিরোনামের নিচের লেখা"), { showWhen: { variant: SVC_INTRO } }),
    list("items", L("Services", "সার্ভিস"), serviceItem, { icon: "Star", iconType: "lucide", title: "", description: "", link: "", linkLabel: "" }, ["title", "description"]),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["list", "List", "তালিকা"], ["cards", "Cards", "কার্ড"], ["icon-list", "Icon list", "আইকন তালিকা"]), { group: "style", showWhen: { variant: SVC_DEFAULT } }),
    sel("columns", T.columns, columnsOpts([2, 3, 4, 5, 6, 7, 8, 9, 10]), { group: "style" }),
    sel("cardStyle", L("Card style", "কার্ডের ধরন"), cardStyleOpts, { group: "style", showWhen: { variant: SVC_DEFAULT } }),
    sel("itemAlign", L("Card text", "কার্ডের লেখা"), opts(["left", "Left", "বাম"], ["center", "Centred", "মাঝে"]), { group: "style", showWhen: { variant: [...SVC_DEFAULT, "image-cards-dark"] } }),
    sel("linkStyle", L("Links as", "লিংক দেখাবে"), opts(["link", "Text links", "টেক্সট লিংক"], ["solid", "Solid buttons", "বাটন"]), { group: "style", showWhen: { variant: [...SVC_DEFAULT, "image-cards-dark", "icon-cards-grid"] } }),
    color("linkColor", L("Button colour", "বাটনের রং"), { showWhen: { variant: SVC_DEFAULT } }),
    num("imageHeight", L("Photo height", "ছবির উচ্চতা"), { unit: "px", min: 120, max: 480, step: 10, group: "style", showWhen: { variant: SVC_DEFAULT } }),
    bool("noImageFade", L("No brand-colour fade on photos", "ছবিতে ব্র্যান্ড রঙের ফেড নেই"), { group: "style", showWhen: { variant: ["image-cards-dark"] } }),
    sel("captionTone", L("Caption panel", "ক্যাপশন প্যানেল"), opts(["", "Card colour", "কার্ডের রং"], ["dark", "Dark", "ডার্ক"]), { group: "style", showWhen: { variant: ["image-cards-dark"] } }),
    sel("headingLayout", L("Heading", "শিরোনাম"), opts(["center", "Centred", "মাঝে"], ["split", "Title left, text right", "শিরোনাম বামে, লেখা ডানে"]), { group: "style", showWhen: { variant: SVC_DEFAULT } }),
    list("headingPoints", L("Check points beside the heading", "শিরোনামের পাশে চেক পয়েন্ট"), [hidden("id"), text("text", L("Text", "লেখা"))], { text: "" }, ["text"], { showWhen: { field: "headingLayout", in: ["split"] } }),
    group("whatsappButton", L("WhatsApp button on every card", "প্রতিটি কার্ডে হোয়াটসঅ্যাপ বাটন"), [
      text("number", L("WhatsApp number", "হোয়াটসঅ্যাপ নম্বর"), { placeholder: L("e.g. 6581758406", "যেমন: 6581758406") }),
      text("label", T.buttonText, { placeholder: L("WhatsApp", "WhatsApp") }),
      area("message", L("Message ({title} = card title)", "বার্তা ({title} = কার্ডের শিরোনাম)"), { placeholder: L("Hello, I would like a quotation for {title}.", "Hello, I would like a quotation for {title}.") }),
      color("color", L("Button colour", "বাটনের রং")),
    ], { showWhen: { variant: SVC_DEFAULT } }),
    bool("showFilter", L("Filter tabs by category", "ক্যাটাগরি অনুযায়ী ফিল্টার ট্যাব")),
    text("filterAllLabel", L("First filter tab", "প্রথম ফিল্টার ট্যাব"), { group: "advanced", placeholder: L("All", "All"), showWhen: { field: "showFilter", in: ["true"] } }),
    group("allLink", L("'View all' button", "'সব দেখুন' বাটন"), [text("label", T.label, { placeholder: L("View all", "View all") }), link("url", T.linkTo)]),
    bool("hideSmallText", L("Hide text on small tiles", "ছোট টাইলে লেখা লুকান"), { group: "style", showWhen: { variant: ["bento"] } }),
    sel("tileStyle", L("Caption", "ক্যাপশন"), opts(["below", "Under the photo", "ছবির নিচে"], ["overlay", "On the photo", "ছবির উপরে"]), { group: "style", showWhen: { variant: ["boutique-tiles"] } }),
    sel("tileRatio", L("Photo shape", "ছবির আকার"), opts(["landscape", "Landscape", "চওড়া"], ["square", "Square", "বর্গ"], ["portrait", "Portrait", "লম্বা"]), { group: "style", showWhen: { variant: ["boutique-tiles"] } }),
    group("colors", L("Colours", "রং"), [color("dark", L("Dark colour", "গাঢ় রং")), color("accent", T.accent)], { group: "style", showWhen: { variant: ["bento", "photo-cards", "boutique-tiles"] } }),
    hidden("source"), hidden("source_group_id"),
  ],
  custom: true,
};

const cards: BlockFieldSchema = {
  ...services, type: "cards", thumb: "cards-3",
  fields: [hidden("family"), ...services.fields],
};

// Why Choose Us designs (features-block.tsx, features-showcase.tsx). "" / "features-classic" = the default.
const FT_DEFAULT = ["", "features-classic"];
const FT_SHOWCASE = ["overview-quote", "numbered-grid", "image-stats", "text-tiles", "arrow-cards"];
const featureItem: Field[] = [
  hidden("id"),
  icon("icon", T.icon, { showWhen: { variant: [...FT_DEFAULT, "icon-list-cards", "bento-grid", "alternating-media", "centered-icons", "split-list", "highlight-cards", "numbered-grid", "text-tiles", "arrow-cards"] } }),
  text("title", T.title),
  text("label", L("Label under the big number", "বড় সংখ্যার নিচের লেখা"), { showWhen: { variant: ["image-stats"] } }),
  area("description", T.description),
  img("imageUrl", T.photo, { showWhen: { variant: [...FT_DEFAULT, "dark", "icon-list-cards", "bento-grid", "alternating-media"] } }),
  hidden("imageFocus"),
  text("buttonLabel", T.buttonText, { group: "advanced", showWhen: { variant: [...FT_DEFAULT, "icon-list-cards", "alternating-media", "centered-icons", "split-list", "highlight-cards", "pro-bento", "pro-grid", "pro-split"] } }),
  link("buttonUrl", T.buttonGoesTo, { group: "advanced", showWhen: { variant: [...FT_DEFAULT, "icon-list-cards", "alternating-media", "centered-icons", "split-list", "highlight-cards", "pro-bento", "pro-grid", "pro-split"] } }),
  sel("span", L("Tile width", "টাইলের প্রস্থ"), opts(["1", "1 column", "1 কলাম"], ["2", "2 columns", "2 কলাম"], ["3", "Full row", "পুরো সারি"]), { group: "style", showWhen: { variant: ["pro-bento"] } }),
];

const features: BlockFieldSchema = {
  type: "features", thumb: "feature-checklist", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(true, true),
    area("description", T.text, { showWhen: { variant: ["dark", "icon-list-cards", "bento-grid", "overview-quote", "image-stats", "text-tiles", "numbered-grid", "pro-split"] } }),
    icon("icon", L("Icon beside the title", "শিরোনামের পাশের আইকন"), { showWhen: { variant: ["overview-quote"] } }),
    list("items", L("Points", "পয়েন্ট"), featureItem, { icon: "Check", title: "", description: "" }, ["title", "description"]),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["alternating", "Alternating rows", "পালাক্রমে সারি"], ["icon-list", "Icon list", "আইকন তালিকা"], ["centered", "Centred", "মাঝে"]), { group: "style", showWhen: { variant: FT_DEFAULT } }),
    sel("style", T.style, opts(["minimal", "Minimal", "সাধারণ"], ["card", "Cards", "কার্ড"], ["gradient", "Gradient", "গ্রেডিয়েন্ট"]), { group: "style", showWhen: { variant: FT_DEFAULT } }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style", showWhen: { variant: [...FT_DEFAULT, "numbered-columns", "centered-icons", "highlight-cards", "numbered-grid", "arrow-cards", "pro-grid"] } }),
    bool("imageRightFirst", L("First image on the right", "প্রথম ছবি ডানে"), { group: "style", showWhen: { variant: [...FT_DEFAULT, "alternating-media"] } }),
    bool("fullImage", L("Show full image (no crop)", "পুরো ছবি দেখান (কাটা ছাড়া)"), { group: "style", showWhen: { variant: ["alternating-media"] } }),
    sel("tone", L("Colour tone", "রঙের টোন"), opts(["light", "Light", "হালকা"], ["dark", "Dark band", "ডার্ক ব্যান্ড"]), { group: "style", showWhen: { variant: ["numbered-grid"] } }),
    bool("showIcons", L("Show icons instead of numbers", "সংখ্যার বদলে আইকন দেখান"), { group: "style", showWhen: { variant: ["numbered-grid"] } }),
    sel("tileStyle", L("Tiles", "টাইল"), opts(["soft", "Soft grey tiles", "হালকা ধূসর টাইল"], ["bordered", "White cards", "সাদা কার্ড"]), { group: "style", showWhen: { variant: ["text-tiles"] } }),
    { key: "tags", type: "lines", label: L("Tags / bold words (one per line)", "ট্যাগ / মোটা শব্দ (প্রতি লাইনে একটি)"), showWhen: { variant: ["overview-quote", "text-tiles"] } },
    text("footnote", L("Text after the bold words", "মোটা শব্দের পরের লেখা"), { showWhen: { variant: ["text-tiles"] } }),
    text("titleHighlight", L("Words in the title to highlight", "শিরোনামের যে শব্দ হাইলাইট হবে"), { showWhen: { variant: ["text-tiles"] } }),
    color("highlightColor", L("Highlight colour", "হাইলাইটের রং"), { showWhen: { variant: ["text-tiles"] } }),
    color("titleColor", L("Title colour", "শিরোনামের রং"), { showWhen: { variant: ["text-tiles"] } }),
    group("card", L("Side card", "পাশের কার্ড"), [
      img("imageUrl", T.photo),
      text("title", T.title, { placeholder: L("Quick quote", "Quick quote") }),
      area("text", T.text),
      text("buttonLabel", T.buttonText, { placeholder: L("Quote on WhatsApp", "Quote on WhatsApp") }),
      link("buttonUrl", T.buttonGoesTo),
      bool("whatsapp", L("Button opens WhatsApp", "বাটন হোয়াটসঅ্যাপ খুলবে")),
      area("whatsappText", L("WhatsApp message", "হোয়াটসঅ্যাপ বার্তা"), { placeholder: L("Hi, I would like a quote.", "Hi, I would like a quote.") }),
      hidden("imageFocus"),
    ], { showWhen: { variant: ["overview-quote"] } }),
    img("imageUrl", T.photo, { showWhen: { variant: ["image-stats"] } }),
    hidden("imageFocus"),
    group("badge", L("Badge on the photo", "ছবির উপরের ব্যাজ"), [text("title", L("Big text", "বড় লেখা")), text("text", L("Small text", "ছোট লেখা"))], { showWhen: { variant: ["image-stats"] } }),
    sel("badgePosition", L("Badge position", "ব্যাজের অবস্থান"), opts(["overlay", "Over the photo", "ছবির উপরে"], ["bottom-edge", "On the bottom edge", "নিচের কিনারায়"]), { group: "style", showWhen: { variant: ["image-stats"] } }),
    list("buttons", L("Buttons", "বাটন"), [hidden("id"), text("label", T.label), link("url", T.linkTo), sel("style", T.style, opts(["solid", "Filled", "ভরা"], ["outline", "Outline", "আউটলাইন"], ["accent", "Accent pill", "অ্যাকসেন্ট পিল"]))], { label: "", url: "", style: "solid" }, ["label", "url"], { showWhen: { variant: ["image-stats", "text-tiles"] } }),
    group("colors", L("Colours", "রং"), [color("dark", L("Dark colour", "গাঢ় রং")), color("accent", T.accent)], { group: "style", showWhen: { variant: FT_SHOWCASE } }),
  ],
  custom: true,
};

// CTA designs (cta-block.tsx): the colour banners and the default share layout, tone and a third button.
const CTA_BANNERS = ["", "gradient-banner", "dark-split", "navy-banner", "warm-banner", "orange-banner", "banner"];
const CTA_TONE = ["", "gradient-banner", "navy-banner", "orange-banner", "banner", "boutique-banner"];
const cta: BlockFieldSchema = {
  type: "cta", thumb: "cta-banner", summary: ["title"],
  fields: [
    text("eyebrow", T.eyebrow, { showWhen: { variant: ["visit-map", "boutique-banner", "pro-band"] } }),
    text("title", T.title, { required: true }),
    area("description", T.description),
    text("command", L("Command under the buttons (with a copy button)", "বাটনের নিচের কমান্ড (কপি বাটনসহ)"), { placeholder: L("docker compose up -d", "docker compose up -d"), showWhen: { variant: ["pro-band"] } }),
    buttonField("primaryButton", T.button),
    buttonField("secondaryButton", T.button2),
    buttonField("tertiaryButton", L("Third button", "তৃতীয় বাটন"), { showWhen: { variant: CTA_BANNERS } }),
    bool("showBooking", L("Booking button (in place of the second button)", "বুকিং বাটন (দ্বিতীয় বাটনের জায়গায়)")),
    text("bookingLabel", L("Booking button text", "বুকিং বাটনের লেখা"), { placeholder: L("Book now", "Book now"), showWhen: { field: "showBooking", in: ["true"] } }),
    link("bookingUrl", L("Booking page", "বুকিং পেজ"), { placeholder: L("/book", "/book"), showWhen: { field: "showBooking", in: ["true"] } }),
    area("address", L("Address (empty = your contact details)", "ঠিকানা (খালি = আপনার যোগাযোগের তথ্য)"), { showWhen: { variant: ["visit-map"] } }),
    text("phone", L("Phone (empty = your contact details)", "ফোন (খালি = আপনার যোগাযোগের তথ্য)"), { showWhen: { variant: ["visit-map"] } }),
    area("hours", L("Opening hours", "খোলার সময়"), { showWhen: { variant: ["visit-map"] } }),
    bool("showMap", L("Show map", "ম্যাপ দেখান"), { showWhen: { variant: ["visit-map"] } }),
    text("mapQuery", L("Map search (your Google Maps business name)", "ম্যাপ সার্চ (Google Maps-এ ব্যবসার নাম)"), { group: "advanced", showWhen: { variant: ["visit-map"] } }),
    area("whatsappText", L("WhatsApp message (first button without a link)", "হোয়াটসঅ্যাপ বার্তা (লিংক ছাড়া প্রথম বাটন)"), { placeholder: L("Hi, I would like to know more.", "Hi, I would like to know more."), showWhen: { variant: ["visit-map"] } }),
    img("logoUrl", L("Logo above the title", "শিরোনামের উপরের লোগো"), { showWhen: { variant: ["boutique-banner"] } }),
    num("logoHeight", L("Logo height", "লোগোর উচ্চতা"), { unit: "px", min: 40, max: 240, step: 10, group: "style", showWhen: { variant: ["boutique-banner"] } }),
    sel("layout", T.layout, opts(["centered", "Centred", "মাঝে"], ["left", "Left", "বাম"], ["split", "Text left, button right", "লেখা বামে, বাটন ডানে"]), { group: "style", showWhen: { variant: CTA_BANNERS } }),
    sel("tone", L("Colour tone", "রঙের টোন"), opts(["light", "Light", "হালকা"], ["dark", "Dark", "ডার্ক"]), { group: "style", showWhen: { variant: CTA_TONE } }),
    sel("contentPosition", L("Text position", "লেখার অবস্থান"), opts(["center", "Centred", "মাঝে"], ["top", "Top of the photo", "ছবির উপরের দিকে"]), { group: "style", showWhen: { variant: ["boutique-banner"] } }),
    sel("buttonStyle", L("Button look", "বাটনের ধরন"), opts(["brand", "Brand colour", "ব্র্যান্ড রং"], ["light", "Light", "হালকা"], ["call-pill", "White call pill", "সাদা কল বাটন"]), { group: "style", showWhen: { variant: ["boutique-banner"] } }),
    text("buttonKicker", L("Small line above the button text", "বাটনের লেখার উপরের ছোট লাইন"), { placeholder: L("e.g. TAP TO CALL", "যেমন: TAP TO CALL"), showWhen: { field: "buttonStyle", in: ["call-pill"] } }),
    bool("glassBox", L("Content in a glass box", "লেখা কাঁচের বক্সে"), { group: "style", showWhen: { variant: ["boutique-banner"] } }),
    bool("justify", L("Justify the text", "লেখা দুই পাশে সমান"), { group: "style", showWhen: { variant: ["boutique-banner"] } }),
    group("colors", L("Colours", "রং"), [color("dark", L("Dark colour", "গাঢ় রং")), color("accent", T.accent)], { group: "style", showWhen: { variant: ["visit-map", "boutique-banner"] } }),
  ],
  custom: true,
};

const faq: BlockFieldSchema = {
  type: "faq", thumb: "faq-accordion", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(),
    list("items", L("Questions", "প্রশ্ন"), [hidden("id"), text("question", L("Question", "প্রশ্ন")), area("answer", L("Answer", "উত্তর"))], { question: "", answer: "" }, ["question", "answer"]),
    // Layout shapes the default design only (unknown saved variants draw it too).
    sel("layout", T.layout, opts(["accordion", "Accordion (tap to open)", "অ্যাকর্ডিয়ন (চেপে খুলবে)"], ["grid", "Two columns", "দুই কলাম"], ["simple", "Simple list", "সাধারণ তালিকা"]), { group: "style", showWhen: { variant: ["", "accordion-dark", "accordion-minimal", "two-column"] } }),
    bool("allowMultiple", L("Keep several answers open", "একাধিক উত্তর খোলা থাকবে"), { group: "advanced", showWhen: { variant: ["", "accordion-bordered", "split-heading", "dark-accordion", "minimal-lines", "accordion-dark", "accordion-minimal", "two-column"] } }),
    // The renderer reads sideImage (the schema used to say "image", which nothing read).
    img("sideImage", L("Photo under the heading", "শিরোনামের নিচে ছবি"), { group: "style", showWhen: { variant: ["split-heading"] } }),
    text("sideImageAlt", T.photoAlt, { group: "advanced", showWhen: { variant: ["split-heading"] } }),
  ],
};

const stats: BlockFieldSchema = {
  type: "stats", thumb: "stats-row", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(),
    list("items", L("Numbers", "সংখ্যা"), [
      hidden("id"),
      text("value", L("Number", "সংখ্যা"), { placeholder: L("100", "100") }),
      text("label", L("Label under the number", "সংখ্যার নিচের লেখা")),
      text("prefix", L("Before the number", "সংখ্যার আগে"), { placeholder: L("e.g. $", "যেমন ৳") }),
      text("suffix", L("After the number", "সংখ্যার পরে"), { placeholder: L("e.g. +", "যেমন +") }),
      // Only the default, Coloured Row and Gradient Numbers designs draw an icon.
      icon("icon", T.icon, { showWhen: { variant: ["", "colored-row", "gradient-numbers", "plain-light", "plain"] } }),
    ], { value: "100", label: "", suffix: "+" }, ["value", "label"]),
    // Layout and Style shape the default design only; the named designs have their own look.
    sel("layout", T.layout, opts(["row", "One row", "এক সারি"], ["grid", "Grid", "গ্রিড"]), { group: "style", showWhen: { variant: ["", "plain-light", "plain"] } }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style" }),
    sel("style", T.style, opts(["plain", "Plain", "সাধারণ"], ["cards", "Cards", "কার্ড"], ["colored", "Coloured band", "রঙিন ব্যান্ড"]), { group: "style", showWhen: { variant: ["", "plain-light", "plain"] } }),
    bool("animate", L("Count up when scrolled into view", "স্ক্রল করলে সংখ্যা বাড়বে"), { group: "advanced" }),
    color("bandColor", L("Band colour", "ব্যান্ডের রং"), { showWhen: { variant: ["dark-band"] } }),
    hidden("showAllText"),
  ],
};

const testimonialItem: Field[] = [
  hidden("id"),
  text("name", T.name),
  text("role", L("Role / title", "পদবি"), { showWhen: { variant: ["", "quote-cards", "stars-quotes", "dark-quote-cards", "full-width", "minimal-quote", "warm-cards", "formal-cards", "transformation-cards"] } }),
  text("company", L("Company", "প্রতিষ্ঠান"), { showWhen: { variant: ["", "quote-cards", "dark-quote-cards", "full-width", "minimal-quote", "warm-cards", "formal-cards"] } }),
  area("content", L("What they said", "তারা যা বলেছেন")),
  num("rating", L("Stars", "স্টার"), { min: 1, max: 5, step: 1 }),
  img("avatar", T.photo),
  text("title", L("Headline above the quote", "উক্তির উপরের শিরোনাম"), { showWhen: { variant: ["photo-cards"] } }),
  text("product", L("Product reviewed", "যে পণ্যের রিভিউ"), { showWhen: { variant: ["review-cards"] } }),
  link("productUrl", L("Product link", "পণ্যের লিংক"), { showWhen: { variant: ["review-cards"] } }),
  bool("verified", L("Verified buyer tick", "যাচাইকৃত ক্রেতার টিক"), { showWhen: { variant: ["review-cards"] } }),
  hidden("photos"),
];

const testimonials: BlockFieldSchema = {
  type: "testimonials", thumb: "quote-cards", summary: ["title", "items.length"],
  fields: [
    text("title", T.title),
    text("subtitle", T.subtitle, { help: L("Quote Cards: the small line above the title (empty = What people say)", "Quote Cards: শিরোনামের উপরের ছোট লাইন (খালি = What people say)") }),
    list("items", L("Reviews", "রিভিউ"), testimonialItem, { name: "", role: "", company: "", content: "", rating: 5 }, ["name", "content"]),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["carousel", "Slideshow", "স্লাইডশো"], ["masonry", "Masonry", "ম্যাসনরি"]), { group: "style", showWhen: { variant: [""] } }),
    text("emptyText", L("When there are no reviews", "কোনো রিভিউ না থাকলে"), { group: "advanced", placeholder: L("No testimonials added yet.", "No testimonials added yet."), showWhen: { variant: [""] } }),
    color("cardColor", L("Card colour", "কার্ডের রং"), { showWhen: { variant: ["photo-cards", "review-cards"] } }),
    color("starColor", L("Star colour", "স্টারের রং")),
    text("eyebrow", T.eyebrow),
    sel("headingAlign", L("Heading", "শিরোনাম"), opts(["left", "Left", "বাম"], ["center", "Centred with label", "মাঝে, লেবেলসহ"]), { group: "style", showWhen: { variant: ["formal-cards"] } }),
    group("summaryCard", L("Summary card above the reviews", "রিভিউয়ের উপরের সারাংশ কার্ড"), [
      bool("enabled", T.show),
      bool("stars", L("Show 5 stars", "৫ তারা দেখান")),
      text("title", L("Headline", "শিরোনাম"), { placeholder: L("e.g. Rated highly by our customers", "যেমন: Rated highly by our customers") }),
      text("text", T.text),
      text("buttonLabel", T.buttonText),
      link("buttonUrl", T.buttonGoesTo),
    ]),
    group("ratingSummary", L("Google rating card", "Google রেটিং কার্ড"), [
      bool("enabled", T.show),
      num("value", L("Rating (from your Google profile)", "রেটিং (আপনার Google প্রোফাইল থেকে)"), { min: 1, max: 5, step: 0.1 }),
      text("count", L("Number of reviews", "রিভিউয়ের সংখ্যা")),
      link("url", L("Link to your Google reviews", "আপনার Google রিভিউয়ের লিংক")),
      text("label", T.label, { placeholder: L("Google Reviews", "Google Reviews") }),
      text("countLabel", L("Count line ({count} = number)", "সংখ্যার লাইন ({count} = সংখ্যা)"), { placeholder: L("Based on {count} reviews", "Based on {count} reviews") }),
      sel("position", L("Position", "অবস্থান"), opts(["bottom", "Below the reviews", "রিভিউয়ের নিচে"], ["top", "Above the reviews", "রিভিউয়ের উপরে"])),
    ]),
    num("initialCount", L("Show this many first (Load more)", "প্রথমে এতগুলো দেখান (আরও দেখুন)"), { min: 0, max: 50, step: 1, group: "advanced" }),
    text("loadMoreLabel", L("Load more button", "আরও দেখুন বাটন"), { group: "advanced", placeholder: L("Load more reviews", "Load more reviews") }),
    group("reviewForm", L("Visitors can post reviews (group source)", "ভিজিটর রিভিউ দিতে পারবে (গ্রুপ সোর্স)"), [
      bool("enabled", T.show),
      bool("autoPublish", L("Publish instantly", "সাথে সাথে প্রকাশ")),
      text("title", L("Form title", "ফর্মের শিরোনাম"), { placeholder: L("Give Your Rating", "Give Your Rating") }),
      text("text", L("Text under the title", "শিরোনামের নিচের লেখা")),
      text("buttonLabel", T.buttonText, { placeholder: L("Submit Review", "Submit Review") }),
      text("ctaLabel", L("Score card button", "স্কোর কার্ডের বাটন")),
      link("ctaUrl", T.buttonGoesTo),
      text("promptText", L("Before a star is picked", "স্টার বাছার আগে"), { placeholder: L("Please select a rating", "Please select a rating") }),
      text("namePlaceholder", L("Name box", "নামের ঘর"), { placeholder: L("Your Name", "Your Name") }),
      text("placePlaceholder", L("Area box", "এলাকার ঘর"), { placeholder: L("Area (optional), e.g. Tampines", "Area (optional), e.g. Tampines") }),
      text("textPlaceholder", L("Review box", "রিভিউয়ের ঘর"), { placeholder: L("Write your review...", "Write your review...") }),
      text("photosText", L("Photo hint", "ছবির নির্দেশনা"), { placeholder: L("Add up to 5 photos of the work (optional).", "Add up to 5 photos of the work (optional).") }),
      text("thanksText", L("After sending (published)", "পাঠানোর পরে (প্রকাশিত)"), { placeholder: L("Thank you! Your review has been added.", "Thank you! Your review has been added.") }),
      text("pendingText", L("After sending (to approve)", "পাঠানোর পরে (অনুমোদনের অপেক্ষায়)"), { placeholder: L("Thank you! Your review will appear once approved.", "Thank you! Your review will appear once approved.") }),
      text("countLabel", L("Score card line ({count} = number)", "স্কোর কার্ডের লাইন ({count} = সংখ্যা)"), { placeholder: L("{count} customer reviews", "{count} customer reviews") }),
    ], { group: "advanced" }),
    hidden("source"), hidden("source_group_id"), hidden("limit"),
  ],
  custom: true,
};

const gallery: BlockFieldSchema = {
  type: "gallery", thumb: "gallery-grid", summary: ["title", "images.length"],
  fields: [
    text("eyebrow", T.eyebrow),
    text("title", T.title),
    text("subtitle", T.subtitle),
    list("images", L("Photos", "ছবি"), [
      hidden("id"),
      img("url", T.photo),
      hidden("imageFocus"),
      text("alt", T.photoAlt, { group: "advanced" }),
      text("caption", L("Caption", "ক্যাপশন")),
      text("category", L("Category (filter tab)", "ক্যাটাগরি (ফিল্টার ট্যাব)"), { group: "advanced" }),
      text("note", L("Small line under the title", "শিরোনামের নিচের ছোট লাইন"), { showWhen: { variant: ["document-cards"] } }),
    ], { url: "", alt: "", caption: "" }, ["caption", "alt"]),
    // No Layout field: data.layout was never read; the look comes from the layout picker.
    hidden("layout"),
    sel("columns", T.columns, columnsOpts([1, 2, 3, 4, 5, 6]), { group: "style" }),
    sel("gap", L("Space between photos", "ছবির মাঝে ফাঁকা"), gapOpts, { group: "style", showWhen: { variant: ["", "masonry-captioned"] } }),
    bool("lightbox", L("Open full size on tap", "চাপলে বড় করে দেখাবে"), { group: "advanced" }),
    group("link", L("Button under the photos", "ছবির নিচের বাটন"), [text("label", T.label, { placeholder: L("See all", "See all") }), link("url", T.linkTo)]),
    num("limit", L("Show this many first (Load more)", "প্রথমে এতগুলো দেখান (আরও দেখুন)"), { min: 0, max: 60, step: 1, group: "advanced" }),
    text("loadMoreLabel", L("Load more button", "আরও দেখুন বাটন"), { group: "advanced", placeholder: L("Load more", "Load more") }),
    bool("showFilter", L("Filter tabs by category", "ক্যাটাগরি অনুযায়ী ফিল্টার ট্যাব")),
    text("filterAllLabel", L("First filter tab", "প্রথম ফিল্টার ট্যাব"), { group: "advanced", placeholder: L("All", "All"), showWhen: { field: "showFilter", in: ["true"] } }),
    text("emptyText", L("When there are no photos", "কোনো ছবি না থাকলে"), { group: "advanced", placeholder: L("No images added yet", "No images added yet") }),
    hidden("source"), hidden("portfolioGroupId"), hidden("collection"),
  ],
  custom: true,
};

const team: BlockFieldSchema = {
  type: "team", thumb: "avatar-grid", summary: ["title", "members.length"],
  fields: [
    ...titleBlock(),
    list("members", L("People", "সদস্য"), [
      hidden("id"),
      img("avatar", T.photo),
      hidden("imageFocus"),
      text("name", T.name),
      text("role", L("Role / title", "পদবি")),
      area("bio", L("Short bio (Message: their statement)", "সংক্ষিপ্ত পরিচয় (Message: তাদের বক্তব্য)")),
      text("phone", L("Phone", "ফোন"), { group: "advanced" }),
      list("social", L("Icon links (email, website, phone)", "আইকন লিংক (ইমেইল, ওয়েবসাইট, ফোন)"), [
        sel("platform", L("Kind", "ধরন"), opts(["email", "Email", "ইমেইল"], ["website", "Website", "ওয়েবসাইট"], ["phone", "Phone", "ফোন"])),
        text("url", L("Link (mailto:, https://, tel:)", "লিংক (mailto:, https://, tel:)")),
      ], { platform: "website", url: "" }, ["platform", "url"], { group: "advanced", showWhen: { variant: ["", "avatar-cards", "minimal-list"] } }),
    ], { name: "", role: "", avatar: "", bio: "" }, ["name", "role"]),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["list", "List", "তালিকা"], ["cards", "Cards", "কার্ড"]), { group: "style", showWhen: { variant: [""] } }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style", showWhen: { variant: ["", "avatar-cards", "photo-tiles", "dark-cards", "bordered-grid"] } }),
    bool("showBio", L("Show bio", "পরিচয় দেখান"), { group: "style", showWhen: { variant: ["", "avatar-cards", "bio-rows", "dark-cards", "centered-feature"] } }),
    bool("showSocial", L("Show social links", "সোশ্যাল লিংক দেখান"), { group: "style", showWhen: { variant: ["", "avatar-cards", "minimal-list"] } }),
    bool("framedPhotos", L("Framed photos (no crop)", "ফ্রেমে ছবি (কাটা ছাড়া)"), { group: "style", showWhen: { variant: ["photo-tiles"] } }),
    hidden("collection"),
  ],
  custom: true,
};

const pricing: BlockFieldSchema = {
  type: "pricing", thumb: "pricing-cards", summary: ["title", "plans.length"],
  fields: [
    ...titleBlock(true, true),
    list("plans", L("Plans", "প্ল্যান"), [
      hidden("id"),
      text("name", L("Plan name", "প্ল্যানের নাম")),
      text("price", L("Price", "দাম"), { placeholder: L("$29", "৳2,900") }),
      text("period", L("Per", "প্রতি"), { placeholder: L("month", "মাস") }),
      area("description", T.description, { showWhen: { variant: ["", "highlighted-cards", "dark-cards", "minimal-dark", "membership-cards", "menu-pricing", "spec-cards", "pro-tiers"] } }),
      { key: "features", type: "lines", label: L("What's included", "যা যা আছে") },
      { key: "excludedFeatures", type: "lines", label: L("Not included (shown greyed)", "যা নেই (ধূসর দেখাবে)"), showWhen: { variant: ["spec-cards", "pro-tiers"] } },
      text("ctaLabel", T.buttonText),
      link("ctaUrl", T.buttonGoesTo),
      bool("highlighted", L("Highlight this plan", "এই প্ল্যান হাইলাইট করুন"), { group: "style" }),
      text("badge", L("Badge", "ব্যাজ"), { placeholder: L("Most Popular", "জনপ্রিয়"), showWhen: { variant: ["", "highlighted-cards", "dark-cards", "minimal-dark", "membership-cards", "menu-pricing", "spec-cards", "pro-tiers"] } }),
      text("oldPrice", L("Old price (crossed out)", "আগের দাম (কাটা)"), { showWhen: { variant: ["spec-cards", "pro-tiers"] } }),
      text("tag", L("Tag chip beside the name", "নামের পাশের ট্যাগ"), { showWhen: { variant: ["spec-cards", "pro-tiers"] } }),
      text("spec", L("Spec line under the price", "দামের নিচের স্পেক লাইন"), { showWhen: { variant: ["spec-cards", "pro-tiers"] } }),
      hidden("meters"), hidden("catalog"), hidden("priceUsdCents"), hidden("priceBdt"), hidden("oldPriceUsdCents"), hidden("oldPriceBdt"),
    ], { name: "", price: "", period: "", description: "", features: [], ctaLabel: "Get started", ctaUrl: "/contact" }, ["name", "price"]),
    // layout and billingToggle were never drawn (no comparison table, no monthly / yearly switch).
    hidden("layout"), hidden("billingToggle"),
    bool("showCurrencyToggle", L("USD / BDT switch for visitors", "ভিজিটরের জন্য USD / BDT সুইচ"), { group: "advanced" }),
    text("currencyPrefix", L("Currency before every price", "প্রতিটি দামের আগের মুদ্রা"), { placeholder: L("RM, $, QAR", "RM, $, QAR"), showWhen: { variant: ["spec-cards"] } }),
    bool("whatsappCta", L("Buttons open WhatsApp", "বাটন হোয়াটসঅ্যাপ খুলবে"), { showWhen: { variant: ["spec-cards"] } }),
    area("whatsappText", L("WhatsApp message ({plan}, {price})", "হোয়াটসঅ্যাপ বার্তা ({plan}, {price})"), { placeholder: L("Hi, I am interested in the {plan} package ({price}).", "Hi, I am interested in the {plan} package ({price})."), showWhen: { field: "whatsappCta", in: ["true"] } }),
    area("footnote", L("Note under the plans", "প্ল্যানের নিচের নোট"), { showWhen: { variant: ["spec-cards", "pro-tiers"] } }),
    group("colors", L("Colours", "রং"), [color("dark", L("Dark colour", "গাঢ় রং")), color("accent", T.accent)], { group: "style", showWhen: { variant: ["spec-cards"] } }),
    hidden("language"), hidden("displayCurrencies"), hidden("bdtDefault"),
  ],
  custom: true,
};

const contact: BlockFieldSchema = {
  type: "contact", thumb: "form-split", summary: ["title"],
  fields: [
    ...titleBlock(),
    text("submitLabel", T.submitLabel),
    text("successMessage", T.successMessage),
    bool("showContactInfo", L("Show contact details", "যোগাযোগের তথ্য দেখান")),
    bool("showMap", L("Show map", "ম্যাপ দেখান")),
    text("mapEmbedUrl", L("Map location: Google Maps link or embed code", "ম্যাপের লোকেশন: Google Maps লিংক বা এম্বেড কোড"), {
      showWhen: { field: "showMap", in: ["true"] },
      help: L("Paste any Google Maps link: a share link, the page link of a place, or the code from Share > Embed a map. Empty: the map shows the address.",
        "যেকোনো Google Maps লিংক পেস্ট করুন: শেয়ার লিংক, কোনো জায়গার পেজের লিংক, অথবা Share > Embed a map-এর কোড। খালি রাখলে ম্যাপে ঠিকানা দেখাবে।"),
    }),
    num("mapHeight", L("Map height", "ম্যাপের উচ্চতা"), { unit: "px", min: 200, max: 800, step: 20, group: "style", showWhen: { field: "showMap", in: ["true"] } }),
    hidden("mapLocation"),
    sel("layout", T.layout, opts(["left", "Form left", "ফর্ম বামে"], ["centered", "Centred", "মাঝে"], ["split", "Form beside details", "তথ্যের পাশে ফর্ম"]), { group: "style" }),
    sel("formStyle", L("Form look", "ফর্মের ধরন"), opts(["card", "Card", "কার্ড"], ["filled", "Filled fields", "ভরা ঘর"]), { group: "style" }),
    list("fields", L("Form fields", "ফর্মের ঘর"), [
      hidden("id"),
      text("label", T.label),
      sel("type", L("Type", "ধরন"), opts(["text", "Text", "লেখা"], ["email", "Email", "ইমেইল"], ["tel", "Phone", "ফোন"], ["textarea", "Long text", "লম্বা লেখা"], ["select", "Choice", "পছন্দ"])),
      bool("required", L("Required", "আবশ্যক")),
    ], { label: "", type: "text", required: false }, ["label", "type"], { group: "advanced" }),
    bool("largeInputs", L("Taller form fields", "বড় ফর্মের ঘর"), { group: "style" }),
    hidden("recipientEmail"), hidden("hideForm"), hidden("whatsapp"), hidden("info"),
    ...uiTextFields("contact"),
  ],
  custom: true,
};

const steps: BlockFieldSchema = {
  type: "steps", thumb: "steps-row", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(),
    list("items", L("Steps", "ধাপ"), [
      hidden("id"),
      text("title", L("Step title", "ধাপের নাম")),
      area("description", T.description),
      icon("icon", T.icon, { showWhen: { variant: ["", "timeline-connected", "numbered-cards", "icon-row"] } }),
      img("imageUrl", T.photo, { showWhen: { variant: ["", "timeline-connected", "split-media"] } }),
      text("number", L("Custom number", "কাস্টম নম্বর"), { group: "advanced" }),
    ], { title: "", description: "" }, ["title", "description"]),
    sel("layout", T.layout, opts(["horizontal", "Side by side", "পাশাপাশি"], ["vertical", "Top to bottom", "উপর থেকে নিচে"], ["numbered", "Numbered", "নম্বরসহ"]), { group: "style", showWhen: { variant: [""] } }),
    sel("style", T.style, opts(["plain", "Plain", "সাধারণ"], ["connected", "Connected line", "সংযুক্ত রেখা"], ["card", "Cards", "কার্ড"]), { group: "style", showWhen: { variant: [""] } }),
    text("stepLabel", L("Word before each number", "প্রতিটি নম্বরের আগের শব্দ"), { group: "advanced", placeholder: L("Step", "Step"), showWhen: { variant: ["dark-cards", "split-media"] } }),
  ],
};

const timeline: BlockFieldSchema = {
  type: "timeline", thumb: "timeline", summary: ["title", "items.length"],
  fields: [
    text("title", T.title),
    text("subtitle", T.subtitle),
    list("items", L("Milestones", "মাইলফলক"), [
      hidden("id"),
      text("date", L("Date", "তারিখ"), { placeholder: L("Jan 2024", "জানু ২০২৪") }),
      text("title", T.title),
      area("description", T.description),
      icon("icon", T.icon),
      // Only the vertical layout shows photos.
      img("imageUrl", T.photo),
    ], { date: "", title: "", description: "" }, ["title", "date"]),
    sel("layout", T.layout, opts(["vertical", "Vertical", "উল্লম্ব"], ["horizontal", "Horizontal", "অনুভূমিক"], ["alternating", "Alternating sides", "দুই পাশে পালাক্রমে"]), { group: "style" }),
    sel("style", T.style, opts(["simple", "Simple", "সাধারণ"], ["card", "Cards", "কার্ড"], ["colored", "Coloured", "রঙিন"]), { group: "style", showWhen: { field: "layout", in: ["vertical", "alternating"] } }),
  ],
};

const video: BlockFieldSchema = {
  type: "video", thumb: "video-embed", summary: ["title", "url"],
  fields: [
    // Section heading and the video list: Video Gallery and Playlist only.
    text("title", L("Section title", "সেকশনের শিরোনাম"), { showWhen: { variant: ["gallery", "playlist"] } }),
    text("subtitle", T.subtitle, { showWhen: { variant: ["gallery", "playlist"] } }),
    list("videos", L("Videos", "ভিডিও"), [hidden("id"), text("url", L("Video link (YouTube, Vimeo or .mp4)", "ভিডিও লিংক (YouTube, Vimeo বা .mp4)")), text("title", L("Title (optional)", "শিরোনাম (ঐচ্ছিক)"))], { url: "", title: "" }, ["title", "url"], { showWhen: { variant: ["gallery", "playlist"] } }),
    sel("galleryColumns", T.columns, columnsOpts([2, 3, 4]), { group: "style", showWhen: { variant: ["gallery"] } }),
    // One video: every other design.
    text("url", L("Video link (YouTube, Vimeo or .mp4)", "ভিডিও লিংক (YouTube, Vimeo বা .mp4)"), { required: true, showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    sel("videoType", L("Video source", "ভিডিওর উৎস"), opts(["youtube", "YouTube", "YouTube"], ["vimeo", "Vimeo", "Vimeo"], ["mp4", "Video file", "ভিডিও ফাইল"]), { showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    text("caption", L("Caption", "ক্যাপশন"), { showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    img("poster", L("Cover image (video files)", "কভার ছবি (ভিডিও ফাইল)"), { showWhen: { field: "videoType", in: ["mp4"] } }),
    sel("aspectRatio", L("Shape", "আকার"), ratioOpts, { group: "style", showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    text("maxWidth", L("Largest width (e.g. 800px)", "সর্বোচ্চ প্রস্থ (যেমন 800px)"), { group: "style", showWhen: { variant: ["", "framed", "card"] } }),
    bool("autoplay", L("Play automatically", "নিজে নিজে চলবে"), { group: "advanced", showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    bool("muted", L("Start muted", "শব্দ বন্ধ থাকবে"), { group: "advanced", showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    bool("loop", L("Repeat", "বারবার চলবে"), { group: "advanced", showWhen: { variant: ["", "framed", "card", "cinematic"] } }),
    bool("controls", L("Show player controls (video files)", "প্লেয়ার কন্ট্রোল দেখান (ভিডিও ফাইল)"), { group: "advanced", showWhen: { field: "videoType", in: ["mp4"] } }),
  ],
  custom: true,
};

const embed: BlockFieldSchema = {
  type: "embed", thumb: "video-embed", summary: ["url"],
  fields: [
    text("url", L("Link to embed", "এম্বেড লিংক"), { required: true }),
    sel("embedType", L("What is it", "এটি কী"), opts(["youtube", "YouTube", "YouTube"], ["vimeo", "Vimeo", "Vimeo"], ["spotify", "Spotify (embed link)", "Spotify (এম্বেড লিংক)"], ["iframe", "Any web page", "যেকোনো ওয়েব পেজ"])),
    text("caption", L("Caption", "ক্যাপশন")),
    sel("aspectRatio", L("Shape", "আকার"), [...ratioOpts, opt("9:16", "Tall (9:16)", "লম্বা (9:16)")], { group: "style" }),
    bool("autoplay", L("Play automatically", "নিজে নিজে চলবে"), { group: "advanced" }),
  ],
};

const newsletter: BlockFieldSchema = {
  type: "newsletter", thumb: "newsletter-bar", summary: ["title"],
  fields: [
    text("title", T.title),
    area("description", T.description),
    text("placeholder", L("Text inside the email box", "ইমেইল ঘরের ভেতরের লেখা")),
    text("submitLabel", T.buttonText),
    text("successMessage", T.successMessage),
    sel("layout", T.layout, opts(["inline", "One line", "এক লাইনে"], ["centered", "Centred", "মাঝে"], ["stacked", "Stacked", "উপরে-নিচে"], ["card", "Card", "কার্ড"]), { group: "style" }),
    sel("fieldStyle", L("Field look", "ঘরের ধরন"), opts(["box", "Box", "বক্স"], ["underline", "Underline", "আন্ডারলাইন"]), { group: "style" }),
    text("webhookUrl", L("Send sign-ups to (webhook)", "সাইন-আপ পাঠানোর ঠিকানা (webhook)"), { group: "advanced" }),
    hidden("provider"),
  ],
};

const countdown: BlockFieldSchema = {
  type: "countdown", thumb: "countdown-bar", summary: ["title"],
  fields: [
    text("title", T.title),
    { key: "targetDate", type: "date", label: L("Counting down to", "যে সময় পর্যন্ত") },
    text("expiredMessage", L("Message when time is up", "সময় শেষ হলে বার্তা")),
    sel("layout", T.layout, opts(["boxes", "Boxes", "বক্স"], ["minimal", "Minimal", "সাধারণ"]), { group: "style" }),
    bool("showSeconds", L("Show seconds", "সেকেন্ড দেখান"), { group: "style" }),
    group("labels", L("Unit names", "এককের নাম"), [
      text("days", L("Days", "দিন")), text("hours", L("Hours", "ঘণ্টা")), text("minutes", L("Minutes", "মিনিট")), text("seconds", L("Seconds", "সেকেন্ড")),
    ], { group: "advanced" }),
    hidden("showAllText"),
  ],
};

const iconGrid: BlockFieldSchema = {
  type: "icon_grid", thumb: "colored-tiles", summary: ["title", "items.length"],
  fields: [
    text("title", T.title),
    text("subtitle", T.subtitle),
    // Item keys are the renderer's (imageUrl, url); the schema used to say image / link, which nothing read.
    list("items", T.items, [
      hidden("id"),
      icon("icon", T.icon, { showWhen: { variant: ["", "icons-classic", "colored-tiles", "circle-icons", "outlined-cards", "bordered-matrix", "dark-tiles", "pill-row", "minimal-inline", "grouped-list", "logo-strip"] } }),
      img("imageUrl", L("Logo instead of icon", "আইকনের বদলে লোগো"), { showWhen: { variant: ["", "icons-classic", "colored-tiles", "circle-icons", "outlined-cards", "bordered-matrix", "dark-tiles", "pill-row", "minimal-inline", "grouped-list", "logo-strip"] } }),
      img("thumbUrl", L("Photo on the card's left edge", "কার্ডের বাম পাশের ছবি"), { showWhen: { variant: ["outlined-cards"] } }),
      text("label", T.label),
      area("description", L("Description (Grouped List: one name per line)", "বিবরণ (Grouped List: প্রতি লাইনে একটি নাম)")),
      link("url", T.linkTo, { group: "advanced" }),
      color("color", L("Colour", "রং")),
      color("tileColor", L("Tile colour", "টাইলের রং"), { showWhen: { variant: ["colored-tiles"] } }),
    ], { icon: "Star", label: "" }, ["label", "description"]),
    sel("columns", T.columns, columnsOpts([2, 3, 4, 5, 6]), { group: "style" }),
    sel("style", T.style, opts(["plain", "Plain", "সাধারণ"], ["card", "Cards", "কার্ড"], ["colored", "Coloured tiles", "রঙিন টাইল"]), { group: "style", showWhen: { variant: ["", "icons-classic"] } }),
    sel("iconSize", L("Icon size", "আইকনের আকার"), sizeOpts, { group: "style", showWhen: { variant: ["", "icons-classic", "colored-tiles", "minimal-inline"] } }),
    num("imageSize", L("Logo size", "লোগোর আকার"), { unit: "px", min: 32, max: 160, step: 8, group: "style" }),
    bool("showDescriptions", L("Show descriptions", "বিবরণ দেখান"), { group: "style", showWhen: { variant: ["bordered-matrix", "minimal-inline"] } }),
    bool("hideCount", L("Hide the count in grouped lists", "গ্রুপ তালিকায় সংখ্যা লুকান"), { group: "style", showWhen: { variant: ["grouped-list"] } }),
  ],
  custom: true,
};

const divider: BlockFieldSchema = {
  type: "divider", thumb: "text-center",
  fields: [
    sel("style", L("Line style", "রেখার ধরন"), opts(["solid", "Solid", "সরল"], ["dashed", "Dashed", "ড্যাশ"], ["dotted", "Dotted", "ডট"], ["wave", "Wave", "ঢেউ"], ["zigzag", "Zigzag", "আঁকাবাঁকা"])),
    sel("width", L("Width", "প্রস্থ"), opts(["full", "Full", "পুরো"], ["wide", "Wide", "চওড়া"], ["normal", "Normal", "সাধারণ"])),
    num("thickness", L("Thickness", "পুরুত্ব"), { unit: "px", min: 1, max: 12, step: 1, group: "style" }),
    color("color", L("Colour", "রং")),
  ],
};

const spacer: BlockFieldSchema = {
  type: "spacer", thumb: "text-center",
  fields: [num("height", L("Height", "উচ্চতা"), { unit: "px", min: 8, max: 400, step: 8 })],
};

const columns: BlockFieldSchema = {
  type: "columns", thumb: "faq-grid", summary: ["columns"],
  fields: [
    sel("columns", T.columns, columnsOpts([2, 3, 4])),
    { key: "content", type: "list", label: L("Column text", "কলামের লেখা"), item: [{ key: "", type: "richtext", label: T.text }], itemDefaults: {}, summary: [] },
    sel("gap", L("Space between columns", "কলামের মাঝে ফাঁকা"), gapOpts.filter((o) => o.value !== "none"), { group: "style" }),
    sel("verticalAlign", L("Vertical alignment", "উল্লম্ব সারিবদ্ধ"), opts(["top", "Top", "উপর"], ["middle", "Middle", "মাঝে"], ["bottom", "Bottom", "নিচ"]), { group: "style" }),
  ],
  custom: true,
};

const container: BlockFieldSchema = {
  type: "container", thumb: "bento-grid",
  fields: [
    hidden("columns"),
    sel("direction", L("Arrange", "সাজানো"), opts(["row", "Side by side", "পাশাপাশি"], ["column", "Stacked", "উপরে-নিচে"]), { group: "style" }),
    sel("gap", L("Space between", "মাঝে ফাঁকা"), gapOpts, { group: "style" }),
    sel("align", L("Align", "সারিবদ্ধ"), opts(["start", "Top", "উপর"], ["center", "Centre", "মাঝে"], ["end", "Bottom", "নিচ"], ["stretch", "Stretch", "টানা"]), { group: "advanced" }),
    sel("justify", L("Spread", "ছড়ানো"), opts(["start", "Start", "শুরু"], ["center", "Centre", "মাঝে"], ["end", "End", "শেষ"], ["between", "Space between", "মাঝে ফাঁকা"]), { group: "advanced" }),
    bool("wrapOnMobile", L("Stack on phones", "ফোনে উপরে-নিচে"), { group: "advanced" }),
    bool("sticky", L("Header: stays on screen when scrolling", "হেডার: স্ক্রল করলেও উপরে থাকবে"), { group: "advanced" }),
    bool("transparent", L("Header: see-through over the banner", "হেডার: ব্যানারের উপর স্বচ্ছ"), { group: "advanced" }),
    bool("scrollAware", L("Header: turns solid when scrolling", "হেডার: স্ক্রল করলে গাঢ় হবে"), { group: "advanced" }),
    bool("glass", L("Header: frosted glass when solid", "হেডার: গাঢ় অবস্থায় কাঁচের মতো"), { group: "advanced" }),
  ],
  custom: true,
};

const navItem: Field[] = [
  hidden("id"),
  text("label", T.label),
  link("url", T.linkTo),
  sel("target", L("Open in", "খুলবে"), opts(["_self", "Same tab", "একই ট্যাবে"], ["_blank", "New tab", "নতুন ট্যাবে"]), { group: "advanced" }),
  hidden("children"), hidden("icon"), hidden("highlight"), hidden("lang"), hidden("megaMenu"), hidden("megaColumns"), hidden("megaLinksAs"), hidden("megaLinksTitle"), hidden("childSource"), hidden("childLimit"),
  // Menu Studio fields (Navigation screen): kept as-is when an inline item is edited here.
  hidden("description"), hidden("badge"), hidden("showIcon"), hidden("device"), hidden("openOn"), hidden("mega"), hidden("childIds"), hidden("studio"),
  // Mega builder (menus P4) column fields.
  hidden("megaColumn"), hidden("megaSpan"), hidden("megaImage"),
];

const navigation: BlockFieldSchema = {
  type: "navigation", thumb: "newsletter-bar", summary: ["logoText"],
  fields: [
    text("logoText", L("Logo text", "লোগোর লেখা")),
    img("logo", L("Logo image", "লোগোর ছবি")),
    text("logoCaption", L("Small text beside the logo", "লোগোর পাশের ছোট লেখা"), { placeholder: L("e.g. a registration number", "যেমন: নিবন্ধন নম্বর") }),
    list("items", L("Menu links", "মেনু লিংক"), navItem, { label: "", url: "/" }, ["label", "url"]),
    bool("showCta", L("Show a button", "একটি বাটন দেখান")),
    text("ctaLabel", T.buttonText, { showWhen: { field: "showCta", in: ["true"] } }),
    link("ctaUrl", T.buttonGoesTo, { showWhen: { field: "showCta", in: ["true"] } }),
    sel("ctaVariant", L("Button look", "বাটনের ধরন"), opts(["gradient", "Gradient", "গ্রেডিয়েন্ট"], ["solid", "Solid", "ভরা"], ["outline", "Outline", "আউটলাইন"]), { group: "style", showWhen: { field: "showCta", in: ["true"] } }),
    color("ctaColor", L("Button colour", "বাটনের রং"), { showWhen: { field: "showCta", in: ["true"] } }),
    bool("hideCtaOnTablet", L("Hide the button on tablets", "ট্যাবলেটে বাটন লুকান"), { showWhen: { field: "showCta", in: ["true"] } }),
    color("ctaTextColor", L("Button text colour", "বাটনের লেখার রং"), { showWhen: { field: "showCta", in: ["true"] } }),
    text("secondaryCtaLabel", L("Second link text (computers and menu)", "দ্বিতীয় লিংকের লেখা (কম্পিউটার ও মেনু)")),
    link("secondaryCtaUrl", L("Second link goes to", "দ্বিতীয় লিংক যেখানে যাবে")),
    bool("showBooking", L("Booking button", "বুকিং বাটন")),
    text("bookingLabel", L("Booking button text", "বুকিং বাটনের লেখা"), { placeholder: L("Book now", "Book now"), showWhen: { field: "showBooking", in: ["true"] } }),
    link("bookingUrl", L("Booking page", "বুকিং পেজ"), { showWhen: { field: "showBooking", in: ["true"] } }),
    bool("showSearch", L("Search box", "সার্চ বক্স")),
    text("searchPlaceholder", L("Text inside the search box", "সার্চ বক্সের ভেতরের লেখা"), { placeholder: L("Search", "Search"), showWhen: { field: "showSearch", in: ["true"] } }),
    text("searchButtonLabel", L("Search button text", "সার্চ বাটনের লেখা"), { placeholder: L("Search", "Search"), showWhen: { field: "showSearch", in: ["true"] } }),
    bool("showAccount", L("Account icon", "অ্যাকাউন্ট আইকন")),
    sel("cartOpens", L("Cart icon opens", "কার্ট আইকনে চাপলে খুলবে"), opts(["drawer", "Side cart", "পাশের কার্ট"], ["page", "Cart page", "কার্ট পেজ"])),
    link("trackOrderUrl", L("Track-order icon goes to", "অর্ডার ট্র্যাক আইকন যেখানে যাবে"), { group: "advanced" }),
    bool("sticky", L("Stays on screen when scrolling", "স্ক্রল করলেও উপরে থাকবে"), { group: "style" }),
    bool("transparent", L("See-through over the banner", "ব্যানারের উপর স্বচ্ছ"), { group: "style" }),
    sel("style", T.style, opts(["default", "Logo left, links right", "লোগো বামে, লিংক ডানে"], ["centered", "Centred", "মাঝে"], ["split", "Links both sides", "দুই পাশে লিংক"], ["minimal", "Minimal", "সাধারণ"], ["logo-center", "Logo in the middle", "লোগো মাঝে"], ["logo-center-inline", "Logo in the middle, one row", "লোগো মাঝে, এক সারি"]), { group: "style" }),
    sel("colorMode", L("Bar colours", "বারের রং"), opts(["token", "Theme colours", "থিমের রং"], ["legacy", "My own colours", "নিজের রং"]), { group: "style" }),
    color("backgroundColor", L("Background", "ব্যাকগ্রাউন্ড"), { showWhen: { field: "colorMode", in: ["legacy"] } }),
    color("textColor", L("Text colour", "লেখার রং"), { showWhen: { field: "colorMode", in: ["legacy"] } }),
    color("activeColor", L("Highlight colour (logo mark, outline button)", "হাইলাইটের রং (লোগো চিহ্ন, আউটলাইন বাটন)")),
    hidden("logoIconUrl"), hidden("logoHeight"), hidden("logoUrl"), hidden("useBrandMark"), hidden("menuLocation"), hidden("stickyRows"), hidden("stickyTopBar"), hidden("ctaStyle"),
    hidden("languageSwitch"), hidden("languageSwitchMode"), hidden("languageSwitchUrl"), hidden("langSwitcherMobile"), hidden("topBar"), hidden("mobileLayout"),
    hidden("menuUppercase"), hidden("menuFontSize"), hidden("menuFontWeight"), hidden("menuGap"), hidden("ctaFontSize"),
    hidden("searchStyle"), hidden("searchScope"), hidden("searchCategoryFilter"), hidden("searchSuggestLimit"), hidden("topRowBackground"), hidden("menuRowBackground"),
    hidden("scrollAware"), hidden("glass"), hidden("floating"), hidden("showCart"), hidden("backgroundGradientTo"), hidden("shadow"), hidden("borderBottom"),
    ...uiTextFields("navigation"),
  ],
  custom: true,
};

const footer: BlockFieldSchema = {
  type: "footer", thumb: "cards-dark", summary: ["logoText"],
  fields: [
    text("logoText", L("Logo text", "লোগোর লেখা")),
    img("logo", L("Logo image", "লোগোর ছবি")),
    area("tagline", L("Tagline", "ট্যাগলাইন")),
    area("logoCaption", L("Small text under the tagline", "ট্যাগলাইনের নিচের ছোট লেখা"), { placeholder: L("e.g. a registration number", "যেমন: নিবন্ধন নম্বর") }),
    list("columns", L("Link columns", "লিংক কলাম"), [
      hidden("id"),
      text("heading", L("Column heading", "কলামের শিরোনাম")),
      area("text", L("Text under the heading (address, hours)", "শিরোনামের নিচের লেখা (ঠিকানা, সময়)")),
      list("links", L("Links", "লিংক"), [hidden("id"), text("label", T.label), link("url", T.linkTo), hidden("lang")], { label: "", url: "/" }, ["label", "url"]),
    ], { heading: "", links: [] }, ["heading", "links.length"]),
    bool("showSocials", L("Show the site's social icons", "সাইটের সোশ্যাল আইকন দেখান"), { help: L("From Business Profile > Social Media", "Business Profile > Social Media থেকে") }),
    list("socials", L("Social links", "সোশ্যাল লিংক"), [
      sel("platform", L("Platform", "প্ল্যাটফর্ম"), opts(["facebook", "Facebook", "Facebook"], ["instagram", "Instagram", "Instagram"], ["youtube", "YouTube", "YouTube"], ["tiktok", "TikTok", "TikTok"], ["linkedin", "LinkedIn", "LinkedIn"], ["twitter", "X / Twitter", "X / Twitter"], ["whatsapp", "WhatsApp", "WhatsApp"], ["snapchat", "Snapchat", "Snapchat"])),
      text("url", L("Profile link", "প্রোফাইল লিংক")),
    ], { platform: "facebook", url: "" }, ["platform", "url"]),
    text("followTitle", L("Heading above the social icons", "সোশ্যাল আইকনের উপরের শিরোনাম"), { placeholder: L("Retail: Follow us", "রিটেইল: Follow us") }),
    bool("showBooking", L("Booking strip", "বুকিং অংশ")),
    text("bookingTitle", L("Booking title", "বুকিংয়ের শিরোনাম"), { placeholder: L("Book an appointment", "Book an appointment"), showWhen: { field: "showBooking", in: ["true"] } }),
    text("bookingText", L("Booking text", "বুকিংয়ের লেখা"), { placeholder: L("Pick a day and time that suits you. We'll confirm your booking shortly.", "Pick a day and time that suits you. We'll confirm your booking shortly."), showWhen: { field: "showBooking", in: ["true"] } }),
    text("bookingLabel", L("Booking button text", "বুকিং বাটনের লেখা"), { placeholder: L("Book now", "Book now"), showWhen: { field: "showBooking", in: ["true"] } }),
    link("bookingUrl", L("Booking page", "বুকিং পেজ"), { showWhen: { field: "showBooking", in: ["true"] } }),
    bool("showNewsletter", L("Newsletter sign-up", "নিউজলেটার সাইন-আপ")),
    text("newsletterLabel", L("Newsletter title", "নিউজলেটারের শিরোনাম"), { placeholder: L("Get Updates", "Get Updates"), showWhen: { field: "showNewsletter", in: ["true"] } }),
    text("newsletterPlaceholder", L("Text inside the email box", "ইমেইল ঘরের ভেতরের লেখা"), { placeholder: L("Enter your email", "Enter your email"), showWhen: { field: "showNewsletter", in: ["true"] } }),
    text("copyrightText", L("Copyright line ({year} = this year)", "কপিরাইট লাইন ({year} = এই বছর)"), { placeholder: L("© {year} Your Business. All rights reserved.", "© {year} Your Business. All rights reserved."), help: L("Empty = © year, logo text, All rights reserved.", "খালি = © বছর, লোগোর লেখা, All rights reserved.") }),
    bool("copyrightYear", L("Add the current year automatically", "বছর নিজে নিজে যোগ হবে"), { group: "advanced" }),
    img("paymentImage", L("Payment logos image (Retail)", "পেমেন্ট লোগোর ছবি (রিটেইল)"), { showWhen: { field: "style", in: ["retail"] } }),
    text("bottomNote", L("Short line at the end of the bottom row (Retail)", "নিচের সারির শেষে ছোট লাইন (রিটেইল)"), { showWhen: { field: "style", in: ["retail"] } }),
    bool("wordmark", L("Giant name across the bottom", "নিচে বড় করে নাম"), { group: "style" }),
    list("bottomLinks", L("Bottom links", "নিচের লিংক"), [hidden("id"), text("label", T.label), link("url", T.linkTo), hidden("lang")], { label: "", url: "/" }, ["label", "url"], { group: "advanced" }),
    sel("style", T.style, opts(["dark", "Dark", "ডার্ক"], ["light", "Light", "হালকা"], ["colored", "Brand colour", "ব্র্যান্ড রং"], ["retail", "Retail", "রিটেইল"]), { group: "style" }),
    bool("autoLightLogo", L("Light logo on dark footers", "ডার্ক ফুটারে হালকা লোগো"), { group: "advanced" }),
    bool("largeTapTargets", L("Bigger links on phones", "ফোনে বড় লিংক"), { group: "advanced" }),
    num("logoHeight", L("Logo height (empty = standard)", "লোগোর উচ্চতা (খালি = সাধারণ)"), { unit: "px", min: 16, max: 200, step: 2, group: "style" }),
    bool("logoPlate", L("White backing behind the logo", "লোগোর পেছনে সাদা ব্যাকিং"), { group: "advanced", help: L("Keeps a dark logo readable on a dark footer", "ডার্ক ফুটারে ডার্ক লোগো পড়া যায়") }),
    color("backgroundColor", L("Background", "ব্যাকগ্রাউন্ড")),
    color("textColor", L("Text colour", "লেখার রং")),
    color("accentColor", L("Heading colour", "শিরোনামের রং")),
    bool("socialBrandColors", L("Social icons in brand colours", "সোশ্যাল আইকন ব্র্যান্ডের রঙে"), { group: "style" }),
    hidden("logoIconUrl"), hidden("logoUrl"), hidden("credit"), hidden("expertsBadge"),
    ...uiTextFields("footer"),
  ],
  custom: true,
};

/* ------------------------------------------- simpler and module blocks */

const socialLinks: BlockFieldSchema = {
  type: "social_links", thumb: "pill-list", summary: ["title"],
  fields: [
    text("title", T.title),
    { key: "align", type: "align", label: L("Alignment", "সারিবদ্ধ"), options: alignOpts, group: "style" },
    sel("size", L("Icon size", "আইকনের আকার"), sizeOpts, { group: "style" }),
    bool("brandColors", L("Brand colours", "ব্র্যান্ডের রং"), { group: "style" }),
    bool("showLabels", L("Show network names", "নেটওয়ার্কের নাম দেখান"), { group: "style" }),
  ],
  custom: true,
};

const blog: BlockFieldSchema = {
  type: "blog", thumb: "cards-3", summary: ["title"],
  fields: [
    ...titleBlock(),
    num("displayCount", L("How many posts", "কয়টি পোস্ট"), { min: 1, max: 24, step: 1, unit: "items" }),
    // Only Grid and List are drawn ("featured" / "masonry" show as Grid).
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["list", "List", "তালিকা"], ["featured", "First post large (shows as Grid)", "প্রথম পোস্ট বড় (গ্রিড দেখায়)"], ["masonry", "Masonry (shows as Grid)", "ম্যাসনরি (গ্রিড দেখায়)"]), { group: "style" }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style", showWhen: { field: "layout", in: ["grid", "featured", "masonry"] } }),
    bool("showExcerpt", L("Show summary", "সংক্ষেপ দেখান"), { group: "style" }),
    bool("showDate", L("Show date", "তারিখ দেখান"), { group: "style" }),
    // Never drawn by the block; kept so saved blocks stay valid.
    hidden("showAuthor"), hidden("showCategory"),
    bool("showReadMore", L("Show \"Read more\"", "\"আরও পড়ুন\" দেখান"), { group: "style" }),
    text("readMoreLabel", L("\"Read more\" text", "\"আরও পড়ুন\" লেখা"), { group: "advanced", placeholder: L("Read More", "Read More"), showWhen: { field: "showReadMore", in: ["true"] } }),
    text("viewAllLabel", L("\"View all\" button text", "\"সব দেখুন\" বাটনের লেখা"), { group: "advanced", placeholder: L("View All", "View All") }),
    link("viewAllUrl", L("\"View all\" goes to", "\"সব দেখুন\" যেখানে যাবে"), { group: "advanced" }),
    text("emptyText", L("When no post is published", "কোনো পোস্ট প্রকাশিত না থাকলে"), { group: "advanced", placeholder: L("No posts published yet.", "No posts published yet.") }),
  ],
};

const itemBox: BlockFieldSchema = {
  type: "item_box", thumb: "cards-3", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(),
    // image and link are objects ({type,value} / {type,url}) edited by the web panel; the app edits title and text.
    list("items", T.items, [hidden("id"), text("title", T.title), area("description", T.description), hidden("image"), hidden("link")], { title: "", description: "" }, ["title", "description"]),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["list", "List", "তালিকা"]), { group: "style" }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style" }),
    sel("cardStyle", L("Card style", "কার্ডের ধরন"), cardStyleOpts, { group: "style" }),
    text("linkLabel", L("Link text on cards", "কার্ডের লিংকের লেখা"), { group: "advanced", placeholder: L("Learn More", "Learn More") }),
    text("emptyText", L("When there are no cards", "কোনো কার্ড না থাকলে"), { group: "advanced", placeholder: L("No items to show yet.", "No items to show yet.") }),
    hidden("source"), hidden("source_group_id"), hidden("source_item_ids"),
  ],
  custom: true,
};

const marquee: BlockFieldSchema = {
  type: "marquee", thumb: "pill-list", summary: ["items.length"],
  fields: [
    { key: "items", type: "lines", label: L("Words that scroll", "যে শব্দগুলো চলবে") },
    text("separator", L("Separator", "বিভাজক")),
    sel("size", L("Text size", "লেখার আকার"), sizeOpts, { group: "style" }),
    num("speed", L("Speed", "গতি"), { min: 10, max: 120, step: 10, group: "style" }),
    sel("direction", L("Direction", "দিক"), opts(["left", "Right to left", "ডান থেকে বামে"], ["right", "Left to right", "বাম থেকে ডানে"]), { group: "style" }),
    bool("outlineAlternate", L("Outline every other word", "একটি পর একটি শব্দ আউটলাইন"), { group: "style" }),
    bool("scrollBoost", L("Speed up when scrolling", "স্ক্রলে গতি বাড়বে"), { group: "advanced" }),
    color("color", L("Text colour", "লেখার রং")),
    color("accentColor", L("Separator colour", "বিভাজকের রং")),
  ],
};

const table: BlockFieldSchema = {
  type: "table", thumb: "faq-grid", summary: ["title"],
  fields: [
    ...titleBlock(true, true),
    { key: "columns", type: "lines", label: L("Column headings", "কলামের শিরোনাম") },
    hidden("rows"),
    sel("design", L("Design", "ডিজাইন"), opts(["default", "Classic table", "সাধারণ টেবিল"], ["compare", "Comparison (ticks and crosses)", "তুলনা (টিক ও ক্রস)"]), { group: "style" }),
    num("highlightColumn", L("Highlighted column (0 = none, 1 = the second column)", "হাইলাইট করা কলাম (0 = নেই, 1 = দ্বিতীয় কলাম)"), { min: 0, max: 8, step: 1, group: "style", showWhen: { field: "design", in: ["compare"] } }),
    { key: "columnNotes", type: "lines", label: L("Small line under each column heading (one per line)", "প্রতি কলামের শিরোনামের নিচের ছোট লেখা (প্রতি লাইনে একটি)"), showWhen: { field: "design", in: ["compare"] } },
    list("columnButtons", L("Button under each column (first row = first column, left empty)", "প্রতি কলামের নিচের বাটন (প্রথম সারি = প্রথম কলাম, খালি রাখুন)"), [text("label", T.buttonText), link("url", T.buttonGoesTo)], { label: "", url: "" }, ["label"], { showWhen: { field: "design", in: ["compare"] } }),
    text("yesLabel", L("Word read aloud for a tick", "টিকের জন্য পড়া শব্দ"), { group: "advanced", placeholder: L("Yes", "হ্যাঁ"), showWhen: { field: "design", in: ["compare"] } }),
    text("noLabel", L("Word read aloud for a cross", "ক্রসের জন্য পড়া শব্দ"), { group: "advanced", placeholder: L("No", "না"), showWhen: { field: "design", in: ["compare"] } }),
    bool("firstColumnHeader", L("First column is a heading", "প্রথম কলাম শিরোনাম"), { group: "style" }),
    bool("hideHeader", L("Hide the header row", "শিরোনামের সারি লুকান"), { group: "style" }),
    bool("striped", L("Striped rows", "ডোরাকাটা সারি"), { group: "style" }),
    sel("mobileLayout", L("On phones", "ফোনে"), opts(["scroll", "Scroll sideways", "পাশে স্ক্রল"], ["cards", "Cards", "কার্ড"]), { group: "style" }),
    color("headerColor", L("Header colour", "শিরোনামের সারির রং")),
    area("note", L("Note under the table", "টেবিলের নিচের নোট")),
    bool("searchable", L("Search box", "সার্চ বক্স"), { group: "advanced" }),
    bool("exportable", L("CSV and print buttons", "CSV ও প্রিন্ট বাটন"), { group: "advanced" }),
    num("pageSize", L("Rows per page (0 = all)", "প্রতি পেজে সারি (0 = সব)"), { min: 0, max: 200, step: 5, group: "advanced" }),
    text("searchPlaceholder", L("Search box text", "সার্চ বক্সের লেখা"), { group: "advanced", placeholder: L("Search…", "Search…"), showWhen: { field: "searchable", in: ["true"] } }),
    text("csvLabel", L("CSV button", "CSV বাটন"), { group: "advanced", placeholder: L("CSV", "CSV"), showWhen: { field: "exportable", in: ["true"] } }),
    text("printLabel", L("Print button", "প্রিন্ট বাটন"), { group: "advanced", placeholder: L("Print / PDF", "Print / PDF"), showWhen: { field: "exportable", in: ["true"] } }),
    text("prevLabel", L("Previous page button", "আগের পেজ বাটন"), { group: "advanced", placeholder: L("Previous", "Previous") }),
    text("nextLabel", L("Next page button", "পরের পেজ বাটন"), { group: "advanced", placeholder: L("Next", "Next") }),
    text("ofLabel", L("Word in \"3 of 12\"", "\"3 of 12\"-এর শব্দ"), { group: "advanced", placeholder: L("of", "of") }),
    hidden("collection"),
  ],
  custom: true,
};

const customHtml: BlockFieldSchema = {
  type: "custom_html", thumb: "text-center",
  fields: [area("html", L("HTML code", "HTML কোড"), { group: "advanced" })],
};

const search: BlockFieldSchema = {
  type: "search", thumb: "newsletter-bar",
  fields: [
    text("placeholder", L("Text inside the box", "ঘরের ভেতরের লেখা"), { placeholder: L("Search", "Search") }),
    bool("showButton", L("Show a search button", "সার্চ বাটন দেখান")),
    text("buttonLabel", T.buttonText, { placeholder: L("Search", "Search"), showWhen: { field: "showButton", in: ["true"] } }),
    text("title", L("Heading above the box (pages)", "বক্সের উপরের শিরোনাম (পেজে)")),
    text("subtitle", L("Text under the heading", "শিরোনামের নিচের লেখা")),
    num("limit", L("Suggestions to show", "কয়টি সাজেশন"), { min: 1, max: 10, step: 1, group: "advanced" }),
    sel("style", T.style, opts(["pill", "Rounded", "গোলাকার"], ["boxed", "Boxed", "বক্স"], ["plain", "Plain", "সাধারণ"]), { group: "style" }),
    { key: "align", type: "align", label: L("Alignment", "সারিবদ্ধ"), options: alignOpts, group: "style" },
    num("maxWidth", L("Box width", "বক্সের চওড়া"), { unit: "px", min: 200, max: 1200, step: 20, group: "advanced" }),
    hidden("types"),
  ],
};

const headerLogo: BlockFieldSchema = {
  type: "header_logo", thumb: "newsletter-bar",
  fields: [
    num("height", L("Logo height", "লোগোর উচ্চতা"), { unit: "px", min: 20, max: 80, step: 2 }),
    img("imageUrl", L("Logo for this header only", "শুধু এই হেডারের লোগো"), { help: L("Empty = the site's uploaded logo", "খালি = সাইটের আপলোড করা লোগো") }),
    img("imageDarkUrl", L("Logo for dark mode", "ডার্ক মোডের লোগো"), { group: "advanced" }),
    text("text", L("Business name (beside the logo, or instead of a logo)", "ব্যবসার নাম (লোগোর পাশে, বা লোগোর বদলে)"), { placeholder: L("Brand", "Brand") }),
    bool("showName", L("Show the name beside the logo", "লোগোর পাশে নাম দেখান")),
    color("textColor", L("Name colour when there is no logo", "লোগো না থাকলে নামের রং")),
    link("linkUrl", L("Logo goes to", "লোগো যেখানে যাবে"), { group: "advanced" }),
  ],
  custom: true,
};
const headerNav: BlockFieldSchema = {
  type: "header_nav", thumb: "newsletter-bar", summary: ["items.length"],
  fields: [
    list("items", L("Menu links", "মেনু লিংক"), navItem, { label: "", url: "/" }, ["label", "url"]),
    sel("style", T.style, opts(["default", "Default", "ডিফল্ট"], ["centered", "Centred", "মাঝে"], ["split", "Split", "দুই পাশে"], ["minimal", "Minimal", "সাধারণ"], ["logo-center", "Logo in the middle", "লোগো মাঝে"]), { group: "style" }),
    hidden("menuLocation"),
    // Menu block (menus P2): a saved menu by id in the new menu renderer.
    hidden("menuId"),
    sel("layout", L("Menu layout (unset = classic header links)", "মেনুর লেআউট (খালি = পুরনো হেডার লিংক)"), opts(
      ["bar", "Menu bar", "মেনু বার"], ["vertical", "Sidebar list", "সাইডবার তালিকা"], ["inline", "Inline links", "এক লাইনে লিংক"],
      ["accordion", "Folding list", "ভাঁজ করা তালিকা"], ["drawer", "Menu button", "মেনু বাটন"]), { group: "style" }),
    hidden("menuStyle"),
    sel("align", L("Alignment", "অবস্থান"), opts(["start", "Start", "শুরুতে"], ["center", "Centre", "মাঝে"], ["end", "End", "শেষে"]), { group: "style" }),
    sel("phoneLayout", L("On phones (menu bar)", "ফোনে (মেনু বার)"), opts(["drawer", "Menu button", "মেনু বাটন"], ["same", "Same bar", "একই বার"]), { group: "style" }),
    num("levels", L("Levels shown (lists)", "কয় ধাপ দেখাবে (তালিকা)"), { group: "style" }),
    text("buttonLabel", L("Menu button text", "মেনু বাটনের লেখা"), { group: "advanced" }),
    text("label", L("Menu name for screen readers", "স্ক্রিন রিডারের জন্য মেনুর নাম"), { group: "advanced" }),
  ],
  custom: true,
};
const buttonVariantOpts = opts(["solid", "Solid", "ভরা"], ["gradient", "Gradient", "গ্রেডিয়েন্ট"], ["outline", "Outline", "আউটলাইন"]);
const headerCta: BlockFieldSchema = {
  type: "header_cta", thumb: "cta-banner", summary: ["label"],
  fields: [text("label", T.buttonText), link("url", T.buttonGoesTo), sel("variant", L("Button look", "বাটনের ধরন"), buttonVariantOpts, { group: "style" })],
};
const headerBooking: BlockFieldSchema = {
  type: "header_booking", thumb: "cta-banner", summary: ["label"],
  fields: [text("label", T.buttonText), link("url", L("Booking page", "বুকিং পেজ")), sel("variant", L("Button look", "বাটনের ধরন"), buttonVariantOpts, { group: "style" })],
};
const headerCart: BlockFieldSchema = { type: "header_cart", thumb: "newsletter-bar", fields: [bool("showLabel", L("Show text beside the icon", "আইকনের পাশে লেখা দেখান")), ...uiTextFields("header_cart")] };
const headerAccount: BlockFieldSchema = { type: "header_account", thumb: "newsletter-bar", fields: [bool("showLabel", L("Show text beside the icon (Sign in / Account)", "আইকনের পাশে লেখা দেখান (Sign in / Account)")), ...uiTextFields("header_account")] };

const bottomBar: BlockFieldSchema = {
  type: "bottom_bar", thumb: "newsletter-bar", summary: ["items.length"],
  fields: [
    list("items", L("Buttons", "বাটন"), [
      hidden("id"),
      icon("icon", T.icon),
      text("label", T.label),
      sel("action", L("What it does", "কী করবে"), opts(["home", "Home page", "হোম পেজ"], ["shop", "Shop page", "শপ পেজ"], ["categories", "Categories sheet", "ক্যাটাগরি শিট"], ["search", "Product search", "পণ্য সার্চ"], ["cart", "Cart (with count)", "কার্ট (সংখ্যাসহ)"], ["account", "Customer account", "গ্রাহক অ্যাকাউন্ট"], ["whatsapp", "WhatsApp chat", "হোয়াটসঅ্যাপ চ্যাট"], ["call", "Phone call", "ফোন কল"], ["email", "Email", "ইমেইল"], ["link", "Custom link", "নিজের লিংক"])),
      text("url", L("Link, number or email (empty = your contact details)", "লিংক, নম্বর বা ইমেইল (খালি = আপনার যোগাযোগের তথ্য)"), { showWhen: { field: "action", in: ["link", "home", "shop", "account", "whatsapp", "call", "email"] } }),
      text("text", L("WhatsApp message", "হোয়াটসঅ্যাপ বার্তা"), { showWhen: { field: "action", in: ["whatsapp"] } }),
      bool("hidden", L("Hidden", "লুকানো"), { group: "advanced" }),
    ], { icon: "Link", label: "", action: "link", url: "/" }, ["label", "action"]),
    text("categoriesTitle", L("Categories sheet title", "ক্যাটাগরি শিটের শিরোনাম"), { placeholder: L("Shop by category", "Shop by category") }),
    text("allProductsLabel", L("Categories sheet: last tile", "ক্যাটাগরি শিট: শেষ টাইল"), { placeholder: L("All products", "All products") }),
    text("searchTitle", L("Search sheet title", "সার্চ শিটের শিরোনাম"), { placeholder: L("Search", "Search") }),
    text("searchPlaceholder", L("Text inside the search box", "সার্চ বক্সের ভেতরের লেখা"), { placeholder: L("Search products", "Search products") }),
    sel("display", L("Show on", "দেখাবে"), opts(["mobile", "Phones only", "শুধু ফোনে"], ["tablet", "Phones and tablets", "ফোন ও ট্যাবলেটে"], ["all", "Everywhere", "সব জায়গায়"]), { group: "style" }),
    sel("style", T.style, opts(["flat", "Flat", "সমতল"], ["floating", "Floating", "ভাসমান"]), { group: "style" }),
    bool("showLabels", L("Show labels", "লেবেল দেখান"), { group: "style" }),
    bool("borderTop", L("Top border", "উপরে বর্ডার"), { group: "advanced" }),
    bool("shadow", L("Shadow", "ছায়া"), { group: "advanced" }),
    bool("activePill", L("Highlight the current page", "বর্তমান পেজ হাইলাইট"), { group: "advanced" }),
    bool("hideFloatingButtons", L("Hide floating call buttons", "ভাসমান কল বাটন লুকান"), { group: "advanced" }),
    num("iconSize", L("Icon size", "আইকনের আকার"), { unit: "px", min: 16, max: 32, step: 1, group: "advanced" }),
    num("labelSize", L("Label size", "লেবেলের আকার"), { unit: "px", min: 9, max: 14, step: 1, group: "advanced" }),
    num("height", L("Bar height", "বারের উচ্চতা"), { unit: "px", min: 48, max: 96, step: 4, group: "advanced" }),
    hidden("desktopStyle"), hidden("searchTypes"),
  ],
  custom: true,
};

const ecommerceProducts: BlockFieldSchema = {
  type: "ecommerce_products", thumb: "cards-6", summary: ["title"],
  fields: [
    ...titleBlock(),
    num("displayCount", L("How many products", "কয়টি পণ্য"), { min: 1, max: 48, step: 1, unit: "items" }),
    sel("sortBy", L("Order", "ক্রম"), opts(["featured", "Featured first", "ফিচার্ড আগে"], ["latest", "Newest first", "নতুন আগে"], ["price_asc", "Price: low to high", "দাম: কম থেকে বেশি"], ["price_desc", "Price: high to low", "দাম: বেশি থেকে কম"])),
    text("ctaLabel", L("\"View all\" button text", "\"সব দেখুন\" বাটনের লেখা"), { group: "advanced" }),
    link("ctaUrl", L("\"View all\" goes to", "\"সব দেখুন\" যেখানে যাবে"), { group: "advanced" }),
    sel("layout", T.layout, opts(["grid", "Grid", "গ্রিড"], ["list", "List", "তালিকা"], ["featured", "Featured", "ফিচার্ড"], ["minimal", "Minimal", "সাধারণ"], ["wide-cards", "Wide cards", "চওড়া কার্ড"], ["carousel", "Slideshow", "স্লাইডশো"]), { group: "style" }),
    sel("columns", T.columns, columnsOpts([2, 3, 4, 5]), { group: "style" }),
    sel("cardStyle", L("Card style", "কার্ডের ধরন"), opts(["default", "Default", "ডিফল্ট"], ["flat", "Flat", "সমতল"], ["minimal", "Minimal", "সাধারণ"], ["shadow", "Shadow", "ছায়া"], ["bordered", "Outlined", "বর্ডার"], ["boutique", "Boutique", "বুটিক"], ["retail", "Retail", "রিটেইল"]), { group: "style" }),
    sel("imageRatio", L("Photo shape", "ছবির আকার"), opts(["square", "Square", "বর্গ"], ["portrait", "Portrait", "লম্বা"], ["landscape", "Landscape", "চওড়া"], ["auto", "As uploaded", "যেমন আছে"]), { group: "style" }),
    sel("sectionPadding", L("Section spacing", "সেকশনের ফাঁকা"), opts(["none", "None", "নেই"], ["sm", "Small", "ছোট"], ["md", "Normal", "সাধারণ"], ["lg", "Large", "বড়"], ["xl", "Extra large", "আরও বড়"]), { group: "style" }),
    { key: "titleAlignment", type: "align", label: L("Title alignment", "শিরোনামের সারিবদ্ধ"), options: alignOpts, group: "style" },
    bool("showAddToCart", L("Show \"Add to cart\"", "\"কার্টে যোগ\" দেখান"), { group: "style" }),
    bool("showDescription", L("Show description", "বিবরণ দেখান"), { group: "style" }),
    bool("showBadges", L("Show badges", "ব্যাজ দেখান"), { group: "style" }),
    bool("showVariantPicker", L("Size buttons on cards (Retail, Boutique)", "কার্ডে সাইজ বাটন (রিটেইল, বুটিক)"), { group: "style" }),
    sel("showAs", L("Show", "দেখাবে"), opts(["products", "Products", "পণ্য"], ["categories", "Categories as photo tiles", "ক্যাটাগরি ছবির টাইল"])),
    text("categoryButtonLabel", L("Button on category tiles ('-' hides it)", "ক্যাটাগরি টাইলের বাটন ('-' দিলে লুকাবে)"), { placeholder: L("Shop now", "Shop now"), showWhen: { field: "showAs", in: ["categories"] } }),
    // Never rendered (no rating on product cards); kept so saved blocks stay valid.
    hidden("showRating"),
    ...uiTextFields("ecommerce_products"),
  ],
  custom: true,
};

const booking: BlockFieldSchema = {
  type: "booking", thumb: "form-split", summary: ["title"],
  fields: [
    ...titleBlock(),
    text("submitLabel", L("Button text", "বাটনের লেখা"), { placeholder: L("Book Appointment", "Book Appointment") }),
    num("daysToShow", L("Days to offer", "কত দিন দেখাবে"), { min: 3, max: 60, step: 1 }),
    // The form always asks for a phone (it can be the only contact given), so this toggle never did anything.
    hidden("showPhone"),
    bool("showMessage", L("Ask for a message", "বার্তা চাইবে")),
    color("accentColor", T.accent),
    ...uiTextFields("booking"),
  ],
};

/* ------------------------------------------------------ module blocks */
// Full schemas for module blocks (real estate, results, blood donors,
// marketplace, visa, accounting, platform pricing, media extras). Every key
// of the default data is listed, so none of these are `custom` any more.

const accentField = color("accentColor", T.accent);
const eyebrowField = text("eyebrow", T.eyebrow);
const head = (withSubtitle = true, withEyebrow = false): Field[] => [
  ...(withEyebrow ? [eyebrowField] : []),
  text("title", T.title),
  ...(withSubtitle ? [text("subtitle", T.subtitle)] : []),
];
const howMany = (max: number, extra: Partial<Field> = {}) => num("limit", L("How many to show", "কয়টি দেখাবে"), { min: 1, max, step: 1, unit: "items", ...extra });
const featuredOnly = bool("featuredOnly", L("Only featured ones", "শুধু ফিচার্ডগুলো"));
const toneOpts = opts(["dark", "Dark", "গাঢ়"], ["light", "Light", "হালকা"]);
const listingTypeOpts = opts(["sale", "For sale", "বিক্রি"], ["rent", "For rent", "ভাড়া"], ["offplan", "Off-plan", "নির্মাণাধীন"]);
const formFields = (): Field[] => [
  text("submitLabel", T.submitLabel),
  area("successMessage", T.successMessage, { placeholder: L("Optional", "ঐচ্ছিক") }),
];

const accountingFeed: BlockFieldSchema = {
  type: "accounting_feed", thumb: "list-rows", summary: ["title"],
  fields: [
    text("title", T.title),
    sel("transactionType", L("Which entries", "কোন লেনদেন"), opts(["all", "All", "সব"], ["donation", "Donations", "দান"], ["sale", "Sales", "বিক্রি"], ["expense", "Expenses", "খরচ"])),
    num("displayCount", L("How many to show", "কয়টি দেখাবে"), { min: 1, max: 50, step: 1, unit: "items" }),
    bool("showAmount", L("Show amount", "পরিমাণ দেখান")),
    bool("showDate", L("Show date", "তারিখ দেখান")),
    bool("showMessage", L("Show message", "বার্তা দেখান")),
    sel("layout", T.layout, opts(["list", "List", "তালিকা"], ["ticker", "Moving ticker", "চলমান লাইন"], ["cards", "Cards", "কার্ড"]), { group: "style" }),
    ...uiTextFields("accounting_feed"),
  ],
};

// The cart block draws nothing on the page (the site's cart drawer is opened
// from the header cart icon) and nothing reads these keys, so none is offered.
const ecommerceCart: BlockFieldSchema = {
  type: "ecommerce_cart", thumb: "form-split",
  fields: [hidden("title"), hidden("showOrderSummary"), hidden("showCouponField"), hidden("layout")],
};

const pricingCatalog: BlockFieldSchema = {
  type: "pricing_catalog", thumb: "pricing-cards", summary: ["title"],
  fields: [
    ...head(true, true),
    sel("mode", L("What to show", "কী দেখাবে"), opts(["packages", "Website packages", "ওয়েবসাইট প্যাকেজ"], ["care", "Care plans", "কেয়ার প্ল্যান"], ["both", "Both", "দুটোই"])),
    sel("language", L("Language", "ভাষা"), opts(["en", "English", "ইংরেজি"], ["bn", "Bangla", "বাংলা"], ["ar", "Arabic", "আরবি"])),
    sel("defaultCurrency", L("Default currency", "ডিফল্ট মুদ্রা"), opts(["USD", "US dollar", "মার্কিন ডলার"], ["BDT", "Taka", "টাকা"])),
    text("country", L("Fixed country (code, e.g. SG)", "নির্দিষ্ট দেশ (কোড, যেমন SG)"), { group: "advanced", help: L("Empty = the visitor's country", "খালি = ভিজিটরের দেশ") }),
    bool("showCurrencyToggle", L("Show currency switch", "মুদ্রা বদলের বাটন দেখান"), { group: "advanced" }),
    bool("showBdPrompt", L("Show Bangladesh price link", "বাংলাদেশের মূল্যের লিংক দেখান")),
    link("bdPromptUrl", L("Bangladesh price link goes to", "বাংলাদেশের লিংক যেখানে যাবে"), { showWhen: { field: "showBdPrompt", in: ["true"] } }),
    link("careLinkUrl", L("Care plans link goes to", "কেয়ার প্ল্যান লিংক যেখানে যাবে")),
    link("ctaBaseUrl", L("Order buttons go to", "অর্ডার বাটন যেখানে যাবে"), { group: "advanced" }),
    text("crmLine", L("Pro and Biz features line", "Pro আর Biz-এর ফিচার লাইন"), { group: "advanced", help: L("Empty = the standard line", "খালি = সাধারণ লাইন") }),
    text("bizLine", L("Biz-only line", "শুধু Biz-এর লাইন"), { group: "advanced", help: L("Empty = the standard line", "খালি = সাধারণ লাইন") }),
    sel("tone", L("Background", "ব্যাকগ্রাউন্ড"), toneOpts, { group: "style" }),
    // Wording overrides (pricing-catalog-view.tsx); empty = the built-in text of the block's language.
    text("popularLabel", L("Badge on the popular plan", "জনপ্রিয় প্ল্যানের ব্যাজ"), { group: "advanced", placeholder: L("Most popular", "সবচেয়ে জনপ্রিয়") }),
    text("oneTimeLabel", L("Word after the build price", "বিল্ড দামের পরের শব্দ"), { group: "advanced", placeholder: L("one-time", "একবার") }),
    text("perMonthLabel", L("After monthly prices", "মাসিক দামের পরে"), { group: "advanced", placeholder: L("/month", "/মাস") }),
    text("monthlyLabel", L("Monthly switch", "মাসিক সুইচ"), { group: "advanced", placeholder: L("Monthly", "মাসিক") }),
    text("yearlyLabel", L("Yearly switch", "বাৎসরিক সুইচ"), { group: "advanced", placeholder: L("Yearly · 4 months free", "বাৎসরিক · ৪ মাস ফ্রি") }),
    text("billedMonthlyText", L("Line under monthly Care prices", "মাসিক Care দামের নিচের লাইন"), { group: "advanced", placeholder: L("billed monthly, cancel any time", "মাসে মাসে, যেকোনো সময় বন্ধ করা যাবে") }),
    list("infoCards", L("Cards under the packages", "প্যাকেজের নিচের কার্ড"), [text("title", T.title), area("text", T.text)], { title: "", text: "" }, ["title", "text"], { group: "advanced" }),
    text("careTitle", L("Care summary title", "Care সারাংশের শিরোনাম"), { group: "advanced", placeholder: L("Website Care Plans", "Care প্যাকেজ: আপনার সাইট দেখাশোনা আমাদের") }),
    area("careText", L("Care summary text", "Care সারাংশের লেখা"), { group: "advanced" }),
    text("compareLabel", L("Care summary link", "Care সারাংশের লিংক"), { group: "advanced", placeholder: L("Compare Care plans", "Care প্যাকেজ দেখুন") }),
    text("bdTitle", L("Bangladesh prompt title", "বাংলাদেশ প্রম্পটের শিরোনাম"), { group: "advanced", showWhen: { field: "showBdPrompt", in: ["true"] } }),
    area("bdText", L("Bangladesh prompt text", "বাংলাদেশ প্রম্পটের লেখা"), { group: "advanced", showWhen: { field: "showBdPrompt", in: ["true"] } }),
    text("bdButtonLabel", L("Bangladesh prompt button", "বাংলাদেশ প্রম্পটের বাটন"), { group: "advanced", placeholder: L("বাংলাদেশি প্রাইস দেখুন", "বাংলাদেশি প্রাইস দেখুন"), showWhen: { field: "showBdPrompt", in: ["true"] } }),
  ],
};

const countryGrid: BlockFieldSchema = {
  type: "country_grid", thumb: "cards-6", summary: ["title", "items.length"],
  fields: [
    ...head(true, true),
    list("items", L("Countries", "দেশ"), [
      hidden("id"),
      text("country", L("Country", "দেশ"), { required: true }),
      text("flagEmoji", L("Flag", "পতাকা")),
      img("image", T.photo),
      text("region", L("Region", "অঞ্চল")),
      { key: "visaTypes", type: "lines", label: L("Visa types", "ভিসার ধরন") },
      text("processingTime", L("Processing time", "প্রসেসিং সময়")),
      area("summary", L("Short summary", "সংক্ষিপ্ত বিবরণ")),
      link("href", T.linkTo),
    ], { country: "", flagEmoji: "", image: "", region: "", visaTypes: [], processingTime: "", summary: "", href: "" }, ["country", "region"]),
    group("allLink", L("'See all' link", "'সব দেখুন' লিংক"), [text("label", T.label), link("url", T.linkTo)]),
    list("regions", L("Region notes", "অঞ্চলের নোট"), [
      text("name", L("Region name", "অঞ্চলের নাম")),
      text("badge", L("Badge", "ব্যাজ")),
      area("description", T.description),
    ], { name: "", badge: "", description: "" }, ["name", "badge"], { group: "advanced" }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style", help: L("Cards display only", "শুধু কার্ড ডিসপ্লেতে") }),
    sel("display", T.layout, opts(["cards", "Cards", "কার্ড"], ["chips", "Compact chips by region", "অঞ্চলভিত্তিক ছোট চিপ"]), { group: "style" }),
    bool("groupByRegion", L("Group by region", "অঞ্চল অনুযায়ী ভাগ")),
    text("linkLabel", L("Link text on cards", "কার্ডের লিংকের লেখা"), { group: "advanced", placeholder: L("View details", "View details") }),
    text("otherRegionLabel", L("Heading for countries without a region", "অঞ্চল ছাড়া দেশগুলোর শিরোনাম"), { group: "advanced", placeholder: L("Other", "Other") }),
    accentField,
  ],
};

const eligibilityChecker: BlockFieldSchema = {
  type: "eligibility_checker", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(),
    list("destinations", L("Destinations to choose from", "যেসব গন্তব্য বেছে নেওয়া যাবে"), [
      hidden("id"),
      text("label", L("Shown as", "যেভাবে দেখাবে")),
      text("value", L("Saved as (short name)", "যেভাবে সেভ হবে (ছোট নাম)"), { group: "advanced" }),
    ], { label: "", value: "" }, ["label"]),
    ...formFields(),
    text("recipientEmail", L("Send answers to (email)", "উত্তর যাবে (ইমেইল)"), { group: "advanced", placeholder: L("Site email if empty", "খালি থাকলে সাইটের ইমেইল") }),
    accentField,
    ...uiTextFields("eligibility_checker"),
  ],
};

const statusTracker: BlockFieldSchema = {
  type: "status_tracker", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(),
    sel("mode", L("Tracks", "কী ট্র্যাক করবে"), opts(["visa", "Visa applications", "ভিসা আবেদন"], ["order", "Shop orders", "শপের অর্ডার"])),
    text("placeholder", L("Text inside the box", "ঘরের ভেতরের লেখা")),
    text("emailPlaceholder", L("Text inside the email box", "ইমেইল ঘরের ভেতরের লেখা"), { showWhen: { field: "mode", in: ["order"] } }),
    text("helpText", L("Help text", "সহায়ক লেখা")),
    text("submitLabel", T.buttonText),
    link("contactUrl", L("'Need help' link goes to", "'সাহায্য' লিংক যেখানে যাবে")),
    bool("plain", L("No card frame", "কার্ড ফ্রেম ছাড়া"), { group: "style" }),
    accentField,
    ...uiTextFields("status_tracker"),
  ],
};

const marketplaceForm = (type: "marketplace_booking" | "marketplace_request"): BlockFieldSchema => ({
  type, thumb: "form-split", summary: ["title"],
  fields: [...head(), text("submitLabel", T.submitLabel), accentField, ...uiTextFields(type)],
});

const vendorDirectory: BlockFieldSchema = {
  type: "marketplace_vendor_directory", thumb: "cards-6", summary: ["title"],
  fields: [
    ...head(),
    bool("showCards", L("Show provider cards", "সেবাদাতার কার্ড দেখান"), { help: L("Off = only the coverage map", "বন্ধ = শুধু এলাকার ম্যাপ") }),
    num("mapHeight", L("Map height", "ম্যাপের উচ্চতা"), { unit: "px", min: 200, max: 800, step: 20, group: "style" }),
    accentField,
    ...uiTextFields("marketplace_vendor_directory"),
  ],
};

const optionPreview: BlockFieldSchema = {
  type: "option_preview", thumb: "hero-split", summary: ["title", "options.length"],
  fields: [
    ...head(true, true),
    img("imageUrl", L("Main photo", "মূল ছবি")),
    list("options", L("Options", "অপশন"), [
      hidden("id"),
      text("label", T.name, { required: true }),
      text("sublabel", L("Small text under the name", "নামের নিচের ছোট লেখা")),
      sel("mode", L("How it shows", "কীভাবে দেখাবে"), opts(["tint", "Colour over the main photo", "মূল ছবির উপর রং"], ["image", "Its own photo", "নিজস্ব ছবি"])),
      color("color", L("Colour", "রং"), { group: "content", showWhen: { field: "mode", in: ["tint"] } }),
      num("strength", L("Colour strength", "রঙের গাঢ়ত্ব"), { unit: "%", min: 0, max: 100, step: 5, showWhen: { field: "mode", in: ["tint"] } }),
      img("imageUrl", T.photo, { showWhen: { field: "mode", in: ["image"] } }),
    ], { label: "", sublabel: "", mode: "tint", color: "#06111F", strength: 40, imageUrl: "" }, ["label", "sublabel"]),
    num("defaultIndex", L("Option selected at start (number)", "শুরুতে বাছাই করা অপশন (নম্বর)"), { min: 0, max: 20, step: 1, group: "advanced" }),
    bool("showLabel", L("Show option name on the photo", "ছবির উপর অপশনের নাম দেখান")),
    text("labelPrefix", L("Text before the name on the photo", "ছবির উপর নামের আগের লেখা"), { showWhen: { field: "showLabel", in: ["true"] } }),
    group("panel", L("Side panel", "পাশের প্যানেল"), [
      bool("show", L("Show side panel", "পাশের প্যানেল দেখান")),
      text("title", T.title),
      list("rows", L("Rows", "সারি"), [hidden("id"), text("label", T.label), text("value", L("Value", "মান"))], { label: "", value: "" }, ["label", "value"]),
      area("text", T.text),
      text("buttonLabel", T.buttonText),
      link("buttonUrl", T.buttonGoesTo),
      bool("whatsapp", L("WhatsApp button", "হোয়াটসঅ্যাপ বাটন")),
      text("whatsappText", L("WhatsApp message", "হোয়াটসঅ্যাপ বার্তা")),
    ]),
    sel("tone", L("Background", "ব্যাকগ্রাউন্ড"), toneOpts, { group: "style" }),
    group("colors", L("Colours", "রং"), [color("dark", L("Dark colour", "গাঢ় রং")), color("accent", T.accent)], { group: "style" }),
  ],
};

const scrollStory: BlockFieldSchema = {
  type: "scroll_story", thumb: "hero-fullscreen", summary: ["scenes.length"],
  fields: [
    list("scenes", L("Scenes", "দৃশ্য"), [
      text("eyebrow", T.eyebrow),
      text("title", L("Headline", "মূল শিরোনাম"), { required: true }),
      area("text", T.text),
      sel("side", L("Text side", "লেখার পাশ"), opts(["left", "Left", "বাম"], ["right", "Right", "ডান"])),
      { key: "rotateWords", type: "lines", label: L("Changing words in the headline", "শিরোনামে বদলানো শব্দ"), group: "advanced" },
      sel("vAlign", L("Text position", "লেখার অবস্থান"), opts(["middle", "Middle", "মাঝে"], ["top", "Top", "উপরে"]), { group: "advanced" }),
    ], { eyebrow: "", title: "", text: "", side: "left" }, ["title", "eyebrow"]),
    list("backgrounds", L("Background photos", "ব্যাকগ্রাউন্ড ছবি"), [img("imageUrl", T.photo)], { imageUrl: "" }, []),
    img("portraitImage", L("Cut-out portrait (transparent)", "কাটআউট ছবি (স্বচ্ছ)")),
    text("portraitAlt", T.photoAlt, { group: "advanced" }),
    sel("portraitSide", L("Portrait position", "ছবির অবস্থান"), opts(["left", "Left", "বাম"], ["center", "Centre", "মাঝে"], ["right", "Right", "ডান"])),
    buttonField("primaryCta", T.button),
    buttonField("secondaryCta", T.button2),
    sel("mode", L("Plays", "কীভাবে চলবে"), opts(["scroll", "With scrolling", "স্ক্রলের সাথে"], ["autoplay", "On its own", "নিজে নিজে"]), { group: "style" }),
    num("slideMs", L("Seconds per photo", "প্রতি ছবিতে সেকেন্ড"), { unit: "s", scale: 1000, min: 2, max: 15, step: 1, group: "style", showWhen: { field: "mode", in: ["autoplay"] } }),
    num("heightVh", L("Scroll length", "স্ক্রলের দৈর্ঘ্য"), { unit: "vh", min: 100, max: 1000, step: 50, group: "style", help: L("Longer = slower story", "বেশি = ধীর গল্প") }),
    num("overlayOpacity", L("Darken photos", "ছবি গাঢ় করুন"), { unit: "%", scale: 0.01, min: 0, max: 90, step: 5, group: "style" }),
    bool("showLines", L("Decorative lines", "সাজানো লাইন"), { group: "style" }),
    text("scrollLabel", L("Scroll hint text", "স্ক্রল ইঙ্গিতের লেখা"), { placeholder: L("Scroll", "Scroll") }),
    accentField,
    color("blendColor", L("Fade into colour (next section)", "যে রঙে মিলিয়ে যাবে (পরের সেকশন)")),
  ],
};

const reSearch: BlockFieldSchema = {
  type: "re_search", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(true, true),
    { key: "tabs", type: "lines", label: L("Search tabs", "সার্চ ট্যাব"), help: L("sale, rent or offplan, one per line", "sale, rent বা offplan, প্রতি লাইনে একটি"), group: "advanced" },
    link("resultsPath", L("Results page", "ফলাফলের পেজ")),
    img("backgroundImage", L("Background photo", "ব্যাকগ্রাউন্ড ছবি")),
    img("portraitImage", L("Agent photo beside the search", "সার্চের পাশে এজেন্টের ছবি")),
    text("portraitAlt", T.photoAlt, { group: "advanced" }),
    sel("portraitSide", L("Agent photo side", "এজেন্টের ছবির পাশ"), opts(["left", "Left", "বাম"], ["right", "Right", "ডান"])),
    text("portraitCaption", L("Name under the photo", "ছবির নিচের নাম")),
    text("portraitSubcaption", L("Title under the name", "নামের নিচের পদবি")),
    color("backdropColor", L("Backdrop colour", "পেছনের রং")),
    color("glowColor", L("Glow colour", "আলোর রং")),
    hidden("salePriceSteps"), hidden("rentPriceSteps"),
    ...uiTextFields("re_search"),
  ],
};

const reListings: BlockFieldSchema = {
  type: "re_listings", thumb: "cards-6", summary: ["title"],
  fields: [
    ...head(true, true),
    sel("listingType", L("Show", "দেখাবে"), [opt("", "All listings", "সব প্রপার্টি"), ...listingTypeOpts]),
    featuredOnly,
    text("communitySlug", L("Only this area (short name)", "শুধু এই এলাকা (ছোট নাম)"), { group: "advanced" }),
    text("developerSlug", L("Only this developer (short name)", "শুধু এই ডেভেলপার (ছোট নাম)"), { group: "advanced" }),
    howMany(48),
    bool("showFilters", L("Show filters", "ফিল্টার দেখান")),
    bool("syncUrl", L("Remember filters in the page link", "পেজের লিংকে ফিল্টার মনে রাখুন"), { group: "advanced" }),
    link("viewAllUrl", L("'View all' goes to", "'সব দেখুন' যেখানে যাবে")),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style" }),
    sel("cardStyle", L("Card look", "কার্ডের ধরন"), opts(["standard", "Standard", "সাধারণ"], ["editorial", "Editorial", "এডিটোরিয়াল"], ["showcase", "Showcase", "শোকেস"]), { group: "style" }),
    accentField,
    ...uiTextFields("re_listings"),
  ],
};

const reCommunities: BlockFieldSchema = {
  type: "re_communities", thumb: "cards-3", summary: ["title"],
  fields: [...head(true, true), featuredOnly, howMany(24), text("country", L("Only this country", "শুধু এই দেশ"), { group: "advanced" }), ...uiTextFields("re_communities")],
};

const reDevelopers: BlockFieldSchema = {
  type: "re_developers", thumb: "pill-list", summary: ["title"],
  fields: [...head(true, true), sel("style", T.layout, opts(["logos", "Logo wall", "লোগো দেয়াল"], ["cards", "Cards", "কার্ড"]), { group: "style" }), ...uiTextFields("re_developers")],
};

const reCalculator: BlockFieldSchema = {
  type: "re_calculator", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(true, true),
    sel("mode", L("Calculators", "ক্যালকুলেটর"), opts(["mortgage", "Mortgage", "মর্টগেজ"], ["roi", "Rental yield", "ভাড়ার আয়"], ["both", "Both", "দুটোই"])),
    text("currency", L("Currency (code)", "মুদ্রা (কোড)"), { placeholder: L("e.g. SAR", "যেমন SAR") }),
    num("defaultPrice", L("Starting price", "শুরুর দাম"), { min: 0, max: 1_000_000_000, step: 50_000 }),
    num("defaultDownPct", L("Starting down payment", "শুরুর ডাউন পেমেন্ট"), { unit: "%", min: 0, max: 100, step: 5 }),
    num("defaultRate", L("Starting interest rate", "শুরুর সুদের হার"), { unit: "%", min: 0, max: 30, step: 0.25 }),
    num("defaultYears", L("Starting loan years", "শুরুর ঋণের বছর"), { min: 1, max: 40, step: 1 }),
    ...uiTextFields("re_calculator"),
  ],
};

const reLeadForm: BlockFieldSchema = {
  type: "re_lead_form", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(),
    sel("kind", L("Request type", "অনুরোধের ধরন"), opts(["consultation", "Consultation", "পরামর্শ"], ["valuation", "Valuation", "মূল্যায়ন"], ["viewing", "Viewing", "দেখতে আসা"], ["enquiry", "Enquiry", "জিজ্ঞাসা"])),
    ...formFields(),
    bool("showBudget", L("Ask for budget", "বাজেট জানতে চাইবে")),
    img("image", T.photo),
    { key: "bullets", type: "lines", label: L("Bullet points", "পয়েন্ট") },
    ...uiTextFields("re_lead_form"),
  ],
};

const resultsSearch: BlockFieldSchema = {
  type: "results_search", thumb: "form-split", summary: ["title"],
  fields: [
    ...head(true, true),
    text("placeholder", L("Text inside the box", "ঘরের ভেতরের লেখা")),
    text("buttonLabel", T.buttonText),
    bool("showPrint", L("Show print button", "প্রিন্ট বাটন দেখান")),
    { key: "notes", type: "lines", label: L("Short notes under the form", "ফর্মের নিচের ছোট নোট") },
    sel("layout", T.layout, opts(["card", "Card in the middle", "মাঝখানে কার্ড"], ["banner", "Full-width band", "পুরো চওড়া ব্যান্ড"], ["split", "Text and photo beside", "পাশে লেখা ও ছবি"]), { group: "style" }),
    img("backgroundImage", L("Background photo", "ব্যাকগ্রাউন্ড ছবি"), { group: "style" }),
    img("sideImage", L("Side photo", "পাশের ছবি"), { group: "style", showWhen: { field: "layout", in: ["split"] } }),
    accentField,
    ...uiTextFields("results_search"),
  ],
};

const resultsCourses: BlockFieldSchema = {
  type: "results_courses", thumb: "cards-3", summary: ["title"],
  fields: [
    ...head(true, true),
    featuredOnly,
    howMany(48),
    text("linkLabel", L("Link text", "লিংকের লেখা")),
    sel("style", T.layout, opts(["cards", "Photo cards", "ছবির কার্ড"], ["list", "Compact list", "ছোট তালিকা"]), { group: "style" }),
    sel("columns", T.columns, columnsOpts([2, 3, 4]), { group: "style" }),
    accentField,
    ...uiTextFields("results_courses"),
  ],
};

const resultsAlumni: BlockFieldSchema = {
  type: "results_alumni", thumb: "avatar-grid", summary: ["title"],
  fields: [...head(true, true), howMany(24), sel("columns", T.columns, columnsOpts([3, 4]), { group: "style" }), accentField, ...uiTextFields("results_alumni")],
};

const donorGroupCards: BlockFieldSchema = {
  type: "donor_group_cards", thumb: "colored-tiles", summary: ["title"],
  fields: [...head(), link("linkTarget", L("Cards open", "কার্ড যেখানে নেবে"), { group: "advanced" }), accentField, ...uiTextFields("donor_group_cards")],
};

const donorMap: BlockFieldSchema = {
  type: "donor_map", thumb: "hero-fullscreen", summary: ["title"],
  fields: [...head(), num("height", L("Map height", "ম্যাপের উচ্চতা"), { unit: "px", min: 240, max: 800, step: 20, group: "style" }), ...uiTextFields("donor_map")],
};

const donorList: BlockFieldSchema = {
  type: "donor_list", thumb: "list-rows", summary: ["title"],
  fields: [
    text("title", T.title),
    bool("showAddButton", L("Show 'Add donor' button", "'ডোনার যোগ' বাটন দেখান")),
    text("addButtonLabel", L("'Add donor' button text", "'ডোনার যোগ' বাটনের লেখা"), { showWhen: { field: "showAddButton", in: ["true"] } }),
    bool("showFilters", L("Show filters", "ফিল্টার দেখান")),
    accentField,
    ...uiTextFields("donor_list"),
  ],
};

const donorRequests: BlockFieldSchema = { type: "donor_requests", thumb: "list-rows", summary: ["title"], fields: [...head(), ...uiTextFields("donor_requests")] };

const codeBlock: BlockFieldSchema = {
  type: "code", thumb: "two-col", summary: ["title", "tabs.length"],
  fields: [
    ...titleBlock(true, true),
    list("steps", L("Numbered steps", "নম্বর দেওয়া ধাপ"), [hidden("id"), text("title", T.title), area("description", T.description)], { title: "", description: "" }, ["title", "description"]),
    list("tabs", L("Windows (tabs)", "উইন্ডো (ট্যাব)"), [
      hidden("id"),
      text("label", L("Tab name", "ট্যাবের নাম"), { placeholder: L("Terminal", "Terminal") }),
      sel("kind", L("Kind", "ধরন"), opts(["terminal", "Terminal (lines starting with $ are commands)", "টার্মিনাল ($ দিয়ে শুরু লাইন কমান্ড)"], ["code", "File (copied whole)", "ফাইল (পুরোটা কপি হয়)"])),
      area("code", L("Text", "লেখা")),
    ], { label: "Terminal", kind: "terminal", code: "$ " }, ["label"]),
    buttonField("primaryButton", T.button),
    buttonField("secondaryButton", T.button2),
    text("note", L("Small line under the window", "উইন্ডোর নিচের ছোট লেখা")),
    sel("layout", T.layout, opts(["split", "Steps beside the window", "ধাপ উইন্ডোর পাশে"], ["stacked", "Heading above the window", "শিরোনাম উইন্ডোর উপরে"]), { group: "style" }),
    text("copyLabel", L("Copy button text", "কপি বাটনের লেখা"), { group: "advanced", placeholder: L("Copy", "কপি") }),
    text("copiedLabel", L("Text after copying", "কপির পরের লেখা"), { group: "advanced", placeholder: L("Copied", "কপি হয়েছে") }),
  ],
};

const mediaTabs: BlockFieldSchema = {
  type: "media_tabs", thumb: "hero-split", summary: ["title", "items.length"],
  fields: [
    ...titleBlock(true, true),
    list("items", T.items, [
      hidden("id"),
      icon("icon", T.icon),
      text("title", T.title),
      area("description", T.description),
      img("imageUrl", L("Screenshot", "স্ক্রিনশট")),
      text("imageAlt", T.photoAlt, { group: "advanced" }),
      text("frameUrl", L("Address in the window bar", "উইন্ডো বারের ঠিকানা"), { placeholder: L("yoursite.com/dashboard", "yoursite.com/dashboard") }),
    ], { icon: "Star", title: "", description: "", imageUrl: "", imageAlt: "", frameUrl: "" }, ["title", "description"]),
    buttonField("primaryButton", T.button),
    sel("layout", T.layout, opts(["side", "List beside the picture", "ছবির পাশে তালিকা"], ["top", "Tabs above the picture", "ছবির উপরে ট্যাব"]), { group: "style" }),
    sel("mediaSide", L("Picture side", "ছবির দিক"), opts(["right", "Right", "ডান"], ["left", "Left", "বাম"]), { group: "style", showWhen: { field: "layout", in: ["side"] } }),
    num("imageRatio", L("Picture shape (width divided by height)", "ছবির আকার (প্রস্থ ভাগ উচ্চতা)"), { min: 0.5, max: 3, step: 0.05, group: "style" }),
  ],
};

const sectionNav: BlockFieldSchema = {
  type: "section_nav", thumb: "pill-list", summary: ["items.length"],
  fields: [
    text("label", L("Small label before the links", "লিংকের আগের ছোট লেখা"), { placeholder: L("On this page", "এই পেজে") }),
    list("items", L("Links", "লিংক"), [
      hidden("id"),
      text("label", T.label),
      text("anchor", L("Section anchor (set on the section under Layout)", "সেকশন অ্যাঙ্কর (সেকশনের Layout-এ সেট করা)"), { placeholder: L("pricing", "pricing") }),
    ], { label: "", anchor: "" }, ["label", "anchor"]),
    buttonField("button", T.button),
    bool("sticky", L("Stay at the top while scrolling", "স্ক্রলের সময় উপরে আটকে থাকবে"), { group: "style" }),
    num("topOffset", L("Distance from the top (height of a sticky header)", "উপর থেকে দূরত্ব (আটকে থাকা হেডারের উচ্চতা)"), { unit: "px", min: 0, max: 200, step: 4, group: "style", showWhen: { field: "sticky", in: ["true"] } }),
  ],
};

export const BLOCK_FIELDS: Record<BlockType, BlockFieldSchema> = {
  hero, slider, text: textBlock, services, cards, features, cta, faq, stats, testimonials, gallery, team, pricing, contact, steps,
  timeline, video, embed, newsletter, countdown, icon_grid: iconGrid, divider, spacer, columns, container, navigation, footer,
  social_links: socialLinks, blog, item_box: itemBox, marquee, table, custom_html: customHtml, search,
  code: codeBlock, media_tabs: mediaTabs, section_nav: sectionNav,
  header_logo: headerLogo, header_nav: headerNav, header_cta: headerCta, header_booking: headerBooking, header_cart: headerCart, header_account: headerAccount,
  bottom_bar: bottomBar, ecommerce_products: ecommerceProducts, booking,

  accounting_feed: accountingFeed, ecommerce_cart: ecommerceCart,
  pricing_catalog: pricingCatalog, country_grid: countryGrid, eligibility_checker: eligibilityChecker,
  marketplace_booking: marketplaceForm("marketplace_booking"), marketplace_request: marketplaceForm("marketplace_request"),
  marketplace_vendor_directory: vendorDirectory, option_preview: optionPreview, scroll_story: scrollStory,
  re_search: reSearch, re_listings: reListings, re_communities: reCommunities, re_developers: reDevelopers, re_calculator: reCalculator, re_lead_form: reLeadForm,
  results_search: resultsSearch, results_courses: resultsCourses, results_alumni: resultsAlumni,
  donor_group_cards: donorGroupCards, donor_requests: donorRequests, donor_map: donorMap, donor_list: donorList, status_tracker: statusTracker,
};

/** Every silhouette the app can draw (variant kinds + preset kinds). Checked by the schema test. */
export const THUMB_KINDS = [
  // variant kinds (block-variants.ts)
  "split-image", "fullscreen", "centered", "gradient-left", "corporate", "cards-grid", "cards-dark", "list-rows", "numbered-list",
  "menu-list", "quote-cards", "quote-dark", "quote-wide", "quote-minimal", "stat-row", "stat-dark", "stat-gradient", "banner",
  "banner-dark", "split-cta", "price-cards", "price-dark", "price-minimal", "accordion", "two-col", "avatar-cards", "avatar-list",
  "grid-tight", "masonry", "steps-cards", "steps-timeline", "tiles", "inline-icons", "bento",
  // preset kinds (preset-thumbnail.tsx)
  "hero-split", "hero-fullscreen", "hero-centered", "cards-3", "cards-6", "pricing-cards", "stats-row", "feature-checklist",
  "steps-row", "faq-accordion", "text-center", "avatar-grid", "cta-banner", "form-split", "newsletter-bar", "countdown-bar",
  "gallery-grid", "video-embed", "slider-dots", "hero-dark-split", "hero-corporate", "bento-grid", "icon-list-cards", "timeline",
  "numbered-tiles", "team-list", "faq-grid", "gallery-clean", "colored-tiles", "pill-list", "stats-dark", "cta-split", "pricing-dark",
] as const;

/** Category fallback when a block has no thumb of its own. */
export const CATEGORY_THUMB: Record<string, (typeof THUMB_KINDS)[number]> = {
  layout: "banner", content: "two-col", media: "grid-tight", ecommerce: "cards-grid", interactive: "form-split",
};

/** Fields of a block, with the category fallback thumb when the registry type has no entry. */
export function getBlockFields(type: string): BlockFieldSchema | undefined {
  return (BLOCK_FIELDS as Record<string, BlockFieldSchema>)[type];
}

/** Keys a schema covers (recursing into groups), used by the coverage test and the app's Technical fallback. */
export function coveredKeys(fields: Field[]): Set<string> {
  return new Set(fields.map((f) => f.key));
}
