import { FontItem } from "./types";

/**
 * Curated offline fallback fonts with accurate metadata and Google Fonts CDN file endpoints.
 * Used when GOOGLE_FONTS_API_KEY is not configured or when Google's API is temporarily unreachable.
 */
export const FALLBACK_GOOGLE_FONTS: FontItem[] = [
  {
    id: "inter",
    family: "Inter",
    category: "sans-serif",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin", "latin-ext", "cyrillic", "greek"],
    files: {
      regular: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2",
      "500": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff2",
      "700": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2",
    },
    provider: "google",
    version: "v18",
  },
  {
    id: "playfair-display",
    family: "Playfair Display",
    category: "serif",
    variants: ["regular", "500", "600", "700", "800", "900", "italic", "700italic"],
    subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
    files: {
      regular: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff2",
      "600": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebunDXbtM.woff2",
      "700": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDXbtM.woff2",
    },
    provider: "google",
    version: "v37",
  },
  {
    id: "space-grotesk",
    family: "Space Grotesk",
    category: "sans-serif",
    variants: ["300", "regular", "500", "600", "700"],
    subsets: ["latin", "latin-ext", "vietnamese"],
    files: {
      regular: "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj72UUkasctH.woff2",
      "500": "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUUkasctH.woff2",
      "700": "https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVUkasctH.woff2",
    },
    provider: "google",
    version: "v16",
  },
  {
    id: "fraunces",
    family: "Fraunces",
    category: "serif",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin", "latin-ext", "vietnamese"],
    files: {
      regular: "https://fonts.gstatic.com/s/fraunces/v32/6NUh8FmM-RR6neOhjbBEMv8EE5s.woff2",
      "600": "https://fonts.gstatic.com/s/fraunces/v32/6NUh8FmM-RR6neOhjbBEMv8EE5s.woff2",
    },
    provider: "google",
    version: "v32",
  },
  {
    id: "dm-serif-display",
    family: "DM Serif Display",
    category: "serif",
    variants: ["regular", "italic"],
    subsets: ["latin", "latin-ext"],
    files: {
      regular: "https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM806NUoDxFuHGwbNT4GVuV8A.woff2",
    },
    provider: "google",
    version: "v15",
  },
  {
    id: "plus-jakarta-sans",
    family: "Plus Jakarta Sans",
    category: "sans-serif",
    variants: ["200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "vietnamese"],
    files: {
      regular: "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2",
      "600": "https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2",
    },
    provider: "google",
    version: "v8",
  },
  {
    id: "outfit",
    family: "Outfit",
    category: "sans-serif",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800", "900"],
    subsets: ["latin", "latin-ext"],
    files: {
      regular: "https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NJtEtq.woff2",
    },
    provider: "google",
    version: "v11",
  },
  {
    id: "cormorant-garamond",
    family: "Cormorant Garamond",
    category: "serif",
    variants: ["300", "regular", "500", "600", "700", "italic"],
    subsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
    files: {
      regular: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2",
    },
    provider: "google",
    version: "v16",
  },
  {
    id: "cinzel",
    family: "Cinzel",
    category: "serif",
    variants: ["regular", "500", "600", "700", "800", "900"],
    subsets: ["latin", "latin-ext"],
    files: {
      regular: "https://fonts.gstatic.com/s/cinzel/v23/8vIQ776mE3tYo3f-Gg4cm1E.woff2",
    },
    provider: "google",
    version: "v23",
  },
  {
    id: "syne",
    family: "Syne",
    category: "sans-serif",
    variants: ["regular", "500", "600", "700", "800"],
    subsets: ["latin", "latin-ext"],
    files: {
      regular: "https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVysDA-Wcuw.woff2",
      "700": "https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVysDA-Wcuw.woff2",
    },
    provider: "google",
    version: "v22",
  },
  {
    id: "libre-baskerville",
    family: "Libre Baskerville",
    category: "serif",
    variants: ["regular", "italic", "700"],
    subsets: ["latin", "latin-ext"],
    files: {
      regular: "https://fonts.gstatic.com/s/librebaskerville/v14/kmKnZq85QKW03NPO75V50WqsY7yMACn7.woff2",
      "700": "https://fonts.gstatic.com/s/librebaskerville/v14/kmKiZq85QKW03NPO75V50WqsY76FMy3zPAv3.woff2",
    },
    provider: "google",
    version: "v14",
  },
  {
    id: "jetbrains-mono",
    family: "JetBrains Mono",
    category: "monospace",
    variants: ["100", "200", "300", "regular", "500", "600", "700", "800"],
    subsets: ["latin", "latin-ext", "cyrillic", "greek"],
    files: {
      regular: "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUqiQ6.woff2",
    },
    provider: "google",
    version: "v18",
  },
];
