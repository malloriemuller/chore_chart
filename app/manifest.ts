import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chore Board",
    short_name: "Chore Board",
    description: "A family chore chart.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3ec",
    theme_color: "#f7f3ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
