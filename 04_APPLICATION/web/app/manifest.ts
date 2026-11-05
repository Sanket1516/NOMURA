import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VAAKYA - AI Financial Guardian",
    short_name: "VAAKYA",
    description: "Learn, plan, protect and grow your money with four AI agents.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#0b6b57",
    lang: "en-IN",
    categories: ["finance", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Ask VAAKYA", url: "/assistant" },
      { name: "Check a scam", url: "/shield" },
      { name: "Voice", url: "/voice" },
    ],
  };
}
