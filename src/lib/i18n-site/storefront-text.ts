/**
 * Built-in storefront wording (buttons, shop and product page labels) for a
 * native language version of a site: /ar/products/x, /ar/shop and product
 * cards on /ar pages. Page content is the site's own translated text; this
 * is only the platform's fixed UI around it. Languages without a dictionary
 * here fall back to English.
 *
 * Shared by server and client code, so no "server-only".
 */

export type StoreText = {
  home: string; shop: string; shopTitle: string; allProducts: string; categories: string; sort: string;
  sortFeatured: string; sortLatest: string; sortPriceAsc: string; sortPriceDesc: string;
  resultsFor: (q: string) => string; productCount: (n: number) => string;
  showingAll: (n: number) => string; showingRange: (a: number, b: number, n: number) => string;
  noProducts: string; noMatch: string; searchProducts: string; search: string; nextPage: string;
  defaultSorting: string; sortBy: (label: string) => string; sortProducts: string; previous: string; next: string; pageOf: (a: number, b: number) => string;
  tryDifferent: string; viewAll: string;
  addToCart: string; add: string; soldOut: string; outOfStock: string; chooseSize: string; chooseSizeFirst: string;
  chooseOptions: string; selectOptions: string; chooseOptionFirst: string; sale: string; saleTag: string; percentOff: (n: number) => string; bestSeller: string;
  addedToCart: (name: string) => string; viewCart: string;
  description: string; details: string; video: string; shipping: string; reviews: string;
  outOf5: (avg: string) => string; verifiedBuyer: string; noReviews: string; noImage: string;
  relatedProducts: string; sku: string; size: string; quantity: string; decrease: string; increase: string;
  notifyMe: string; notifyDone: string; soldOutNotify: string; chooseOption: (name: string) => string; soldOutSuffix: string; optionName: (name: string) => string; yourEmail: string; couldNotSave: string;
  writeReview: string; yourName: string; emailNotShown: string; reviewPrompt: string; submitReview: string; sending: string;
  reviewThanks: string; chooseRating: string; addPhotos: string; removePhoto: string; uploadFailed: string; reviewFailed: string; stars: (n: number) => string;
  saveWishlist: string; removeWishlist: string; savedWishlist: string; removedWishlist: string;
};

const en: StoreText = {
  home: "Home", shop: "Shop", shopTitle: "Shop all products", allProducts: "All products", categories: "Categories", sort: "Sort",
  sortFeatured: "Featured", sortLatest: "Latest", sortPriceAsc: "Price: low to high", sortPriceDesc: "Price: high to low",
  resultsFor: (q) => `Results for “${q}”`, productCount: (n) => `${n} product${n === 1 ? "" : "s"}`,
  showingAll: (n) => `Showing all ${n} results`, showingRange: (a, b, n) => `Showing ${a}–${b} of ${n} results`,
  noProducts: "No products found", noMatch: "No products were found matching your selection.", searchProducts: "Search products", search: "Search", nextPage: "Next page",
  defaultSorting: "Default sorting", sortBy: (l) => `Sort by ${l.toLowerCase()}`, sortProducts: "Sort products", previous: "Previous", next: "Next", pageOf: (a, b) => `Page ${a} of ${b}`,
  tryDifferent: "Try a different search or browse all products.", viewAll: "View all products",
  addToCart: "Add to cart", add: "Add", soldOut: "Sold out", outOfStock: "Out of stock", chooseSize: "Choose size", chooseSizeFirst: "Choose a size first",
  chooseOptions: "Choose options", selectOptions: "Select options", chooseOptionFirst: "Please choose an option first", sale: "Sale!", saleTag: "SALE", percentOff: (n) => `${n}% OFF`, bestSeller: "Best Seller",
  addedToCart: (name) => `${name} added to cart`, viewCart: "View Cart",
  description: "Description", details: "Details", video: "Video", shipping: "Shipping and Delivery", reviews: "Reviews",
  outOf5: (avg) => `${avg} out of 5`, verifiedBuyer: "Verified buyer", noReviews: "No reviews yet. Be the first to share yours.", noImage: "No image",
  relatedProducts: "Related products", sku: "SKU", size: "Size", quantity: "Quantity", decrease: "Decrease quantity", increase: "Increase quantity",
  notifyMe: "Notify me", notifyDone: "We will email you when it is back in stock.", soldOutNotify: "Sold out. Get an email when it is back:",
  chooseOption: (name) => `Choose ${name.toLowerCase()}`, soldOutSuffix: " (sold out)", optionName: (name) => name, yourEmail: "Your email", couldNotSave: "Could not save",
  writeReview: "Write a review", yourName: "Your name", emailNotShown: "Email (not shown)", reviewPrompt: "What did you think of it?", submitReview: "Submit review", sending: "Sending…",
  reviewThanks: "Thank you. Your review will appear once the store has checked it.", chooseRating: "Choose a star rating", addPhotos: "Add photo", removePhoto: "Remove photo",
  uploadFailed: "Upload failed", reviewFailed: "Could not send your review", stars: (n) => `${n} stars`,
  saveWishlist: "Save to wishlist", removeWishlist: "Remove from wishlist", savedWishlist: "Saved to wishlist", removedWishlist: "Removed from wishlist",
};

/** Common option type names (products.attributes.options) in Arabic. */
const AR_OPTION: Record<string, string> = { size: "الحجم", colour: "اللون", color: "اللون", scent: "الرائحة", type: "النوع", weight: "الوزن", pack: "العبوة" };

