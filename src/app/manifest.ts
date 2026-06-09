import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kore",
    short_name: "Kore",
    description:
      "Sistema de Gestión Kore para la optimización de operaciones y mejora de la eficiencia.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/kore/logo.png",
        sizes: "64x64 192x192 512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/kore/logo.png",
        sizes: "64x64 192x192 512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
