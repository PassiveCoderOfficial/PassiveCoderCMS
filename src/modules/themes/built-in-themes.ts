export type BuiltInTheme = {
  slug: string;
  name: string;
  description: string;
  author: string;
  version: string;
  thumbnail?: string;
  preview_gradient: string;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
    borderRadius: string;
    containerWidth: string;
    customCss?: string;
  };
};

export const BUILT_IN_THEMES: BuiltInTheme[] = [
  {
    slug: "aurora",
    name: "Aurora",
    description: "Clean, modern theme with vibrant gradients perfect for portfolios",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    settings: {
      primaryColor: "#667eea",
      secondaryColor: "#764ba2",
      accentColor: "#f093fb",
      backgroundColor: "#ffffff",
      textColor: "#1a1a2e",
      headingFont: "Inter",
      bodyFont: "Inter",
      borderRadius: "0.75rem",
      containerWidth: "1200px",
    },
  },
  {
    slug: "minimal",
    name: "Minimal",
    description: "Ultra-clean minimalist design, perfect for professional portfolios",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)",
    settings: {
      primaryColor: "#1a1a1a",
      secondaryColor: "#4a4a4a",
      accentColor: "#f59e0b",
      backgroundColor: "#fafafa",
      textColor: "#111111",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      borderRadius: "0.25rem",
      containerWidth: "1100px",
    },
  },
  {
    slug: "ocean",
    name: "Ocean",
    description: "Cool blue tones inspired by the ocean, great for tech companies",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    settings: {
      primaryColor: "#0ea5e9",
      secondaryColor: "#0284c7",
      accentColor: "#22d3ee",
      backgroundColor: "#f0f9ff",
      textColor: "#0c4a6e",
      headingFont: "Inter",
      bodyFont: "Inter",
      borderRadius: "0.5rem",
      containerWidth: "1280px",
    },
  },
  {
    slug: "sunset",
    name: "Sunset",
    description: "Warm, energetic theme with orange and red accents",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
    settings: {
      primaryColor: "#f97316",
      secondaryColor: "#ef4444",
      accentColor: "#fbbf24",
      backgroundColor: "#fffbf5",
      textColor: "#1c1917",
      headingFont: "Poppins",
      bodyFont: "Inter",
      borderRadius: "1rem",
      containerWidth: "1200px",
    },
  },
  {
    slug: "forest",
    name: "Forest",
    description: "Natural green tones, perfect for eco-friendly brands",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    settings: {
      primaryColor: "#22c55e",
      secondaryColor: "#16a34a",
      accentColor: "#86efac",
      backgroundColor: "#f0fdf4",
      textColor: "#14532d",
      headingFont: "Inter",
      bodyFont: "Inter",
      borderRadius: "0.5rem",
      containerWidth: "1200px",
    },
  },
  {
    slug: "midnight",
    name: "Midnight",
    description: "Dark theme with electric accents for creative agencies",
    author: "CMS Studio",
    version: "1.0.0",
    preview_gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    settings: {
      primaryColor: "#818cf8",
      secondaryColor: "#6366f1",
      accentColor: "#c084fc",
      backgroundColor: "#0f0e1a",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      borderRadius: "0.75rem",
      containerWidth: "1280px",
      customCss: ":root { color-scheme: dark; }",
    },
  },
];