const ar: StoreText = {
  home: "الرئيسية", shop: "المتجر", shopTitle: "تسوّق جميع المنتجات", allProducts: "جميع المنتجات", categories: "الفئات", sort: "ترتيب حسب",
  sortFeatured: "المميزة", sortLatest: "الأحدث", sortPriceAsc: "السعر: من الأقل إلى الأعلى", sortPriceDesc: "السعر: من الأعلى إلى الأقل",
  resultsFor: (q) => `نتائج البحث عن «${q}»`, productCount: (n) => (n === 1 ? "منتج واحد" : n === 2 ? "منتجان" : n >= 3 && n <= 10 ? `${n} منتجات` : `${n} منتج`),
  showingAll: (n) => `عرض جميع النتائج (${n})`, showingRange: (a, b, n) => `عرض ${a}–${b} من أصل ${n} نتيجة`,
  noProducts: "لا توجد منتجات", noMatch: "لم نعثر على منتجات تطابق اختيارك.", searchProducts: "ابحث عن منتج", search: "بحث", nextPage: "الصفحة التالية",
  defaultSorting: "الترتيب الافتراضي", sortBy: (l) => `ترتيب حسب ${l}`, sortProducts: "ترتيب المنتجات", previous: "السابق", next: "التالي", pageOf: (a, b) => `الصفحة ${a} من ${b}`,
  tryDifferent: "جرّب كلمة بحث أخرى أو تصفّح جميع المنتجات.", viewAll: "عرض جميع المنتجات",
  addToCart: "أضف إلى السلة", add: "أضف", soldOut: "نفدت الكمية", outOfStock: "غير متوفر", chooseSize: "اختر الحجم", chooseSizeFirst: "يرجى اختيار الحجم أولاً",
  chooseOptions: "اختر الخيارات", selectOptions: "اختر الخيارات", chooseOptionFirst: "يرجى اختيار أحد الخيارات أولاً", sale: "تخفيض", saleTag: "تخفيض", percentOff: (n) => `خصم ${n}%`, bestSeller: "الأكثر مبيعاً",
  addedToCart: (name) => `تمت إضافة ${name} إلى السلة`, viewCart: "عرض السلة",
  description: "الوصف", details: "التفاصيل", video: "فيديو", shipping: "الشحن والتوصيل", reviews: "التقييمات",
  outOf5: (avg) => `${avg} من 5`, verifiedBuyer: "مشترٍ موثّق", noReviews: "لا توجد تقييمات بعد. كن أول من يشاركنا رأيه.", noImage: "لا توجد صورة",
  relatedProducts: "قد يعجبك أيضاً", sku: "رمز المنتج", size: "الحجم", quantity: "الكمية", decrease: "إنقاص الكمية", increase: "زيادة الكمية",
  notifyMe: "أعلمني عند التوفر", notifyDone: "سنراسلك عبر البريد الإلكتروني فور توفره من جديد.", soldOutNotify: "نفدت الكمية. اترك بريدك الإلكتروني ليصلك إشعار فور توفره:",
  chooseOption: (name) => `اختر ${AR_OPTION[name.toLowerCase()] ?? name}`, soldOutSuffix: " (نفدت الكمية)", optionName: (name) => AR_OPTION[name.toLowerCase()] ?? name, yourEmail: "بريدك الإلكتروني", couldNotSave: "تعذّر الحفظ",
  writeReview: "اكتب تقييمك", yourName: "اسمك", emailNotShown: "البريد الإلكتروني (لن يُعرض)", reviewPrompt: "ما رأيك في المنتج؟", submitReview: "إرسال التقييم", sending: "جارٍ الإرسال…",
  reviewThanks: "شكراً لك. سيظهر تقييمك بعد مراجعته من المتجر.", chooseRating: "يرجى اختيار عدد النجوم", addPhotos: "أضف صورة", removePhoto: "حذف الصورة",
  uploadFailed: "تعذّر رفع الصورة", reviewFailed: "تعذّر إرسال تقييمك", stars: (n) => (n === 1 ? "نجمة واحدة" : n === 2 ? "نجمتان" : `${n} نجوم`),
  saveWishlist: "أضف إلى المفضلة", removeWishlist: "إزالة من المفضلة", savedWishlist: "تمت الإضافة إلى المفضلة", removedWishlist: "تمت الإزالة من المفضلة",
};

const DICTS: Record<string, StoreText> = { en, ar };

/** Language codes a site can publish versions in (/<code>/...). */
export const SITE_LANG_CODES = new Set([
  "en", "ar", "bn", "hi", "ur", "fr", "es", "de", "it", "pt", "ru", "tr", "fa", "zh", "ja", "ko", "ms", "id", "th", "vi",
  "nl", "tl", "ta", "ml", "ne", "si", "sw", "he", "pl", "uk",
]);
export const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

/** Storefront wording for a language (null/unknown = English). */
export function storeText(lang?: string | null): StoreText {
  return DICTS[(lang ?? "en").toLowerCase().split("-")[0]] ?? en;
}

/** The language a /<code>/... path is in, or null for the main language. */
export function langOfPath(pathname: string | null | undefined): string | null {
  const first = (pathname ?? "/").split("/")[1]?.toLowerCase() ?? "";
  return SITE_LANG_CODES.has(first) ? first : null;
}

/** "/shop?x" in a language version: "/ar/shop?x". The main language keeps the path. */
export function langPath(lang: string | null | undefined, path: string): string {
  if (!lang) return path;
  return path === "/" ? `/${lang}` : `/${lang}${path}`;
}
