export default function manifest() {
  return {
    name: "Deja Pan",
    short_name: "Deja Pan",
    description: "Use what you own before buying more.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f0e6",
    theme_color: "#f6f0e6",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
