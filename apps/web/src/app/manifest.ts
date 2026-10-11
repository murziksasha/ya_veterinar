import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VetSync",
    short_name: "VetSync",
    description: "Clinic workspace for veterinary teams",
    start_url: "/uk",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f766e",
  };
}
