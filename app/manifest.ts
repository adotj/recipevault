import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RecipeVault",
    short_name: "RecipeVault",
    description: "Personal recipes, macros, and meal planning.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#e07a5f",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
