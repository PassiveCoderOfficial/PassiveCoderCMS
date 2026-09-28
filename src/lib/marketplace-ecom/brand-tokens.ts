/**
 * Marketplace brand as shadcn theme tokens. Injected on marketplace
 * storefront pages and the Seller Centre so shared, token-styled screens
 * (cart, checkout, account, order pages, vendor portal) wear the marketplace
 * look without hardcoding colours page by page. Light-locked on purpose.
 */
export const MARKETPLACE_TOKENS_CSS = `
          :root, html.dark, html.light {
            color-scheme: light;
            --background: 0 0% 100%; --foreground: 252 42% 13%;
            --card: 0 0% 100%; --card-foreground: 252 42% 13%;
            --popover: 0 0% 100%; --popover-foreground: 252 42% 13%;
            --primary: 16 100% 56%; --primary-foreground: 0 0% 100%;
            --secondary: 20 100% 96%; --secondary-foreground: 16 100% 45%;
            --muted: 240 5% 96%; --muted-foreground: 220 9% 46%;
            --accent: 20 100% 96%; --accent-foreground: 16 100% 45%;
            --border: 220 13% 91%; --input: 220 13% 86%;
            --ring: 16 100% 56%; --radius: 0.75rem;
          }
        `;
