import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CERMADSAPP - Plataforma de Gestión Empresarial",
    short_name: "CERMADSAPP",
    description:
      "Aplicación de gestión empresarial para CERMAD S.A., optimizando operaciones y mejorando la eficiencia en la industria de materiales de construcción.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/pwa-64x64.png",
        sizes: "64x64",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
